const crypto = require("crypto");
const path = require("path");
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const XLSX = require("xlsx");
const db = require("./db");
const logger = require("./logger");

const app = express();
const nestedApiRouter = express.Router();
const PORT = process.env.PORT || 45451;
const JWT_SECRET = process.env.JWT_SECRET || "pharmacy-pos-local-secret";

app.use(express.json());

// Log failures and slow requests so problems can be traced after the fact (no request bodies are logged).
app.use((req, res, next) => {
    const started = Date.now();
    res.on("finish", () => {
        if (!req.originalUrl.startsWith("/api/")) return;
        const ms = Date.now() - started;
        const meta = { method: req.method, path: req.originalUrl.split("?")[0], status: res.statusCode, ms, userId: req.user?.id, ip: getClientIp(req) };
        if (res.statusCode >= 500) logger.error("http", `${req.method} ${meta.path} -> ${res.statusCode}`, meta);
        else if (res.statusCode === 401 || res.statusCode === 403) logger.warn("http", `${req.method} ${meta.path} -> ${res.statusCode}`, meta);
        else if (ms > 3000) logger.warn("http", `Slow request: ${req.method} ${meta.path} took ${ms}ms`, meta);
    });
    next();
});

// Reversible (AES-256-GCM) copy of each account password so the super admin can look it up.
// Set PASSWORD_VAULT_KEY in the environment; without it the key is derived from JWT_SECRET.
const VAULT_KEY = crypto.scryptSync(process.env.PASSWORD_VAULT_KEY || JWT_SECRET, "shine-password-vault", 32);

function encryptPassword(plain) {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", VAULT_KEY, iv);
    const data = Buffer.concat([cipher.update(String(plain), "utf8"), cipher.final()]);
    return [iv, cipher.getAuthTag(), data].map((part) => part.toString("base64")).join(".");
}

function decryptPassword(stored) {
    if (!stored) return null;
    try {
        const [iv, tag, data] = stored.split(".").map((part) => Buffer.from(part, "base64"));
        const decipher = crypto.createDecipheriv("aes-256-gcm", VAULT_KEY, iv);
        decipher.setAuthTag(tag);
        return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
    } catch (error) {
        return null;
    }
}

// Keep the active UI fresh during local POS updates. The desktop theme is served
// from static CSS, so HTML/CSS/JS should not be held by the browser cache.
app.use((req, res, next) => {
    if (/\.(?:html|css|js)$/i.test(req.path) || req.path === "/" || req.path === "/super") {
        res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");
    }
    next();
});

// 1. Handle clean URL redirects BEFORE static files
app.get("/super.html", (_req, res) => {
    res.redirect(301, "/super");
});

// 2. Static files
app.use(express.static(path.join(__dirname, "..", "public")));
app.use("/fonts", express.static(path.join(__dirname, "..", "A Ka 06")));

function toNumber(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function todayString() {
    // Business dates are local, not UTC — toISOString() would roll the day over
    // for any host east of Greenwich before its UTC-midnight offset.
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${now.getFullYear()}-${month}-${day}`;
}

function sanitizeUser(user) {
    return {
        id: user.id,
        shopId: user.shop_id,
        fullName: user.full_name,
        username: user.username,
        role: user.role,
        isActive: Boolean(user.is_active),
        createdAt: user.created_at
    };
}

function getClientIp(req) {
    return (
        req.headers["x-forwarded-for"]?.toString().split(",")[0].trim() ||
        req.socket.remoteAddress ||
        "unknown"
    );
}

function writeAuditLog({ actorId = null, shopId = null, action, entityType, entityId = null, description, ipAddress = null }) {
    db.prepare(
        `
        INSERT INTO audit_logs (actor_id, shop_id, action, entity_type, entity_id, description, ip_address)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        `
    ).run(actorId, shopId, action, entityType, entityId ? String(entityId) : null, description, ipAddress);
}

function shopAccessError(user) {
    if (user.role === "super_admin" || !user.shop_id) {
        return null;
    }

    const shop = db.prepare("SELECT id, name, is_active FROM shops WHERE id = ?").get(user.shop_id);
    if (!shop) {
        return "This account is not linked to an active shop.";
    }
    if (!shop.is_active) {
        return `${shop.name} is currently deactivated. Contact your provider to restore access.`;
    }

    const subscription = db
        .prepare("SELECT end_date FROM subscriptions WHERE shop_id = ? ORDER BY id DESC LIMIT 1")
        .get(shop.id);
    if (subscription && subscription.end_date < todayString()) {
        return `The subscription for ${shop.name} expired on ${subscription.end_date}. Contact your provider to renew.`;
    }

    return null;
}

function authenticate(req, res, next) {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
        return res.status(401).json({ message: "Authentication required." });
    }

    try {
        const payload = jwt.verify(token, JWT_SECRET);
        const user = db
            .prepare("SELECT * FROM users WHERE id = ? AND is_active = 1")
            .get(payload.userId);

        if (!user) {
            return res.status(401).json({ message: "Session is no longer valid." });
        }

        const accessError = shopAccessError(user);
        if (accessError) {
            return res.status(403).json({ message: accessError, code: "SHOP_ACCESS_REVOKED" });
        }

        req.user = sanitizeUser(user);
        next();
    } catch (error) {
        return res.status(401).json({ message: "Invalid or expired session." });
    }
}

function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ message: "You do not have permission for this action." });
        }
        next();
    };
}

function requireSuperAdmin(req, res, next) {
    if (!req.user || req.user.role !== "super_admin") {
        return res.status(403).json({ message: "Super admin access required." });
    }
    next();
}

function getShopId(req) {
    return req.user.role === "super_admin" ? (req.query.shopId || req.body.shopId) : req.user.shopId;
}

function mapProduct(row) {
    const status = row.expiry_date < todayString() ? "expired" : row.quantity <= row.low_stock_threshold ? "low" : "good";
    return {
        id: row.id,
        shopId: row.shop_id,
        code: row.code,
        barcode: row.barcode || "",
        brand: row.brand || "",
        name: row.name,
        category: row.category || "",
        expiryDate: row.expiry_date,
        costPrice: row.cost_price,
        sellPrice: row.sell_price,
        quantity: row.quantity,
        lowStockThreshold: row.low_stock_threshold,
        status,
        createdAt: row.created_at,
        updatedAt: row.updated_at
    };
}

function getProducts(shopId, search = "") {
    const trimmed = search.trim();

    if (!trimmed) {
        const rows = db
            .prepare("SELECT * FROM products WHERE shop_id = ? AND is_active = 1 ORDER BY name ASC")
            .all(shopId);
        return rows.map(mapProduct);
    }

    const like = `%${trimmed}%`;
    const rows = db
        .prepare(
            `
            SELECT * FROM products
            WHERE shop_id = ? AND is_active = 1
              AND (code LIKE ? OR barcode LIKE ? OR name LIKE ? OR brand LIKE ? OR category LIKE ?)
            ORDER BY name ASC
            `
        )
        .all(shopId, like, like, like, like, like);

    return rows.map(mapProduct);
}

function getSales(shopId, filter = {}) {
    const conditions = ["sales.shop_id = ?"];
    const params = [shopId];

    if (filter.date) {
        conditions.push("sale_date = ?");
        params.push(filter.date);
    }

    if (filter.month) {
        conditions.push("substr(sale_date, 1, 7) = ?");
        params.push(filter.month);
    }

    const whereClause = conditions.join(" AND ");
    const sales = db
        .prepare(
            `
            SELECT
                sales.*,
                users.full_name AS cashier_name
            FROM sales
            JOIN users ON users.id = sales.cashier_id
            WHERE ${whereClause}
            ORDER BY sales.created_at DESC, sales.id DESC
            LIMIT 200
            `
        )
        .all(...params);

    const itemStmt = db.prepare(
        `
        SELECT product_code, product_name, quantity, sell_price, line_total
        FROM sale_items
        WHERE sale_id = ?
        ORDER BY id ASC
        `
    );

    return sales.map((sale) => ({
        id: sale.id,
        invoiceNo: sale.invoice_no,
        cashierName: sale.cashier_name,
        saleDate: sale.sale_date,
        subtotal: sale.subtotal,
        discount: sale.discount,
        total: sale.total,
        profit: sale.profit,
        createdAt: sale.created_at,
        items: itemStmt.all(sale.id).map((item) => ({
            productCode: item.product_code,
            productName: item.product_name,
            quantity: item.quantity,
            sellPrice: item.sell_price,
            lineTotal: item.line_total
        }))
    }));
}

function getSaleById(shopId, saleId) {
    const sale = db
        .prepare(
            `
            SELECT
                sales.*,
                users.full_name AS cashier_name
            FROM sales
            JOIN users ON users.id = sales.cashier_id
            WHERE sales.shop_id = ? AND sales.id = ?
            `
        )
        .get(shopId, saleId);

    if (!sale) {
        return null;
    }

    const items = db
        .prepare(
            `
            SELECT product_code, product_name, quantity, cost_price, sell_price, line_total, line_profit
            FROM sale_items
            WHERE sale_id = ?
            ORDER BY id ASC
            `
        )
        .all(saleId)
        .map((item) => ({
            productCode: item.product_code,
            productName: item.product_name,
            quantity: item.quantity,
            costPrice: item.cost_price,
            sellPrice: item.sell_price,
            lineTotal: item.line_total,
            lineProfit: item.line_profit
        }));

    return {
        id: sale.id,
        invoiceNo: sale.invoice_no,
        cashierName: sale.cashier_name,
        saleDate: sale.sale_date,
        subtotal: sale.subtotal,
        discount: sale.discount,
        total: sale.total,
        profit: sale.profit,
        createdAt: sale.created_at,
        items
    };
}

function getBackupSnapshot(shopId) {
    return {
        exportedAt: new Date().toISOString(),
        shopId,
        users: db.prepare("SELECT id, full_name, username, role, is_active, created_at, updated_at FROM users WHERE shop_id = ? ORDER BY id ASC").all(shopId),
        products: db.prepare("SELECT * FROM products WHERE shop_id = ? ORDER BY id ASC").all(shopId),
        sales: db.prepare("SELECT * FROM sales WHERE shop_id = ? ORDER BY id ASC").all(shopId),
        saleItems: db.prepare("SELECT si.* FROM sale_items si JOIN sales s ON si.sale_id = s.id WHERE s.shop_id = ? ORDER BY si.id ASC").all(shopId),
        stockMovements: db.prepare("SELECT * FROM stock_movements WHERE shop_id = ? ORDER BY id ASC").all(shopId),
        auditLogs: db.prepare("SELECT * FROM audit_logs WHERE shop_id = ? ORDER BY id ASC").all(shopId)
    };
}

function getSystemBackupSnapshot() {
    return {
        exportedAt: new Date().toISOString(),
        shops: db.prepare("SELECT * FROM shops ORDER BY id ASC").all(),
        users: db.prepare("SELECT id, full_name, username, role, shop_id, is_active, created_at, updated_at FROM users ORDER BY id ASC").all(),
        products: db.prepare("SELECT * FROM products ORDER BY id ASC").all(),
        sales: db.prepare("SELECT * FROM sales ORDER BY id ASC").all(),
        saleItems: db.prepare("SELECT * FROM sale_items ORDER BY id ASC").all(),
        stockMovements: db.prepare("SELECT * FROM stock_movements ORDER BY id ASC").all(),
        subscriptions: db.prepare("SELECT * FROM subscriptions ORDER BY id ASC").all(),
        auditLogs: db.prepare("SELECT * FROM audit_logs ORDER BY id ASC").all()
    };
}

function generateInvoiceNo(shopId) {
    const compactDate = todayString().replaceAll("-", "");
    return `INV-${shopId}-${compactDate}-${Date.now().toString().slice(-6)}`;
}

function sendSaleDetails(req, res) {
    const shopId = getShopId(req);
    const saleId = Number(req.params.id);
    const sale = getSaleById(shopId, saleId);

    if (!sale) {
        return res.status(404).json({ message: "Sale not found." });
    }

    res.json({ sale });
}

function exportBackup(req, res) {
    const shopId = getShopId(req);
    const snapshot = getBackupSnapshot(shopId);

    writeAuditLog({
        actorId: req.user.id,
        shopId,
        action: "BACKUP_EXPORTED",
        entityType: "backup",
        description: `${req.user.fullName} exported system backup`,
        ipAddress: getClientIp(req)
    });

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename="shine-digital-backup-${todayString()}.json"`);
    res.send(JSON.stringify(snapshot, null, 2));
}

function exportExcel(req, res) {
    const shopId = getShopId(req);
    const snapshot = getBackupSnapshot(shopId);

    const salesRows = snapshot.sales.map((sale) => {
        const itemCount = snapshot.saleItems.filter((item) => item.sale_id === sale.id).length;
        return {
            invoice_no: sale.invoice_no,
            sale_date: sale.sale_date,
            cashier_id: sale.cashier_id,
            subtotal: sale.subtotal,
            discount: sale.discount,
            total: sale.total,
            profit: sale.profit,
            item_count: itemCount,
            created_at: sale.created_at
        };
    });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(snapshot.products), "Products");
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(salesRows), "Sales");
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(snapshot.saleItems), "SaleItems");
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(snapshot.stockMovements), "StockMoves");
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(snapshot.users), "Users");
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(snapshot.auditLogs), "AuditLogs");

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    writeAuditLog({
        actorId: req.user.id,
        shopId,
        action: "EXCEL_EXPORTED",
        entityType: "report",
        description: `${req.user.fullName} exported system data to Excel`,
        ipAddress: getClientIp(req)
    });

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="shine-digital-export-${todayString()}.xlsx"`);
    res.send(buffer);
}

// ============================================
// Auth endpoints
// ============================================
app.post("/api/auth/login", (req, res) => {
    const username = String(req.body.username || "").trim();
    const password = String(req.body.password || "");

    if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required." });
    }

    const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username);

    if (!user || !user.is_active || !bcrypt.compareSync(password, user.password_hash)) {
        writeAuditLog({
            action: "LOGIN_FAILED",
            entityType: "auth",
            description: `Failed login attempt for username "${username}"`,
            ipAddress: getClientIp(req)
        });
        return res.status(401).json({ message: "Invalid username or password." });
    }

    const accessError = shopAccessError(user);
    if (accessError) {
        writeAuditLog({
            actorId: user.id,
            shopId: user.shop_id,
            action: "LOGIN_BLOCKED",
            entityType: "auth",
            entityId: user.id,
            description: `${user.full_name} was blocked at login: ${accessError}`,
            ipAddress: getClientIp(req)
        });
        return res.status(403).json({ message: accessError });
    }

    if (!user.password_enc && user.role !== "super_admin") {
        db.prepare("UPDATE users SET password_enc = ? WHERE id = ?").run(encryptPassword(password), user.id);
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: "12h" });

    writeAuditLog({
        actorId: user.id,
        shopId: user.shop_id,
        action: "LOGIN",
        entityType: "auth",
        entityId: user.id,
        description: `${user.full_name} logged in`,
        ipAddress: getClientIp(req)
    });

    res.json({ token, user: sanitizeUser(user) });
});

app.get("/api/auth/me", authenticate, (req, res) => {
    res.json({ user: req.user });
});

app.post("/api/auth/logout", authenticate, (req, res) => {
    writeAuditLog({
        actorId: req.user.id,
        shopId: req.user.shopId,
        action: "LOGOUT",
        entityType: "auth",
        entityId: req.user.id,
        description: `${req.user.fullName} logged out`,
        ipAddress: getClientIp(req)
    });

    res.json({ message: "Logged out successfully." });
});

app.post("/api/auth/change-password", authenticate, (req, res) => {
    const currentPassword = String(req.body.currentPassword || "");
    const newPassword = String(req.body.newPassword || "");

    if (!currentPassword || !newPassword || newPassword.length < 6) {
        return res.status(400).json({ message: "Current password and a new password of at least 6 characters are required." });
    }

    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id);
    if (!user || !bcrypt.compareSync(currentPassword, user.password_hash)) {
        return res.status(400).json({ message: "Current password is incorrect." });
    }

    const passwordHash = bcrypt.hashSync(newPassword, 10);
    db.prepare(
        "UPDATE users SET password_hash = ?, password_enc = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    ).run(passwordHash, encryptPassword(newPassword), req.user.id);

    writeAuditLog({
        actorId: req.user.id,
        shopId: req.user.shopId,
        action: "PASSWORD_CHANGED",
        entityType: "user",
        entityId: req.user.id,
        description: `${req.user.fullName} changed account password`,
        ipAddress: getClientIp(req)
    });

    res.json({ message: "Password changed successfully." });
});

// ============================================
// Dashboard endpoint
// ============================================
app.get("/api/dashboard/summary", authenticate, (req, res) => {
    const shopId = getShopId(req);
    const today = todayString();
    const summary = {
        totalProducts: db.prepare("SELECT COUNT(*) AS count FROM products WHERE shop_id = ? AND is_active = 1").get(shopId).count,
        inventoryValue: db.prepare("SELECT COALESCE(SUM(cost_price * quantity), 0) AS value FROM products WHERE shop_id = ? AND is_active = 1").get(shopId).value,
        lowStockCount: db.prepare("SELECT COUNT(*) AS count FROM products WHERE shop_id = ? AND is_active = 1 AND quantity <= low_stock_threshold").get(shopId).count,
        expiredCount: db.prepare("SELECT COUNT(*) AS count FROM products WHERE shop_id = ? AND is_active = 1 AND expiry_date < ?").get(shopId, today).count,
        todaySales: db.prepare("SELECT COALESCE(SUM(total), 0) AS total FROM sales WHERE shop_id = ? AND sale_date = ?").get(shopId, today).total,
        todayProfit: db.prepare("SELECT COALESCE(SUM(profit), 0) AS total FROM sales WHERE shop_id = ? AND sale_date = ?").get(shopId, today).total
    };

    res.json(summary);
});

// ============================================
// Products endpoints
// ============================================
app.get("/api/products", authenticate, (req, res) => {
    const shopId = getShopId(req);
    res.json({ products: getProducts(shopId, String(req.query.search || "")) });
});

app.post("/api/inbound", authenticate, requireRole("admin", "super_admin"), (req, res) => {
    const shopId = getShopId(req);
    const code = String(req.body.code || "").trim().toUpperCase();
    const barcode = String(req.body.barcode || "").trim();
    const brand = String(req.body.brand || "").trim();
    const name = String(req.body.name || "").trim();
    const category = String(req.body.category || "").trim();
    const expiryDate = String(req.body.expiryDate || "").trim();
    const costPrice = toNumber(req.body.costPrice);
    const sellPrice = toNumber(req.body.sellPrice);
    const quantity = Math.max(0, Math.floor(toNumber(req.body.quantity)));
    const lowStockThreshold = Math.max(1, Math.floor(toNumber(req.body.lowStockThreshold, 10)));
    const supplierId = req.body.supplierId ? Number(req.body.supplierId) : null;

    if (!code || !name || !expiryDate || quantity <= 0) {
        return res.status(400).json({ message: "Code, name, expiry date, and quantity are required." });
    }

    if (barcode) {
        const barcodeOwner = db
            .prepare("SELECT code FROM products WHERE shop_id = ? AND barcode = ? AND code != ?")
            .get(shopId, barcode, code);
        if (barcodeOwner) {
            return res.status(400).json({ message: `Barcode already assigned to product ${barcodeOwner.code}.` });
        }
    }

    const tx = db.transaction(() => {
        const existing = db.prepare("SELECT * FROM products WHERE shop_id = ? AND code = ?").get(shopId, code);
        let productId;
        let newBalance;
        let action;
        let description;

        if (existing) {
            newBalance = existing.quantity + quantity;
            db.prepare(
                `
                UPDATE products
                SET barcode = ?, brand = ?, name = ?, category = ?, expiry_date = ?, cost_price = ?, sell_price = ?,
                    quantity = ?, low_stock_threshold = ?, is_active = 1, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
                `
            ).run(
                barcode || existing.barcode || null,
                brand,
                name,
                category || existing.category || "",
                expiryDate,
                costPrice,
                sellPrice,
                newBalance,
                lowStockThreshold,
                existing.id
            );
            productId = existing.id;
            action = "PRODUCT_STOCK_IN";
            description = `Inbound stock added to ${code} (+${quantity})`;
        } else {
            const result = db.prepare(
                `
                INSERT INTO products (
                    shop_id, code, barcode, brand, name, category, expiry_date, cost_price, sell_price, quantity, low_stock_threshold
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `
            ).run(shopId, code, barcode || null, brand, name, category, expiryDate, costPrice, sellPrice, quantity, lowStockThreshold);
            productId = result.lastInsertRowid;
            newBalance = quantity;
            action = "PRODUCT_CREATED";
            description = `New product ${code} created with opening stock ${quantity}`;
        }

        db.prepare(
            `
            INSERT INTO stock_movements (product_id, shop_id, movement_type, quantity_change, balance_after, note, actor_id)
            VALUES (?, ?, 'inbound', ?, ?, ?, ?)
            `
        ).run(productId, shopId, quantity, newBalance, "Inbound stock entry", req.user.id);

        if (supplierId) {
            const supplier = db.prepare("SELECT id FROM suppliers WHERE id = ? AND shop_id = ?").get(supplierId, shopId);
            if (supplier) {
                const dueAmount = costPrice * quantity;
                db.prepare(
                    `
                    INSERT INTO supplier_ledger (supplier_id, shop_id, entry_type, amount, note, actor_id)
                    VALUES (?, ?, 'due', ?, ?, ?)
                    `
                ).run(supplierId, shopId, dueAmount, `Stock purchase: ${name} x${quantity}`, req.user.id);
                db.prepare("UPDATE suppliers SET balance = balance + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
                    .run(dueAmount, supplierId);
            }
        }

        writeAuditLog({
            actorId: req.user.id,
            shopId,
            action,
            entityType: "product",
            entityId: productId,
            description,
            ipAddress: getClientIp(req)
        });
    });

    tx();

    res.status(201).json({ message: "Inbound stock saved successfully." });
});

app.put("/api/products/:id", authenticate, requireRole("admin", "super_admin"), (req, res) => {
    const shopId = getShopId(req);
    const productId = Number(req.params.id);
    const existing = db.prepare("SELECT * FROM products WHERE shop_id = ? AND id = ?").get(shopId, productId);

    if (!existing) {
        return res.status(404).json({ message: "Product not found." });
    }

    const code = String(req.body.code || "").trim().toUpperCase();
    const barcode = String(req.body.barcode || "").trim();
    const brand = String(req.body.brand || "").trim();
    const name = String(req.body.name || "").trim();
    const category = String(req.body.category || "").trim();
    const expiryDate = String(req.body.expiryDate || "").trim();
    const costPrice = toNumber(req.body.costPrice);
    const sellPrice = toNumber(req.body.sellPrice);
    const quantity = Math.max(0, Math.floor(toNumber(req.body.quantity)));
    const lowStockThreshold = Math.max(1, Math.floor(toNumber(req.body.lowStockThreshold, 10)));

    if (!code || !name || !expiryDate) {
        return res.status(400).json({ message: "Code, name, and expiry date are required." });
    }

    const duplicate = db.prepare("SELECT id FROM products WHERE shop_id = ? AND code = ? AND id != ?").get(shopId, code, productId);
    if (duplicate) {
        return res.status(400).json({ message: "Another product already uses this code." });
    }

    if (barcode) {
        const barcodeOwner = db
            .prepare("SELECT code FROM products WHERE shop_id = ? AND barcode = ? AND id != ?")
            .get(shopId, barcode, productId);
        if (barcodeOwner) {
            return res.status(400).json({ message: `Barcode already assigned to product ${barcodeOwner.code}.` });
        }
    }

    const quantityDifference = quantity - existing.quantity;

    const tx = db.transaction(() => {
        db.prepare(
            `
            UPDATE products
            SET code = ?, barcode = ?, brand = ?, name = ?, category = ?, expiry_date = ?, cost_price = ?,
                sell_price = ?, quantity = ?, low_stock_threshold = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            `
        ).run(code, barcode || null, brand, name, category, expiryDate, costPrice, sellPrice, quantity, lowStockThreshold, productId);

        if (quantityDifference !== 0) {
            db.prepare(
                `
                INSERT INTO stock_movements (product_id, shop_id, movement_type, quantity_change, balance_after, note, actor_id)
                VALUES (?, ?, 'adjustment', ?, ?, ?, ?)
                `
            ).run(productId, shopId, quantityDifference, quantity, "Manual stock adjustment from inventory edit", req.user.id);
        }

        writeAuditLog({
            actorId: req.user.id,
            shopId,
            action: "PRODUCT_UPDATED",
            entityType: "product",
            entityId: productId,
            description: `Product ${code} updated`,
            ipAddress: getClientIp(req)
        });
    });

    tx();

    res.json({ message: "Product updated successfully." });
});

app.delete("/api/products/:id", authenticate, requireRole("admin", "super_admin"), (req, res) => {
    const shopId = getShopId(req);
    const productId = Number(req.params.id);
    const product = db.prepare("SELECT * FROM products WHERE shop_id = ? AND id = ?").get(shopId, productId);

    if (!product) {
        return res.status(404).json({ message: "Product not found." });
    }

    const tx = db.transaction(() => {
        db.prepare(
            "UPDATE products SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
        ).run(productId);

        db.prepare(
            `
            INSERT INTO stock_movements (product_id, shop_id, movement_type, quantity_change, balance_after, note, actor_id)
            VALUES (?, ?, 'deactivate', ?, ?, ?, ?)
            `
        ).run(productId, shopId, 0, product.quantity, "Product deactivated", req.user.id);

        writeAuditLog({
            actorId: req.user.id,
            shopId,
            action: "PRODUCT_DEACTIVATED",
            entityType: "product",
            entityId: productId,
            description: `Product ${product.code} deactivated`,
            ipAddress: getClientIp(req)
        });
    });

    tx();

    res.json({ message: "Product archived successfully." });
});

// ============================================
// Sales endpoints
// ============================================
app.post("/api/sales", authenticate, (req, res) => {
    const shopId = getShopId(req);
    const items = Array.isArray(req.body.items) ? req.body.items : [];
    const discount = Math.max(0, toNumber(req.body.discount));
    const saleDate = String(req.body.saleDate || todayString()).trim();

    if (items.length === 0) {
        return res.status(400).json({ message: "At least one cart item is required." });
    }

    try {
        const tx = db.transaction(() => {
            const inventoryLookup = db.prepare(
                "SELECT * FROM products WHERE shop_id = ? AND id = ? AND is_active = 1"
            );
            const updateStock = db.prepare(
                "UPDATE products SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
            );
            const insertSale = db.prepare(
                `
                INSERT INTO sales (shop_id, invoice_no, cashier_id, sale_date, subtotal, discount, total, profit)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `
            );
            const insertSaleItem = db.prepare(
                `
                INSERT INTO sale_items (
                    sale_id, shop_id, product_id, product_code, product_name, quantity, cost_price, sell_price, line_total, line_profit
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `
            );
            const insertMovement = db.prepare(
                `
                INSERT INTO stock_movements (product_id, shop_id, movement_type, quantity_change, balance_after, note, actor_id)
                VALUES (?, ?, 'sale', ?, ?, ?, ?)
                `
            );

            let subtotal = 0;
            let profit = 0;
            const checkedItems = [];

            for (const item of items) {
                const productId = Number(item.productId);
                const requestedQty = Math.max(1, Math.floor(toNumber(item.quantity, 1)));
                const requestedPrice = Math.max(0, toNumber(item.sellPrice));
                const product = inventoryLookup.get(shopId, productId);

                if (!product) {
                    throw new Error("One or more selected products are no longer available.");
                }

                if (product.quantity < requestedQty) {
                    throw new Error(`Insufficient stock for ${product.name}.`);
                }

                const lineTotal = requestedPrice * requestedQty;
                const lineProfit = (requestedPrice - product.cost_price) * requestedQty;

                subtotal += lineTotal;
                profit += lineProfit;
                checkedItems.push({
                    product,
                    requestedQty,
                    requestedPrice,
                    lineTotal,
                    lineProfit
                });
            }

            const total = Math.max(0, subtotal - discount);
            const finalProfit = profit - discount;
            const invoiceNo = generateInvoiceNo(shopId);
            const saleResult = insertSale.run(shopId, invoiceNo, req.user.id, saleDate, subtotal, discount, total, finalProfit);
            const saleId = saleResult.lastInsertRowid;

            for (const item of checkedItems) {
                const newBalance = item.product.quantity - item.requestedQty;
                insertSaleItem.run(
                    saleId,
                    shopId,
                    item.product.id,
                    item.product.code,
                    item.product.name,
                    item.requestedQty,
                    item.product.cost_price,
                    item.requestedPrice,
                    item.lineTotal,
                    item.lineProfit
                );
                updateStock.run(newBalance, item.product.id);
                insertMovement.run(
                    item.product.id,
                    shopId,
                    -item.requestedQty,
                    newBalance,
                    `Sold via ${invoiceNo}`,
                    req.user.id
                );
            }

            writeAuditLog({
                actorId: req.user.id,
                shopId,
                action: "SALE_COMPLETED",
                entityType: "sale",
                entityId: saleId,
                description: `Sale ${invoiceNo} completed with total ${total}`,
                ipAddress: getClientIp(req)
            });

            return { saleId, invoiceNo };
        });

        const result = tx();
        res.status(201).json({ message: "Sale completed successfully.", ...result });
    } catch (error) {
        res.status(400).json({ message: error.message || "Unable to complete sale." });
    }
});

app.get("/api/sales", authenticate, (req, res) => {
    const shopId = getShopId(req);
    const date = String(req.query.date || "").trim();
    const month = String(req.query.month || "").trim();
    res.json({ sales: getSales(shopId, { date, month }) });
});

app.get("/api/sales/:id", authenticate, sendSaleDetails);

// ============================================
// Alerts endpoint
// ============================================
app.get("/api/alerts", authenticate, (req, res) => {
    const shopId = getShopId(req);
    const today = todayString();
    const lowStock = db
        .prepare(
            `
            SELECT * FROM products
            WHERE shop_id = ? AND is_active = 1 AND quantity <= low_stock_threshold
            ORDER BY quantity ASC, name ASC
            `
        )
        .all(shopId)
        .map(mapProduct);

    const expired = db
        .prepare(
            `
            SELECT * FROM products
            WHERE shop_id = ? AND is_active = 1 AND expiry_date < ?
            ORDER BY expiry_date ASC
            `
        )
        .all(shopId, today)
        .map(mapProduct);

    const expiringSoon = db
        .prepare(
            `
            SELECT * FROM products
            WHERE shop_id = ? AND is_active = 1
              AND expiry_date >= ?
              AND expiry_date <= date(?, '+90 day')
            ORDER BY expiry_date ASC
            `
        )
        .all(shopId, today, today)
        .map(mapProduct);

    res.json({ lowStock, expired, expiringSoon });
});

// ============================================
// Stock movements endpoint
// ============================================
app.get("/api/stock-movements", authenticate, requireRole("admin", "super_admin"), (req, res) => {
    const shopId = getShopId(req);
    const movements = db
        .prepare(
            `
            SELECT
                stock_movements.*,
                products.code AS product_code,
                products.name AS product_name,
                users.full_name AS actor_name
            FROM stock_movements
            JOIN products ON products.id = stock_movements.product_id
            LEFT JOIN users ON users.id = stock_movements.actor_id
            WHERE stock_movements.shop_id = ?
            ORDER BY stock_movements.created_at DESC, stock_movements.id DESC
            LIMIT 200
            `
        )
        .all(shopId)
        .map((row) => ({
            id: row.id,
            productCode: row.product_code,
            productName: row.product_name,
            movementType: row.movement_type,
            quantityChange: row.quantity_change,
            balanceAfter: row.balance_after,
            note: row.note || "",
            actorName: row.actor_name || "System",
            createdAt: row.created_at
        }));

    res.json({ movements });
});

// ============================================
// Audit logs endpoint
// ============================================
app.get("/api/audit-logs", authenticate, requireRole("admin", "super_admin"), (req, res) => {
    const shopId = getShopId(req);
    const logs = db
        .prepare(
            `
            SELECT
                audit_logs.*,
                users.full_name AS actor_name
            FROM audit_logs
            LEFT JOIN users ON users.id = audit_logs.actor_id
            WHERE audit_logs.shop_id = ? OR audit_logs.shop_id IS NULL
            ORDER BY audit_logs.created_at DESC, audit_logs.id DESC
            LIMIT 200
            `
        )
        .all(shopId)
        .map((row) => ({
            id: row.id,
            action: row.action,
            entityType: row.entity_type,
            entityId: row.entity_id,
            description: row.description,
            ipAddress: row.ip_address || "",
            actorName: row.actor_name || "Unknown",
            createdAt: row.created_at
        }));

    res.json({ logs });
});

// ============================================
// Users endpoints
// ============================================
app.get("/api/users", authenticate, requireRole("admin", "super_admin"), (req, res) => {
    const shopId = getShopId(req);
    const users = db
        .prepare(
            `
            SELECT id, full_name, username, role, is_active, created_at
            FROM users
            WHERE shop_id = ?
            ORDER BY created_at DESC, id DESC
            `
        )
        .all(shopId)
        .map((user) => ({
            id: user.id,
            fullName: user.full_name,
            username: user.username,
            role: user.role,
            isActive: Boolean(user.is_active),
            createdAt: user.created_at
        }));

    res.json({ users });
});

app.post("/api/users", authenticate, requireRole("admin", "super_admin"), (req, res) => {
    const shopId = getShopId(req);
    const fullName = String(req.body.fullName || "").trim();
    const username = String(req.body.username || "").trim();
    const password = String(req.body.password || "");
    const role = String(req.body.role || "cashier").trim();

    if (!fullName || !username || !password || !["admin", "cashier"].includes(role)) {
        return res.status(400).json({ message: "Full name, username, password, and valid role are required." });
    }

    const existing = db.prepare("SELECT id FROM users WHERE username = ?").get(username);
    if (existing) {
        return res.status(400).json({ message: "This username is already in use." });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const result = db.prepare(
        `
        INSERT INTO users (full_name, username, password_hash, password_enc, role, shop_id)
        VALUES (?, ?, ?, ?, ?, ?)
        `
    ).run(fullName, username, passwordHash, encryptPassword(password), role, shopId);

    writeAuditLog({
        actorId: req.user.id,
        shopId,
        action: "USER_CREATED",
        entityType: "user",
        entityId: result.lastInsertRowid,
        description: `User ${username} created with role ${role}`,
        ipAddress: getClientIp(req)
    });

    res.status(201).json({ message: "User created successfully." });
});

// ============================================
// Suppliers endpoints (accounts payable)
// ============================================
function sanitizeSupplier(row) {
    return {
        id: row.id,
        name: row.name,
        phone: row.phone,
        balance: row.balance,
        isActive: Boolean(row.is_active),
        createdAt: row.created_at,
        updatedAt: row.updated_at
    };
}

app.get("/api/suppliers", authenticate, requireRole("admin", "super_admin"), (req, res) => {
    const shopId = getShopId(req);
    const rows = db
        .prepare("SELECT * FROM suppliers WHERE shop_id = ? AND is_active = 1 ORDER BY name ASC")
        .all(shopId);
    res.json({ suppliers: rows.map(sanitizeSupplier) });
});

app.post("/api/suppliers", authenticate, requireRole("admin", "super_admin"), (req, res) => {
    const shopId = getShopId(req);
    const name = String(req.body.name || "").trim();
    const phone = String(req.body.phone || "").trim();

    if (!name) {
        return res.status(400).json({ message: "Supplier name is required." });
    }

    const result = db
        .prepare("INSERT INTO suppliers (shop_id, name, phone) VALUES (?, ?, ?)")
        .run(shopId, name, phone || null);

    res.status(201).json({ message: "Supplier added.", supplierId: result.lastInsertRowid });
});

app.put("/api/suppliers/:id", authenticate, requireRole("admin", "super_admin"), (req, res) => {
    const shopId = getShopId(req);
    const supplierId = Number(req.params.id);
    const name = String(req.body.name || "").trim();
    const phone = String(req.body.phone || "").trim();

    const existing = db.prepare("SELECT id FROM suppliers WHERE id = ? AND shop_id = ?").get(supplierId, shopId);
    if (!existing) {
        return res.status(404).json({ message: "Supplier not found." });
    }
    if (!name) {
        return res.status(400).json({ message: "Supplier name is required." });
    }

    db.prepare("UPDATE suppliers SET name = ?, phone = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
        .run(name, phone || null, supplierId);

    res.json({ message: "Supplier updated." });
});

app.delete("/api/suppliers/:id", authenticate, requireRole("admin", "super_admin"), (req, res) => {
    const shopId = getShopId(req);
    const supplierId = Number(req.params.id);

    const existing = db.prepare("SELECT id FROM suppliers WHERE id = ? AND shop_id = ?").get(supplierId, shopId);
    if (!existing) {
        return res.status(404).json({ message: "Supplier not found." });
    }

    db.prepare("UPDATE suppliers SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(supplierId);
    res.json({ message: "Supplier removed." });
});

app.get("/api/suppliers/:id/ledger", authenticate, requireRole("admin", "super_admin"), (req, res) => {
    const shopId = getShopId(req);
    const supplierId = Number(req.params.id);

    const supplier = db.prepare("SELECT * FROM suppliers WHERE id = ? AND shop_id = ?").get(supplierId, shopId);
    if (!supplier) {
        return res.status(404).json({ message: "Supplier not found." });
    }

    const entries = db
        .prepare(
            `
            SELECT l.*, u.full_name AS actor_name
            FROM supplier_ledger l
            LEFT JOIN users u ON u.id = l.actor_id
            WHERE l.supplier_id = ? AND l.shop_id = ?
            ORDER BY l.id DESC
            `
        )
        .all(supplierId, shopId);

    res.json({
        supplier: sanitizeSupplier(supplier),
        entries: entries.map((e) => ({
            id: e.id,
            entryType: e.entry_type,
            amount: e.amount,
            note: e.note,
            actorName: e.actor_name || "System",
            createdAt: e.created_at
        }))
    });
});

app.post("/api/suppliers/:id/ledger", authenticate, requireRole("admin", "super_admin"), (req, res) => {
    const shopId = getShopId(req);
    const supplierId = Number(req.params.id);
    const entryType = req.body.entryType === "payment" ? "payment" : "due";
    const amount = toNumber(req.body.amount);
    const note = String(req.body.note || "").trim();

    if (amount <= 0) {
        return res.status(400).json({ message: "Amount must be greater than zero." });
    }

    const supplier = db.prepare("SELECT * FROM suppliers WHERE id = ? AND shop_id = ?").get(supplierId, shopId);
    if (!supplier) {
        return res.status(404).json({ message: "Supplier not found." });
    }

    const delta = entryType === "due" ? amount : -amount;

    const tx = db.transaction(() => {
        db.prepare(
            `
            INSERT INTO supplier_ledger (supplier_id, shop_id, entry_type, amount, note, actor_id)
            VALUES (?, ?, ?, ?, ?, ?)
            `
        ).run(supplierId, shopId, entryType, amount, note || null, req.user.id);

        db.prepare("UPDATE suppliers SET balance = balance + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
            .run(delta, supplierId);
    });
    tx();

    writeAuditLog({
        actorId: req.user.id,
        shopId,
        action: entryType === "due" ? "SUPPLIER_DUE_ADDED" : "SUPPLIER_PAYMENT_RECORDED",
        entityType: "supplier",
        entityId: supplierId,
        description: `${entryType === "due" ? "Due added" : "Payment recorded"} for supplier ${supplier.name}: ${amount}`,
        ipAddress: getClientIp(req)
    });

    res.status(201).json({ message: "Ledger entry saved." });
});

// ============================================
// Customers endpoints (credit accounts)
// ============================================
function sanitizeCustomer(row) {
    return {
        id: row.id,
        name: row.name,
        phone: row.phone,
        creditBalance: row.credit_balance,
        isActive: Boolean(row.is_active),
        createdAt: row.created_at,
        updatedAt: row.updated_at
    };
}

app.get("/api/customers", authenticate, (req, res) => {
    const shopId = getShopId(req);
    const rows = db
        .prepare("SELECT * FROM customers WHERE shop_id = ? AND is_active = 1 ORDER BY name ASC")
        .all(shopId);
    res.json({ customers: rows.map(sanitizeCustomer) });
});

app.post("/api/customers", authenticate, (req, res) => {
    const shopId = getShopId(req);
    const name = String(req.body.name || "").trim();
    const phone = String(req.body.phone || "").trim();

    if (!name) {
        return res.status(400).json({ message: "Customer name is required." });
    }

    const result = db
        .prepare("INSERT INTO customers (shop_id, name, phone) VALUES (?, ?, ?)")
        .run(shopId, name, phone || null);

    res.status(201).json({ message: "Customer added.", customerId: result.lastInsertRowid });
});

app.put("/api/customers/:id", authenticate, (req, res) => {
    const shopId = getShopId(req);
    const customerId = Number(req.params.id);
    const name = String(req.body.name || "").trim();
    const phone = String(req.body.phone || "").trim();

    const existing = db.prepare("SELECT id FROM customers WHERE id = ? AND shop_id = ?").get(customerId, shopId);
    if (!existing) {
        return res.status(404).json({ message: "Customer not found." });
    }
    if (!name) {
        return res.status(400).json({ message: "Customer name is required." });
    }

    db.prepare("UPDATE customers SET name = ?, phone = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
        .run(name, phone || null, customerId);

    res.json({ message: "Customer updated." });
});

app.delete("/api/customers/:id", authenticate, requireRole("admin", "super_admin"), (req, res) => {
    const shopId = getShopId(req);
    const customerId = Number(req.params.id);

    const existing = db.prepare("SELECT id FROM customers WHERE id = ? AND shop_id = ?").get(customerId, shopId);
    if (!existing) {
        return res.status(404).json({ message: "Customer not found." });
    }

    db.prepare("UPDATE customers SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(customerId);
    res.json({ message: "Customer removed." });
});

app.get("/api/customers/:id/ledger", authenticate, (req, res) => {
    const shopId = getShopId(req);
    const customerId = Number(req.params.id);

    const customer = db.prepare("SELECT * FROM customers WHERE id = ? AND shop_id = ?").get(customerId, shopId);
    if (!customer) {
        return res.status(404).json({ message: "Customer not found." });
    }

    const entries = db
        .prepare(
            `
            SELECT l.*, u.full_name AS actor_name
            FROM customer_ledger l
            LEFT JOIN users u ON u.id = l.actor_id
            WHERE l.customer_id = ? AND l.shop_id = ?
            ORDER BY l.id DESC
            `
        )
        .all(customerId, shopId);

    res.json({
        customer: sanitizeCustomer(customer),
        entries: entries.map((e) => ({
            id: e.id,
            entryType: e.entry_type,
            amount: e.amount,
            note: e.note,
            actorName: e.actor_name || "System",
            createdAt: e.created_at
        }))
    });
});

app.post("/api/customers/:id/ledger", authenticate, (req, res) => {
    const shopId = getShopId(req);
    const customerId = Number(req.params.id);
    const entryType = req.body.entryType === "payment" ? "payment" : "credit_sale";
    const amount = toNumber(req.body.amount);
    const note = String(req.body.note || "").trim();

    if (amount <= 0) {
        return res.status(400).json({ message: "Amount must be greater than zero." });
    }

    const customer = db.prepare("SELECT * FROM customers WHERE id = ? AND shop_id = ?").get(customerId, shopId);
    if (!customer) {
        return res.status(404).json({ message: "Customer not found." });
    }

    const delta = entryType === "credit_sale" ? amount : -amount;

    const tx = db.transaction(() => {
        db.prepare(
            `
            INSERT INTO customer_ledger (customer_id, shop_id, entry_type, amount, note, actor_id)
            VALUES (?, ?, ?, ?, ?, ?)
            `
        ).run(customerId, shopId, entryType, amount, note || null, req.user.id);

        db.prepare("UPDATE customers SET credit_balance = credit_balance + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
            .run(delta, customerId);
    });
    tx();

    writeAuditLog({
        actorId: req.user.id,
        shopId,
        action: entryType === "credit_sale" ? "CUSTOMER_CREDIT_ADDED" : "CUSTOMER_PAYMENT_RECORDED",
        entityType: "customer",
        entityId: customerId,
        description: `${entryType === "credit_sale" ? "Credit sale added" : "Payment recorded"} for customer ${customer.name}: ${amount}`,
        ipAddress: getClientIp(req)
    });

    res.status(201).json({ message: "Ledger entry saved." });
});

// ============================================
// Expenses endpoints
// ============================================
app.get("/api/expenses", authenticate, requireRole("admin", "super_admin"), (req, res) => {
    const shopId = getShopId(req);
    const rows = db
        .prepare("SELECT e.*, u.full_name AS actor_name FROM expenses e LEFT JOIN users u ON u.id = e.actor_id WHERE e.shop_id = ? ORDER BY e.expense_date DESC, e.id DESC")
        .all(shopId);
    res.json({
        expenses: rows.map((e) => ({
            id: e.id,
            category: e.category,
            description: e.description,
            amount: e.amount,
            expenseDate: e.expense_date,
            actorName: e.actor_name || "System",
            createdAt: e.created_at
        }))
    });
});

app.post("/api/expenses", authenticate, requireRole("admin", "super_admin"), (req, res) => {
    const shopId = getShopId(req);
    const category = String(req.body.category || "").trim();
    const description = String(req.body.description || "").trim();
    const amount = toNumber(req.body.amount);
    const expenseDate = String(req.body.expenseDate || todayString()).trim();

    if (!category || amount <= 0) {
        return res.status(400).json({ message: "Category and a positive amount are required." });
    }

    const result = db
        .prepare(
            "INSERT INTO expenses (shop_id, category, description, amount, expense_date, actor_id) VALUES (?, ?, ?, ?, ?, ?)"
        )
        .run(shopId, category, description || null, amount, expenseDate, req.user.id);

    writeAuditLog({
        actorId: req.user.id,
        shopId,
        action: "EXPENSE_ADDED",
        entityType: "expense",
        entityId: result.lastInsertRowid,
        description: `Expense recorded: ${category} - ${amount}`,
        ipAddress: getClientIp(req)
    });

    res.status(201).json({ message: "Expense recorded." });
});

app.delete("/api/expenses/:id", authenticate, requireRole("admin", "super_admin"), (req, res) => {
    const shopId = getShopId(req);
    const expenseId = Number(req.params.id);

    const existing = db.prepare("SELECT id FROM expenses WHERE id = ? AND shop_id = ?").get(expenseId, shopId);
    if (!existing) {
        return res.status(404).json({ message: "Expense not found." });
    }

    db.prepare("DELETE FROM expenses WHERE id = ?").run(expenseId);
    res.json({ message: "Expense deleted." });
});

// ============================================
// Dashboard analytics: weekly chart + best-sellers
// ============================================
app.get("/api/dashboard/chart", authenticate, (req, res) => {
    const shopId = getShopId(req);
    const days = [];
    const now = new Date();
    for (let i = 6; i >= 0; i -= 1) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        days.push(`${d.getFullYear()}-${month}-${day}`);
    }

    const rows = db
        .prepare(
            `
            SELECT sale_date, COALESCE(SUM(total), 0) AS total
            FROM sales
            WHERE shop_id = ? AND sale_date >= ? AND sale_date <= ?
            GROUP BY sale_date
            `
        )
        .all(shopId, days[0], days[days.length - 1]);

    const totalsByDate = new Map(rows.map((r) => [r.sale_date, r.total]));
    const weeklySales = days.map((date) => ({ date, total: totalsByDate.get(date) || 0 }));

    const bestSellers = db
        .prepare(
            `
            SELECT si.product_name, SUM(si.quantity) AS qty, SUM(si.line_total) AS revenue
            FROM sale_items si
            JOIN sales s ON s.id = si.sale_id
            WHERE s.shop_id = ?
            GROUP BY si.product_name
            ORDER BY qty DESC
            LIMIT 5
            `
        )
        .all(shopId);

    res.json({
        weeklySales,
        bestSellers: bestSellers.map((b) => ({ productName: b.product_name, quantity: b.qty, revenue: b.revenue }))
    });
});

// ============================================
// Export endpoints
// ============================================
app.get("/api/export/backup", authenticate, requireRole("admin", "super_admin"), exportBackup);
app.get("/api/export/excel", authenticate, requireRole("admin", "super_admin"), exportExcel);

// ============================================
// SUPER ADMIN ENDPOINTS
// ============================================
app.get("/api/super/shops", authenticate, requireSuperAdmin, (req, res) => {
    const shops = db.prepare("SELECT * FROM shops ORDER BY created_at DESC, id DESC").all();
    const shopsWithSub = shops.map(shop => {
        const sub = db.prepare("SELECT * FROM subscriptions WHERE shop_id = ? ORDER BY id DESC LIMIT 1").get(shop.id);
        return {
            ...shop,
            subscription: sub
        };
    });
    res.json({ shops: shopsWithSub });
});

app.get("/api/super/export/:format", authenticate, requireSuperAdmin, (req, res) => {
    const snapshot = getSystemBackupSnapshot();
    const format = String(req.params.format || "");
    writeAuditLog({
        actorId: req.user.id,
        action: "SYSTEM_BACKUP_EXPORTED",
        entityType: "system_backup",
        description: `${req.user.fullName} exported a complete system backup`,
        ipAddress: getClientIp(req)
    });

    if (format === "backup") {
        res.setHeader("Content-Type", "application/json");
        res.setHeader("Content-Disposition", `attachment; filename="shine-digital-system-backup-${todayString()}.json"`);
        return res.send(JSON.stringify(snapshot, null, 2));
    }
    if (format === "excel") {
        const workbook = XLSX.utils.book_new();
        Object.entries(snapshot).filter(([key]) => key !== "exportedAt").forEach(([key, rows]) => {
            XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), key.slice(0, 31));
        });
        const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", `attachment; filename="shine-digital-system-backup-${todayString()}.xlsx"`);
        return res.send(buffer);
    }
    return res.status(404).json({ message: "Backup format not found." });
});

app.post("/api/super/shops", authenticate, requireSuperAdmin, (req, res) => {
    const name = String(req.body.name || "").trim();
    if (!name) {
        return res.status(400).json({ message: "Shop name is required." });
    }
    const duplicate = db.prepare("SELECT id FROM shops WHERE lower(name) = lower(?)").get(name);
    if (duplicate) {
        return res.status(400).json({ message: "A shop with this name already exists." });
    }
    const result = db.prepare("INSERT INTO shops (name) VALUES (?)").run(name);
    writeAuditLog({
        actorId: req.user.id,
        action: "SHOP_CREATED",
        entityType: "shop",
        entityId: result.lastInsertRowid,
        description: `Shop ${name} created`,
        ipAddress: getClientIp(req)
    });
    res.status(201).json({ message: "Shop created successfully.", shopId: result.lastInsertRowid });
});

app.put("/api/super/shops/:id", authenticate, requireSuperAdmin, (req, res) => {
    const shopId = Number(req.params.id);
    const name = String(req.body.name || "").trim();
    const isActive = req.body.isActive !== undefined ? (req.body.isActive ? 1 : 0) : undefined;
    
    if (!name && isActive === undefined) {
        return res.status(400).json({ message: "At least one field (name or isActive) is required." });
    }
    
    const existing = db.prepare("SELECT * FROM shops WHERE id = ?").get(shopId);
    if (!existing) {
        return res.status(404).json({ message: "Shop not found." });
    }
    if (name) {
        const duplicate = db.prepare("SELECT id FROM shops WHERE lower(name) = lower(?) AND id != ?").get(name, shopId);
        if (duplicate) {
            return res.status(400).json({ message: "A shop with this name already exists." });
        }
    }

    const updates = [];
    const params = [];
    if (name) {
        updates.push("name = ?");
        params.push(name);
    }
    if (isActive !== undefined) {
        updates.push("is_active = ?");
        params.push(isActive);
    }
    updates.push("updated_at = CURRENT_TIMESTAMP");
    params.push(shopId);

    db.prepare(`UPDATE shops SET ${updates.join(", ")} WHERE id = ?`).run(...params);
    
    writeAuditLog({
        actorId: req.user.id,
        action: "SHOP_UPDATED",
        entityType: "shop",
        entityId: shopId,
        description: `Shop ${name || existing.name} updated`,
        ipAddress: getClientIp(req)
    });
    res.json({ message: "Shop updated successfully." });
});

app.delete("/api/super/shops/:id", authenticate, requireSuperAdmin, (req, res) => {
    const shopId = Number(req.params.id);
    const shop = db.prepare("SELECT * FROM shops WHERE id = ?").get(shopId);
    if (!shop) {
        return res.status(404).json({ message: "Shop not found." });
    }

    // Soft delete by deactivating the shop
    db.prepare("UPDATE shops SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(shopId);

    writeAuditLog({
        actorId: req.user.id,
        action: "SHOP_DELETED",
        entityType: "shop",
        entityId: shopId,
        description: `Shop ${shop.name} deleted (deactivated)`,
        ipAddress: getClientIp(req)
    });
    res.json({ message: "Shop deleted successfully." });
});

app.get("/api/super/shops/:id/subscriptions", authenticate, requireSuperAdmin, (req, res) => {
    const shopId = Number(req.params.id);
    const subscriptions = db.prepare("SELECT * FROM subscriptions WHERE shop_id = ? ORDER BY id DESC").all(shopId);
    res.json({ subscriptions });
});

app.post("/api/super/shops/:id/subscriptions", authenticate, requireSuperAdmin, (req, res) => {
    const shopId = Number(req.params.id);
    const startDate = String(req.body.startDate || todayString()).trim();
    const endDate = String(req.body.endDate || "").trim();
    const remarks = String(req.body.remarks || "").trim();

    if (!endDate) {
        return res.status(400).json({ message: "End date is required." });
    }
    if (endDate < startDate) {
        return res.status(400).json({ message: "End date must be on or after the start date." });
    }
    if (!db.prepare("SELECT id FROM shops WHERE id = ?").get(shopId)) {
        return res.status(404).json({ message: "Shop not found." });
    }

    const result = db.prepare(
        "INSERT INTO subscriptions (shop_id, start_date, end_date, remarks) VALUES (?, ?, ?, ?)"
    ).run(shopId, startDate, endDate, remarks);
    writeAuditLog({
        actorId: req.user.id,
        action: "SUBSCRIPTION_CREATED",
        entityType: "subscription",
        entityId: result.lastInsertRowid,
        description: `Subscription added for shop ${shopId}`,
        ipAddress: getClientIp(req)
    });
    res.status(201).json({ message: "Subscription added successfully." });
});

app.get("/api/super/shops/:id/users", authenticate, requireSuperAdmin, (req, res) => {
    const shopId = Number(req.params.id);
    const users = db.prepare("SELECT * FROM users WHERE shop_id = ? ORDER BY created_at DESC").all(shopId).map(sanitizeUser);
    res.json({ users });
});

app.get("/api/super/users/:id/password", authenticate, requireSuperAdmin, (req, res) => {
    const userId = Number(req.params.id);
    const user = db.prepare("SELECT id, username, shop_id, role, password_enc FROM users WHERE id = ?").get(userId);
    if (!user || user.role === "super_admin") {
        return res.status(404).json({ message: "User not found." });
    }

    writeAuditLog({
        actorId: req.user.id,
        shopId: user.shop_id,
        action: "PASSWORD_VIEWED",
        entityType: "user",
        entityId: userId,
        description: `Super admin viewed the password of ${user.username}`,
        ipAddress: getClientIp(req)
    });
    res.json({ password: decryptPassword(user.password_enc) });
});

app.post("/api/super/shops/:id/users", authenticate, requireSuperAdmin, (req, res) => {
    const shopId = Number(req.params.id);
    const fullName = String(req.body.fullName || "").trim();
    const username = String(req.body.username || "").trim();
    const password = String(req.body.password || "");
    const role = String(req.body.role || "cashier").trim();

    if (!fullName || !username || !password || !["admin", "cashier"].includes(role)) {
        return res.status(400).json({ message: "Full name, username, password, and valid role are required." });
    }

    const existing = db.prepare("SELECT id FROM users WHERE username = ?").get(username);
    if (existing) {
        return res.status(400).json({ message: "This username is already in use." });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const result = db.prepare(
        "INSERT INTO users (full_name, username, password_hash, password_enc, role, shop_id) VALUES (?, ?, ?, ?, ?, ?)"
    ).run(fullName, username, passwordHash, encryptPassword(password), role, shopId);

    writeAuditLog({
        actorId: req.user.id,
        action: "USER_CREATED",
        entityType: "user",
        entityId: result.lastInsertRowid,
        description: `User ${username} created for shop ${shopId}`,
        ipAddress: getClientIp(req)
    });

    res.status(201).json({ message: "User created successfully." });
});

app.put("/api/super/users/:id", authenticate, requireSuperAdmin, (req, res) => {
    const userId = Number(req.params.id);
    const fullName = String(req.body.fullName || "").trim();
    const password = String(req.body.password || "").trim();
    const role = String(req.body.role || "").trim();
    const isActive = req.body.isActive !== undefined ? (req.body.isActive ? 1 : 0) : undefined;

    if (!fullName && !password && !role && isActive === undefined) {
        return res.status(400).json({ message: "At least one field is required." });
    }

    const existing = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);
    if (!existing) {
        return res.status(404).json({ message: "User not found." });
    }

    const updates = [];
    const params = [];

    if (fullName) {
        updates.push("full_name = ?");
        params.push(fullName);
    }
    if (password) {
        const passwordHash = bcrypt.hashSync(password, 10);
        updates.push("password_hash = ?");
        params.push(passwordHash);
        updates.push("password_enc = ?");
        params.push(encryptPassword(password));
    }
    if (role && ["admin", "cashier", "super_admin"].includes(role)) {
        updates.push("role = ?");
        params.push(role);
    }
    if (isActive !== undefined) {
        updates.push("is_active = ?");
        params.push(isActive);
    }
    updates.push("updated_at = CURRENT_TIMESTAMP");
    params.push(userId);

    db.prepare(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`).run(...params);
    
    writeAuditLog({
        actorId: req.user.id,
        shopId: existing.shop_id,
        action: "USER_UPDATED",
        entityType: "user",
        entityId: userId,
        description: `User ${existing.username} updated`,
        ipAddress: getClientIp(req)
    });

    res.json({ message: "User updated successfully." });
});

app.delete("/api/super/users/:id", authenticate, requireSuperAdmin, (req, res) => {
    const userId = Number(req.params.id);
    const existing = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);
    if (!existing) {
        return res.status(404).json({ message: "User not found." });
    }

    db.prepare("UPDATE users SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(userId);
    
    writeAuditLog({
        actorId: req.user.id,
        shopId: existing.shop_id,
        action: "USER_DEACTIVATED",
        entityType: "user",
        entityId: userId,
        description: `User ${existing.username} deactivated`,
        ipAddress: getClientIp(req)
    });

    res.json({ message: "User deactivated successfully." });
});

// Get all products for a shop (super admin)
app.get("/api/super/shops/:id/products", authenticate, requireSuperAdmin, (req, res) => {
    const shopId = Number(req.params.id);
    const products = getProducts(shopId, String(req.query.search || ""));
    res.json({ products });
});

// Get all sales for a shop (super admin)
app.get("/api/super/shops/:id/sales", authenticate, requireSuperAdmin, (req, res) => {
    const shopId = Number(req.params.id);
    const date = String(req.query.date || "").trim();
    const month = String(req.query.month || "").trim();
    res.json({ sales: getSales(shopId, { date, month }) });
});

// Get stock movements for a shop (super admin)
app.get("/api/super/shops/:id/stock-movements", authenticate, requireSuperAdmin, (req, res) => {
    const shopId = Number(req.params.id);
    const movements = db
        .prepare(
            `
            SELECT
                stock_movements.*,
                products.code AS product_code,
                products.name AS product_name,
                users.full_name AS actor_name
            FROM stock_movements
            JOIN products ON products.id = stock_movements.product_id
            LEFT JOIN users ON users.id = stock_movements.actor_id
            WHERE stock_movements.shop_id = ?
            ORDER BY stock_movements.created_at DESC, stock_movements.id DESC
            LIMIT 200
            `
        )
        .all(shopId)
        .map((row) => ({
            id: row.id,
            productCode: row.product_code,
            productName: row.product_name,
            movementType: row.movement_type,
            quantityChange: row.quantity_change,
            balanceAfter: row.balance_after,
            note: row.note || "",
            actorName: row.actor_name || "System",
            createdAt: row.created_at
        }));
    res.json({ movements });
});

nestedApiRouter.get("/sales/:id", authenticate, sendSaleDetails);
nestedApiRouter.get("/export/backup", authenticate, requireRole("admin", "super_admin"), exportBackup);
nestedApiRouter.get("/export/excel", authenticate, requireRole("admin", "super_admin"), exportExcel);
app.use("/api", nestedApiRouter);

// Problems reported by the browser (JS errors, printer failures). Open to signed-out pages too, so it is rate limited.
const clientLogHits = new Map();
app.post("/api/client-log", (req, res) => {
    const ip = getClientIp(req);
    const now = Date.now();
    const hit = clientLogHits.get(ip);
    if (!hit || now - hit.start > 60000) clientLogHits.set(ip, { start: now, count: 1 });
    else if (++hit.count > 60) return res.status(429).json({ message: "Too many reports." });

    let userId;
    try {
        const token = String(req.headers.authorization || "").replace(/^Bearer /, "");
        if (token) userId = jwt.verify(token, JWT_SECRET).userId;
    } catch (error) { /* signed-out reports are fine */ }

    const level = ["error", "warn", "info"].includes(req.body.level) ? req.body.level : "error";
    const source = `client:${String(req.body.source || "app").slice(0, 40)}`;
    const message = String(req.body.message || "").slice(0, 1000);
    let context = req.body.context;
    if (context && JSON.stringify(context).length > 2000) context = { truncated: true };
    logger[level](source, message, { ...(context && typeof context === "object" ? context : {}), userId, ip, userAgent: String(req.headers["user-agent"] || "").slice(0, 200) });
    res.status(204).end();
});

app.get("/api/super/logs", authenticate, requireSuperAdmin, (req, res) => {
    const level = ["error", "warn", "info"].includes(req.query.level) ? req.query.level : "";
    const source = String(req.query.source || "").slice(0, 40);
    const limit = Math.min(500, Math.max(1, Number(req.query.limit) || 200));
    res.json({ logs: logger.readRecent({ level, source, limit }) });
});

app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
});

// Serve super admin page
app.get("/super", (_req, res) => {
    res.sendFile(path.join(__dirname, "..", "public", "super.html"));
});

app.get(/^(?!\/api|\/super).*/, (_req, res) => {
    res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

app.use((error, req, res, _next) => {
    logger.error("server", error.stack || String(error), { method: req.method, path: req.originalUrl.split("?")[0], userId: req.user?.id });
    res.status(500).json({ message: "Unexpected server error." });
});

process.on("uncaughtException", (error) => {
    logger.error("process", `Uncaught exception: ${error.stack || error}`);
    process.exit(1);
});
process.on("unhandledRejection", (reason) => {
    logger.error("process", `Unhandled rejection: ${reason?.stack || reason}`);
});

logger.prune();
app.listen(PORT, () => {
    logger.info("server", `Pharmacy POS server started on port ${PORT}`);
});
