const mongoose = require("mongoose");

const packageSchema = new mongoose.Schema({
    description: { type: String, required: true },
    weight: { type: Number, required: true },
    status: {
        type: String,
        enum: ["pending", "picked_up", "in_transit", "delivered"],
        default: "pending"
    },
}, { timestamps: true });

module.exports = mongoose.model("Package", packageSchema);
