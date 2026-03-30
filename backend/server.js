require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const User = require("./models/User");

const packageRoutes = require("./routes/packageRoutes");
const authRoutes = require("./routes/authRoutes");

const app = express();

app.use(cors());
app.use(express.json());

//Routes
app.use("/api/packages", packageRoutes);
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
    res.send("API Running");
});

mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log("Connected to MongoDB");
    })
    .catch((error) => {
        console.error("Failed to connect to MongoDB:", error);
    });

app.listen(5000, () => {
    console.log("Server running on port 5000");
});

app.get("/create-user", async (req, res) => {
    try {
        const newUser = new User({
            username: "eduardo",
            password: "Eduardito1127)",
            role: "admin",
        });

        await newUser.save();
        res.send("User created successfully");
    } catch (error) {
        console.error("Error creating user:", error);
        res.status(500).send("Error creating user");
    }
});