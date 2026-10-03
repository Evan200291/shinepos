// Shop identity helpers: URL slugs (pos.example.com/<slug>) and business types.

const BUSINESS_TYPES = ["clinic", "convenience", "online", "retail"];
const DEFAULT_BUSINESS_TYPE = "retail";

// Paths that belong to the platform itself and can never be a shop address.
const RESERVED_SLUGS = new Set([
    "api", "super", "admin", "login", "logout", "static", "assets", "fonts", "public",
    "app", "index", "landing", "health", "help", "about", "pricing", "www"
]);

const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{1,39}$/;

function slugify(value) {
    return String(value || "")
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[^a-z0-9]+/g, "")
        .slice(0, 40);
}

function validateSlug(slug) {
    if (!SLUG_PATTERN.test(slug)) {
        return "Shop address must be 2–40 characters: lowercase letters, numbers or dashes.";
    }
    if (RESERVED_SLUGS.has(slug)) {
        return `"${slug}" is reserved. Choose another shop address.`;
    }
    return null;
}

function uniqueSlug(db, base, excludeId = null) {
    let root = slugify(base);
    if (root.length < 2 || RESERVED_SLUGS.has(root)) root = `shop${root}`;
    let candidate = root;
    let n = 2;
    while (db.prepare("SELECT id FROM shops WHERE slug = ? AND id IS NOT ?").get(candidate, excludeId)) {
        candidate = `${root}${n}`;
        n += 1;
    }
    return candidate;
}

function normalizeBusinessType(value) {
    const type = String(value || "").trim().toLowerCase();
    return BUSINESS_TYPES.includes(type) ? type : DEFAULT_BUSINESS_TYPE;
}

// Public URL of a shop's uploaded logo; the version query busts caches after a new upload.
function shopLogoUrl(shop) {
    if (!shop || !shop.logo_path || !shop.slug) return null;
    const version = String(shop.logo_path).replace(/^.*[\\/]/, "").replace(/\.\w+$/, "");
    return `/api/public/shops/${shop.slug}/logo?v=${version}`;
}

function shopInfo(db, shopId) {
    if (!shopId) return null;
    const shop = db.prepare("SELECT id, name, slug, business_type, logo_path FROM shops WHERE id = ?").get(shopId);
    return shop ? {
        id: shop.id,
        name: shop.name,
        slug: shop.slug,
        businessType: shop.business_type || DEFAULT_BUSINESS_TYPE,
        logoUrl: shopLogoUrl(shop)
    } : null;
}

module.exports = { BUSINESS_TYPES, DEFAULT_BUSINESS_TYPE, RESERVED_SLUGS, slugify, validateSlug, uniqueSlug, normalizeBusinessType, shopLogoUrl, shopInfo };
