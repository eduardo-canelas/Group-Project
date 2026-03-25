const express = require("express");
const router = express.Router();
const {
    createPackage,
    getAllPackages,
    updatePackage,
    deletePackage
} = require("../controllers/packageController");

router.post("/packages", createPackage); //create a new package
router.get("/packages", getAllPackages); //get all packages
router.put("/packages/:id", updatePackage); //update a package
router.delete("/packages/:id", deletePackage); //delete a package

module.exports = router;

