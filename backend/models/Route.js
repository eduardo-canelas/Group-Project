const mongoose = require("mongoose");

const routeSchema = new mongoose.Schema({
    startFacility: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Facility",
        required: true
    },
    endFacility: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Facility",
        required: true
    },
    distance: {
        type: Number,
        required: true
    },
    estimatedTime: {
        type: Number,
        required: true,
    },
}, { timestamps: true });

routeSchema.index({ startFacility: 1, endFacility: 1 }, { unique: true });

module.exports = mongoose.model("Route", routeSchema);
