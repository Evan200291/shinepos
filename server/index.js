const path = require("path");
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const XLSX = require("xlsx");
const db = require("./db");

const app = express();
const nestedApiRouter = express.Router();
const PORT = process.env.PORT || 45451;
const JWT_SECRET = process.env.JWT_SECRET || "pharmacy-pos-local-secret";

app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));
app.use("/fonts", express.static(path.join(__dirname, "..", "A Ka 06")));

function toNumber(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function todayString() {
    return new Date().toISOString().split("T")[0];
}

function sanitizeUser(user) {
    return {
        id: user.id,
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

function writeAuditLog({ actorId = null, action, entityType, entityId = null, description, ipAddress = null }) {
    db.prepare(
        `
        INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, description, ip_address)
        VALUES (?, ?, ?, ?, ?, ?)
        `
    ).run(actorId, action, entityType, entityId ? String(entityId) : null, description, ipAddress);
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

function mapProduct(row) {
    const status = row.expiry_date < todayString() ? "expired" : row.quantity <= row.low_stock_threshold ? "low" : "good";
    return {
        id: row.id,
        code: row.code,
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

function getProducts(search = "") {
    const trimmed = search.trim();

    if (!trimmed) {
        const rows = db
            .prepare("SELECT * FROM products WHERE is_active = 1 ORDER BY name ASC")
            .all();
        return rows.map(mapProduct);
    }

    const like = `%${trimmed}%`;
    const rows = db
        .prepare(
            `
            SELECT * FROM products
            WHERE is_active = 1
              AND (code LIKE ? OR name LIKE ? OR brand LIKE ? OR category LIKE ?)
            ORDER BY name ASC
            `
        )
        .all(like, like, like, like);

    return rows.map(mapProduct);
}

function getSales(filter = {}) {
    const conditions = [];
    const params = [];

    if (filter.date) {
        conditions.push("sale_date = ?");
        params.push(filter.date);
    }

    if (filter.month) {
        conditions.push("substr(sale_date, 1, 7) = ?");
        params.push(filter.month);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const sales = db
        .prepare(
            `
            SELECT
                sales.*,
                users.full_name AS cashier_name
            FROM sales
            JOIN users ON users.id = sales.cashier_id
            ${whereClause}
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

function getSaleById(saleId) {
    const sale = db
        .prepare(
            `
            SELECT
                sales.*,
                users.full_name AS cashier_name
            FROM sales
            JOIN users ON users.id = sales.cashier_id
            WHERE sales.id = ?
            `
        )
        .get(saleId);

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

function getBackupSnapshot() {
    return {
        exportedAt: new Date().toISOString(),
        users: db.prepare("SELECT id, full_name, username, role, is_active, created_at, updated_at FROM users ORDER BY id ASC").all(),
        products: db.prepare("SELECT * FROM products ORDER BY id ASC").all(),
        sales: db.prepare("SELECT * FROM sales ORDER BY id ASC").all(),
        saleItems: db.prepare("SELECT * FROM sale_items ORDER BY id ASC").all(),
        stockMovements: db.prepare("SELECT * FROM stock_movements ORDER BY id ASC").all(),
        auditLogs: db.prepare("SELECT * FROM audit_logs ORDER BY id ASC").all()
    };
}

function generateInvoiceNo() {
    const compactDate = todayString().replaceAll("-", "");
    return `INV-${compactDate}-${Date.now().toString().slice(-6)}`;
}

function sendSaleDetails(req, res) {
    const saleId = Number(req.params.id);
    const sale = getSaleById(saleId);

    if (!sale) {
        return res.status(404).json({ message: "Sale not found." });
    }

    res.json({ sale });
}

function exportBackup(req, res) {
    const snapshot = getBackupSnapshot();

    writeAuditLog({
        actorId: req.user.id,
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
    const workbook = XLSX.utils.book_new();
    const snapshot = getBackupSnapshot();

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

    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(snapshot.products), "Products");
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(salesRows), "Sales");
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(snapshot.saleItems), "SaleItems");
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(snapshot.stockMovements), "StockMoves");
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(snapshot.users), "Users");
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(snapshot.auditLogs), "AuditLogs");

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    writeAuditLog({
        actorId: req.user.id,
        action: "EXCEL_EXPORTED",
        entityType: "report",
        description: `${req.user.fullName} exported system data to Excel`,
        ipAddress: getClientIp(req)
    });

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="shine-digital-export-${todayString()}.xlsx"`);
    res.send(buffer);
}

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

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: "12h" });

    writeAuditLog({
        actorId: user.id,
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
        "UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    ).run(passwordHash, req.user.id);

    writeAuditLog({
        actorId: req.user.id,
        action: "PASSWORD_CHANGED",
        entityType: "user",
        entityId: req.user.id,
        description: `${req.user.fullName} changed account password`,
        ipAddress: getClientIp(req)
    });

    res.json({ message: "Password changed successfully." });
});

app.get("/api/dashboard/summary", authenticate, (req, res) => {
    const today = todayString();
    const summary = {
        totalProducts: db.prepare("SELECT COUNT(*) AS count FROM products WHERE is_active = 1").get().count,
        inventoryValue: db.prepare("SELECT COALESCE(SUM(cost_price * quantity), 0) AS value FROM products WHERE is_active = 1").get().value,
        lowStockCount: db.prepare("SELECT COUNT(*) AS count FROM products WHERE is_active = 1 AND quantity <= low_stock_threshold").get().count,
        expiredCount: db.prepare("SELECT COUNT(*) AS count FROM products WHERE is_active = 1 AND expiry_date < ?").get(today).count,
        todaySales: db.prepare("SELECT COALESCE(SUM(total), 0) AS total FROM sales WHERE sale_date = ?").get(today).total,
        todayProfit: db.prepare("SELECT COALESCE(SUM(profit), 0) AS total FROM sales WHERE sale_date = ?").get(today).total
    };

    res.json(summary);
});

app.get("/api/products", authenticate, (req, res) => {
    res.json({ products: getProducts(String(req.query.search || "")) });
});

app.post("/api/inbound", authenticate, requireRole("admin"), (req, res) => {
    const code = String(req.body.code || "").trim().toUpperCase();
    const brand = String(req.body.brand || "").trim();
    const name = String(req.body.name || "").trim();
    const category = String(req.body.category || "").trim();
    const expiryDate = String(req.body.expiryDate || "").trim();
    const costPrice = toNumber(req.body.costPrice);
    const sellPrice = toNumber(req.body.sellPrice);
    const quantity = Math.max(0, Math.floor(toNumber(req.body.quantity)));
    const lowStockThreshold = Math.max(1, Math.floor(toNumber(req.body.lowStockThreshold, 10)));

    if (!code || !name || !expiryDate || quantity <= 0) {
        return res.status(400).json({ message: "Code, name, expiry date, and quantity are required." });
    }

    const tx = db.transaction(() => {
        const existing = db.prepare("SELECT * FROM products WHERE code = ?").get(code);
        let productId;
        let newBalance;
        let action;
        let description;

        if (existing) {
            newBalance = existing.quantity + quantity;
            db.prepare(
                `
                UPDATE products
                SET brand = ?, name = ?, category = ?, expiry_date = ?, cost_price = ?, sell_price = ?,
                    quantity = ?, low_stock_threshold = ?, is_active = 1, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
                `
            ).run(
                brand,
                name,
                category,
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
                    code, brand, name, category, expiry_date, cost_price, sell_price, quantity, low_stock_threshold
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `
            ).run(code, brand, name, category, expiryDate, costPrice, sellPrice, quantity, lowStockThreshold);
            productId = result.lastInsertRowid;
            newBalance = quantity;
            action = "PRODUCT_CREATED";
            description = `New product ${code} created with opening stock ${quantity}`;
        }

        db.prepare(
            `
            INSERT INTO stock_movements (product_id, movement_type, quantity_change, balance_after, note, actor_id)
            VALUES (?, 'inbound', ?, ?, ?, ?)
            `
        ).run(productId, quantity, newBalance, "Inbound stock entry", req.user.id);

        writeAuditLog({
            actorId: req.user.id,
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

app.put("/api/products/:id", authenticate, requireRole("admin"), (req, res) => {
    const productId = Number(req.params.id);
    const existing = db.prepare("SELECT * FROM products WHERE id = ?").get(productId);

    if (!existing) {
        return res.status(404).json({ message: "Product not found." });
    }

    const code = String(req.body.code || "").trim().toUpperCase();
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

    const duplicate = db.prepare("SELECT id FROM products WHERE code = ? AND id != ?").get(code, productId);
    if (duplicate) {
        return res.status(400).json({ message: "Another product already uses this code." });
    }

    const quantityDifference = quantity - existing.quantity;

    const tx = db.transaction(() => {
        db.prepare(
            `
            UPDATE products
            SET code = ?, brand = ?, name = ?, category = ?, expiry_date = ?, cost_price = ?,
                sell_price = ?, quantity = ?, low_stock_threshold = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            `
        ).run(code, brand, name, category, expiryDate, costPrice, sellPrice, quantity, lowStockThreshold, productId);

        if (quantityDifference !== 0) {
            db.prepare(
                `
                INSERT INTO stock_movements (product_id, movement_type, quantity_change, balance_after, note, actor_id)
                VALUES (?, 'adjustment', ?, ?, ?, ?)
                `
            ).run(productId, quantityDifference, quantity, "Manual stock adjustment from inventory edit", req.user.id);
        }

        writeAuditLog({
            actorId: req.user.id,
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

app.delete("/api/products/:id", authenticate, requireRole("admin"), (req, res) => {
    const productId = Number(req.params.id);
    const product = db.prepare("SELECT * FROM products WHERE id = ?").get(productId);

    if (!product) {
        return res.status(404).json({ message: "Product not found." });
    }

    const tx = db.transaction(() => {
        db.prepare(
            "UPDATE products SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
        ).run(productId);

        db.prepare(
            `
            INSERT INTO stock_movements (product_id, movement_type, quantity_change, balance_after, note, actor_id)
            VALUES (?, 'deactivate', ?, ?, ?, ?)
            `
        ).run(productId, 0, product.quantity, "Product deactivated", req.user.id);

        writeAuditLog({
            actorId: req.user.id,
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

app.post("/api/sales", authenticate, (req, res) => {
    const items = Array.isArray(req.body.items) ? req.body.items : [];
    const discount = Math.max(0, toNumber(req.body.discount));
    const saleDate = String(req.body.saleDate || todayString()).trim();

    if (items.length === 0) {
        return res.status(400).json({ message: "At least one cart item is required." });
    }

    try {
        const tx = db.transaction(() => {
            const inventoryLookup = db.prepare(
                "SELECT * FROM products WHERE id = ? AND is_active = 1"
            );
            const updateStock = db.prepare(
                "UPDATE products SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
            );
            const insertSale = db.prepare(
                `
                INSERT INTO sales (invoice_no, cashier_id, sale_date, subtotal, discount, total, profit)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                `
            );
            const insertSaleItem = db.prepare(
                `
                INSERT INTO sale_items (
                    sale_id, product_id, product_code, product_name, quantity, cost_price, sell_price, line_total, line_profit
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `
            );
            const insertMovement = db.prepare(
                `
                INSERT INTO stock_movements (product_id, movement_type, quantity_change, balance_after, note, actor_id)
                VALUES (?, 'sale', ?, ?, ?, ?)
                `
            );

            let subtotal = 0;
            let profit = 0;
            const checkedItems = [];

            for (const item of items) {
                const productId = Number(item.productId);
                const requestedQty = Math.max(1, Math.floor(toNumber(item.quantity, 1)));
                const requestedPrice = Math.max(0, toNumber(item.sellPrice));
                const product = inventoryLookup.get(productId);

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
            const invoiceNo = generateInvoiceNo();
            const saleResult = insertSale.run(invoiceNo, req.user.id, saleDate, subtotal, discount, total, finalProfit);
            const saleId = saleResult.lastInsertRowid;

            for (const item of checkedItems) {
                const newBalance = item.product.quantity - item.requestedQty;
                insertSaleItem.run(
                    saleId,
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
                    -item.requestedQty,
                    newBalance,
                    `Sold via ${invoiceNo}`,
                    req.user.id
                );
            }

            writeAuditLog({
                actorId: req.user.id,
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
    const date = String(req.query.date || "").trim();
    const month = String(req.query.month || "").trim();
    res.json({ sales: getSales({ date, month }) });
});

app.get("/api/sales/:id", authenticate, sendSaleDetails);

app.get("/api/alerts", authenticate, (req, res) => {
    const today = todayString();
    const lowStock = db
        .prepare(
            `
            SELECT * FROM products
            WHERE is_active = 1 AND quantity <= low_stock_threshold
            ORDER BY quantity ASC, name ASC
            `
        )
        .all()
        .map(mapProduct);

    const expired = db
        .prepare(
            `
            SELECT * FROM products
            WHERE is_active = 1 AND expiry_date < ?
            ORDER BY expiry_date ASC
            `
        )
        .all(today)
        .map(mapProduct);

    const expiringSoon = db
        .prepare(
            `
            SELECT * FROM products
            WHERE is_active = 1
              AND expiry_date >= ?
              AND expiry_date <= date(?, '+90 day')
            ORDER BY expiry_date ASC
            `
        )
        .all(today, today)
        .map(mapProduct);

    res.json({ lowStock, expired, expiringSoon });
});

app.get("/api/stock-movements", authenticate, requireRole("admin"), (req, res) => {
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
            ORDER BY stock_movements.created_at DESC, stock_movements.id DESC
            LIMIT 200
            `
        )
        .all()
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

app.get("/api/audit-logs", authenticate, requireRole("admin"), (req, res) => {
    const logs = db
        .prepare(
            `
            SELECT
                audit_logs.*,
                users.full_name AS actor_name
            FROM audit_logs
            LEFT JOIN users ON users.id = audit_logs.actor_id
            ORDER BY audit_logs.created_at DESC, audit_logs.id DESC
            LIMIT 200
            `
        )
        .all()
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

app.get("/api/users", authenticate, requireRole("admin"), (req, res) => {
    const users = db
        .prepare(
            `
            SELECT id, full_name, username, role, is_active, created_at
            FROM users
            ORDER BY created_at DESC, id DESC
            `
        )
        .all()
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

app.post("/api/users", authenticate, requireRole("admin"), (req, res) => {
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
        INSERT INTO users (full_name, username, password_hash, role)
        VALUES (?, ?, ?, ?)
        `
    ).run(fullName, username, passwordHash, role);

    writeAuditLog({
        actorId: req.user.id,
        action: "USER_CREATED",
        entityType: "user",
        entityId: result.lastInsertRowid,
        description: `User ${username} created with role ${role}`,
        ipAddress: getClientIp(req)
    });

    res.status(201).json({ message: "User created successfully." });
});

app.get("/api/export/backup", authenticate, requireRole("admin"), exportBackup);
app.get("/api/export/excel", authenticate, requireRole("admin"), exportExcel);

nestedApiRouter.get("/sales/:id", authenticate, sendSaleDetails);
nestedApiRouter.get("/export/backup", authenticate, requireRole("admin"), exportBackup);
nestedApiRouter.get("/export/excel", authenticate, requireRole("admin"), exportExcel);
app.use("/api", nestedApiRouter);

app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
});

app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

app.use((error, _req, res, _next) => {
    console.error(error);
    res.status(500).json({ message: "Unexpected server error." });
});

app.listen(PORT, () => {
    console.log(`Pharmacy POS server running at http://localhost:${PORT}`);
});
