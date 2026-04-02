Packet Tracker Term Project

How to start the web server
1. Open a terminal in the project root.
2. Make sure MongoDB is running locally. The backend will try `MONGODB_URI` from `backend/.env` first, then fall back to `mongodb://127.0.0.1:27017/packet-tracker`.
3. Start the backend:
   cd backend
   npm install
   npm start

Is there a second server needed for the React application?
Yes. Start the Vite development server in a second terminal:
   cd frontend
   npm install
   npm run dev

How can the grader navigate to the application?
- Frontend application: http://localhost:5173/
- Backend API root: http://localhost:5000/
- API base used by the React app: http://localhost:5000/api

What collections are needed in MongoDB?
- users
- packages
- facilities
- routes
- handlingevents

Notes
- The login screen is the first page shown by the app.
- New users can be created from the Register page.
- Requirement 8 is met through the five live entities above.
- Requirement 9 is met through the many-to-many relationship between Packages and Facilities, implemented through the HandlingEvent collection.
