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
    priority: {
        type: String,
        enum: ["standard", "rush", "fragile", "cold_chain"],
        default: "standard"
    },
    scanCode: { type: String, trim: true, index: true },
    customerName: { type: String, trim: true },
    customerPhone: { type: String, trim: true },
    deliveryWindow: { type: String, trim: true },
    deliveryInstructions: { type: String, trim: true },
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
    route: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Route",
    },
    currentFacility: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Facility",
    },
    lastHandlingEvent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "HandlingEvent",
    },
    lastScanType: {
        type: String,
        enum: ["intake", "pickup", "loaded", "in_transit", "delivery", "exception", "audit"],
    },
    lastScanLocation: { type: String, trim: true },
    lastScanNote: { type: String, trim: true },
    scanCount: { type: Number, default: 0, min: 0 },
    accuracyScore: { type: Number, min: 0, max: 100 },
    lastScanLat: { type: Number },
    lastScanLng: { type: Number },
}, { timestamps: true });

module.exports = mongoose.model("Package", packageSchema);
