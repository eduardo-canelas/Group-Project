# Packet Tracker Project

## Purpose
This project is a MERN-stack web application for tracking package movement and accountability across drivers, facilities, and routes.  
It supports two roles (`admin` and `driver`) with role-based access and full package lifecycle updates.

## Tech Stack
- Frontend: React + Vite + React Router + Axios + Tailwind CSS
- Backend: Node.js + Express + Mongoose
- Database: MongoDB (Atlas primary URI, local Mongo fallback supported by backend)

## Project Structure
- `frontend/` React single-page application
- `backend/` Express API and Mongo models
- `backend/models/` data model entities
- `backend/routes/` API routes
- `backend/controllers/` business logic

---

## Requirements

1. MERN stack used  
Implemented with Node.js, Express.js, MongoDB, and React.

2. Two user types + login  
Roles are `admin` and `driver`, with login endpoint and role-based routing.

3. First screen is login + user registration + no duplicate usernames  
Frontend default route is `/` (Login).  
Register screen is available at `/register`.  
Duplicate usernames are blocked in backend logic and `User` schema uniqueness.

4. Correct screens for correct users  
Frontend uses protected role routes:
- Admin users -> `/admin`
- Driver users -> `/driver`
- Wrong-role access redirects automatically.

5. Admin has separate functionality from Standard User  
Admin dashboard can view all records, assign driver ownership, and manage full board.  
Driver dashboard only shows and manages that driver’s own records.

6. Admin can perform CRUD  
Admin can create, read, update, and delete package records.

7. Standard user can CRUD only own data  
Drivers can create/update/delete records owned by their account only.  
Backend enforces ownership checks before update/delete/view.

8. At least 5 entities in data model  
Implemented entities:
- `users`
- `packages`
- `facilities`
- `routes`
- `handlingevents`

9. At least one many-to-many relationship  
Many-to-many is implemented as:
- `Package <-> Facility` through `HandlingEvent` join records.

---

## Data Summary

- `User`: username, password hash, role (`admin` or `driver`)
- `Package`: package details, owner fields, route/facility pointers, status history reference
- `Facility`: normalized location records (warehouse, distribution center, retail store, etc.)
- `Route`: start facility to end facility with distance/time metadata
- `HandlingEvent`: join/event record connecting package, facility, user, and route with timestamp and status snapshot

---

## Step-by-Step: Run the Backend

1. Open a terminal and move to backend:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables in `backend/.env`:
```env
MONGODB_URI=<your_mongodb_atlas_connection_string>
MONGODB_LOCAL_URI=mongodb://127.0.0.1:27017/packet-tracker
```

4. Start backend server:
```bash
npm start
```

5. Confirm backend is running:
- API root: `http://localhost:5000/`
- API base: `http://localhost:5000/api`

Expected startup behavior:
- Backend attempts `MONGODB_URI` first.
- If that fails, backend attempts local fallback URI.
- If no MongoDB connection is available, login/register can fall back to local user storage, but package/facility/route/event features require MongoDB connectivity.

---

## Step-by-Step: Run the Frontend

1. Open a second terminal and move to frontend:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start Vite dev server:
```bash
npm run dev
```

4. Open app:
- Frontend URL: `http://localhost:5173/`

The first screen is the login page, satisfying the assignment requirement.

---

## Walkthrough Demo

1. Start backend and frontend using steps above.
2. Open `http://localhost:5173/`.
3. Confirm login is the first screen.
4. Register two users:
- one `admin`
- one `driver`
5. Login as admin:
- create package records
- assign owner username to driver
- view all package rows
- edit and delete records
- review recent handling events
6. Logout and login as driver:
- verify only driver-owned records are visible
- create a new driver-owned record
- update status on own records
- edit and delete own records
7. Attempt cross-role/cross-owner actions:
- verify backend blocks unauthorized access (403/ownership enforcement).
8. Confirm many-to-many evidence:
- show handling events generated for package movement through facilities.

---

## API Endpoints Used

Auth:
- `POST /api/auth/register`
- `POST /api/auth/login`

Packages (protected by user headers):
- `POST /api/packages`
- `GET /api/packages`
- `GET /api/packages/:id`
- `PUT /api/packages/:id`
- `DELETE /api/packages/:id`
- `GET /api/packages/summary`
