const mongoose = require("mongoose");

const packageSchema = new mongoose.Schema({
    packageId: { type: String, trim: true },
    description: { type: String, required: true, trim: true },
    amount: { type: Number, min: 0 },
    weight: { type: Number, min: 0 },
    deliveryType: {
        type: String,
        enum: ["store", "residential", "return", "transfer"],
        default: "store"
    },
    truckId: { type: String, trim: true },
    pickupLocation: { type: String, trim: true },
    dropoffLocation: { type: String, trim: true },
    status: {
        type: String,
        enum: ["pending", "picked_up", "in_transit", "delivered", "lost", "returned", "cancelled"],
        default: "in_transit"
    },
    ownerUserId: { type: String, trim: true, index: true },
    ownerUsername: { type: String, trim: true },
    createdByRole: {
        type: String,
        enum: ["admin", "driver"]
    },
    lastUpdatedByUserId: { type: String, trim: true },
    lastUpdatedByUsername: { type: String, trim: true },
}, { timestamps: true });

module.exports = mongoose.model("Package", packageSchema);
