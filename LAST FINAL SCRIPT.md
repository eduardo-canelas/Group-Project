# LIVE DEMO SCRIPT — Eduardo

---

## BEFORE YOU START
- Backend running, frontend running, browser on the login page
- One admin account and one driver account ready to go
- At least one shipment already assigned to the driver

---

## 1. LOGIN PAGE

**SAY:**
"The first screen is the login page. No one gets in without authenticating first. New users can register here with a username and password — no duplicate usernames are allowed. Passwords are hashed before they're stored. Let me log in as an Admin."

**DO:** Log in as admin.

---

## 2. ADMIN DASHBOARD

**SAY:**
"Each role gets a different dashboard. An admin can't be sent to the driver view, and a driver can't reach this page — that's enforced on both the front end and the back end."

**SAY:**
"Up top we have two panels. The first groups all packages by the driver they're assigned to, showing which trucks they're operating and the status of each package. The second shows every registered driver account — ready to be assigned a shipment."

---

## 3. ADMIN — CREATE

**DO:** Scroll to the New Shipment form. Fill it in:
- Driver username: `driver1`
- Package ID: `9901`
- Item: `Laptop Boxes`
- Quantity: `50`
- Truck ID: `T-007`
- Pickup: `Amazon Warehouse`
- Drop off: `Best Buy`
- Delivery type: `Express`
- Status: `Pending`

**SAY:**
"When this shipment is saved, the backend automatically creates a Facility record for Amazon Warehouse and one for Best Buy, links them with a Route, and logs a HandlingEvent that joins the package, the facility, the route, and the user. That's the many-to-many relationship — a package can move through many facilities, and a facility can handle many packages. HandlingEvent is the junction. That also gives us our five entities: User, Package, Route, Facility, and HandlingEvent."

**DO:** Click **Create shipment**.

---

## 4. ADMIN — UPDATE & DELETE

**DO:** Click **Edit** on the row you just created. Change status to `In Transit`. Click **Update shipment**.

**SAY:**
"Every update writes a new HandlingEvent — the full status history is tracked."

**DO:** Click **Remove** on a different row.

**SAY:**
"And Delete removes the record along with all its associated events. Full CRUD covered."

---

## 5. DRIVER VIEW

**DO:** Log out. Log in as driver.

**SAY:**
"Now as a Driver. Drivers only see their own packages — the API filters by user ID on every request. They can't access another driver's records, even with a direct API call."

---

## 6. DRIVER — CREATE, UPDATE, DELETE

**DO:** Fill the driver form:
- Package ID: `5502`
- Item: `Water Bottles`
- Quantity: `200`
- Truck ID: `T-012`
- Pickup: `Distribution Center`
- Drop off: `Publix`
- Status: `Pending`

**SAY:**
"Drivers create their own records. There's no field to assign it to someone else — that's removed at the controller level."

**DO:** Click **Create my record**. Then use the status dropdown in the table to change a package to `Delivered`.

**SAY:**
"They can update status right from the table. They can also edit and delete — but only their own records. The server returns a 403 if they try to touch anyone else's."

---

## 7. WRAP UP

**DO:** Log out. Stay on the login page.

**SAY:**
"To close out — every requirement is covered. Login-first access, two separate user roles, no duplicate usernames, role-based dashboards, full CRUD for admins, scoped CRUD for drivers, five entities in the data model, and a many-to-many relationship between packages and facilities. All built on the MERN stack. That's our application."

---

## IF THE PROFESSOR ASKS

**"How does auth work — is it JWT?"**
No JWT. Login returns the user's ID, username, and role. Those are stored in localStorage and sent as headers on every request. The server re-validates them against the database every time.

**"What did routing look like on the server?"**
Two route files. `authRoutes` handles register and login. `packageRoutes` handles all CRUD. Both are mounted under `/api`. All package routes are protected by the `requireCurrentUser` middleware.

**"What are the MongoDB collections?"**
Five: `users`, `packages`, `routes`, `facilities`, `handlingevents`.

**"What did the front-end components look like?"**
Four page components: Login, Register, AdminDashboard, DriverDashboard. One shared UI file with reusable buttons, inputs, and cards. Three lib files for API calls, auth helpers, and form field definitions.

**"Explain the many-to-many more."**
A package travels through multiple facilities — a warehouse, a truck in transit, a store for delivery. Each facility handles many packages. HandlingEvent is the junction document that records the package, the facility, the route, the user, and a status snapshot every time something changes.

**"How do you stop drivers from touching each other's data?"**
Two layers. The API only returns a driver's own records, so other packages never appear in the UI. And on every update or delete, the server checks that the package's owner ID matches the requesting user. If not, it's a 403.

**"How are duplicate usernames prevented?"**
The username field has `unique: true` in the schema, which creates a database-level index. The controller also does a lookup before saving. Either check will block a duplicate.

---

## IF SOMETHING BREAKS

| Problem | Fix |
|---|---|
| Backend down | Run `node server.js` in `/backend` |
| Frontend down | Run `npm run dev` in `/frontend` |
| Wrong credentials | Register a new account live — it shows requirement 3 |
| Empty board | Create records fresh — it's a better demo anyway |
