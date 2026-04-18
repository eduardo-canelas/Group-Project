require("dotenv").config();
require("dotenv").config({ path: ".env.local", override: true });

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const packageRoutes = require("./routes/packageRoutes");
const authRoutes = require("./routes/authRoutes");
const aiRoutes = require("./routes/aiRoutes");

const app = express();
const port = Number(process.env.PORT) || 5050;

app.use(cors());
app.use(express.json());

async function connectDatabase() {
    const fallbackUri = process.env.MONGODB_LOCAL_URI || "mongodb://127.0.0.1:27017/packet-tracker";
    const primaryUri = process.env.MONGODB_URI;
    const attempts = [primaryUri, fallbackUri].filter(Boolean);

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
}

async function startServer() {
    try {
        const dbConnected = await connectDatabase();

        // Routes
        app.use("/api/packages", packageRoutes);
        app.use("/api/auth", authRoutes);
        app.use("/api/ai", aiRoutes);

        app.get("/", (req, res) => {
            res.send("API Running");
        });

        app.listen(port, () => {
            console.log(`Server running on port ${port}${dbConnected ? "" : " (local auth fallback active)"}`);
        });
    } catch (error) {
        console.error("Server startup failed:", error.message);
        process.exit(1);
    }
}

startServer();
