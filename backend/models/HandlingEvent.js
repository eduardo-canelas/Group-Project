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
    eventType: {
        type: String,
        enum: ["received", "loaded", "unloaded", "assigned", "inTransit"],
        required: true
    },
    timeStamp: {
        type: Date,
        default: Date.now
    },
})

module.exports = mongoose.model("HandlingEvent", handlinEventSchema);