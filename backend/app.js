const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");

const packageRoutes = require("./routes/packageRoutes");
const authRoutes = require("./routes/authRoutes");
const aiRoutes = require("./routes/aiRoutes");

function loadEnvFile(filePath, { override = false } = {}) {
    if (!fs.existsSync(filePath)) {
        return;
    }

    const parsed = dotenv.parse(fs.readFileSync(filePath));
    Object.entries(parsed).forEach(([key, value]) => {
        if (!value) {
            return;
        }

        if (override || !process.env[key]) {
            process.env[key] = value;
        }
    });
}

const backendDir = __dirname;
const projectRoot = path.resolve(backendDir, "..");
loadEnvFile(path.join(projectRoot, ".env"));
loadEnvFile(path.join(backendDir, ".env"));
loadEnvFile(path.join(projectRoot, ".env.local"), { override: true });
loadEnvFile(path.join(backendDir, ".env.local"), { override: true });

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

let connectionPromise = null;

async function connectDatabase() {
    if (mongoose.connection.readyState === 1) {
        return true;
    }

    if (connectionPromise) {
        return connectionPromise;
    }

    const fallbackUri = process.env.MONGODB_LOCAL_URI || "mongodb://127.0.0.1:27017/packet-tracker";
    const primaryUri = process.env.MONGODB_URI;
    const attempts = [primaryUri, fallbackUri].filter(Boolean);

    connectionPromise = (async () => {
        for (const uri of attempts) {
            try {
                await mongoose.connect(uri, {
                    serverSelectionTimeoutMS: 5000,
                });
                console.log(`Connected to MongoDB using ${uri === primaryUri ? "primary" : "fallback"} URI`);
                return true;
            } catch (error) {
                console.error(`Failed to connect with ${uri === primaryUri ? "primary" : "fallback"} URI:`, error.message);
            }
        }

        return false;
    })();

    const result = await connectionPromise;
    connectionPromise = null;
    return result;
}

app.use(async (req, res, next) => {
    try {
        await connectDatabase();
        next();
    } catch (error) {
        next(error);
    }
});

app.use("/api/packages", packageRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/ai", aiRoutes);

app.get("/", (req, res) => {
    res.send("API Running");
});

module.exports = { app, connectDatabase };
