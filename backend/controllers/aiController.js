const Package = require("../models/Package");
const Facility = require("../models/Facility");
const Route = require("../models/Route");
const HandlingEvent = require("../models/HandlingEvent");

const riskStatuses = new Set(["pending", "returned", "lost", "cancelled"]);
const activeStatuses = new Set(["pending", "picked_up", "in_transit"]);
const statusWeights = {
    lost: 100,
    cancelled: 88,
    returned: 74,
    pending: 62,
    picked_up: 34,
    in_transit: 26,
    delivered: 8,
};

const fallbackActionTemplates = [
    {
        title: "Check flagged packages first",
        detail: "Start with packages already marked lost, returned, or cancelled before they turn into customer problems.",
        priority: "critical",
    },
    {
        title: "Confirm the next scan",
        detail: "Check the busiest active routes and confirm the truck, handoff, and next scan are correct.",
        priority: "high",
    },
    {
        title: "Give a short handoff note",
        detail: "Share what is delayed, what is missing, and what the next driver or dispatcher needs to know.",
        priority: "medium",
    },
];

const DRIVER_SYSTEM_PROMPT =
    "You are RoutePulse Driver AI. Your job is to help drivers stop packages from getting lost. " +
    "Write in very simple language. Use short sentences. Use plain words instead of business language. " +
    "Focus on real driver actions: check the label, confirm the truck, confirm pickup and drop-off, scan the package again, call dispatch, and flag missing or mismatched records fast. " +
    "Never sound like a leadership report. Never use vague phrases like operational signal, route pressure, executive summary, intervention, or escalation unless the data clearly requires it. " +
    "When a package may be lost, tell the driver exactly what to do next in order. " +
    "Keep the response grounded only in the provided backend state. Do not invent data. Preserve package IDs, counts, routes, and statuses exactly. " +
    "Return strict JSON only with keys headline, executiveSummary, narrative, operationalPulse, metrics, riskPackages, routeAlerts, facilityAlerts, driverAlerts, recommendations, recentEvents. " +
    "For driver responses: headline must be one short sentence, executiveSummary must be 1 to 2 short sentences, narrative must explain the main issue in simple terms, operationalPulse must be a short support line, and recommendations must be 3 short action objects with clear titles and simple details.";

const ADMIN_SYSTEM_PROMPT =
    "You are RoutePulse Admin AI, a logistics operations analyst embedded in a package tracking platform. " +
    "Return strict JSON only, with no markdown fences. Keep the response grounded only in the provided backend state. " +
    "Write like a polished dispatch briefing: specific, concise, and decision-ready. " +
    "Do not invent data. Preserve provided counts and identifiers exactly. " +
    "Return an object with keys headline, executiveSummary, narrative, operationalPulse, metrics, riskPackages, routeAlerts, facilityAlerts, driverAlerts, recommendations, recentEvents. " +
    "metrics must be an array of 4 objects: {label, value, context, tone}. " +
    "riskPackages, routeAlerts, facilityAlerts, driverAlerts, and recentEvents should keep the provided objects but may tighten reason/summary wording. " +
    "recommendations must be 3 concise action objects: {title, detail, priority}.";

function formatStatusLabel(status = "unknown") {
    return status
        .split("_")
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

function formatDeliveryType(type = "store") {
    return type.charAt(0).toUpperCase() + type.slice(1);
}

function formatRelativeTime(timestamp) {
    const value = new Date(timestamp).getTime();
    if (Number.isNaN(value)) {
        return "Unknown timing";
    }

    const diffMs = Date.now() - value;
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;

    if (diffMs < hour) {
        const minutes = Math.max(1, Math.round(diffMs / minute));
        return `${minutes} min ago`;
    }

    if (diffMs < day) {
        const hours = Math.max(1, Math.round(diffMs / hour));
        return `${hours} hr ago`;
    }

    const days = Math.max(1, Math.round(diffMs / day));
    return `${days} day${days === 1 ? "" : "s"} ago`;
}

function computePackageRisk(pkg) {
    const statusWeight = statusWeights[pkg.status] || 20;
    const ageHours = Math.max(0, (Date.now() - new Date(pkg.updatedAt || pkg.createdAt || Date.now()).getTime()) / (1000 * 60 * 60));
    const staleWeight = Math.min(30, Math.round(ageHours * 1.75));
    const amountWeight = Math.min(14, Number(pkg.amount) || 0);
    return statusWeight + staleWeight + amountWeight;
}

function buildRouteLabel(pkg) {
    const start = pkg.pickupLocation || pkg.route?.startFacility?.name || "Origin";
    const end = pkg.dropoffLocation || pkg.route?.endFacility?.name || "Destination";
    return `${start} -> ${end}`;
}

function summarizePackages(packages) {
    const statusBreakdown = {};
    const deliveryBreakdown = {};
    const routeMap = new Map();
    const facilityMap = new Map();
    const driverMap = new Map();

    const rankedPackages = packages
        .map((pkg) => ({
            ...pkg,
            riskScore: computePackageRisk(pkg),
            routeLabel: buildRouteLabel(pkg),
        }))
        .sort((left, right) => right.riskScore - left.riskScore);

    rankedPackages.forEach((pkg) => {
        const status = pkg.status || "unknown";
        const deliveryType = pkg.deliveryType || "store";
        const routeLabel = pkg.routeLabel;
        const facilityName = pkg.currentFacility?.name || pkg.dropoffLocation || pkg.pickupLocation || "Unassigned facility";
        const facilityType = pkg.currentFacility?.location || "unknown";
        const driverName = pkg.ownerUsername || "Unassigned";
        const isRisk = riskStatuses.has(status);
        const isActive = activeStatuses.has(status);

        statusBreakdown[status] = (statusBreakdown[status] || 0) + 1;
        deliveryBreakdown[deliveryType] = (deliveryBreakdown[deliveryType] || 0) + 1;

        const routeEntry = routeMap.get(routeLabel) || {
            route: routeLabel,
            activeShipments: 0,
            totalShipments: 0,
            riskCount: 0,
            topStatus: {},
        };
        routeEntry.totalShipments += 1;
        routeEntry.activeShipments += isActive ? 1 : 0;
        routeEntry.riskCount += isRisk ? 1 : 0;
        routeEntry.topStatus[status] = (routeEntry.topStatus[status] || 0) + 1;
        routeMap.set(routeLabel, routeEntry);

        const facilityEntry = facilityMap.get(facilityName) || {
            facility: facilityName,
            facilityType,
            shipments: 0,
            activeShipments: 0,
            riskCount: 0,
        };
        facilityEntry.shipments += 1;
        facilityEntry.activeShipments += isActive ? 1 : 0;
        facilityEntry.riskCount += isRisk ? 1 : 0;
        facilityMap.set(facilityName, facilityEntry);

        const driverEntry = driverMap.get(driverName) || {
            driver: driverName,
            activeShipments: 0,
            flaggedShipments: 0,
            deliveredShipments: 0,
        };
        driverEntry.activeShipments += isActive ? 1 : 0;
        driverEntry.flaggedShipments += isRisk ? 1 : 0;
        driverEntry.deliveredShipments += status === "delivered" ? 1 : 0;
        driverMap.set(driverName, driverEntry);
    });

    return {
        statusBreakdown,
        deliveryBreakdown,
        routePressure: Array.from(routeMap.values())
            .map((entry) => ({
                ...entry,
                dominantStatus: Object.entries(entry.topStatus).sort((left, right) => right[1] - left[1])[0]?.[0] || "unknown",
                summary: `${entry.activeShipments} active, ${entry.riskCount} high-friction records`,
            }))
            .sort((left, right) => (right.riskCount * 3 + right.activeShipments) - (left.riskCount * 3 + left.activeShipments))
            .slice(0, 4),
        facilityPressure: Array.from(facilityMap.values())
            .map((entry) => ({
                ...entry,
                summary: `${entry.shipments} touching this node, ${entry.riskCount} exception${entry.riskCount === 1 ? "" : "s"}`,
            }))
            .sort((left, right) => (right.riskCount * 3 + right.activeShipments) - (left.riskCount * 3 + left.activeShipments))
            .slice(0, 4),
        driverPressure: Array.from(driverMap.values())
            .map((entry) => ({
                ...entry,
                summary: `${entry.activeShipments} live assignments, ${entry.flaggedShipments} needing extra attention`,
            }))
            .sort((left, right) => (right.flaggedShipments * 3 + right.activeShipments) - (left.flaggedShipments * 3 + left.activeShipments))
            .slice(0, 5),
        rankedPackages: rankedPackages.slice(0, 6).map((pkg) => ({
            packageId: pkg.packageId || "Legacy record",
            description: pkg.description,
            status: pkg.status,
            statusLabel: formatStatusLabel(pkg.status),
            severity: pkg.riskScore >= 90 ? "critical" : pkg.riskScore >= 68 ? "elevated" : "watch",
            driver: pkg.ownerUsername || "Unassigned",
            truckId: pkg.truckId || "—",
            route: pkg.routeLabel,
            currentFacility: pkg.currentFacility?.name || "Unknown facility",
            lastUpdated: pkg.updatedAt,
            reason: `${formatStatusLabel(pkg.status)} shipment on ${pkg.routeLabel} with ${pkg.amount || 0} units and last activity ${formatRelativeTime(pkg.updatedAt)}`,
            riskScore: pkg.riskScore,
        })),
    };
}

function buildContextSummary({
    packages,
    facilityCount,
    routeCount,
    handlingEventCount,
    recentEvents,
    packageInsights,
}) {
    const exceptionCount = Object.entries(packageInsights.statusBreakdown)
        .filter(([status]) => riskStatuses.has(status))
        .reduce((sum, [, count]) => sum + count, 0);
    const inTransitCount = packageInsights.statusBreakdown.in_transit || 0;
    const deliveredCount = packageInsights.statusBreakdown.delivered || 0;

    const metrics = [
        {
            label: "Live Shipments",
            value: String(packages.length),
            context: `${inTransitCount} in transit right now`,
            tone: "accent",
        },
        {
            label: "Exceptions",
            value: String(exceptionCount),
            context: "Pending, returned, lost, or cancelled",
            tone: exceptionCount > 0 ? "danger" : "success",
        },
        {
            label: "Facilities",
            value: String(facilityCount),
            context: `${routeCount} route definitions in play`,
            tone: "neutral",
        },
        {
            label: "Handling Events",
            value: String(handlingEventCount),
            context: `${recentEvents.length} recent movements sampled`,
            tone: "info",
        },
    ];

    const headline = exceptionCount > 0
        ? `${exceptionCount} shipment${exceptionCount === 1 ? "" : "s"} need immediate intervention`
        : `${deliveredCount} deliveries cleared with no active exceptions`;
    const executiveSummary = exceptionCount > 0
        ? `The network is carrying ${packages.length} shipments with risk concentrated in ${packageInsights.routePressure[0]?.route || "the current active lanes"}. Focus first on exception records, then on the heaviest live routes and facilities.`
        : `Operations look stable right now. Most activity is concentrated in active transit and recent facility handoffs, with no major exception backlog visible in the current dataset.`;
    const narrative = `Backend state currently tracks ${packages.length} packages, ${facilityCount} facilities, ${routeCount} routes, and ${handlingEventCount} handling events. The strongest operational signal is ${packageInsights.routePressure[0]?.summary || "steady movement across the network"}, while the most active facility is ${packageInsights.facilityPressure[0]?.facility || "still forming"}.`;
    const operationalPulse = deliveredCount > 0
        ? `${deliveredCount} shipments are already closed out, but the active network still needs ongoing dispatch supervision.`
        : "The system is still weighted toward active movement and setup work rather than completed deliveries.";

    return {
        headline,
        executiveSummary,
        narrative,
        operationalPulse,
        metrics,
    };
}

function buildRecentEvents(recentEvents) {
    return recentEvents.map((event) => ({
        packageId: event.package?.packageId || "Unknown package",
        eventType: event.eventType,
        facility: event.facility?.name || "Unknown facility",
        actor: event.user?.username || "Unknown user",
        when: formatRelativeTime(event.timeStamp || event.createdAt),
        status: event.statusSnapshot,
    }));
}

function buildLocalBriefing(prompt, perspective, context) {
    const { packages, facilityCount, routeCount, handlingEventCount, recentEvents, packageInsights } = context;
    const base = buildContextSummary({
        packages,
        facilityCount,
        routeCount,
        handlingEventCount,
        recentEvents,
        packageInsights,
    });

    const recommendations = [...fallbackActionTemplates];
    if (packageInsights.rankedPackages[0]) {
        recommendations[0] = {
            title: perspective === "driver"
                ? `Check ${packageInsights.rankedPackages[0].packageId} now`
                : `Escalate ${packageInsights.rankedPackages[0].packageId} first`,
            detail: perspective === "driver"
                ? `${formatStatusLabel(packageInsights.rankedPackages[0].status)}. Re-scan it, confirm the truck, and verify the drop-off.`
                : packageInsights.rankedPackages[0].reason,
            priority: packageInsights.rankedPackages[0].severity === "critical" ? "critical" : "high",
        };
    }

    if (packageInsights.routePressure[0]) {
        recommendations[1] = {
            title: perspective === "driver"
                ? `Review ${packageInsights.routePressure[0].route}`
                : `Review ${packageInsights.routePressure[0].route}`,
            detail: perspective === "driver"
                ? `Make sure the route, truck, and next scan all match for this lane.`
                : packageInsights.routePressure[0].summary,
            priority: packageInsights.routePressure[0].riskCount > 0 ? "high" : "medium",
        };
    }

    if (perspective === "driver") {
        return {
            headline: packageInsights.rankedPackages[0]
                ? `${packageInsights.rankedPackages[0].packageId} needs attention now`
                : "Your route looks clear right now",
            executiveSummary: packageInsights.rankedPackages[0]
                ? `Start with the highest-risk package first. Check the scan, truck, and drop-off before moving on.`
                : `No high-risk package is standing out right now. Keep scans current and confirm handoffs.`,
            narrative: packageInsights.rankedPackages[0]
                ? `${packageInsights.rankedPackages[0].packageId} is the main risk on your route. Lost and delayed packages usually come from a missing scan, wrong truck, or wrong stop.`
                : "Nothing critical is standing out right now, but keeping scans current helps stop packages from going missing.",
            operationalPulse: packageInsights.rankedPackages.length
                ? `${packageInsights.rankedPackages.length} package${packageInsights.rankedPackages.length === 1 ? "" : "s"} on your route need closer attention.`
                : "No risk packages are standing out right now.",
            metrics: base.metrics,
            riskPackages: packageInsights.rankedPackages,
            routeAlerts: packageInsights.routePressure,
            facilityAlerts: packageInsights.facilityPressure,
            driverAlerts: packageInsights.driverPressure,
            recommendations,
            recentEvents: buildRecentEvents(recentEvents),
        };
    }

    return {
        headline: base.headline,
        executiveSummary: `${base.executiveSummary} Prompt focus: ${prompt}`,
        narrative: base.narrative,
        operationalPulse: `${base.operationalPulse} Perspective: ${perspective}.`,
        metrics: base.metrics,
        riskPackages: packageInsights.rankedPackages,
        routeAlerts: packageInsights.routePressure,
        facilityAlerts: packageInsights.facilityPressure,
        driverAlerts: packageInsights.driverPressure,
        recommendations,
        recentEvents: buildRecentEvents(recentEvents),
    };
}

function extractAnswer(payload) {
    return payload?.candidates?.[0]?.content?.parts
        ?.map((part) => part.text)
        .filter(Boolean)
        .join("\n")
        .trim();
}

function tryParseJsonBlock(answer) {
    if (!answer) {
        return null;
    }

    const normalized = answer.trim();
    const candidates = [normalized];
    const fencedMatch = normalized.match(/```json\s*([\s\S]*?)```/i);
    if (fencedMatch?.[1]) {
        candidates.unshift(fencedMatch[1].trim());
    }

    const firstBrace = normalized.indexOf("{");
    const lastBrace = normalized.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        candidates.push(normalized.slice(firstBrace, lastBrace + 1));
    }

    for (const candidate of candidates) {
        try {
            return JSON.parse(candidate);
        } catch (error) {
            continue;
        }
    }

    return null;
}

async function requestGeminiBriefing({ prompt, perspective, currentUser, context, fallbackBriefing }) {
    if (!process.env.GEMINI_API_KEY) {
        return {
            briefing: fallbackBriefing,
            source: "local-fallback",
            model: "local-ops-engine",
        };
    }

    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-goog-api-key": process.env.GEMINI_API_KEY,
                },
                body: JSON.stringify({
                    systemInstruction: {
                        parts: [
                            {
                                text: perspective === "driver" ? DRIVER_SYSTEM_PROMPT : ADMIN_SYSTEM_PROMPT,
                            },
                        ],
                    },
                    contents: [
                        {
                            role: "user",
                            parts: [
                                {
                                    text: JSON.stringify(
                                        {
                                            perspective,
                                            currentUser,
                                            prompt,
                                            backendSnapshot: context,
                                            baselineBriefing: fallbackBriefing,
                                        },
                                        null,
                                        2
                                    ),
                                },
                            ],
                        },
                    ],
                }),
            }
        );

        if (!response.ok) {
            throw new Error(await response.text());
        }

        const payload = await response.json();
        const answer = extractAnswer(payload);
        const parsed = tryParseJsonBlock(answer);

        if (!parsed) {
            throw new Error("Gemini returned a non-JSON briefing payload");
        }

        return {
            briefing: {
                ...fallbackBriefing,
                ...parsed,
            },
            source: "gemini",
            model,
        };
    } catch (error) {
        return {
            briefing: fallbackBriefing,
            source: "local-fallback",
            model: `${model}:fallback`,
            warning: error.message,
        };
    }
}

exports.generateOpsBriefing = async (req, res) => {
    try {
        const prompt = typeof req.body.prompt === "string" ? req.body.prompt.trim() : "";
        const perspective = typeof req.body.perspective === "string" ? req.body.perspective.trim() : req.currentUser.role;

        if (!prompt) {
            return res.status(400).json({ message: "Prompt is required" });
        }

        const query = req.currentUser.role === "admin"
            ? {}
            : { ownerUserId: req.currentUser.id };

        const [packages, facilityCount, routeCount, handlingEventCount, recentEvents] = await Promise.all([
            Package.find(query)
                .sort({ updatedAt: -1, createdAt: -1 })
                .populate("currentFacility", "name location")
                .populate({
                    path: "route",
                    populate: [
                        { path: "startFacility", select: "name" },
                        { path: "endFacility", select: "name" },
                    ],
                })
                .lean(),
            Facility.countDocuments(),
            Route.countDocuments(),
            HandlingEvent.countDocuments(),
            HandlingEvent.find()
                .sort({ timeStamp: -1, createdAt: -1 })
                .limit(8)
                .populate("package", "packageId")
                .populate("facility", "name location")
                .populate("user", "username")
                .lean(),
        ]);

        const packageInsights = summarizePackages(packages);
        const backendContext = {
            perspective,
            packageCount: packages.length,
            facilityCount,
            routeCount,
            handlingEventCount,
            statusBreakdown: packageInsights.statusBreakdown,
            deliveryBreakdown: packageInsights.deliveryBreakdown,
            routePressure: packageInsights.routePressure,
            facilityPressure: packageInsights.facilityPressure,
            driverPressure: packageInsights.driverPressure,
            highRiskPackages: packageInsights.rankedPackages,
            recentEvents: buildRecentEvents(recentEvents),
        };

        const fallbackBriefing = buildLocalBriefing(prompt, perspective, {
            packages,
            facilityCount,
            routeCount,
            handlingEventCount,
            recentEvents,
            packageInsights,
        });

        const result = await requestGeminiBriefing({
            prompt,
            perspective,
            currentUser: req.currentUser.username,
            context: backendContext,
            fallbackBriefing,
        });

        res.status(200).json({
            briefing: result.briefing,
            source: result.source,
            model: result.model,
            warning: result.warning || null,
            generatedAt: new Date().toISOString(),
        });
    } catch (error) {
        res.status(500).json({ message: "Could not generate AI briefing", error: error.message });
    }
};
