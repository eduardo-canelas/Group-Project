const User = require("../models/User");
const localUserStore = require("../utils/localUserStore");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

function isMongoConnected() {
    return mongoose.connection.readyState === 1;
}

exports.register = async (req, res) => {
    try {
        const username = typeof req.body.username === "string" ? req.body.username.trim() : "";
        const password = typeof req.body.password === "string" ? req.body.password : "";
        const role = req.body.role === "admin" ? "admin" : "driver";

        if (!username || !password) {
            return res.status(400).json({ message: "Username and password are required" });
        }

        if (isMongoConnected()) {
            const userExists = await User.findOne({ username });
            if (userExists) {
                return res.status(400).json({ message: "User already exists" });
            }

            const user = new User({ username, password, role });
            await user.save();
            return res.status(201).json({ message: "User created successfully" });
        }

        await localUserStore.createUser({ username, password, role });
        return res.status(201).json({ message: "User created successfully" });
    } catch (error) {
        if (error?.code === 11000 || error?.code === "DUPLICATE_USERNAME") {
            return res.status(400).json({ message: "Username already exists" });
        }

        if (error?.name === "ValidationError") {
            return res.status(400).json({ message: error.message });
        }

        res.status(500).json({ message: error.message });
    }
};

//check credentials
exports.login = async (req, res) => {
    try {
        const username = typeof req.body.username === "string" ? req.body.username.trim() : "";
        const password = typeof req.body.password === "string" ? req.body.password : "";

        if (!username || !password) {
            return res.status(400).json({ message: "Username and password are required" });
        }

        let user;
        let isMatch = false;

        if (isMongoConnected()) {
            user = await User.findOne({ username });
            if (!user) {
                return res.status(401).json({ message: "Invalid credentials" });
            }
            isMatch = await user.comparePassword(password);
        } else {
            user = await localUserStore.findUserByUsername(username);
            if (!user) {
                return res.status(401).json({ message: "Invalid credentials" });
            }
            isMatch = await bcrypt.compare(password, user.passwordHash);
        }

        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }
        res.status(200).json({
            message: "Login successful",
            username: user.username,
            role: user.role
        });
    } catch (error) {
        res.status(500).json({ message: "log in failed", error: error.message });
    }
};
