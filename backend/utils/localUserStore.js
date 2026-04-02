const fs = require("fs/promises");
const path = require("path");
const bcrypt = require("bcryptjs");

const storageDir = path.join(__dirname, "..", "data");
const storageFile = path.join(storageDir, "users.json");

async function ensureStorageFile() {
    await fs.mkdir(storageDir, { recursive: true });

    try {
        await fs.access(storageFile);
    } catch {
        await fs.writeFile(storageFile, "[]", "utf8");
    }
}

async function readUsers() {
    await ensureStorageFile();
    const raw = await fs.readFile(storageFile, "utf8");

    try {
        const users = JSON.parse(raw);
        return Array.isArray(users) ? users : [];
    } catch {
        return [];
    }
}

async function writeUsers(users) {
    await ensureStorageFile();
    await fs.writeFile(storageFile, `${JSON.stringify(users, null, 2)}\n`, "utf8");
}

function normalizeUsername(username) {
    return typeof username === "string" ? username.trim() : "";
}

function normalizeRole(role) {
    return role === "admin" ? "admin" : "driver";
}

async function findUserByUsername(username) {
    const normalizedUsername = normalizeUsername(username);
    if (!normalizedUsername) {
        return null;
    }

    const users = await readUsers();
    return users.find((user) => user.username === normalizedUsername) || null;
}

async function findUserById(id) {
    const normalizedId = typeof id === "string" ? id.trim() : "";
    if (!normalizedId) {
        return null;
    }

    const users = await readUsers();
    return users.find((user) => user.id === normalizedId) || null;
}

async function createUser({ username, password, role }) {
    const normalizedUsername = normalizeUsername(username);
    const normalizedRole = normalizeRole(role);

    const users = await readUsers();
    const exists = users.some((user) => user.username === normalizedUsername);

    if (exists) {
        const error = new Error("Username already exists");
        error.code = "DUPLICATE_USERNAME";
        throw error;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const now = new Date().toISOString();
    const user = {
        id: `local_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
        username: normalizedUsername,
        passwordHash,
        role: normalizedRole,
        createdAt: now,
        updatedAt: now,
    };

    users.push(user);
    await writeUsers(users);

    return user;
}

module.exports = {
    createUser,
    findUserById,
    findUserByUsername,
    normalizeRole,
    normalizeUsername,
    readUsers,
    writeUsers,
};
