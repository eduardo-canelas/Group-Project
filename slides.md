# Slides Study Guide

This file is a full study guide based on the slide screenshots in the `slides/` folder.

For each slide, this guide includes:

- the slide title
- simple speaker notes
- possible professor questions
- simple answers

## Slide 1

### Title

`How the App Works`

### Speaker notes

"Our app starts on the login page or the register page. When a user logs in, the app checks their role. If the user is an admin, the app sends them to the admin dashboard. If the user is a driver, the app sends them to the driver dashboard. The React front end sends requests to the Express back end. The back end checks the request, gets the right data, and sends it back. This helps each user see only the information they are supposed to see. It also lets them do the right actions for their role."

### Question bank with answers

**Question:** What is the first thing the user sees in the app?  
**Answer:** The first thing the user sees is the login page or the register page.

**Question:** What happens after a user logs in?  
**Answer:** After login, the app checks the user's role and sends them to the correct dashboard.

**Question:** What roles exist in your app?  
**Answer:** The two main roles are admin and driver.

**Question:** Why do admins and drivers go to different dashboards?  
**Answer:** They go to different dashboards because they have different jobs and permissions. Admins manage all packages, while drivers mainly see and update their own assigned packages.

**Question:** What does the React front end do?  
**Answer:** The React front end shows the pages, forms, buttons, and package data to the user. It also sends requests to the server.

**Question:** What does the Express back end do?  
**Answer:** The Express back end handles API requests, checks user information, processes package actions, and talks to MongoDB.

**Question:** What does CRUD mean in your project?  
**Answer:** CRUD means Create, Read, Update, and Delete. In our app, it means users can create package records, read them, update them, and delete them if allowed.

**Question:** Why is role checking important?  
**Answer:** Role checking is important because it keeps the app secure and makes sure users only do what they are allowed to do.

## Slide 2

### Title

`TECH STACK`

### Speaker notes

"Our project uses the MERN stack. MongoDB stores our data. Express.js helps us build the back end routes and API. React builds the front end screens and components. Node.js runs the server. We also used Tailwind CSS for styling and Axios for sending requests from the front end to the back end."

### Question bank with answers

**Question:** What does MERN stand for?  
**Answer:** MERN stands for MongoDB, Express, React, and Node.

**Question:** Why did you use MongoDB?  
**Answer:** We used MongoDB because it stores data as documents, which works well for our app's collections like users, packages, facilities, routes, and handling events.

**Question:** Why did you use Express.js?  
**Answer:** We used Express.js because it makes it easier to build routes and APIs on the back end.

**Question:** Why did you use React?  
**Answer:** We used React because it helps build reusable front-end components and makes the UI easier to manage.

**Question:** What is Node.js used for?  
**Answer:** Node.js runs the back-end JavaScript code on the server.

**Question:** Why did you use Tailwind CSS?  
**Answer:** We used Tailwind CSS to style the app quickly and keep the design consistent.

**Question:** What is Axios used for?  
**Answer:** Axios is used to send HTTP requests from the React front end to the Express back end.

**Question:** Which parts are front end and which parts are back end?  
**Answer:** React and Tailwind CSS are front end. Express, Node.js, and MongoDB are part of the back end and database side.

## Slide 3

### Title

`What form did routing take for the web server?`

### Speaker notes

"We used Express routing on the server. That means we created URL paths for different jobs. The two main route groups were `/api/auth` and `/api/packages`. The auth routes handle login and register. The package routes handle actions like create, read, update, delete, and summary. This keeps the server code organized because different features are split into different route files."

### Question bank with answers

**Question:** What is routing?  
**Answer:** Routing is how the server decides what code should run when a certain URL is requested.

**Question:** What type of routing did you use?  
**Answer:** We used Express routing.

**Question:** What is `/api/auth` for?  
**Answer:** `/api/auth` is for authentication actions like login and register.

**Question:** What is `/api/packages` for?  
**Answer:** `/api/packages` is for package actions like creating, reading, updating, deleting, and getting summary information.

**Question:** Why did you split the routes into groups?  
**Answer:** We split the routes into groups to make the server easier to read, organize, and maintain.

**Question:** What package actions are supported?  
**Answer:** The package routes support create, read all, read one, update, delete, and summary.

**Question:** What is the summary route used for?  
**Answer:** The summary route is used to show data model information like totals and recent handling events.

**Question:** Why is route organization helpful?  
**Answer:** It is helpful because it keeps the code cleaner and makes debugging easier.

## Slide 4

### Title

`What form did the components take for the front-end application?`

### Speaker notes

"The front end used React function components. That means the app was built from small pieces of code called components. Some components were whole pages, like Login, Register, Admin Dashboard, and Driver Dashboard. Some components were reusable UI parts, like buttons, forms, cards, alerts, and status badges. This made our app easier to build, reuse, and update."

### Question bank with answers

**Question:** What kind of components did you use?  
**Answer:** We used React function components.

**Question:** What is a function component?  
**Answer:** A function component is a JavaScript function that returns UI code for part of the page.

**Question:** Why did you use function components?  
**Answer:** We used them because they are simple, reusable, and a common React pattern.

**Question:** What is the difference between page components and reusable components?  
**Answer:** Page components represent full screens, like a dashboard. Reusable components are smaller pieces, like buttons or cards, that can be used in many places.

**Question:** What main pages did your app have?  
**Answer:** The main pages were Login, Register, Admin Dashboard, and Driver Dashboard.

**Question:** What reusable parts did you have?  
**Answer:** We had reusable buttons, forms, cards, alerts, and status badges.

**Question:** Why are reusable components helpful?  
**Answer:** They reduce repeated code and make the app easier to update.

**Question:** Can you give an example of reuse?  
**Answer:** A status badge component can be used in multiple package cards instead of rewriting the same code each time.

## Slide 5

### Title

`What entities existed in the data model?`

### Speaker notes

"Our data model had five main entities: Facilities, HandlingEvents, Packages, Routes, and Users. Users are the people in the system, like admins and drivers. Packages are the shipments we track. Facilities are the places a package can be, like a warehouse, store, or truck. Routes connect a starting facility to an ending facility. HandlingEvents record the history of what happened to a package over time."

### Question bank with answers

**Question:** What is an entity?  
**Answer:** An entity is a main object or data type in the system that we store in the database.

**Question:** What five entities did your app use?  
**Answer:** The five entities were Facilities, HandlingEvents, Packages, Routes, and Users.

**Question:** What does the Users entity store?  
**Answer:** It stores user account data, such as username, password, and role.

**Question:** What does the Packages entity store?  
**Answer:** It stores package information like package ID, description, amount, delivery type, truck ID, locations, status, owner, route, and current facility.

**Question:** What does the Facilities entity store?  
**Answer:** It stores facility information like the facility name, normalized name, and location type.

**Question:** What does the Routes entity store?  
**Answer:** It stores the start facility and end facility for a route.

**Question:** What does the HandlingEvents entity store?  
**Answer:** It stores tracking history for a package, including the package, facility, user, route, event type, and status snapshot.

**Question:** Why did you need HandlingEvents instead of only storing package status?  
**Answer:** We needed HandlingEvents to keep a history of what happened over time instead of only showing the package's latest status.

## Slide 6

### Title

`What many-to-many relationship(s) existed in the data?`

### Speaker notes

"The main many-to-many relationship in our app is between Packages and Facilities. One package can go through many facilities during its trip. One facility can also handle many different packages. To connect them, we use HandlingEvents as the middle collection, like a junction table. Each handling event links one package to one facility at one point in time, and it also stores extra details like the route, user, event type, and status snapshot."

### Question bank with answers

**Question:** What is a many-to-many relationship?  
**Answer:** A many-to-many relationship means one item on one side can connect to many items on the other side, and the reverse is also true.

**Question:** What is the many-to-many relationship in your app?  
**Answer:** The many-to-many relationship is between Packages and Facilities.

**Question:** Why is it many-to-many?  
**Answer:** It is many-to-many because one package can move through many facilities, and one facility can handle many packages.

**Question:** What collection connects Packages and Facilities?  
**Answer:** The `HandlingEvent` collection connects Packages and Facilities.

**Question:** Why do you call HandlingEvents a junction table?  
**Answer:** We call it a junction table because it acts as the middle connection between packages and facilities, similar to a bridge table in relational databases.

**Question:** What extra data does HandlingEvents store?  
**Answer:** It stores the package, facility, user, route, event type, status snapshot, and timestamps.

**Question:** Why not just store a list of facilities directly inside the package?  
**Answer:** Because we also need the history and context for each stop, like who handled it, what route it was on, and what the status was at that moment.

**Question:** How does this help with tracking history?  
**Answer:** It helps because every handling event becomes a record of one step in the package's journey.

## Extra quick-answer section

### One-sentence answers you can memorize

**How does the app work?**  
The app checks the user's role after login and sends requests from the React front end to the Express back end to manage package data.

**What tech stack did you use?**  
We used MongoDB, Express.js, React, Node.js, Tailwind CSS, and Axios.

**What form did routing take?**  
We used Express routing with main route groups like `/api/auth` and `/api/packages`.

**What form did the front-end components take?**  
We used React function components for both pages and reusable UI parts.

**What entities existed in the data model?**  
The main entities were Users, Packages, Facilities, Routes, and HandlingEvents.

**What many-to-many relationship existed?**  
Packages and Facilities had a many-to-many relationship connected through HandlingEvents.
