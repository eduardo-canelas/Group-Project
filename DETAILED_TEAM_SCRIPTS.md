# Packet Tracker 

## Whole-app 

If anyone on the team forgets the big picture, use this:

1. The user opens the React app in the browser.
2. The first page is the login page.
3. The user logs in or registers.
4. React sends the form data to the Express server.
5. The server checks the username and password.
6. If login works, the front end saves the user data in `localStorage`.
7. After that, every protected request sends three custom headers:
   - `x-user-id`
   - `x-user-username`
   - `x-user-role`
8. The middleware checks those headers and makes sure the session matches a real user.
9. If the user is allowed, the controller finishes the request.
10. If the user is not allowed, the server blocks the action.
11. When a package is created or updated, the app also creates or updates tracking data like facility, route, and handling event records.

That is the full behind-the-scenes story.

## What each main file does

Where is that handled in the code?

### Backend files

- `backend/server.js`
  - Starts Express
  - Connects to MongoDB with `connectDatabase()`
  - Starts the app with `startServer()`
  - Mounts `/api/auth` and `/api/packages`

- `backend/routes/authRoutes.js`
  - Sends register requests to `register`
  - Sends login requests to `login`

- `backend/routes/packageRoutes.js`
  - Protects all package routes with `requireCurrentUser`
  - Connects route URLs to controller functions

- `backend/middleware/requireCurrentUser.js`
  - Reads the custom headers
  - Checks if the user is real
  - Makes sure the header values match the stored user

- `backend/controllers/authController.js`
  - `register`
  - `login`

- `backend/controllers/packageController.js`
  - `createPackage`
  - `getAllPackages`
  - `getDataModelSummary`
  - `getPackageById`
  - `updatePackage`
  - `deletePackage`
  - Helper functions like `buildPackagePayload`, `buildTrackingContext`, and `recordHandlingEvent`

### Frontend files

- `frontend/src/App.jsx`
  - Sets routes
  - Uses `PublicOnly` and `RequireRole`

- `frontend/src/lib/api.js`
  - Builds the Axios API client
  - Adds user headers before requests

- `frontend/src/lib/auth.js`
  - Reads and clears `localStorage`

- `frontend/src/pages/Login.jsx`
  - Login form
  - Uses `handleLogin`

- `frontend/src/pages/Register.jsx`
  - Register form
  - Uses `handleRegister`

- `frontend/src/pages/AdminDashboard.jsx`
  - Admin package form
  - Admin package table
  - Driver assignment list
  - Data model summary fetch

- `frontend/src/pages/DriverDashboard.jsx`
  - Driver package form
  - Driver package table
  - Driver status update dropdown

## Liliana

"Hi everyone. We are presenting Packet Tracker. Our team members are Liliana, Avery, Ashton, Goose, and Eduardo.

Our topic is packet and package tracking. We chose this topic because online shopping is a big part of everyday life now. A lot of people order things online, and companies have to keep track of where those packages are going.

We wanted to look at this from a developer point of view. Instead of making a crowded tracking screen, we wanted to make the system feel simpler and easier to use. We focused on making the user interface clean and making the app flow smoothly for the organization using it.

What makes this topic interesting is that it is not just a list on a page. Behind the scenes, the app has login, user roles, package records, routes, facilities, and tracking events. So it feels simple on the screen, but there is real logic underneath it.

Now Avery will explain what technology we used and how the work was split across the team."

The app is split into two halves:

- the front end in React
- the back end in Node and Express

The front end is what the user sees.

The back end is what checks users, saves packages, and decides who is allowed to do what.

The database stores the app data in MongoDB.

So if the professor asks, "Why is this more than just a UI project?", Liliana can say:

"Because the UI is only one part. The project also has role-based login, protected routes, database models, package ownership rules, and tracking history through handling events."

### Questions

Question: "Why did your group pick this topic?"

Answer:
"We picked it because package tracking is easy to understand in real life, but it also gives us enough complexity to show real full-stack development. We could show users, packages, routes, facilities, and tracking history all in one project."

Question: "What makes the project interesting from a computer science point of view?"

Answer:
"It has both front-end and back-end logic. The app has login, role-based access, a database with multiple collections, protected routes, and event tracking. So it is a good example of a complete MERN application."

Question: "What was your design goal?"

Answer:
"Our design goal was to keep the experience simple. We wanted the screens to feel clear and easy to use while still doing real work behind the scenes."

## Avery
## Distribution of work

"For this project, we used the MERN stack. That means MongoDB, Express, React, and Node.js.

On the front end, React was used to build the pages and components. React Router handled page navigation and role-based routing. Axios handled requests from the browser to the back end. Tailwind CSS helped with styling.

On the back end, Node.js ran the server, and Express handled the route structure. Mongoose helped us define our database models and work with MongoDB.

For team roles, Guiscard worked on React integration and helped connect the front end to the back-end API. Liliana and I focused on styling and planning, which helped keep the user experience and project flow organized. Ashton worked on React integration and page structure. Eduardo built the backend logic, including the Express server, package routes, authentication flow, and MongoDB connection.

Now Ashton will explain the database side of the technical description."

##

The technology stack is real in the code, not just a slide label.

Here is how each technology shows up:

- React
  - Builds pages like `Login`, `Register`, `AdminDashboard`, and `DriverDashboard`
  - File: `frontend/src/App.jsx` and `frontend/src/pages/*`

- React Router
  - Controls routes like `/`, `/register`, `/admin`, and `/driver`
  - Uses `PublicOnly` and `RequireRole`

- Axios
  - Sends API requests to `http://localhost:5000/api`
  - File: `frontend/src/lib/api.js`

- Tailwind CSS
  - Styles things like cards, buttons, spacing, and colors
  - Most styling is in JSX class names and `frontend/src/components/ui.jsx`

- Node.js
  - Runs the server code

- Express
  - Handles the routes
  - `/api/auth`
  - `/api/packages`

- MongoDB
  - Stores data in collections

- Mongoose
  - Defines the schemas and models
  - Examples: `User`, `Package`, `Facility`, `Route`, `HandlingEvent`

### Easy answers if the professor asks Avery questions

Question: "Where do you actually use React Router?"

Answer:
"We use it in `frontend/src/App.jsx`. That file defines the page routes and uses `PublicOnly` and `RequireRole` to redirect users to the correct screen."

Question: "Where do you use Axios?"

Answer:
"We use Axios in `frontend/src/lib/api.js`. It creates the API client and automatically adds the current user headers before every protected request."

Question: "Why did you use Mongoose instead of raw MongoDB?"

Answer:
"Mongoose gave us schemas and model files. That made it easier to validate fields, define relationships, and keep the structure consistent across the app."

Question: "How did the team split the work in a way that still fit together?"

Answer:
"The front end and back end were separate enough for people to focus on different areas, but they connected through shared API endpoints and shared field names. So styling, components, routing, and database work all met in the same app flow."

## Ashton
## Technical description script, database side

### What Ashton should say

"I am covering the database side of the project.

For the database, our collections took the form of Mongoose models on top of MongoDB. That means each collection has a schema that says what fields belong in that kind of record.

Our main collections are `User`, `Package`, `Facility`, `Route`, and `HandlingEvent`.

The `User` collection stores login information and role information. The role can be `admin` or `driver`.

The `Package` collection stores the main shipment record, including fields like `packageId`, `description`, `amount`, `deliveryType`, `truckId`, `pickupLocation`, `dropoffLocation`, `status`, and owner information.

The `Facility` collection stores places involved in the shipment flow, like warehouses, distribution centers, stores, customer addresses, or an in-transit truck location.

The `Route` collection stores the connection between a start facility and an end facility.

The `HandlingEvent` collection stores the tracking history. It connects a package, a facility, a route, and a user together, and it saves what kind of event happened and what the package status was at that moment.

The main many-to-many relationship is between packages and facilities. One package can move through many facilities, and one facility can handle many packages. We modeled that through `HandlingEvent`, which acts like the bridge between the two.

That means the tracking history is not just text on the screen. It is backed by real database records.

Now Goose will explain the server routing and the front-end component side."

### What Ashton needs to understand deeply

This is the safest way to understand the data model:

#### 1. `User`

File:

- `backend/models/User.js`

What it stores:

- `username`
- `password`
- `role`

Important detail:

The password is not saved as plain text.

The schema has a `pre("save")` hook that runs before saving. That hook uses `bcrypt.hash(...)` to hash the password.

The model also has a method called `comparePassword(...)`.

That is important because if the professor asks, "How do you verify the password?", Ashton can say:

"The `User` model has a `comparePassword` method that uses bcrypt to compare the entered password with the hashed password in the database."

#### 2. `Package`

File:

- `backend/models/Package.js`

What it stores:

- package info
- owner info
- route reference
- current facility reference
- last handling event reference

Important detail:

The package is the central record in the app, but it is not the whole story. It also points to other records that explain where it is and what happened to it.

#### 3. `Facility`

File:

- `backend/models/Facility.js`

What it stores:

- `name`
- `normalizedName`
- `location`

Important detail:

`normalizedName` is lowercase and unique.

That helps stop the app from creating duplicate facility records that are really the same place with slightly different spelling.

#### 4. `Route`

File:

- `backend/models/Route.js`

What it stores:

- `startFacility`
- `endFacility`

Important detail:

The route model has a unique index on `startFacility` and `endFacility`.

That means the same exact route is not supposed to be duplicated over and over.

#### 5. `HandlingEvent`

File:

- `backend/models/HandlingEvent.js`

What it stores:

- `package`
- `facility`
- `user`
- `route`
- `eventType`
- `statusSnapshot`

This is the most important model for explaining tracking.

It is what turns the project from a basic CRUD app into a package tracking app.

Every time a package is created or updated, the app can create a new handling event. That means the system keeps a record of what happened, where it happened, and who did it.

### Professor question backup for Ashton

Question: "What do you mean when you say the collections took the form of Mongoose models?"

Answer:
"It means each collection has a schema file in the backend. For example, `User.js`, `Package.js`, and `HandlingEvent.js`. Those files define the fields, allowed values, and relationships for each kind of record."

Question: "How many entities are really in the data model?"

Answer:
"There are five main entities in the code: `User`, `Package`, `Facility`, `Route`, and `HandlingEvent`."

Question: "Are four drivers the entities in the data model?"

Answer:
"No. The drivers are example records inside the `User` entity. The entity is `User`. A driver is one kind of user."

Question: "Why is `HandlingEvent` important?"

Answer:
"Because it stores the history of package movement. Without it, the app would only know the current package row. With `HandlingEvent`, we also know what happened to the package at a certain place and time."

Question: "What is the many-to-many relationship?"

Answer:
"Packages and facilities. A package can go through many facilities, and a facility can process many packages. `HandlingEvent` links them."

Question: "Is truck ID a many-to-many relationship?"

Answer:
"No. In this project, `truckId` is just a field on the `Package` model. The real many-to-many relationship is packages and facilities through handling events."

## Goose
## Technical description script, routing and front-end components

Goose should cover:

- what form routing took for the web server
- what form the components took for the front-end application

### What Goose should say

"I am covering the web server routing and the front-end component structure.

For the web server, routing used Express. In `backend/server.js`, the app mounts two main route groups: `/api/auth` and `/api/packages`.

The auth routes are in `backend/routes/authRoutes.js`. Those routes handle registration and login.

The package routes are in `backend/routes/packageRoutes.js`. Those routes handle create, read, update, delete, and the summary endpoint.

Before any package route runs, the middleware `requireCurrentUser` checks the custom user headers and makes sure the request matches a real stored user.

On the front end, the app uses React function components. The page-level components are `Login`, `Register`, `AdminDashboard`, and `DriverDashboard`.

The app also uses reusable UI components such as `GlassCard`, `Field`, `TextInput`, `SelectInput`, `PrimaryButton`, `SecondaryButton`, `Alert`, and `StatusBadge`.

Routing on the front end is handled in `App.jsx` using React Router. The `PublicOnly` wrapper keeps logged-in users out of public pages, and the `RequireRole` wrapper sends users to the correct dashboard based on their role.

So the app has routing on both sides: Express routing on the back end and page routing on the front end."

### What Goose needs to understand deeply

#### Backend routing

File:

- `backend/server.js`

Important functions:

- `connectDatabase()`
- `startServer()`

What `connectDatabase()` does:

1. It looks for `MONGODB_URI`
2. If that fails, it tries `MONGODB_LOCAL_URI`
3. If that is missing, it falls back to `mongodb://127.0.0.1:27017/packet-tracker`

That means the app is built to try Atlas first, but it can still run locally if Atlas is not available.

What `startServer()` does:

1. Calls `connectDatabase()`
2. Adds `/api/packages`
3. Adds `/api/auth`
4. Creates a simple `/` route that says `"API Running"`
5. Starts listening on port `5000`

That answer is useful if the professor asks:

"How does your server boot up?"

#### Auth routing

File:

- `backend/routes/authRoutes.js`

Routes:

- `POST /register`
- `POST /login`

Controller file:

- `backend/controllers/authController.js`

Main functions:

- `register`
- `login`

How `register` works:

1. Reads `username`, `password`, and `role` from the request body
2. Cleans the username with `trim()`
3. Defaults the role to `driver` unless the role is exactly `admin`
4. Checks for missing username or password
5. If MongoDB is connected, it checks the `User` collection
6. If MongoDB is not connected, it uses `localUserStore`
7. Saves the new user

How `login` works:

1. Reads username and password
2. Finds the user
3. Compares the password
4. If it matches, sends back:
   - `id`
   - `username`
   - `role`

That returned data gets saved in `localStorage` on the front end.

#### Package routing

File:

- `backend/routes/packageRoutes.js`

Routes:

- `POST /api/packages`
- `GET /api/packages`
- `GET /api/packages/summary`
- `GET /api/packages/:id`
- `PUT /api/packages/:id`
- `DELETE /api/packages/:id`

Important detail:

All package routes use this line first:

- `router.use(requireCurrentUser);`

That means package routes are protected.

#### Middleware

File:

- `backend/middleware/requireCurrentUser.js`

This middleware is a key part of the project.

What it checks:

1. `x-user-id`
2. `x-user-username`
3. `x-user-role`

Then it:

1. Looks up the user by ID
2. Makes sure the user still exists
3. Makes sure the username and role in the headers match the saved record
4. Adds that user object to `req.currentUser`

If that fails, it returns:

- `401` for missing or invalid user
- `403` if the session details do not match

That is a very good answer for:

"How do you protect routes?"

#### Front-end routing

File:

- `frontend/src/App.jsx`

Main route structure:

- `/` -> Login
- `/register` -> Register
- `/admin` -> AdminDashboard
- `/driver` -> DriverDashboard

Important wrappers:

- `PublicOnly`
- `RequireRole`

What `PublicOnly` does:

- If the user is already logged in as admin, it redirects to `/admin`
- If the user is already logged in as driver, it redirects to `/driver`
- If there is no logged-in user, it shows the page

What `RequireRole` does:

- If no user exists, it redirects to `/`
- If the user has the wrong role, it redirects to the correct dashboard
- If the role is correct, it shows the page

#### Front-end components

The app uses React function components.

There are two levels:

##### Page components

- `Login.jsx`
- `Register.jsx`
- `AdminDashboard.jsx`
- `DriverDashboard.jsx`

##### Reusable components

File:

- `frontend/src/components/ui.jsx`

Examples:

- `AppShell`
- `PageFrame`
- `GlassCard`
- `Field`
- `TextInput`
- `SelectInput`
- `PrimaryButton`
- `SecondaryButton`
- `Alert`
- `StatusBadge`
- `EmptyState`

Why this matters:

Reusable components make the UI more consistent. Instead of building every button and form input from scratch each time, the app reuses the same building blocks.

#### Important front-end functions Goose can name

In `Login.jsx`:

- `handleLogin`

What it does:

1. Stops the form from refreshing the page
2. Sends username and password to `/auth/login`
3. Saves the returned user data in `localStorage`
4. Redirects to `/admin` or `/driver`

In `Register.jsx`:

- `handleRegister`

What it does:

1. Sends username, password, and role to `/auth/register`
2. If register works, goes back to the login page

In `frontend/src/lib/api.js`:

There is an Axios request interceptor.

That means before every request, it adds the stored user headers automatically.

That is a great small technical detail to mention.

### Professor question backup for Goose

Question: "What form did routing take for the web server?"

Answer:
"It used Express routing with two main route groups: `/api/auth` and `/api/packages`. The auth routes handle login and registration. The package routes handle CRUD and summary data, and they are protected by middleware."

Question: "How do you know which user is making a request?"

Answer:
"The front end sends custom headers with the stored user ID, username, and role. The middleware `requireCurrentUser` checks those values against the stored user record before allowing the request."

Question: "What form did the front-end components take?"

Answer:
"They were React function components. We had page components like `Login` and `AdminDashboard`, and reusable UI components like buttons, cards, inputs, alerts, and badges."

Question: "Why do you have routing on both front end and back end?"

Answer:
"The front-end routing decides which page the user sees in the browser. The back-end routing decides which server logic runs when the browser sends a request."

## Eduardo
## Live demo script

### What Eduardo should say during the demo

"Now I am going to show how the app works from the user side and explain what the server is doing in the background.

First, the app opens on the login page. That matches the project requirement that login is the first screen.

If a new user needs an account, they can go to the register page. On that page, the front end sends the username, password, and role to `/api/auth/register`.

After that, the user can log in. When login succeeds, the server sends back the user ID, username, and role. The front end saves that data in `localStorage`.

That saved user data matters because the Axios client uses it to add the custom headers on future requests.

Now I will log in as an admin.

On the admin dashboard, the admin can see all shipments in the system. The admin can also create a new package, assign it to a driver username, edit it, or remove it.

When I create a package, the app is not only saving one package row. In the backend, it also builds tracking context. That means it can create or find the pickup facility, create or find the dropoff facility, create or find the route, and then create a handling event to log what happened.

Now I will show the driver side.

When I log in as a driver, the driver only sees packages assigned to that driver. The driver dashboard uses the same package route, but the back end filters the results based on `req.currentUser.id`.

The driver can update the package status. For example, if the status changes to `in_transit` or `delivered`, the backend updates the package and also writes another handling event. That means the app keeps a history of changes, not just the newest value.

So the live demo shows the full flow: register, login, role-based routing, admin control, driver-specific access, package updates, and tracking history.

That is our Packet Tracker project."

### What Eduardo needs to understand deeply

#### Admin dashboard flow

File:

- `frontend/src/pages/AdminDashboard.jsx`

Main functions:

- `fetchPackages`
- `fetchDataModelSummary`
- `loadDashboardData`
- `handleSubmit`
- `handleEdit`
- `handleDelete`
- `handleLogout`

What happens when admin opens the page:

1. `useEffect(...)` runs
2. It calls `loadDashboardData()`
3. That loads package data and summary data

What summary data includes:

- entity counts
- many-to-many explanation
- driver directory
- recent handling events

That comes from:

- `getDataModelSummary` in `backend/controllers/packageController.js`

What happens when admin creates a package:

1. Front end builds a payload with `buildPayload(formData)`
2. Sends `POST /api/packages`
3. Backend runs `createPackage`
4. Backend builds a package payload using `buildPackagePayload`
5. Backend builds tracking context using `buildTrackingContext`
6. Backend saves the package
7. Backend creates a handling event using `recordHandlingEvent`
8. Front end refreshes the dashboard

That is a very strong answer if someone asks:

"What really happens when you press Create?"

#### Driver dashboard flow

File:

- `frontend/src/pages/DriverDashboard.jsx`

Main functions:

- `fetchPackages`
- `handleSubmit`
- `handleEdit`
- `handleUpdateStatus`
- `handleDelete`
- `handleLogout`

What is different from admin:

- Drivers do not assign `ownerUsername`
- Drivers only send package data for themselves
- The server uses the current logged-in driver as the owner
- Drivers only see their own packages

That logic is enforced in the backend in two places:

1. `canAccessPackage(pkg, currentUser)`
2. `getAllPackages`, which filters by `ownerUserId` for drivers

If the professor asks:

"How do you stop a driver from editing another driver's package?"

Eduardo can say:

"The backend checks package ownership in `canAccessPackage`. Even if someone tried to change requests manually, the server would still compare the package owner to the current logged-in user."

#### The best backend helper functions to mention

These are some of the smartest parts of the backend:

##### `buildPackagePayload(...)`

Why it matters:

- Picks only allowed fields
- Lets admins edit more fields than drivers
- Resolves the package owner
- Validates required values
- Normalizes data before save

This function is a good example of business logic.

##### `buildTrackingContext(pkg)`

Why it matters:

- Finds or creates the pickup facility
- Finds or creates the dropoff facility
- Finds or creates the route
- Decides the current facility based on package status

That is the function that makes package status feel like movement through the system.

##### `recordHandlingEvent(...)`

Why it matters:

- Creates a tracking log entry
- Connects package, facility, route, and user
- Saves `eventType`
- Saves `statusSnapshot`

This function is one of the best things to mention in the demo because it shows the app does more than normal CRUD.

##### `getDataModelSummary(...)`

Why it matters:

- Counts entities
- Explains the many-to-many relationship
- Returns driver directory data
- Returns recent handling events

This gives the admin dashboard extra context, not just package rows.

### Live demo order Eduardo should use

#### Step 1. Show login

Say:

"This is the first screen. The app starts at the login page."

Behind the scenes:

- route is `/`
- page is `Login.jsx`

#### Step 2. Show register

Say:

"A new user can go to the register page and create an account."

Behind the scenes:

- request goes to `POST /api/auth/register`
- controller function is `register`

#### Step 3. Log in as admin

Say:

"After login, the server sends back the user ID, username, and role, and the browser saves it."

Behind the scenes:

- login function is `login`
- front-end function is `handleLogin`
- saved in `localStorage`

#### Step 4. Show admin dashboard

Say:

"The admin can see every package and assign packages to drivers."

Behind the scenes:

- page is `AdminDashboard.jsx`
- data comes from `/api/packages` and `/api/packages/summary`

#### Step 5. Create package

Say:

"When I create this package, the app also creates tracking context behind the scenes."

Behind the scenes:

- `createPackage`
- `buildPackagePayload`
- `buildTrackingContext`
- `recordHandlingEvent`

#### Step 6. Log out and log in as driver

Say:

"Now I am switching roles so you can see the access control difference."

Behind the scenes:

- `clearStoredUser()` removes the saved user
- new login changes which dashboard React Router allows

#### Step 7. Show driver dashboard

Say:

"The driver only sees records assigned to that driver."

Behind the scenes:

- server filters packages by `ownerUserId`

#### Step 8. Change status

Say:

"When I change the status, the backend updates the package and writes another handling event."

Behind the scenes:

- `handleUpdateStatus`
- `updatePackage`
- `recordHandlingEvent`

#### Step 9. Wrap up

Say:

"That shows the full stack working together: React in the browser, Express on the server, MongoDB in the database, and role-based package tracking across the whole app."

### Professor question backup for Eduardo

Question: "How does the app know whether to show admin or driver pages?"

Answer:
"The front end saves the user role after login. `App.jsx` uses `RequireRole` to send admins to `/admin` and drivers to `/driver`."

Question: "How is security handled?"

Answer:
"The front end helps with routing, but the real protection is on the backend. The middleware `requireCurrentUser` checks the custom headers, validates the user, and the package controller checks access rules like ownership."

Question: "What is the difference between simple CRUD and your tracking logic?"

Answer:
"Simple CRUD would only save the package row. Our app also builds facilities, routes, and handling events, so it tracks what happened to the package and where."

Question: "What happens if MongoDB is not available?"

Answer:
"The server first tries the main MongoDB URI. If that fails, it tries a local fallback. For users, there is also a local user store helper so the auth flow can still work in fallback mode."

## One-page cheat answers for everyone

If anyone blanks out, these are the safest short answers.

### What technologies did you use?

"React, React Router, Axios, Tailwind CSS, Node.js, Express, MongoDB, and Mongoose."

### What are the main routes?

"On the front end: `/`, `/register`, `/admin`, `/driver`. On the back end: `/api/auth` and `/api/packages`."

### What are the five entities?

"User, Package, Facility, Route, and HandlingEvent."

### What is the main many-to-many relationship?

"Packages and Facilities, connected through HandlingEvent."

### How do you protect package routes?

"With the `requireCurrentUser` middleware and ownership checks in the package controller."

### What makes this more than a basic package table?

"The app logs tracking history through handling events and builds route and facility data behind the scenes."

## Final coaching note

If the professor asks something hard, do not rush.

Use this pattern:

1. Name the file or function if you remember it
2. Explain the job in one simple sentence
3. Then give one example

Example:

"That is handled in `requireCurrentUser`. Its job is to check the current user headers before package routes run. For example, if the ID and role do not match the stored user, the server rejects the request."

That answer style sounds calm, clear, and real.
