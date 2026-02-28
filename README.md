# Group-Project

# Project Overview
A simple web application that tracks who handled a package during the delivery process.

When packages get lost, delayed, or damaged, companies often don’t know where the problem happened. Our app solves this by creating a clear history of package handling.

Each time a driver or worker handles a package, they press a button and the system records:

Who handled it

When it happened

Where it happened

Package status

This creates a full delivery timeline.

# Project Requirements

- [Login system]
- [Two user roles (Admin and Driver)]
- [CRUD operations]
- [Database with relationships]
- [Single Page Application using React]
This satisfies all requirements.

# Admin (Manager)

- [Admins manage the system.]

They can:
- [Create packages]
- [Assign drivers]
- [View all packages]
- [View full package history]
- [Edit or delete records]

# Driver (Standard User)

- [Drivers update delivery progress.]

They can:
- [View assigned packages]
- [Update package status]
- [Mark when they receive or deliver packages]
- [Drivers cannot modify other users’ data.]

# Overall Flow
User opens app
        ↓
Login
        ↓
Role detected
        ↓
Admin Dashboard OR Driver Dashboard

# Admin Flow
Login
  ↓
Create Package
  ↓
Assign Driver
  ↓
Monitor Updates
  ↓
View Package History

# Driver Flow
Login
  ↓
See Assigned Packages
  ↓
Select Package
  ↓
Click Update Button
  ↓
System records handling event

# Package Flow
Package Created
      ↓
Picked Up
      ↓
In Transit
      ↓
Delivery Attempt
      ↓
Delivered

# Why this app is useful
When deliveries fail, companies need accountability.
Our system provides:
- transparency
- tracking history
- operational visibility
