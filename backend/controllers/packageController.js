const Package = require("../models/Package");

exports.createPackage = async (req, res) => {
    try {
        const { description, weight } = req.body;
        const newPackage = new Package({ description, weight });
        const savedPackage = await newPackage.save();
        
        res.status(201).json(savedPackage);


    } catch (error) {
        res.status(500).json({
            message: "something went wrong", error: error.message
        });
    }
}