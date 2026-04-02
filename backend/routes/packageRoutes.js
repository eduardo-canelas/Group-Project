const express = require("express");
const router = express.Router();
const requireCurrentUser = require("../middleware/requireCurrentUser");
const {
    createPackage,
    getAllPackages,
    getPackageById,
    updatePackage,
    deletePackage
} = require("../controllers/packageController");

router.use(requireCurrentUser);
router.post("/", createPackage); //create a new package
router.get("/", getAllPackages); //get all packages
router.get("/:id", getPackageById); //get a single package
router.put("/:id", updatePackage); //update a package
router.delete("/:id", deletePackage); //delete a package

module.exports = router;
