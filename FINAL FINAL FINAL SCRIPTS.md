# FINAL PRESENTATION SCRIPT — Packet Tracker
### CIS 4004 | MERN Stack Web Application | Group 22

---

> **TIMING GUIDE:** ~10 minutes total. Slides = ~5 min. Demo = ~5 min.
> Each slide section is roughly 1–1.5 minutes. Keep it conversational. Breathe.

---

---

# LILIANA FLORES — Introduction

**[Slide: Team Introduction / Topic Overview]**

Hey everyone. I'm Liliana, and this is our team — we have Avery, Ashton, Goose, and Eduardo. Together we built a full-stack web application called **Packet Tracker**.

So what is Packet Tracker? At its core, it's a package management and logistics tracking system. Think of it like a simplified internal tool that a shipping or delivery company might actually use — where you have admins managing packages and drivers out in the field completing deliveries.

We chose this topic because we wanted to build something that felt real. A lot of CRUD apps can feel like just going through the motions, but logistics tracking has actual complexity — you've got different user roles, packages moving through locations, events being recorded along the way. It gave us a reason to really think through our data model instead of just slapping a form on a database.

What we found interesting about it is how the data connects. A package doesn't just sit there — it moves through facilities, gets handled by drivers, and every step of that journey is tracked. That gave us the chance to implement a real many-to-many relationship in our database, which we'll get into shortly.

So with that, I'll pass it over to Avery to talk about how we divided the work and what technologies we used.

---

---

# AVERY BREWER — Distribution of Work & Technologies Used

**[Slide: Technologies + Who Did What]**

Thanks Liliana. I'm Avery, and I'll walk you through the tech stack and how the work broke down across the team.

On the technology side, we built this using the **MERN stack** — that's **MongoDB** for the database, **Express.js** for the server, **React** for the front-end, and **Node.js** as the runtime. On top of that, we used **Mongoose** to model our data, **Axios** to handle HTTP requests from the front-end, **React Router** for client-side navigation, and **Tailwind CSS** for styling.

As for who did what — here's how it broke down:

**Ashton** handled the database side — designing the collections, writing the Mongoose schemas, and making sure all the relationships between our entities were modeled correctly.

**Goose** took on the React integration — setting up routing between pages, building out the front-end component structure, and wiring the UI to our backend.

**Eduardo** handled the backend — writing all the API routes, building out the core business logic, managing authentication, and making sure data flowed correctly between the front-end and the database. He'll also be running the live demo.

**Liliana** led the introduction, helped with planning and project direction, and contributed to the UI styling and overall look of the app.

And I focused on keeping the presentation organized, the overall planning and structure of the project, and contributed to the styling and visual design side as well.

I'll hand it off now to Ashton, who's going to walk you through the database.

---

---

# ASHTON MOULTON — Technical Description: Database

**[Slide: Collections / Entities / Many-to-Many]**

Thanks Avery. I'm Ashton, and I'll cover the database side of things.

We have **five main entities** in our data model, each represented as a MongoDB collection using Mongoose schemas.

The first is **User**. A user has a username and a password — the password is hashed using bcrypt, so we're not storing anything in plain text. Users also have a **role**, either admin or driver, and that role controls what they can see and do in the app.

The second is **Package**. This is the core of the whole application. A package has a unique ID, a description, an amount, a delivery type, a truck ID, pickup and dropoff locations, a status, and it's linked to the user who owns it by both ID and username.

Third is **Facility**. A facility represents a physical location — things like warehouses, distribution centers, retail stores, customer addresses, or in-transit stops. Each facility has a name, a normalized name, and a location type.

Fourth is **Route**. A route connects two facilities — a start and an end. Both of those are references to Facility documents.

And fifth is **HandlingEvent**. This is our most important collection from a data modeling standpoint, because it's our **junction collection**. It holds references to a package, a facility, a user, and a route — plus an event type and a status snapshot of the package at that moment.

This is where our **many-to-many relationship** lives. A single package can pass through many facilities over the course of its delivery. And a single facility can process many packages. HandlingEvent sits in the middle and connects them. So instead of embedding or duplicating data, we use HandlingEvent as a join record — which keeps things clean and gives us a full audit trail of where every package has been.

I'll pass it over to Goose to talk about the front-end and routing.

---

---

# GUISCARD MARCELIN ("GOOSE") — Technical Description: Routing & Front-End Components

**[Slide: Backend Routes / Frontend Pages / Components]**

Thanks Ashton. I'm Goose, and I'll cover how the routing works and how the front-end is structured.

Starting on the **backend**, all of our API routes follow a clean RESTful pattern under `/api`. We have two auth routes — `POST /api/auth/register` and `POST /api/auth/login` — that handle user creation and login. Then we have a full set of package routes: GET and POST on `/api/packages` for listing and creating, and GET, PUT, and DELETE on `/api/packages/:id` for working with individual packages. We also have a summary endpoint at `/api/packages/summary`. Every single one of those package routes is protected by a `requireCurrentUser` middleware — so you have to be logged in and authenticated to touch any of that data.

On the **front-end**, we used React Router to handle navigation between four main pages: **Login**, **Register**, **AdminDashboard**, and **DriverDashboard**. The page you land on after login depends on your role — admins go to the admin view, drivers go to their own dashboard.

The admin dashboard gives full visibility — you can see all packages in the system, create new ones, edit or delete existing ones, assign packages to drivers, and see a roster of drivers.

The driver dashboard is scoped — drivers can only see and manage the packages assigned to them. Same UI patterns, but restricted to their own data.

To keep things consistent and reusable across both dashboards, we built out a shared component library — things like buttons, form fields, alert messages, cards, status badges, and layout wrappers. This kept the code clean and made it easy to maintain a consistent look across the app.

And speaking of the app in action — I'll hand it over to Eduardo for the live demo.

---

---

# EDUARDO CANELAS — Live Demo

**[Switch to browser / localhost]**

Alright, let's see it running. I'm Eduardo, and I built the backend — so I'll walk you through how the app actually works end to end.

We've got the app running locally. I'll start by logging in as an **admin** user.

**[Log in as admin]**

Once logged in as admin, you can see the full dashboard. All packages in the system are listed here. I can see the status of each one, who it's assigned to, where it's going.

Let me **create a new package**.

**[Click Create / fill out the form]**

I'll fill in a description, set a pickup location and a dropoff location, set a delivery type, and submit.

**[Submit the form]**

When that package is created, a few things happen automatically on the backend — the server creates or upserts Facility records for both the pickup and dropoff locations, creates a Route connecting those two facilities, and creates a HandlingEvent that links the package to its current facility. All of that happens in a single request without the front-end needing to know about it.

Now let me show the **role-based access**. I'll log out and log in as a driver.

**[Log out, log in as driver]**

As a driver, you can see only the packages assigned to you. I can update status or edit details — but I cannot see or touch anyone else's packages. That restriction is enforced on the backend, not just hidden in the UI.

**[Show edit or status update]**

And that's the core of the application — packages, facilities, routing, handling events, and role-based access all working together.

Thanks for watching — I'll pass it back for any questions.

---

---

# TEAM CLOSING — Anyone Can Deliver This

**[Last 30 seconds — all together or whoever is wrapping up]**

So to wrap up — Packet Tracker is a full MERN stack application with real role-based authentication, a proper relational data model using a many-to-many junction collection, a RESTful API, and a clean React front-end. We're proud of how it came together, and we're happy to answer any questions you have.

Thank you.

---

---

# QUICK Q&A ANSWERS
### One-line answers if the professor asks questions

| Question | Answer |
|---|---|
| What is the many-to-many relationship? | Packages and Facilities — a package passes through many facilities, and a facility handles many packages. HandlingEvent is the junction collection. |
| How did you handle authentication? | JWT-based login with a `requireCurrentUser` middleware protecting all package routes. |
| How are passwords stored? | Hashed using bcrypt — never stored in plain text. |
| What is a HandlingEvent? | A junction document that links a Package, Facility, User, and Route together with an event type and a status snapshot. |
| What happens when a package is created? | Facility records are upserted for pickup and dropoff, a Route is created between them, and a HandlingEvent is recorded automatically. |
| How does role-based access work? | The user's role (admin or driver) is stored on the User document. The backend enforces scoping on every request — drivers only see their own packages. |
| What is Mongoose used for? | Defining schemas and interacting with MongoDB — it gives us structure and validation on top of a schema-less database. |
| Why MongoDB over a relational DB? | Flexible document model worked well for packages with varying fields; we still modeled relationships explicitly using references and a junction collection. |
| What does Tailwind CSS do? | Utility-first CSS framework — lets us style components inline without writing custom CSS files. |
| What does Axios do? | Handles HTTP requests from React to our Express API — it's the bridge between the front-end and the backend. |

---

---

# CHEAT SHEETS
### One card per person — key bullet reminders if someone freezes

---

## LILIANA — Cheat Sheet

- We are: Liliana, Avery, Ashton, Goose, Eduardo
- App name: **Packet Tracker** — a package logistics tracking system
- Why this topic: real-world complexity, role-based access, meaningful data relationships
- What's interesting: packages move through locations, every step is tracked
- Hand off to: **Avery** for tech stack and distribution of work

---

## AVERY — Cheat Sheet

- Stack: **MongoDB, Express, React, Node** (MERN)
- Also: **Mongoose, Axios, React Router, Tailwind CSS**
- Ashton → database modeling and schemas
- Goose → React routing and component structure
- Eduardo → backend API routes, business logic, demo
- Liliana → intro, planning, project direction, UI styling
- Me (Avery) → presentation structure, organization, styling/planning
- Hand off to: **Ashton** for database

---

## ASHTON — Cheat Sheet

- 5 entities: **User, Package, Facility, Route, HandlingEvent**
- User: username, bcrypt-hashed password, role (admin/driver)
- Package: packageId, description, amount, deliveryType, truckId, locations, status, ownerUserId
- Facility: name, normalizedName, location type
- Route: startFacility (ref) → endFacility (ref)
- HandlingEvent: links Package + Facility + User + Route — **this is the junction collection**
- Many-to-many: **Packages ↔ Facilities** through HandlingEvent
- Hand off to: **Goose** for routing and front-end

---

## GOOSE — Cheat Sheet

- Auth routes: POST `/api/auth/register`, POST `/api/auth/login`
- Package routes: GET/POST `/api/packages`, GET/PUT/DELETE `/api/packages/:id`, GET `/api/packages/summary`
- All package routes protected by `requireCurrentUser` middleware
- 4 frontend pages: **Login, Register, AdminDashboard, DriverDashboard**
- Admin: full CRUD, assign packages, see all drivers
- Driver: scoped to their own packages only
- Reusable components: buttons, forms, alerts, cards, status badges, layout wrappers
- Hand off to: **Eduardo** for demo

---

## EDUARDO — Cheat Sheet

- Log in as admin → show full dashboard
- Create a package → show the form, fill it out
- After create: Facility upserted, Route created, HandlingEvent recorded — **automatically**
- Log out → log in as driver → show scoped view
- Driver can only see their own packages — enforced on the backend
- Show an edit or status update
- Close: "That's the core of the app — thanks for watching"

---

*End of Script — Good luck everyone!*
