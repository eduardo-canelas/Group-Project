const mongoose = require("mongoose");

const handlingEventSchema = new mongoose.Schema({
    package: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Package",
        required: true
    },
    facility: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Facility",
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    route: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Route",
        required: true,
    },
    eventType: {
        type: String,
        enum: ["received", "loaded", "unloaded", "assigned", "inTransit"],
        required: true
    },
    statusSnapshot: {
        type: String,
        enum: ["pending", "picked_up", "in_transit", "delivered", "lost", "returned", "cancelled"],
        required: true,
    },
}, { timestamps: true });

handlingEventSchema.index({ package: 1, timeStamp: -1 });

module.exports = mongoose.model("HandlingEvent", handlingEventSchema);
