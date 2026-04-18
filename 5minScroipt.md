# 5 Minute Script

## Packet Tracker Demo Script

This version is made for a **slow speaking pace** and a **full 5-minute presentation**.

It is written so you can read it naturally without getting lost.

---

## Opening

Hi everyone, I’m Eduardo, and I’ll be walking you through our project, **Packet Tracker**.

Packet Tracker is a full-stack MERN application for managing and tracking package deliveries.

The main idea is simple:

- admins manage all packages
- drivers only manage the packages assigned to them

What makes this project stronger than a simple list app is that it also has:

- login
- role-based access
- protected routes
- package ownership rules
- tracking history
- a many-to-many relationship in the database

So during this demo, I’ll show both what the user sees on the screen and what is happening behind the scenes.

---

## Step 1. Login Page

The first thing we see is the login page.

That is important because our app starts with authentication instead of dropping the user directly into the system.

On this page, the user can:

- enter a username
- enter a password
- log in
- or go to the register page if they need an account

Behind the scenes, this page is handled by the React component:

- `Login.jsx`

When I click **Enter Workspace**, the frontend sends a request to:

- `POST /api/auth/login`

On the backend, that request is handled in:

- `authRoutes.js`
- `authController.js`

The server checks the username and password, compares the password with bcrypt, and then sends back:

- the user ID
- the username
- the role

Then the browser stores that user object in `localStorage`.

After that, React Router checks the role and sends the user to the correct dashboard.

So:

- admin goes to `/admin`
- driver goes to `/driver`

---

## Step 2. Log In as Admin

First, I’ll log in as the admin user.

The admin account is:

- username: `Eduardo`
- password: `canelas`

Once I log in, I’m taken to the **Admin Dashboard**.

This dashboard is the full-control side of the application.

The admin can:

- see all package records
- assign packages to drivers
- create new packages
- edit packages
- delete packages

On the page, we can also see:

- the driver roster
- the registered driver list
- the shipment form
- the shipment table

Behind the scenes, when the admin dashboard loads, React makes two important API calls:

- `GET /api/packages`
- `GET /api/packages/summary`

The first call loads all package records.

The second call loads extra summary data, like:

- total users
- total packages
- total facilities
- total routes
- total handling events
- the list of registered drivers

That is why the admin page feels more complete than just a plain table.

Also, every API request after login automatically sends three custom headers:

- `x-user-id`
- `x-user-username`
- `x-user-role`

The backend middleware checks those headers before allowing access to package routes.

So the system always knows who is making the request.

---

## Step 3. Create a Package as Admin

Now I’ll create a new package and assign it to a driver.

For this demo, I created a package assigned to **Manuela**.

The package I used was:

- package ID: `DEMO-0415`
- item: `Demo laptop kit`
- quantity: `12`
- truck ID: `T-99`
- pickup location: `Main Warehouse`
- dropoff location: `Downtown Store`
- delivery type: `transfer`
- status: `pending`

When the admin clicks create, the frontend sends:

- `POST /api/packages`

This is where the backend becomes really important.

It does not just save a row.

It also:

1. validates the allowed fields
2. makes sure the assigned driver exists
3. creates or finds the pickup facility
4. creates or finds the dropoff facility
5. creates or finds the route
6. saves the package
7. writes a handling event

So even though the user sees one clean row in the table, the backend is actually building the package’s tracking structure underneath.

That is one of the strongest parts of the app.

---

## Step 4. Many-to-Many Relationship

This is the part I would especially point out, because it shows the database is doing more than basic CRUD.

One honest thing to say here is:

"Our many-to-many relationship is built correctly in the backend and database, but it is not strongly visualized on the frontend yet."

That is actually a good answer, because it shows you understand the difference between:

- what is implemented in the data model
- and what is currently being displayed in the UI

Our many-to-many relationship is:

- **Packages**
- and **Facilities**

Here is the simple explanation:

- one package can move through many facilities
- one facility can handle many packages

So that relationship is many-to-many.

We connect those two entities using:

- `HandlingEvent`

`HandlingEvent` is the bridge record, or join record.

It stores one moment where a package and a facility are connected.

It also stores extra details like:

- the route
- the user who handled it
- the event type
- the status snapshot

A very easy real-world example is this:

Package `DEMO-0415` can start at **Main Warehouse**, then move to **Truck T-99**, and later reach **Downtown Store**.

That means one package is connected to multiple facilities over time.

At the same time, Main Warehouse can handle lots of different packages, not just this one.

So that is why we needed a many-to-many design.

If we stored only one facility directly inside the package forever, we would lose the travel history.

But with `HandlingEvent`, we keep the journey.

So if the professor asks what the many-to-many relationship is, the short answer is:

"Packages and facilities are many-to-many, and `HandlingEvent` is the join model that records each interaction."

### Best honest explanation to say out loud

You can say:

"In our current frontend, you mostly see the latest package row and status. You do not see a full visual history of every facility interaction yet. But behind the scenes, the backend is already creating facility records, route records, and handling-event records, and that is where the many-to-many relationship really lives."

### Why it does not stand out much on the frontend

You can say:

"The frontend is mainly showing the current package state, like the assigned driver, route text, and status. It is not yet showing a full event-history panel or a facility timeline. So the relationship exists in the database layer more clearly than in the UI layer."

That is a very good explanation because it is honest and technical at the same time.

### How to show it in MongoDB

If you want to prove it, the best place to show it is in the MongoDB collections.

You can say:

"If we open MongoDB, this relationship becomes much easier to see than it is on the frontend."

Then explain the collections like this:

- `packages` stores the package record
- `facilities` stores each place, like a warehouse, store, or in-transit truck
- `routes` stores the connection between a start facility and an end facility
- `handlingevents` stores the join records between packages and facilities

### What to point at in MongoDB

If you show the `handlingevents` collection, explain that each document connects:

- one `package`
- one `facility`
- one `route`
- one `user`
- one `eventType`
- one `statusSnapshot`

That is the strongest proof.

### Example MongoDB explanation

You can say:

"For example, when we created `DEMO-0415`, the app did not only store one package row. It also created or found the facilities, created or found the route, and then wrote a handling event. So if I show MongoDB, you can see the package collection, the facility collection, the route collection, and the handlingevents collection all working together."

### Best sentence if they ask why it is not visible enough on the page

Say:

"The relationship is implemented in the backend and database, but our current frontend mainly shows the latest package state instead of a full relationship view or event timeline."

### Best sentence if you want to sound stronger

Say:

"So the many-to-many part is real and working, but it is more obvious in MongoDB than in the current UI."

### How we could add it to the frontend UI

If you want to explain a future improvement, this is a very good way to say it:

"If we wanted to make the many-to-many relationship more visible in the frontend, the easiest improvement would be to add a package history panel or tracking timeline that lists each handling event for a package."

That is the cleanest answer, because the backend already has most of the structure.

### The easiest UI idea

The easiest version would be:

- click a package row
- open a details panel or modal
- show a timeline of handling events

Each event in that timeline could show:

- facility name
- facility type
- route
- event type
- status snapshot
- user who handled it
- time of the event

That would make the many-to-many relationship visible in a way people can actually understand at a glance.

### Why that would work well

Right now, the frontend mostly shows the current package state.

A history panel would show:

- where the package started
- where it moved
- who handled it
- what status changed at each step

That would turn the hidden relationship into a visible story.

### Another easy UI idea

Another simple option would be to add an **Expand** button on each package row.

When the row opens, it could show:

- current facility
- route start and route end
- all related handling events

That way the table stays simple, but extra relationship data is still available when needed.

### If we wanted an even stronger demo

We could also add a small visual flow like:

`Warehouse -> Truck -> Store`

or

`Origin Facility -> In Transit -> Destination`

That would make it obvious that one package connects to multiple facilities over time.

### What backend support would help

To make this easier on the frontend, we could add one more backend endpoint, like:

- `GET /api/packages/:id/history`

That endpoint could return populated handling events for one package.

For example, it could include:

- package info
- facility info
- route info
- user info
- event timestamps

Then the frontend would just render that response as a timeline or event list.

### Best short answer to say out loud

You can say:

"To show the many-to-many relationship better in the UI, we would add a package history or timeline view that displays the handling events connected to that package. The backend already creates the relationship data, so the main missing piece is displaying it clearly in the frontend."

---

## Step 5. Switch to Driver

Now I’ll log out and log in as a driver.

The driver account is:

- username: `Manuela`
- password: `fonseca`

After login, React sends this user to:

- `/driver`

Now the screen changes to the **Driver Dashboard**.

This page is simpler, because drivers have fewer responsibilities than admins.

The driver can:

- see only assigned packages
- update package status
- edit their own records
- delete their own records

The most important thing to notice is what the driver **cannot** see.

When I tested this live, Manuela could see:

- `DEMO-0415`
- `0001`

But she could **not** see Izzy’s package.

That proves the driver is scoped only to their own data.

Behind the scenes, the driver page still calls:

- `GET /api/packages`

But the backend changes the query.

For admins, the query is all packages.

For drivers, the query becomes:

- packages where `ownerUserId` matches the current logged-in driver

So the backend is filtering the data.

That means the security is enforced on the server, not just hidden in the frontend.

---

## Step 6. Update Status as Driver

Now I’ll show the driver updating the package status.

For example, I changed `DEMO-0415` from:

- `Pending`
- to `In Transit`

On the screen, that looks like a simple dropdown change.

But behind the scenes, it does more than change one word.

The frontend sends:

- `PUT /api/packages/:id`

Then the backend:

1. finds the package
2. checks ownership
3. makes sure the driver is allowed to update it
4. updates the package
5. rebuilds tracking context
6. writes another handling event

So the app is keeping history every time the package moves forward.

That is why the project is really a tracking system, not just a form and a table.

If you want, you can connect this back to the many-to-many point by saying:

"This status update looks simple on the frontend, but in the backend it can create another handling event, which is part of the many-to-many tracking history."

---

## Quick Status Logic: Lost, Returned, and Cancelled

If someone asks what happens with other statuses, here is the quick explanation.

### Lost

You can say:

"If a package is marked as lost, the backend updates the package status to `lost`, saves the package again, and writes another handling event so the system keeps a record of that change."

Behind the scenes:

- the package row is updated
- the tracking context is rebuilt
- the current facility is pushed toward the destination-side logic instead of staying in transit
- a new handling event is written
- the event type becomes `unloaded`

### Returned

You can say:

"If a package is marked as returned, the backend treats that as a completed status change, updates the package, and writes another handling event so the return becomes part of the package history."

Behind the scenes:

- the package row is updated
- the current facility moves to the dropoff-side logic
- a new handling event is created
- the event type becomes `unloaded`

### Cancelled

You can say:

"If a package is cancelled, the backend still saves that final status and records the cancellation in the package history through another handling event."

Behind the scenes:

- the package row is updated
- the tracking context is rebuilt
- the package is treated as being in a final end-state
- a handling event is created
- the event type becomes `unloaded`

### The simple rule to memorize

Pending, picked up, and in transit are movement statuses.

Lost, returned, and cancelled are more like final or closing statuses.

So the backend still records them, but it treats them like end-state events in the history.

### One-line version

You can say:

"For lost, returned, or cancelled packages, the app still updates the package, rebuilds tracking context, and writes a handling event, so even those exception cases are preserved in the history."

---

## Step 7. Ownership Protection

Another important backend feature is ownership protection.

I also tested this directly:

When Manuela tried to access another driver’s package, the backend blocked it.

The rule is handled by a function called:

- `canAccessPackage`

That function basically says:

- if the user is admin, allow access
- if the user owns the package, allow access
- otherwise, deny access

So drivers cannot edit someone else’s package just because they know the package ID.

That is a strong security point for the project.

---

## Closing

So to summarize, Packet Tracker is a complete MERN application with:

- login and registration
- role-based routing
- admin and driver dashboards
- protected backend routes
- package ownership rules
- CRUD operations
- tracking history
- and a real many-to-many relationship using `HandlingEvent`

The main user story is:

- admin creates and assigns packages
- driver sees only assigned packages
- driver updates package status
- backend records the package journey

And one honest technical note is that the journey is modeled more clearly in the database than in the current frontend.

So even though the interface looks simple, the system behind it is doing real full-stack work across React, Express, MongoDB, routing, validation, and relationship modeling.

Thank you.

---

## 30-Second Backup Version

If you need to speed up at the end, say this:

"Packet Tracker is a MERN package-tracking app with two roles: admin and driver. Admins can manage all packages, while drivers only see and update their own assigned shipments. The backend protects every package route, checks ownership, and records package movement using `HandlingEvent`, which is also how we model the many-to-many relationship between packages and facilities."

---

## Fast Memory Notes

- Start at login
- Admin sees all packages
- Driver sees only own packages
- Login response stores ID, username, role
- API client sends custom user headers
- Middleware validates current user
- Admin creates `DEMO-0415` for Manuela
- Driver changes status to `In Transit`
- Ownership is enforced on backend
- Many-to-many = packages and facilities
- Join model = `HandlingEvent`
- Better shown in MongoDB than in the current UI
