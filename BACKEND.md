Our backend has three big jobs:

1. user login and registration
2. package management
3. tracking logic

That means the backend:

- creates users
- logs users in
- creates packages
- updates packages
- deletes packages
- checks who owns a package
- builds facilities and routes
- writes handling event history

So this is not just a backend for saving one table.

It is a backend for a package tracking system.

## What technologies the backend uses

The backend uses:

- Node.js
- Express
- MongoDB
- Mongoose
- bcrypt
- cors
- dotenv

Here is what those mean in simple words:

- Node.js
  - lets us run JavaScript on the server

- Express
  - helps us build routes like `/api/auth/login`

- MongoDB
  - stores the data

- Mongoose
  - helps us create models and schemas for MongoDB

- bcrypt
  - hashes passwords so they are not saved as plain text

- cors
  - allows the frontend and backend to talk to each other

- dotenv
  - loads environment variables like database connection strings

## What form the database took

"The database took the form of MongoDB collections, and each collection was defined in the backend using a Mongoose model and schema."

That means:

- MongoDB stores data in collections
- Mongoose tells MongoDB what each kind of record should look like

So our database was not just random JSON.

It was structured using models.

The main collections were:

- `users`
- `packages`
- `facilities`
- `routes`
- `handlingevents`

Each one had a different job.

## What form the database took for all collections


### `users` collection

This collection took the form of user account records.

Each record stored:

- username
- password hash
- role

This collection answered questions like:

- who is this person?
- are they an admin or a driver?
- can they log in?

### `packages` collection

This collection took the form of shipment records.

Each record stored:

- package ID
- description
- amount
- delivery type
- truck ID
- pickup location
- dropoff location
- status
- owner information
- route reference
- current facility reference
- last handling event reference

This collection answered questions like:

- what package is this?
- where is it supposed to go?
- who owns it?
- what is its current status?

### `facilities` collection

This collection took the form of location records.

Each record stored:

- facility name
- normalized name
- facility type

This collection answered questions like:

- where can packages be handled?
- is this place a warehouse, distribution center, store, customer address, or in-transit location?

### `routes` collection

This collection took the form of path records between locations.

Each record stored:

- start facility
- end facility

This collection answered questions like:

- what route connects one facility to another?

### `handlingevents` collection

This collection took the form of tracking history records.

Each record stored:

- package reference
- facility reference
- user reference
- route reference
- event type
- status snapshot

This collection answered questions like:

- what happened to this package?
- where did it happen?
- who made the change?
- what was the package status at that time?


## Collection map

This section is the easiest way to picture how the collections connect.

Think of it like a map of the backend database.

### Simple collection map

`User`

- stores account info
- one user can create or update many handling events
- one driver can own many packages

`Package`

- stores the main shipment record
- belongs to one driver through `ownerUserId`
- points to one current route
- points to one current facility
- points to one last handling event
- can have many handling events over time

`Facility`

- stores one location
- can be the start of many routes
- can be the end of many routes
- can appear in many handling events

`Route`

- connects one start facility to one end facility
- can be used by many packages
- can appear in many handling events

`HandlingEvent`

- links one package to one facility at one point in time
- also links the route and the user
- stores the package history

## Collection relationship map


- A `User` can own many `Package` records.
- A `Package` belongs to one owner at a time.
- A `Package` can have many `HandlingEvent` records.
- A `Facility` can appear in many `HandlingEvent` records.
- A `Route` connects one `Facility` to another `Facility`.
- A `Route` can be used by many `Package` records.
- A `HandlingEvent` connects a `Package`, a `Facility`, a `Route`, and a `User`.

## The most important relationship map to memorize

`User` -> owns -> `Package`

`Package` -> moves through -> `Facility`

`Package` + `Facility` -> connected by -> `HandlingEvent`

`Route` -> connects -> `Facility` to `Facility`

That is the heart of the whole backend.

## The main backend folder structure

The important backend files are:

- `backend/server.js`
- `backend/routes/authRoutes.js`
- `backend/routes/packageRoutes.js`
- `backend/middleware/requireCurrentUser.js`
- `backend/controllers/authController.js`
- `backend/controllers/packageController.js`
- `backend/models/User.js`
- `backend/models/Package.js`
- `backend/models/Facility.js`
- `backend/models/Route.js`
- `backend/models/HandlingEvent.js`
- `backend/utils/userDirectory.js`
- `backend/utils/localUserStore.js`

## 1. `backend/server.js`

This is the starting point for the backend.

This file turns the server on.

### What it does

It does these things:

1. loads environment variables
2. creates the Express app
3. turns on middleware like `cors()` and `express.json()`
4. tries to connect to MongoDB
5. adds the main routes
6. starts the server on port 5000

### Important functions in this file

#### `connectDatabase()`

This function tries to connect to MongoDB.

It does not only try one connection.

It tries:

1. the main database URI from `MONGODB_URI`
2. a fallback local database URI from `MONGODB_LOCAL_URI`
3. the built-in fallback string `mongodb://127.0.0.1:27017/packet-tracker`

That means the project is made to be flexible.

If the main database is not working, it still tries other options.

#### `startServer()`

This function:

1. calls `connectDatabase()`
2. adds `/api/packages`
3. adds `/api/auth`
4. adds a small `/` test route that says `"API Running"`
5. starts listening on port `5000`

### Why this file matters

This file is the entry point.

Without it, the backend does not run.

If the professor asks, "How does your server start?" the answer is:

"`server.js` creates the Express app, connects to the database, adds the routes, and starts listening on port 5000."

## 2. `backend/routes/authRoutes.js`

This file handles auth routes.

Auth means:

- register
- login

### What routes it has

- `POST /register`
- `POST /login`

### What it really does

This file does not contain the full logic itself.

It sends the work to the auth controller.

So it is like a signpost.

It says:

- register requests go to `register`
- login requests go to `login`

Those functions are in `authController.js`.

## 3. `backend/routes/packageRoutes.js`

This file handles package routes.

### What routes it has

- `POST /`
- `GET /`
- `GET /summary`
- `GET /:id`
- `PUT /:id`
- `DELETE /:id`

Because this route file is mounted under `/api/packages`, the full routes become:

- `POST /api/packages`
- `GET /api/packages`
- `GET /api/packages/summary`
- `GET /api/packages/:id`
- `PUT /api/packages/:id`
- `DELETE /api/packages/:id`

### The most important line in this file

This file uses:

- `router.use(requireCurrentUser);`

That means every package route is protected.

Before the route logic runs, the app first checks the current user.

That is a very important security step.

## 4. `backend/middleware/requireCurrentUser.js`

This file is one of the most important backend files.

Middleware is code that runs before the main route logic.

This middleware checks who is making the request.

### What headers it reads

It reads:

- `x-user-id`
- `x-user-username`
- `x-user-role`

These headers are sent by the frontend.

### What the middleware checks

It checks:

1. are all the headers there?
2. does the user ID belong to a real user?
3. does the username match the stored user?
4. does the role match the stored user?

If the answer is yes, the middleware saves the user into:

- `req.currentUser`

Then the request can continue.

If the answer is no, the request is blocked.

### Why this matters

This is how the backend knows the request is coming from the correct user.

If the professor asks, "How are your package routes protected?" the answer is:

"They use the `requireCurrentUser` middleware, which checks the user ID, username, and role from the request headers before allowing the route to continue."

## 5. `backend/controllers/authController.js`

This file holds the real logic for login and register.

It has two main functions:

- `register`
- `login`

### `register`

This function creates a new user.

### Step by step

1. It reads `username`, `password`, and `role` from the request body.
2. It trims the username.
3. It makes sure the username and password are not empty.
4. It sets the role.
   - if the role is exactly `"admin"`, it stays admin
   - otherwise it becomes `"driver"`
5. If MongoDB is connected:
   - it checks whether the username already exists in the `User` collection
   - if not, it creates a new `User` model and saves it
6. If MongoDB is not connected:
   - it uses `localUserStore` to save the user
7. It sends back a success message

### Important detail

The password is not saved as plain text.

That is handled in the `User` model with a password-hashing hook.

### `login`

This function logs a user in.

### Step by step

1. It reads the username and password from the request body.
2. It checks that both values are there.
3. If MongoDB is connected:
   - it finds the user in the `User` collection
   - it uses `comparePassword(...)` to compare the password
4. If MongoDB is not connected:
   - it looks in the local user store
   - it compares the password hash with bcrypt
5. If the password is correct, it returns:
   - `id`
   - `username`
   - `role`
6. If the password is wrong, it returns an error

### Why this file matters

This file is what gives the app user accounts and roles.

Without this file:

- no login
- no register
- no role-based access

## 6. `backend/controllers/packageController.js`

This is the biggest and most important controller file in the project.

This file handles almost all the package logic.

It does much more than simple CRUD.

It also handles:

- owner rules
- facility creation
- route creation
- tracking event creation
- summary data

### Main exported functions

These are the main route functions:

- `createPackage`
- `getAllPackages`
- `getDataModelSummary`
- `getPackageById`
- `updatePackage`
- `deletePackage`

I will explain all of them.

## 6A. `createPackage`

This creates a new package.

### Step by step

1. It builds a safe payload using `buildPackagePayload(...)`
2. It creates a new `Package` model
3. It builds tracking context using `buildTrackingContext(...)`
4. It sets:
   - `route`
   - `currentFacility`
5. It saves the package
6. It creates a handling event using `recordHandlingEvent(...)`
7. It saves the handling event ID into `lastHandlingEvent`
8. It sends the new package back

### Why this is important

This is not just:

"save a package row"

It also creates tracking information around the package.

That is what makes the app feel like a tracking app.

## 6B. `getAllPackages`

This gets package records.

### Step by step

1. It checks the role of `req.currentUser`
2. If the user is an admin:
   - query is `{}` which means all packages
3. If the user is a driver:
   - query becomes `{ ownerUserId: req.currentUser.id }`
4. It finds the packages
5. It sorts them by newest updates first
6. It sends them back

### Why this is important

This is how the app makes the admin see everything and the driver see only their own data.

## 6C. `getDataModelSummary`

This creates summary information for the admin dashboard.

### What it gathers

It gathers:

- user count
- package count
- facility count
- route count
- handling event count
- driver directory
- recent handling events

### Why this is important

This is what powers the admin dashboard summary.

It also explains the many-to-many relationship in the API response.

That is a nice technical feature because it lets the frontend show more than just package rows.

## 6D. `getPackageById`

This gets one package by its MongoDB ID.

### Step by step

1. It checks if the ID format is valid
2. It looks up the package
3. It checks if the package exists
4. It checks if the current user is allowed to access it
5. If allowed, it sends the package back

### Why this matters

This is another place where access control is enforced.

## 6E. `updatePackage`

This updates a package.

### Step by step

1. It checks the package ID
2. It finds the package
3. It checks access using `canAccessPackage(...)`
4. It saves the old package state as `previousPackage`
5. It builds the new payload using `buildPackagePayload(...)`
6. It updates the package object
7. It rebuilds tracking context with `buildTrackingContext(...)`
8. It saves the updated package
9. It writes a new handling event with `recordHandlingEvent(...)`
10. It saves the new handling event as `lastHandlingEvent`
11. It sends the updated package back

### Why this matters

This means updates also update the tracking history.

The app does not just overwrite data and forget what happened.

## 6F. `deletePackage`

This deletes a package.

### Step by step

1. It checks the package ID
2. It finds the package
3. It checks access using `canAccessPackage(...)`
4. It deletes all related `HandlingEvent` documents for that package
5. It deletes the package itself
6. It sends back a success message

### Why this matters

The app cleans up related tracking records too.

That keeps the data cleaner.

## Important helper functions in `packageController.js`

The helper functions are a big reason why this backend is strong.

They break the logic into smaller pieces.

## `buildPackagePayload(...)`

This helper builds the package data in a safe way.

### What it does

- picks only allowed fields
- cleans strings
- converts number fields
- handles admin vs driver rules
- decides the owner
- checks required fields

### Why it matters

This function helps stop bad or extra data from being saved.

It also keeps role rules clean.

For example:

- admins can assign `ownerUsername`
- drivers cannot assign packages to other people

## `buildTrackingContext(pkg)`

This is one of the smartest helpers.

### What it does

It creates or finds:

- pickup facility
- dropoff facility
- route
- current facility

### How it decides the current facility

- if status is `in_transit`, current facility becomes a truck-style transit location
- if status is `delivered`, `returned`, `lost`, or `cancelled`, current facility becomes the dropoff facility
- otherwise it usually starts at the pickup facility

### Why it matters

This is the function that gives the package a place in the tracking flow.

## `recordHandlingEvent(...)`

This creates a new handling event.

### What it saves

- package
- facility
- route
- user
- event type
- status snapshot

### How it chooses event type

If the package is new or the owner changed, it can use:

- `assigned`

If status changes, it maps statuses to event types like:

- `received`
- `loaded`
- `inTransit`
- `unloaded`

### Why it matters

This is what gives the app package history.

Without this function, the project would just store the latest version of a package and lose the timeline.

## `canAccessPackage(pkg, currentUser)`

This checks if a user is allowed to access a package.

### Rule

- admins can access all packages
- drivers can only access packages where `pkg.ownerUserId === currentUser.id`

### Why it matters

This is one of the key security rules in the backend.

## `handlePackageError(...)`

This helper gives cleaner error responses.

It figures out which kind of error happened and sends back the right status code and message.

That helps keep controller code cleaner.

## Other helpers in `packageController.js`

There are some other useful helper functions too:

- `normalizeNumber(...)`
- `pickAllowedFields(...)`
- `resolveOwner(...)`
- `requireField(...)`
- `buildTransitFacilityName(...)`
- `determineFacilityType(...)`
- `ensureFacility(...)`
- `ensureRoute(...)`
- `mapStatusToEventType(...)`
- `getUserCount()`
- `getDriverDirectory()`

You do not need to memorize all of them, but it is good to know they exist because they keep the logic organized.

## 7. The model files

Now I will explain the database models.

The models are very important because they define what kind of data we save.

## `backend/models/User.js`

This model stores users.

### Fields

- `username`
- `password`
- `role`

### Important rules

- username is required
- username must be unique
- password is required
- role must be either `admin` or `driver`

### Important backend behavior

This model has:

- a `pre("save")` hook that hashes the password with bcrypt
- a method called `comparePassword(...)`

### Why this matters

It protects passwords and helps login work safely.

## `backend/models/Package.js`

This model stores package records.

### Important fields

- `packageId`
- `description`
- `amount`
- `weight`
- `deliveryType`
- `truckId`
- `pickupLocation`
- `dropoffLocation`
- `status`
- `ownerUserId`
- `ownerUsername`
- `createdByRole`
- `route`
- `currentFacility`
- `lastHandlingEvent`

### Why this matters

This is the main record the app is built around.

But notice:

The package also points to other records.

That shows that the package is part of a bigger system.

## `backend/models/Facility.js`

This model stores facilities.

### Fields

- `name`
- `normalizedName`
- `location`

### Why `normalizedName` matters

This helps stop duplicates.

For example:

- `"Amazon Warehouse"`
- `"amazon warehouse"`

should really be treated as the same facility.

That is why the model stores a normalized lowercase version too.

### Location types

The location can be:

- `warehouse`
- `distributionCenter`
- `retailStore`
- `customerAddress`
- `inTransit`

## `backend/models/Route.js`

This model stores routes.

### Fields

- `startFacility`
- `endFacility`

### Important rule

This model has a unique index on:

- `startFacility`
- `endFacility`

That means the same exact route should not be stored again and again.

## `backend/models/HandlingEvent.js`

This model stores package tracking history.

### Fields

- `package`
- `facility`
- `user`
- `route`
- `eventType`
- `statusSnapshot`

### Why this model is so important

This model is what turns the project into a tracking app.

It does two very important jobs:

1. it stores the history of what happened
2. it acts like the bridge between packages and facilities

This means the main many-to-many relationship in the app is:

- packages and facilities

connected through:

- `HandlingEvent`

## 8. `backend/utils/userDirectory.js`

This helper file makes user lookup easier.

### What it does

It has helper functions like:

- `isMongoConnected()`
- `normalizeString(...)`
- `findUserById(...)`
- `findUserByUsername(...)`

### Why it matters

It gives the rest of the backend one simple place to ask:

- "Is MongoDB connected?"
- "Can you find this user?"

That keeps other files cleaner.

## 9. `backend/utils/localUserStore.js`

This file is the fallback user system.

If MongoDB is not working, the app can still save and find users using a local JSON file.

### What it does

It can:

- make sure the storage file exists
- read users from JSON
- write users to JSON
- create new users
- find users by username
- find users by ID

### Why it matters

This makes the app more flexible during testing or fallback situations.

It also shows that the backend was built with backup logic.

## The main backend flow from start to finish


### User registration

1. Frontend sends username, password, and role to `/api/auth/register`
2. `authRoutes.js` sends it to `register`
3. `register` checks the data
4. The user is saved
5. Password is hashed
6. Success message is returned

### User login

1. Frontend sends username and password to `/api/auth/login`
2. `authRoutes.js` sends it to `login`
3. Backend finds the user
4. Backend compares the password
5. Backend sends back ID, username, and role
6. Frontend saves that user data

### Protected package request

1. Frontend sends a package request
2. Axios adds the custom user headers
3. `requireCurrentUser` checks the user
4. If valid, the package controller runs

### Create package

1. `createPackage` builds the payload
2. It builds tracking context
3. It saves the package
4. It writes a handling event
5. It sends the package back

### Update package

1. `updatePackage` checks access
2. It updates the package
3. It rebuilds tracking context
4. It writes another handling event
5. It sends the updated package back

### Delete package

1. `deletePackage` checks access
2. It removes related handling events
3. It removes the package
4. It sends a success response

## The most important backend ideas to remember

If you remember nothing else, remember these:

### 1. The backend protects package routes

That happens with:

- `requireCurrentUser`

### 2. The backend uses role-based logic

That means:

- admin sees all packages
- driver sees only their own packages

### 3. The backend does more than CRUD

It also:

- creates facilities
- creates routes
- writes handling events

### 4. Passwords are hashed

They are not saved as plain text.

### 5. The many-to-many relationship is:

- packages and facilities

through:

- `HandlingEvent`

## Easy presentation version

"Our backend is built with Node.js, Express, MongoDB, and Mongoose.

`server.js` starts the app and connects to the database.

The auth routes handle login and register.

The package routes handle create, read, update, delete, and summary actions.

All package routes are protected by `requireCurrentUser`, which checks the current user from request headers.

The package controller does more than simple CRUD. It also builds facilities, routes, and handling events, so the app keeps a real tracking history.

The main models are `User`, `Package`, `Facility`, `Route`, and `HandlingEvent`.

The main many-to-many relationship is between packages and facilities through `HandlingEvent`."

