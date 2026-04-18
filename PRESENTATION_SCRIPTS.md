# Group 22 — Packet Tracker: Presentation Scripts
**CIS 4004 | Spring 2026**
**Total Target Time: 10–11 minutes** (Slides ~5 min | Live Demo ~5 min)

---

## TIMING GUIDE

| Segment | Speaker | Slide | Target Time |
|---|---|---|---|
| Title + Introduction | Guiscard Marcelin | Slides 1–2 | ~1 min 20 sec |
| Distribution of Work | Liliana Flores | Slide 3 | ~55 sec |
| Tech Intro + Routing | Eduardo Canelas | Slides 4–5 | ~50 sec |
| Collections | Eduardo Canelas | Slide 6 | ~35 sec |
| Components | Ashton Moulton | Slide 7 | ~40 sec |
| Entities | Ashton Moulton | Slide 8 | ~35 sec |
| Many-to-Many | Avery Brewer | Slide 9 | ~40 sec |
| **SLIDES TOTAL** | | | **~5 min 35 sec** |
| Live Demo | Eduardo (driver), all assist | Slide 10 | ~5 min |
| **GRAND TOTAL** | | | **~10–11 min** |

---
---

## GUISCARD MARCELIN
### Slides 1 & 2 — Title + Introduction
**Estimated time: ~1 min 20 sec**

> *(Advance to Title Slide)*

"Good [morning/afternoon] everyone. We are Group 22, and today we're presenting Packet Tracker — a full-stack web application built with the MERN stack."

> *(Advance to Introduction Slide)*

"Let me introduce the team. My name is Guiscard Marcelin. With me are Liliana Flores, Avery Brewer, Ashton Moulton, and Eduardo Canelas.

So — why Packet Tracker? Online shopping is more popular than ever, but most tracking systems are cluttered and hard to use. We wanted to try a different approach: something clean, simplified, and smooth. The relevant thing here is that this isn't just a display app — it's a fully operational system where packages are created, assigned to routes, processed through facilities, and tracked every step of the way.

I'll pass it over to Liliana to talk about how we divided the work."

---
---

## LILIANA FLORES
### Slide 3 — Distribution of Work
**Estimated time: ~55 sec**

> *(Advance to Distribution of Work Slide)*

"Thanks, Guiscard. For this project we used the full MERN stack — MongoDB Atlas, Express.js, React, and Node.js.

Here's how the team split the work:
- Guiscard handled React integration — wiring the front end to our back-end API.
- I focused on styling and planning — keeping the UI consistent and the team on track.
- Avery also worked on styling and planning alongside me.
- Ashton handled React integration as well — building out the component architecture and page interactions.
- And Eduardo built the entire backend — the Express server, routes, and MongoDB connection.

I'll hand it off to Eduardo to walk through the technical details."

---
---

## EDUARDO CANELAS
### Slides 4 & 5 — Technical Description Overview + Routing
**Estimated time: ~50 sec**

> *(Advance to Technical Description Overview Slide)*

"Now let's talk about the architecture. There are five technical questions we'll answer — I'll cover the first two."

> *(Advance to Routing Slide)*

"For routing, the web server used Express.js with two main route groups. The first is `/api/auth`, which handles user registration and login. The second is `/api/packages`, which handles all CRUD operations — creating, reading, updating, and deleting packages — plus a summary endpoint. Every package route is protected by authentication middleware that verifies the user before any request goes through."

---

### Slide 6 — Collections
**Estimated time: ~35 sec**

> *(Advance to Collections Slide)*

"For the database, we used MongoDB Atlas and defined our collections with Mongoose models. We have five collections: Users, Packages, Facilities, Routes, and HandlingEvents. Each one is schema-defined, which enforces data types and required fields throughout the application.

I'll pass it to Ashton to cover the front end."

---
---

## ASHTON MOULTON
### Slide 7 — Components
**Estimated time: ~40 sec**

> *(Advance to Components Slide)*

"Thanks, Eduardo. For the front end, we used React function components organized into two categories: page components and reusable UI components.

Our main pages are Login, Register, the Admin Dashboard, and the Driver Dashboard. On top of those, we built reusable pieces like buttons, forms, cards, alerts, and status badges. Navigation between pages uses React Router with role-based guards built in — if you try to access the wrong route for your role, the app redirects you automatically."

---

### Slide 8 — Entities
**Estimated time: ~35 sec**

> *(Advance to Entities Slide)*

"For the data model, we have five entities. First, User — with a role of admin or driver. Second, Package — with status, weight, delivery type, and location fields. Third, Facility — a location like a warehouse or distribution center. Fourth, Route — a defined path between two facilities. And fifth, HandlingEvent — a tracking record that logs what happened to a package at a specific facility and time.

I'll hand it to Avery for the many-to-many relationship."

---
---

## AVERY BREWER
### Slide 9 — Many-to-Many Relationship
**Estimated time: ~40 sec**

> *(Advance to Many-to-Many Slide)*

"The main many-to-many relationship is between Packages and Facilities. A single package can travel through many facilities — a warehouse, a distribution center, a retail store. And a single facility processes many packages every day.

We resolved this in MongoDB using the HandlingEvent collection as the junction. Each HandlingEvent links one package to one facility, records the event type, and captures a status snapshot at that moment in time. So HandlingEvent is what bridges packages and facilities.

Now let's see it live. Eduardo?"

---
---

## EDUARDO CANELAS (primary) — all members assist
### Slide 10 — Live Demo
**Estimated time: ~5 minutes**

> *(Advance to Live Demo Slide)*

"Alright, let's walk through the app."

---

**Step 1 — Login Page (~30 sec)**

"When you navigate to the app, the first thing you see is the login page — just like the requirements specify. From here you can log in with an existing account, or click over to register."

> *(Click to Register page)*

---

**Step 2 — Register (~30 sec)**

"On the register page, you enter a username and password. The system rejects duplicate usernames — you'll get an error if you try. New accounts default to the driver role. Admin accounts are set up separately on the backend."

> *(Log in as admin)*

---

**Step 3 — Admin Dashboard (~1 min 30 sec)**

"Now I'm in as an admin. The admin dashboard gives full access to package management. I can create a new package..."

> *(Create a package)*

"...update it..."

> *(Update the package — change status or field)*

"...and delete it."

> *(Delete the package)*

"The admin sees all packages in the system, not just their own. That's the full CRUD experience on the admin side."

---

**Step 4 — Driver Dashboard (~1 min 30 sec)**

> *(Log out, log back in as a driver)*

"Now I'm in as a driver. Notice the difference — the driver only sees their own packages. They can create, update, and delete their own data, but they have no access to another user's packages.

That access control is enforced in two places: on the front end through React Router guards, and on the back end through our authentication middleware. So even if someone tried to manipulate a request directly, the server would reject it."

> *(Create a package as driver, show status tracking)*

"Here I'll create a package and show how the status updates flow through."

---

**Step 5 — Wrap-up (~30 sec)**

"And that's the full flow — login, role-based routing, CRUD operations, package tracking through facilities, all running on the MERN stack end to end.

That wraps up our presentation. Thank you."

---
---

## QUICK REFERENCE — WHO SAYS WHAT

| Person | What They Cover |
|---|---|
| **Guiscard** | Opens the presentation, introduces team, explains project topic and why |
| **Liliana** | Technologies used, who did what |
| **Eduardo** | Technical overview transition, routing slide, collections slide, runs the live demo |
| **Ashton** | Components slide, entities slide |
| **Avery** | Many-to-many relationship slide, hands off to demo |

---

## TIPS FOR DELIVERY

- Speak slowly — you will naturally speed up when nervous.
- Make eye contact with the class, not just the screen.
- When advancing slides, pause for one breath before speaking again.
- During the demo: narrate every click. Don't go silent while navigating.
- If something breaks during the demo, stay calm and say: *"Let me just refresh that quickly"* — the professor expects minor technical hiccups.
- End strong — the last 30 seconds of the demo is what the class remembers.
