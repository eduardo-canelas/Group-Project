const Package = require("../models/Package");
const mongoose = require("mongoose");
const { findUserByUsername, normalizeString } = require("../utils/userDirectory");

const DRIVER_EDITABLE_FIELDS = [
    "packageId",
    "description",
    "amount",
    "weight",
    "deliveryType",
    "truckId",
    "pickupLocation",
    "dropoffLocation",
    "status",
];

const ADMIN_EDITABLE_FIELDS = [
    ...DRIVER_EDITABLE_FIELDS,
    "ownerUsername",
];

function normalizeNumber(value) {
    if (value === "" || value === null || typeof value === "undefined") {
        return undefined;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : NaN;
}

function pickAllowedFields(source, allowedFields) {
    return allowedFields.reduce((accumulator, field) => {
        if (Object.prototype.hasOwnProperty.call(source, field)) {
            accumulator[field] = source[field];
        }
        return accumulator;
    }, {});
}

async function resolveOwner(requestedOwnerUsername, fallbackUser) {
    const normalizedOwnerUsername = normalizeString(requestedOwnerUsername);

    if (!normalizedOwnerUsername) {
        return fallbackUser || null;
    }

    const owner = await findUserByUsername(normalizedOwnerUsername);
    if (!owner || owner.role !== "driver") {
        const error = new Error("Assigned driver was not found");
        error.statusCode = 400;
        throw error;
    }

    return owner;
}

function requireField(value, label) {
    if (!value) {
        const error = new Error(`${label} is required`);
        error.statusCode = 400;
        throw error;
    }
}

async function buildPackagePayload(body, currentUser, existingPackage) {
    const allowedFields = currentUser.role === "admin" ? ADMIN_EDITABLE_FIELDS : DRIVER_EDITABLE_FIELDS;
    const incoming = pickAllowedFields(body, allowedFields);
    const payload = {};

    for (const field of ["packageId", "description", "deliveryType", "truckId", "pickupLocation", "dropoffLocation", "status"]) {
        if (Object.prototype.hasOwnProperty.call(incoming, field)) {
            payload[field] = normalizeString(incoming[field]);
        }
    }

    if (Object.prototype.hasOwnProperty.call(incoming, "amount")) {
        payload.amount = normalizeNumber(incoming.amount);
    }

    if (Object.prototype.hasOwnProperty.call(incoming, "weight")) {
        payload.weight = normalizeNumber(incoming.weight);
    }

    const fallbackOwner = existingPackage?.ownerUserId
        ? {
            id: existingPackage.ownerUserId,
            username: existingPackage.ownerUsername,
            role: "driver",
        }
        : null;

    const owner = currentUser.role === "admin"
        ? await resolveOwner(incoming.ownerUsername, fallbackOwner)
        : currentUser;

    if (!existingPackage || Object.prototype.hasOwnProperty.call(incoming, "ownerUsername") || currentUser.role === "driver") {
        payload.ownerUserId = owner?.id;
        payload.ownerUsername = owner?.username;
    }

    if (!existingPackage) {
        payload.createdByRole = currentUser.role;
    }

    payload.lastUpdatedByUserId = currentUser.id;
    payload.lastUpdatedByUsername = currentUser.username;

    if (!existingPackage && currentUser.role === "driver" && !payload.status) {
        payload.status = "in_transit";
    }

    if (!existingPackage && currentUser.role === "driver" && !payload.pickupLocation) {
        payload.pickupLocation = "Assigned truck";
    }

    if (!existingPackage) {
        requireField(payload.packageId, "Package ID");
        requireField(payload.description, "Description");
        requireField(payload.truckId, "Truck ID");
        requireField(payload.dropoffLocation, "Drop off location");
        requireField(payload.ownerUserId, "Assigned driver");
    }

    if (!existingPackage && typeof payload.amount === "undefined") {
        const error = new Error("Amount is required");
        error.statusCode = 400;
        throw error;
    }

    if (Number.isNaN(payload.amount)) {
        const error = new Error("Amount must be a valid number");
        error.statusCode = 400;
        throw error;
    }

    if (Number.isNaN(payload.weight)) {
        const error = new Error("Weight must be a valid number");
        error.statusCode = 400;
        throw error;
    }

    return payload;
}

function canAccessPackage(pkg, currentUser) {
    return currentUser.role === "admin" || pkg.ownerUserId === currentUser.id;
}

function handlePackageError(res, action, error) {
    const statusCode = error.statusCode || (error.name === "ValidationError" ? 400 : 500);
    return res.status(statusCode).json({
        message: `Failed to ${action} package`,
        error: error.message
    });
}

exports.createPackage = async (req, res) => {
    try {
        const newPackage = new Package(await buildPackagePayload(req.body, req.currentUser));
        const savedPackage = await newPackage.save();

        res.status(201).json(savedPackage);
    } catch (error) {
        handlePackageError(res, "create", error);
    }
};

exports.getAllPackages = async (req, res) => {
    try {
        const query = req.currentUser.role === "admin"
            ? {}
            : { ownerUserId: req.currentUser.id };
        const packages = await Package.find(query).sort({ updatedAt: -1, createdAt: -1 });
        res.status(200).json(packages);
    } catch (error) {
        handlePackageError(res, "get", error);
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

        if (!canAccessPackage(pkg, req.currentUser)) {
            return res.status(403).json({ message: "You can only view your own package records" });
        }

        res.status(200).json(pkg);
    } catch (error) {
        handlePackageError(res, "get", error);
    }
};

exports.updatePackage = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ message: "Package not found" });
        }

        const pkg = await Package.findById(id);
        if (!pkg) {
            return res.status(404).json({ message: "Package not found" });
        }

        if (!canAccessPackage(pkg, req.currentUser)) {
            return res.status(403).json({ message: "You can only update your own package records" });
        }

        const payload = await buildPackagePayload(req.body, req.currentUser, pkg);
        const updatedPackage = await Package.findByIdAndUpdate(id, payload, {
            new: true,
            runValidators: true,
        });

        res.status(200).json(updatedPackage);
    } catch (error) {
        handlePackageError(res, "update", error);
    }
};

exports.deletePackage = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ message: "Package not found" });
        }

        const pkg = await Package.findById(id);
        if (!pkg) {
            return res.status(404).json({ message: "Package not found" });
        }

        if (!canAccessPackage(pkg, req.currentUser)) {
            return res.status(403).json({ message: "You can only delete your own package records" });
        }

        await Package.findByIdAndDelete(id);
        res.status(200).json({ message: "Package deleted successfully" });
    } catch (error) {
        handlePackageError(res, "delete", error);
    }
};
