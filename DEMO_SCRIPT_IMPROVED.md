# Packet Tracker — 5-Minute Demo Script
### Many-to-Many Relationship Live Walkthrough

---

## Setup Before You Present

- MongoDB Compass open on `handlingevents` collection, sorted by `createdAt` descending
- Frontend running at `http://localhost:5173`
- Admin credentials ready to type
- Camila's driver account confirmed and ready

---

## THE SCRIPT (~5 minutes, speak slowly)

---

### OPENING — 30 seconds

> "This app tracks packages as they move through the real world — from a warehouse, onto a truck, and into a store. The database challenge is that **one package touches many facilities, and one facility handles many packages**. That's a many-to-many relationship. I'm going to show you that relationship live, in the database, as we use the app."

---

### PART 1 — Show the App — 30 seconds

**[Login page]**

> "Users are either admins or drivers. I'll log in as admin."

**[Admin Dashboard]**

> "The admin sees every driver and their packages. You can see Manuela is on Truck 001 and already delivered her shipment. Now I'm going to create a new package and watch the database react in real time."

---

### PART 2 — Create a Package — 1 minute

**[Have MongoDB Compass visible — note the handlingevents count]**

> "Right now in MongoDB Compass I have the `handlingevents` collection open. Watch the count."

**[Fill out the form:]**
- Package ID: `002`, Description: `MacBooks`, Amount: `100`
- Truck ID: `002`, Driver: Camila
- Pickup: `Walmart`, Dropoff: `Best Buy`, Status: `pending`

**[Click Create — switch to Compass]**

> "A new record appeared in `handlingevents`. This is the bridge document. It holds three foreign keys — one pointing to the package, one pointing to Walmart as the current facility, and one pointing to me as the user who created it. The `eventType` is `assigned` and the `statusSnapshot` is `pending`."

**[Switch to `facilities`]**

> "Two facility documents were auto-created — Walmart and Best Buy. They'll never be duplicated. Any future package going from Walmart to Best Buy reuses these same records."

---

### PART 3 — In Transit — 1.5 minutes

**[Back to frontend — log in as Camila]**

> "Now I'll log in as Camila. As a driver she only sees her own packages — she has no access to other drivers' data."

**[Update status to `in_transit`]**

> "She marks the package as in transit. Now watch MongoDB."

**[Switch to Compass → `facilities`]**

> "A brand new facility called **'Truck 002'** was created, with a location type of `inTransit`. The system saw the truck ID and created a virtual facility representing the truck while it's on the road."

**[Switch to `handlingevents`]**

> "A new bridge record. The `facility` field now points to Truck 002 — not Walmart anymore."

**[Switch to `packages`, open the document]**

> "The package's `currentFacility` field updated its pointer from Walmart to Truck 002. One package — already associated with two facilities — through two handling events. **This is the many-to-many working.**"

---

### PART 4 — Delivered — 1 minute

**[Back to frontend as Camila]**

> "Camila arrives at Best Buy and marks it delivered."

**[Change status to `delivered`]**

**[Switch to Compass → `handlingevents`]**

> "Third bridge record. `eventType: unloaded`, facility now points to Best Buy."

**[Show all 3 events for this package]**

> "Look at this — one package, three handling events, three facilities: Walmart, Truck 002, Best Buy. Every single step of the journey is preserved in the bridge collection. And in the reverse direction — if I query by facility, I can find every package that ever passed through Best Buy. That is a many-to-many relationship."

---

### CLOSING — 30 seconds

> "To summarize: creating and moving one package triggered the automatic creation of three facilities, one route, and three handling events. The `HandlingEvent` collection is the bridge — every document is one package meeting one facility at one point in time, with the status, the user, and the route all recorded. That's how we solved the many-to-many problem in MongoDB."

---

## Quick Recovery Notes

| Problem | Fix |
|---|---|
| Compass didn't update | Hit the refresh button — it doesn't auto-refresh |
| Can't log in as Camila | Stay as admin, say "I'll show the driver view is restricted" |
| Can't find the right event | Filter `handlingevents` by `package` field using the package's ObjectId |
