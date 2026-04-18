# Final Presentation Scripts

This file has the full speaking script for the Packet Tracker presentation.
The language is simple and clear, but the content is detailed so everyone can explain the project with confidence.

Use this as the final script.
You can shorten any section while presenting if time gets tight.

---

## Liliana - Introduction

Hi everyone. Our project is called **Packet Tracker**.

Our team members are **Liliana, Avery, Ashton, Goose, and Eduardo**.

Our topic is a **package and packet tracking system**. We built a web application that helps an organization track packages, assign them to drivers, update shipment status, and keep a record of where each package has been.

We chose this topic because **online shopping keeps growing**, and because package tracking is something people already understand in real life. That made it a strong topic for a software project. At the same time, it gave us enough complexity to build something that feels like a real full-stack application instead of just a simple website.

We also liked this topic because we could approach it from a **developer mindset**. We were not only thinking about what the customer sees. We were also thinking about how an organization would actually manage packages behind the scenes. That means we had to think about users, permissions, routes, facilities, package records, and tracking history.

One of our main goals was to make the experience feel **simple and smooth**. A real package system can become confusing very quickly if there are too many steps or too much information on the screen. Because of that, we focused on a user interface that is more direct, more organized, and easier for an organization to use. We wanted someone to log in, understand their role right away, and know exactly what actions they are allowed to take.

What makes this topic interesting is that it looks simple on the surface, but there is a lot happening underneath. On the front end, the user sees a clean dashboard and forms. On the back end, the app is doing much more. It is checking who the user is, deciding whether they are an admin or a driver, storing package information, building route data, creating facility records, and writing handling events that act like package history.

So even though the project feels simple to use, it is supported by real logic. That is what makes it interesting from a computer science point of view. It combines user interface design, data modeling, authentication, routing, and database relationships in one project.

That is our introduction to Packet Tracker.

Now Avery will explain the technologies we used and how the work was distributed across the team.


## Avery - Distribution of Work and Technologies

I will explain the technologies we used and how the work was divided across our team.

For this project, we used the **MERN stack**. MERN stands for **MongoDB, Express, React, and Node.js**.

On the front end, we used **React** to build the user interface. React helped us organize the project into clear pages and reusable pieces. Instead of making one long HTML page, we could break the app into separate screens like the login page, the registration page, the admin dashboard, and the driver dashboard.

We also used **React Router** for front-end navigation. This allowed the app to send users to the correct page depending on their role. For example, if a user logs in as an admin, they are sent to the admin dashboard. If they log in as a driver, they are sent to the driver dashboard. This made the app feel structured and role-aware.

We used **Axios** so the front end could send requests to the back end. When the user logs in, creates a package, updates a shipment, or loads data from the database, Axios is what helps the browser communicate with the server.

For styling, we used **Tailwind CSS** along with reusable UI components. That helped us keep the layout consistent and made it easier to create a cleaner interface. Since one of our goals was to simplify the user experience, having consistent styling mattered a lot.

On the back end, we used **Node.js** and **Express**. Node.js let us run JavaScript on the server side, and Express let us organize the server into routes. Those routes handled actions like login, registration, creating packages, loading packages, updating package records, and deleting packages.

For the database, we used **MongoDB**. MongoDB stores data in collections, which fit well with our project because we had several kinds of records, such as users, packages, facilities, routes, and handling events.

We also used **Mongoose**, which sits on top of MongoDB and lets us define schemas and models. That was important because it gave our data structure. Instead of storing random data, we could define exactly what a package should contain, what a user should contain, and how different records connect to each other.

Now for the work distribution.

Our work was divided by major parts of the system, but we still had to make sure those parts connected well.

**Liliana** helped shape the project direction, introduction, and the overall explanation of the user experience and project purpose.

**I, Avery**, focused on organization, project flow, presentation structure, and helping keep the UI direction clear and consistent.

**Ashton** focused on the database side of the project, especially the data model, the collections, and how the main entities connect to one another.

**Goose** focused on the structure of routing and components, which includes how the web server handles routes and how the React front end is split into pages and reusable UI pieces.

**Eduardo** handled the live demonstration and also worked on the deeper application logic that connects the front end, back end, and data flow together.

What is important is that our work was not isolated. The front end and back end depend on each other. The screens need working API routes. The API routes need real database models. The user roles need both front-end routing and back-end permission checks. So even though we each had focus areas, the final app only works because those areas fit together.

Now Ashton will explain the technical database side of the project.

## Ashton - Technical Description, Database Side

I am covering the database side of the project.

For the database, our collections took the form of **MongoDB collections defined through Mongoose models and schemas**. That means every major kind of data in the app had its own model, and each model described what fields belonged in that type of record.

So the collections were not just loose storage. They were structured. Each collection had a purpose, and each one supported a different part of the tracking system.

Our project has **five main entities** in the data model:

1. **User**
2. **Package**
3. **Facility**
4. **Route**
5. **HandlingEvent**

I will explain each one.

The **User** entity stores account information. It includes the username, password, and role. The role can be either **admin** or **driver**. This is important because our app behaves differently depending on who is logged in. Also, the password is not saved as plain text. It is hashed for better security.

The **Package** entity stores the main shipment record. This is the center of the application. It includes fields like package ID, description, amount, weight, delivery type, truck ID, pickup location, dropoff location, and status. It also stores ownership information, which tells us which driver the package is assigned to.

The **Facility** entity stores locations involved in the shipping process. A facility can represent places like a warehouse, a distribution center, a retail store, a customer address, or even an in-transit location. This allows the project to describe where a package is moving through the system.

The **Route** entity stores the path between two facilities. It connects a start facility and an end facility. This gives the package movement a clear structure instead of just storing text that says where the package came from and where it is going.

The **HandlingEvent** entity stores the package history. This is one of the most important parts of the system because it records what happened to a package, where it happened, who performed the action, and what the package status was at that moment. In other words, the handling event is what turns a package record into a tracking system instead of just a storage form.

Now for the many-to-many relationship.

The main many-to-many relationship in our data is between **packages and facilities**.

One package can move through many facilities over time. For example, it might begin at a warehouse, move through a distribution center, pass through an in-transit step, and end at a store or customer address.

At the same time, one facility can handle many packages. A warehouse does not hold only one package. It may process a large number of shipments.

Because of that, packages and facilities have a many-to-many relationship.

We modeled that relationship through the **HandlingEvent** collection. That collection acts like a bridge or connection table between the two. Each handling event records one moment where a package is connected to a facility, along with the route, the responsible user, and the package status at that time.

That means we are not only storing the current state of a package. We are also storing a history of movement.

This is what makes the data model stronger. We do not just know what a package is. We also know:

- who owns it
- where it is now
- where it is going
- what route it is using
- what events happened to it over time

So, to summarize the database side:

- the collections took the form of Mongoose models on top of MongoDB
- the five entities were User, Package, Facility, Route, and HandlingEvent
- the main many-to-many relationship was Packages to Facilities through HandlingEvent

That design let us build a system that is more realistic, more organized, and easier to explain technically.

Now Goose will explain the server routing and the front-end component structure.

### Quick answer version if asked questions

**What form did the collections take for the database?**  
They took the form of MongoDB collections defined through Mongoose schemas and models.

**What entities existed in the data model?**  
The five entities were User, Package, Facility, Route, and HandlingEvent.

**What many-to-many relationship existed in the data?**  
The main many-to-many relationship was between packages and facilities, and it was modeled through the HandlingEvent collection.

---

## Goose - Technical Description, Routing and Front-End Components

I am covering the routing side of the web server and the component structure on the front end.

For the **web server**, routing took the form of **Express routes organized around REST-style API endpoints**.

In simple words, that means the server had different URL paths for different actions, and each route had a job.

For example, the server has authentication routes for actions like:

- registering a new user
- logging in an existing user

It also has package routes for actions like:

- creating a package
- getting all packages
- getting one package by its ID
- updating a package
- deleting a package
- getting a summary of the data model

So the web server routing is not page routing like a normal website menu. It is **API routing**. The front end sends requests to these routes, and the server responds with data.

The server routing is also **protected**. Before package routes are used, middleware checks the current user. That means the server looks at the user information that came with the request and confirms whether the person is allowed to perform that action.

This matters because our project has role-based behavior.

- An **admin** can work with all package records.
- A **driver** can only work with package records that belong to that driver.

So the routing is not just about where requests go. It is also about whether the request should be allowed in the first place.

Now for the **front-end components**.

On the front end, the components took the form of **React functional components**.

The app is divided into major page components and reusable UI components.

The main page components are:

- **Login**
- **Register**
- **AdminDashboard**
- **DriverDashboard**

Each one represents a main screen in the application.

The **Login** component handles signing in.
The **Register** component handles creating a new account.
The **AdminDashboard** gives admins a full package management screen, driver assignment information, and summary data.
The **DriverDashboard** gives drivers a view that is limited to their own package records and status updates.

The project also uses reusable UI components to keep the design more consistent. These include things like:

- buttons
- form fields
- text inputs
- select inputs
- alerts
- cards
- badges
- layout wrappers

This is important because reusable components make the app easier to maintain. Instead of redesigning every page from scratch, we can reuse the same visual building blocks across the system.

The front end also uses **React Router**. React Router controls which page the user sees. It checks the stored user and decides whether to send them to the login page, the admin dashboard, or the driver dashboard.

That structure helped the app stay organized and made it easier to separate responsibilities between the browser and the server.

To summarize my section:

- web server routing took the form of Express API routes
- those routes handled authentication and package operations
- protected middleware made sure users only did what their role allowed
- the front end used React functional components
- the application was split into page components and reusable UI components
- React Router controlled navigation between the main screens

Now Eduardo will give the live demonstration.

### Quick answer version if asked questions

**What form did routing take for the web server?**  
Routing took the form of Express API routes, especially authentication routes and protected package routes.

**What form did the components take for the front-end application?**  
They took the form of React functional components, split into page-level components and reusable UI components.

---

## Eduardo - Live Demonstration Script

For the live demonstration, I am going to show how the app works from the user side and how the role-based logic changes the experience.

First, I will start on the **login page**. This is the first screen of the application, which is important because the project requires login to be the starting point.

If a user does not have an account yet, they can go to the **register page** and create one. During registration, they choose a username, a password, and a role. The role is either admin or driver.

After that, I will log in.

If I log in as an **admin**, the system sends me to the **Admin Dashboard**.

On the admin dashboard, I can do full package management. I can:

- create a package
- view all packages
- assign a package to a driver
- edit package records
- delete package records

The admin dashboard also shows useful information like driver assignments and summary data, which makes it easier to understand how the system is structured.

To demonstrate that, I will create a sample package. I will enter information like:

- driver username
- package ID
- item name
- quantity
- truck ID
- pickup location
- dropoff location
- delivery type
- status

When I save that package, the back end does more than just store a row.
It also builds tracking context in the database, including facility information, route information, and a handling event record.

Next, I will log out and log back in as a **driver**.

When I log in as a driver, I do not see the admin screen. Instead, I go to the **Driver Dashboard**.

This is important because it shows role-based behavior in the application.

On the driver dashboard, I can only see **my own shipments**. I cannot see every package in the system. That proves that the app is not only using front-end navigation. It is also enforcing user ownership rules in the data flow.

From the driver dashboard, I can:

- view my assigned packages
- create my own shipment record
- edit my own package records
- update the shipment status
- delete my own package records

For example, I can take a package that is currently marked as pending or in transit and update its status to something else, like delivered. When I do that, the system records the update and refreshes the package data.

That update also creates a new handling event in the background, which helps preserve the package history.

So the live demo shows the most important features of the app:

- login and registration
- role-based routing
- admin access versus driver access
- package CRUD operations
- driver assignment
- shipment status updates
- package tracking history through handling events

If I want to summarize the full demo in one sentence, I would say this:

**The admin manages the system broadly, the driver only manages their own assigned work, and the database keeps track of the package movement behind the scenes.**

That concludes the live demonstration.

---

## Short Team Closing

In conclusion, Packet Tracker is a MERN-stack web application that combines a simple interface with a deeper tracking system underneath. It includes login, role-based access, package management, route and facility modeling, and handling event history. Our goal was to make packet management easier for organizations while still building something technically strong and realistic.

Thank you.

---

## One-Line Backup Answers

**How many entities are in the data model?**  
There are five entities: User, Package, Facility, Route, and HandlingEvent.

**What is the key many-to-many relationship?**  
Packages and facilities are many-to-many through handling events.

**How is the app role-based?**  
Admins can manage all package data, while drivers can only work with their own assigned packages.

**What form did the server routing take?**  
It used Express API routes with protected package endpoints.

**What form did the front-end components take?**  
They were React functional components, split into page components and reusable UI components.
