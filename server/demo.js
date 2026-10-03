// Public demo shop at /demo: a convenience store with realistic sample data that resets itself.
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const { encryptPassword } = require("./vault");

const DEMO_SLUG = "demo";
// Shown on the /demo sign-in page. Passwords are reset with the demo data.
const DEMO_ACCOUNTS = [
    { username: "demo-admin", password: "demo1234", fullName: "Demo Manager", role: "admin" },
    { username: "demo-cashier", password: "demo1234", fullName: "Demo Cashier", role: "cashier" }
];
const RESET_INTERVAL_MS = 6 * 60 * 60 * 1000;

function localDate(offsetDays = 0) {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const PRODUCTS = [
    // code, brand, name, category, expiry offset (days), cost, sell, qty, low-stock threshold
    ["BEV001", "Coca-Cola", "Coca-Cola 330ml Can", "Beverages", 240, 500, 800, 144, 24],
    ["BEV002", "Max Plus", "Max Plus Orange 350ml", "Beverages", 200, 550, 900, 96, 24],
    ["BEV003", "Alpine", "Alpine Drinking Water 1L", "Beverages", 365, 250, 400, 220, 30],
    ["BEV004", "Premier", "Premier Coffee Mix 3in1 (10 pcs)", "Beverages", 300, 2200, 3000, 40, 10],
    ["SNK001", "Lay's", "Lay's Classic Potato Chips 50g", "Snacks", 150, 900, 1300, 60, 15],
    ["SNK002", "Oreo", "Oreo Chocolate Cookies 133g", "Snacks", 210, 1500, 2100, 35, 10],
    ["SNK003", "Danisa", "Danisa Butter Cookies 200g", "Snacks", 280, 4200, 5500, 18, 6],
    ["INS001", "Mama", "Mama Instant Noodles Shrimp", "Instant food", 180, 300, 500, 150, 30],
    ["INS002", "Yum Yum", "Yum Yum Chicken Noodles", "Instant food", 170, 280, 450, 9, 20],
    ["DAI001", "Dutch Mill", "Dutch Mill Yogurt Drink 180ml", "Dairy & bakery", 18, 600, 900, 48, 12],
    ["DAI002", "Daily Bake", "Sandwich Bread 400g", "Dairy & bakery", 3, 1800, 2500, 14, 5],
    ["DAI003", "Meiji", "Meiji Fresh Milk 1L", "Dairy & bakery", -2, 2600, 3500, 6, 4],
    ["PER001", "Colgate", "Colgate Toothpaste 160g", "Personal care", 700, 2500, 3500, 25, 8],
    ["PER002", "Sunsilk", "Sunsilk Shampoo 170ml", "Personal care", 650, 2800, 3800, 5, 8],
    ["HOU001", "Breeze", "Breeze Detergent Powder 800g", "Household", 900, 3500, 4800, 22, 6],
    ["HOU002", "Energizer", "Energizer AA Batteries (2 pack)", "Household", 1400, 1800, 2600, 30, 8]
];

function findDemoShop(db) {
    return db.prepare("SELECT * FROM shops WHERE slug = ?").get(DEMO_SLUG);
}

function ensureDemoShop(db) {
    let shop = findDemoShop(db);
    if (!shop) {
        const result = db.prepare("INSERT INTO shops (name, slug, business_type) VALUES (?, ?, ?)").run("Demo Store", DEMO_SLUG, "convenience");
        shop = findDemoShop(db);
        if (!shop) shop = db.prepare("SELECT * FROM shops WHERE id = ?").get(result.lastInsertRowid);
    }
    const users = DEMO_ACCOUNTS.map((account) => {
        const hash = bcrypt.hashSync(account.password, 10);
        const existing = db.prepare("SELECT id FROM users WHERE username = ?").get(account.username);
        if (existing) {
            db.prepare("UPDATE users SET full_name = ?, password_hash = ?, password_enc = ?, role = ?, shop_id = ?, is_active = 1 WHERE id = ?")
                .run(account.fullName, hash, encryptPassword(account.password), account.role, shop.id, existing.id);
        } else {
            db.prepare("INSERT INTO users (full_name, username, password_hash, password_enc, role, shop_id) VALUES (?, ?, ?, ?, ?, ?)")
                .run(account.fullName, account.username, hash, encryptPassword(account.password), account.role, shop.id);
        }
        return db.prepare("SELECT * FROM users WHERE username = ?").get(account.username);
    });
    return { shop, user: users[0], users };
}

function resetDemoShop(db) {
    const { shop, user, users } = ensureDemoShop(db);
    const shopId = shop.id;
    const keepIds = users.map((u) => u.id);

    const tx = db.transaction(() => {
        db.prepare("DELETE FROM sale_items WHERE sale_id IN (SELECT id FROM sales WHERE shop_id = ?)").run(shopId);
        for (const table of ["sales", "stock_movements", "supplier_ledger", "customer_ledger", "suppliers", "customers", "expenses", "audit_logs"]) {
            db.prepare(`DELETE FROM ${table} WHERE shop_id = ?`).run(shopId);
        }
        db.prepare("DELETE FROM products WHERE shop_id = ?").run(shopId);
        db.prepare(`DELETE FROM users WHERE shop_id = ? AND id NOT IN (${keepIds.map(() => "?").join(", ")})`).run(shopId, ...keepIds);
        db.prepare("UPDATE shops SET name = 'Demo Store', business_type = 'convenience', logo_path = NULL, is_active = 1 WHERE id = ?").run(shopId);

        const insertProduct = db.prepare(`
            INSERT INTO products (shop_id, code, brand, name, category, expiry_date, cost_price, sell_price, quantity, low_stock_threshold)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
        const insertMove = db.prepare(`
            INSERT INTO stock_movements (product_id, shop_id, movement_type, quantity_change, balance_after, note, actor_id, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
        const products = PRODUCTS.map(([code, brand, name, category, expiryOffset, cost, sell, qty, threshold]) => {
            // Opening stock covers ~10 weeks of sales history; fast movers end up low, as in a real shop.
            const opening = qty * 6;
            const id = insertProduct.run(shopId, code, brand, name, category, localDate(expiryOffset), cost, sell, opening, threshold).lastInsertRowid;
            insertMove.run(id, shopId, "inbound", opening, opening, "Opening stock", user.id, `${localDate(-76)} 08:00:00`);
            return { id, code, name, cost, sell, qty: opening };
        });

        // About ten weeks of sales so the dashboard, monthly profit chart and reports have history.
        const insertSale = db.prepare(`
            INSERT INTO sales (shop_id, invoice_no, cashier_id, sale_date, subtotal, discount, total, profit, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
        const insertItem = db.prepare(`
            INSERT INTO sale_items (sale_id, shop_id, product_id, product_code, product_name, quantity, cost_price, sell_price, line_total, line_profit, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
        const updateQty = db.prepare("UPDATE products SET quantity = ? WHERE id = ?");
        let seed = 7;
        const rand = (n) => { seed = (seed * 9301 + 49297) % 233280; return Math.floor((seed / 233280) * n); };
        let invoice = 1;
        for (let day = -75; day <= 0; day += 1) {
            const date = localDate(day);
            const salesToday = 5 + rand(5);
            for (let s = 0; s < salesToday; s += 1) {
                const lines = [];
                const lineCount = 1 + rand(3);
                for (let l = 0; l < lineCount; l += 1) {
                    const product = products[rand(products.length)];
                    const qty = 1 + rand(3);
                    if (product.qty - qty < 2 || lines.some((line) => line.product === product)) continue;
                    lines.push({ product, qty });
                }
                if (!lines.length) continue;
                const subtotal = lines.reduce((sum, line) => sum + line.product.sell * line.qty, 0);
                const profit = lines.reduce((sum, line) => sum + (line.product.sell - line.product.cost) * line.qty, 0);
                const time = `${date} ${String(9 + rand(11)).padStart(2, "0")}:${String(rand(60)).padStart(2, "0")}:00`;
                const saleId = insertSale.run(shopId, `DEMO-${date.replaceAll("-", "")}-${String(invoice).padStart(3, "0")}`, user.id, date, subtotal, 0, subtotal, profit, time).lastInsertRowid;
                invoice += 1;
                for (const { product, qty } of lines) {
                    insertItem.run(saleId, shopId, product.id, product.code, product.name, qty, product.cost, product.sell, product.sell * qty, (product.sell - product.cost) * qty, time);
                    product.qty -= qty;
                    updateQty.run(product.qty, product.id);
                    insertMove.run(product.id, shopId, "sale", -qty, product.qty, `Sold via demo invoice`, user.id, time);
                }
            }
        }

        db.prepare("INSERT INTO suppliers (shop_id, name, phone, balance) VALUES (?, ?, ?, ?)").run(shopId, "City Wholesale", "09 450 000 111", 125000);
        db.prepare("INSERT INTO suppliers (shop_id, name, phone, balance) VALUES (?, ?, ?, ?)").run(shopId, "Golden Drinks Distribution", "09 420 000 222", 0);
        db.prepare("INSERT INTO customers (shop_id, name, phone, credit_balance) VALUES (?, ?, ?, ?)").run(shopId, "Ko Aung", "09 777 000 333", 8500);
        db.prepare("INSERT INTO customers (shop_id, name, phone, credit_balance) VALUES (?, ?, ?, ?)").run(shopId, "Ma Hnin", "09 788 000 444", 0);
        const insertExpense = db.prepare(`
            INSERT INTO expenses (shop_id, category, description, amount, expense_date, actor_id, payment_method, paid_to, reference_no)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
        // Monthly running costs for the current and two previous months (dated on days that already passed).
        const today = new Date();
        for (let back = 2; back >= 0; back -= 1) {
            const monthStart = new Date(today.getFullYear(), today.getMonth() - back, 1);
            const day = (n) => {
                const d = new Date(monthStart.getFullYear(), monthStart.getMonth(), Math.min(n, back ? 28 : today.getDate()));
                return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
            };
            const tag = `${monthStart.getFullYear()}${String(monthStart.getMonth() + 1).padStart(2, "0")}`;
            // In the current month, bills appear only once their usual day has passed.
            const due = (n) => back > 0 || today.getDate() >= n;
            if (due(25)) insertExpense.run(shopId, "Rent", "Shop rent", 60000, day(25), user.id, "Bank transfer", "U Kyaw (landlord)", `RENT-${tag}`);
            if (due(5)) insertExpense.run(shopId, "Utilities", "Electricity bill", 18000 + back * 2000, day(5), user.id, "KBZPay", "YESB", `EB-${tag}`);
            if (due(9)) insertExpense.run(shopId, "Supplies", "Shopping bags and receipt rolls", 6000, day(9), user.id, "Cash", "City Wholesale", "");
        }
    });
    tx();
    // Photos visitors uploaded to the demo (product pictures, voucher photos) go with the data.
    for (const folder of ["products", "expenses"]) {
        fs.rmSync(path.join(__dirname, "..", "uploads", folder, String(shopId)), { recursive: true, force: true });
    }
    return { shopId, userId: user.id };
}

function startDemoResets(db, logger) {
    const run = () => {
        try {
            resetDemoShop(db);
            logger?.info("demo", "Demo shop data reset");
        } catch (error) {
            logger?.error("demo", `Demo reset failed: ${error.stack || error}`);
        }
    };
    run();
    setInterval(run, RESET_INTERVAL_MS).unref();
}

module.exports = { DEMO_SLUG, DEMO_ACCOUNTS, ensureDemoShop, resetDemoShop, startDemoResets };
