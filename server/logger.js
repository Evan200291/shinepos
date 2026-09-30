const fs = require("fs");
const path = require("path");

const LOG_DIR = path.join(__dirname, "..", "logs");
const RETENTION_DAYS = 30;

fs.mkdirSync(LOG_DIR, { recursive: true });

function logFile(date) {
    return path.join(LOG_DIR, `app-${date.toISOString().slice(0, 10)}.log`);
}

function write(level, source, message, meta) {
    const entry = {
        time: new Date().toISOString(),
        level,
        source,
        message: String(message).slice(0, 4000)
    };
    if (meta && Object.keys(meta).length) entry.meta = meta;

    try {
        fs.appendFileSync(logFile(new Date()), JSON.stringify(entry) + "\n");
    } catch (error) {
        console.error("Unable to write log file:", error.message);
    }

    const line = `[${level.toUpperCase()}] ${source}: ${entry.message}`;
    if (level === "error") console.error(line);
    else if (level === "warn") console.warn(line);
    else console.log(line);
    return entry;
}

function prune() {
    const cutoff = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000;
    for (const name of fs.readdirSync(LOG_DIR)) {
        const file = path.join(LOG_DIR, name);
        try {
            if (/^app-\d{4}-\d{2}-\d{2}\.log$/.test(name) && fs.statSync(file).mtimeMs < cutoff) fs.unlinkSync(file);
        } catch (error) { /* ignore */ }
    }
}

// Newest first. Reads the most recent daily files until `limit` matching entries are found.
function readRecent({ level = "", source = "", limit = 200 } = {}) {
    const files = fs.readdirSync(LOG_DIR)
        .filter((name) => /^app-\d{4}-\d{2}-\d{2}\.log$/.test(name))
        .sort()
        .reverse();
    const results = [];
    for (const name of files) {
        const lines = fs.readFileSync(path.join(LOG_DIR, name), "utf8").split("\n").filter(Boolean).reverse();
        for (const line of lines) {
            let entry;
            try { entry = JSON.parse(line); } catch (error) { continue; }
            if (level && entry.level !== level) continue;
            if (source && !String(entry.source).startsWith(source)) continue;
            results.push(entry);
            if (results.length >= limit) return results;
        }
    }
    return results;
}

module.exports = {
    info: (source, message, meta) => write("info", source, message, meta),
    warn: (source, message, meta) => write("warn", source, message, meta),
    error: (source, message, meta) => write("error", source, message, meta),
    readRecent,
    prune
};
