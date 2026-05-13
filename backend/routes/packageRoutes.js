const express = require("express");
const router = express.Router();
const requireCurrentUser = require("../middleware/requireCurrentUser");
const {
    createPackage,
    getDataModelSummary,
    getAllPackages,
    getPackageById,
    getPackageHistory,
    scanPackage,
    updatePackage,
    deletePackage
} = require("../controllers/packageController");

router.use(requireCurrentUser);
router.post("/", createPackage); //create a new package
router.get("/", getAllPackages); //get all packages
router.get("/summary", getDataModelSummary); //get the data model summary
router.post("/scan", scanPackage); //scan a package by package ID, scan code, or database ID
router.get("/:id/history", getPackageHistory); //get full handling event history for a package
router.get("/:id", getPackageById); //get a single package
router.put("/:id", updatePackage); //update a package
router.delete("/:id", deletePackage); //delete a package

module.exports = router;
