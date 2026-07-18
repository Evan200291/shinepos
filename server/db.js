const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");
const bcrypt = require("bcryptjs");

const databaseDir = path.join(__dirname, "..", "database");
const databasePath = path.join(databaseDir, "pharmacy-pos.db");
const schemaPath = path.join(databaseDir, "schema.sql");

fs.mkdirSync(databaseDir, { recursive: true });

const db = new Database(databasePath);
db.pragma("journal_mode = WAL");

const schema = fs.readFileSync(schemaPath, "utf8");
db.exec(schema);

function hasColumn(tableName, columnName) {
    const columns = db.prepare(`PRAGMA table_info(${tableName})`).all();
    return columns.some((column) => column.name === columnName);
}

function ensureColumn(tableName, columnName, definition) {
    if (!hasColumn(tableName, columnName)) {
        db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
    }
}

function runMigrations() {
    ensureColumn("users", "shop_id", "INTEGER");
    ensureColumn("products", "shop_id", "INTEGER");
    ensureColumn("sales", "shop_id", "INTEGER");
    ensureColumn("stock_movements", "shop_id", "INTEGER");
    ensureColumn("audit_logs", "shop_id", "INTEGER");
}

function ensureDefaultShop() {
    const existingShop = db.prepare("SELECT id FROM shops ORDER BY id ASC LIMIT 1").get();
    if (existingShop) {
        return existingShop.id;
    }

    const result = db.prepare("INSERT INTO shops (name) VALUES (?)").run("Default Shop");
    return result.lastInsertRowid;
}

function normalizeExistingData(defaultShopId) {
    db.prepare(
        `
        UPDATE users
        SET shop_id = ?, updated_at = CURRENT_TIMESTAMP
        WHERE role != 'super_admin' AND shop_id IS NULL
        `
    ).run(defaultShopId);

    db.prepare(
        `
        UPDATE products
        SET shop_id = ?, updated_at = CURRENT_TIMESTAMP
        WHERE shop_id IS NULL
        `
    ).run(defaultShopId);

    db.prepare(
        `
        UPDATE sales
        SET shop_id = ?
        WHERE shop_id IS NULL
        `
    ).run(defaultShopId);

    db.prepare(
        `
        UPDATE stock_movements
        SET shop_id = ?
        WHERE shop_id IS NULL
        `
    ).run(defaultShopId);

    db.prepare(
        `
        UPDATE audit_logs
        SET shop_id = ?
        WHERE shop_id IS NULL AND actor_id IN (
            SELECT id FROM users WHERE role != 'super_admin'
        )
        `
    ).run(defaultShopId);
}

function seedSuperAdmins() {
    const superAdmins = [
        { fullName: "Exabyte 262", username: "exabyte262", password: "exabyte002" },
        { fullName: "Exabyte 192", username: "exabyte192", password: "exabyte002" }
    ];

    for (const admin of superAdmins) {
        const existing = db
            .prepare("SELECT id FROM users WHERE username = ?")
            .get(admin.username);
        const passwordHash = bcrypt.hashSync(admin.password, 10);

        if (existing) {
            db.prepare(
                `
                UPDATE users
                SET full_name = ?, password_hash = ?, role = 'super_admin', is_active = 1, shop_id = NULL, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
                `
            ).run(admin.fullName, passwordHash, existing.id);
        } else {
            db.prepare(
                `
                INSERT INTO users (full_name, username, password_hash, role)
                VALUES (?, ?, ?, ?)
                `
            ).run(admin.fullName, admin.username, passwordHash, "super_admin");
        }
    }
}

function seedAdminUser() {
    const defaultShopId = ensureDefaultShop();
    const existingAdmin = db
        .prepare("SELECT id FROM users WHERE username = ?")
        .get("admin");

    if (existingAdmin) {
        db.prepare(
            `
            UPDATE users
            SET shop_id = COALESCE(shop_id, ?), role = 'admin', is_active = 1, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            `
        ).run(defaultShopId, existingAdmin.id);
    } else {
        const passwordHash = bcrypt.hashSync("Admin@123", 10);
        db.prepare(
            `
            INSERT INTO users (full_name, username, password_hash, role, shop_id)
            VALUES (?, ?, ?, ?, ?)
            `
        ).run("System Administrator", "admin", passwordHash, "admin", defaultShopId);
    }
}

function seedProducts() {
    const row = db.prepare("SELECT COUNT(*) AS count FROM products").get();
    if (row.count > 0) {
        return;
    }

    // Get or create default shop
    let shopId;
    const shopRow = db.prepare("SELECT id FROM shops LIMIT 1").get();
    if (shopRow) {
        shopId = shopRow.id;
    } else {
        const shopResult = db.prepare("INSERT INTO shops (name) VALUES (?)").run("Default Shop");
        shopId = shopResult.lastInsertRowid;
    }

    const insertProduct = db.prepare(
        `
        INSERT INTO products (
            shop_id, code, brand, name, category, expiry_date, cost_price, sell_price, quantity, low_stock_threshold
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `
    );

    const items = [
        ["MED001", "Biogesic", "Paracetamol 500mg", "Analgesic", "2027-01-20", 50, 100, 500, 20],
        ["MED002", "Decolgen", "Decolgen Tablet", "Cold Relief", "2026-11-15", 80, 150, 180, 20],
        ["MED003", "Amoxil", "Amoxicillin 500mg", "Antibiotic", "2026-09-01", 150, 300, 75, 10],
        ["VIT001", "Enervon", "Enervon C", "Vitamin", "2026-12-10", 300, 500, 120, 15]
    ];

    const tx = db.transaction(() => {
        for (const item of items) {
            const result = insertProduct.run(shopId, ...item);
            db.prepare(
                `
                INSERT INTO stock_movements (product_id, shop_id, movement_type, quantity_change, balance_after, note)
                VALUES (?, ?, 'inbound', ?, ?, ?)
                `
            ).run(result.lastInsertRowid, shopId, item[8], item[8], "Initial seeded stock");
        }
    });

    tx();
}

runMigrations();
seedSuperAdmins();
seedAdminUser();
normalizeExistingData(ensureDefaultShop());
seedProducts();

module.exports = db;
