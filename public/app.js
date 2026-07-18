const VENDOR_NAME = "Shine Digital Store";

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
    cart: [],
    posCategory: "all",
    posCategoryOpen: false,
    posSearchOpen: false,
    posProductPage: 1,
    activeTab: getInitialActiveTab(),
    pagination: {
        inventory: 1,
        sales: 1,
        history: 1,
        users: 1
    },
    receiptSale: null,
    activeAlertView: "low",
    loadingRequests: 0
};

const adminTabs = new Set(["history", "users"]);
const availableTabs = new Set(["dashboard", "pos", "inventory", "sales", "alerts", "history", "users", "account"]);
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
    users: 8
};

const translations = {
    en: {
        vendor_label: "Pharmacy POS",
        app_name: "Pharmacy POS System",
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
        vendor_label: "ဆေးဆိုင် POS",
        app_name: "ဆေးဆိုင် POS စနစ်",
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
        backup_json: "JSON Backup",
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

document.addEventListener("DOMContentLoaded", () => {
    setDefaultDates();
    bindEvents();
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

function setDefaultDates() {
    const today = new Date().toISOString().split("T")[0];
    const month = today.slice(0, 7);
    $("sales-date-filter").value = today;
    $("sales-month-filter").value = month;
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
    $("inbound-form").addEventListener("submit", handleInboundSubmit);
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

        if (editButton) {
            openProductModal(Number(editButton.dataset.editProduct));
        }

        if (deleteButton) {
            deleteProduct(Number(deleteButton.dataset.deleteProduct));
        }
    });

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
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
            if (response.status === 401 && !options.ignoreUnauthorized) clearSession();
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
        api("/api/alerts")
    ];

    if (state.user.role === "admin") {
        requests.push(api("/api/stock-movements"));
        requests.push(api("/api/users"));
    }

    const results = await Promise.all(requests);
    state.summary = results[0];
    state.products = results[1].products;
    state.recentSales = results[2].sales.slice(0, 8);
    state.sales = results[3].sales;
    state.alerts = results[4];

    if (state.user.role === "admin") {
        state.movements = results[5].movements;
        state.users = results[6].users;
    } else {
        state.movements = [];
        state.logs = [];
        state.users = [];
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
    switchTab(state.activeTab);
    lucide.createIcons();
}

function getPageSlice(rows, key) {
    const pageSize = key === "history" && window.innerWidth <= 720 ? 6 : (PAGE_SIZES[key] || 8);
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
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);

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
    }
}

function renderSummary() {
    const cards = [
        { key: "metric_total_products", value: state.summary.totalProducts || 0, icon: "boxes", target: "inventory" },
        { key: "metric_inventory_value", value: formatCurrency(state.summary.inventoryValue || 0), icon: "wallet", target: "inventory" },
        { key: "metric_low_stock", value: state.summary.lowStockCount || 0, icon: "triangle-alert", target: "low" },
        { key: "metric_expired", value: state.summary.expiredCount || 0, icon: "shield-alert", target: "expired" },
        { key: "metric_today_sales", value: formatCurrency(state.summary.todaySales || 0), icon: "banknote", target: "sales" },
        { key: "metric_today_profit", value: formatCurrency(state.summary.todayProfit || 0), icon: "trending-up", target: "sales" }
    ];

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
    $("dashboard-sales-body").innerHTML = rows.length
        ? rows.map((sale) => `
            <tr>
                <td data-label="${escapeHtml(t("invoice"))}">
                    <strong>${escapeHtml(sale.invoiceNo)}</strong>
                </td>
                <td data-label="${escapeHtml(t("date"))}">${escapeHtml(sale.saleDate)}</td>
                <td data-label="${escapeHtml(t("cashier"))}">${escapeHtml(sale.cashierName)}</td>
                <td data-label="${escapeHtml(t("total"))}" class="text-right">${escapeHtml(formatCurrency(sale.total))}</td>
                <td data-label="${escapeHtml(t("profit"))}" class="text-right">${escapeHtml(formatCurrency(sale.profit))}</td>
                <td data-label="${escapeHtml(t("actions"))}" class="text-center">
                    <button type="button" class="mini-btn" data-print-sale="${sale.id}">
                        ${escapeHtml(t("print"))}
                    </button>
                </td>
            </tr>
        `).join("")
        : `<tr><td colspan="6" class="empty-state">${escapeHtml(t("no_recent_sales"))}</td></tr>`;
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
        const fields = [product.name, product.code, product.brand, product.category]
            .filter(Boolean)
            .map((value) => value.toLowerCase().trim());

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
    const pageSize = 8;
    const totalPages = Math.max(1, Math.ceil(products.length / pageSize));
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
    const dots = $("pos-product-dots");
    dots.classList.toggle("hidden", totalPages <= 1);
    dots.innerHTML = totalPages > 1
        ? Array.from({ length: totalPages }, (_, index) => {
            const page = index + 1;
            const active = page === state.posProductPage;
            return `<button type="button" class="pos-product-dot ${active ? "active" : ""}" data-pos-product-page="${page}" aria-label="Show product page ${page}" aria-current="${active ? "page" : "false"}"></button>`;
        }).join("")
        : "";
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
    if (!state.cart.length) {
        return;
    }

    try {
        const response = await api("/api/sales", {
            method: "POST",
            body: {
                saleDate: new Date().toISOString().split("T")[0],
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
        openReceiptModal(state.receiptSale);
        switchTab("sales");
        showNotification(`${t("msg_sale_complete")} ${response.invoiceNo}`);
    } catch (error) {
        showNotification(error.message, "error");
    }
}

function inventoryResults() {
    const search = $("inventory-search").value.trim().toLowerCase();
    if (!search) {
        return state.products;
    }
    return state.products.filter((product) =>
        [product.code, product.brand, product.name, product.category, product.expiryDate].join(" ").toLowerCase().includes(search)
    );
}

function renderInventory() {
    const rows = inventoryResults();
    const page = getPageSlice(rows, "inventory");
    const isAdmin = state.user?.role === "admin";
    const colspan = isAdmin ? 9 : 8;

    $("inventory-table-body").innerHTML = rows.length
        ? page.rows.map((product) => `
            <tr>
                <td data-label="${escapeHtml(t("product_code"))}"><strong>${escapeHtml(product.code)}</strong></td>
                <td data-label="${escapeHtml(t("brand"))}">${escapeHtml(product.brand || "-")}</td>
                <td data-label="${escapeHtml(t("product_name"))}">${escapeHtml(product.name)}</td>
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

function openInboundModal() {
    $("inbound-modal").classList.remove("hidden");
    $("inbound-code").focus();
}

function closeInboundModal() {
    $("inbound-modal").classList.add("hidden");
}

async function handleInboundSubmit(event) {
    event.preventDefault();
    try {
        await api("/api/inbound", {
            method: "POST",
            body: {
                code: $("inbound-code").value.trim(),
                brand: $("inbound-brand").value.trim(),
                name: $("inbound-name").value.trim(),
                category: $("inbound-category").value.trim(),
                expiryDate: $("inbound-expiry").value,
                quantity: Number($("inbound-quantity").value),
                costPrice: Number($("inbound-cost").value),
                sellPrice: Number($("inbound-price").value),
                lowStockThreshold: Number($("inbound-threshold").value)
            }
        });
        $("inbound-form").reset();
        $("inbound-threshold").value = 10;
        closeInboundModal();
        await loadInitialData();
        showNotification(t("msg_inbound_saved"));
    } catch (error) {
        showNotification(error.message, "error");
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

    $("sales-summary-strip").innerHTML = `
        <div class="sales-report-metric">
            <div class="metric-label">${escapeHtml(t("sales_count"))}</div>
            <strong>${escapeHtml(state.sales.length)}</strong>
        </div>
        <div class="sales-report-metric">
            <div class="metric-label">${escapeHtml(t("report_total_sales"))}</div>
            <strong>${escapeHtml(formatCurrency(totalSales))}</strong>
        </div>
        <div class="sales-report-metric">
            <div class="metric-label">${escapeHtml(t("report_total_profit"))}</div>
            <strong>${escapeHtml(formatCurrency(totalProfit))}</strong>
        </div>
    `;

    $("sales-table-body").innerHTML = state.sales.length
        ? page.rows.map((sale) => {
            const itemSummary = sale.items.map((item) => `${item.productName} x${item.quantity}`).join(", ");
            return `
                <tr>
                    <td data-label="${escapeHtml(t("invoice"))}"><strong>${escapeHtml(sale.invoiceNo)}</strong></td>
                    <td data-label="${escapeHtml(t("date"))}">${escapeHtml(sale.saleDate)}</td>
                    <td data-label="${escapeHtml(t("cashier"))}">${escapeHtml(sale.cashierName)}</td>
                    <td data-label="${escapeHtml(t("items"))}">${escapeHtml(itemSummary)}</td>
                    <td data-label="${escapeHtml(t("total"))}" class="text-right">${escapeHtml(formatCurrency(sale.total))}</td>
                    <td data-label="${escapeHtml(t("profit"))}" class="text-right">${escapeHtml(formatCurrency(sale.profit))}</td>
                    <td data-label="${escapeHtml(t("actions"))}" class="text-center">
                        <button type="button" class="mini-btn" data-print-sale="${sale.id}">
                            ${escapeHtml(t("print"))}
                        </button>
                    </td>
                </tr>
            `;
        }).join("")
        : `<tr><td colspan="7" class="empty-state">${escapeHtml(t("no_sales"))}</td></tr>`;
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
    $("low-stock-body").innerHTML = renderAlertRows(state.alerts.lowStock);
    $("expired-body").innerHTML = renderAlertRows(state.alerts.expired);
    $("expiring-body").innerHTML = renderAlertRows(state.alerts.expiringSoon);
    setAlertView(state.activeAlertView);
}

function renderMovements() {
    const page = getPageSlice(state.movements, "history");

    $("history-table-body").innerHTML = state.movements.length
        ? page.rows.map((movement) => `
            <tr>
                <td data-label="${escapeHtml(t("time"))}">${escapeHtml(formatDateTime(movement.createdAt))}</td>
                <td data-label="${escapeHtml(t("product_name"))}">
                    <strong>${escapeHtml(movement.productName)}</strong>
                    <div class="table-sub">${escapeHtml(movement.productCode)}</div>
                </td>
                <td data-label="${escapeHtml(t("type"))}">${escapeHtml(movement.movementType)}</td>
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
    const button = event.target.closest("[data-history-more]");
    if (!button) {
        return;
    }
    const row = button.closest("tr");
    const expanded = row.classList.toggle("history-row-expanded");
    button.setAttribute("aria-expanded", String(expanded));
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
    if (!button) {
        return;
    }
    openReceiptById(Number(button.dataset.printSale));
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
    $("receipt-content").innerHTML = buildReceiptMarkup(sale);
    $("receipt-modal").classList.remove("hidden");
    lucide.createIcons();
}

function closeReceiptModal() {
    $("receipt-modal").classList.add("hidden");
}

function buildReceiptMarkup(sale) {
    return `
        <div class="receipt-sheet">
            <div class="summary-row">
                <div>
                    <h3>${escapeHtml(VENDOR_NAME)}</h3>
                    <p class="receipt-meta">${escapeHtml(t("app_name"))}</p>
                </div>
                <div class="text-right">
                    <strong>${escapeHtml(sale.invoiceNo)}</strong>
                    <p class="receipt-meta">${escapeHtml(formatDate(sale.saleDate))}</p>
                </div>
            </div>

            <div style="margin-top: 1rem; display: grid; gap: 0.4rem;">
                <p><strong>${escapeHtml(t("cashier"))}:</strong> ${escapeHtml(sale.cashierName)}</p>
                <p><strong>${escapeHtml(t("date"))}:</strong> ${escapeHtml(formatDate(sale.saleDate))}</p>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>${escapeHtml(t("product_name"))}</th>
                        <th>${escapeHtml(t("quantity"))}</th>
                        <th>${escapeHtml(t("sell_price"))}</th>
                        <th>${escapeHtml(t("total"))}</th>
                    </tr>
                </thead>
                <tbody>
                    ${sale.items.map((item) => `
                        <tr>
                            <td>${escapeHtml(item.productName)}</td>
                            <td>${escapeHtml(item.quantity)}</td>
                            <td>${escapeHtml(formatCurrency(item.sellPrice))}</td>
                            <td>${escapeHtml(formatCurrency(item.lineTotal))}</td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>

            <div style="margin-top: 1rem; display: grid; gap: 0.5rem;">
                <div class="summary-row"><span>${escapeHtml(t("subtotal"))}</span><strong>${escapeHtml(formatCurrency(sale.subtotal))}</strong></div>
                <div class="summary-row"><span>${escapeHtml(t("discount"))}</span><strong>${escapeHtml(formatCurrency(sale.discount))}</strong></div>
                <div class="summary-row"><span>${escapeHtml(t("total"))}</span><strong>${escapeHtml(formatCurrency(sale.total))}</strong></div>
                <div class="summary-row"><span>${escapeHtml(t("profit"))}</span><strong>${escapeHtml(formatCurrency(sale.profit))}</strong></div>
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
                .head { display: flex; justify-content: space-between; align-items: start; margin-bottom: 16px; }
                table { width: 100%; border-collapse: collapse; margin-top: 16px; }
                th, td { text-align: left; border-bottom: 1px dashed #b2aeae; padding: 8px 0; color: #000000; }
                .total-row { display: flex; justify-content: space-between; margin-top: 8px; }
                .muted { color: #000000; }
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
    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) {
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
            <td>${escapeHtml(formatCurrency(sale.profit))}</td>
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
                <div class="chip"><strong>${escapeHtml(t("report_total_profit"))}</strong><p>${escapeHtml(formatCurrency(totalProfit))}</p></div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>${escapeHtml(t("invoice"))}</th>
                        <th>${escapeHtml(t("date"))}</th>
                        <th>${escapeHtml(t("cashier"))}</th>
                        <th>${escapeHtml(t("items"))}</th>
                        <th>${escapeHtml(t("total"))}</th>
                        <th>${escapeHtml(t("profit"))}</th>
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
