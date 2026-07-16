# Professional Pharmacy POS

This project upgrades the original single HTML prototype into a structured local application with:

- Express backend
- SQLite database
- Login system
- Admin and cashier roles
- Inventory and inbound stock management
- Sales checkout and reporting
- Stock movement history
- Audit logs

## Default Admin Account

- Username: `admin`
- Password: `Admin@123`

Change this password after first use by creating a replacement admin account if needed.

## Project Structure

```text
.
|-- database/
|   |-- pharmacy-pos.db        # generated at runtime
|   `-- schema.sql
|-- public/
|   |-- app.js
|   |-- index.html
|   `-- styles.css
|-- server/
|   |-- db.js
|   `-- index.js
|-- package.json
`-- pharmacypos (1) (1).html   # original reference frame kept untouched
```

## Database Tables

- `users`: login accounts and roles
- `products`: inventory master records
- `sales`: sale headers and totals
- `sale_items`: products inside each sale
- `stock_movements`: inbound, sale, adjustment, and archive history
- `audit_logs`: login and system activity records

## Run The App

```bash
npm install
npm start
```

Open:

- `http://localhost:3000`

## Main Features

- Login-based access control
- Admin user management
- POS checkout with stock deduction
- Inventory edit and archive flow
- Inbound stock entry
- Daily and monthly sales reporting
- Low stock, expired, and expiring alerts
- Stock movement history
- Audit logging for sensitive actions
