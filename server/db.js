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

function seedAdminUser() {
    const existingAdmin = db
        .prepare("SELECT id FROM users WHERE username = ?")
        .get("admin");

    if (!existingAdmin) {
        const passwordHash = bcrypt.hashSync("Admin@123", 10);
        db.prepare(
            `
            INSERT INTO users (full_name, username, password_hash, role)
            VALUES (?, ?, ?, ?)
            `
        ).run("System Administrator", "admin", passwordHash, "admin");
    }
}

function seedProducts() {
    const row = db.prepare("SELECT COUNT(*) AS count FROM products").get();
    if (row.count > 0) {
        return;
    }

    const insertProduct = db.prepare(
        `
        INSERT INTO products (
            code, brand, name, category, expiry_date, cost_price, sell_price, quantity, low_stock_threshold
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
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
            const result = insertProduct.run(...item);
            db.prepare(
                `
                INSERT INTO stock_movements (product_id, movement_type, quantity_change, balance_after, note)
                VALUES (?, 'inbound', ?, ?, ?)
                `
            ).run(result.lastInsertRowid, item[7], item[7], "Initial seeded stock");
        }
    });

    tx();
}

seedAdminUser();
seedProducts();

module.exports = db;
