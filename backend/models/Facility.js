const mongoose = require("mongoose");

const facilitySchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    normalizedName: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        unique: true,
    },
    location: {
        type: String,
        required: true,
        enum: ["warehouse", "distributionCenter", "retailStore", "customerAddress", "inTransit"],
    },
}, { timestamps: true });



module.exports = mongoose.model("Facility", facilitySchema);
