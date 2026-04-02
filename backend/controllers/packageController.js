const mongoose = require("mongoose");
const Package = require("../models/Package");
const Facility = require("../models/Facility");
const Route = require("../models/Route");
const HandlingEvent = require("../models/HandlingEvent");
const User = require("../models/User");
const localUserStore = require("../utils/localUserStore");
const { findUserByUsername, isMongoConnected, normalizeString } = require("../utils/userDirectory");

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

function determineFacilityType(name, deliveryType, stopKind) {
    if (stopKind === "transit") {
        return "inTransit";
    }

    const normalizedName = normalizeString(name).toLowerCase();
    if (normalizedName.includes("warehouse")) {
        return "warehouse";
    }

    if (normalizedName.includes("distribution") || normalizedName.includes("hub") || normalizedName.includes("dc")) {
        return "distributionCenter";
    }

    if (normalizedName.includes("store") || normalizedName.includes("target") || normalizedName.includes("retail")) {
        return "retailStore";
    }

    if (stopKind === "pickup") {
        return deliveryType === "transfer" ? "distributionCenter" : "warehouse";
    }

    if (deliveryType === "store") {
        return "retailStore";
    }

    if (deliveryType === "transfer") {
        return "distributionCenter";
    }

    return "customerAddress";
}

function buildTransitFacilityName(truckId) {
    const normalizedTruckId = normalizeString(truckId);
    return normalizedTruckId ? `Truck ${normalizedTruckId} Transit` : "In Transit";
}

async function ensureFacility(name, deliveryType, stopKind, fallbackName) {
    const facilityName = normalizeString(name) || fallbackName;
    const normalizedName = facilityName.toLowerCase();
    const location = determineFacilityType(facilityName, deliveryType, stopKind);

    return Facility.findOneAndUpdate(
        { normalizedName },
        {
            name: facilityName,
            normalizedName,
            location,
        },
        {
            new: true,
            upsert: true,
            runValidators: true,
            setDefaultsOnInsert: true,
        }
    );
}

function estimateRouteMetrics(startFacility, endFacility, deliveryType) {
    if (!startFacility || !endFacility) {
        return { distance: 0, estimatedTime: 0 };
    }

    if (startFacility.normalizedName === endFacility.normalizedName) {
        return { distance: 1, estimatedTime: 10 };
    }

    const baseDistanceByType = {
        store: 18,
        residential: 12,
        return: 16,
        transfer: 42,
    };

    const baseDistance = baseDistanceByType[deliveryType] ?? 15;
    const nameVariance = (startFacility.name.length + endFacility.name.length) % 7;
    const distance = baseDistance + nameVariance;
    const estimatedTime = Math.max(15, Math.round(distance * 1.8));

    return {
        distance,
        estimatedTime,
    };
}

async function ensureRoute(startFacility, endFacility, deliveryType) {
    const metrics = estimateRouteMetrics(startFacility, endFacility, deliveryType);

    return Route.findOneAndUpdate(
        {
            startFacility: startFacility._id,
            endFacility: endFacility._id,
        },
        {
            startFacility: startFacility._id,
            endFacility: endFacility._id,
            distance: metrics.distance,
            estimatedTime: metrics.estimatedTime,
        },
        {
            new: true,
            upsert: true,
            runValidators: true,
            setDefaultsOnInsert: true,
        }
    );
}

function mapStatusToEventType(status) {
    switch (status) {
        case "pending":
            return "received";
        case "picked_up":
            return "loaded";
        case "in_transit":
            return "inTransit";
        case "delivered":
        case "lost":
        case "returned":
        case "cancelled":
            return "unloaded";
        default:
            return "assigned";
    }
}

function buildHandlingEventNotes(pkg, previousPackage, currentUser) {
    if (!previousPackage) {
        return `Initial tracking record created by ${currentUser.username}`;
    }

    const changes = [];

    if (previousPackage.status !== pkg.status) {
        changes.push(`status ${previousPackage.status || "unknown"} -> ${pkg.status}`);
    }

    if (previousPackage.ownerUsername !== pkg.ownerUsername) {
        changes.push(`driver ${previousPackage.ownerUsername || "unassigned"} -> ${pkg.ownerUsername || "unassigned"}`);
    }

    const previousPickup = normalizeString(previousPackage.pickupLocation);
    const previousDropoff = normalizeString(previousPackage.dropoffLocation);
    if (previousPickup !== normalizeString(pkg.pickupLocation) || previousDropoff !== normalizeString(pkg.dropoffLocation)) {
        changes.push("route endpoints updated");
    }

    if (changes.length === 0) {
        return `Record reviewed by ${currentUser.username}`;
    }

    return changes.join("; ");
}

async function buildTrackingContext(pkg) {
    const pickupFacility = await ensureFacility(pkg.pickupLocation, pkg.deliveryType, "pickup", "Origin Facility");
    const dropoffFacility = await ensureFacility(pkg.dropoffLocation, pkg.deliveryType, "dropoff", "Destination Facility");
    const route = await ensureRoute(pickupFacility, dropoffFacility, pkg.deliveryType);

    let currentFacility = pickupFacility;
    if (pkg.status === "in_transit") {
        currentFacility = await ensureFacility(
            buildTransitFacilityName(pkg.truckId),
            pkg.deliveryType,
            "transit",
            "In Transit"
        );
    } else if (["delivered", "returned", "lost", "cancelled"].includes(pkg.status)) {
        currentFacility = dropoffFacility;
    }

    return {
        pickupFacility,
        dropoffFacility,
        currentFacility,
        route,
    };
}

async function recordHandlingEvent(pkg, trackingContext, currentUser, previousPackage) {
    if (!mongoose.Types.ObjectId.isValid(currentUser.id)) {
        const error = new Error("Handling events require a MongoDB-backed user account");
        error.statusCode = 400;
        throw error;
    }

    const eventType = !previousPackage || previousPackage.ownerUserId !== pkg.ownerUserId
        ? "assigned"
        : mapStatusToEventType(pkg.status);

    return HandlingEvent.create({
        package: pkg._id,
        facility: trackingContext.currentFacility._id,
        route: trackingContext.route._id,
        user: new mongoose.Types.ObjectId(currentUser.id),
        eventType,
        statusSnapshot: pkg.status,
        notes: buildHandlingEventNotes(pkg, previousPackage, currentUser),
        timeStamp: new Date(),
    });
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
    const duplicateKeyError = error?.code === 11000;
    const statusCode = error.statusCode || ((duplicateKeyError || error.name === "ValidationError") ? 400 : 500);

    return res.status(statusCode).json({
        message: `Failed to ${action} package`,
        error: duplicateKeyError ? "A duplicate key prevented the package from being saved" : error.message
    });
}

async function getUserCount() {
    if (isMongoConnected()) {
        return User.countDocuments();
    }

    const users = await localUserStore.readUsers();
    return users.length;
}

exports.createPackage = async (req, res) => {
    try {
        const newPackage = new Package(await buildPackagePayload(req.body, req.currentUser));
        const trackingContext = await buildTrackingContext(newPackage);

        newPackage.route = trackingContext.route._id;
        newPackage.currentFacility = trackingContext.currentFacility._id;

        await newPackage.save();

        const handlingEvent = await recordHandlingEvent(newPackage, trackingContext, req.currentUser);
        newPackage.lastHandlingEvent = handlingEvent._id;
        await newPackage.save();

        res.status(201).json(newPackage);
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

exports.getDataModelSummary = async (req, res) => {
    try {
        if (req.currentUser.role !== "admin") {
            return res.status(403).json({ message: "Only administrators can view the data model summary" });
        }

        const [
            userCount,
            packageCount,
            facilityCount,
            routeCount,
            handlingEventCount,
            recentHandlingEvents,
        ] = await Promise.all([
            getUserCount(),
            Package.countDocuments(),
            Facility.countDocuments(),
            Route.countDocuments(),
            HandlingEvent.countDocuments(),
            HandlingEvent.find()
                .sort({ timeStamp: -1, createdAt: -1 })
                .limit(6)
                .populate("package", "packageId description")
                .populate("facility", "name location")
                .populate("user", "username role")
                .lean(),
        ]);

        res.status(200).json({
            entities: {
                users: userCount,
                packages: packageCount,
                facilities: facilityCount,
                routes: routeCount,
                handlingEvents: handlingEventCount,
            },
            manyToMany: {
                name: "Packages <-> Facilities",
                through: "HandlingEvent",
                description: "A package can move through many facilities, and every facility can handle many different packages. Each HandlingEvent stores one join record together with the responsible user and route.",
            },
            recentHandlingEvents: recentHandlingEvents.map((event) => ({
                id: event._id.toString(),
                eventType: event.eventType,
                statusSnapshot: event.statusSnapshot,
                notes: event.notes || "",
                happenedAt: event.timeStamp,
                packageId: event.package?.packageId || "Unknown package",
                packageDescription: event.package?.description || "",
                facilityName: event.facility?.name || "Unknown facility",
                facilityType: event.facility?.location || "",
                username: event.user?.username || "Unknown user",
            })),
        });
    } catch (error) {
        handlePackageError(res, "summarize", error);
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

        const previousPackage = pkg.toObject();
        const payload = await buildPackagePayload(req.body, req.currentUser, pkg);
        Object.assign(pkg, payload);

        const trackingContext = await buildTrackingContext(pkg);
        pkg.route = trackingContext.route._id;
        pkg.currentFacility = trackingContext.currentFacility._id;

        await pkg.save();

        const handlingEvent = await recordHandlingEvent(pkg, trackingContext, req.currentUser, previousPackage);
        pkg.lastHandlingEvent = handlingEvent._id;
        await pkg.save();

        res.status(200).json(pkg);
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

        await HandlingEvent.deleteMany({ package: pkg._id });
        await Package.findByIdAndDelete(id);

        res.status(200).json({ message: "Package deleted successfully" });
    } catch (error) {
        handlePackageError(res, "delete", error);
    }
};
