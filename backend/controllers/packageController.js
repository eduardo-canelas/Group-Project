const Package = require("../models/Package");
const mongoose = require("mongoose");

exports.createPackage = async (req, res) => {
    try {
        const { description, weight } = req.body;
        const newPackage = new Package({ description, weight });
        const savedPackage = await newPackage.save();

        res.status(201).json(savedPackage);


    } catch (error) {
        res.status(500).json({
            message: "Failed to create package", error: error.message
        });
    }
};

exports.getAllPackages = async (req, res) => {
    try {
        const packages = await Package.find();
        res.status(200).json(packages);
    } catch (error) {
        res.status(500).json({
            message: "Failed to get packages", error: error.message
        });
    }
};

exports.getPackageById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ message: "Package not found" });
        }

        const pkg = await Package.findById(id);
        if (!pkg) {
            return res.status(404).json({ message: "Package not found" });
        }

        res.status(200).json(pkg);
    } catch (error) {
        res.status(500).json({
            message: "Failed to get package", error: error.message
        });
    }
};

exports.updatePackage = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ message: "Package not found" });
        }
        const updatedPackage = await Package.findByIdAndUpdate(id, req.body, { new: true });
        if (!updatedPackage) {
            return res.status(404).json({ message: "Package not found" });
        }
        res.status(200).json(updatedPackage);
    } catch (error) {
        res.status(500).json({
            message: "Failed to update package", error: error.message
        });
    }
};

exports.deletePackage = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ message: "Package not found" });
        }
        const deletedPackage = await Package.findByIdAndDelete(id);
        if (!deletedPackage) {
            return res.status(404).json({ message: "Package not found" });
        }
        res.status(200).json({ message: "Package deleted successfully" });
    } catch (error) {
        res.status(500).json({
            message: "Failed to delete package", error: error.message
        });
    }
};
