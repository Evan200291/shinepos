// Reversible (AES-256-GCM) copy of each account password so the super admin can look it up.
// Set PASSWORD_VAULT_KEY in the environment; without it the key is derived from JWT_SECRET.
const crypto = require("crypto");

const JWT_SECRET = process.env.JWT_SECRET || "pharmacy-pos-local-secret";
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

module.exports = { encryptPassword, decryptPassword };
