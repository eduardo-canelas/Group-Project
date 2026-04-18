# THE FINAL SCRIPT

## 5-Minute Packet Tracker Demo

This is the final spoken script for the live demo.

It is written so you can read it naturally at a slightly slow pace.

The goal is to cover:

- what the app does
- what the user sees
- what the backend is doing
- how roles work
- how the many-to-many relationship works
- why the current frontend looks the way it does
- how the data model proves the project is real

---

## Full Script

Hi everyone, I’m Eduardo, and I’ll be walking you through our project, **Packet Tracker**.

Packet Tracker is a full-stack MERN application for package management and delivery tracking.

The basic idea is simple:

- admins manage all package records
- drivers only manage packages assigned to them

What makes this more than a simple list app is that it also includes:

- authentication
- role-based routing
- protected backend routes
- ownership rules
- package tracking history
- and a many-to-many relationship in the database

So while I’m showing the screens, I’ll also explain what is happening behind the scenes.

---

The first screen we see is the **login page**.

That is important because the app starts with authentication instead of going directly into package data.

On this screen, the user can enter a username and password, and if needed, they can also go to the register page.

Behind the scenes, this page is handled by the React component `Login.jsx`.

When the user clicks **Enter Workspace**, the frontend sends a request to:

- `POST /api/auth/login`

On the backend, that request goes through `authRoutes.js` and into `authController.js`.

The server:

1. checks that the username and password were entered
2. finds the user
3. compares the password with bcrypt
4. returns the user ID, username, and role

Then the browser stores that returned user object in `localStorage`.

After that, React Router checks the role and sends the user to the correct page:

- admin goes to `/admin`
- driver goes to `/driver`

So the first thing the app does is identify the user and decide what parts of the system they are allowed to access.

---

Now I’ll log in as the **admin** user.

The admin account is:

- username: `Eduardo`
- password: `canelas`

Once I log in, I’m taken to the **Admin Dashboard**.

This is the full-control side of the app.

The admin can:

- see every package in the system
- assign packages to drivers
- create new packages
- edit packages
- delete packages

On this page, we can also see:

- a driver roster
- a list of registered drivers
- the shipment form
- and the shipment table

Behind the scenes, when this page loads, React makes two main API calls:

- `GET /api/packages`
- `GET /api/packages/summary`

The first one loads the package records.

The second one loads summary information like:

- total users
- total packages
- total facilities
- total routes
- total handling events
- and the driver directory

That is why the admin page shows more than just a table.

Also, after login, every request automatically includes three custom headers:

- `x-user-id`
- `x-user-username`
- `x-user-role`

Those are attached by the shared Axios client on the frontend.

Then the backend middleware checks those headers before allowing access to protected package routes.

So the system always knows exactly who is making the request.

---

Now I’ll create a new package as admin and assign it to a driver.

For this demo, I’m assigning the package to **Manuela**.

The example package is:

- package ID: `DEMO-0415`
- item: `Demo laptop kit`
- quantity: `12`
- truck ID: `T-99`
- pickup location: `Main Warehouse`
- dropoff location: `Downtown Store`
- delivery type: `transfer`
- status: `pending`

On the screen, this looks like a normal create form.

But behind the scenes, when I click create, the frontend sends:

- `POST /api/packages`

Then the backend does more than just save one row.

It:

1. validates the form data
2. checks that the assigned driver exists
3. creates or finds the pickup facility
4. creates or finds the dropoff facility
5. creates or finds the route between those facilities
6. saves the package
7. writes a handling event

So one thing I want to emphasize is this:

the user sees one package row,
but the backend is building a full tracking structure underneath it.

That includes package records, facilities, routes, and handling events.

That is where the project becomes much more than basic CRUD.

---

This is also the best place to explain our **many-to-many relationship**.

Our many-to-many relationship is between:

- **Packages**
- and **Facilities**

The simple explanation is:

- one package can move through many facilities over time
- and one facility can handle many different packages over time

That means the relationship is many-to-many.

The bridge between those two entities is:

- `HandlingEvent`

`HandlingEvent` is the join model.

It stores one interaction between a package and a facility, and it also stores extra details like:

- the route
- the user who handled it
- the event type
- and the status snapshot

A very simple real example is this:

Package `DEMO-0415` can start at **Main Warehouse**, then move onto **Truck T-99**, and later reach **Downtown Store**.

That is one package connected to multiple facilities over time.

At the same time, Main Warehouse can also handle many different packages, not just this one.

So that is why we needed a many-to-many relationship instead of just storing one fixed location forever.

One honest thing I would say here is:

our many-to-many relationship is implemented correctly in the backend and database, but it is not strongly visualized on the frontend yet.

Right now, the frontend mostly shows the **current package state**.

It does not yet show a full package history timeline or event-history panel.

So the many-to-many part is real and working, but it is easier to prove in MongoDB than in the current UI.

If I wanted to improve the UI later, the easiest improvement would be to add:

- a package history panel
- or a tracking timeline

That timeline could show:

- facility name
- facility type
- route
- event type
- status snapshot
- user
- timestamp

So the backend already creates the relationship data. The main missing piece is displaying that relationship more clearly in the frontend.

---

Now I’ll log out and switch to the **driver** side.

The driver account is:

- username: `Manuela`
- password: `fonseca`

After login, React sends this user to `/driver`.

Now we are on the **Driver Dashboard**.

This page is more limited than the admin page, because drivers have fewer responsibilities.

The driver can:

- see only assigned packages
- update status
- edit their own package records
- delete their own package records

The most important thing to notice here is what the driver **cannot** see.

When I log in as Manuela, I only see packages assigned to Manuela.

I do not see packages assigned to other drivers.

That proves that role-based access is not just a frontend trick.

Behind the scenes, the driver dashboard still calls:

- `GET /api/packages`

But on the backend, the query is different.

For admins, the query returns all packages.

For drivers, the backend filters by:

- `ownerUserId = current logged-in user`

So the data restriction is happening on the server, not only in the UI.

That is a strong security point in the project.

---

Now I’ll update the package status as the driver.

For example, I can change `DEMO-0415` from:

- `Pending`
- to `In Transit`

On the screen, that looks like a simple dropdown update.

But behind the scenes, the frontend sends:

- `PUT /api/packages/:id`

Then the backend:

1. finds the package
2. checks that the package exists
3. checks that the driver owns that package
4. updates the package
5. rebuilds the tracking context
6. writes another handling event

So the app is not just replacing one word in a row.

It is also recording the movement history.

That is what makes it a tracking system.

And this same idea also applies to exception statuses like:

- `lost`
- `returned`
- `cancelled`

If a package gets marked as lost, returned, or cancelled, the backend still:

- updates the package status
- rebuilds tracking context
- and writes another handling event

So those exception cases are still preserved in the package history.

You can think of those as end-state statuses.

The system still records them so the history stays complete.

---

Another important backend rule is **ownership protection**.

Even if a driver somehow knew another package ID, they still should not be allowed to update another driver’s record.

That rule is enforced by the backend helper:

- `canAccessPackage`

The logic is:

- admin can access everything
- driver can access only packages they own
- everyone else is denied

So the backend does not trust the frontend alone.

That is another reason this project is stronger than a basic demo app.

---

If I wanted to prove the many-to-many relationship more directly, the best place to show it would be in **MongoDB**.

I would explain the collections like this:

- `packages` stores the package record
- `facilities` stores each place, like warehouses, stores, or in-transit truck facilities
- `routes` stores the start and end facility connection
- `handlingevents` stores the join records between packages and facilities

And the strongest proof is the `handlingevents` collection, because each document connects:

- one package
- one facility
- one route
- one user
- one event type
- one status snapshot

So if the frontend only shows the latest package state, MongoDB shows the deeper structure underneath that state.

That is a good way to explain why the relationship is real, even if it is not yet shown as a full timeline in the UI.

---

So to close, Packet Tracker is a full MERN application with:

- authentication
- role-based dashboards
- protected backend routes
- admin and driver workflows
- ownership enforcement
- package tracking history
- and a real many-to-many relationship modeled through `HandlingEvent`

The core user story is:

- admin creates and assigns packages
- driver sees only assigned packages
- driver updates package status
- backend records the package journey

So even though the interface looks simple, the system behind it is doing real full-stack work across React, Express, MongoDB, routing, validation, and relationship modeling.

Thank you.

---

## 20-Second Emergency Backup

If you run short on time, say this:

"Packet Tracker is a MERN package-tracking app with two roles: admin and driver. Admins manage all package records, while drivers only see and update their own assigned shipments. The backend protects package routes, enforces ownership, and records package movement through `HandlingEvent`, which is also how we model the many-to-many relationship between packages and facilities."

---

## Final Memory Lines

- Login first
- Admin sees all packages
- Driver sees only own packages
- Backend checks headers on every protected request
- Admin creates `DEMO-0415` for Manuela
- Driver changes status to `In Transit`
- Many-to-many = packages and facilities
- Join model = `HandlingEvent`
- MongoDB shows the relationship more clearly than the current UI
