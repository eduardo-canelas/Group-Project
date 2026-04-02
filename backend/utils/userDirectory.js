const mongoose = require("mongoose");
const User = require("../models/User");
const localUserStore = require("./localUserStore");

function isMongoConnected() {
    return mongoose.connection.readyState === 1;
}

function normalizeString(value) {
    return typeof value === "string" ? value.trim() : "";
}

function serializeMongoUser(user) {
    if (!user) {
        return null;
    }

    return {
        id: user._id.toString(),
        username: user.username,
        role: user.role,
    };
}

function serializeLocalUser(user) {
    if (!user) {
        return null;
    }

    return {
        id: user.id,
        username: user.username,
        role: user.role,
    };
}

async function findUserById(id) {
    const normalizedId = normalizeString(id);
    if (!normalizedId) {
        return null;
    }

    if (isMongoConnected()) {
        if (!mongoose.Types.ObjectId.isValid(normalizedId)) {
            return null;
        }

        const user = await User.findById(normalizedId);
        return serializeMongoUser(user);
    }

    const user = await localUserStore.findUserById(normalizedId);
    return serializeLocalUser(user);
}

async function findUserByUsername(username) {
    const normalizedUsername = normalizeString(username);
    if (!normalizedUsername) {
        return null;
    }

    if (isMongoConnected()) {
        const user = await User.findOne({ username: normalizedUsername });
        return serializeMongoUser(user);
    }

    const user = await localUserStore.findUserByUsername(normalizedUsername);
    return serializeLocalUser(user);
}

module.exports = {
    findUserById,
    findUserByUsername,
    isMongoConnected,
    normalizeString,
};
