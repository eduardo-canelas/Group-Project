tracks packages as they move through physical facilities (warehouses, trucks, stores).  
The core database challenge: **a Package can pass through many Facilities, and a Facility can handle many different Packages**.  
That is a **many-to-many relationship** — and we solve it using a bridge collection called **HandlingEvent**.

---

## The 5 MongoDB Collections (Entities)

| Collection | Role |
|---|---|
| `users` | Admins and drivers |
| `packages` | The shipments being tracked |
| `facilities` | Physical locations (warehouses, trucks, stores, addresses) |
| `routes` | A directed connection from one facility to another |
| `handlingevents` | **The bridge** — one record per package-at-facility event |

---

## How the Many-to-Many Works (Conceptual)

```
     PACKAGE                HANDLING EVENT             FACILITY
  ┌──────────┐           ┌──────────────────┐       ┌──────────────┐
  │ PKG-001  │──────────▶│ event: "loaded"  │──────▶│  Warehouse A │
  │          │           │ status: picked_up│       └──────────────┘
  │          │           └──────────────────┘
  │          │
  │          │           ┌──────────────────┐       ┌──────────────┐
  │          │──────────▶│ event:"inTransit" │──────▶│  Truck T-42  │
  │          │           │ status: in_transit│       └──────────────┘
  │          │
  │          │           ┌──────────────────┐       ┌──────────────┐
  │          │──────────▶│ event: "unloaded" │──────▶│  Target Store│
  └──────────┘           │ status: delivered │       └──────────────┘
                         └──────────────────┘

  ONE package → MANY handling events → MANY facilities
  ONE facility → is referenced by MANY handling events → MANY packages
```

The **HandlingEvent** is the junction table. Each row answers:  
*"Which package was at which facility, when, doing what, and who logged it?"*

---

## The Mongoose Models (Code)

### Package — `backend/models/Package.js`
```js
currentFacility: { type: ObjectId, ref: "Facility" }  // where it is RIGHT NOW
route:           { type: ObjectId, ref: "Route" }      // which route it's on
lastHandlingEvent: { type: ObjectId, ref: "HandlingEvent" } // most recent event
```

### HandlingEvent — `backend/models/HandlingEvent.js` (THE BRIDGE)
```js
package:  { type: ObjectId, ref: "Package"  }  // which package
facility: { type: ObjectId, ref: "Facility" }  // at which location
user:     { type: ObjectId, ref: "User"     }  // who logged it
route:    { type: ObjectId, ref: "Route"    }  // on which route
eventType: "received" | "loaded" | "unloaded" | "assigned" | "inTransit"
statusSnapshot: "pending" | "picked_up" | "in_transit" | "delivered" | ...
```

### Facility — `backend/models/Facility.js`
```js
name:           String
normalizedName: String (lowercase, unique — prevents duplicate facilities)
location:       "warehouse" | "distributionCenter" | "retailStore" |
                "customerAddress" | "inTransit"
```

### Route — `backend/models/Route.js`
```js
startFacility: { type: ObjectId, ref: "Facility" }
endFacility:   { type: ObjectId, ref: "Facility" }
// unique index on (startFacility, endFacility) — no duplicate routes
```

---

## Step-by-Step Live Demo Script

> **Setup:** Have MongoDB Compass open on the `packet-tracker` database.  
> **Keep 4 tabs visible:** `packages`, `facilities`, `routes`, `handlingevents`  
> **Also have the frontend running** at `http://localhost:5173`

---

### STEP 1 — Show the Empty State

**What to say:**
> "Before we create anything, look at the database. Facilities, routes, and handling events may already have records from prior demos — that's fine. Watch what changes when we create a brand new package."

**In MongoDB Compass:**
1. Open `handlingevents` — note the current count
2. Open `facilities` — note the current count
3. Open `packages` — note the current count

**Write down the starting counts on a whiteboard or sticky note.**

---

### STEP 2 — Create a Package as Admin

**In the frontend (Admin Dashboard):**

Fill out the "Create Package" form with these exact values so the audience can follow along:

| Field | Value |
|---|---|
| Package ID | `DEMO-001` |
| Description | `Laptop shipment` |
| Amount | `1` |
| Weight | `5` |
| Delivery Type | `store` |
| Truck ID | `T-42` |
| Pickup Location | `Main Warehouse` |
| Dropoff Location | `Target Store NYC` |
| Status | `pending` |
| Assigned Driver | *(pick any driver)* |

Click **Create Package**.

---

### STEP 3 — Show What Just Happened in the Database

**Switch to MongoDB Compass immediately after clicking Create.**

#### 3a. Check `facilities`

**What to say:**
> "The system automatically created up to 3 facility records — it never creates duplicates."

Look for:
- **`main warehouse`** — location: `warehouse` (auto-detected from the name)
- **`target store nyc`** — location: `retailStore` (auto-detected)
- No transit facility yet because status is `pending`

**The code that did this** (`packageController.js`, `ensureFacility` function):
```js
// findOneAndUpdate with upsert:true means:
// "Find it if it exists, create it if it doesn't — never duplicate"
Facility.findOneAndUpdate(
  { normalizedName },         // search by lowercase name
  { name, normalizedName, location },
  { upsert: true, new: true }
)
```

#### 3b. Check `routes`

**What to say:**
> "A Route was created linking the pickup facility to the dropoff facility."

Look for a new route document:
```json
{
  "startFacility": ObjectId("...main warehouse id..."),
  "endFacility":   ObjectId("...target store nyc id...")
}
```

The unique index on `(startFacility, endFacility)` means this route will **never be duplicated** even if 100 packages go from the same warehouse to the same store.

#### 3c. Check `handlingevents`

**What to say:**
> "Here is the first record in our bridge table. It joins the package to the facility where it currently is."

Look for the new event:
```json
{
  "package":        ObjectId("...DEMO-001 id..."),
  "facility":       ObjectId("...main warehouse id..."),
  "user":           ObjectId("...admin id..."),
  "route":          ObjectId("...route id..."),
  "eventType":      "assigned",
  "statusSnapshot": "pending"
}
```

**Point out:** `eventType` is `"assigned"` because this was a fresh package being assigned to a driver.

#### 3d. Check `packages`

**What to say:**
> "The package document stores three foreign keys that point to the related documents."

Open the `DEMO-001` package and show:
```json
{
  "packageId":        "DEMO-001",
  "status":           "pending",
  "currentFacility":  ObjectId("...main warehouse id..."),
  "route":            ObjectId("...route id..."),
  "lastHandlingEvent": ObjectId("...event id...")
}
```

**Say:** "currentFacility is a foreign key — a pointer — to the facility document. The package knows where it is right now."

---

### STEP 4 — Move the Package (Status Change Simulation)

**In the frontend, update DEMO-001:**

Change **Status** from `pending` → `in_transit` and click **Update**.

---

### STEP 5 — Show the Facility Object Changing

**Switch to MongoDB Compass.**

#### 5a. New facility appeared in `facilities`

**What to say:**
> "Because the status is now `in_transit` and there's a truck ID of T-42, the system auto-created a transit facility called 'Truck T-42'."

```json
{
  "name":           "Truck T-42",
  "normalizedName": "truck t-42",
  "location":       "inTransit"
}
```

**The code that did this** (`packageController.js`, `buildTrackingContext`):
```js
if (pkg.status === "in_transit") {
  currentFacility = await ensureFacility(
    `Truck ${pkg.truckId}`,  // "Truck T-42"
    pkg.deliveryType,
    "transit",               // forces location = "inTransit"
    "In Transit"
  );
}
```

#### 5b. A second HandlingEvent was added

Look in `handlingevents` — there are now **2 records for DEMO-001**:

| # | eventType | statusSnapshot | facility |
|---|---|---|---|
| 1 | `assigned` | `pending` | Main Warehouse |
| 2 | `inTransit` | `in_transit` | Truck T-42 |

**What to say:**
> "This is the many-to-many in action. One package — two facility records — two junction rows in HandlingEvent. We have a complete audit trail."

#### 5c. The Package's `currentFacility` changed

Open the DEMO-001 package document again:
```json
{
  "currentFacility":   ObjectId("...Truck T-42 id..."),   // CHANGED
  "lastHandlingEvent": ObjectId("...new event id...")      // CHANGED
}
```

**Say:** "The package object itself updated its pointer. It's no longer pointing at Main Warehouse — it's pointing at Truck T-42. The old events are preserved in HandlingEvent."

---

### STEP 6 — Deliver the Package

**In the frontend, update DEMO-001:**

Change **Status** from `in_transit` → `delivered` and click **Update**.

---

### STEP 7 — Show the Final Database State

#### 7a. `handlingevents` now has 3 records for DEMO-001

| # | eventType | statusSnapshot | facility |
|---|---|---|---|
| 1 | `assigned` | `pending` | Main Warehouse |
| 2 | `inTransit` | `in_transit` | Truck T-42 |
| 3 | `unloaded` | `delivered` | Target Store NYC |

**What to say:**
> "Three handling events. Three facilities. One package. This is the full journey — and every step is stored forever in the bridge collection."

#### 7b. Package's `currentFacility` points to Target Store NYC

```json
{
  "status":          "delivered",
  "currentFacility": ObjectId("...target store nyc id...")
}
```

**The logic that picks the right facility** (`buildTrackingContext`):
```js
// delivered/returned/lost/cancelled → currentFacility = dropoff
if (["delivered", "returned", "lost", "cancelled"].includes(pkg.status)) {
  currentFacility = dropoffFacility;
}
```

---

### STEP 8 — Run MongoDB Compass Queries to Prove the Many-to-Many

**Open the Shell tab in MongoDB Compass and run these one at a time:**

#### Query 1: Find all events for DEMO-001 (all facilities it passed through)
```js
db.handlingevents.find(
  { package: ObjectId("PASTE_DEMO001_ID_HERE") }
).pretty()
```
> "One package, all its facilities."

#### Query 2: Find all packages that passed through Main Warehouse
```js
db.handlingevents.find(
  { facility: ObjectId("PASTE_MAIN_WAREHOUSE_ID_HERE") }
).pretty()
```
> "One facility, all packages it handled. This is the reverse direction of the many-to-many."

#### Query 3: Full populated view (join across all collections)
```js
db.handlingevents.aggregate([
  { $lookup: {
      from: "packages",
      localField: "package",
      foreignField: "_id",
      as: "pkg"
  }},
  { $lookup: {
      from: "facilities",
      localField: "facility",
      foreignField: "_id",
      as: "fac"
  }},
  { $project: {
      packageId: { $arrayElemAt: ["$pkg.packageId", 0] },
      facilityName: { $arrayElemAt: ["$fac.name", 0] },
      eventType: 1,
      statusSnapshot: 1,
      createdAt: 1
  }}
]).pretty()
```
> "This is the equivalent of a SQL JOIN. MongoDB's `$lookup` connects the bridge table to both sides."

---

### STEP 9 — Show the Summary API Endpoint

**Open a browser or Postman and hit:**
```
GET http://localhost:5000/api/packages/summary
```
*(You'll need to include an Authorization header with a valid token)*

**The response will include:**
```json
{
  "entities": {
    "users": 3,
    "packages": 1,
    "facilities": 3,
    "routes": 1,
    "handlingEvents": 3
  },
  "manyToMany": {
    "name": "Packages <-> Facilities",
    "through": "HandlingEvent",
    "description": "A package can move through many facilities, and every facility can handle many different packages. Each HandlingEvent stores one join record together with the responsible user and route."
  },
  "recentHandlingEvents": [ ... ]
}
```

**Say:**
> "The API literally describes its own many-to-many relationship in the response. `through: HandlingEvent` tells any client exactly which collection is acting as the bridge."

---

## Summary of Key Points for the Audience

| Concept | How it's implemented |
|---|---|
| Many-to-many relationship | `HandlingEvent` is the bridge between `Package` and `Facility` |
| No duplicate facilities | `upsert` with `normalizedName` as unique key |
| No duplicate routes | Compound unique index on `(startFacility, endFacility)` |
| Full audit trail | Every status change creates a new HandlingEvent — old ones never deleted |
| Current location | `package.currentFacility` is always updated to reflect where the package is now |
| History | Query `HandlingEvent` by `package._id` to get the full journey |
| Reverse lookup | Query `HandlingEvent` by `facility._id` to see all packages that ever passed through |

---

## Common Questions from the Audience

**Q: Why not embed facility info inside the package document?**  
A: Because a facility handles thousands of packages. If we embedded, we'd duplicate the facility name, address, and type in every package — and updating one facility name would require updating thousands of packages. References (foreign keys) avoid that.

**Q: Why not a simple array of facilityIds on the Package?**  
A: Arrays can't store the metadata we need — *when* it was there, *who* logged it, *what was the status*, *which route* was active. HandlingEvent carries all that context alongside the relationship.

**Q: Is this a SQL join table?**  
A: Exactly the same idea. In SQL it would be a table with `package_id` and `facility_id` as foreign keys plus extra columns. In MongoDB it's a collection with ObjectId references plus extra fields. Same pattern, different engine.

**Q: What happens if we delete a package?**  
A: Look at the `deletePackage` controller — it explicitly calls `HandlingEvent.deleteMany({ package: pkg._id })` first, cleaning up all bridge records before deleting the package. MongoDB doesn't enforce cascading deletes automatically, so we do it manually.

---

## Quick Reference — Where to Look in the Code

| Thing to explain | File | Line |
|---|---|---|
| Package model with foreign keys | `backend/models/Package.js` | 27–38 |
| HandlingEvent (the bridge) | `backend/models/HandlingEvent.js` | entire file |
| Facility upsert logic | `backend/controllers/packageController.js` | 108–127 |
| Route upsert logic | `backend/controllers/packageController.js` | 129–147 |
| How current facility is chosen | `backend/controllers/packageController.js` | 167–190 |
| Bridge record creation | `backend/controllers/packageController.js` | 192–212 |
| Summary API (describes M:M) | `backend/controllers/packageController.js` | 363–420 |
| Cascade delete of events | `backend/controllers/packageController.js` | 497 |

---

*Tutorial created for live audience demo — follow steps in order for maximum impact.*
