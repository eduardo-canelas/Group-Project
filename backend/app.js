require("dotenv").config();
require("dotenv").config({ path: ".env.local", override: true });

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const packageRoutes = require("./routes/packageRoutes");
const authRoutes = require("./routes/authRoutes");
const aiRoutes = require("./routes/aiRoutes");

const app = express();

app.use(cors());
app.use(express.json());

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
