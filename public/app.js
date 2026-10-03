const VENDOR_NAME = "KKS ortho clinic";

function getInitialActiveTab() {
    const fromHash = window.location.hash.replace(/^#/, "").trim();
    return fromHash || localStorage.getItem("pharmacy_active_tab") || "dashboard";
}

const state = {
    token: localStorage.getItem("pharmacy_token") || "",
    language: localStorage.getItem("pharmacy_lang") || "en",
    user: null,
    summary: {},
    products: [],
    recentSales: [],
    sales: [],
    alerts: { lowStock: [], expired: [], expiringSoon: [] },
    movements: [],
    logs: [],
    users: [],
    suppliers: [],
    customers: [],
    expenses: [],
    chart: { weeklySales: [], bestSellers: [] },
    cart: [],
    posCategory: "all",
    posCategoryOpen: false,
    posSearchOpen: false,
    checkingOut: false,
    posProductPage: 1,
    posProductTotalPages: 1,
    activeTab: getInitialActiveTab(),
    pagination: {
        inventory: 1,
        sales: 1,
        history: 1,
        users: 1,
        suppliers: 1,
        customers: 1,
        expenses: 1,
        alertLow: 1,
        alertExpired: 1,
        alertExpiring: 1
    },
    receiptSale: null,
    activeAlertView: "low",
    loadingRequests: 0
};

const adminTabs = new Set(["history", "users", "suppliers", "expenses"]);
const availableTabs = new Set(["dashboard", "pos", "inventory", "sales", "alerts", "history", "suppliers", "customers", "expenses", "users", "account"]);
const POS_CATEGORIES = [
    { id: "all", label: "All items", icon: "layout-grid", terms: [] },
    { id: "tablets", label: "Tablets & Capsules", icon: "pill", terms: ["tablet", "capsule", "pill", "oral", "analgesic", "antibiotic", "vitamin", "supplement", "pain relief"] },
    { id: "liquids", label: "Syrups & Liquids", icon: "flask-conical", terms: ["syrup", "liquid", "suspension", "solution", "drops", "cold relief", "cough", "flu"] },
    { id: "injections", label: "Injections", icon: "syringe", terms: ["injection", "injectable", "ampoule", "vial", "vaccine"] },
    { id: "supplies", label: "Syringes & Supplies", icon: "briefcase-medical", terms: ["syringe", "needle", "cannula", "glove", "mask", "medical supply"] },
    { id: "electronics", label: "Medical Electronics", icon: "activity", terms: ["electronic", "device", "machine", "monitor", "nebulizer", "thermometer", "oximeter", "glucometer"] },
    { id: "first-aid", label: "First Aid", icon: "cross", terms: ["first aid", "bandage", "gauze", "plaster", "antiseptic", "dressing"] },
    { id: "personal-care", label: "Personal Care", icon: "heart-pulse", terms: ["personal care", "hygiene", "skin", "cream", "ointment", "lotion", "soap"] }
];
const PAGE_SIZES = {
    inventory: 8,
    sales: 8,
    history: 8,
    users: 8,
    suppliers: 8,
    customers: 8,
    expenses: 8,
    alertLow: 8,
    alertExpired: 8,
    alertExpiring: 8
};

const translations = {
    en: {
        login_title: "Secure pharmacy operations",
        login_subtitle: "Inventory, sales, admin control, receipt printing, and audit history.",
        sign_in: "Sign In",
        default_admin: "Default Admin",
        username: "Username",
        password: "Password",
        dashboard: "Dashboard",
        pos: "POS",
        inventory: "Inventory",
        sales: "Sales",
        alerts: "Alerts",
        inbound: "Inbound",
        history: "Stock History",
        logs: "Audit Logs",
        users: "Users",
        account: "Account",
        more: "More",
        logout: "Logout",
        recent_sales: "Recent Sales",
        pdf_report: "PDF Report",
        invoice: "Invoice",
        date: "Date",
        cashier: "Cashier",
        total: "Total",
        profit: "Profit",
        actions: "Actions",
        current_cart: "Current Cart",
        subtotal: "Subtotal",
        discount: "Discount",
        complete_sale: "Complete Sale",
        inventory_register: "Inventory Register",
        product_code: "Code",
        brand: "Brand",
        product_name: "Product Name",
        category: "Category",
        expiry_date: "Expiry",
        sell_price: "Sell Price",
        quantity: "Qty",
        status: "Status",
        inbound_stock_entry: "Inbound Stock Entry",
        cost_price: "Cost Price",
        low_stock_threshold: "Low Stock Threshold",
        save_inbound: "Save Inbound",
        sales_report: "Sales Report",
        daily: "Daily",
        monthly: "Monthly",
        items: "Items",
        low_stock: "Low Stock",
        expired: "Expired",
        expiring_soon: "Expiring Soon",
        stock_history: "Stock History",
        time: "Time",
        type: "Type",
        qty_change: "Qty Change",
        balance: "Balance",
        actor: "Actor",
        note: "Note",
        audit_logs: "Audit Logs",
        action: "Action",
        entity: "Entity",
        description: "Description",
        create_user: "Create User",
        full_name: "Full Name",
        role: "Role",
        role_cashier: "Cashier",
        role_admin: "Admin",
        user_accounts: "User Accounts",
        created: "Created",
        suppliers: "Suppliers",
        customers: "Customers",
        expenses: "Expenses",
        add_supplier: "Add Supplier",
        add_customer: "Add Customer",
        add_expense: "Add Expense",
        supplier_name: "Supplier Name",
        customer_name: "Customer Name",
        phone: "Phone",
        balance_owed: "Balance Owed",
        credit_balance: "Credit Balance",
        amount: "Amount",
        page_suppliers: "Suppliers",
        page_customers: "Customers",
        page_expenses: "Expenses",
        weekly_sales_chart: "Weekly Sales",
        best_sellers: "Best-Sellers",
        account_security: "Account Security",
        current_password: "Current Password",
        new_password: "New Password",
        confirm_password: "Confirm Password",
        change_password: "Change Password",
        system_tools: "System Tools",
        export_excel: "Export Excel",
        backup_json: "Backup JSON",
        edit_product: "Edit Product",
        cancel: "Cancel",
        save_changes: "Save Changes",
        receipt_preview: "Receipt Preview",
        print_receipt: "Print Receipt",
        page_dashboard: "Dashboard",
        page_pos: "POS",
        page_inventory: "Inventory",
        page_sales: "Sales",
        page_alerts: "Alerts",
        page_inbound: "Inbound",
        page_history: "Stock History",
        page_logs: "Audit Logs",
        page_users: "Users",
        page_account: "Account",
        metric_total_products: "Total Products",
        metric_inventory_value: "Inventory Value",
        metric_low_stock: "Low Stock Items",
        metric_expired: "Expired Items",
        metric_today_sales: "Today's Sales",
        metric_today_profit: "Today's Profit",
        good: "Good",
        low_stock_status: "Low Stock",
        expired_status: "Expired",
        active: "Active",
        inactive: "Inactive",
        add: "Add",
        stock: "Stock",
        no_products: "No products found.",
        no_cart: "No items in cart.",
        no_recent_sales: "No recent sales yet.",
        no_sales: "No sales found for the selected period.",
        no_alerts: "No records.",
        no_history: "No stock movement history yet.",
        no_logs: "No audit logs yet.",
        no_users: "No user accounts yet.",
        no_inventory: "No inventory items found.",
        search_products: "Search products",
        search_inventory: "Search inventory",
        confirm_archive: "Archive this product?",
        archive: "Archive",
        no_brand: "No brand",
        general: "General",
        print: "Print",
        edit: "Edit",
        role_label_admin: "ADMIN",
        role_label_cashier: "CASHIER",
        msg_signed_in: "Signed in successfully.",
        msg_signed_out: "Signed out successfully.",
        msg_sale_complete: "Sale completed successfully.",
        msg_inbound_saved: "Inbound stock saved successfully.",
        msg_product_updated: "Product updated successfully.",
        msg_product_archived: "Product archived successfully.",
        msg_user_created: "User created successfully.",
        msg_password_changed: "Password changed successfully.",
        msg_password_mismatch: "New password and confirmation do not match.",
        msg_expired_sell: "Expired products cannot be sold.",
        msg_out_of_stock: "This product is out of stock.",
        msg_qty_exceeds: "Requested quantity exceeds available stock.",
        msg_receipt_unavailable: "Receipt data is not available.",
        msg_no_sales_pdf: "No sales available for PDF export.",
        sales_count: "Sales Count",
        report_total_sales: "Report Total",
        report_total_profit: "Report Profit",
        print_save_pdf: "Print / Save PDF"
    },
    mm: {
        login_title: "ဆေးဆိုင်လုပ်ငန်းအတွက် ယုံကြည်စိတ်ချရသော စနစ်",
        login_subtitle: "ကုန်ပစ္စည်းစာရင်း၊ အရောင်း၊ အသုံးပြုသူခွင့်ပြုချက်၊ ဘောင်ချာထုတ်ခြင်းနှင့် မှတ်တမ်းစီမံမှုကို တစ်နေရာတည်းမှာ အသုံးပြုနိုင်ပါသည်။",
        sign_in: "ဝင်မည်",
        default_admin: "စတင်အသုံးပြုရန် အက်ဒမင်အကောင့်",
        username: "အသုံးပြုသူအမည်",
        password: "စကားဝှက်",
        dashboard: "ဒက်ရှ်ဘုတ်",
        pos: "အရောင်းကောင်တာ",
        inventory: "ဂိုဒေါင်",
        sales: "အရောင်း",
        alerts: "သတိပေးချက်",
        inbound: "ပစ္စည်းသွင်း",
        history: "စတော့မှတ်တမ်း",
        logs: "လှုပ်ရှားမှုမှတ်တမ်း",
        users: "အသုံးပြုသူများ",
        account: "အကောင့်",
        more: "ပိုမို",
        logout: "ထွက်မည်",
        recent_sales: "နောက်ဆုံးအရောင်းများ",
        pdf_report: "PDF အစီရင်ခံစာ",
        invoice: "ဘောင်ချာ",
        date: "ရက်စွဲ",
        cashier: "ငွေကောက်သူ",
        total: "စုစုပေါင်း",
        profit: "အမြတ်",
        actions: "လုပ်ဆောင်ချက်",
        current_cart: "လက်ရှိဘောင်ချာ",
        subtotal: "မူလစုစုပေါင်း",
        discount: "လျှော့ဈေး",
        complete_sale: "အရောင်းအတည်ပြုမည်",
        inventory_register: "ဂိုဒေါင်စာရင်း",
        product_code: "ကုဒ်",
        brand: "အမှတ်တံဆိပ်",
        product_name: "ပစ္စည်းအမည်",
        category: "အမျိုးအစား",
        expiry_date: "သက်တမ်းကုန်ရက်",
        sell_price: "ရောင်းဈေး",
        quantity: "အရေအတွက်",
        status: "အခြေအနေ",
        inbound_stock_entry: "ပစ္စည်းသွင်းခြင်း",
        cost_price: "ဝယ်ရင်းဈေး",
        low_stock_threshold: "အနည်းဆုံးစတော့သတ်မှတ်ချက်",
        save_inbound: "သိမ်းမည်",
        sales_report: "အရောင်းအစီရင်ခံစာ",
        daily: "နေ့စဉ်",
        monthly: "လစဉ်",
        items: "ပစ္စည်းများ",
        low_stock: "စတော့နည်း",
        expired: "သက်တမ်းကုန်",
        expiring_soon: "မကြာမီသက်တမ်းကုန်မည်",
        stock_history: "စတော့လှုပ်ရှားမှုမှတ်တမ်း",
        time: "အချိန်",
        type: "အမျိုးအစား",
        qty_change: "ပြောင်းလဲမှု",
        balance: "လက်ကျန်",
        actor: "လုပ်ဆောင်သူ",
        note: "မှတ်ချက်",
        audit_logs: "စနစ်မှတ်တမ်း",
        action: "လုပ်ဆောင်ချက်",
        entity: "အမျိုးအစား",
        description: "အသေးစိတ်",
        create_user: "အသုံးပြုသူအသစ်ဖန်တီးမည်",
        full_name: "အမည်အပြည့်အစုံ",
        role: "အခန်းကဏ္ဍ",
        role_cashier: "ငွေကောက်သူ",
        role_admin: "အက်ဒမင်",
        user_accounts: "အသုံးပြုသူအကောင့်များ",
        created: "ဖန်တီးချိန်",
        account_security: "အကောင့်လုံခြုံရေး",
        current_password: "လက်ရှိစကားဝှက်",
        new_password: "စကားဝှက်အသစ်",
        confirm_password: "စကားဝှက်ထပ်မံအတည်ပြု",
        change_password: "စကားဝှက်ပြောင်းမည်",
        system_tools: "စနစ်ကိရိယာများ",
        export_excel: "Excel ထုတ်မည်",
        edit_product: "ပစ္စည်းပြင်မည်",
        cancel: "မလုပ်တော့ပါ",
        save_changes: "ပြင်ဆင်ချက်သိမ်းမည်",
        receipt_preview: "ဘောင်ချာကြိုကြည့်ရန်",
        print_receipt: "ဘောင်ချာပရင့်",
        page_dashboard: "ဒက်ရှ်ဘုတ်",
        page_pos: "အရောင်းကောင်တာ",
        page_inventory: "ဂိုဒေါင်",
        page_sales: "အရောင်း",
        page_alerts: "သတိပေးချက်",
        page_inbound: "ပစ္စည်းသွင်း",
        suppliers: "ပေးသွင်းသူများ",
        customers: "ဖောက်သည်များ",
        expenses: "အသုံးစရိတ်",
        add_supplier: "ပေးသွင်းသူ ထည့်မည်",
        add_customer: "ဖောက်သည် ထည့်မည်",
        add_expense: "အသုံးစရိတ် ထည့်မည်",
        supplier_name: "ပေးသွင်းသူ အမည်",
        customer_name: "ဖောက်သည် အမည်",
        phone: "ဖုန်းနံပါတ်",
        balance_owed: "ပေးရန်ကျန်ငွေ",
        credit_balance: "အကြွေးကျန်ငွေ",
        amount: "ငွေပမာဏ",
        page_suppliers: "ပေးသွင်းသူများ",
        page_customers: "ဖောက်သည်များ",
        page_expenses: "အသုံးစရိတ်",
        weekly_sales_chart: "အပတ်စဉ် ရောင်းအား",
        best_sellers: "အရောင်းရဆုံး ပစ္စည်းများ",
        backup_json: "JSON အရန်ဖိုင်",
        page_history: "စတော့မှတ်တမ်း",
        page_logs: "လှုပ်ရှားမှုမှတ်တမ်း",
        page_users: "အသုံးပြုသူများ",
        page_account: "အကောင့်",
        metric_total_products: "ပစ္စည်းစုစုပေါင်း",
        metric_inventory_value: "ဂိုဒေါင်တန်ဖိုး",
        metric_low_stock: "စတော့နည်းသောပစ္စည်း",
        metric_expired: "သက်တမ်းကုန်ပစ္စည်း",
        metric_today_sales: "ယနေ့အရောင်း",
        metric_today_profit: "ယနေ့အမြတ်",
        good: "ကောင်း",
        low_stock_status: "စတော့နည်း",
        expired_status: "သက်တမ်းကုန်",
        active: "အသုံးပြုနိုင်",
        inactive: "ပိတ်ထား",
        add: "ထည့်မည်",
        stock: "စတော့",
        no_products: "ပစ္စည်းမတွေ့ပါ။",
        no_cart: "ဘောင်ချာထဲတွင် ပစ္စည်းမရှိသေးပါ။",
        no_recent_sales: "မကြာသေးမီက အရောင်းမရှိသေးပါ။",
        no_sales: "ရွေးထားသောကာလအတွက် အရောင်းမရှိပါ။",
        no_alerts: "မှတ်တမ်းမရှိပါ။",
        no_history: "စတော့လှုပ်ရှားမှုမှတ်တမ်းမရှိသေးပါ။",
        no_logs: "စနစ်မှတ်တမ်းမရှိသေးပါ။",
        no_users: "အသုံးပြုသူအကောင့်မရှိသေးပါ။",
        no_inventory: "ဂိုဒေါင်စာရင်းမတွေ့ပါ။",
        search_products: "ပစ္စည်းရှာရန်",
        search_inventory: "ဂိုဒေါင်ရှာရန်",
        confirm_archive: "ဤပစ္စည်းကို archive လုပ်မလား?",
        archive: "Archive",
        no_brand: "Brand မရှိ",
        general: "အထွေထွေ",
        print: "ပရင့်",
        edit: "ပြင်မည်",
        role_label_admin: "အက်ဒမင်",
        role_label_cashier: "ငွေကောက်သူ",
        msg_signed_in: "အောင်မြင်စွာ ဝင်ရောက်ပြီးပါပြီ။",
        msg_signed_out: "အောင်မြင်စွာ ထွက်ပြီးပါပြီ။",
        msg_sale_complete: "အရောင်းအောင်မြင်စွာ ပြီးမြောက်ပါပြီ။",
        msg_inbound_saved: "ပစ္စည်းသွင်းမှု အောင်မြင်စွာ သိမ်းပြီးပါပြီ။",
        msg_product_updated: "ပစ္စည်းအချက်အလက် ပြင်ဆင်ပြီးပါပြီ။",
        msg_product_archived: "ပစ္စည်းကို archive လုပ်ပြီးပါပြီ။",
        msg_user_created: "အသုံးပြုသူအသစ် ဖန်တီးပြီးပါပြီ။",
        msg_password_changed: "စကားဝှက် ပြောင်းပြီးပါပြီ။",
        msg_password_mismatch: "စကားဝှက်အသစ်နှင့် အတည်ပြုချက် မကိုက်ညီပါ။",
        msg_expired_sell: "သက်တမ်းကုန်ပစ္စည်း မရောင်းနိုင်ပါ။",
        msg_out_of_stock: "စတော့ မရှိတော့ပါ။",
        msg_qty_exceeds: "တောင်းဆိုသောအရေအတွက်သည် လက်ကျန်စတော့ထက်များနေပါသည်။",
        msg_receipt_unavailable: "ဘောင်ချာဒေတာ မရနိုင်ပါ။",
        msg_no_sales_pdf: "PDF ထုတ်ရန် အရောင်းဒေတာမရှိပါ။",
        sales_count: "အရောင်းအရေအတွက်",
        report_total_sales: "အစီရင်ခံစာစုစုပေါင်း",
        report_total_profit: "အစီရင်ခံစာအမြတ်",
        print_save_pdf: "ပရင့် / PDF သိမ်းမည်"
    }
};

function syncMobileFooterHeight() {
    const footer = document.getElementById("mobile-footer");
    const height = footer && footer.offsetParent !== null ? footer.offsetHeight : 0;
    document.documentElement.style.setProperty("--mobile-footer-h", `${height || 76}px`);
}

window.addEventListener("resize", syncMobileFooterHeight);
window.addEventListener("orientationchange", syncMobileFooterHeight);

document.addEventListener("DOMContentLoaded", () => {
    syncMobileFooterHeight();
    setDefaultDates();
    bindEvents();
    initDeviceSettings();
    applyTranslations();
    bootstrapAuth();
    lucide.createIcons();
});

function $(id) {
    return document.getElementById(id);
}

function t(key) {
    return translations[state.language]?.[key] || translations.en[key] || key;
}

// Local calendar date. toISOString() is UTC and would report the wrong day for
// any browser whose offset has already rolled past (or not yet reached) midnight.
function todayIso() {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${now.getFullYear()}-${month}-${day}`;
}

function setDefaultDates() {
    const today = todayIso();
    const month = today.slice(0, 7);
    $("sales-date-filter").value = today;
    $("sales-month-filter").value = month;
    $("expense-date").value = today;
}

function bindEvents() {
    $("login-form").addEventListener("submit", handleLogin);
    document.querySelectorAll("[data-login-role]").forEach((button) => {
        button.addEventListener("click", () => setLoginRole(button.dataset.loginRole));
    });
    $("logout-button").addEventListener("click", handleLogout);
    $("topbar-account-button").addEventListener("click", () => switchTab("account"));
    $("mobile-menu-button").addEventListener("click", openSidebar);
    $("mobile-more-button").addEventListener("click", openSidebar);
    $("sidebar-close-button").addEventListener("click", closeSidebar);
    $("drawer-overlay").addEventListener("click", closeSidebar);
    $("sidebar-nav").addEventListener("click", handleNavigationClick);
    $("mobile-footer").addEventListener("click", handleNavigationClick);
    $("pos-search").addEventListener("focus", () => {
        state.posSearchOpen = true;
        state.posCategoryOpen = false;
        state.posCategory = "all";
        state.posProductPage = 1;
        renderPOSCategories();
        renderPOSProducts();
    });
    $("pos-search").addEventListener("input", () => {
        state.posSearchOpen = true;
        state.posProductPage = 1;
        renderPOSProducts();
    });
    $("pos-categories").addEventListener("click", handlePOSCategoryClick);
    $("pos-product-dots").addEventListener("click", handlePOSProductPageClick);
    $("login-password-toggle").addEventListener("click", toggleLoginPassword);
    $("pos-discount").addEventListener("input", renderCart);
    $("checkout-button").addEventListener("click", handleCheckout);
    $("inventory-search").addEventListener("input", () => {
        state.pagination.inventory = 1;
        renderInventory();
    });
    $("open-inbound-button").addEventListener("click", openInboundModal);
    $("close-inbound-modal").addEventListener("click", closeInboundModal);
    $("inbound-modal").addEventListener("click", (event) => {
        if (event.target === $("inbound-modal")) closeInboundModal();
    });
    $("receipt-done-button").addEventListener("click", () => $("receipt-modal").classList.add("hidden"));
    $("inbound-form").addEventListener("submit", handleInboundSubmit);
    bindBulkInbound();
    $("sales-report-type").addEventListener("change", handleSalesFilterChange);
    $("sales-date-filter").addEventListener("change", loadFilteredSalesAndRender);
    $("sales-month-filter").addEventListener("change", loadFilteredSalesAndRender);
    $("dashboard-print-report-button").addEventListener("click", printSalesReport);
    $("sales-print-report-button").addEventListener("click", printSalesReport);
    $("account-print-report").addEventListener("click", printSalesReport);
    $("account-export-excel").addEventListener("click", () => downloadAuthenticatedFile("/api/export/excel"));
    $("account-backup-json").addEventListener("click", () => downloadAuthenticatedFile("/api/export/backup"));
    $("user-form").addEventListener("submit", handleCreateUser);
    $("product-form").addEventListener("submit", handleSaveProduct);
    $("close-product-modal").addEventListener("click", closeProductModal);
    $("cancel-product-modal").addEventListener("click", closeProductModal);
    $("receipt-close-button").addEventListener("click", closeReceiptModal);
    $("receipt-print-button").addEventListener("click", handlePrintReceipt);
    $("password-form").addEventListener("submit", handlePasswordChange);
    document.addEventListener("click", handlePagerClick);
    let resizeTimer = null;
    window.addEventListener("resize", () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            if (!state.user) return;
            renderInventory(); renderSales(); renderMovements(); renderUsers();
            renderSuppliers(); renderCustomers(); renderExpenses(); renderAlerts();
            lucide.createIcons();
        }, 200);
    });
    document.addEventListener("keydown", (event) => {
        // A hardware scanner ends its burst with Enter; inside a scan field that
        // would submit the form before the operator finished the rest of it.
        if (event.key === "Enter" && event.target.matches?.("[data-scan-field]")) {
            event.preventDefault();
        }
    });
    document.addEventListener("pointerdown", (event) => {
        if (state.posSearchOpen && !event.target.closest(".pos-browser")) {
            state.posSearchOpen = false;
            renderPOSProducts();
        }
    });
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && state.posSearchOpen) {
            state.posSearchOpen = false;
            renderPOSProducts();
        }
    });

    document.querySelectorAll("[data-lang]").forEach((button) => {
        button.addEventListener("click", () => setLanguage(button.dataset.lang));
    });

    document.querySelector(".pos-browser").addEventListener("click", (event) => {
        const button = event.target.closest("[data-add-id]");
        if (button) {
            addToCart(Number(button.dataset.addId));
        }
    });

    $("cart-items").addEventListener("click", (event) => {
        const actionButton = event.target.closest("[data-cart-action]");
        if (!actionButton) {
            return;
        }

        const productId = Number(actionButton.dataset.id);
        const action = actionButton.dataset.cartAction;

        if (action === "increase") {
            updateCartQuantity(productId, 1);
        } else if (action === "decrease") {
            updateCartQuantity(productId, -1);
        } else if (action === "remove") {
            removeFromCart(productId);
        }
    });

    $("cart-items").addEventListener("change", (event) => {
        const quantityInput = event.target.closest("[data-cart-quantity]");

        if (quantityInput) {
            setCartQuantity(Number(quantityInput.dataset.id), Number(quantityInput.value));
        }
    });

    $("inventory-table-body").addEventListener("click", (event) => {
        const editButton = event.target.closest("[data-edit-product]");
        const deleteButton = event.target.closest("[data-delete-product]");
        const row = event.target.closest("tr[data-product-id]");

        if (deleteButton) {
            deleteProduct(Number(deleteButton.dataset.deleteProduct));
        } else if (editButton) {
            openProductModal(Number(editButton.dataset.editProduct));
        } else if (row) {
            openProductModal(Number(row.dataset.productId));
        }
    });

    $("suppliers-table-body").addEventListener("click", (event) => {
        const ledgerButton = event.target.closest("[data-ledger-type]");
        const deleteButton = event.target.closest("[data-delete-supplier]");
        const row = event.target.closest("tr[data-ledger-row]");
        if (deleteButton) handleDeleteSupplier(Number(deleteButton.dataset.deleteSupplier));
        else if (ledgerButton) openLedgerModal(ledgerButton.dataset.ledgerType, Number(ledgerButton.dataset.ledgerId));
        else if (row) openLedgerModal("supplier", Number(row.dataset.ledgerRow));
    });
    $("customers-table-body").addEventListener("click", (event) => {
        const ledgerButton = event.target.closest("[data-ledger-type]");
        const deleteButton = event.target.closest("[data-delete-customer]");
        const row = event.target.closest("tr[data-ledger-row]");
        if (deleteButton) handleDeleteCustomer(Number(deleteButton.dataset.deleteCustomer));
        else if (ledgerButton) openLedgerModal(ledgerButton.dataset.ledgerType, Number(ledgerButton.dataset.ledgerId));
        else if (row) openLedgerModal("customer", Number(row.dataset.ledgerRow));
    });
    $("expenses-table-body").addEventListener("click", (event) => {
        const deleteButton = event.target.closest("[data-delete-expense]");
        if (deleteButton) handleDeleteExpense(Number(deleteButton.dataset.deleteExpense));
    });
    $("history-search").addEventListener("input", () => { state.pagination.history = 1; renderMovements(); lucide.createIcons(); });
    $("history-type").addEventListener("change", () => { state.pagination.history = 1; renderMovements(); });
    $("alert-search").addEventListener("input", () => { state.pagination.alertLow = 1; state.pagination.alertExpired = 1; state.pagination.alertExpiring = 1; renderAlerts(); });
    bindPOSSwipe();
    $("supplier-form").addEventListener("submit", handleCreateSupplier);
    $("inbound-new-supplier-toggle").addEventListener("click", () => {
        $("inbound-new-supplier").classList.toggle("hidden");
        $("inbound-new-supplier-name").focus();
    });
    $("inbound-new-supplier-save").addEventListener("click", handleInboundQuickSupplier);
    $("customer-form").addEventListener("submit", handleCreateCustomer);
    $("expense-form").addEventListener("submit", handleCreateExpense);
    $("ledger-close-button").addEventListener("click", closeLedgerModal);
    $("ledger-modal").addEventListener("click", (event) => {
        if (event.target === $("ledger-modal")) closeLedgerModal();
    });
    $("ledger-form").addEventListener("submit", handleLedgerSubmit);

    $("history-table-body").addEventListener("click", handleHistoryRowAction);
    $("dashboard-sales-body").addEventListener("click", handleSaleActionClick);
    $("sales-table-body").addEventListener("click", handleSaleActionClick);
    $("summary-cards").addEventListener("click", handleSummaryCardClick);
    document.querySelector(".alert-view-switch")?.addEventListener("click", (event) => {
        const button = event.target.closest("[data-alert-view]");
        if (button) {
            setAlertView(button.dataset.alertView);
        }
    });

    window.addEventListener("resize", () => {
        if (window.innerWidth > 900) {
            closeSidebar();
        }
    });

    window.addEventListener("hashchange", () => {
        if (!state.user) {
            return;
        }
        const hashTab = normalizeTab(window.location.hash.replace(/^#/, "").trim() || "dashboard");
        if (hashTab !== state.activeTab) {
            switchTab(hashTab);
        }
    });
}

function setLanguage(language) {
    state.language = language === "mm" ? "mm" : "en";
    localStorage.setItem("pharmacy_lang", state.language);
    applyTranslations();
    renderAll();
}

function applyTranslations() {
    document.documentElement.lang = state.language === "mm" ? "my" : "en";
    document.title = `${VENDOR_NAME} POS`;

    document.querySelectorAll("[data-i18n]").forEach((element) => {
        element.textContent = t(element.dataset.i18n);
    });

    document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
        element.placeholder = t(element.dataset.i18nPlaceholder);
    });

    document.querySelectorAll("[data-lang]").forEach((button) => {
        button.classList.toggle("active", button.dataset.lang === state.language);
    });

    if (state.user) {
        renderUserPanels();
        updatePageTitle();
    }
}

function formatCurrency(value) {
    const amount = Number(value || 0).toLocaleString("en-US");
    return state.language === "mm" ? `${amount} ကျပ်` : `${amount} MMK`;
}

function parseDateValue(value) {
    if (!value) {
        return null;
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        const [year, month, day] = value.split("-").map(Number);
        return new Date(year, month - 1, day);
    }

    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)) {
        return new Date(value.replace(" ", "T"));
    }

    return new Date(value);
}

function formatDate(value) {
    const date = parseDateValue(value);
    if (!date || Number.isNaN(date.getTime())) {
        return "-";
    }
    return date.toLocaleDateString(state.language === "mm" ? "my-MM" : "en-GB");
}

function formatDateTime(value) {
    const date = parseDateValue(value);
    if (!date || Number.isNaN(date.getTime())) {
        return "-";
    }
    return date.toLocaleString(state.language === "mm" ? "my-MM" : "en-GB");
}

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

function showNotification(message, type = "success") {
    const notification = $("notification");
    notification.textContent = message;
    notification.className = `notification ${type === "error" ? "error" : ""}`;
    notification.setAttribute("role", type === "error" ? "alert" : "status");
    notification.classList.remove("hidden");

    setTimeout(() => {
        notification.classList.add("hidden");
    }, 3200);
}

function setLoading(isLoading) {
    state.loadingRequests = Math.max(0, state.loadingRequests + (isLoading ? 1 : -1));
    document.body.classList.toggle("is-loading", state.loadingRequests > 0);
}

const reportedIssues = new Map();

// Sends a problem to the server log (deduplicated per minute) so it can be reviewed later by the super admin.
function reportIssue(level, source, message, context = {}) {
    const key = `${source}:${message}`;
    const now = Date.now();
    if (now - (reportedIssues.get(key) || 0) < 60000 || reportedIssues.size > 200) return;
    reportedIssues.set(key, now);
    try {
        fetch("/api/client-log", {
            method: "POST",
            keepalive: true,
            headers: {
                "Content-Type": "application/json",
                ...(state.token ? { Authorization: `Bearer ${state.token}` } : {})
            },
            body: JSON.stringify({ level, source, message: String(message), context: { page: location.hash || "/", ...context } })
        }).catch(() => {});
    } catch (error) { /* logging must never break the app */ }
}

window.addEventListener("error", (event) => {
    reportIssue("error", "js", event.message || "Script error", { file: event.filename, line: event.lineno, col: event.colno });
});
window.addEventListener("unhandledrejection", (event) => {
    reportIssue("error", "promise", event.reason?.message || String(event.reason));
});

async function api(url, options = {}) {
    let loadingShown = false;
    const delayTimer = window.setTimeout(() => {
        loadingShown = true;
        setLoading(true);
    }, 180);
    try {
        const response = await fetch(url, {
            method: options.method || "GET",
            headers: {
                Accept: "application/json",
                ...(options.body ? { "Content-Type": "application/json" } : {}),
                ...(state.token ? { Authorization: `Bearer ${state.token}` } : {})
            },
            body: options.body ? JSON.stringify(options.body) : undefined
        }).catch((error) => {
            reportIssue("error", "network", `${options.method || "GET"} ${url}: ${error.message}`);
            throw error;
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
            if (response.status === 401 && !options.ignoreUnauthorized) clearSession();
            if (payload.code === "SHOP_ACCESS_REVOKED") clearSession();
            throw new Error(payload.message || "Request failed.");
        }
        return payload;
    } finally {
        window.clearTimeout(delayTimer);
        if (loadingShown) setLoading(false);
    }
}

function clearSession() {
    state.token = "";
    state.user = null;
    state.cart = [];
    localStorage.removeItem("pharmacy_token");
    showLogin();
}

function redirectToSuperAdmin(token) {
    if (token) {
        localStorage.setItem("super_token", token);
    }
    localStorage.removeItem("pharmacy_token");
    window.location.assign("/super");
}

async function bootstrapAuth() {
    if (!state.token) {
        showLogin();
        return;
    }

    try {
        const response = await api("/api/auth/me");
        if (response.user?.role === "super_admin") {
            redirectToSuperAdmin(state.token);
            return;
        }
        state.user = response.user;
        showApp();
        await loadInitialData();
    } catch (_error) {
        clearSession();
    }
}

function showLogin() {
    const splash = $("boot-splash");
    if (splash) {
        splash.classList.add("hidden");
    }
    $("login-screen").classList.remove("hidden");
    $("app-shell").classList.add("hidden");
}

function showApp() {
    const splash = $("boot-splash");
    if (splash) {
        splash.classList.add("hidden");
    }
    $("login-screen").classList.add("hidden");
    $("app-shell").classList.remove("hidden");
    updateAdminVisibility();
    renderUserPanels();
    updatePageTitle();
    lucide.createIcons();
}

function updateAdminVisibility() {
    const isAdmin = state.user?.role === "admin";
    document.querySelectorAll(".admin-only").forEach((element) => {
        element.classList.toggle("hidden", !isAdmin);
    });

    if (!isAdmin && adminTabs.has(state.activeTab)) {
        state.activeTab = "dashboard";
        localStorage.setItem("pharmacy_active_tab", state.activeTab);
    }
}

function renderUserPanels() {
    if (!state.user) {
        return;
    }

    const roleLabel = state.user.role === "admin" ? t("role_label_admin") : t("role_label_cashier");
    $("current-user-name").textContent = state.user.fullName;
    $("current-user-role").textContent = roleLabel;
    $("account-name").textContent = state.user.fullName;
    $("account-username").textContent = state.user.username;
    $("account-role").textContent = roleLabel;
}

function updatePageTitle() {
    const pageTitle = $("page-title");
    if (pageTitle) {
        pageTitle.textContent = t(`page_${state.activeTab}`);
    }
}

function handleNavigationClick(event) {
    const button = event.target.closest("[data-tab]");
    if (!button) {
        return;
    }
    switchTab(button.dataset.tab);
}

function normalizeTab(tab) {
    if (tab === "inbound") {
        return "inventory";
    }
    if (!availableTabs.has(tab)) {
        return "dashboard";
    }
    if (adminTabs.has(tab) && state.user?.role !== "admin") {
        return "dashboard";
    }
    return tab;
}

function switchTab(tab) {
    closeInboundModal();
    state.activeTab = normalizeTab(tab);
    localStorage.setItem("pharmacy_active_tab", state.activeTab);
    const nextUrl = `${window.location.pathname}${window.location.search}#${state.activeTab}`;
    if (`#${state.activeTab}` !== window.location.hash) {
        window.history.replaceState(null, "", nextUrl);
    }
    document.querySelectorAll(".view-section").forEach((section) => {
        section.classList.toggle("hidden", section.dataset.view !== state.activeTab);
    });

    document.querySelectorAll("[data-tab]").forEach((button) => {
        button.classList.toggle(
            button.classList.contains("footer-button") ? "footer-button-active" : "nav-button-active",
            button.dataset.tab === state.activeTab
        );
    });

    updatePageTitle();
    closeSidebar();
}

function openSidebar() {
    if (window.innerWidth <= 980) {
        $("sidebar-toggle").checked = false;
    }
    $("app-sidebar").classList.add("open");
    $("drawer-overlay").classList.remove("hidden");
}

function closeSidebar() {
    $("app-sidebar").classList.remove("open");
    $("drawer-overlay").classList.add("hidden");
}

async function handleLogin(event) {
    event.preventDefault();

    try {
        const response = await api("/api/auth/login", {
            method: "POST",
            body: {
                username: $("login-username").value.trim(),
                password: $("login-password").value
            }
        });

        if (response.user?.role === "super_admin") {
            redirectToSuperAdmin(response.token);
            return;
        }

        state.token = response.token;
        state.user = response.user;
        localStorage.setItem("pharmacy_token", state.token);
        showApp();
        await loadInitialData();
        showNotification(t("msg_signed_in"));
    } catch (error) {
        showNotification(error.message, "error");
    }
}

function setLoginRole(role) {
    const isAdmin = role === "admin";
    document.querySelectorAll("[data-login-role]").forEach((button) => {
        const active = button.dataset.loginRole === (isAdmin ? "admin" : "cashier");
        button.classList.toggle("active", active);
        button.setAttribute("aria-pressed", String(active));
    });
    $("login-role-kicker").textContent = isAdmin ? "Administrator workspace" : "Staff workspace";
    $("login-form-title").textContent = isAdmin ? "Administrator Sign In" : "Staff Sign In";
    $("login-role-description").textContent = isAdmin
        ? "Access inventory controls, reporting, user management, and operational oversight."
        : "Sign in to process sales, manage your cart, and view your daily work.";
    $("login-form").classList.toggle("admin-login", isAdmin);
}

function handleSummaryCardClick(event) {
    const card = event.target.closest("[data-summary-target]");
    if (!card) {
        return;
    }

    const target = card.dataset.summaryTarget;
    switchTab(target === "low" || target === "expired" ? "alerts" : target);
    if (target === "low" || target === "expired") {
        setAlertView(target);
    }
}

function setAlertView(view) {
    const validView = ["low", "expired", "expiring"].includes(view) ? view : "low";
    state.activeAlertView = validView;
    document.querySelectorAll("[data-alert-view]").forEach((button) => {
        const active = button.dataset.alertView === validView;
        button.classList.toggle("active", active);
        button.setAttribute("aria-selected", String(active));
    });
    document.querySelectorAll("[data-alert-panel]").forEach((panel) => {
        const active = panel.dataset.alertPanel === validView;
        panel.classList.toggle("active", active);
        panel.hidden = !active;
    });
}

async function handleLogout() {
    try {
        if (state.token) {
            await api("/api/auth/logout", { method: "POST", ignoreUnauthorized: true });
        }
    } catch (_error) {
        // Ignore logout API errors and clear local session.
    } finally {
        clearSession();
        showNotification(t("msg_signed_out"));
    }
}

async function loadInitialData() {
    const requests = [
        api("/api/dashboard/summary"),
        api("/api/products"),
        api("/api/sales"),
        loadFilteredSalesData(),
        api("/api/alerts"),
        api("/api/customers"),
        api("/api/dashboard/chart")
    ];

    if (state.user.role === "admin") {
        requests.push(api("/api/stock-movements"));
        requests.push(api("/api/users"));
        requests.push(api("/api/suppliers"));
        requests.push(api("/api/expenses"));
    }

    const results = await Promise.all(requests);
    state.summary = results[0];
    state.products = results[1].products;
    state.recentSales = results[2].sales.slice(0, 8);
    state.sales = results[3].sales;
    state.alerts = results[4];
    state.customers = results[5].customers;
    state.chart = results[6];

    if (state.user.role === "admin") {
        state.movements = results[7].movements;
        state.users = results[8].users;
        state.suppliers = results[9].suppliers;
        state.expenses = results[10].expenses;
    } else {
        state.movements = [];
        state.logs = [];
        state.users = [];
        state.suppliers = [];
        state.expenses = [];
    }

    renderAll();
}

async function loadFilteredSalesData() {
    const type = $("sales-report-type").value;
    const query = type === "monthly"
        ? `?month=${encodeURIComponent($("sales-month-filter").value)}`
        : `?date=${encodeURIComponent($("sales-date-filter").value)}`;

    return api(`/api/sales${query}`);
}

async function loadFilteredSalesAndRender() {
    try {
        state.pagination.sales = 1;
        const response = await loadFilteredSalesData();
        state.sales = response.sales;
        renderRecentSales();
        renderSales();
        lucide.createIcons();
    } catch (error) {
        showNotification(error.message, "error");
    }
}

function renderAll() {
    syncMobileFooterHeight();
    if (!state.user) {
        return;
    }
    updateAdminVisibility();
    renderUserPanels();
    renderSummary();
    renderRecentSales();
    renderPOSCategories();
    renderPOSProducts();
    renderCart();
    renderInventory();
    renderSales();
    renderAlerts();
    renderMovements();
    renderUsers();
    renderSuppliers();
    renderCustomers();
    renderExpenses();
    renderSalesChart();
    renderBestSellers();
    switchTab(state.activeTab);
    lucide.createIcons();
}

function getAdaptivePageSize(key) {
    const compact = window.innerWidth <= 980;
    const rowHeight = key === "history" ? (compact ? 64 : 58) : (compact ? 62 : 56);
    const available = window.innerHeight - (compact ? 245 : 300);
    return Math.min(30, Math.max(PAGE_SIZES[key] || 8, Math.floor(available / rowHeight)));
}

function getPageSlice(rows, key) {
    const pageSize = getAdaptivePageSize(key);
    const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
    state.pagination[key] = Math.min(Math.max(state.pagination[key] || 1, 1), totalPages);
    const start = (state.pagination[key] - 1) * pageSize;

    return {
        rows: rows.slice(start, start + pageSize),
        currentPage: state.pagination[key],
        totalPages
    };
}

function renderPager(containerId, key, totalPages) {
    const container = $(containerId);
    if (!container) {
        return;
    }

    if (totalPages <= 1) {
        container.innerHTML = "";
        return;
    }

    const currentPage = state.pagination[key] || 1;
    const pages = [];
    const radius = window.innerWidth <= 720 ? 1 : 2;
    const startPage = Math.max(1, currentPage - radius);
    const endPage = Math.min(totalPages, currentPage + radius);

    for (let page = startPage; page <= endPage; page += 1) {
        pages.push(`
            <button
                type="button"
                class="pager-button ${page === currentPage ? "pager-button-active" : ""}"
                data-page-key="${key}"
                data-page-number="${page}"
            >
                ${page}
            </button>
        `);
    }

    container.innerHTML = `
        <div class="pager-track">
            <button type="button" class="pager-arrow" data-page-key="${key}" data-page-number="${Math.max(1, currentPage - 1)}" ${currentPage === 1 ? "disabled" : ""}>‹</button>
            ${startPage > 1 ? `<button type="button" class="pager-button" data-page-key="${key}" data-page-number="1">1</button><span class="pager-gap">...</span>` : ""}
            ${pages.join("")}
            ${endPage < totalPages ? `<span class="pager-gap">...</span><button type="button" class="pager-button" data-page-key="${key}" data-page-number="${totalPages}">${totalPages}</button>` : ""}
            <button type="button" class="pager-arrow" data-page-key="${key}" data-page-number="${Math.min(totalPages, currentPage + 1)}" ${currentPage === totalPages ? "disabled" : ""}>›</button>
        </div>
    `;
}

function handlePagerClick(event) {
    const button = event.target.closest("[data-page-key][data-page-number]");
    if (!button) {
        return;
    }

    const key = button.dataset.pageKey;
    const page = Number(button.dataset.pageNumber);
    if (!key || !Number.isFinite(page)) {
        return;
    }

    state.pagination[key] = page;

    if (key === "inventory") {
        renderInventory();
    } else if (key === "sales") {
        renderSales();
    } else if (key === "history") {
        renderMovements();
    } else if (key === "users") {
        renderUsers();
    } else if (key === "suppliers") {
        renderSuppliers();
    } else if (key === "customers") {
        renderCustomers();
    } else if (key === "expenses") {
        renderExpenses();
    } else if (key.startsWith("alert")) {
        renderAlerts();
    }
}

function renderSummary() {
    const cards = [
        { key: "metric_total_products", value: state.summary.totalProducts || 0, icon: "boxes", target: "inventory" },
        { key: "metric_inventory_value", value: formatCurrency(state.summary.inventoryValue || 0), icon: "wallet", target: "inventory" },
        { key: "metric_low_stock", value: state.summary.lowStockCount || 0, icon: "triangle-alert", target: "low" },
        { key: "metric_expired", value: state.summary.expiredCount || 0, icon: "shield-alert", target: "expired" },
        { key: "metric_today_sales", value: formatCurrency(state.summary.todaySales || 0), icon: "banknote", target: "sales" }
    ];
    if (canSeeProfit()) {
        cards.push({ key: "metric_today_profit", value: formatCurrency(state.summary.todayProfit || 0), icon: "trending-up", target: "sales" });
    }

    $("summary-cards").innerHTML = cards.map((card) => `
        <button type="button" class="metric-card metric-card-button" data-summary-target="${card.target}" aria-label="View ${escapeHtml(t(card.key))} details">
            <div>
                <div class="metric-label">${escapeHtml(t(card.key))}</div>
                <div class="metric-value">${escapeHtml(card.value)}</div>
            </div>
            <div class="metric-icon">
                <i data-lucide="${card.icon}" class="h-6 w-6"></i>
            </div>
        </button>
    `).join("");
    lucide.createIcons();
}

function renderRecentSales() {
    const rows = state.recentSales;
    const showProfit = canSeeProfit();
    $("dashboard-sales-body").innerHTML = rows.length
        ? rows.map((sale) => `
            <tr>
                <td data-label="${escapeHtml(t("invoice"))}">
                    <strong>${escapeHtml(sale.invoiceNo)}</strong>
                </td>
                <td data-label="${escapeHtml(t("date"))}">${escapeHtml(sale.saleDate)}</td>
                <td data-label="${escapeHtml(t("cashier"))}">${escapeHtml(sale.cashierName)}</td>
                <td data-label="${escapeHtml(t("total"))}" class="text-right">${escapeHtml(formatCurrency(sale.total))}</td>
                ${showProfit ? `<td data-label="${escapeHtml(t("profit"))}" class="text-right">${escapeHtml(formatCurrency(sale.profit))}</td>` : ""}
                <td data-label="${escapeHtml(t("actions"))}" class="text-center">
                    <button type="button" class="mini-btn" data-print-sale="${sale.id}">
                        ${escapeHtml(t("print"))}
                    </button>
                </td>
            </tr>
        `).join("")
        : `<tr><td colspan="${showProfit ? 6 : 5}" class="empty-state">${escapeHtml(t("no_recent_sales"))}</td></tr>`;
    lucide.createIcons();
}

function filteredProducts() {
    const search = $("pos-search").value.trim().toLowerCase();
    const category = state.posCategory || "all";
    return state.products.filter((product) => {
        if (category !== "all" && getPOSCategory(product)?.id !== category) {
            return false;
        }
        if (!search) {
            return true;
        }
        const fields = [product.name, product.code, product.barcode, product.brand, product.category]
            .filter(Boolean)
            .map((value) => String(value).toLowerCase().trim());

        return fields.some((value) =>
            value.startsWith(search) || value.split(/\s+/).some((part) => part.startsWith(search))
        );
    });
}

function normalizeProductCategory(category) {
    return String(category || "").trim().toLowerCase();
}

function getPOSCategory(product) {
    const source = normalizeProductCategory([product.category, product.name, product.brand].filter(Boolean).join(" "));
    return POS_CATEGORIES.find((category) => category.id !== "all" && category.terms.some((term) => source.includes(term))) || null;
}

function renderPOSCategories() {
    if (!POS_CATEGORIES.some((category) => category.id === state.posCategory)) {
        state.posCategory = "all";
    }

    $("pos-categories").innerHTML = POS_CATEGORIES.map((category) => {
        const count = category.id === "all"
            ? state.products.length
            : state.products.filter((product) => getPOSCategory(product)?.id === category.id).length;
        const active = state.posCategoryOpen && category.id === state.posCategory;
        return `
            <button type="button" class="pos-category-card ${active ? "active" : ""}" data-pos-category="${escapeHtml(category.id)}" aria-pressed="${active}">
                <span class="pos-category-icon"><i data-lucide="${category.icon}" class="h-5 w-5" aria-hidden="true"></i></span>
                <span class="pos-category-copy">
                    <span class="pos-category-name">${escapeHtml(category.label)}</span>
                    <span class="pos-category-count">${count} items</span>
                </span>
            </button>
        `;
    }).join("");
    lucide.createIcons();
}

function handlePOSCategoryClick(event) {
    const button = event.target.closest("[data-pos-category]");
    if (!button) {
        return;
    }
    const categoryId = button.dataset.posCategory;
    const closing = state.posCategoryOpen && state.posCategory === categoryId;
    state.posCategory = closing ? "all" : categoryId;
    state.posCategoryOpen = !closing;
    state.posSearchOpen = false;
    state.posProductPage = 1;
    $("pos-search").value = "";
    renderPOSCategories();
    renderPOSProducts();
}

function handlePOSProductPageClick(event) {
    const button = event.target.closest("[data-pos-product-page]");
    if (!button) {
        return;
    }
    state.posProductPage = Number(button.dataset.posProductPage) || 1;
    renderPOSProducts();
    $("pos-products-grid").scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function toggleLoginPassword() {
    const input = $("login-password");
    const toggle = $("login-password-toggle");
    const visible = input.type === "text";
    input.type = visible ? "password" : "text";
    toggle.setAttribute("aria-label", visible ? "Show password" : "Hide password");
    toggle.setAttribute("title", visible ? "Show password" : "Hide password");
    toggle.innerHTML = `<i data-lucide="${visible ? "eye" : "eye-off"}" class="h-4 w-4"></i>`;
    lucide.createIcons();
}

function renderStatusBadge(status) {
    if (status === "expired") {
        return `<span class="status-pill status-expired"><span class="status-dot" aria-hidden="true"></span>${escapeHtml(t("expired_status"))}</span>`;
    }
    if (status === "low") {
        return `<span class="status-pill status-low"><span class="status-dot" aria-hidden="true"></span>${escapeHtml(t("low_stock_status"))}</span>`;
    }
    return `<span class="status-pill status-good"><span class="status-dot" aria-hidden="true"></span>${escapeHtml(t("good"))}</span>`;
}

function buildPOSProductCards(products) {
    return products.map((product) => {
        const disabled = product.quantity <= 0 || product.status === "expired";
        const category = getPOSCategory(product);
        return `
            <article class="pos-product-card ${disabled ? "disabled" : ""}">
                <div class="pos-product-visual" aria-hidden="true">
                    <i data-lucide="${category?.icon || "package"}" class="h-6 w-6"></i>
                </div>
                <div class="pos-product-info">
                    <h3>${escapeHtml(product.name)}</h3>
                    <p>${escapeHtml(product.category || t("general"))}</p>
                    <div class="pos-product-price">${escapeHtml(formatCurrency(product.sellPrice))}</div>
                </div>
                <span class="pos-product-stock">${escapeHtml(product.quantity)} ${escapeHtml(t("stock"))}</span>
                <button type="button" class="pos-product-add" data-add-id="${product.id}" ${disabled ? "disabled" : ""} aria-label="Add ${escapeHtml(product.name)}">
                    <i data-lucide="plus" class="h-5 w-5"></i>
                </button>
            </article>
        `;
    }).join("");
}

function renderRecentPOSProducts() {
    const recentProducts = [...state.products]
        .sort((left, right) => Number(right.id) - Number(left.id))
        .slice(0, 8);
    $("pos-recent-products").innerHTML = recentProducts.length
        ? buildPOSProductCards(recentProducts)
        : `<div class="pos-products-empty">${escapeHtml(t("no_products"))}</div>`;
}

function renderPOSProducts() {
    const query = $("pos-search").value.trim();
    const container = $("pos-products-grid");
    const popover = $("pos-results-popover");
    const recentSection = $("pos-recent-section");
    const shouldShowResults = state.posSearchOpen || Boolean(query) || state.posCategoryOpen;
    popover.classList.toggle("hidden", !shouldShowResults);
    recentSection.classList.toggle("hidden", shouldShowResults);
    if (!shouldShowResults) {
        container.innerHTML = "";
        $("pos-product-dots").classList.add("hidden");
        $("pos-product-dots").innerHTML = "";
        renderRecentPOSProducts();
        lucide.createIcons();
        return;
    }

    const products = filteredProducts();
    const pageSize = window.innerWidth <= 720 ? 5 : 8;
    const totalPages = Math.max(1, Math.ceil(products.length / pageSize));
    state.posProductTotalPages = totalPages;
    state.posProductPage = Math.min(Math.max(state.posProductPage, 1), totalPages);
    const start = (state.posProductPage - 1) * pageSize;
    const visibleProducts = products.slice(start, start + pageSize);
    container.innerHTML = visibleProducts.length
        ? buildPOSProductCards(visibleProducts)
        : `<div class="pos-products-empty">${escapeHtml(t("no_products"))}</div>`;
    renderPOSProductDots(products.length ? totalPages : 0);
    lucide.createIcons();
}

function renderPOSProductDots(totalPages) {
    const nav = $("pos-product-dots");
    nav.classList.toggle("hidden", totalPages <= 1);
    if (totalPages <= 1) {
        nav.innerHTML = "";
        return;
    }
    const current = state.posProductPage;
    const dots = totalPages <= 7
        ? Array.from({ length: totalPages }, (_, index) => {
            const page = index + 1;
            const active = page === current;
            return `<button type="button" class="pos-product-dot ${active ? "active" : ""}" data-pos-product-page="${page}" aria-label="Show product page ${page}" aria-current="${active ? "page" : "false"}"></button>`;
        }).join("")
        : "";
    nav.innerHTML = `
        <button type="button" class="pos-page-arrow" data-pos-product-page="${current - 1}" aria-label="Previous products" ${current <= 1 ? "disabled" : ""}>&lsaquo;</button>
        ${dots}
        <span class="pos-page-label">${current} / ${totalPages}</span>
        <button type="button" class="pos-page-arrow" data-pos-product-page="${current + 1}" aria-label="Next products" ${current >= totalPages ? "disabled" : ""}>&rsaquo;</button>
    `;
}

function bindPOSSwipe() {
    const area = $("pos-products-grid");
    let startX = 0;
    let startY = 0;
    area.addEventListener("touchstart", (event) => {
        startX = event.touches[0].clientX;
        startY = event.touches[0].clientY;
    }, { passive: true });
    area.addEventListener("touchend", (event) => {
        const dx = event.changedTouches[0].clientX - startX;
        const dy = event.changedTouches[0].clientY - startY;
        if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
        const next = state.posProductPage + (dx < 0 ? 1 : -1);
        if (next < 1 || next > state.posProductTotalPages) return;
        state.posProductPage = next;
        renderPOSProducts();
    }, { passive: true });
}

function addToCart(productId) {
    const product = state.products.find((item) => item.id === productId);
    if (!product) {
        return;
    }
    if (product.status === "expired") {
        showNotification(t("msg_expired_sell"), "error");
        return;
    }
    if (product.quantity <= 0) {
        showNotification(t("msg_out_of_stock"), "error");
        return;
    }

    const existing = state.cart.find((item) => item.productId === productId);
    if (existing) {
        if (existing.quantity >= product.quantity) {
            showNotification(t("msg_qty_exceeds"), "error");
            return;
        }
        existing.quantity += 1;
    } else {
        state.cart.push({
            productId: product.id,
            code: product.code,
            name: product.name,
            sellPrice: product.sellPrice,
            costPrice: product.costPrice,
            quantity: 1,
            maxQuantity: product.quantity
        });
    }
    state.posCategory = "all";
    state.posCategoryOpen = false;
    state.posSearchOpen = false;
    state.posProductPage = 1;
    $("pos-search").value = "";
    renderPOSCategories();
    renderPOSProducts();
    renderCart();
}

function updateCartQuantity(productId, delta) {
    const item = state.cart.find((entry) => entry.productId === productId);
    if (!item) {
        return;
    }
    const nextQuantity = item.quantity + delta;
    if (nextQuantity <= 0) {
        removeFromCart(productId);
        return;
    }
    if (nextQuantity > item.maxQuantity) {
        showNotification(t("msg_qty_exceeds"), "error");
        return;
    }
    item.quantity = nextQuantity;
    renderCart();
}

function setCartQuantity(productId, quantity) {
    const item = state.cart.find((entry) => entry.productId === productId);
    if (!item) {
        return;
    }
    const nextQuantity = Math.max(1, Math.floor(Number(quantity) || 1));
    if (nextQuantity > item.maxQuantity) {
        showNotification(t("msg_qty_exceeds"), "error");
        renderCart();
        return;
    }
    item.quantity = nextQuantity;
    renderCart();
}

function removeFromCart(productId) {
    state.cart = state.cart.filter((item) => item.productId !== productId);
    renderCart();
}

function getCartTotals() {
    const subtotal = state.cart.reduce((sum, item) => sum + (item.sellPrice * item.quantity), 0);
    const discount = Math.max(0, Number($("pos-discount").value) || 0);
    return { subtotal, discount, total: Math.max(0, subtotal - discount) };
}

function renderCart() {
    const container = $("cart-items");
    const { subtotal, total } = getCartTotals();
    const itemCount = state.cart.reduce((sum, item) => sum + item.quantity, 0);

    $("cart-subtotal").textContent = formatCurrency(subtotal);
    $("cart-total").textContent = formatCurrency(total);
    $("checkout-button").disabled = state.cart.length === 0;
    $("pos-cart").classList.toggle("is-empty", state.cart.length === 0);
    $("cart-item-count").textContent = `${itemCount} ${itemCount === 1 ? "item" : "items"}`;

    if (!state.cart.length) {
        container.innerHTML = `
            <div class="pos-cart-empty">
                <span><i data-lucide="shopping-bag" class="h-6 w-6"></i></span>
                <strong>${escapeHtml(t("no_cart"))}</strong>
                <span>${escapeHtml(t("search_products"))}</span>
            </div>
        `;
        lucide.createIcons();
        return;
    }

    container.innerHTML = state.cart.map((item) => `
        <article class="pos-cart-item" aria-label="${escapeHtml(item.name)}">
            <div class="pos-cart-item-visual" aria-hidden="true">
                <i data-lucide="pill" class="h-5 w-5"></i>
            </div>
            <div class="pos-cart-item-info">
                <div class="pos-cart-item-name">${escapeHtml(item.name)}</div>
                <div class="pos-cart-item-meta">
                    <span>${escapeHtml(item.code)}</span>
                    <span>${escapeHtml(formatCurrency(item.sellPrice))} each</span>
                </div>
            </div>
            <button type="button" class="pos-cart-remove" data-cart-action="remove" data-id="${item.productId}" aria-label="Remove ${escapeHtml(item.name)}">
                <i data-lucide="trash-2" class="h-4 w-4"></i>
            </button>
            <div class="pos-cart-item-footer">
                <div class="pos-cart-stepper">
                    <button type="button" data-cart-action="decrease" data-id="${item.productId}" aria-label="Decrease quantity">
                        <i data-lucide="minus" class="h-4 w-4"></i>
                    </button>
                    <input
                        data-cart-quantity
                        data-id="${item.productId}"
                        type="number"
                        min="1"
                        max="${item.maxQuantity}"
                        value="${item.quantity}"
                        aria-label="Quantity"
                    >
                    <button type="button" data-cart-action="increase" data-id="${item.productId}" aria-label="Increase quantity">
                        <i data-lucide="plus" class="h-4 w-4"></i>
                    </button>
                </div>
                <strong class="pos-cart-line-total">${escapeHtml(formatCurrency(item.sellPrice * item.quantity))}</strong>
            </div>
        </article>
    `).join("");
    lucide.createIcons();
}

async function handleCheckout() {
    if (!state.cart.length || state.checkingOut) {
        return;
    }

    state.checkingOut = true;
    $("checkout-button").disabled = true;
    try {
        const response = await api("/api/sales", {
            method: "POST",
            body: {
                saleDate: todayIso(),
                discount: Number($("pos-discount").value) || 0,
                items: state.cart.map((item) => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    sellPrice: item.sellPrice
                }))
            }
        });

        const saleResponse = await api(`/api/sales/${response.saleId}`);
        state.receiptSale = saleResponse.sale;
        state.cart = [];
        $("pos-discount").value = 0;
        await loadInitialData();
        voucherPrinter.onSaleComplete(state.receiptSale);
        openReceiptModal(state.receiptSale);
        switchTab("sales");
        showNotification(`${t("msg_sale_complete")} ${response.invoiceNo}`);
    } catch (error) {
        showNotification(error.message, "error");
    } finally {
        state.checkingOut = false;
        renderCart();
    }
}

function inventoryResults() {
    const search = $("inventory-search").value.trim().toLowerCase();
    if (!search) {
        return state.products;
    }
    return state.products.filter((product) =>
        [product.code, product.barcode, product.brand, product.name, product.category, product.expiryDate].join(" ").toLowerCase().includes(search)
    );
}

function renderInventory() {
    const rows = inventoryResults();
    const page = getPageSlice(rows, "inventory");
    const isAdmin = state.user?.role === "admin";
    const colspan = isAdmin ? 9 : 8;

    $("inventory-table-body").innerHTML = rows.length
        ? page.rows.map((product) => `
            <tr ${isAdmin ? `class="row-clickable" data-product-id="${product.id}"` : ""}>
                <td data-label="${escapeHtml(t("product_code"))}">
                    <strong>${escapeHtml(product.code)}</strong>
                    ${product.barcode ? `<div class="table-sub table-sub-barcode">${escapeHtml(product.barcode)}</div>` : ""}
                </td>
                <td data-label="${escapeHtml(t("brand"))}">${escapeHtml(product.brand || "-")}</td>
                <td data-label="${escapeHtml(t("product_name"))}">${escapeHtml(product.name)}<div class="table-sub inv-sub">${escapeHtml([product.brand, product.category].filter((v) => v && v !== "-").join(" · "))}</div></td>
                <td data-label="${escapeHtml(t("category"))}">${escapeHtml(product.category || "-")}</td>
                <td data-label="${escapeHtml(t("expiry_date"))}" class="expiry-cell">${escapeHtml(product.expiryDate)}</td>
                <td data-label="${escapeHtml(t("sell_price"))}" class="text-right">${escapeHtml(formatCurrency(product.sellPrice))}</td>
                <td data-label="${escapeHtml(t("quantity"))}" class="text-right">${escapeHtml(product.quantity)}</td>
                <td data-label="${escapeHtml(t("status"))}">${renderStatusBadge(product.status)}</td>
                ${isAdmin ? `
                    <td data-label="${escapeHtml(t("actions"))}" class="text-center">
                        <div class="table-actions">
                            <button type="button" class="mini-btn" data-edit-product="${product.id}">${escapeHtml(t("edit"))}</button>
                            <button type="button" class="danger-btn" data-delete-product="${product.id}">${escapeHtml(t("archive"))}</button>
                        </div>
                    </td>
                ` : ""}
            </tr>
        `).join("")
        : `<tr><td colspan="${colspan}" class="empty-state">${escapeHtml(t("no_inventory"))}</td></tr>`;
    renderPager("inventory-pager", "inventory", page.totalPages);
}

function openProductModal(productId) {
    const product = state.products.find((item) => item.id === productId);
    if (!product) {
        return;
    }

    $("product-id").value = product.id;
    $("product-code").value = product.code;
    $("product-barcode").value = product.barcode || "";
    $("product-brand").value = product.brand || "";
    $("product-name").value = product.name;
    $("product-category").value = product.category || "";
    $("product-expiry").value = product.expiryDate;
    $("product-quantity").value = product.quantity;
    $("product-cost").value = product.costPrice;
    $("product-price").value = product.sellPrice;
    $("product-threshold").value = product.lowStockThreshold;
    $("product-modal").classList.remove("hidden");
}

function closeProductModal() {
    $("product-modal").classList.add("hidden");
    $("product-form").reset();
}

async function handleSaveProduct(event) {
    event.preventDefault();
    try {
        await api(`/api/products/${$("product-id").value}`, {
            method: "PUT",
            body: {
                code: $("product-code").value.trim(),
                barcode: $("product-barcode").value.trim(),
                brand: $("product-brand").value.trim(),
                name: $("product-name").value.trim(),
                category: $("product-category").value.trim(),
                expiryDate: $("product-expiry").value,
                quantity: Number($("product-quantity").value),
                costPrice: Number($("product-cost").value),
                sellPrice: Number($("product-price").value),
                lowStockThreshold: Number($("product-threshold").value)
            }
        });
        closeProductModal();
        await loadInitialData();
        showNotification(t("msg_product_updated"));
    } catch (error) {
        showNotification(error.message, "error");
    }
}

async function deleteProduct(productId) {
    if (!window.confirm(t("confirm_archive"))) {
        return;
    }

    try {
        await api(`/api/products/${productId}`, { method: "DELETE" });
        await loadInitialData();
        showNotification(t("msg_product_archived"));
    } catch (error) {
        showNotification(error.message, "error");
    }
}

const BULK_DRAFT_KEY = "pharmacy_inbound_draft";
const bulkState = { lines: [], nextId: 1 };

function bulkLoadDraft() {
    try {
        const saved = JSON.parse(localStorage.getItem(BULK_DRAFT_KEY) || "null");
        if (saved && Array.isArray(saved.lines)) {
            bulkState.lines = saved.lines;
            bulkState.nextId = saved.nextId || saved.lines.length + 1;
        }
    } catch (error) { /* ignore a corrupt draft */ }
}

function bulkPersist() {
    try {
        localStorage.setItem(BULK_DRAFT_KEY, JSON.stringify({ lines: bulkState.lines, nextId: bulkState.nextId }));
    } catch (error) { /* draft is a convenience only */ }
}

function bulkNewLine(overrides = {}) {
    return {
        id: bulkState.nextId++,
        existing: false,
        code: "",
        barcode: "",
        brand: "",
        name: "",
        category: "",
        expiryDate: "",
        quantity: 1,
        costPrice: "",
        sellPrice: "",
        threshold: 10,
        error: "",
        ...overrides
    };
}

function bulkLineFromProduct(product) {
    return bulkNewLine({
        existing: true,
        code: product.code,
        barcode: product.barcode || "",
        brand: product.brand || "",
        name: product.name,
        category: product.category || "",
        expiryDate: product.expiryDate || "",
        costPrice: product.costPrice,
        sellPrice: product.sellPrice,
        threshold: product.lowStockThreshold || 10
    });
}

function bulkFindProduct(text) {
    const needle = text.trim().toLowerCase();
    if (!needle) return null;
    return state.products.find((p) => String(p.code).toLowerCase() === needle)
        || state.products.find((p) => String(p.barcode || "").toLowerCase() === needle)
        || null;
}

function bulkSuggestions(text) {
    const needle = text.trim().toLowerCase();
    if (needle.length < 2) return [];
    return state.products.filter((p) =>
        [p.name, p.code, p.barcode, p.brand].join(" ").toLowerCase().includes(needle)
    ).slice(0, 6);
}

function bulkAddFromInput(rawText) {
    const text = rawText.trim();
    if (!text) return;
    const existingProduct = bulkFindProduct(text);
    if (existingProduct) {
        bulkAddProduct(existingProduct);
        return;
    }
    const lineMatch = bulkState.lines.find((line) => line.barcode && line.barcode.toLowerCase() === text.toLowerCase());
    if (lineMatch) {
        lineMatch.quantity = Number(lineMatch.quantity || 0) + 1;
        bulkAfterChange(lineMatch.id, "quantity");
        return;
    }
    const looksLikeCode = /^[A-Za-z0-9\-_.]{4,}$/.test(text) && /\d/.test(text);
    const line = looksLikeCode
        ? bulkNewLine({ barcode: text, code: text.toUpperCase() })
        : bulkNewLine({ name: text });
    bulkState.lines.unshift(line);
    bulkAfterChange(line.id, looksLikeCode ? "name" : "code");
}

function bulkAddProduct(product) {
    const lineMatch = bulkState.lines.find((line) => line.existing && line.code === product.code);
    if (lineMatch) {
        lineMatch.quantity = Number(lineMatch.quantity || 0) + 1;
        bulkAfterChange(lineMatch.id, "quantity");
        return;
    }
    const line = bulkLineFromProduct(product);
    bulkState.lines.unshift(line);
    bulkAfterChange(line.id, "quantity");
}

function bulkAfterChange(focusLineId, focusField) {
    bulkPersist();
    renderBulkLines();
    if (focusLineId) {
        const input = document.querySelector(`[data-bulk-id="${focusLineId}"][data-bulk-field="${focusField}"]`);
        if (input) {
            input.focus();
            if (input.select) input.select();
        }
    }
}

function bulkLineTotals() {
    const valid = bulkState.lines.filter((line) => Number(line.quantity) > 0);
    const units = valid.reduce((sum, line) => sum + Number(line.quantity || 0), 0);
    const cost = valid.reduce((sum, line) => sum + Number(line.quantity || 0) * Number(line.costPrice || 0), 0);
    return { count: bulkState.lines.length, units, cost };
}

function renderBulkTotals() {
    const totals = bulkLineTotals();
    $("bulk-totals").innerHTML = `
        <span><strong>${totals.count}</strong> ${totals.count === 1 ? "line" : "lines"}</span>
        <span><strong>${totals.units}</strong> units</span>
        <span>Total cost <strong>${escapeHtml(formatCurrency(totals.cost))}</strong></span>
    `;
    $("bulk-save").textContent = totals.count ? `Save all (${totals.count})` : "Save all";
    $("bulk-save").disabled = !totals.count;
    $("bulk-clear").disabled = !totals.count;
}

function bulkField(line, field, label, type, extra = "") {
    const value = line[field] ?? "";
    return `
        <label class="bulk-field bulk-f-${field}">
            <span>${label}</span>
            <input type="${type}" class="field-input" data-bulk-id="${line.id}" data-bulk-field="${field}" value="${escapeHtml(String(value))}" ${extra}>
        </label>`;
}

function renderBulkLines() {
    const box = $("bulk-lines");
    if (!bulkState.lines.length) {
        box.innerHTML = `
            <div class="bulk-empty">
                <strong>No items yet</strong>
                <p>Scan a barcode or search above. Existing products add stock to what you already have; new barcodes create a new product. Add as many lines as you need, then press Save all.</p>
            </div>`;
        renderBulkTotals();
        return;
    }
    const categories = ["", "Tablets & Capsules", "Syrups & Liquids", "Injections", "Syringes & Supplies", "Medical Electronics", "First Aid", "Personal Care"];
    box.innerHTML = bulkState.lines.map((line, index) => `
        <article class="bulk-line ${line.error ? "has-error" : ""}" data-line="${line.id}">
            <header class="bulk-line-head">
                <span class="bulk-index">${bulkState.lines.length - index}</span>
                <span class="bulk-badge ${line.existing ? "is-existing" : "is-new"}">${line.existing ? "Existing &middot; adds stock" : "New product"}</span>
                <button type="button" class="bulk-remove" data-bulk-remove="${line.id}" aria-label="Remove line">&times;</button>
            </header>
            <div class="bulk-grid">
                ${bulkField(line, "name", "Product name", "text")}
                ${bulkField(line, "code", "Code", "text", 'placeholder="auto"')}
                ${bulkField(line, "barcode", "Barcode", "text", 'data-scan-field placeholder="scan"')}
                ${bulkField(line, "expiryDate", "Expiry", "date")}
                ${bulkField(line, "quantity", "Qty in", "number", 'min="1" inputmode="numeric"')}
                ${bulkField(line, "costPrice", "Cost", "number", 'min="0" inputmode="decimal"')}
                ${bulkField(line, "sellPrice", "Sell", "number", 'min="0" inputmode="decimal"')}
            </div>
            <details class="bulk-more">
                <summary>More details</summary>
                <div class="bulk-grid bulk-grid-more">
                    ${bulkField(line, "brand", "Brand", "text")}
                    <label class="bulk-field">
                        <span>Category</span>
                        <select class="field-input" data-bulk-id="${line.id}" data-bulk-field="category">
                            ${categories.map((cat) => `<option value="${escapeHtml(cat)}" ${cat === line.category ? "selected" : ""}>${cat || "None"}</option>`).join("")}
                        </select>
                    </label>
                    ${bulkField(line, "threshold", "Low stock alert", "number", 'min="1"')}
                </div>
            </details>
            ${line.error ? `<p class="bulk-error">${escapeHtml(line.error)}</p>` : ""}
        </article>
    `).join("");
    renderBulkTotals();
}

function renderBulkSuggestions() {
    const box = $("bulk-suggestions");
    const list = bulkSuggestions($("bulk-scan-input").value);
    if (!list.length) {
        box.classList.add("hidden");
        box.innerHTML = "";
        return;
    }
    box.classList.remove("hidden");
    box.innerHTML = list.map((p) => `
        <button type="button" class="bulk-suggestion" data-bulk-pick="${p.id}">
            <strong>${escapeHtml(p.name)}</strong>
            <span>${escapeHtml(p.code)}${p.barcode ? " &middot; " + escapeHtml(p.barcode) : ""} &middot; stock ${escapeHtml(p.quantity)}</span>
        </button>
    `).join("");
}

function bindBulkInbound() {
    const scan = $("bulk-scan-input");
    scan.addEventListener("keydown", (event) => {
        if (event.key !== "Enter") return;
        event.preventDefault();
        event.stopPropagation();
        bulkAddFromInput(scan.value);
        scan.value = "";
        renderBulkSuggestions();
    });
    scan.addEventListener("input", renderBulkSuggestions);
    $("bulk-suggestions").addEventListener("click", (event) => {
        const pick = event.target.closest("[data-bulk-pick]");
        if (!pick) return;
        const product = state.products.find((p) => p.id === Number(pick.dataset.bulkPick));
        if (product) bulkAddProduct(product);
        scan.value = "";
        renderBulkSuggestions();
        scan.focus();
    });
    $("bulk-add-blank").addEventListener("click", () => {
        const line = bulkNewLine();
        bulkState.lines.unshift(line);
        bulkAfterChange(line.id, "name");
    });
    $("bulk-clear").addEventListener("click", () => {
        if (!bulkState.lines.length || !confirm("Remove all lines from this stock-in sheet?")) return;
        bulkState.lines = [];
        bulkPersist();
        renderBulkLines();
        scan.focus();
    });
    const lines = $("bulk-lines");
    lines.addEventListener("input", (event) => {
        const input = event.target.closest("[data-bulk-field]");
        if (!input) return;
        const line = bulkState.lines.find((item) => item.id === Number(input.dataset.bulkId));
        if (!line) return;
        line[input.dataset.bulkField] = input.value;
        line.error = "";
        input.closest(".bulk-line")?.classList.remove("has-error");
        input.closest(".bulk-line")?.querySelector(".bulk-error")?.remove();
        bulkPersist();
        renderBulkTotals();
    });
    lines.addEventListener("keydown", (event) => {
        const input = event.target.closest("[data-bulk-field]");
        if (input && event.key === "Enter") {
            event.preventDefault();
            if (input.dataset.bulkField === "barcode" && input.value.trim()) {
                const line = bulkState.lines.find((item) => item.id === Number(input.dataset.bulkId));
                const match = bulkFindProduct(input.value);
                if (line && match && !line.existing) {
                    Object.assign(line, bulkLineFromProduct(match), { id: line.id });
                    bulkAfterChange(line.id, "quantity");
                    return;
                }
            }
            $("bulk-scan-input").focus();
        }
    });
    lines.addEventListener("click", (event) => {
        const remove = event.target.closest("[data-bulk-remove]");
        if (!remove) return;
        const id = Number(remove.dataset.bulkRemove);
        bulkState.lines = bulkState.lines.filter((line) => line.id !== id);
        bulkPersist();
        renderBulkLines();
    });
}

function openInboundModal() {
    bulkLoadDraft();
    renderBulkLines();
    $("inbound-modal").classList.remove("hidden");
    $("bulk-scan-input").focus();
}

function closeInboundModal() {
    $("inbound-modal").classList.add("hidden");
}

async function handleInboundSubmit(event) {
    event.preventDefault();
    if (!bulkState.lines.length || bulkState.saving) return;

    const problems = [];
    bulkState.lines.forEach((line) => {
        line.error = "";
        if (!line.existing && !String(line.code).trim() && String(line.name).trim()) {
            line.code = String(line.barcode).trim().toUpperCase() || `N${Date.now().toString(36).toUpperCase().slice(-6)}`;
        }
        if (!String(line.name).trim()) line.error = "Enter a product name.";
        else if (!String(line.code).trim()) line.error = "Enter a product code.";
        else if (!line.expiryDate) line.error = "Choose an expiry date.";
        else if (!(Number(line.quantity) > 0)) line.error = "Quantity must be at least 1.";
        else if (line.costPrice === "" || Number(line.costPrice) < 0) line.error = "Enter the cost price.";
        else if (line.sellPrice === "" || Number(line.sellPrice) < 0) line.error = "Enter the sell price.";
        if (line.error) problems.push(line);
    });
    if (problems.length) {
        renderBulkLines();
        document.querySelector(`[data-line="${problems[0].id}"]`)?.scrollIntoView({ block: "center", behavior: "smooth" });
        showNotification(`${problems.length} line${problems.length === 1 ? " needs" : "s need"} attention before saving.`, "error");
        return;
    }

    const saveButton = $("bulk-save");
    bulkState.saving = true;
    saveButton.disabled = true;
    const supplierId = $("inbound-supplier").value || null;
    let saved = 0;
    for (const line of [...bulkState.lines]) {
        try {
            await api("/api/inbound", {
                method: "POST",
                body: {
                    code: String(line.code).trim(),
                    barcode: String(line.barcode).trim(),
                    brand: String(line.brand).trim(),
                    name: String(line.name).trim(),
                    category: String(line.category).trim(),
                    expiryDate: line.expiryDate,
                    quantity: Number(line.quantity),
                    costPrice: Number(line.costPrice),
                    sellPrice: Number(line.sellPrice),
                    lowStockThreshold: Number(line.threshold) || 10,
                    supplierId
                }
            });
            bulkState.lines = bulkState.lines.filter((item) => item.id !== line.id);
            saved += 1;
        } catch (error) {
            line.error = error.message;
        }
    }
    bulkState.saving = false;
    bulkPersist();
    renderBulkLines();
    await loadInitialData();
    if (!bulkState.lines.length) {
        closeInboundModal();
        showNotification(saved === 1 ? t("msg_inbound_saved") : `${saved} items saved to stock.`);
    } else {
        showNotification(`${saved} saved, ${bulkState.lines.length} still need attention.`, "error");
    }
}

function handleSalesFilterChange() {
    const isMonthly = $("sales-report-type").value === "monthly";
    $("sales-date-filter").classList.toggle("hidden", isMonthly);
    $("sales-month-filter").classList.toggle("hidden", !isMonthly);
    state.pagination.sales = 1;
    loadFilteredSalesAndRender();
}

function renderSales() {
    const totalSales = state.sales.reduce((sum, sale) => sum + sale.total, 0);
    const totalProfit = state.sales.reduce((sum, sale) => sum + sale.profit, 0);
    const page = getPageSlice(state.sales, "sales");
    const showProfit = canSeeProfit();

    $("sales-summary-strip").innerHTML = `
        <div class="sales-report-metric sales-metric-count">
            <div class="metric-label">${escapeHtml(t("sales_count"))}</div>
            <strong>${escapeHtml(state.sales.length)}</strong>
        </div>
        <div class="sales-report-metric sales-metric-total">
            <div class="metric-label">${escapeHtml(t("report_total_sales"))}</div>
            <strong>${escapeHtml(formatCurrency(totalSales))}</strong>
        </div>
        ${showProfit ? `<div class="sales-report-metric sales-metric-profit">
            <div class="metric-label">${escapeHtml(t("report_total_profit"))}</div>
            <strong>${escapeHtml(formatCurrency(totalProfit))}</strong>
        </div>` : ""}
    `;

    $("sales-table-body").innerHTML = state.sales.length
        ? page.rows.map((sale) => {
            const itemSummary = sale.items.map((item) => `${item.productName} x${item.quantity}`).join(", ");
            const itemCount = sale.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
            return `
                <tr class="row-clickable" data-sale-row="${sale.id}">
                    <td data-label="${escapeHtml(t("invoice"))}">
                        <strong>${escapeHtml(sale.invoiceNo)}</strong>
                        <div class="table-sub sale-sub">${escapeHtml(sale.saleDate)} &middot; ${escapeHtml(sale.cashierName)} &middot; ${escapeHtml(itemCount)} ${itemCount === 1 ? "item" : "items"}</div>
                    </td>
                    <td data-label="${escapeHtml(t("date"))}">${escapeHtml(sale.saleDate)}</td>
                    <td data-label="${escapeHtml(t("cashier"))}">${escapeHtml(sale.cashierName)}</td>
                    <td data-label="${escapeHtml(t("items"))}">${escapeHtml(itemSummary)}</td>
                    <td data-label="${escapeHtml(t("total"))}" class="text-right">${escapeHtml(formatCurrency(sale.total))}</td>
                    ${showProfit ? `<td data-label="${escapeHtml(t("profit"))}" class="text-right">${escapeHtml(formatCurrency(sale.profit))}</td>` : ""}
                    <td data-label="${escapeHtml(t("actions"))}" class="text-center">
                        <button type="button" class="mini-btn" data-print-sale="${sale.id}">
                            ${escapeHtml(t("print"))}
                        </button>
                    </td>
                </tr>
            `;
        }).join("")
        : `<tr><td colspan="${showProfit ? 7 : 6}" class="empty-state">${escapeHtml(t("no_sales"))}</td></tr>`;
    renderPager("sales-pager", "sales", page.totalPages);
    lucide.createIcons();
}

function renderAlertRows(items) {
    return items.length
        ? items.map((item) => `
            <tr>
                <td data-label="${escapeHtml(t("product_name"))}">
                    <strong>${escapeHtml(item.name)}</strong>
                    <div class="table-sub">${escapeHtml(item.code)}</div>
                </td>
                <td data-label="${escapeHtml(t("expiry_date"))}" class="expiry-cell">${escapeHtml(item.expiryDate)}</td>
                <td data-label="${escapeHtml(t("quantity"))}" class="text-right">${escapeHtml(item.quantity)}</td>
            </tr>
        `).join("")
        : `<tr><td colspan="3" class="empty-state">${escapeHtml(t("no_alerts"))}</td></tr>`;
}

function renderAlerts() {
    [
        ["low-stock-body", "alertLow", state.alerts.lowStock],
        ["expired-body", "alertExpired", state.alerts.expired],
        ["expiring-body", "alertExpiring", state.alerts.expiringSoon]
    ].forEach(([bodyId, key, items]) => {
        const page = getPageSlice(filterAlertItems(items), key);
        $(bodyId).innerHTML = renderAlertRows(page.rows);
        renderPager(`${key}-pager`, key, page.totalPages);
    });
    setAlertView(state.activeAlertView);
}

function productBarcodeByCode(code) {
    return state.products.find((product) => product.code === code)?.barcode || "";
}

function filteredMovements() {
    const query = ($("history-search")?.value || "").trim().toLowerCase();
    const type = $("history-type")?.value || "";
    return state.movements.filter((movement) => {
        if (type && movement.movementType !== type) return false;
        if (!query) return true;
        return [movement.productName, movement.productCode, productBarcodeByCode(movement.productCode), movement.note, movement.actorName, movement.movementType, movement.id]
            .join(" ").toLowerCase().includes(query);
    });
}

function filterAlertItems(items) {
    const query = ($("alert-search")?.value || "").trim().toLowerCase();
    if (!query) return items;
    return items.filter((item) => [item.name, item.code, productBarcodeByCode(item.code)].join(" ").toLowerCase().includes(query));
}

function renderMovements() {
    const movements = filteredMovements();
    const page = getPageSlice(movements, "history");

    $("history-table-body").innerHTML = movements.length
        ? page.rows.map((movement) => `
            <tr class="row-clickable">
                <td data-label="${escapeHtml(t("time"))}">${escapeHtml(formatDateTime(movement.createdAt))}</td>
                <td data-label="${escapeHtml(t("product_name"))}">
                    <strong>${escapeHtml(movement.productName)}</strong>
                    <div class="table-sub">${escapeHtml(movement.productCode)}</div>
                    <div class="table-sub history-time-sub">${escapeHtml(formatDateTime(movement.createdAt))}</div>
                </td>
                <td data-label="${escapeHtml(t("type"))}"><span class="type-badge type-${escapeHtml(movement.movementType)}">${escapeHtml(movement.movementType === "deactivate" ? "archived" : movement.movementType)}</span></td>
                <td data-label="${escapeHtml(t("qty_change"))}" class="text-right">${escapeHtml(movement.quantityChange)}</td>
                <td data-label="${escapeHtml(t("balance"))}" class="text-right">${escapeHtml(movement.balanceAfter)}</td>
                <td data-label="${escapeHtml(t("actor"))}">${escapeHtml(movement.actorName)}</td>
                <td data-label="${escapeHtml(t("note"))}">${escapeHtml(movement.note)}</td>
                <td data-label="${escapeHtml(t("actions"))}" class="history-action-cell">
                    <button type="button" class="history-more-button" data-history-more aria-expanded="false" aria-label="View more movement details">...</button>
                </td>
            </tr>
        `).join("")
        : `<tr><td colspan="8" class="empty-state">${escapeHtml(t("no_history"))}</td></tr>`;
    renderPager("history-pager", "history", page.totalPages);
}

function handleHistoryRowAction(event) {
    const row = event.target.closest("tr.row-clickable");
    if (!row) {
        return;
    }
    const expanded = row.classList.toggle("history-row-expanded");
    row.querySelector("[data-history-more]")?.setAttribute("aria-expanded", String(expanded));
}

function renderUsers() {
    const page = getPageSlice(state.users, "users");

    $("users-table-body").innerHTML = state.users.length
        ? page.rows.map((user) => `
            <tr>
                <td data-label="${escapeHtml(t("full_name"))}"><strong>${escapeHtml(user.fullName)}</strong></td>
                <td data-label="${escapeHtml(t("username"))}">${escapeHtml(user.username)}</td>
                <td data-label="${escapeHtml(t("role"))}">${escapeHtml(user.role === "admin" ? t("role_admin") : t("role_cashier"))}</td>
                <td data-label="${escapeHtml(t("status"))}">${user.isActive ? `<span class="status-pill status-good"><span class="status-dot" aria-hidden="true"></span>${escapeHtml(t("active"))}</span>` : `<span class="status-pill status-expired"><span class="status-dot" aria-hidden="true"></span>${escapeHtml(t("inactive"))}</span>`}</td>
                <td data-label="${escapeHtml(t("created"))}">${escapeHtml(formatDateTime(user.createdAt))}</td>
            </tr>
        `).join("")
        : `<tr><td colspan="5" class="empty-state">${escapeHtml(t("no_users"))}</td></tr>`;
    renderPager("users-pager", "users", page.totalPages);
}

function renderSuppliers() {
    const page = getPageSlice(state.suppliers, "suppliers");
    $("suppliers-table-body").innerHTML = state.suppliers.length
        ? page.rows.map((supplier) => `
            <tr class="row-clickable" data-ledger-row="${supplier.id}">
                <td data-label="Name"><strong>${escapeHtml(supplier.name)}</strong></td>
                <td data-label="Phone">${escapeHtml(supplier.phone || "-")}</td>
                <td data-label="Balance Owed" class="text-right">${escapeHtml(formatCurrency(supplier.balance))}</td>
                <td data-label="Actions" class="text-center">
                    <button type="button" class="mini-btn" data-ledger-type="supplier" data-ledger-id="${supplier.id}">Ledger</button>
                    <button type="button" class="danger-btn" data-delete-supplier="${supplier.id}">Remove</button>
                </td>
            </tr>
        `).join("")
        : `<tr><td colspan="4" class="empty-state">No suppliers yet.</td></tr>`;
    renderPager("suppliers-pager", "suppliers", page.totalPages);
    populateSupplierDropdown();
}

function populateSupplierDropdown() {
    const select = $("inbound-supplier");
    if (!select) return;
    const current = select.value;
    select.innerHTML = `<option value="">No supplier</option>` +
        state.suppliers.map((s) => `<option value="${s.id}">${escapeHtml(s.name)}</option>`).join("");
    select.value = current;
}

async function handleInboundQuickSupplier() {
    const name = $("inbound-new-supplier-name").value.trim();
    if (!name) {
        showNotification("Enter a supplier name.", "error");
        return;
    }
    try {
        const created = await api("/api/suppliers", {
            method: "POST",
            body: { name, phone: $("inbound-new-supplier-phone").value.trim() }
        });
        const response = await api("/api/suppliers");
        state.suppliers = response.suppliers;
        renderSuppliers();
        $("inbound-supplier").value = String(created.supplierId);
        $("inbound-new-supplier-name").value = "";
        $("inbound-new-supplier-phone").value = "";
        $("inbound-new-supplier").classList.add("hidden");
        showNotification("Supplier added and selected.");
    } catch (error) {
        showNotification(error.message, "error");
    }
}

async function handleCreateSupplier(event) {
    event.preventDefault();
    try {
        await api("/api/suppliers", {
            method: "POST",
            body: { name: $("supplier-name").value.trim(), phone: $("supplier-phone").value.trim() }
        });
        $("supplier-form").reset();
        const response = await api("/api/suppliers");
        state.suppliers = response.suppliers;
        renderSuppliers();
        showNotification("Supplier added.");
    } catch (error) {
        showNotification(error.message, "error");
    }
}

async function handleDeleteSupplier(id) {
    try {
        await api(`/api/suppliers/${id}`, { method: "DELETE" });
        const response = await api("/api/suppliers");
        state.suppliers = response.suppliers;
        renderSuppliers();
        showNotification("Supplier removed.");
    } catch (error) {
        showNotification(error.message, "error");
    }
}

function renderCustomers() {
    const page = getPageSlice(state.customers, "customers");
    $("customers-table-body").innerHTML = state.customers.length
        ? page.rows.map((customer) => `
            <tr class="row-clickable" data-ledger-row="${customer.id}">
                <td data-label="Name"><strong>${escapeHtml(customer.name)}</strong></td>
                <td data-label="Phone">${escapeHtml(customer.phone || "-")}</td>
                <td data-label="Credit Balance" class="text-right">${escapeHtml(formatCurrency(customer.creditBalance))}</td>
                <td data-label="Actions" class="text-center">
                    <button type="button" class="mini-btn" data-ledger-type="customer" data-ledger-id="${customer.id}">Ledger</button>
                    ${state.user?.role === "admin" ? `<button type="button" class="danger-btn" data-delete-customer="${customer.id}">Remove</button>` : ""}
                </td>
            </tr>
        `).join("")
        : `<tr><td colspan="4" class="empty-state">No customers yet.</td></tr>`;
    renderPager("customers-pager", "customers", page.totalPages);
}

async function handleCreateCustomer(event) {
    event.preventDefault();
    try {
        await api("/api/customers", {
            method: "POST",
            body: { name: $("customer-name").value.trim(), phone: $("customer-phone").value.trim() }
        });
        $("customer-form").reset();
        const response = await api("/api/customers");
        state.customers = response.customers;
        renderCustomers();
        showNotification("Customer added.");
    } catch (error) {
        showNotification(error.message, "error");
    }
}

async function handleDeleteCustomer(id) {
    try {
        await api(`/api/customers/${id}`, { method: "DELETE" });
        const response = await api("/api/customers");
        state.customers = response.customers;
        renderCustomers();
        showNotification("Customer removed.");
    } catch (error) {
        showNotification(error.message, "error");
    }
}

function renderExpenses() {
    const page = getPageSlice(state.expenses, "expenses");
    $("expenses-table-body").innerHTML = state.expenses.length
        ? page.rows.map((expense) => `
            <tr>
                <td data-label="Date">${escapeHtml(formatDate(expense.expenseDate))}</td>
                <td data-label="Category"><strong>${escapeHtml(expense.category)}</strong></td>
                <td data-label="Description">${escapeHtml(expense.description || "-")}</td>
                <td data-label="Amount" class="text-right">${escapeHtml(formatCurrency(expense.amount))}</td>
                <td data-label="Actor">${escapeHtml(expense.actorName)}</td>
                <td data-label="Actions" class="text-center">
                    <button type="button" class="danger-btn" data-delete-expense="${expense.id}">Delete</button>
                </td>
            </tr>
        `).join("")
        : `<tr><td colspan="6" class="empty-state">No expenses recorded yet.</td></tr>`;
    renderPager("expenses-pager", "expenses", page.totalPages);
}

async function handleCreateExpense(event) {
    event.preventDefault();
    try {
        await api("/api/expenses", {
            method: "POST",
            body: {
                category: $("expense-category").value.trim(),
                description: $("expense-description").value.trim(),
                amount: Number($("expense-amount").value) || 0,
                expenseDate: $("expense-date").value
            }
        });
        $("expense-form").reset();
        const response = await api("/api/expenses");
        state.expenses = response.expenses;
        renderExpenses();
        showNotification("Expense recorded.");
    } catch (error) {
        showNotification(error.message, "error");
    }
}

async function handleDeleteExpense(id) {
    try {
        await api(`/api/expenses/${id}`, { method: "DELETE" });
        const response = await api("/api/expenses");
        state.expenses = response.expenses;
        renderExpenses();
        showNotification("Expense deleted.");
    } catch (error) {
        showNotification(error.message, "error");
    }
}

// ---- Shared Supplier/Customer ledger modal ----
const ledgerState = { type: null, id: null };

async function openLedgerModal(type, id) {
    ledgerState.type = type;
    ledgerState.id = id;
    const typeSelect = $("ledger-entry-type");
    typeSelect.innerHTML = type === "supplier"
        ? `<option value="due">Add Due (purchase)</option><option value="payment">Record Payment</option>`
        : `<option value="credit_sale">Add Credit Sale</option><option value="payment">Record Payment</option>`;
    $("ledger-form").reset();
    $("ledger-modal").classList.remove("hidden");
    await refreshLedgerModal();
    lucide.createIcons();
}

async function refreshLedgerModal() {
    const { type, id } = ledgerState;
    const endpoint = type === "supplier" ? `/api/suppliers/${id}/ledger` : `/api/customers/${id}/ledger`;
    const response = await api(endpoint);
    const record = type === "supplier" ? response.supplier : response.customer;
    const balance = type === "supplier" ? record.balance : record.creditBalance;

    $("ledger-modal-title").textContent = `${record.name} — Ledger`;
    $("ledger-modal-balance").textContent = `${type === "supplier" ? "Balance owed" : "Credit balance"}: ${formatCurrency(balance)}`;

    $("ledger-entries-list").innerHTML = response.entries.length
        ? response.entries.map((entry) => `
            <div class="ledger-entry-row">
                <div>
                    <strong>${entry.entryType === "payment" ? "Payment" : entry.entryType === "due" ? "Due added" : "Credit sale"}</strong>
                    <span class="ledger-entry-note">${escapeHtml(entry.note || "")}</span>
                </div>
                <div class="ledger-entry-meta">
                    <span class="${entry.entryType === "payment" ? "ledger-amount-negative" : "ledger-amount-positive"}">${entry.entryType === "payment" ? "-" : "+"}${escapeHtml(formatCurrency(entry.amount))}</span>
                    <span class="ledger-entry-date">${escapeHtml(formatDateTime(entry.createdAt))}</span>
                </div>
            </div>
        `).join("")
        : `<p class="empty-state">No ledger entries yet.</p>`;
}

function closeLedgerModal() {
    $("ledger-modal").classList.add("hidden");
    ledgerState.type = null;
    ledgerState.id = null;
}

async function handleLedgerSubmit(event) {
    event.preventDefault();
    const { type, id } = ledgerState;
    if (!type || !id) return;

    const endpoint = type === "supplier" ? `/api/suppliers/${id}/ledger` : `/api/customers/${id}/ledger`;
    try {
        await api(endpoint, {
            method: "POST",
            body: {
                entryType: $("ledger-entry-type").value,
                amount: Number($("ledger-amount").value) || 0,
                note: $("ledger-note").value.trim()
            }
        });
        $("ledger-form").reset();
        await refreshLedgerModal();
        if (type === "supplier") {
            const response = await api("/api/suppliers");
            state.suppliers = response.suppliers;
            renderSuppliers();
        } else {
            const response = await api("/api/customers");
            state.customers = response.customers;
            renderCustomers();
        }
        showNotification("Ledger entry saved.");
    } catch (error) {
        showNotification(error.message, "error");
    }
}

// ---- Dashboard: weekly sales chart + best-sellers ----
function renderSalesChart() {
    const container = $("sales-chart");
    if (!container) return;
    const days = state.chart.weeklySales || [];
    if (!days.length) {
        container.innerHTML = `<p class="empty-state">No sales data yet.</p>`;
        return;
    }
    const max = Math.max(1, ...days.map((d) => d.total));
    const bars = days.map((d) => {
        const heightPct = Math.max(4, Math.round((d.total / max) * 100));
        const label = new Date(d.date + "T00:00:00").toLocaleDateString(undefined, { weekday: "short" });
        return `
            <div class="chart-bar-col">
                <div class="chart-bar-track">
                    <div class="chart-bar" style="height:${heightPct}%" title="${escapeHtml(formatCurrency(d.total))}"></div>
                </div>
                <span class="chart-bar-label">${escapeHtml(label)}</span>
            </div>
        `;
    }).join("");
    container.innerHTML = `<div class="chart-bars">${bars}</div>`;
}

function renderBestSellers() {
    const container = $("best-sellers-list");
    if (!container) return;
    const items = state.chart.bestSellers || [];
    container.innerHTML = items.length
        ? items.map((item, index) => `
            <div class="best-seller-row">
                <span class="best-seller-rank">${index + 1}</span>
                <div class="best-seller-info">
                    <strong>${escapeHtml(item.productName)}</strong>
                    <span>${escapeHtml(item.quantity)} sold</span>
                </div>
                <span class="best-seller-revenue">${escapeHtml(formatCurrency(item.revenue))}</span>
            </div>
        `).join("")
        : `<p class="empty-state">No sales yet.</p>`;
}

async function handleCreateUser(event) {
    event.preventDefault();

    try {
        await api("/api/users", {
            method: "POST",
            body: {
                fullName: $("user-full-name").value.trim(),
                username: $("user-username").value.trim(),
                password: $("user-password").value,
                role: $("user-role").value
            }
        });
        $("user-form").reset();
        $("user-role").value = "cashier";
        const response = await api("/api/users");
        state.users = response.users;
        renderUsers();
        showNotification(t("msg_user_created"));
    } catch (error) {
        showNotification(error.message, "error");
    }
}

async function handlePasswordChange(event) {
    event.preventDefault();
    const currentPassword = $("current-password").value;
    const newPassword = $("new-password").value;
    const confirmPassword = $("confirm-password").value;

    if (newPassword !== confirmPassword) {
        showNotification(t("msg_password_mismatch"), "error");
        return;
    }

    try {
        await api("/api/auth/change-password", {
            method: "POST",
            body: { currentPassword, newPassword }
        });
        $("password-form").reset();
        showNotification(t("msg_password_changed"));
    } catch (error) {
        showNotification(error.message, "error");
    }
}

function handleSaleActionClick(event) {
    const button = event.target.closest("[data-print-sale]");
    const row = event.target.closest("tr[data-sale-row]");
    if (button) {
        openReceiptById(Number(button.dataset.printSale));
    } else if (row) {
        openReceiptById(Number(row.dataset.saleRow));
    }
}

async function openReceiptById(saleId) {
    try {
        const sale = state.sales.find((item) => item.id === saleId)
            || state.recentSales.find((item) => item.id === saleId)
            || (await api(`/api/sales/${saleId}`)).sale;

        openReceiptModal(sale);
    } catch (error) {
        showNotification(error.message || t("msg_receipt_unavailable"), "error");
    }
}

function openReceiptModal(sale) {
    state.receiptSale = sale;
    $("receipt-content").innerHTML = buildReceiptPaper(sale, { showProfit: canSeeProfit() });
    $("receipt-modal").classList.remove("hidden");
    lucide.createIcons();
}

function closeReceiptModal() {
    $("receipt-modal").classList.add("hidden");
}

function canSeeProfit() {
    return state.user?.role === "admin" || state.user?.role === "super_admin";
}


function closeTopModal() {
    const open = [...document.querySelectorAll(".modal-shell:not(.hidden)")].pop();
    if (!open) return false;
    if (open.id === "camera-scanner-modal") {
        cameraScanner.close();
        return true;
    }
    const closer = open.querySelector('[id*="close"], [id*="cancel"]');
    if (closer) {
        closer.click();
    } else {
        open.classList.add("hidden");
    }
    return true;
}

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && closeTopModal()) event.stopPropagation();
}, true);

document.addEventListener("mousedown", (event) => {
    if (event.target.classList?.contains("modal-shell") && event.target.id !== "camera-scanner-modal") {
        closeTopModal();
    }
});

function buildReceiptPaper(sale, options = {}) {
    const itemCount = sale.items.reduce((sum, item) => sum + Number(item.quantity), 0);
    const when = sale.createdAt ? formatDateTime(sale.createdAt) : formatDate(sale.saleDate);
    const footer = voucherPrinter.footerText || "Thank you!";
    const discount = Number(sale.discount || 0);
    return `
        <div class="rc-paper">
            <header class="rc-head">
                <img class="rc-logo" src="/logo.svg" alt="" width="32" height="32">
                <div>
                    <h3>${escapeHtml(VENDOR_NAME)}</h3>
                    <p class="rc-kicker">Sales receipt</p>
                </div>
            </header>

            <dl class="rc-meta">
                <div class="rc-meta-wide"><dt>${escapeHtml(t("invoice"))}</dt><dd class="rc-mono">${escapeHtml(sale.invoiceNo)}</dd></div>
                <div><dt>${escapeHtml(t("date"))}</dt><dd>${escapeHtml(when)}</dd></div>
                <div><dt>${escapeHtml(t("cashier"))}</dt><dd>${escapeHtml(sale.cashierName)}</dd></div>
            </dl>

            <div class="rc-items" role="table">
                <div class="rc-items-head" role="row">
                    <span>${escapeHtml(t("product_name"))}</span><span class="rc-r">Qty</span><span class="rc-r">${escapeHtml(t("total"))}</span>
                </div>
                <div class="rc-items-body">
                    ${sale.items.map((item) => `
                        <div class="rc-item" role="row">
                            <span class="rc-item-name">${escapeHtml(item.productName)}<small>@ ${escapeHtml(formatCurrency(item.sellPrice))}</small></span>
                            <span class="rc-r rc-num">${escapeHtml(item.quantity)}</span>
                            <span class="rc-r rc-num rc-amount">${escapeHtml(formatCurrency(item.lineTotal))}</span>
                        </div>
                    `).join("")}
                </div>
            </div>

            <div class="rc-summary">
                <div class="rc-sums">
                    <div><span>${escapeHtml(t("items"))}</span><b>${escapeHtml(itemCount)}</b></div>
                    <div><span>${escapeHtml(t("subtotal"))}</span><b>${escapeHtml(formatCurrency(sale.subtotal))}</b></div>
                    ${discount > 0 ? `<div class="rc-discount"><span>${escapeHtml(t("discount"))}</span><b>&minus;${escapeHtml(formatCurrency(discount))}</b></div>` : ""}
                </div>
                <div class="rc-grand"><span>${escapeHtml(t("total"))}</span><strong>${escapeHtml(formatCurrency(sale.total))}</strong></div>
                ${options.showProfit ? `<div class="rc-internal"><span>${escapeHtml(t("profit"))} <em>staff only &middot; not printed</em></span><b>${escapeHtml(formatCurrency(sale.profit))}</b></div>` : ""}
                <footer class="rc-foot">${escapeHtml(footer)}</footer>
            </div>
        </div>
    `;
}

function buildReceiptMarkup(sale, options = {}) {
    const itemCount = sale.items.reduce((sum, item) => sum + Number(item.quantity), 0);
    const profitRow = options.showProfit
        ? `<div class="receipt-total-row receipt-profit-row"><span>${escapeHtml(t("profit"))}</span><strong>${escapeHtml(formatCurrency(sale.profit))}</strong></div>`
        : "";

    return `
        <div class="receipt-sheet">
            <div class="receipt-head">
                <div class="receipt-head-brand">
                    <h3>${escapeHtml(VENDOR_NAME)}</h3>
                </div>
                <div class="receipt-head-invoice">
                    <strong>${escapeHtml(sale.invoiceNo)}</strong>
                    <p class="receipt-meta">${escapeHtml(formatDate(sale.saleDate))}</p>
                </div>
            </div>

            <div class="receipt-facts">
                <p><strong>${escapeHtml(t("cashier"))}:</strong> ${escapeHtml(sale.cashierName)}</p>
                <p><strong>${escapeHtml(t("date"))}:</strong> ${escapeHtml(formatDate(sale.saleDate))}</p>
            </div>

            <table class="receipt-table">
                <thead>
                    <tr>
                        <th>${escapeHtml(t("product_name"))}</th>
                        <th class="receipt-col-num">${escapeHtml(t("total"))}</th>
                    </tr>
                </thead>
                <tbody>
                    ${sale.items.map((item) => `
                        <tr>
                            <td class="receipt-col-name">
                                ${escapeHtml(item.productName)}
                                <span class="receipt-line-calc">${escapeHtml(item.quantity)} &times; ${escapeHtml(formatCurrency(item.sellPrice))}</span>
                            </td>
                            <td class="receipt-col-num">${escapeHtml(formatCurrency(item.lineTotal))}</td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>

            <div class="receipt-totals">
                <div class="receipt-total-row"><span>${escapeHtml(t("items"))}</span><strong>${escapeHtml(itemCount)}</strong></div>
                <div class="receipt-total-row"><span>${escapeHtml(t("subtotal"))}</span><strong>${escapeHtml(formatCurrency(sale.subtotal))}</strong></div>
                <div class="receipt-total-row"><span>${escapeHtml(t("discount"))}</span><strong>${escapeHtml(formatCurrency(sale.discount))}</strong></div>
                <div class="receipt-total-row receipt-grand-total"><span>${escapeHtml(t("total"))}</span><strong>${escapeHtml(formatCurrency(sale.total))}</strong></div>
                ${profitRow}
            </div>
        </div>
    `;
}

function buildReceiptDocument(sale) {
    return `
        <!DOCTYPE html>
        <html lang="${state.language === "mm" ? "my" : "en"}">
        <head>
            <meta charset="UTF-8">
            <title>${escapeHtml(sale.invoiceNo)}</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 24px; color: #000000; background: #ffffff; }
                h1, h2, h3, p { margin: 0; }
                .receipt-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin-bottom: 16px; }
                .receipt-head-invoice { text-align: right; }
                .receipt-facts { margin-top: 16px; display: grid; gap: 4px; }
                table { width: 100%; border-collapse: collapse; margin-top: 16px; }
                th, td { text-align: left; border-bottom: 1px dashed #b2aeae; padding: 8px 0; color: #000000; }
                .receipt-col-qty, .receipt-col-num { text-align: right; white-space: nowrap; vertical-align: top; width: 110px; }
                .receipt-line-calc { display: block; margin-top: 2px; font-size: 11px; color: #444444; }
                .receipt-totals { margin-top: 16px; display: grid; gap: 6px; max-width: 320px; margin-left: auto; }
                .receipt-total-row { display: flex; justify-content: space-between; gap: 16px; }
                .receipt-grand-total { border-top: 1px solid #000000; padding-top: 6px; font-size: 15px; }
                .receipt-meta { color: #000000; font-size: 12px; }
            </style>
        </head>
        <body>
            ${buildReceiptMarkup(sale)}
            <script>window.onload = () => { window.print(); };</script>
        </body>
        </html>
    `;
}

function handlePrintReceipt() {
    if (!state.receiptSale) {
        showNotification(t("msg_receipt_unavailable"), "error");
        return;
    }
    if (voucherPrinter.enabled) {
        voucherPrinter.printVoucher(state.receiptSale);
        return;
    }
    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) {
        showNotification("Popup blocked. Allow popups to print receipts.", "error");
        return;
    }
    printWindow.document.write(buildReceiptDocument(state.receiptSale));
    printWindow.document.close();
}

function printSalesReport() {
    if (!state.sales.length) {
        showNotification(t("msg_no_sales_pdf"), "error");
        return;
    }

    const totalSales = state.sales.reduce((sum, sale) => sum + sale.total, 0);
    const totalProfit = state.sales.reduce((sum, sale) => sum + sale.profit, 0);
    const showProfit = canSeeProfit();
    const reportWindow = window.open("", "_blank", "width=1100,height=800");
    if (!reportWindow) {
        return;
    }

    const rows = state.sales.map((sale) => `
        <tr>
            <td>${escapeHtml(sale.invoiceNo)}</td>
            <td>${escapeHtml(formatDate(sale.saleDate))}</td>
            <td>${escapeHtml(sale.cashierName)}</td>
            <td>${escapeHtml(sale.items.map((item) => `${item.productName} x${item.quantity}`).join(", "))}</td>
            <td>${escapeHtml(formatCurrency(sale.total))}</td>
            ${showProfit ? `<td>${escapeHtml(formatCurrency(sale.profit))}</td>` : ""}
        </tr>
    `).join("");

    reportWindow.document.write(`
        <!DOCTYPE html>
        <html lang="${state.language === "mm" ? "my" : "en"}">
        <head>
            <meta charset="UTF-8">
            <title>${escapeHtml(VENDOR_NAME)} Report</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 28px; color: #000000; background: #ffffff; }
                h1, h2, p { margin: 0; }
                .head { display: flex; justify-content: space-between; gap: 20px; margin-bottom: 18px; }
                .muted { color: #000000; }
                .strip { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin: 18px 0; }
                .chip { padding: 14px; border: 1px solid #b2aeae; border-radius: 14px; background: #ffffff; color: #000000; }
                table { width: 100%; border-collapse: collapse; }
                th, td { border-bottom: 1px solid #b2aeae; padding: 10px 8px; text-align: left; vertical-align: top; color: #000000; }
                th { color: #000000; font-size: 12px; text-transform: uppercase; }
            </style>
        </head>
        <body>
            <div class="head">
                <div>
                    <h1>${escapeHtml(VENDOR_NAME)}</h1>
                    <p class="muted">${escapeHtml(t("sales_report"))}</p>
                </div>
                <div>
                    <p class="muted">${escapeHtml(t("print_save_pdf"))}</p>
                    <p>${escapeHtml(formatDateTime(new Date().toISOString()))}</p>
                </div>
            </div>

            <div class="strip">
                <div class="chip"><strong>${escapeHtml(t("sales_count"))}</strong><p>${escapeHtml(state.sales.length)}</p></div>
                <div class="chip"><strong>${escapeHtml(t("report_total_sales"))}</strong><p>${escapeHtml(formatCurrency(totalSales))}</p></div>
                ${showProfit ? `<div class="chip"><strong>${escapeHtml(t("report_total_profit"))}</strong><p>${escapeHtml(formatCurrency(totalProfit))}</p></div>` : ""}
            </div>

            <table>
                <thead>
                    <tr>
                        <th>${escapeHtml(t("invoice"))}</th>
                        <th>${escapeHtml(t("date"))}</th>
                        <th>${escapeHtml(t("cashier"))}</th>
                        <th>${escapeHtml(t("items"))}</th>
                        <th>${escapeHtml(t("total"))}</th>
                        ${showProfit ? `<th>${escapeHtml(t("profit"))}</th>` : ""}
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
            <script>window.onload = () => { window.print(); };</script>
        </body>
        </html>
    `);
    reportWindow.document.close();
}

async function downloadAuthenticatedFile(url) {
    try {
        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${state.token}`
            }
        });

        if (!response.ok) {
            const payload = await response.json().catch(() => ({}));
            throw new Error(payload.message || "Download failed.");
        }

        const blob = await response.blob();
        const header = response.headers.get("Content-Disposition") || "";
        const match = header.match(/filename="?([^"]+)"?/i);
        const fileName = match?.[1] || "download.dat";
        const objectUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = objectUrl;
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(objectUrl);
    } catch (error) {
        showNotification(error.message, "error");
    }
}

// =====================================================
// BARCODE SCANNER INTEGRATION
// =====================================================
// Hardware scanners emulate a keyboard: they burst characters far faster than a
// human types, then send a terminator. We detect the burst by inter-key timing.
const barcodeScanner = {
    enabled: JSON.parse(localStorage.getItem("pharmacy_barcode_enabled") || "false"),
    prefix: localStorage.getItem("pharmacy_barcode_prefix") || "",
    terminator: localStorage.getItem("pharmacy_barcode_terminator") || "Enter",
    minLength: Number(localStorage.getItem("pharmacy_barcode_minlength")) || 4,
    buffer: "",
    lastKeyTime: 0,
    timeout: null,
    testMode: false,
    SCAN_THRESHOLD: 60,
    IDLE_FLUSH: 120,

    init() {
        document.addEventListener("keydown", (event) => this.handleKey(event), true);
        this.updateUI();
    },

    handleKey(event) {
        if (!this.enabled) return;

        const target = event.target;
        const isField = target instanceof HTMLElement
            && (target.tagName === "TEXTAREA" || target.tagName === "SELECT"
                || (target.tagName === "INPUT" && target.id !== "pos-search"));
        if (isField && !this.testMode) return;

        const now = Date.now();
        const gap = now - this.lastKeyTime;
        this.lastKeyTime = now;

        if (gap > this.SCAN_THRESHOLD && event.key.length === 1) {
            this.buffer = event.key;
            this.armIdleFlush();
            return;
        }

        const isTerminator = event.key === "Enter"
            || (this.terminator === "Tab" && event.key === "Tab");

        if (isTerminator) {
            if (this.buffer.length >= this.minLength) {
                event.preventDefault();
                event.stopPropagation();
                this.commit();
            }
            this.buffer = "";
            clearTimeout(this.timeout);
            return;
        }

        if (event.key.length === 1 && !event.ctrlKey && !event.altKey && !event.metaKey) {
            this.buffer += event.key;
            this.armIdleFlush();
        }
    },

    armIdleFlush() {
        clearTimeout(this.timeout);
        if (this.terminator !== "none") return;
        this.timeout = setTimeout(() => {
            if (this.buffer.length >= this.minLength) this.commit();
            this.buffer = "";
        }, this.IDLE_FLUSH);
    },

    commit() {
        let code = this.buffer.trim();
        this.buffer = "";
        if (this.prefix && code.startsWith(this.prefix)) {
            code = code.slice(this.prefix.length);
        }
        if (!code) return;

        if (this.testMode) {
            this.reportTest(code);
            return;
        }
        this.processBarcode(code);
    },

    processBarcode(code) {
        const needle = code.toLowerCase();
        const product = state.products.find((item) => String(item.code).toLowerCase() === needle)
            || state.products.find((item) => String(item.barcode || "").toLowerCase() === needle);

        if (!product) {
            this.flashIndicator(false, `No product matches ${code}`);
            showNotification(`Product not found: ${code}`, "error");
            return;
        }

        if (state.activeTab !== "pos") {
            switchTab("pos");
        }
        const searchField = document.getElementById("pos-search");
        if (searchField) searchField.value = "";
        addToCart(product.id);
        this.flashIndicator(true, `${product.name} added`);
    },

    reportTest(code) {
        this.testMode = false;
        const readout = document.getElementById("barcode-test-readout");
        if (readout) {
            readout.textContent = `Captured "${code}" (${code.length} characters). Scanner is working.`;
            readout.classList.add("is-success");
        }
        const button = document.getElementById("barcode-test-btn");
        if (button) button.classList.remove("is-listening");
        this.updateUI();
    },

    startTest() {
        if (!this.enabled) {
            showNotification("Enable the barcode scanner first.", "error");
            return;
        }
        this.testMode = true;
        this.buffer = "";
        const readout = document.getElementById("barcode-test-readout");
        if (readout) {
            readout.textContent = "Listening… scan a barcode now.";
            readout.classList.remove("is-success");
        }
        const button = document.getElementById("barcode-test-btn");
        if (button) button.classList.add("is-listening");
        this.updateUI();

        clearTimeout(this.testTimeout);
        this.testTimeout = setTimeout(() => {
            if (!this.testMode) return;
            this.testMode = false;
            if (readout) readout.textContent = "No scan detected. Check that the scanner is powered on and set to keyboard (HID) mode.";
            if (button) button.classList.remove("is-listening");
            this.updateUI();
        }, 15000);
    },

    feedback(success) {
        try {
            this.audio = this.audio || new (window.AudioContext || window.webkitAudioContext)();
            const osc = this.audio.createOscillator();
            const gain = this.audio.createGain();
            osc.type = "sine";
            osc.frequency.value = success ? 1760 : 220;
            gain.gain.value = 0.08;
            osc.connect(gain);
            gain.connect(this.audio.destination);
            osc.start();
            osc.stop(this.audio.currentTime + (success ? 0.08 : 0.25));
        } catch (error) { /* audio is optional */ }
        if (navigator.vibrate) navigator.vibrate(success ? 40 : [60, 40, 60]);
    },

    flashIndicator(success, message) {
        this.feedback(success);
        const cameraMessage = document.getElementById("camera-scanner-message");
        const cameraModal = document.getElementById("camera-scanner-modal");
        if (cameraMessage && cameraModal && !cameraModal.classList.contains("hidden")) {
            cameraMessage.textContent = (success ? "\u2713 " : "\u2715 ") + message + (success ? " \u2014 keep scanning" : "");
            cameraMessage.hidden = false;
        }
        const indicator = document.getElementById("barcode-indicator");
        if (!indicator) return;
        indicator.hidden = false;
        indicator.classList.remove("scan-success", "scan-error");
        indicator.classList.add(success ? "scan-success" : "scan-error");
        indicator.textContent = (success ? "✓ " : "✕ ") + message;
        clearTimeout(this.indicatorTimeout);
        this.indicatorTimeout = setTimeout(() => {
            indicator.hidden = true;
        }, 2200);
    },

    toggle(enabled) {
        this.enabled = enabled;
        localStorage.setItem("pharmacy_barcode_enabled", JSON.stringify(enabled));
        this.buffer = "";
        this.updateUI();
    },

    setConfig({ prefix, terminator, minLength }) {
        if (prefix !== undefined) {
            this.prefix = prefix;
            localStorage.setItem("pharmacy_barcode_prefix", prefix);
        }
        if (terminator !== undefined) {
            this.terminator = terminator;
            localStorage.setItem("pharmacy_barcode_terminator", terminator);
        }
        if (minLength !== undefined) {
            this.minLength = Math.min(50, Math.max(3, Number(minLength) || 4));
            localStorage.setItem("pharmacy_barcode_minlength", String(this.minLength));
        }
        this.updateUI();
    },

    updateUI() {
        const toggle = document.getElementById("barcode-scanner-toggle");
        if (toggle) toggle.checked = this.enabled;

        const body = document.getElementById("barcode-scanner-settings");
        if (body) body.classList.toggle("hidden", !this.enabled);

        const prefixInput = document.getElementById("barcode-prefix");
        if (prefixInput) prefixInput.value = this.prefix;
        const suffixSelect = document.getElementById("barcode-suffix");
        if (suffixSelect) suffixSelect.value = this.terminator;
        const minInput = document.getElementById("barcode-min-length");
        if (minInput) minInput.value = this.minLength;

        const dot = document.getElementById("barcode-status-dot");
        const text = document.getElementById("barcode-status-text");
        if (dot) {
            dot.className = "status-indicator"
                + (this.testMode ? " listening" : this.enabled ? " connected" : "");
        }
        if (text) {
            text.textContent = this.testMode
                ? "Listening for a test scan…"
                : this.enabled ? "Active — ready to scan" : "Disabled";
        }

        const chip = document.getElementById("pos-scan-chip");
        const chipText = document.getElementById("pos-scan-chip-text");
        if (chip) chip.classList.toggle("is-active", this.enabled);
        if (chipText) chipText.textContent = this.enabled ? "Scanner ready" : "Scanner off";
    }
};

// =====================================================
// VOUCHER / RECEIPT PRINTER INTEGRATION
// =====================================================
const voucherPrinter = {
    enabled: JSON.parse(localStorage.getItem("pharmacy_printer_enabled") || "false"),
    printerType: localStorage.getItem("pharmacy_printer_type") || "thermal-80",
    autoPrint: localStorage.getItem("pharmacy_printer_autoprint") || "ask",
    copies: Number(localStorage.getItem("pharmacy_printer_copies")) || 1,
    headerText: (() => {
        const saved = localStorage.getItem("pharmacy_printer_header");
        return saved === null || saved === "Shine Digital Store" ? VENDOR_NAME : saved;
    })(),
    footerText: localStorage.getItem("pharmacy_printer_footer") ?? "Thank you for shopping!",
    // "dialog" uses the browser print dialog (any OS-driven printer).
    // "serial" / "usb" send raw ESC/POS bytes directly to a connected thermal printer.
    connectionMode: localStorage.getItem("pharmacy_printer_connmode") || "dialog",
    serialPort: null,
    baudRate: Number(localStorage.getItem("pharmacy_printer_baud")) || 9600,
    reconnecting: null,
    usbDevice: null,
    usbInterfaceNumber: null,
    usbEndpointNumber: null,
    bleDevice: null,
    bleCharacteristic: null,
    // Common service UUIDs used by BLE receipt printers (needed so Chrome lets us read their services).
    bleServices: [
        "000018f0-0000-1000-8000-00805f9b34fb",
        "0000ff00-0000-1000-8000-00805f9b34fb",
        "0000ffe0-0000-1000-8000-00805f9b34fb",
        "0000fff0-0000-1000-8000-00805f9b34fb",
        "0000ae30-0000-1000-8000-00805f9b34fb",
        "49535343-fe7d-4ae5-8fa9-9fafd205e455",
        "e7810a71-73ae-499d-8c15-faa9aef0c3f2"
    ],

    report(level, message, extra = {}) {
        reportIssue(level, "printer", message, { connectionMode: this.connectionMode, printerType: this.printerType, ...extra });
    },

    init() {
        this.updateUI();
        this.restoreConnection();
        if ("usb" in navigator) {
            navigator.usb.addEventListener("disconnect", (event) => {
                if (event.device === this.usbDevice) {
                    this.usbDevice = null;
                    this.usbInterfaceNumber = null;
                    this.usbEndpointNumber = null;
                    showNotification("USB printer was unplugged. Plug it back in and it reconnects automatically.", "error");
                    this.report("warn", "USB printer was unplugged");
                    this.updateUI();
                }
            });
            navigator.usb.addEventListener("connect", () => this.ensureConnected());
        }
        if ("serial" in navigator) {
            navigator.serial.addEventListener("disconnect", (event) => {
                if (event.target === this.serialPort) {
                    this.serialPort = null;
                    this.updateUI();
                }
            });
            navigator.serial.addEventListener("connect", () => this.ensureConnected());
        }
        document.addEventListener("visibilitychange", () => {
            if (document.visibilityState === "visible") this.ensureConnected();
        });
    },

    // Re-open the remembered printer without any prompt. Safe to call any time.
    async ensureConnected() {
        if (!this.enabled || this.connectionMode === "dialog") return false;
        if (this.isDirectConnected()) return true;
        if (!this.reconnecting) {
            this.reconnecting = this.restoreConnection().finally(() => {
                this.reconnecting = null;
                this.updateUI();
            });
            this.updateUI();
        }
        await this.reconnecting;
        return this.isDirectConnected();
    },

    // Browsers drop the live connection on refresh, sleep or unplug, but remember which devices the user approved.
    async restoreConnection() {
        try {
            if (this.connectionMode === "usb" && "usb" in navigator) {
                if (!this.usbDevice?.opened) {
                    const savedId = localStorage.getItem("pharmacy_printer_usb_id");
                    const devices = await navigator.usb.getDevices();
                    const device = devices.find((d) => `${d.vendorId}:${d.productId}` === savedId) || (devices.length === 1 ? devices[0] : null);
                    if (device) await this.openUsbDevice(device);
                }
            } else if (this.connectionMode === "serial" && "serial" in navigator) {
                if (!this.serialPort?.writable) {
                    let info = null;
                    try { info = JSON.parse(localStorage.getItem("pharmacy_printer_serial_info") || "null"); } catch (error) { /* no saved info */ }
                    const ports = await navigator.serial.getPorts();
                    const port = ports.find((p) => {
                        const details = p.getInfo();
                        return info && details.usbVendorId === info.usbVendorId && details.usbProductId === info.usbProductId;
                    }) || ports[0];
                    if (port) {
                        if (!port.writable) await port.open({ baudRate: this.baudRate });
                        this.serialPort = port;
                    }
                }
            } else if (this.connectionMode === "bluetooth" && "bluetooth" in navigator) {
                if (!this.bleCharacteristic || !this.bleDevice?.gatt?.connected) {
                    let device = this.bleDevice;
                    if (!device && navigator.bluetooth.getDevices) {
                        const savedId = localStorage.getItem("pharmacy_printer_ble_id");
                        const known = await navigator.bluetooth.getDevices();
                        device = known.find((d) => d.id === savedId) || null;
                    }
                    if (device) await this.attachBle(device);
                }
            }
        } catch (error) {
            this.report("warn", `Could not reopen the saved printer: ${error.name}: ${error.message}`);
        }
        this.updateUI();
    },

    async openUsbDevice(device) {
        await this.disconnect(false);
        await device.open();
        if (device.configuration === null) await device.selectConfiguration(1);
        const candidates = device.configuration.interfaces
            .map((iface) => ({ iface, alt: iface.alternates.find((alt) => alt.endpoints.some((ep) => ep.direction === "out")) }))
            .filter((candidate) => candidate.alt);
        const pick = candidates.find((candidate) => candidate.alt.interfaceClass === 7) || candidates[0];
        if (!pick) throw new Error("No writable endpoint found on this USB device.");
        await device.claimInterface(pick.iface.interfaceNumber);
        const outEndpoint = pick.alt.endpoints.find((ep) => ep.direction === "out");

        this.usbDevice = device;
        this.usbInterfaceNumber = pick.iface.interfaceNumber;
        this.usbEndpointNumber = outEndpoint.endpointNumber;
        this.connectionMode = "usb";
        localStorage.setItem("pharmacy_printer_connmode", "usb");
        localStorage.setItem("pharmacy_printer_usb_id", `${device.vendorId}:${device.productId}`);
    },

    // ---- Direct ESC/POS connection (Web Serial / WebUSB) ----
    async connectSerial() {
        if (!("serial" in navigator)) {
            showNotification("Web Serial isn't supported in this browser. Use Chrome or Edge on desktop, or use the print dialog instead.", "error");
            return;
        }
        try {
            const port = await navigator.serial.requestPort();
            await this.disconnect(false);
            await port.open({ baudRate: this.baudRate });
            this.serialPort = port;
            this.connectionMode = "serial";
            localStorage.setItem("pharmacy_printer_connmode", "serial");
            try { localStorage.setItem("pharmacy_printer_serial_info", JSON.stringify(port.getInfo())); } catch (error) { /* optional */ }
            showNotification("Thermal printer connected (Serial).");
        } catch (error) {
            if (error.name !== "NotFoundError") {
                showNotification(error.message, "error");
                this.report("error", `Serial connect failed: ${error.name}: ${error.message}`);
            }
        }
        this.updateUI();
    },

    async connectUsb() {
        if (!("usb" in navigator)) {
            showNotification("WebUSB isn't supported in this browser. Use Chrome or Edge on desktop, or use the print dialog instead.", "error");
            return;
        }
        try {
            const device = await navigator.usb.requestDevice({ filters: [] });
            await this.openUsbDevice(device);
            showNotification("Thermal printer connected (USB).");
        } catch (error) {
            if (error.name !== "NotFoundError") this.report("error", `USB connect failed: ${error.name}: ${error.message}`);
            if (error.name === "NotFoundError") {
                // user closed the picker
            } else if (/access denied|claim|busy|protected/i.test(error.message)) {
                showNotification("Windows already owns this USB printer with its own driver, so the browser can't take it. Set Connection to \"Browser print dialog\" (recommended), or replace the driver with WinUSB using Zadig.", "error");
            } else {
                showNotification(error.message, "error");
            }
        }
        this.updateUI();
    },

    async connectBluetooth() {
        if (!("bluetooth" in navigator)) {
            showNotification("Web Bluetooth isn't supported in this browser. Use Chrome or Edge, or pair the printer in Windows and use Serial.", "error");
            return;
        }
        try {
            const device = await navigator.bluetooth.requestDevice({
                acceptAllDevices: true,
                optionalServices: this.bleServices
            });
            await this.disconnect(false);
            await this.attachBle(device);
            showNotification("Portable printer connected (Bluetooth).");
        } catch (error) {
            if (error.name !== "NotFoundError") {
                showNotification(error.message, "error");
                this.report("error", `Bluetooth connect failed: ${error.name}: ${error.message}`);
            }
        }
        this.updateUI();
    },

    async attachBle(device) {
        const server = await device.gatt.connect();
        let characteristic = null;
        for (const service of await server.getPrimaryServices()) {
            for (const candidate of await service.getCharacteristics()) {
                if (candidate.properties.write || candidate.properties.writeWithoutResponse) {
                    characteristic = candidate;
                    break;
                }
            }
            if (characteristic) break;
        }
        if (!characteristic) {
            device.gatt.disconnect();
            throw new Error("No writable Bluetooth channel found. If this printer uses classic Bluetooth, pair it in Windows Bluetooth settings and use \"Connect via Serial\" instead.");
        }
        this.bleDevice = device;
        this.bleCharacteristic = characteristic;
        if (!device.kksListening) {
            device.kksListening = true;
            // Keep the device so it can reconnect after the printer sleeps; only the live channel is dropped.
            device.addEventListener("gattserverdisconnected", () => {
                if (this.bleDevice === device) {
                    this.bleCharacteristic = null;
                    this.updateUI();
                }
            });
        }
        this.connectionMode = "bluetooth";
        localStorage.setItem("pharmacy_printer_connmode", "bluetooth");
        localStorage.setItem("pharmacy_printer_ble_id", device.id);
    },

    async disconnect(resetMode = true) {
        try {
            if (this.serialPort) {
                await this.serialPort.close();
            }
        } catch (error) { /* ignore close errors */ }
        try {
            if (this.usbDevice) {
                if (this.usbInterfaceNumber !== null) await this.usbDevice.releaseInterface(this.usbInterfaceNumber);
                await this.usbDevice.close();
            }
        } catch (error) { /* ignore close errors */ }
        try {
            if (this.bleDevice?.gatt?.connected) this.bleDevice.gatt.disconnect();
        } catch (error) { /* ignore close errors */ }
        this.serialPort = null;
        this.usbDevice = null;
        this.usbInterfaceNumber = null;
        this.usbEndpointNumber = null;
        this.bleDevice = null;
        this.bleCharacteristic = null;
        if (resetMode) {
            this.connectionMode = "dialog";
            localStorage.setItem("pharmacy_printer_connmode", "dialog");
        }
        this.updateUI();
    },

    isDirectConnected() {
        return (this.connectionMode === "serial" && !!this.serialPort?.writable)
            || (this.connectionMode === "usb" && !!this.usbDevice?.opened)
            || (this.connectionMode === "bluetooth" && !!this.bleCharacteristic && !!this.bleDevice?.gatt?.connected);
    },

    async sendBytes(bytes) {
        if (this.connectionMode === "serial" && this.serialPort?.writable) {
            const writer = this.serialPort.writable.getWriter();
            try {
                await writer.write(bytes);
            } finally {
                writer.releaseLock();
            }
            return true;
        }
        if (this.connectionMode === "usb" && this.usbDevice) {
            const chunkSize = 4096;
            for (let offset = 0; offset < bytes.length; offset += chunkSize) {
                const result = await this.usbDevice.transferOut(this.usbEndpointNumber, bytes.slice(offset, offset + chunkSize));
                if (result.status !== "ok") throw new Error(`USB transfer ${result.status}. Check the cable, paper and printer cover.`);
            }
            return true;
        }
        if (this.connectionMode === "bluetooth" && this.bleCharacteristic) {
            const chunkSize = 20;
            const withoutResponse = this.bleCharacteristic.properties.writeWithoutResponse;
            for (let offset = 0; offset < bytes.length; offset += chunkSize) {
                const chunk = bytes.slice(offset, offset + chunkSize);
                if (withoutResponse) await this.bleCharacteristic.writeValueWithoutResponse(chunk);
                else await this.bleCharacteristic.writeValue(chunk);
                await new Promise((resolve) => setTimeout(resolve, 20));
            }
            return true;
        }
        return false;
    },

    // ---- ESC/POS command + receipt builder ----
    buildEscPosBytes(sale) {
        const ESC = 0x1b;
        const GS = 0x1d;
        const width = this.paperMm() === 58 ? 32 : 48;
        const bytes = [];
        const push = (arr) => bytes.push(...arr);
        const textLine = (str = "") => push(Array.from(new TextEncoder().encode(str + "\n")));
        const hr = () => textLine("-".repeat(width));
        const twoCol = (left, right) => {
            left = String(left);
            right = String(right);
            const gap = Math.max(1, width - left.length - right.length);
            return left + " ".repeat(gap) + right;
        };
        const align = (n) => push([ESC, 0x61, n]);
        const bold = (on) => push([ESC, 0x45, on ? 1 : 0]);
        const size = (w, h) => push([GS, 0x21, ((w & 0xf) << 4) | (h & 0xf)]);

        push([ESC, 0x40]);
        align(1);
        bold(true);
        size(1, 1);
        textLine(this.headerText || VENDOR_NAME);
        size(0, 0);
        bold(false);
        align(0);
        hr();
        textLine(`${t("invoice")}: ${sale.invoiceNo}`);
        textLine(`${t("date")}: ${formatDate(sale.saleDate)}`);
        textLine(`${t("cashier")}: ${sale.cashierName}`);
        hr();
        sale.items.forEach((item) => {
            textLine(item.productName);
            textLine(twoCol(`${item.quantity} x ${formatCurrency(item.sellPrice)}`, formatCurrency(item.lineTotal)));
        });
        hr();
        textLine(twoCol(t("subtotal"), formatCurrency(sale.subtotal)));
        textLine(twoCol(t("discount"), formatCurrency(sale.discount)));
        bold(true);
        size(0, 1);
        textLine(twoCol(t("total"), formatCurrency(sale.total)));
        size(0, 0);
        bold(false);
        hr();
        align(1);
        textLine(this.footerText);
        textLine("Powered by Shine Digital");
        push([0x0a, 0x0a, 0x0a, 0x0a]);
        push([GS, 0x56, 0x42, 0x00]);
        return new Uint8Array(bytes);
    },

    toggle(enabled) {
        this.enabled = enabled;
        localStorage.setItem("pharmacy_printer_enabled", JSON.stringify(enabled));
        this.updateUI();
    },

    setConfig(config) {
        const map = {
            printerType: "pharmacy_printer_type",
            autoPrint: "pharmacy_printer_autoprint",
            headerText: "pharmacy_printer_header",
            footerText: "pharmacy_printer_footer"
        };
        Object.keys(map).forEach((key) => {
            if (config[key] !== undefined) {
                this[key] = config[key];
                localStorage.setItem(map[key], config[key]);
            }
        });
        if (config.copies !== undefined) {
            this.copies = Math.min(5, Math.max(1, Number(config.copies) || 1));
            localStorage.setItem("pharmacy_printer_copies", String(this.copies));
        }
        this.updateUI();
    },

    paperMm() {
        if (this.printerType === "thermal-58" || this.printerType === "portable-58") return 58;
        if (this.printerType === "a4") return 210;
        return 80;
    },

    paperWidth() {
        return `${this.paperMm()}mm`;
    },

    updateUI() {
        const toggle = document.getElementById("printer-toggle");
        if (toggle) toggle.checked = this.enabled;

        const body = document.getElementById("printer-settings");
        if (body) body.classList.toggle("hidden", !this.enabled);

        const typeSelect = document.getElementById("printer-type");
        if (typeSelect) typeSelect.value = this.printerType;
        const autoSelect = document.getElementById("printer-auto-print");
        if (autoSelect) autoSelect.value = this.autoPrint;
        const copiesInput = document.getElementById("printer-copies");
        if (copiesInput) copiesInput.value = this.copies;
        const headerInput = document.getElementById("printer-header");
        if (headerInput) headerInput.value = this.headerText;
        const footerInput = document.getElementById("printer-footer");
        if (footerInput) footerInput.value = this.footerText;

        const connSelect = document.getElementById("printer-connection-mode");
        if (connSelect) connSelect.value = this.connectionMode;
        const directPanel = document.getElementById("printer-direct-connect");
        if (directPanel) directPanel.classList.toggle("hidden", this.connectionMode === "dialog");
        const disconnectBtn = document.getElementById("printer-disconnect-btn");
        if (disconnectBtn) disconnectBtn.classList.toggle("hidden", !this.isDirectConnected());
        const connectRow = document.getElementById("printer-connect-row");
        if (connectRow) connectRow.classList.toggle("hidden", this.isDirectConnected());

        const dot = document.getElementById("printer-status-dot");
        const text = document.getElementById("printer-status-text");
        const label = { "thermal-80": "Thermal 80mm", "thermal-58": "Thermal 58mm", "portable-80": "Portable 80mm", "portable-58": "Portable 58mm", a4: "A4" }[this.printerType] || this.printerType;
        if (!this.enabled) {
            if (dot) dot.className = "status-indicator";
            if (text) text.textContent = "Disabled";
        } else if (this.connectionMode === "dialog") {
            if (dot) dot.className = "status-indicator connected";
            if (text) text.textContent = `Ready — ${label} via print dialog, ${this.copies} ${this.copies === 1 ? "copy" : "copies"}`;
        } else if (this.isDirectConnected()) {
            if (dot) dot.className = "status-indicator connected";
            if (text) text.textContent = `Connected directly (${this.connectionMode.toUpperCase()}) — ${label}, ${this.copies} ${this.copies === 1 ? "copy" : "copies"}`;
        } else {
            if (dot) dot.className = "status-indicator listening";
            if (text) text.textContent = this.reconnecting
                ? "Reconnecting to the saved printer\u2026"
                : "Not connected \u2014 switch the printer on and it reconnects automatically, or click Connect below";
        }
    },

    buildVoucher(sale) {
        const width = this.paperWidth();
        const isThermal = this.printerType !== "a4";
        const rows = sale.items.map((item) => `<tr>
                <td>${escapeHtml(item.productName)}<br><span class="dim">${item.quantity} x ${escapeHtml(formatCurrency(item.sellPrice))}</span></td>
                <td class="right">${escapeHtml(formatCurrency(item.lineTotal))}</td>
            </tr>`).join("");

        const body = `
            <div class="center bold big">${escapeHtml(this.headerText || VENDOR_NAME)}</div>
            <div class="line"></div>
            <div class="meta"><span>${escapeHtml(t("invoice"))}</span><span>${escapeHtml(sale.invoiceNo)}</span></div>
            <div class="meta"><span>${escapeHtml(t("date"))}</span><span>${escapeHtml(formatDate(sale.saleDate))}</span></div>
            <div class="meta"><span>${escapeHtml(t("cashier"))}</span><span>${escapeHtml(sale.cashierName)}</span></div>
            <div class="line"></div>
            <table>${rows}</table>
            <div class="line"></div>
            <table>
                <tr><td>${escapeHtml(t("subtotal"))}</td><td class="right">${escapeHtml(formatCurrency(sale.subtotal))}</td></tr>
                <tr><td>${escapeHtml(t("discount"))}</td><td class="right">${escapeHtml(formatCurrency(sale.discount))}</td></tr>
                <tr class="total-row"><td>${escapeHtml(t("total"))}</td><td class="right">${escapeHtml(formatCurrency(sale.total))}</td></tr>
            </table>
            <div class="line"></div>
            <div class="center">${escapeHtml(this.footerText)}</div>
            <div class="center dim tiny">Powered by Shine Digital</div>`;

        const copies = Array.from({ length: this.copies }, () => `<section class="voucher">${body}</section>`).join("");

        return `<!DOCTYPE html><html lang="${document.documentElement.lang}"><head><meta charset="UTF-8">
            <title>${escapeHtml(sale.invoiceNo)}</title>
            <style>
                @page { size: ${width} auto; margin: ${isThermal ? "0" : "12mm"}; }
                body { margin: 0; padding: 0; background: #fff; color: #000;
                    font-family: ${isThermal ? '"Courier New", monospace' : 'system-ui, "Segoe UI", sans-serif'};
                    font-size: ${isThermal ? "11px" : "13px"}; }
                .voucher { width: ${isThermal ? width : "auto"}; box-sizing: border-box; padding: 8px; page-break-after: always; }
                .voucher:last-child { page-break-after: auto; }
                .center { text-align: center; } .right { text-align: right; }
                .bold { font-weight: 700; } .big { font-size: ${isThermal ? "14px" : "18px"}; }
                .dim { color: #444; } .tiny { font-size: 9px; margin-top: 6px; }
                .line { border-top: 1px dashed #000; margin: 6px 0; }
                .meta { display: flex; justify-content: space-between; gap: 8px; }
                table { width: 100%; border-collapse: collapse; }
                td { padding: 2px 0; vertical-align: top; }
                .total-row td { font-weight: 700; border-top: 1px solid #000; padding-top: 4px; }
            </style></head><body>${copies}
            <script>window.onload=function(){window.print();setTimeout(function(){window.close();},400);};<\/script>
            </body></html>`;
    },

    async printVoucher(sale) {
        if (this.connectionMode !== "dialog") await this.ensureConnected();
        if (this.isDirectConnected()) {
            const bytes = this.buildEscPosBytes(sale);
            for (let attempt = 1; attempt <= 2; attempt += 1) {
                try {
                    for (let copy = 0; copy < this.copies; copy += 1) {
                        const sent = await this.sendBytes(bytes);
                        if (!sent) throw new Error("Printer is not connected.");
                    }
                    return;
                } catch (error) {
                    this.report("error", `Direct print failed (attempt ${attempt}): ${error.name}: ${error.message}`);
                    if (attempt === 1) {
                        // The link probably went stale (printer slept or cable moved): drop it and reopen once.
                        this.bleCharacteristic = null;
                        if (this.serialPort) { try { await this.serialPort.close(); } catch (closeError) { /* already closed */ } this.serialPort = null; }
                        if (await this.ensureConnected()) continue;
                    }
                    showNotification(`Direct print failed (${error.message}). Falling back to the print dialog.`, "error");
                    break;
                }
            }
        }

        const printWindow = window.open("", "_blank", "width=420,height=640");
        if (!printWindow) {
            showNotification("Popup blocked. Allow popups to print vouchers.", "error");
            this.report("warn", "Print popup was blocked by the browser");
            return;
        }
        printWindow.document.write(this.buildVoucher(sale));
        printWindow.document.close();
    },

    onSaleComplete(sale) {
        if (!this.enabled || this.autoPrint === "never") return;
        if (this.autoPrint === "always") {
            this.printVoucher(sale);
        }
    }
};

// =====================================================
// CAMERA BARCODE SCANNER (phone / webcam, no hardware needed)
// =====================================================
const cameraScanner = {
    enabled: JSON.parse(localStorage.getItem("pharmacy_camera_scanner_enabled") || "false"),
    stream: null,
    detector: null,
    detecting: false,
    supported: "BarcodeDetector" in window,

    init() {
        this.updateUI();
    },

    toggle(enabled) {
        this.enabled = enabled;
        localStorage.setItem("pharmacy_camera_scanner_enabled", JSON.stringify(enabled));
        this.updateUI();
    },

    updateUI() {
        const toggle = document.getElementById("camera-scanner-toggle");
        if (toggle) toggle.checked = this.enabled;
        const body = document.getElementById("camera-scanner-settings");
        if (body) body.classList.toggle("hidden", !this.enabled);
        const chip = document.getElementById("pos-camera-scan-button");
        if (chip) chip.classList.toggle("hidden", !this.enabled);
        const dot = document.getElementById("camera-scanner-status-dot");
        const text = document.getElementById("camera-scanner-status-text");
        if (dot) dot.className = "status-indicator" + (this.enabled ? " connected" : "");
        if (text) {
            text.textContent = !this.enabled
                ? "Disabled"
                : this.supported ? "Ready — tap Open Camera Scanner" : "Not supported in this browser";
        }
    },

    async open({ testMode = false } = {}) {
        const modal = document.getElementById("camera-scanner-modal");
        const video = document.getElementById("camera-scanner-video");
        const message = document.getElementById("camera-scanner-message");
        if (!modal || !video) return;

        this.testMode = testMode;
        modal.classList.remove("hidden");
        message.hidden = true;

        if (!this.supported) {
            message.textContent = "This browser doesn't support live barcode detection (Chrome or Edge is required). Use a USB/Bluetooth scanner, or type the code manually.";
            message.hidden = false;
            return;
        }

        try {
            this.detector = this.detector || new BarcodeDetector({
                formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39", "qr_code"]
            });
            this.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
            video.srcObject = this.stream;
            await video.play();
            this.detecting = true;
            this.loop(video);
        } catch (error) {
            message.textContent = `Could not access the camera: ${error.message}`;
            message.hidden = false;
        }
    },

    async loop(video) {
        if (!this.detecting) return;
        try {
            const codes = await this.detector.detect(video);
            if (codes.length) {
                const value = codes[0].rawValue;
                if (this.testMode) {
                    this.close();
                    barcodeScanner.reportTest(value);
                    return;
                }
                this.lastSeen = Date.now();
                if (value !== this.lastValue) {
                    this.lastValue = value;
                    barcodeScanner.processBarcode(value);
                }
            } else if (this.lastValue && Date.now() - (this.lastSeen || 0) > 700) {
                this.lastValue = null;
            }
        } catch (error) { /* transient decode errors are expected between frames */ }
        this.rafId = requestAnimationFrame(() => this.loop(video));
    },

    close() {
        this.detecting = false;
        this.lastValue = null;
        if (this.rafId) cancelAnimationFrame(this.rafId);
        if (this.stream) {
            this.stream.getTracks().forEach((track) => track.stop());
            this.stream = null;
        }
        const modal = document.getElementById("camera-scanner-modal");
        if (modal) modal.classList.add("hidden");
        const video = document.getElementById("camera-scanner-video");
        if (video) video.srcObject = null;
    }
};

function initDeviceSettings() {
    barcodeScanner.init();
    voucherPrinter.init();
    cameraScanner.init();

    const bind = (id, event, handler) => {
        const element = document.getElementById(id);
        if (element) element.addEventListener(event, handler);
    };

    bind("barcode-scanner-toggle", "change", (event) => barcodeScanner.toggle(event.target.checked));
    bind("barcode-prefix", "change", (event) => barcodeScanner.setConfig({ prefix: event.target.value.trim() }));
    bind("barcode-suffix", "change", (event) => barcodeScanner.setConfig({ terminator: event.target.value }));
    bind("barcode-min-length", "change", (event) => barcodeScanner.setConfig({ minLength: event.target.value }));
    bind("barcode-test-btn", "click", () => barcodeScanner.startTest());

    bind("camera-scanner-toggle", "change", (event) => cameraScanner.toggle(event.target.checked));
    bind("camera-scanner-test-btn", "click", () => cameraScanner.open({ testMode: true }));
    bind("camera-scanner-close", "click", () => cameraScanner.close());
    bind("pos-camera-scan-button", "click", () => cameraScanner.open({ testMode: false }));

    bind("printer-toggle", "change", (event) => voucherPrinter.toggle(event.target.checked));
    bind("printer-type", "change", (event) => voucherPrinter.setConfig({ printerType: event.target.value }));
    bind("printer-auto-print", "change", (event) => voucherPrinter.setConfig({ autoPrint: event.target.value }));
    bind("printer-copies", "change", (event) => voucherPrinter.setConfig({ copies: event.target.value }));
    bind("printer-header", "change", (event) => voucherPrinter.setConfig({ headerText: event.target.value }));
    bind("printer-footer", "change", (event) => voucherPrinter.setConfig({ footerText: event.target.value }));
    bind("printer-connection-mode", "change", (event) => {
        if (event.target.value === "dialog") {
            voucherPrinter.disconnect();
        } else {
            voucherPrinter.connectionMode = event.target.value;
            localStorage.setItem("pharmacy_printer_connmode", event.target.value);
            voucherPrinter.updateUI();
        }
    });
    bind("printer-connect-serial-btn", "click", () => voucherPrinter.connectSerial());
    bind("printer-connect-usb-btn", "click", () => voucherPrinter.connectUsb());
    bind("printer-connect-bluetooth-btn", "click", () => voucherPrinter.connectBluetooth());
    bind("printer-disconnect-btn", "click", () => voucherPrinter.disconnect(false).then(() => voucherPrinter.updateUI()));
    bind("printer-test-btn", "click", () => {
        voucherPrinter.printVoucher({
            invoiceNo: "TEST-0001",
            saleDate: todayIso(),
            cashierName: state.user?.fullName || "Test cashier",
            subtotal: 5000,
            discount: 0,
            total: 5000,
            items: [{ productName: "Test product", quantity: 2, sellPrice: 2500, lineTotal: 5000 }]
        });
    });

    bind("pos-scan-chip", "click", () => switchTab("account"));
}
