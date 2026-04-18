# Packet Tracker final demo script

This is the final full demo script.

It is meant to guide the audience through:

- what they see on screen
- how the UI was designed
- what components are being used
- how Tailwind CSS is used
- what the server is doing
- what the database is doing
- what happens behind the scenes at each step

This script is written so one speaker can present the full demo, or so the team can study it together before presenting.

## Opening

"Now we are going to show the full Packet Tracker app working from start to finish.

As we go through the demo, I will explain two things at the same time.

First, I will explain what the audience is seeing in the user interface.

Second, I will explain what is happening behind the scenes in the front end, the back end, and the database.

That way, this is not only a visual demo. It also shows how the full system works as a real MERN application."

## Very short app summary

"Packet Tracker is a MERN app.

That means:

- MongoDB stores the data
- Express handles the server routes
- React builds the front end
- Node.js runs the server

The app has two user roles:

- admin
- driver

The admin can manage all package records.

The driver can only work with package records that belong to that driver.

The app also keeps tracking history using a collection called `HandlingEvent`, so it works like a real tracking system and not just a simple list of packages."

## Demo part 1
## Showing the first screen

"The first thing the user sees is the login page.

In the code, this page is controlled by the React route `/`, and the page component is `Login.jsx`."

## What the audience sees in the UI

"Visually, the login screen is centered and clean.

The page uses a dark slate background, light text, and an amber accent color for the main action button.

This was done on purpose to keep the interface simple and easy to read.

The card in the middle is a reusable component called `GlassCard`.

The full page wrapper is `AppShell`.

The layout width and page padding are controlled by another reusable component called `PageFrame`.

The text label near the top, like 'Sign in', uses a reusable small heading style called `SectionKicker`."

## Styling details to say clearly

"For styling, the project mainly uses Tailwind CSS.

That means most of the styling is written directly in the React components using Tailwind utility classes.

For example, the app uses classes for:

- spacing
- padding
- rounded corners
- text sizes
- background colors
- borders
- shadows

The main active styling lives in:

- `frontend/src/index.css`
- `frontend/src/components/ui.jsx`
- the page files like `Login.jsx`, `Register.jsx`, `AdminDashboard.jsx`, and `DriverDashboard.jsx`

The global background color comes from `index.css`, where the app sets a dark base background using a slate color.

The reusable UI styling is in `ui.jsx`, where components like `GlassCard`, `PrimaryButton`, `TextInput`, and `StatusBadge` are defined."

## Behind the scenes on page load

"When the React app starts, `main.jsx` loads `index.css` and then renders `App.jsx`.

`App.jsx` is the front-end route controller.

It decides which page to show.

If no user is logged in, it allows the login page to appear.

If a user is already logged in, React checks the stored role and redirects that user to either the admin dashboard or the driver dashboard."

## Demo part 2
## Logging in

"Now I will log in.

When I type a username and password and press the main button, the `handleLogin` function in `Login.jsx` runs.

That function sends the username and password to the back end using Axios.

The request goes to:

- `POST /api/auth/login`

On the server side, that route is defined in `backend/routes/authRoutes.js`, and it calls the `login` function in `backend/controllers/authController.js`."

## What the server does during login

"The login controller does a few important steps.

First, it reads the username and password from the request body.

Then it checks if the values are there.

After that, it looks for the user.

If MongoDB is connected, it looks in the `User` collection using the Mongoose `User` model.

If MongoDB is not connected, the project can fall back to a local user store.

If the user exists, the controller compares the entered password to the saved password hash.

That comparison is done with bcrypt.

The `User` model also has a helper method called `comparePassword`, which helps with this step."

## What happens after successful login

"If login works, the server sends back:

- the user ID
- the username
- the role

Then the front end saves that information in `localStorage`.

That matters because the app uses the saved user information for later protected requests."

## Demo part 3
## Explaining protected requests

"After login, every protected API request goes through the shared Axios client in `frontend/src/lib/api.js`.

That Axios client automatically adds three custom headers:

- `x-user-id`
- `x-user-username`
- `x-user-role`

So the browser is basically saying:

'Here is who I am.'

Then the server still checks whether that is true."

## Middleware explanation

"Before any package route runs, the middleware `requireCurrentUser` runs first.

This middleware is in:

- `backend/middleware/requireCurrentUser.js`

It checks:

- whether the headers exist
- whether the user ID belongs to a real user
- whether the username and role match the saved account

If that check fails, the request is blocked.

So route protection is handled on the back end, not just by the front end."

## Demo part 4
## Showing the admin dashboard

"Now I am logged in as an admin, so the app sends me to the admin dashboard.

The route for this page is `/admin`, and the React page component is `AdminDashboard.jsx`.

The front end only allows this page if the user role is `admin`.

That role check happens in the `RequireRole` wrapper inside `App.jsx`."

## What the audience sees on the admin page

"The admin dashboard keeps the same design language as the login page.

It still uses the same dark slate theme, the same card styling, and the same spacing system.

That is important because it makes the app feel like one connected product.

The main title area is styled with `PageTitle`.

The sections are separated with `GlassCard`.

Buttons are styled with:

- `PrimaryButton` for the main action
- `SecondaryButton` for support actions

Form controls use:

- `Field`
- `TextInput`
- `SelectInput`

Package status labels use `StatusBadge`.

This is a good example of reusable styling. Instead of designing each page from scratch, the app uses the same UI system across multiple screens."

## What data loads on the admin dashboard

"When the admin dashboard opens, React runs a `useEffect` hook.

That calls a function named `loadDashboardData`.

That function loads:

- all packages
- the data model summary

The package list comes from:

- `GET /api/packages`

The summary comes from:

- `GET /api/packages/summary`

Both of those requests use the protected package routes."

## Demo part 5
## Showing the admin creating a package

"Now I will create a package.

On the screen, the admin fills in the package form.

This includes:

- driver username
- package ID
- item name
- amount
- truck ID
- pickup location
- dropoff location
- delivery type
- status

The form is visually organized with labels, grouped fields, and spacing so it is easier to scan.

This is another place where Tailwind helps a lot, because the layout uses grid classes, spacing classes, and responsive sizing classes directly in the JSX."

## What happens when the admin clicks create

"When I click the create button, the `handleSubmit` function in `AdminDashboard.jsx` runs.

That function builds the package payload and sends:

- `POST /api/packages`

On the server side, the controller function is:

- `createPackage`

That function is in `backend/controllers/packageController.js`."

## Deep backend explanation for package creation

"Package creation is one of the most important parts of the app because it shows that the project is doing more than plain CRUD.

Here is what happens behind the scenes.

First, the controller uses `buildPackagePayload(...)`.

That helper:

- selects only the allowed fields
- cleans string values
- converts numbers
- checks required fields
- decides who the owner of the package should be

Admins can set `ownerUsername`, but drivers cannot assign records to someone else.

After that, the controller uses `buildTrackingContext(...)`.

This helper is very important.

It:

- creates or finds the pickup facility
- creates or finds the dropoff facility
- creates or finds the route between those facilities
- decides the current facility based on the package status

Then the package record is saved.

After that, the app creates a tracking record using:

- `recordHandlingEvent(...)`

That creates a `HandlingEvent` document and connects:

- the package
- the facility
- the route
- the user
- the event type
- the status snapshot

So the app is not just saving a package row.

It is also building the tracking system around that package."

## Explaining the collections during the live demo

"At this point in the demo, it helps to explain the database.

The main collections are:

- `User`
- `Package`
- `Facility`
- `Route`
- `HandlingEvent`

The `Package` collection stores the main package data.

The `Facility` collection stores locations like warehouses, distribution centers, retail stores, customer addresses, or in-transit truck locations.

The `Route` collection stores the connection between a start facility and an end facility.

The `HandlingEvent` collection stores the history of what happened to a package and where it happened.

That means the database is organized into separate pieces instead of stuffing everything into one giant record."

## Many-to-many explanation during the demo

"The main many-to-many relationship in the project is between packages and facilities.

One package can move through many facilities.

One facility can handle many packages.

The app connects them through `HandlingEvent`.

That collection works like a bridge between the two sides."

## Demo part 6
## Showing the package list

"Now the new package appears in the shipment board.

This board is laid out like a table so the admin can compare package records more easily.

The table shows:

- package ID
- item
- driver
- route
- status
- actions

The styling here is focused on readability.

The text hierarchy, the row spacing, the soft borders, and the colored `StatusBadge` all make the data easier to scan."

## Styling explanation for status badges

"The status badge is a good small design example.

The reusable `StatusBadge` component maps each package status to a different color style.

For example:

- pending uses an amber tone
- in transit uses an indigo tone
- delivered uses a green tone
- lost uses a rose tone

This helps the user understand the package state quickly without reading long text."

## Demo part 7
## Editing or deleting as admin

"Now I can show that the admin can edit or remove a record.

When I click edit, the form is filled with the current package values.

That happens through the helper:

- `mapPackageToForm(...)`

When I save the update, the request goes to:

- `PUT /api/packages/:id`

And the back-end controller uses:

- `updatePackage`

That function updates the package, rebuilds the tracking context if needed, and writes another handling event.

If I delete the record, the request goes to:

- `DELETE /api/packages/:id`

The server deletes the related handling events for that package and then removes the package record."

## Why the admin page matters

"The admin page shows full CRUD, role-based control, reusable UI styling, protected API requests, and tracking logic all in one screen.

So this dashboard is a good summary of the full project."

## Demo part 8
## Logging out and switching roles

"Now I will log out and switch to the driver side.

When I log out, the front end removes the stored user from `localStorage` using:

- `clearStoredUser()`

Then I can log in as a driver."

## Demo part 9
## Showing the driver dashboard

"After logging in as a driver, React sends the user to the `/driver` route.

The page component is `DriverDashboard.jsx`.

The driver dashboard uses the same design system as the admin dashboard.

That means the app still feels visually consistent.

The same dark slate background is used.

The same card styling is used.

The same form components are used.

The same button family is used.

The same status badge system is used.

But the page is simpler than the admin page, because drivers have fewer responsibilities.

That is a design choice that matches the role."

## Explaining role-based design

"This is an important thing to point out.

The driver dashboard is not just a copy of the admin dashboard.

It is intentionally simpler.

That helps the user focus only on the actions that belong to that role.

So role-based logic affects both:

- functionality
- interface design"

## What data the driver sees

"When the driver dashboard loads, it also calls:

- `GET /api/packages`

But the result is different.

The driver does not see every package.

In the back end, `getAllPackages` checks the current user role.

If the user is an admin, the query returns all packages.

If the user is a driver, the query only returns packages where:

- `ownerUserId === req.currentUser.id`

So the data is filtered on the server side."

## Demo part 10
## Showing driver actions

"Now I can show the driver updating a package.

The driver can:

- create a package for the driver's own truck
- edit that package
- delete that package
- update the status from the dashboard

The status dropdown is especially useful because it makes the tracking part of the app feel active."

## Behind the scenes for driver updates

"When the driver changes the status, the front end uses:

- `handleUpdateStatus(...)`

That sends:

- `PUT /api/packages/:id`

On the back end, the controller again uses:

- `updatePackage`

Then the server checks:

- whether the package exists
- whether the current user is allowed to access that package

That access check uses:

- `canAccessPackage(...)`

If the user is not allowed, the request is blocked.

If the user is allowed, the package updates and another handling event is written.

That means every important change can be part of the tracking history."

## Explaining access control clearly

"This part is important if we want to show that the app is secure at the project level.

The driver cannot edit someone else's package just because the front end hides it.

The back end also checks ownership.

So even if someone tried to manually send a request, the server would still compare the current user to the package owner and reject the action if it did not match."

## Demo part 11
## Explaining the styling system one more time

"Before we finish, I want to point out the styling system one more time.

This project uses Tailwind CSS plus reusable React UI components.

That means the visual design is not random.

It is built from shared pieces.

The main styling ideas are:

- dark slate background
- light readable text
- amber accent color for major actions
- rounded cards
- soft borders
- clean spacing
- color-coded status badges

This makes the app feel consistent across:

- login
- register
- admin dashboard
- driver dashboard

And because the styling is reused through components like `GlassCard`, `PrimaryButton`, `Field`, and `StatusBadge`, the pages all feel connected."

## Demo part 12
## Explaining the code structure clearly

"At a code level, the project is split into two clear parts.

The front end is in:

- `frontend/`

That contains:

- routes
- page components
- reusable UI components
- API helpers
- global styling

The back end is in:

- `backend/`

That contains:

- the Express server
- routes
- middleware
- controller logic
- Mongoose models
- utility helpers

This separation helps keep the project organized and makes it easier to understand how the browser and server work together."

## Final wrap-up

"So to wrap up, this demo showed the full Packet Tracker system from both the user side and the code side.

On the UI side, we showed:

- the login flow
- the register flow
- the admin dashboard
- the driver dashboard
- the styling system built with Tailwind and reusable components

On the back-end side, we showed:

- Express routing
- protected routes
- role checking
- package CRUD
- tracking logic

On the database side, we showed:

- `User`
- `Package`
- `Facility`
- `Route`
- `HandlingEvent`

And we explained that the app does more than basic CRUD because it also creates route and facility context and logs tracking history through handling events.

That is Packet Tracker as a full MERN application."

## Fast backup answers

If the professor asks follow-up questions during the demo, these are safe short answers.

### Question: "Where is the styling mainly handled?"

Answer:
"Mostly in Tailwind utility classes, `frontend/src/components/ui.jsx`, and the global base file `frontend/src/index.css`."

### Question: "What are the main reusable components?"

Answer:
"`AppShell`, `PageFrame`, `GlassCard`, `Field`, `TextInput`, `SelectInput`, `PrimaryButton`, `SecondaryButton`, `Alert`, and `StatusBadge`."

### Question: "What is happening when a package is created?"

Answer:
"The back end builds the package payload, finds or creates the facilities, finds or creates the route, saves the package, and writes a handling event."

### Question: "What is the many-to-many relationship?"

Answer:
"Packages and facilities, connected through `HandlingEvent`."

### Question: "How are package routes protected?"

Answer:
"The middleware `requireCurrentUser` checks the user headers before package routes run."

### Question: "How do you limit drivers to only their own data?"

Answer:
"The back end filters package queries by owner and also checks access with `canAccessPackage(...)`."

### Question: "Why use Tailwind?"

Answer:
"Tailwind helped us style quickly, keep spacing and colors consistent, and build a reusable design system inside the React components."
