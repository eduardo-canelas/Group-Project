const mongoose = require("mongoose");

const facilitySchema = new mongoose.Schema({
    name: { type: String, required: true },
    location: { type: String, required: true, enum: ["warehouse", "distributionCenter", "retailStore", "customerAddress", "inTransit"] },
})

module.exports = mongoose.model("Facility", facilitySchema);
