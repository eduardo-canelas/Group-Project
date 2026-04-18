

## Introduction

### What to say

"Hi everyone. We are presenting Packet Tracker. Our team members are Liliana, Avery, Ashton, Goose, and Eduardo.

Our topic is package tracking. We chose this topic because online shopping is very common now, and companies need a good way to track packages.

We wanted to approach this from a developer point of view. Our goal was to make the app feel simple, clear, and easy to use instead of crowded or confusing.

What makes this topic interesting is that the app looks simple on the screen, but behind the scenes it has login, user roles, package records, routes, facilities, and tracking events.

Now Avery will explain the technologies we used and how the work was divided."

### What to know if asked

- This is a full-stack MERN app, not just a front-end design.
- The app has two roles: `admin` and `driver`.
- The app keeps tracking history through `HandlingEvent`, not just one package table.
- The front end is React.
- The back end is Node.js and Express.
- The database is MongoDB with Mongoose models.

### Best short answers

Question: "Why did you choose this topic?"

Answer:
"We chose it because package tracking is easy to understand in real life, but it also gave us enough complexity to build a real full-stack app."

Question: "What was your design goal?"

Answer:
"Our design goal was to keep the app simple and smooth while still doing real work behind the scenes."

## Avery
## Distribution of work

### What to say

"For this project, we used the MERN stack. That means MongoDB, Express, React, and Node.js.

On the front end, React built the pages and components. React Router handled page navigation. Axios handled requests from the browser to the server. Tailwind CSS helped with styling.

On the back end, Node.js ran the server, Express handled routes, and Mongoose helped us work with MongoDB.

For team roles, Guiscard worked on React integration. Liliana and I focused on styling and planning. Ashton worked on React integration and page structure. Eduardo built the backend logic, including the Express server, authentication flow, package routes, and MongoDB connection.

Now Ashton will explain the database side of the technical description."

### What to know if asked

- `frontend/src/App.jsx` handles the main front-end routes.
- `frontend/src/lib/api.js` uses Axios and adds user headers automatically.
- `backend/server.js` starts the Express app.
- Mongoose is used for models like `User`, `Package`, `Facility`, `Route`, and `HandlingEvent`.

### Best short answers

Question: "Where do you use React Router?"

Answer:
"We use it in `App.jsx` to control routes like `/`, `/register`, `/admin`, and `/driver`."

Question: "Where do you use Axios?"

Answer:
"We use Axios in `frontend/src/lib/api.js` to send requests to the backend and attach the current user headers."

Question: "Why use Mongoose?"

Answer:
"Mongoose gave us schemas and models, so the data stayed organized and easier to validate."

## Ashton
## Database side

### What to say

"I am covering the database side of the project.

Our database collections took the form of Mongoose models on top of MongoDB. That means each collection has a schema that defines what fields it should have.

Our five main collections are `User`, `Package`, `Facility`, `Route`, and `HandlingEvent`.

`User` stores login information and the role, which can be admin or driver.

`Package` stores the main shipment record, including fields like package ID, description, amount, delivery type, truck ID, pickup location, dropoff location, status, and owner information.

`Facility` stores places involved in the shipment flow, like warehouses, distribution centers, retail stores, customer addresses, or in-transit locations.

`Route` stores the path between a start facility and an end facility.

`HandlingEvent` stores the tracking history. It connects the package, facility, route, and user, and it records what happened at that moment.

The main many-to-many relationship is between packages and facilities. One package can move through many facilities, and one facility can handle many packages. We connect those through `HandlingEvent`.

Now Goose will explain the server routing and the front-end component structure."

### What to know if asked

- `User` model file: `backend/models/User.js`
- `Package` model file: `backend/models/Package.js`
- `Facility` model file: `backend/models/Facility.js`
- `Route` model file: `backend/models/Route.js`
- `HandlingEvent` model file: `backend/models/HandlingEvent.js`

- `User` uses a `pre("save")` hook to hash passwords with bcrypt.
- `User` also has `comparePassword(...)`.
- `Facility` uses `normalizedName` so the same place is not created again and again.
- `Route` has `startFacility` and `endFacility`.
- `HandlingEvent` is the tracking log and the bridge for the many-to-many relationship.

### Best short answers

Question: "What entities existed in the data model?"

Answer:
"The five main entities are `User`, `Package`, `Facility`, `Route`, and `HandlingEvent`."

Question: "What many-to-many relationship existed?"

Answer:
"Packages and facilities. A package can pass through many facilities, and a facility can process many packages. `HandlingEvent` links them."

Question: "Is truck ID the many-to-many relationship?"

Answer:
"No. `truckId` is just a field on the `Package` model. The real many-to-many relationship is packages and facilities through `HandlingEvent`."

## Goose
## Routing and front-end components

### What to say

"I am covering the routing and component structure.

For the web server, routing used Express. In `backend/server.js`, the server mounts two main route groups: `/api/auth` and `/api/packages`.

The auth routes handle register and login. The package routes handle create, read, update, delete, and the summary endpoint.

Before any package route runs, the middleware `requireCurrentUser` checks the user headers and makes sure the request matches a real user.

On the front end, the app uses React function components. The main page components are `Login`, `Register`, `AdminDashboard`, and `DriverDashboard`.

The app also uses reusable UI components like `GlassCard`, `Field`, `TextInput`, `SelectInput`, `PrimaryButton`, `SecondaryButton`, `Alert`, and `StatusBadge`.

Front-end routing is handled in `App.jsx` with React Router. `PublicOnly` keeps logged-in users out of public pages, and `RequireRole` sends users to the correct dashboard based on role."

### What to know if asked

- Server startup file: `backend/server.js`
- Main server functions:
  - `connectDatabase()`
  - `startServer()`

- Auth route file: `backend/routes/authRoutes.js`
- Package route file: `backend/routes/packageRoutes.js`
- Middleware file: `backend/middleware/requireCurrentUser.js`

- Front-end route file: `frontend/src/App.jsx`
- Public route wrapper: `PublicOnly`
- Protected role wrapper: `RequireRole`

- Axios interceptor file: `frontend/src/lib/api.js`
- It adds:
  - `x-user-id`
  - `x-user-username`
  - `x-user-role`

### Best short answers

Question: "What form did routing take for the web server?"

Answer:
"It used Express routing with two main route groups: `/api/auth` and `/api/packages`."

Question: "How are package routes protected?"

Answer:
"They are protected by `requireCurrentUser`, which checks the user headers before the controller runs."

Question: "What form did the front-end components take?"

Answer:
"They were React function components, split into page components and reusable UI components."

Question: "Why do you have routing on both front end and back end?"

Answer:
"The front end controls which page the user sees. The back end controls which server logic runs when the browser sends a request."

## Eduardo
## Live demo

### What to say

"Now I will show how the app works.

The first page is the login page, which matches the project requirement.

If a new user needs an account, they can go to the register page. That form sends data to `/api/auth/register`.

After login, the server sends back the user ID, username, and role. The browser saves that in `localStorage`, and later requests use that data in custom headers.

Now I will log in as an admin.

The admin dashboard can see all packages, assign them to drivers, and create, update, or delete records.

When a package is created, the app does more than save one row. The backend can also create or find the pickup facility, create or find the dropoff facility, create or find the route, and create a handling event for tracking history.

Now I will switch to the driver side.

The driver only sees packages assigned to that driver. If the driver updates the status, the backend updates the package and also writes another handling event.

So the demo shows the full flow: login, role-based routing, admin control, driver-specific access, package updates, and tracking history."

### What to know if asked

- Login page file: `frontend/src/pages/Login.jsx`
- Register page file: `frontend/src/pages/Register.jsx`
- Admin page file: `frontend/src/pages/AdminDashboard.jsx`
- Driver page file: `frontend/src/pages/DriverDashboard.jsx`

- Important front-end functions:
  - `handleLogin`
  - `handleRegister`
  - `handleSubmit`
  - `handleUpdateStatus`
  - `handleDelete`

- Important backend functions:
  - `createPackage`
  - `getAllPackages`
  - `updatePackage`
  - `deletePackage`
  - `getDataModelSummary`
  - `buildPackagePayload`
  - `buildTrackingContext`
  - `recordHandlingEvent`
  - `canAccessPackage`

### Best short answers

Question: "How does the app know whether to show admin or driver pages?"

Answer:
"After login, the role is saved in `localStorage`, and `App.jsx` uses that role to route the user to `/admin` or `/driver`."

Question: "How do you stop a driver from editing someone else's package?"

Answer:
"The backend checks ownership with `canAccessPackage`, so the server only allows drivers to work with their own package records."

Question: "What happens when you create a package?"

Answer:
"The backend saves the package, builds the tracking context, and creates a handling event record."

Question: "What makes this more than a normal CRUD app?"

Answer:
"It also creates tracking history through `HandlingEvent`, plus route and facility records behind the scenes."

## Fastest facts to memorize

- MERN = MongoDB, Express, React, Node.js
- Roles = `admin` and `driver`
- Front-end routes = `/`, `/register`, `/admin`, `/driver`
- Back-end route groups = `/api/auth` and `/api/packages`
- Five entities = `User`, `Package`, `Facility`, `Route`, `HandlingEvent`
- Many-to-many = `Packages <-> Facilities` through `HandlingEvent`
- Middleware = `requireCurrentUser`
- Main tracking helpers = `buildTrackingContext` and `recordHandlingEvent`
