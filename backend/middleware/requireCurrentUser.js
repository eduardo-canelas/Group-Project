const { findUserById, normalizeString } = require("../utils/userDirectory");

module.exports = async function requireCurrentUser(req, res, next) {
    try {
        const userId = normalizeString(req.header("x-user-id"));
        const username = normalizeString(req.header("x-user-username"));
        const role = normalizeString(req.header("x-user-role"));

        if (!userId || !username || !role) {
            return res.status(401).json({ message: "Authentication is required" });
        }

        const user = await findUserById(userId);
        if (!user) {
            return res.status(401).json({ message: "User session is invalid" });
        }

        if (user.username !== username || user.role !== role) {
            return res.status(403).json({ message: "User session does not match the account on file" });
        }

        req.currentUser = user;
        next();
    } catch (error) {
        res.status(500).json({ message: "Failed to validate the current user", error: error.message });
    }
};
