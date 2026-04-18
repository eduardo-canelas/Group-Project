# Packet Tracker presentation final rework

This file keeps the same slide flow as the current presentation.

The goal is:

- less text on the slides
- easier for the team to present
- full details moved into speaker notes
- no major content gaps if the professor asks questions

Important:

I did not change the slide order in this file.

The current slide flow stays:

1. Title
2. Introduction
3. Distribution of Work
4. Technical Description Overview
5. Routing
6. Collections
7. Components
8. Entities
9. Many-to-many relationship
10. Live Demo

If you want to update the actual deck, use the short bullet content from each slide section below and put the longer content in the PowerPoint speaker notes.

## 12-minute timing plan

This timing includes the demo.

### Target breakdown

1. Slide 1: Title
   - 0:20

2. Slide 2: Introduction
   - 1:20

3. Slide 3: Distribution of Work
   - 1:10

4. Slide 4: Technical Description Overview
   - 0:30

5. Slide 5: Routing
   - 1:00

6. Slide 6: Collections
   - 1:00

7. Slide 7: Components
   - 1:00

8. Slide 8: Entities
   - 0:50

9. Slide 9: Many-to-many relationship
   - 0:50

10. Slide 10: Live Demo
   - 4:00

### Total

- Slides before demo: about 8:00
- Live demo: about 4:00
- Full presentation: about 12:00

### Best speaker pacing

- Liliana
  - Slides 1 and 2
  - about 1:40 total

- Avery
  - Slide 3
  - about 1:10

- Technical transition
  - Slide 4
  - about 0:30

- Goose
  - Slides 5 and 7
  - about 2:00 total

- Ashton
  - Slides 6, 8, and 9
  - about 2:40 total

- Eduardo
  - Slide 10 demo
  - about 4:00

---

## Slide 1
## Packet Tracker

### Keep on slide

`Packet Tracker`

`Group 22`

### Speaker notes

"Good morning everyone. We are Group 22, and today we are presenting Packet Tracker.

Packet Tracker is a full-stack web application built with the MERN stack. That means it uses MongoDB, Express, React, and Node.js.

Our project focuses on package tracking from an organization point of view. We wanted to build something that feels simple in the user interface but still has real backend logic and real database structure behind it."

---

## Slide 2
## Introduction

### Suggested on-slide text

#### WHO

- Guiscard Marcelin
- Liliana Flores
- Avery Brewer
- Ashton Moulton
- Eduardo Canelas

#### WHAT

- Packet Tracker

#### WHY

- Online shopping is growing
- We wanted a simpler approach

#### RELEVANT INFO

- Clean UI
- Smooth package management

### Speaker notes

"Our project topic is Packet Tracker.

We chose this topic because online shopping is very common now, and that means package tracking matters to both businesses and customers.

We wanted to approach the topic from a developer point of view. Instead of making a crowded system, we wanted to make something simpler and easier to understand.

What makes the project interesting is that it looks simple on the screen, but behind the scenes it includes login, user roles, protected routes, package records, facilities, routes, and tracking history."

### Quick backup facts

- two user roles: admin and driver
- full-stack MERN app
- tracking history saved with `HandlingEvent`

---

## Slide 3
## Distribution of Work

### Suggested on-slide text

#### WHO

- Guiscard Marcelin
- Liliana Flores
- Avery Brewer
- Ashton Moulton
- Eduardo Canelas

#### WHAT

- React Integration
- Styling / Planning
- Styling / Planning
- React Integration
- Backend Programming

#### TECHNOLOGY

- MERN Stack
- MongoDB Atlas
- Express.js
- React
- Node.js

### Speaker notes

"For this project, we used the MERN stack.

On the front end, React built the pages and components. We also used React Router for page navigation, Axios for API requests, and Tailwind CSS for styling.

On the back end, Node.js ran the server, Express handled the routes, and Mongoose helped us define our database models and work with MongoDB Atlas.

For team roles, Guiscard worked on React integration. Liliana and Avery focused on styling and planning. Ashton also worked on React integration. Eduardo built the backend logic, including the Express server, authentication flow, package routes, and MongoDB connection."

### Quick backup facts

- front-end tools also include Tailwind CSS, Axios, React Router
- backend uses Mongoose with MongoDB

---

## Slide 4
## Technical Description

### Suggested on-slide text

`Technical Description`

- Routing
- Collections
- Components
- Entities
- Many-to-many relationship

### Speaker notes

"This slide introduces the five technical questions we answer in the next part of the presentation.

We will explain:

- what form routing took for the web server
- what form the collections took for the database
- what form the front-end components took
- what entities existed in the data model
- what many-to-many relationship existed in the data

This gives a complete picture of how the app works from the server, the database, and the user interface side."

---

## Slide 5
## What form did routing take for the web server?

### Suggested on-slide text

- Express routing
- `/api/auth`
- `/api/packages`
- Login + register
- CRUD + summary

### Speaker notes

"The web server used Express routing.

In `backend/server.js`, the app mounts two main route groups:

- `/api/auth`
- `/api/packages`

The auth routes handle:

- register
- login

The package routes handle:

- create
- read
- update
- delete
- summary

All package routes are protected by the middleware `requireCurrentUser`, which checks the current user headers before the controller logic runs.

So routing is not only about sending requests to the right file. It also helps control who is allowed to do what."

### Quick backup facts

- server file: `backend/server.js`
- auth routes: `backend/routes/authRoutes.js`
- package routes: `backend/routes/packageRoutes.js`
- middleware: `backend/middleware/requireCurrentUser.js`

---

## Slide 6
## What form did the collections take for the database?

### Suggested on-slide text

- MongoDB collections
- Built with Mongoose models
- Users
- Packages
- Facilities
- Routes
- HandlingEvents

### Speaker notes

"The database took the form of MongoDB collections.

Each collection was structured using a Mongoose model and schema.

That means the database was not just random data. Each kind of record had a clear shape.

The main collections were:

- `users`
- `packages`
- `facilities`
- `routes`
- `handlingevents`

The users collection stores account information.

The packages collection stores the main shipment records.

The facilities collection stores package locations.

The routes collection stores paths between locations.

The handlingevents collection stores package tracking history.

So the database took the form of connected collections, each with a different job."

### Quick backup facts

- models live in `backend/models/`
- Mongoose gives structure and validation

---

## Slide 7
## What form did the components take for the front-end application?

### Suggested on-slide text

- React function components
- Page components
- Reusable UI components
- Login / Register
- Admin / Driver dashboards

### Speaker notes

"The front end used React function components.

The components were split into two main types.

First, page components:

- `Login`
- `Register`
- `AdminDashboard`
- `DriverDashboard`

Second, reusable UI components:

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

This made the app easier to build and easier to keep visually consistent.

The styling also used Tailwind CSS, so spacing, colors, borders, and layout were mostly handled with Tailwind utility classes inside the React files."

### Quick backup facts

- route control file: `frontend/src/App.jsx`
- shared UI file: `frontend/src/components/ui.jsx`
- main styling files: `frontend/src/index.css` and page JSX classes

---

## Slide 8
## What entities existed in the data model?

### Suggested on-slide text

- User
- Package
- Facility
- Route
- HandlingEvent

### Speaker notes

"There were five main entities in the data model.

`User` stores login information and role information.

`Package` stores the main package record, including status, owner, locations, and delivery details.

`Facility` stores a place involved in package movement, like a warehouse or distribution center.

`Route` stores the path between one facility and another.

`HandlingEvent` stores the tracking history of a package.

These entities work together to turn the project into a real tracking system."

### Quick backup facts

- `User` passwords are hashed
- `Package` is the central shipment record
- `HandlingEvent` is the history log

---

## Slide 9
## What many-to-many relationship(s) existed in the data?

### Suggested on-slide text

- Packages <-> Facilities
- One package, many facilities
- One facility, many packages
- Linked by `HandlingEvent`

### Speaker notes

"The main many-to-many relationship is between packages and facilities.

One package can move through many facilities over time.

One facility can process many packages.

We connected those two sides with the `HandlingEvent` collection.

Each handling event stores one package, one facility, one route, one user, one event type, and one status snapshot.

That makes `HandlingEvent` the bridge between packages and facilities.

This is also what makes the app stronger than a simple CRUD app, because it keeps tracking history instead of just the latest package row."

### Important correction to remember

- `truckId` is a field on `Package`
- `truckId` is not the main many-to-many relationship

---

## Slide 10
## Live Demo

### Suggested on-slide text

- Login
- Register
- Admin dashboard
- Driver dashboard
- Tracking flow

### Speaker notes

"Now we will show the app working live.

First, we start on the login page, which is the first screen of the application.

If a user needs a new account, they can go to the register page.

When login succeeds, the backend sends back the user ID, username, and role. The frontend saves that in `localStorage`.

After that, the Axios client sends custom user headers with protected requests.

When we log in as an admin, the admin dashboard loads all packages and summary data. The admin can create, update, and delete packages and assign them to drivers.

When a package is created, the backend does more than save one package row. It also builds tracking context, creates or finds facilities, creates or finds a route, and writes a handling event.

When we switch to the driver side, the driver only sees packages assigned to that driver.

If the driver updates a package status, the backend updates the package and writes another handling event.

So the live demo shows:

- login
- role-based access
- admin vs driver behavior
- package CRUD
- tracking history"

### Quick backup facts

- login handler: `handleLogin`
- auth controller: `login`
- admin page: `AdminDashboard.jsx`
- driver page: `DriverDashboard.jsx`
- create logic: `createPackage`
- update logic: `updatePackage`
- history logic: `recordHandlingEvent`

---

## Best short slide rule

Use this rule when editing the actual PowerPoint:

- slides should only show short bullets
- explanations should go in speaker notes

Good slide text:

- short phrases
- keywords
- 4 to 6 bullets max

Bad slide text:

- full paragraphs
- long definitions
- too many stacked ideas on one slide

---

## Best final speaking order using the current slide flow

- Slide 1: team opener
- Slide 2: Liliana
- Slide 3: Avery
- Slide 4: transition into technical section
- Slide 5: Goose
- Slide 6: Ashton
- Slide 7: Goose
- Slide 8: Ashton
- Slide 9: Ashton or Avery, depending on your group plan
- Slide 10: Eduardo

If you want to keep your current team plan exactly as discussed:

- Liliana = introduction
- Avery = distribution of work
- Ashton = collections, entities, many-to-many
- Goose = routing, components
- Eduardo = live demo

---

## Final note

If your team edits the deck using this file, the slides will become easier to read, easier to present, and safer during professor questions because the detailed explanations will still live in the speaker notes instead of on the slide itself.
