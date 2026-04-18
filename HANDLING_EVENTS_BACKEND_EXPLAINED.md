# Handling Events Backend Explained

This file explains how the backend creates and connects packages, facilities, routes, and handling events.

## First: is `handlingEvents` a function?

No. In this codebase, `handlingEvents` is not the name of a function.

What exists is:

- A **MongoDB collection/model** named `HandlingEvent` in [backend/models/HandlingEvent.js](/Users/eduardo/Desktop/Group-Project/backend/models/HandlingEvent.js:1)
- A **helper function** named `recordHandlingEvent(...)` in [backend/controllers/packageController.js](/Users/eduardo/Desktop/Group-Project/backend/controllers/packageController.js:192)

So if a professor asks, the correct answer is:

`handlingEvents` usually refers to the collection of tracking-history records, while the backend function that actually creates one of those records is `recordHandlingEvent`.

## The big idea

The package controller does more than CRUD.

When a package is created or updated, the backend also:

1. Validates and normalizes the incoming package data.
2. Figures out which facilities should exist.
3. Creates or reuses a route between those facilities.
4. Chooses the package's `currentFacility`.
5. Saves the package.
6. Creates a new `HandlingEvent` document that records what just happened.
7. Stores that event's `_id` back on the package as `lastHandlingEvent`.

The main write flow is in:

- `createPackage` at [backend/controllers/packageController.js](/Users/eduardo/Desktop/Group-Project/backend/controllers/packageController.js:331)
- `updatePackage` at [backend/controllers/packageController.js](/Users/eduardo/Desktop/Group-Project/backend/controllers/packageController.js:445)

## The exact write pipeline

### 1. The request reaches the package routes

All package routes go through `requireCurrentUser` in [backend/routes/packageRoutes.js](/Users/eduardo/Desktop/Group-Project/backend/routes/packageRoutes.js:1).

That middleware:

- reads `x-user-id`, `x-user-username`, and `x-user-role`
- looks up the user
- verifies the headers match the stored account
- attaches the result to `req.currentUser`

Code:

- [backend/middleware/requireCurrentUser.js](/Users/eduardo/Desktop/Group-Project/backend/middleware/requireCurrentUser.js:1)

That matters because the handling event stores **which user caused the event**.

### 2. The controller builds the package payload

`buildPackagePayload(...)` in [backend/controllers/packageController.js](/Users/eduardo/Desktop/Group-Project/backend/controllers/packageController.js:214):

- filters input to only allowed fields
- normalizes strings
- converts numbers
- resolves the assigned driver if the current user is an admin
- applies defaults in some cases
- enforces required fields on create

Important behavior:

- Admins can set `ownerUsername`
- Drivers cannot reassign ownership
- A driver's new package defaults to `status = "in_transit"` if no status is provided
- A driver's new package defaults to `pickupLocation = "Assigned truck"` if none is provided

### 3. The controller builds tracking context

The central helper is `buildTrackingContext(pkg)` in [backend/controllers/packageController.js](/Users/eduardo/Desktop/Group-Project/backend/controllers/packageController.js:167).

It does four things:

1. Ensures a pickup facility exists.
2. Ensures a dropoff facility exists.
3. Ensures a route exists from pickup to dropoff.
4. Decides what the package's `currentFacility` should be based on status.

It returns:

- `pickupFacility`
- `dropoffFacility`
- `currentFacility`
- `route`

## How facilities are created

### Facility creation happens through `ensureFacility(...)`

Code:

- [backend/controllers/packageController.js](/Users/eduardo/Desktop/Group-Project/backend/controllers/packageController.js:108)

This helper does **upsert** logic:

- It computes a normalized facility name.
- It calls `Facility.findOneAndUpdate(..., { upsert: true })`.

That means:

- if a facility with the same `normalizedName` already exists, it is reused
- if it does not exist, MongoDB creates a new facility document

The actual `Facility` schema is in:

- [backend/models/Facility.js](/Users/eduardo/Desktop/Group-Project/backend/models/Facility.js:1)

Important fields:

- `name`
- `normalizedName`
- `location`

`normalizedName` is unique, so two facilities with the same normalized name should collapse into one record.

### How the facility type is chosen

The type is computed by `determineFacilityType(...)` in [backend/controllers/packageController.js](/Users/eduardo/Desktop/Group-Project/backend/controllers/packageController.js:75).

Possible facility `location` values are:

- `warehouse`
- `distributionCenter`
- `retailStore`
- `customerAddress`
- `inTransit`

The rules are:

- If `stopKind === "transit"`, the facility type is always `inTransit`.
- If the name contains words like `warehouse`, `distribution`, `hub`, `dc`, `store`, `target`, or `retail`, those keywords drive the type.
- Otherwise it falls back to delivery logic:
  - pickup + transfer => `distributionCenter`
  - pickup + non-transfer => `warehouse`
  - dropoff + store delivery => `retailStore`
  - dropoff + transfer => `distributionCenter`
  - otherwise => `customerAddress`

### How a truck becomes a facility

If the status is `in_transit`, `buildTrackingContext(...)` does not keep the package at pickup or dropoff.

Instead it creates or reuses a transit facility using:

- `buildTransitFacilityName(truckId)` at [backend/controllers/packageController.js](/Users/eduardo/Desktop/Group-Project/backend/controllers/packageController.js:70)

That turns a truck ID into a facility name like:

- `Truck 002`

Then `ensureFacility(...)` is called with `stopKind = "transit"`, so the facility is stored as:

- `name: "Truck 002"`
- `location: "inTransit"`

This is why, in MongoDB, the truck can show up as a facility document.

## How routes are created

Routes are handled by `ensureRoute(...)` in [backend/controllers/packageController.js](/Users/eduardo/Desktop/Group-Project/backend/controllers/packageController.js:129).

It also uses upsert logic:

- `startFacility = pickupFacility._id`
- `endFacility = dropoffFacility._id`

If that exact start/end pair already exists, it reuses the route.
If not, it creates a new route.

The schema is in:

- [backend/models/Route.js](/Users/eduardo/Desktop/Group-Project/backend/models/Route.js:1)

There is a unique index on:

- `startFacility`
- `endFacility`

So the same route pair should not be duplicated.

## How the package decides its current facility

This happens inside `buildTrackingContext(...)` at [backend/controllers/packageController.js](/Users/eduardo/Desktop/Group-Project/backend/controllers/packageController.js:172).

Rules:

- Default: `currentFacility = pickupFacility`
- If status is `in_transit`: `currentFacility = transit facility for the truck`
- If status is `delivered`, `returned`, `lost`, or `cancelled`: `currentFacility = dropoffFacility`

That means the package document always stores one current pointer:

- `currentFacility`

Schema:

- [backend/models/Package.js](/Users/eduardo/Desktop/Group-Project/backend/models/Package.js:27)

So the package says where it is **now**, while the handling events preserve where it has been **over time**.

## How handling events are created

### The function that writes them

The backend writes a handling event with:

- `recordHandlingEvent(pkg, trackingContext, currentUser, previousPackage)`

Code:

- [backend/controllers/packageController.js](/Users/eduardo/Desktop/Group-Project/backend/controllers/packageController.js:192)

This function creates one `HandlingEvent` document with:

- `package`: the package `_id`
- `facility`: the chosen `currentFacility._id`
- `route`: the route `_id`
- `user`: the user who triggered the change
- `eventType`: a higher-level event label
- `statusSnapshot`: the package status at that moment

### When it runs

It runs in both:

- `createPackage(...)` after the package is first saved at [backend/controllers/packageController.js](/Users/eduardo/Desktop/Group-Project/backend/controllers/packageController.js:341)
- `updatePackage(...)` after the updated package is saved at [backend/controllers/packageController.js](/Users/eduardo/Desktop/Group-Project/backend/controllers/packageController.js:471)

So:

- creating a package creates a handling event
- updating a package creates another handling event

That is why the history grows over time.

## How status becomes event type

The status-to-event mapping is done by `mapStatusToEventType(status)` in [backend/controllers/packageController.js](/Users/eduardo/Desktop/Group-Project/backend/controllers/packageController.js:149).

Mapping:

- `pending` -> `received`
- `picked_up` -> `loaded`
- `in_transit` -> `inTransit`
- `delivered` -> `unloaded`
- `lost` -> `unloaded`
- `returned` -> `unloaded`
- `cancelled` -> `unloaded`
- anything else -> `assigned`

This is important:

- `statusSnapshot` stores the exact package status
- `eventType` stores the backend's interpretation of what kind of handling action that status represents

So they are related, but they are not the same field.

## Special rule: reassignment creates `assigned`

Inside `recordHandlingEvent(...)`, this line matters:

- [backend/controllers/packageController.js](/Users/eduardo/Desktop/Group-Project/backend/controllers/packageController.js:199)

Logic:

- if there is no `previousPackage`, event type is `assigned`
- if `previousPackage.ownerUserId !== pkg.ownerUserId`, event type is also `assigned`
- otherwise, event type comes from `mapStatusToEventType(pkg.status)`

That means:

- package creation => `assigned`
- changing the driver => `assigned`
- ordinary status updates => mapped event type

So if a professor asks why a brand new package may not produce `received` even if status is `pending`, the answer is:

The code intentionally prioritizes the ownership/assignment event over the status mapping when the package is first created or reassigned.

## Your exact example: `pending` -> `in_transit`

Suppose a package already exists and currently has:

- `status = "pending"`
- `pickupLocation = "Walmart Warehouse"`
- `dropoffLocation = "Best Buy"`
- `truckId = "002"`

Then someone updates it to:

- `status = "in_transit"`

Here is exactly what the backend does.

### Step 1. Load the existing package

`updatePackage(...)` finds the package by Mongo `_id` and checks access:

- [backend/controllers/packageController.js](/Users/eduardo/Desktop/Group-Project/backend/controllers/packageController.js:445)

### Step 2. Capture the old state

The old document is copied into:

- `previousPackage = pkg.toObject()`

Code:

- [backend/controllers/packageController.js](/Users/eduardo/Desktop/Group-Project/backend/controllers/packageController.js:461)

This matters because the controller later compares old owner vs new owner.

### Step 3. Apply the new payload

The incoming request body is normalized and merged onto the package:

- [backend/controllers/packageController.js](/Users/eduardo/Desktop/Group-Project/backend/controllers/packageController.js:462)

### Step 4. Rebuild tracking context

`buildTrackingContext(pkg)` runs again:

- pickup facility is ensured
- dropoff facility is ensured
- route is ensured
- because status is now `in_transit`, the current facility becomes a transit facility named from the truck ID

Code:

- [backend/controllers/packageController.js](/Users/eduardo/Desktop/Group-Project/backend/controllers/packageController.js:173)

So if `Truck 002` does not already exist in `facilities`, it gets inserted now.
If it already exists, it gets reused.

### Step 5. Save the package with the new current facility

The controller writes:

- `pkg.route = trackingContext.route._id`
- `pkg.currentFacility = trackingContext.currentFacility._id`

Code:

- [backend/controllers/packageController.js](/Users/eduardo/Desktop/Group-Project/backend/controllers/packageController.js:465)

Then it saves the package.

### Step 6. Create a brand new handling event

After the package is saved, `recordHandlingEvent(...)` creates a new `HandlingEvent`.

Because this is a status change and not an owner change:

- `eventType = mapStatusToEventType("in_transit")`
- which becomes `inTransit`

The new handling event links:

- this package
- this truck/transit facility
- this route
- this user
- this status snapshot

### Step 7. Store the latest event pointer on the package

The package then stores:

- `lastHandlingEvent = handlingEvent._id`

Code:

- [backend/controllers/packageController.js](/Users/eduardo/Desktop/Group-Project/backend/controllers/packageController.js:472)

So now the database has:

- the package document with updated current state
- one more handling event documenting the transition
- possibly a new transit facility

## What “a new event is created” really means

The backend does **not** overwrite the old handling event.

It inserts another document into the `HandlingEvent` collection.

That is the whole point of tracking history:

- Package document = current snapshot
- HandlingEvent collection = historical timeline

So if a package moved:

1. pending at origin
2. in transit on Truck 002
3. delivered at Best Buy

then you should expect:

- one package document
- multiple handling event documents
- multiple facility references across those event documents

## How the many-to-many relationship works

This is the database design you should explain.

### The problem

A package can pass through many facilities.
A facility can handle many packages.

That is many-to-many.

MongoDB does not have SQL join tables, so this app models the relationship with the `HandlingEvent` collection.

### The bridge

Each handling event stores:

- one `package` reference
- one `facility` reference

Schema:

- [backend/models/HandlingEvent.js](/Users/eduardo/Desktop/Group-Project/backend/models/HandlingEvent.js:3)

That means one handling event is one bridge record connecting:

- one package
- one facility
- at one point in the package's lifecycle

### Why this is many-to-many

One package can have many handling events:

- package A -> facility 1
- package A -> facility 2
- package A -> facility 3

One facility can appear in many handling events:

- facility 2 -> package A
- facility 2 -> package B
- facility 2 -> package C

So the many-to-many is not stored directly on the `Package` or `Facility` document.
It emerges through the bridge collection.

### Why this design is better than putting arrays everywhere

Because each bridge record also stores context:

- `route`
- `user`
- `eventType`
- `statusSnapshot`
- timestamps

So it is not just “package X touched facility Y”.
It is:

“package X was handled at facility Y, by user Z, on route R, in state S, at time T.”

That is a much stronger explanation in an exam or demo.

## What the package stores vs what the handling event stores

### Package document

The package stores the current state:

- current status
- current facility
- current route
- last handling event
- owner

Schema:

- [backend/models/Package.js](/Users/eduardo/Desktop/Group-Project/backend/models/Package.js:3)

### HandlingEvent document

The handling event stores one historical moment:

- which package
- which facility
- which route
- which user
- what event type
- what status snapshot

Schema:

- [backend/models/HandlingEvent.js](/Users/eduardo/Desktop/Group-Project/backend/models/HandlingEvent.js:3)

That distinction is one of the most important things to explain clearly.

## What gets created vs what gets reused

### A new facility is created only if needed

Because `ensureFacility(...)` uses `findOneAndUpdate(..., upsert: true)`, the backend:

- creates a facility if the normalized name does not already exist
- reuses the existing facility if it does

So “status changed to `in_transit`” does **not automatically guarantee** a brand new facility document.

It guarantees that the backend will try to ensure the transit facility exists.

If `Truck 002` already exists as a facility, MongoDB reuses it.
If it does not exist yet, MongoDB inserts it.

That is the precise answer.

### A new route is created only if needed

Same logic for routes:

- new start/end pair => insert route
- existing start/end pair => reuse route

### A new handling event is created on every create/update path

This is the part that really does create a fresh record every time.

`recordHandlingEvent(...)` calls:

- `HandlingEvent.create(...)`

So the event history grows over time.

## What a professor could ask, and the correct answers

### “Is `handlingEvents` a backend function?”

No. The model is `HandlingEvent`, and the helper that creates one is `recordHandlingEvent(...)`.

### “Why does a package status change create a new event?”

Because `updatePackage(...)` always calls `recordHandlingEvent(...)` after saving the package.

### “How does the code know which event type to use?”

It maps the package status through `mapStatusToEventType(...)`, unless the package is new or reassigned, in which case it uses `assigned`.

### “How does a truck become a facility?”

When status is `in_transit`, `buildTrackingContext(...)` builds a name like `Truck 002` and upserts that as a facility with location type `inTransit`.

### “Does it always create a new facility document?”

No. It upserts by `normalizedName`, so it creates only if that facility does not already exist.

### “Where is the many-to-many relationship?”

Between `Package` and `Facility`, implemented through `HandlingEvent`.

### “Why not just store an array of facilities inside the package?”

Because the system also needs route, user, status snapshot, event type, and timestamps for each stop. `HandlingEvent` stores all of that context per relationship instance.

### “What is the difference between `status` and `eventType`?”

`status` is the package's business state.
`eventType` is the handling action label the backend derives from that state.

Example:

- status `in_transit`
- eventType `inTransit`

### “What field tells us where the package is now?”

`Package.currentFacility`

### “What field tells us the latest history record?”

`Package.lastHandlingEvent`

### “Where do we see the full history?”

In the `HandlingEvent` collection, filtered by the package `_id`.

## Important implementation detail you should know

There is one subtle issue in the current code.

`recordHandlingEvent(...)` writes:

- `timeStamp: new Date()`

Code:

- [backend/controllers/packageController.js](/Users/eduardo/Desktop/Group-Project/backend/controllers/packageController.js:210)

But the `HandlingEvent` schema does **not** define a `timeStamp` field:

- [backend/models/HandlingEvent.js](/Users/eduardo/Desktop/Group-Project/backend/models/HandlingEvent.js:3)

The schema only has Mongoose `timestamps: true`, which creates:

- `createdAt`
- `updatedAt`

Also, the code sorts by `timeStamp` in:

- [backend/controllers/packageController.js](/Users/eduardo/Desktop/Group-Project/backend/controllers/packageController.js:382)

and returns `event.timeStamp` in:

- [backend/controllers/packageController.js](/Users/eduardo/Desktop/Group-Project/backend/controllers/packageController.js:409)

So if a professor reads the code carefully, a strong answer is:

The intended design is clearly to store an explicit event timestamp, but the current schema does not define that field. In practice, the model already has `createdAt` through Mongoose timestamps, so the code is conceptually correct about time-tracking, but the implementation should either add `timeStamp` to the schema or switch fully to `createdAt`.

That is a good “extra credit” observation.

## Short version you can say out loud

When a package is created or updated, the package controller first builds tracking context. That means it makes sure the origin facility, destination facility, and route exist, and then it decides the package's current facility based on the status. If the status is `in_transit`, it creates or reuses a transit facility named from the truck, like `Truck 002`. After saving the package, the backend creates a new `HandlingEvent` document. That event links the package, the current facility, the route, and the user who made the change, and it stores both an `eventType` and a `statusSnapshot`. That `HandlingEvent` collection is the bridge that gives us the many-to-many relationship between packages and facilities, because one package can have many handling events and one facility can appear in many handling events for many packages.
