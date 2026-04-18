const riskStatuses = new Set(["pending", "returned", "lost", "cancelled"]);
const activeStatuses = new Set(["pending", "picked_up", "in_transit"]);

const severityRank = {
    critical: 3,
    high: 2,
    medium: 1,
    low: 0,
};

function formatStatusLabel(status = "unknown") {
    return status
        .split("_")
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

function formatRelativeTime(timestamp) {
    const value = new Date(timestamp).getTime();
    if (Number.isNaN(value)) {
        return "Unknown";
    }

    const diffMs = Date.now() - value;
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;

    if (diffMs < hour) {
        return `${Math.max(1, Math.round(diffMs / minute))} min ago`;
    }

    if (diffMs < day) {
        return `${Math.max(1, Math.round(diffMs / hour))} hr ago`;
    }

    const days = Math.max(1, Math.round(diffMs / day));
    return `${days} day${days === 1 ? "" : "s"} ago`;
}

function getAgeHours(timestamp) {
    const value = new Date(timestamp).getTime();
    if (Number.isNaN(value)) {
        return 0;
    }

    return Math.max(0, (Date.now() - value) / (1000 * 60 * 60));
}

function computeRiskScore(pkg) {
    const ageHours = getAgeHours(pkg.updatedAt || pkg.createdAt || Date.now());
    const statusWeight = {
        lost: 98,
        returned: 82,
        cancelled: 78,
        pending: 64,
        picked_up: 32,
        in_transit: 26,
        delivered: 8,
    }[pkg.status] || 18;
    const ageWeight = Math.min(28, Math.round(ageHours * 1.5));
    const volumeWeight = Math.min(12, Number(pkg.amount) || 0);

    return statusWeight + ageWeight + volumeWeight;
}

function getSeverity(pkg, riskScore) {
    if (pkg.status === "lost" || riskScore >= 92) {
        return "critical";
    }

    if (riskScore >= 72 || ["returned", "cancelled"].includes(pkg.status)) {
        return "high";
    }

    if (riskStatuses.has(pkg.status) || riskScore >= 48) {
        return "medium";
    }

    return "low";
}

function getRouteLabel(pkg) {
    return `${pkg.pickupLocation || "Origin"} -> ${pkg.dropoffLocation || "Destination"}`;
}

function getReasons(pkg, ageHours) {
    const reasons = [];

    if (pkg.status === "lost") {
        reasons.push("Lost status requires immediate recovery workflow.");
    } else if (pkg.status === "returned") {
        reasons.push("Returned shipment needs a new owner decision.");
    } else if (pkg.status === "cancelled") {
        reasons.push("Cancelled shipment still needs closure and inventory follow-up.");
    } else if (pkg.status === "pending") {
        reasons.push("Shipment is still waiting for its next handoff.");
    }

    if (!pkg.ownerUsername) {
        reasons.push("No driver is assigned, which weakens accountability.");
    }

    if (!pkg.lastHandlingEvent) {
        reasons.push("No recent handling event is attached to this shipment.");
    }

    if (ageHours >= 24) {
        reasons.push("This record has gone stale for over 24 hours.");
    } else if (ageHours >= 8) {
        reasons.push("Scan activity is slowing down and should be checked.");
    }

    return reasons.slice(0, 3);
}

function getRecommendation(pkg, severity) {
    if (pkg.status === "lost") {
        return "Launch a recovery flow, verify last known custody, and contact the driver before the customer escalation window opens.";
    }

    if (pkg.status === "returned") {
        return "Confirm whether this should be rerouted, restocked, or rescheduled for delivery.";
    }

    if (pkg.status === "cancelled") {
        return "Close the shipment cleanly and notify the downstream team that inventory and routing changed.";
    }

    if (pkg.status === "pending") {
        return "Confirm the pickup handoff and move this to the next scan state before it turns into a support issue.";
    }

    return severity === "medium"
        ? "Keep monitoring this shipment and confirm the next physical scan happens on time."
        : "This shipment is healthy right now.";
}

function buildExceptionBoard(packages) {
    return packages
        .map((pkg) => {
            const ageHours = getAgeHours(pkg.updatedAt || pkg.createdAt);
            const riskScore = computeRiskScore(pkg);
            const severity = getSeverity(pkg, riskScore);

            return {
                id: pkg._id.toString(),
                packageId: pkg.packageId || "Legacy record",
                description: pkg.description || "No description",
                status: pkg.status,
                statusLabel: formatStatusLabel(pkg.status),
                severity,
                riskScore,
                driver: pkg.ownerUsername || "Unassigned",
                truckId: pkg.truckId || "—",
                route: getRouteLabel(pkg),
                currentFacility: pkg.currentFacility?.name || "Unknown facility",
                lastUpdated: pkg.updatedAt,
                lastUpdatedLabel: formatRelativeTime(pkg.updatedAt || pkg.createdAt),
                reasons: getReasons(pkg, ageHours),
                recommendation: getRecommendation(pkg, severity),
            };
        })
        .filter((pkg) => severityRank[pkg.severity] >= severityRank.medium)
        .sort((left, right) => right.riskScore - left.riskScore)
        .slice(0, 6);
}

function buildCustodyTimeline(events) {
    return events.slice(0, 6).map((event) => ({
        id: event._id.toString(),
        packageId: event.package?.packageId || "Unknown package",
        eventType: event.eventType,
        eventLabel: formatStatusLabel(event.eventType || "scan"),
        status: event.statusSnapshot || "unknown",
        statusLabel: formatStatusLabel(event.statusSnapshot || "unknown"),
        facility: event.facility?.name || "Unknown facility",
        facilityType: event.facility?.location || "",
        actor: event.user?.username || "Unknown user",
        happenedAt: event.timeStamp,
        happenedAtLabel: formatRelativeTime(event.timeStamp),
        summary: `${event.user?.username || "Unknown user"} recorded ${formatStatusLabel(event.eventType || "scan")} at ${event.facility?.name || "an unknown facility"}.`,
    }));
}

function buildRoutePressure(packages) {
    const routeMap = new Map();

    packages.forEach((pkg) => {
        const route = getRouteLabel(pkg);
        const current = routeMap.get(route) || {
            route,
            activeShipments: 0,
            exceptionShipments: 0,
            deliveredShipments: 0,
        };

        current.activeShipments += activeStatuses.has(pkg.status) ? 1 : 0;
        current.exceptionShipments += riskStatuses.has(pkg.status) ? 1 : 0;
        current.deliveredShipments += pkg.status === "delivered" ? 1 : 0;
        routeMap.set(route, current);
    });

    return Array.from(routeMap.values())
        .map((item) => ({
            ...item,
            summary: `${item.activeShipments} active, ${item.exceptionShipments} exception${item.exceptionShipments === 1 ? "" : "s"}`,
        }))
        .sort((left, right) => (right.exceptionShipments * 3 + right.activeShipments) - (left.exceptionShipments * 3 + left.activeShipments))
        .slice(0, 4);
}

function buildFacilityWatch(packages) {
    const facilityMap = new Map();

    packages.forEach((pkg) => {
        const key = pkg.currentFacility?.name || pkg.dropoffLocation || pkg.pickupLocation || "Unknown facility";
        const current = facilityMap.get(key) || {
            facility: key,
            facilityType: pkg.currentFacility?.location || "",
            shipments: 0,
            activeShipments: 0,
            exceptions: 0,
        };

        current.shipments += 1;
        current.activeShipments += activeStatuses.has(pkg.status) ? 1 : 0;
        current.exceptions += riskStatuses.has(pkg.status) ? 1 : 0;
        facilityMap.set(key, current);
    });

    return Array.from(facilityMap.values())
        .map((item) => ({
            ...item,
            summary: `${item.shipments} shipments touching this node, ${item.exceptions} flagged`,
        }))
        .sort((left, right) => (right.exceptions * 3 + right.activeShipments) - (left.exceptions * 3 + left.activeShipments))
        .slice(0, 4);
}

function buildDriverFocus(packages) {
    const driverMap = new Map();

    packages.forEach((pkg) => {
        const key = pkg.ownerUsername || "Unassigned";
        const current = driverMap.get(key) || {
            driver: key,
            activeShipments: 0,
            exceptionShipments: 0,
            deliveredShipments: 0,
        };

        current.activeShipments += activeStatuses.has(pkg.status) ? 1 : 0;
        current.exceptionShipments += riskStatuses.has(pkg.status) ? 1 : 0;
        current.deliveredShipments += pkg.status === "delivered" ? 1 : 0;
        driverMap.set(key, current);
    });

    return Array.from(driverMap.values())
        .map((item) => ({
            ...item,
            summary: `${item.activeShipments} active loads, ${item.exceptionShipments} needing intervention`,
        }))
        .sort((left, right) => (right.exceptionShipments * 3 + right.activeShipments) - (left.exceptionShipments * 3 + left.activeShipments))
        .slice(0, 5);
}

function buildProofPoints(packages, recentEvents, exceptionBoard) {
    const totalPackages = packages.length || 1;
    const trackedPackages = packages.filter((pkg) => pkg.lastHandlingEvent).length;
    const activePackages = packages.filter((pkg) => activeStatuses.has(pkg.status)).length;
    const visibleActivePackages = packages.filter((pkg) => activeStatuses.has(pkg.status) && pkg.currentFacility).length;
    const trustScore = Math.max(
        42,
        Math.round(
            ((trackedPackages / totalPackages) * 42) +
            ((visibleActivePackages / Math.max(1, activePackages)) * 34) +
            ((1 - (exceptionBoard.length / totalPackages)) * 24)
        )
    );

    return {
        trustScore,
        metrics: [
            {
                label: "Trust score",
                value: `${trustScore}%`,
                detail: "How well this network can explain where a package is and what should happen next.",
                tone: trustScore >= 75 ? "success" : trustScore >= 60 ? "accent" : "danger",
            },
            {
                label: "Custody coverage",
                value: `${Math.round((trackedPackages / totalPackages) * 100)}%`,
                detail: "Shipments with a recorded handling chain.",
                tone: "accent",
            },
            {
                label: "Visible active loads",
                value: `${Math.round((visibleActivePackages / Math.max(1, activePackages)) * 100)}%`,
                detail: "Active shipments tied to a current facility or transit node.",
                tone: "info",
            },
            {
                label: "Latest movement",
                value: recentEvents[0] ? formatRelativeTime(recentEvents[0].timeStamp) : "N/A",
                detail: "How fresh the latest recorded package handoff is.",
                tone: "neutral",
            },
        ],
        capabilityPillars: [
            "Catch stalled shipments before they become support tickets.",
            "Give every package a visible chain of custody across facilities and trucks.",
            "Feed AI with structured logistics context instead of loose notes and spreadsheets.",
        ],
    };
}

function buildNetworkIntelligence({ packages, recentEvents }) {
    const exceptionBoard = buildExceptionBoard(packages);
    const custodyTimeline = buildCustodyTimeline(recentEvents);
    const proof = buildProofPoints(packages, recentEvents, exceptionBoard);
    const activeCount = packages.filter((pkg) => activeStatuses.has(pkg.status)).length;

    return {
        headline: exceptionBoard.length > 0
            ? `${exceptionBoard.length} shipments are most likely to become “where is my package?” escalations`
            : "The network is currently stable, with no urgent exception queue.",
        subheadline: "This is the product story recruiters should see: a full-stack operations workspace that helps small businesses prevent lost packages with custody visibility, AI summaries, and action-first workflows.",
        activeCount,
        exceptionCount: exceptionBoard.length,
        ...proof,
        exceptionBoard,
        custodyTimeline,
        routePressure: buildRoutePressure(packages),
        facilityWatch: buildFacilityWatch(packages),
        driverFocus: buildDriverFocus(packages),
    };
}

module.exports = {
    buildNetworkIntelligence,
    formatRelativeTime,
    formatStatusLabel,
};
