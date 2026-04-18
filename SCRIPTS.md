# Packet Tracker Project 

**Packet Tracker**.

It is a package tracking web app.

It has two big parts:

1. The **front end**
2. The **back end**

The front end is what the user sees in the browser.

The back end is the server that saves data, checks users, and controls what each person is allowed to do.

The app also uses **MongoDB** to store information.

## What the app is trying to do

The app helps people track packages as they move from place to place.

There are two user roles:

1. **Admin**
2. **Driver**

An admin can:

- see all packages
- create packages
- update packages
- delete packages
- assign packages to drivers
- see summary data

A driver can:

- log in
- see only their own packages
- create their own package records
- update their own package records
- delete their own package records
- change package status

The app also keeps tracking history using something called a **HandlingEvent**.

That means the system does not just store one package record. It also stores records about what happened to that package and where it was handled.

---

## How the whole app works

Here is the full story in plain words:

1. A person opens the website.
2. They see the login page first.
3. They log in with a username and password.
4. The front end sends the login information to the back end.
5. The back end checks if that user is real.
6. If the user is real, the back end sends back the user id, username, and role.
7. The front end saves that user information in the browser.
8. After that, every time the user makes a protected request, the browser sends the user id, username, and role in custom headers.
9. The back end checks those headers and makes sure the user still exists.
10. If the user is allowed to do the action, the back end finishes the request.
11. If not, the back end blocks the request.

That is the main loop of the whole app.

---

## Project folder layout

The project is split into two main folders:

- `frontend/`
- `backend/`

There are also important top-level files:

- `README.md`
- `PRESENTATION_SCRIPTS.md`
- `Group 22 Presentation.pdf`
- `TermProject.pdf`

### What `frontend/` is for

This folder holds the browser app.

It contains:

- React pages
- reusable UI parts
- CSS
- the API helper
- login and role-based page routing

### What `backend/` is for

This folder holds the server.

It contains:

- the Express server
- route files
- controller files
- Mongoose models
- auth middleware
- helper utilities

---

## Front end explained

## What the front end does

The front end is the part the user clicks and sees.

It is built with:

- React
- Vite
- React Router
- Axios
- Tailwind CSS

The front end has four main screens:

1. Login
2. Register
3. Admin Dashboard
4. Driver Dashboard

## Front end startup files

### `frontend/src/main.jsx`

This is the first React file that runs.

Its job is simple:

- load the global CSS
- load the main `App` component
- mount React into the HTML page

This file is the "turn the app on" file for the front end.

### `frontend/src/App.jsx`

This is the front end traffic controller.

It decides which page a person should see.

It uses React Router.

The routes are:

- `/` -> Login page
- `/register` -> Register page
- `/admin` -> Admin dashboard
- `/driver` -> Driver dashboard

This file also has two helper wrappers:

### `PublicOnly`

This wrapper says:

- if a person is already logged in as admin, send them to `/admin`
- if a person is already logged in as driver, send them to `/driver`
- if no user is logged in, let them stay on login or register

This stops logged-in users from going back to the wrong page.

### `RequireRole`

This wrapper says:

- if nobody is logged in, send the user back to `/`
- if the user has the wrong role, send them to the correct dashboard
- if the role is correct, show the page

This is the front-end role gate.

Important:

This is useful for the browser, but it is **not enough by itself** for real security. The back end still has to check permissions too.

---

## Front end helper files

### `frontend/src/lib/auth.js`

This file works with browser storage.

It has two jobs:

1. `getStoredUser()`
2. `clearStoredUser()`

#### `getStoredUser()`

This reads the `user` item from `localStorage`.

If it exists, it turns it from JSON text back into a JavaScript object.

If it does not exist, it returns `null`.

This is how the app remembers who is logged in.

#### `clearStoredUser()`

This removes the saved user from `localStorage`.

This is used during logout.

### `frontend/src/lib/api.js`

This file builds the Axios client.

It sets:

- the API base URL as `http://localhost:5000/api`

It also adds a request interceptor.

That means before each API request goes out, this file:

- reads the stored user
- adds `x-user-id`
- adds `x-user-username`
- adds `x-user-role`

So the browser is telling the server:

"Here is who I say I am."

Then the server decides if that is valid.

### `frontend/src/lib/packageFields.js`

This file stores package form defaults and options.

It has:

- `statusOptions`
- `deliveryTypeOptions`
- `createPackageForm()`
- `mapPackageToForm(pkg)`

#### `statusOptions`

This is the list of package statuses:

- pending
- picked_up
- in_transit
- delivered
- lost
- returned
- cancelled

#### `deliveryTypeOptions`

This is the list of delivery types:

- store
- residential
- return
- transfer

#### `createPackageForm()`

This creates a fresh blank form object.

This is useful when:

- starting a new package
- clearing a form after save
- cancelling an edit

#### `mapPackageToForm(pkg)`

This takes a package from the database and reshapes it so it fits the form fields.

This is used when editing a package.

---

## Reusable UI parts

### `frontend/src/components/ui.jsx`

This file is a small design system for the app.

Instead of repeating the same button and card code many times, this file stores reusable pieces.

Main pieces in this file:

- `AppShell`
- `PageFrame`
- `GlassCard`
- `SectionKicker`
- `PageTitle`
- `Field`
- `TextInput`
- `TextArea`
- `SelectInput`
- `PrimaryButton`
- `SecondaryButton`
- `Alert`
- `StatusBadge`
- `EmptyState`

### What these parts do

#### `AppShell`

Wraps the whole page.

It gives the app:

- full screen height
- dark background
- light text

#### `PageFrame`

Keeps the page centered and gives padding.

#### `GlassCard`

Makes the dark card look used all over the app.

#### `SectionKicker`

Shows the small uppercase section label text.

#### `PageTitle`

Shows a page heading and an optional action button area.

#### `Field`

Wraps a label and its input together.

#### `TextInput`, `TextArea`, `SelectInput`

These make the form controls look consistent.

#### `PrimaryButton`

The main gold button.

#### `SecondaryButton`

The lower-priority button with a lighter style.

#### `Alert`

Shows an error, success, or info message.

#### `StatusBadge`

Shows a package status with a color-coded label.

Each status gets a different color style.

#### `EmptyState`

Shows a friendly message when there is no data to show.

---

## Front end pages

## `frontend/src/pages/Login.jsx`

This is the login screen.

### What the page has

- username input
- password input
- submit button
- link to the register page
- error message area

### What happens on login

When the form is submitted:

1. it stops the normal page refresh
2. it clears any old error
3. it sends a `POST` request to `/auth/login`
4. if the login works:
   - it saves the returned user data in `localStorage`
   - it checks the user role
   - it sends admins to `/admin`
   - it sends drivers to `/driver`
5. if the login fails:
   - it shows an error message

This page is important because it starts the user session.

## `frontend/src/pages/Register.jsx`

This is the registration page.

### What the page has

- username input
- password input
- role dropdown
- create user button
- link back to sign in

### What happens on register

When the form is submitted:

1. it stops the normal page refresh
2. it clears any old error
3. it sends a `POST` request to `/auth/register`
4. if it works, it sends the user back to `/`
5. if it fails, it shows an error

### Important detail

The role dropdown lets a person choose:

- driver
- admin

That means the form allows public admin account creation.

That is a major security issue for a real app.

## `frontend/src/pages/AdminDashboard.jsx`

This is the most powerful page in the app.

It is the admin control center.

### Main jobs of this page

- fetch all packages
- fetch a project summary
- show driver assignment cards
- show registered driver accounts
- create new shipment records
- edit shipment records
- delete shipment records
- log out

### Main state values

This page stores:

- `packages`
- `dataModelSummary`
- `formData`
- `editingId`
- `error`

### Main helper functions

#### `buildPayload(formData)`

Takes the form data and turns it into the object sent to the API.

#### `buildDriverSummaries(packages)`

Groups packages by driver.

This lets the dashboard show:

- the driver username
- truck ids
- the packages assigned to that driver

#### `fetchPackages()`

Calls `GET /packages`.

Admins get every package in the system.

#### `fetchDataModelSummary()`

Calls `GET /packages/summary`.

This returns:

- entity counts
- driver directory
- recent handling events
- many-to-many relationship information

#### `loadDashboardData()`

Runs both fetches together.

#### `updateField(field)`

Updates one form field at a time.

#### `resetForm()`

Clears edit mode and resets the form.

#### `handleSubmit()`

Saves a package.

If `editingId` exists:

- it sends `PUT /packages/:id`

If `editingId` is empty:

- it sends `POST /packages`

Then it reloads the dashboard.

#### `handleEdit(pkg)`

Loads a package into the form so the admin can edit it.

It also scrolls to the form.

#### `handleDelete(id)`

Deletes a package with `DELETE /packages/:id`

#### `handleLogout()`

Removes the stored user and goes back to `/`

### What the admin sees

The admin dashboard has several blocks:

1. A page title and logout button
2. An error alert if something failed
3. A driver assignment section
4. A registered drivers section
5. A shipment form

### Why this page matters

This page proves the admin features work.

It shows:

- full CRUD
- package assignment
- summary data
- role-based control

## `frontend/src/pages/DriverDashboard.jsx`

This is the driver's working page.

It is simpler than the admin page.

### Main jobs of this page

- fetch only the driver's packages
- create a package
- edit a package
- delete a package
- change package status
- log out

### Main state values

This page stores:

- `packages`
- `formData`
- `editingId`
- `error`
- `loadingId`

### Main helper functions

#### `buildPayload(formData)`

Creates the object the driver is allowed to send.

Notice this version does **not** include `ownerUsername`.

That matches the idea that drivers should not assign packages to other people.

#### `fetchPackages()`

Calls `GET /packages`

The server decides the driver only gets their own packages.

#### `handleSubmit()`

Creates or updates a package.

#### `handleEdit(pkg)`

Loads one package into the form for editing.

#### `handleUpdateStatus(id, status)`

This is a fast status-change action.

It sends only a new status using `PUT /packages/:id`.

Then it reloads the package list.

#### `handleDelete(id)`

Deletes one of the driver's own packages.

#### `handleLogout()`

Clears browser user data and goes back to login.

### What the driver sees

The driver page has:

1. Title and logout button
2. A shipment form
3. A table of packages assigned to that driver
4. A status dropdown on each row
5. Edit and delete buttons

### Why this page matters

This page proves role-based control.

The driver does not get:

- all packages
- admin summary view
- public driver list
- owner assignment controls

So the driver experience is smaller and more limited.

---

## Front end styling files

## `frontend/src/index.css`

This is the main global CSS file.

It:

- imports Tailwind
- sets the dark theme
- sets fonts
- makes the app take full height
- sets default text and background colors
- styles text selection

This file gives the whole app its base look.

## `frontend/src/App.css`

This file looks like leftover Vite starter CSS.

It contains styles like:

- `.counter`
- `.hero`
- `#next-steps`

These do not match the real app pages.

Also, this file is not imported into `frontend/src/App.jsx`.

So this file is likely old scaffold code and not part of the real working UI.

## `frontend/vite.config.js`

This file sets the frontend build tool configuration.

It uses:

- React plugin
- Tailwind Vite plugin

It is very small and simple.

## `frontend/eslint.config.js`

This file sets frontend lint rules.

It helps catch code mistakes.

It includes:

- base JavaScript lint rules
- React Hooks rules
- React Refresh/Vite rules

It ignores the `dist` folder.

---

## Back end explained

## What the back end does

The back end is the brain behind the app.

It:

- starts the server
- connects to MongoDB
- handles login and registration
- protects package routes
- creates and updates packages
- creates facilities
- creates routes
- creates handling events
- returns summary data

It is built with:

- Node.js
- Express
- Mongoose
- MongoDB

---

## Back end startup and routing

## `backend/server.js`

This is the main server file.

### What it does

1. loads environment variables
2. imports Express, Mongoose, and CORS
3. imports auth and package routes
4. creates the Express app
5. turns on `cors()`
6. turns on JSON body parsing
7. tries to connect to the database
8. mounts the routes
9. starts listening on port `5000`

### Database connection flow

This file uses `connectDatabase()`.

It tries these database addresses in order:

1. `process.env.MONGODB_URI`
2. `process.env.MONGODB_LOCAL_URI`
3. `mongodb://127.0.0.1:27017/packet-tracker`

That means the app tries a main database first, then a fallback.

### Routes it mounts

- `/api/packages`
- `/api/auth`

### Health check route

It also has:

- `GET /`

This returns:

- `"API Running"`

That is a quick way to see if the server is on.

---

## Route files

## `backend/routes/authRoutes.js`

This file is small.

It connects URL paths to auth controller functions.

Routes:

- `POST /register`
- `POST /login`

## `backend/routes/packageRoutes.js`

This file connects package URLs to package controller functions.

Before any route runs, it does:

- `router.use(requireCurrentUser)`

That means every package route is protected.

Routes:

- `POST /`
- `GET /`
- `GET /summary`
- `GET /:id`
- `PUT /:id`
- `DELETE /:id`

---

## Auth middleware

## `backend/middleware/requireCurrentUser.js`

This file checks whether the request is tied to a real user.

### What it reads from the request

It checks these headers:

- `x-user-id`
- `x-user-username`
- `x-user-role`

### What it does

1. read the headers
2. clean them with `normalizeString`
3. make sure all three exist
4. look up the user by id
5. make sure the username and role match the user on file
6. save the user to `req.currentUser`
7. call `next()`

If anything is wrong, it sends an error.

### Why this file matters

This is the gatekeeper for protected package actions.

But it also shows one of the system's weaknesses:

the browser is sending the identity data itself.

That is weaker than using signed tokens or secure server sessions.

---

## Auth controller

## `backend/controllers/authController.js`

This file handles:

- registration
- login

It can work in two modes:

1. MongoDB mode
2. local JSON fallback mode

### `register`

This function:

1. reads `username`, `password`, and `role`
2. cleans the username
3. makes sure username and password exist
4. turns any non-admin role into `driver`
5. checks whether Mongo is connected

If Mongo is connected:

- it looks for an existing user in Mongo
- if found, it rejects duplicate usernames
- if not found, it creates a new `User`

If Mongo is not connected:

- it creates the user in the local JSON store

### `login`

This function:

1. reads username and password
2. makes sure both exist
3. checks whether Mongo is connected

If Mongo is connected:

- it finds the user in Mongo
- it checks the password with the Mongoose user method

If Mongo is not connected:

- it finds the user in the local JSON file
- it checks the password hash with `bcrypt.compare`

If the password is correct, it returns:

- `message`
- `id`
- `username`
- `role`

The front end stores that result in the browser.

### Why this file matters

This file starts the user session and decides who the user is.

---

## Package controller

## `backend/controllers/packageController.js`

This is the most important back-end file.

It is the main business logic file.

This file does a lot of work.

## Big jobs in this file

- controls who can edit what
- validates package data
- finds package owners
- creates facility records
- creates route records
- creates handling event records
- builds summary data
- handles create, read, update, and delete

## Key constants

### `DRIVER_EDITABLE_FIELDS`

This list says what drivers are allowed to edit.

Fields include:

- packageId
- description
- amount
- weight
- deliveryType
- truckId
- pickupLocation
- dropoffLocation
- status

### `ADMIN_EDITABLE_FIELDS`

This includes all driver fields plus:

- `ownerUsername`

That means admins can assign packages to a driver by username.

## Helper functions in simple language

### `normalizeNumber(value)`

Turns a value into a number if possible.

If the value is blank, it returns `undefined`.

If the value is not a real number, it returns `NaN`.

### `pickAllowedFields(source, allowedFields)`

Builds a new object using only approved fields.

This helps stop users from changing fields they should not touch.

### `resolveOwner(requestedOwnerUsername, fallbackUser)`

Finds the driver who should own the package.

If the username does not match a real driver, it throws an error.

### `requireField(value, label)`

Throws an error if a required field is missing.

### `buildTransitFacilityName(truckId)`

Builds a name like:

- `Truck 254`

This is used when a package is currently in transit.

### `determineFacilityType(name, deliveryType, stopKind)`

This guesses the facility type based on words in the name and on the delivery type.

Possible types:

- warehouse
- distributionCenter
- retailStore
- customerAddress
- inTransit

### `ensureFacility(...)`

Looks for a facility by normalized name.

If it exists, reuse it.

If it does not exist, create it.

This keeps facility names consistent.

### `ensureRoute(startFacility, endFacility)`

Looks for a route between two facilities.

If not found, creates one.

### `mapStatusToEventType(status)`

Turns package status into a handling event type.

Examples:

- `pending` -> `received`
- `picked_up` -> `loaded`
- `in_transit` -> `inTransit`
- delivered-like end states -> `unloaded`

### `buildTrackingContext(pkg)`

This is one of the most important functions.

It figures out:

- pickup facility
- dropoff facility
- current facility
- route

It also decides which facility should count as the package's current location based on package status.

Examples:

- if status is `in_transit`, current facility becomes a fake truck facility
- if status is `delivered`, current facility becomes the dropoff facility
- otherwise current facility may stay at pickup

### `recordHandlingEvent(pkg, trackingContext, currentUser, previousPackage)`

This writes a tracking history record.

It connects:

- package
- facility
- route
- user
- event type
- status snapshot

This is the file's history-writing engine.

### `buildPackagePayload(body, currentUser, existingPackage)`

This is another very important function.

It:

- decides which fields are allowed
- normalizes text
- normalizes numbers
- decides who owns the package
- sets defaults for drivers
- checks required fields on create
- throws errors for bad data

This is the main input-cleaning function.

### `canAccessPackage(pkg, currentUser)`

Returns true if:

- the user is admin
- or the package owner matches the current user

### `handlePackageError(res, action, error)`

Creates a consistent error response for package actions.

### `getUserCount()`

Counts users from Mongo or from the local JSON store.

### `getDriverDirectory()`

Builds a list of driver accounts.

This is used in the admin summary response.

## Main exported controller actions

### `createPackage`

This function:

1. builds the package payload
2. creates a new `Package`
3. builds tracking context
4. attaches route and current facility
5. saves the package
6. writes a handling event
7. saves the event id back to the package
8. returns the package

This means creating one package can also create:

- facilities
- a route
- a handling event

### `getAllPackages`

If the current user is admin:

- return every package

If the current user is driver:

- return only packages owned by that driver

This is the main role-based list behavior.

### `getDataModelSummary`

This is the admin summary endpoint.

It builds a report that includes:

- user count
- package count
- facility count
- route count
- handling event count
- driver directory
- recent handling events
- a many-to-many explanation

This is what helps the admin dashboard show project-level information.

### `getPackageById`

This:

- checks id format
- finds the package
- checks access rights
- returns the package

### `updatePackage`

This:

1. checks id format
2. loads the package
3. checks access rights
4. saves the old package state
5. builds the updated payload
6. applies changes
7. rebuilds route and facility data
8. saves the package
9. records a new handling event
10. updates the last handling event id
11. returns the updated package

This is very important because status changes also update tracking history.

### `deletePackage`

This:

1. checks id format
2. finds the package
3. checks access rights
4. deletes all handling events tied to that package
5. deletes the package
6. returns a success message

This keeps old handling events from being left behind after a package is deleted.

---

## Data models explained

## `backend/models/User.js`

This model stores users.

Fields:

- `username`
- `password`
- `role`

### Important features

- username must be unique
- password is hashed before save
- role must be `admin` or `driver`
- includes a password compare method

This is the core identity model.

## `backend/models/Package.js`

This model stores package records.

Fields include:

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

This is the main business record in the app.

## `backend/models/Facility.js`

This model stores locations.

Fields:

- `name`
- `normalizedName`
- `location`

The `location` field must be one of:

- warehouse
- distributionCenter
- retailStore
- customerAddress
- inTransit

This model helps the app turn free-text places into cleaner location records.

## `backend/models/Route.js`

This model stores the path from one facility to another.

Fields:

- `startFacility`
- `endFacility`

It also has a unique index on the pair.

That helps stop exact duplicate routes.

## `backend/models/HandlingEvent.js`

This model stores tracking history.

Fields:

- `package`
- `facility`
- `user`
- `route`
- `eventType`
- `statusSnapshot`

This model is very important because it connects many parts of the system together.

It acts like the bridge between packages and facilities.

This is what supports the many-to-many relationship idea in the project.

---

## Utility files

## `backend/utils/localUserStore.js`

This file is the fallback user storage system.

If MongoDB is not connected, this file can save and read users from:

- `backend/data/users.json`

### What it does

- makes sure the data folder exists
- makes sure the JSON file exists
- reads users
- writes users
- finds users by username
- finds users by id
- creates new users

### Why this exists

It gives the app a backup plan for login and registration.

But it is only a partial backup plan.

The package system still depends on MongoDB models.

## `backend/utils/userDirectory.js`

This file is a user lookup helper.

It hides whether the app is using:

- MongoDB users
- local JSON users

### What it does

- checks if Mongo is connected
- normalizes strings
- serializes Mongo users
- serializes local users
- finds users by id
- finds users by username

This keeps the rest of the back end from needing to know exactly where the user was stored.

## `backend/test_db.js`

This is a simple database test script.

It:

- loads the environment
- prints the MongoDB URI
- tries to connect
- exits with success or failure

This is mainly a debug helper.

But printing the URI is dangerous because it can expose secrets.

---

## How data moves through the app

## Login flow

1. User types username and password on the login page.
2. `Login.jsx` sends `POST /api/auth/login`.
3. `authController.login` checks the user.
4. The server returns id, username, and role.
5. The browser saves that object in `localStorage`.
6. Future requests use that data in custom headers.

## Protected request flow

1. A page calls the API using `api.js`.
2. `api.js` adds the user headers.
3. The back end receives the request.
4. `requireCurrentUser.js` checks the headers.
5. It finds the real user record.
6. If the data matches, it sets `req.currentUser`.
7. The route controller runs.

## Package creation flow

1. User fills the form.
2. Front end sends package data.
3. Back end cleans the input.
4. Back end decides the owner.
5. Back end makes or reuses facilities.
6. Back end makes or reuses the route.
7. Back end saves the package.
8. Back end writes a handling event.
9. Back end returns the new package.
10. Front end reloads data.

## Package update flow

1. User edits a package or changes status.
2. Front end sends `PUT /packages/:id`.
3. Back end checks access.
4. Back end updates allowed fields only.
5. Back end rebuilds tracking context.
6. Back end saves the package.
7. Back end writes a new handling event.
8. Front end reloads the package list.

## Package delete flow

1. User clicks delete.
2. Front end sends `DELETE /packages/:id`.
3. Back end checks access.
4. Back end deletes related handling events.
5. Back end deletes the package.
6. Front end reloads data.

---

## The data model in simple words

The project uses five main entities:

1. User
2. Package
3. Facility
4. Route
5. HandlingEvent

## What each entity means

### User

A person using the app.

The person is either:

- admin
- driver

### Package

The thing being tracked.

It stores:

- what the package is
- where it starts
- where it is going
- what truck it uses
- who owns it
- its current status

### Facility

A place that touches the package.

Examples:

- warehouse
- distribution center
- store
- customer address
- in-transit truck location

### Route

The path from one facility to another.

### HandlingEvent

A history entry that says:

- what package
- what facility
- what route
- what user
- what event type
- what status at that moment

## The many-to-many relationship

This is one of the key class project ideas.

### The simple version

- one package can go through many facilities
- one facility can handle many packages

That is many-to-many.

### How this project solves it

The app uses `HandlingEvent` as the bridge table/bridge collection.

Each handling event connects:

- one package
- one facility

But many handling events together let:

- one package connect to many facilities over time
- one facility connect to many packages over time

That is why `HandlingEvent` is such an important part of the design.

---

## What the presentation materials are saying

## About `Group 22 Presentation.pdf`

Based on `PRESENTATION_SCRIPTS.md`, the presentation appears to be organized like this:

1. Title slide
2. Introduction
3. Distribution of work
4. Technical description overview
5. Routing
6. Collections
7. Components
8. Entities
9. Many-to-many relationship
10. Live demo

## Slide-by-slide explanation in simple words

### Slide 1: Title

This slide introduces the group and the project name.

Main point:

"We made Packet Tracker, a MERN-stack package tracking app."

### Slide 2: Introduction

This explains:

- who is in the group
- why the group chose this project
- what problem the app is solving

Main message:

Many tracking systems are messy, so this project tries to make package tracking simple and smooth.

### Slide 3: Distribution of work

This slide explains team roles.

Based on `PRESENTATION_SCRIPTS.md`:

- Guiscard worked on React integration
- Liliana worked on styling and planning
- Avery worked on styling and planning
- Ashton worked on React integration and component/page work
- Eduardo built the backend

This slide matters because it shows clear team contribution.

### Slide 4: Technical overview

This slide likely introduces the technical questions being answered.

Main message:

"Here is how the system is built."

### Slide 5: Routing

This slide explains the server routes.

The code supports this clearly:

- `/api/auth`
- `/api/packages`

This matches:

- `backend/routes/authRoutes.js`
- `backend/routes/packageRoutes.js`

Good simple way to explain it during presentation:

"The auth route handles login and registration. The package route handles package actions and summary data."

### Slide 6: Collections

This slide explains the database collections.

The real models are:

- `User`
- `Package`
- `Facility`
- `Route`
- `HandlingEvent`

These match the class project requirement for multiple entities.

### Slide 7: Components

This slide is about the front end.

A simple version to say is:

"The app uses page components and reusable UI components."

Real page components:

- `Login.jsx`
- `Register.jsx`
- `AdminDashboard.jsx`
- `DriverDashboard.jsx`

Real reusable UI file:

- `frontend/src/components/ui.jsx`

### Slide 8: Entities

This slide explains the five main data entities.

It should match the model explanations in this file.

### Slide 9: Many-to-many relationship

This slide explains:

- package to facility is many-to-many
- `HandlingEvent` is the bridge

This is one of the strongest database design parts of the project.

### Slide 10: Live demo

This is where the team proves the app works.

The demo path from `PRESENTATION_SCRIPTS.md` is:

1. show login
2. show register
3. log in as admin
4. create/update/delete package
5. log out
6. log in as driver
7. show driver only sees own packages
8. update status
9. explain role control

This is a good demo because it proves:

- login works
- role-based pages work
- admin CRUD works
- driver restrictions work
- tracking updates work

---

## About `TermProject.pdf`

I could not directly extract clean text from this PDF in this terminal.

But based on:

- `README.md`
- the code
- the presentation scripts

it appears this PDF is likely the class project description or requirement sheet.

So here is the most useful presentation-ready version:

## How the code seems to match the project requirements

### Requirement: Use the MERN stack

Match:

- MongoDB
- Express
- React
- Node.js

### Requirement: Login first

Match:

- `frontend/src/App.jsx` sends `/` to `Login`

### Requirement: Multiple user types

Match:

- `admin`
- `driver`

### Requirement: Correct screens for correct users

Match:

- route guards in `frontend/src/App.jsx`
- role checks in the back end

### Requirement: Admin has bigger control

Match:

- admin can create, read, update, delete, and assign

### Requirement: Standard user only controls their own data

Match:

- drivers only see their own packages in `getAllPackages`
- drivers can only change packages they own in `canAccessPackage`

### Requirement: At least five entities

Match:

- `User`
- `Package`
- `Facility`
- `Route`
- `HandlingEvent`

### Requirement: At least one many-to-many relationship

Match:

- Packages and Facilities through `HandlingEvent`

### Requirement: Use a real database structure

Match:

- Mongoose models
- route references
- facility references
- handling event references

---

## Easy speaking notes for the team

Here is a very simple way to explain the app out loud.

## Super short version

"Packet Tracker is a MERN-stack web app that lets admins and drivers manage and track packages. The React front end shows the pages and forms. The Express and MongoDB back end stores users, packages, facilities, routes, and handling events. Admins can manage all packages. Drivers can only manage their own. We also use HandlingEvent to track package history and to model the many-to-many relationship between packages and facilities."

## Front end talking points

- The front end is built with React and Vite.
- React Router controls which page the user sees.
- Login and register are public pages.
- Admin and driver dashboards are role-based pages.
- Shared UI components keep the design consistent.
- Axios sends requests to the back end.
- The browser stores the user session in localStorage.

## Back end talking points

- The back end is built with Express and Mongoose.
- It has auth routes and package routes.
- Middleware checks the current user for protected requests.
- The package controller handles the main app logic.
- MongoDB stores the main project data.
- Handling events create package history.

## Database talking points

- There are five entities.
- Packages and facilities are many-to-many.
- HandlingEvent acts like the bridge between them.
- Route stores the path between the start and end facilities.

## Demo talking points

- Show login first.
- Register a user if needed.
- Log in as admin and create a package.
- Show assignment to a driver.
- Log in as driver and show role-limited access.
- Change status and show that the system updates correctly.

---

## Important weaknesses to understand before presenting

This section is useful if the professor asks hard questions.

## Weakness 1: Public admin registration

Right now the register page lets anyone choose admin.

That is not safe for a real app.

## Weakness 2: Header-based authentication

The app trusts identity data sent from the browser in custom headers.

That is weaker than secure token-based authentication.

## Weakness 3: Partial offline fallback

The app has a fallback user system with local JSON files.

But package creation and update still depend heavily on Mongo-backed behavior.

So the fallback is not a full replacement.

## Weakness 4: Hardcoded API address

The frontend is hardcoded to `http://localhost:5000/api`.

That is okay for local demos, but not ideal for deployment.

## Weakness 5: No automated tests

The project mostly depends on manual testing.

That means bugs are easier to miss.

---

## Final summary

This project is a full-stack package tracker with:

- a React front end
- an Express back end
- MongoDB data storage
- role-based behavior for admins and drivers
- package CRUD features
- tracking history through handling events
- a many-to-many relationship between packages and facilities

The strongest parts of the project are:

- clear role split
- good real-world entity model
- meaningful tracking history
- clean separation between front end and back end

The most important files to understand are:

- `frontend/src/App.jsx`
- `frontend/src/pages/AdminDashboard.jsx`
- `frontend/src/pages/DriverDashboard.jsx`
- `frontend/src/lib/api.js`
- `backend/server.js`
- `backend/controllers/authController.js`
- `backend/controllers/packageController.js`
- `backend/middleware/requireCurrentUser.js`
- `backend/models/Package.js`
- `backend/models/HandlingEvent.js`

If someone on the team understands those files well, they understand most of the system.
