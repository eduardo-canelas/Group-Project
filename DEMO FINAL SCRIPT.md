# DEMO FINAL SCRIPT

## Purpose

This file is your full demo study guide for `Packet Tracker`.

It does 4 jobs:

1. It shows the exact order to run the demo.
2. It explains what the audience sees.
3. It explains what the code is doing behind the scenes.
4. It gives you short memory notes you can quickly review right before presenting.

This was based on a live run I tested on **April 15, 2026 at 11:14 AM EDT** against:

- Frontend: `http://localhost:5173/`
- Backend API: `http://localhost:5000/api`

Test accounts used:

- Admin: `Eduardo` / `canelas`
- Driver: `Manuela` / `fonseca`

---

## Final Test Result

### What worked

- Admin login worked.
- Driver login worked.
- Admin dashboard loaded.
- Driver dashboard loaded.
- Admin could see all packages.
- Driver could only see packages assigned to Manuela.
- Admin could create a new package for Manuela.
- Driver could change package status from the dashboard.
- Driver-owned package creation worked through the same backend route the UI uses.
- Driver-owned package update worked through the same backend route the UI uses.
- Driver-owned package delete worked through the same backend route the UI uses.
- Role protection worked.
- Ownership protection worked.
- Admin summary endpoint worked.

### One small behavior note

When I tested delete, the delete request returned success right away, but one follow-up list call still showed the record for a moment. After a short recheck, the package was gone and the summary counts were corrected. So the end result was correct, but there was a brief refresh delay.

That is worth mentioning only if someone asks a deep technical question.

---

## Live Demo Run I Performed

### Starting state

Before creating anything new, the admin dashboard showed:

- 2 drivers with active trucks on the roster
- 5 registered driver accounts
- 2 existing packages in the shipment table

The visible existing packages were:

- `0002` for `Izzy`
- `0001` for `Manuela`

### New admin demo package I created

I created this package as admin:

- Driver username: `Manuela`
- Package ID: `DEMO-0415`
- Item name: `Demo laptop kit`
- Quantity: `12`
- Truck ID: `T-99`
- Pickup location: `Main Warehouse`
- Drop off location: `Downtown Store`
- Delivery type: `transfer`
- Status at creation: `pending`

After that, the admin shipment board showed the new package.

### Driver-side result

After logging in as Manuela, the driver dashboard showed only Manuela’s packages.

It showed:

- `DEMO-0415`
- `0001`

It did **not** show Izzy’s package `0002`.

That confirms the driver filter is working.

### Driver status update I tested

From the driver dashboard, I changed:

- `DEMO-0415`
- from `Pending`
- to `In Transit`

The driver table updated correctly.

### Extra ownership/security tests I ran

I also tested backend actions using the same authenticated headers the frontend sends.

I confirmed:

- A driver can create a package owned by that same driver.
- A driver can update that owned package.
- A driver can delete that owned package.
- A driver cannot update Izzy’s package.

The unauthorized driver update returned:

`"You can only update your own package records"`

That is important because it proves the app is not only hiding data in the UI. The server is enforcing the rule too.

---

## The Demo Script You Can Say

## Step 1. Open the app

### What you say

"This is Packet Tracker. The first screen is the login page

### What the audience sees

- A centered login card
- Username field
- Password field
- Enter Workspace button
- Register link

### What happens behind the scenes

The page component is `frontend/src/pages/Login.jsx`.

When you type in the form and press **Enter Workspace**, the `handleLogin` function runs.

That function sends a POST request to:

- `POST /api/auth/login`

It uses the shared Axios client from:

- `frontend/src/lib/api.js`

If login succeeds, the response is saved in browser `localStorage` under the key:

- `user`

Then React redirects based on role:

- admin -> `/admin`
- driver -> `/driver`

The route protection logic lives in:

- `frontend/src/App.jsx`

The two important route helpers are:

- `PublicOnly`
- `RequireRole`

`PublicOnly` stops logged-in users from seeing login/register again.

`RequireRole` blocks the wrong dashboard and sends the user to the correct one.

---

## Step 2. Log in as admin

### What you say

"I’m logging in as an admin first. Admins can see everything in the system and manage all package records."

### Credentials

- Username: `Eduardo`
- Password: `canelas`

### What happens behind the scenes

The login request goes to:

- `backend/routes/authRoutes.js`

That route calls:

- `login` in `backend/controllers/authController.js`

The login controller:

1. Cleans the username and password.
2. Makes sure both fields exist.
3. Looks up the user.
4. Checks the password with bcrypt.
5. Returns:
   - `id`
   - `username`
   - `role`

The response I got in the live test was:

- role: `admin`
- username: `Eduardo`

After that, the browser saved the user object.

Then every future API request automatically got these custom headers from the Axios interceptor in `frontend/src/lib/api.js`:

- `x-user-id`
- `x-user-username`
- `x-user-role`

These headers are how the backend knows who is making the request.

---

## Step 3. Show the admin dashboard

### What you say

"Now we are on the admin dashboard. The admin can see every package, all assigned drivers, and can create, update, or remove package records."

### What the audience sees

The admin page has 4 main areas:

1. Header with **Admin Dashboard** and **Log out**
2. Driver assignment roster
3. Registered driver list
4. Shipment form and shipment table

### What loaded in my live test

The admin page showed:

- 2 active driver roster cards
- 5 registered driver usernames
- 2 original shipments

After my demo creation, it showed:

- 3 shipments total

### What happens behind the scenes

The page component is:

- `frontend/src/pages/AdminDashboard.jsx`

When the page opens, `useEffect` runs `loadDashboardData()`.

That function loads two API calls in parallel:

- `GET /api/packages`
- `GET /api/packages/summary`

Those calls go to the backend controller in:

- `backend/controllers/packageController.js`

The functions being called are:

- `getAllPackages`
- `getDataModelSummary`

For admin users, `getAllPackages` uses this query:

- `{}` (all packages)

That means admins get the full list.

`getDataModelSummary` builds extra teaching data:

- total users
- total packages
- total facilities
- total routes
- total handling events
- driver directory
- recent handling events

That is why the admin page can show more than just raw package rows.

---

## Step 4. Create a new package as admin

### What you say

"Now I’ll create a new package and assign it to Manuela. This shows that admins can create records and choose which driver owns them."

### The exact values I used

- Driver username: `Manuela`
- Package ID: `DEMO-0415`
- Item name: `Demo laptop kit`
- Quantity: `12`
- Truck ID: `T-99`
- Pickup location: `Main Warehouse`
- Drop off location: `Downtown Store`
- Delivery type: `transfer`
- Status: `pending`

### What the audience should notice

After refresh, the new row appeared in the shipment board with:

- package ID `DEMO-0415`
- owner `Manuela`
- truck `T-99`
- route `Main Warehouse` to `Downtown Store`
- status `Pending`

### What happens behind the scenes

The admin page builds a payload with `buildPayload()` in `AdminDashboard.jsx`.

Then it sends:

- `POST /api/packages`

The backend route is protected by:

- `requireCurrentUser` in `backend/middleware/requireCurrentUser.js`

That middleware:

1. Reads the custom headers.
2. Looks up the user record.
3. Verifies the ID, username, and role all match.
4. Attaches `req.currentUser`.

Then the controller function `createPackage` runs.

Inside `createPackage`, these important helpers run:

- `buildPackagePayload`
- `buildTrackingContext`
- `recordHandlingEvent`

### What each helper does

#### `buildPackagePayload`

This decides what fields are allowed based on role.

For admins, allowed fields include:

- package ID
- description
- amount
- delivery type
- truck ID
- pickup location
- dropoff location
- status
- owner username

Admins are allowed to assign the package to a driver.

#### `resolveOwner`

Because the admin entered `Manuela`, the backend runs `resolveOwner`.

That function:

1. Cleans the username.
2. Looks up the user.
3. Makes sure that user exists.
4. Makes sure the user role is `driver`.

If the admin typed a username that was not a real driver, creation would fail.

#### `buildTrackingContext`

This is a very important learning point.

The app does not just save a simple package row.
It also creates tracking relationships.

`buildTrackingContext`:

1. Creates or finds the pickup facility
2. Creates or finds the dropoff facility
3. Creates or finds the route between them
4. Chooses the current facility based on status

Because the status started as `pending`, the current facility stayed at the origin side.

#### `recordHandlingEvent`

After the package saves, the backend also writes a handling event.

That event stores:

- which package
- which facility
- which route
- which user triggered the action
- what type of event happened
- what status the package had at that time

That is how the app models the many-to-many relationship:

- one package can go through many facilities
- one facility can handle many packages

The join table is:

- `HandlingEvent`

So the package system is not just CRUD. It is also building tracking history.

---

## Step 5. Explain why the new package matters

### What you say

"This new record is useful because it becomes the bridge between the admin side and the driver side. I created it as an admin, assigned it to Manuela, and now we can prove the driver only sees records that belong to that driver."

### Why this is a strong demo point

It proves:

- create works
- role-based ownership works
- assignment works
- the same package can be seen differently based on user role

---

## Step 6. Log out and switch to driver

### What you say

"Now I’ll log out and log in as a driver so you can see the restricted dashboard."

### Credentials

- Username: `Manuela`
- Password: `fonseca`

### What happens behind the scenes

The logout button calls:

- `clearStoredUser()` from `frontend/src/lib/auth.js`

That removes the `user` object from `localStorage`.

After that, React sends the app back to `/`.

Then you log in again, but this time the response role is:

- `driver`

So React redirects to:

- `/driver`

---

## Step 7. Show the driver dashboard

### What you say

"Now we are on the driver dashboard. This page is more limited. Drivers only work with packages assigned to them."

### What the audience sees

The driver page has:

1. Driver header and logout
2. A smaller shipment form
3. A shipment table with status dropdowns
4. Edit and delete buttons

### What I saw in the live test

Manuela’s dashboard showed:

- `DEMO-0415`
- `0001`

It did **not** show:

- Izzy’s package `0002`

That is one of the best proof points in the demo.

### What happens behind the scenes

The page component is:

- `frontend/src/pages/DriverDashboard.jsx`

When it loads, it sends:

- `GET /api/packages`

But the backend does **not** return everything.

Inside `getAllPackages` in `packageController.js`, the query changes based on role.

For drivers, the query is:

- `{ ownerUserId: req.currentUser.id }`

That means the driver only gets package rows where the owner matches the logged-in driver.

So the filtering is happening on the server, not only on the screen.

---

## Step 8. Change package status as driver

### What you say

"Now I’ll update the package status from the driver dashboard. This shows that the driver can work only with their own assigned shipments."

### The live action I tested

I changed:

- `DEMO-0415`
- from `Pending`
- to `In Transit`

The driver table updated correctly.

### What happens behind the scenes

The status dropdown is inside each row of `DriverDashboard.jsx`.

When the dropdown changes, it calls:

- `handleUpdateStatus(id, status)`

That sends:

- `PUT /api/packages/:id`

with a small payload like:

- `{ "status": "in_transit" }`

Then the backend:

1. Finds the package
2. Verifies the package exists
3. Runs `canAccessPackage`
4. Builds the allowed update payload
5. Rebuilds tracking context
6. Saves the package
7. Records another handling event

### Why current facility changes

When the status becomes `in_transit`, `buildTrackingContext` moves the package’s current facility to a truck-style in-transit facility, built from the truck ID.

That is why the model tracks movement, not just a word in a status column.

---

## Step 9. Driver create, edit, and delete behavior

### What I tested

I also tested deeper driver actions using the same backend routes the UI uses.

#### Driver create test

I created:

- `DRV-0415`
- description: `Driver self-created box`
- amount: `3`
- truck: `T-42B`
- pickup: `Assigned truck`
- dropoff: `Campus Mailroom`
- status: `pending`

That package appeared on the driver dashboard after refresh.

#### Driver edit test

I updated that same package to:

- description: `Driver self-created box updated`
- status: `picked_up`

The update route accepted the change.

#### Driver delete test

I deleted that same package.

The delete request returned success right away.
One immediate follow-up list still showed the record for a moment, but after a short recheck the package disappeared from both:

- the driver package list
- the admin summary counts

So the delete worked, but there was a brief refresh delay.

---

## Step 10. Show the security rule

### What you say

"The important part is that the driver is not just seeing a smaller page. The backend is enforcing ownership rules too."

### What I tested

I tried to update Izzy’s package while authenticated as Manuela.

The server responded:

- `"You can only update your own package records"`

### What function blocks it

This is controlled by:

- `canAccessPackage(pkg, currentUser)`

That helper returns true only if:

- the user is admin
- or the package owner matches the current user ID

That means:

- admins can access all records
- drivers can access only their own records

This is one of the strongest backend logic points in the app.

---

## Key Code Paths to Memorize

## Frontend

### `frontend/src/App.jsx`

Memorize this as:

"React Router plus role guards."

Main ideas:

- `/` -> Login
- `/register` -> Register
- `/admin` -> Admin dashboard
- `/driver` -> Driver dashboard
- `PublicOnly` protects public pages
- `RequireRole` protects private pages

### `frontend/src/lib/api.js`

Memorize this as:

"The shared API client that attaches user headers."

Main ideas:

- Base URL is `http://localhost:5000/api`
- Reads stored user
- Adds `x-user-id`, `x-user-username`, `x-user-role`

### `frontend/src/lib/auth.js`

Memorize this as:

"Local storage helper."

Main ideas:

- `getStoredUser()`
- `clearStoredUser()`

### `frontend/src/pages/Login.jsx`

Memorize this as:

"Send login, save user, redirect by role."

### `frontend/src/pages/AdminDashboard.jsx`

Memorize this as:

"Admin sees everything and manages assignments."

Main ideas:

- loads packages
- loads summary
- creates packages
- edits packages
- removes packages

### `frontend/src/pages/DriverDashboard.jsx`

Memorize this as:

"Driver sees only own shipments and can update status."

Main ideas:

- loads own packages
- can create own package
- can update own status
- can edit and delete own records

---

## Backend

### `backend/routes/authRoutes.js`

Memorize this as:

"Register and login routes."

Routes:

- `POST /api/auth/register`
- `POST /api/auth/login`

### `backend/controllers/authController.js`

Memorize this as:

"Validate credentials and return role-based session data."

Important functions:

- `register`
- `login`

### `backend/middleware/requireCurrentUser.js`

Memorize this as:

"Check the custom user headers and attach `req.currentUser`."

This is the gatekeeper for package routes.

### `backend/routes/packageRoutes.js`

Memorize this as:

"All package routes are protected."

Routes:

- `POST /api/packages`
- `GET /api/packages`
- `GET /api/packages/summary`
- `GET /api/packages/:id`
- `PUT /api/packages/:id`
- `DELETE /api/packages/:id`

### `backend/controllers/packageController.js`

Memorize this as:

"The main business logic file."

Most important helpers:

- `buildPackagePayload`
- `resolveOwner`
- `buildTrackingContext`
- `recordHandlingEvent`
- `canAccessPackage`
- `getAllPackages`
- `getDataModelSummary`
- `createPackage`
- `updatePackage`
- `deletePackage`

---

## What Each Important Function Really Means

## `buildPackagePayload`

Easy way to remember it:

"Only keep the fields this role is allowed to change."

Admin can send:

- owner username
- package info
- route info
- status

Driver can send:

- package info
- route info
- status

But driver cannot pick a different owner username.

The backend forces the driver-owned package to belong to the current driver.

## `resolveOwner`

Easy way to remember it:

"Turn the typed driver username into a real driver account."

If the driver does not exist, the package is rejected.

## `buildTrackingContext`

Easy way to remember it:

"Build the travel map."

It finds or creates:

- pickup facility
- dropoff facility
- route
- current facility

## `recordHandlingEvent`

Easy way to remember it:

"Write the history entry."

This is what gives the app event tracking instead of only one latest status.

## `canAccessPackage`

Easy way to remember it:

"Can this user touch this record?"

Rules:

- admin = yes
- owner driver = yes
- everybody else = no

---

## Quick Memory Sheet

If you only have 30 seconds before presenting, remember this:

- Login first
- Admin sees all packages
- Driver sees only own packages
- Frontend stores the user in `localStorage`
- API client sends custom user headers
- Middleware checks those headers
- Package routes are protected
- Admin can assign a package to a driver
- Driver status changes create tracking history
- Ownership is enforced on the backend, not just hidden in the UI
- `HandlingEvent` is the many-to-many join model

---

## Super Short Speaking Version

If you want a fast version to memorize, say this:

"Packet Tracker starts on the login page. After login, React routes the user based on role. Admins go to the admin dashboard and can see every package, assign drivers, and do full CRUD. Drivers go to the driver dashboard and only see their own shipments. The frontend stores the logged-in user in localStorage, and every API request sends custom user headers. The backend middleware verifies those headers, then packageController enforces role and ownership rules. When a package is created or updated, the app also creates tracking context and handling events, so the system stores package history, not just the latest status."

---

## Best Demo Order

Use this order during presentation:

1. Show login page
2. Log in as admin
3. Point out driver roster and shipment table
4. Create `DEMO-0415` for Manuela
5. Refresh and show the new row
6. Log out
7. Log in as Manuela
8. Show that only Manuela’s packages appear
9. Change `DEMO-0415` from Pending to In Transit
10. Say that the backend also records tracking history and blocks drivers from touching other drivers’ packages

---

## Best Professor Question Answers

### Question: "How does the app know where to send the user after login?"

Answer:

"After login, the frontend saves the returned user object in localStorage. Then `App.jsx` checks the user role with `RequireRole` and sends admins to `/admin` and drivers to `/driver`."

### Question: "How do you stop a driver from editing someone else’s package?"

Answer:

"The backend checks ownership with `canAccessPackage`. Even if a driver tried to send a manual request, the server would reject it unless the package owner matched the current logged-in user."

### Question: "How do you model package history?"

Answer:

"We use a `HandlingEvent` collection. Every create or update can write a new handling event that connects the package, the route, the facility, and the user who performed the action."

### Question: "What is the many-to-many relationship?"

Answer:

"Packages and facilities are many-to-many. A package can move through many facilities, and a facility can handle many packages. `HandlingEvent` is the join record between them."

### Question: "What is the most important backend file?"

Answer:

"`backend/controllers/packageController.js`, because that is where role-based access, ownership checks, package creation, tracking context, and handling event logic all come together."

---

## Honest Technical Notes

These are not problems you need to lead with during the demo, but they are useful for learning:

- The browser UI path for login, admin dashboard, driver dashboard, and inline driver status update worked live.
- The backend API path for admin create worked live.
- The backend API path for driver create, update, and delete worked live.
- The ownership protection check worked live.
- The delete flow had a short delay before follow-up list and summary calls reflected the final state.

That means the main system behavior is working, but some summary/list refreshes may lag for a moment after writes.

---

## Final One-Line Summary

Packet Tracker is a role-based MERN app where admins manage all shipments, drivers work only with their own shipments, and the backend enforces ownership while also building route, facility, and handling-event tracking behind every important package action.
