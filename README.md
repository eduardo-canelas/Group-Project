# Packet Tracker Project

## project overview
This is our CIS 4004 MERN-stack single-page app that tracks packages across drivers, facilities, and routes. The goal is simple: admins assign packages to drivers, drivers update only their own shipments, and the system logs handling events as packages move.

## tech stack
- Frontend: React + Vite + React Router + Axios + Tailwind CSS
- Backend: Node.js + Express + Mongoose
- Database: MongoDB

## what the app does
- Login is the first screen. New users can register with a role.
- Two roles: `admin` and `driver`.
- Admins can see every package, assign drivers, and do full CRUD.
- Drivers can only see and edit their own packages.
- Every create/update writes a handling event so we can track history.
- Admins also see a driver roster and recent handling events.

## requirement checklist
1. MERN stack
We used Node.js, Express.js, MongoDB, and React.

2. Two user types with login
Roles are `admin` and `driver`. Login happens through `/api/auth/login`.

3. Login is the first screen + registration + no duplicate usernames
The default route is `/` (Login). Registration is `/register`. The `User` model enforces unique usernames.

4. Correct screens for correct users
Role-based routing sends admins to `/admin` and drivers to `/driver`.

5. Admin vs standard user features
Admins have a full management dashboard. Drivers only manage their own shipments.

6. Admin CRUD
Admins can create, read, update, and delete package records.

7. Standard user CRUD only for own data
Drivers can only read, create, update, and delete packages assigned to them.

8. At least 5 entities
We use these entities: `User`, `Package`, `Facility`, `Route`, `HandlingEvent`.

9. At least one many-to-many relationship
Packages and facilities are many-to-many through `HandlingEvent`.

## data model summary
- User: username, password (hashed), role
- Package: packageId, description, amount, deliveryType, truckId, pickupLocation, dropoffLocation, status, owner, route, currentFacility
- Facility: name, normalizedName, location type
- Route: startFacility, endFacility
- HandlingEvent: package, facility, route, user, eventType, statusSnapshot, timestamp

## TA quick start backend/frontend
1. Open two terminals.
2. Backend:
```bash
cd backend
npm install
npm run dev
```
3. Frontend:
```bash
cd frontend
npm install
npm run dev
```
4. Open the app at `http://localhost:5173/`.
5. The API runs at `http://localhost:5000/`.

## MongoDB access

MongoDB Atlas
- The Atlas network allowlist is set to `0.0.0.0/0` so any IP can connect.
- TA only needs the connection string below (it includes the username/password).
- The Atlas user has `readWrite` access to the project database.
- Create a backend `.env` file with:
```bash
MONGODB_URI="mongodb+srv://TA:TA123@cis-database.vgw1ec7.mongodb.net/packet-tracker?appName=CIS-Database"
```
local MongoDB
- Install and run MongoDB locally.
- The backend will fall back to `mongodb://127.0.0.1:27017/packet-tracker` automatically, or you can set:
```bash
MONGODB_LOCAL_URI="mongodb://127.0.0.1:27017/packet-tracker"
```

## collections used in MongoDB
The app creates these collections automatically:
- `users`
- `packages`
- `facilities`
- `routes`
- `handlingevents`

## basic demo flow
1. Register two users: one `admin`, one `driver`.
2. Log in as admin and create a package assigned to the driver.
3. Log out, log in as driver, and verify only assigned packages appear.
4. Driver updates status and edits their own shipment.
5. Admin sees the updates and can delete records if needed.

## API endpoints
Auth:
- `POST /api/auth/register`
- `POST /api/auth/login`

Packages protected by headers set from the frontend:
- `POST /api/packages`
- `GET /api/packages`
- `GET /api/packages/summary`
- `GET /api/packages/:id`
- `PUT /api/packages/:id`
- `DELETE /api/packages/:id`
