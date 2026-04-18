# DEMO FLOW

---

**1. LOGIN PAGE**
first screen · login page · register new user · no duplicate usernames · passwords hashed bcrypt · two roles · admin vs driver · separate dashboards · role-based routing

---

**2. ADMIN DASHBOARD**
driver assignments · registered drivers · live from the database

---

**3. CREATE A SHIPMENT**
fill the form → assign to driver1 · truck · pickup → dropoff
five entities: User · Package · Route · Facility · HandlingEvent
many-to-many: package moves through many facilities · facility handles many packages · HandlingEvent connects them

---

**5. EDIT A SHIPMENT**
change status · update saves · every change is logged

---

**6. DELETE A SHIPMENT**
removed from database · full CRUD done ✓

---

**7. LOG IN AS DRIVER**
drivers see only their own records · filtered by user ID · can't access anyone else's data

---

**8. DRIVER CREATES A SHIPMENT**
no assign-to field · always their own · create · update status inline · edit · delete

---

**9. WRAP UP**
login first · two roles · no duplicates · separate dashboards · admin full CRUD · driver scoped CRUD · 5 entities · many-to-many · MERN stack
