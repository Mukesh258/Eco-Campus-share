# Eco-Share – Campus Carpooling & Bike Sharing System

## 1. Introduction

Daily commuting to college is a common challenge faced by students. Many rely on overcrowded public transport or expensive private vehicles, which leads to inconvenience, increased costs, and environmental harm. In many cases, students also face issues such as delays, lack of availability, and safety concerns during travel.

With the rise of digital platforms, there is an opportunity to simplify commuting through shared mobility solutions within a trusted campus environment. Eco-Share is designed as a smart solution to enable students to coordinate rides efficiently and safely while promoting sustainability.

**Key concerns addressed:**
- Overcrowded and unreliable public transport
- High fuel and travel costs
- Increased traffic and pollution
- Lack of a trusted ride-sharing system within campuses

---

## 2. Description

Eco-Share is a campus-based carpooling and bike-sharing platform that allows students to share rides with peers traveling in the same direction. It provides a structured and secure way for students to coordinate travel without relying on informal communication channels.

The platform enables users to:
- Post ride details (origin, destination, time)
- View available rides in real time
- Join rides based on seat availability
- Track active and upcoming trips
- Book and return shared bikes
- Manage bookings from a personalized dashboard

The system ensures a centralized and organized way of managing daily travel, replacing informal communication methods such as messaging groups or notice boards. It also enhances convenience by providing all travel-related information in one place.

---

## 3. Problem Statement

Public transportation to colleges can be crowded or unreliable, and individual commuting via private vehicles is expensive and environmentally unfriendly. Students often face difficulties in finding reliable and cost-effective travel options on a daily basis.

Currently, there is no safe, campus-restricted platform that allows students to coordinate shared travel effectively and securely. Existing solutions are either:
- Not limited to campus users (lack of trust)
- Unorganized and scattered across different platforms
- Inefficient in managing seat availability and ride coordination

This creates a need for a dedicated system that ensures safety, reliability, and efficiency in student commuting.

---

## 4. Scenario

A student traveling from home to college can post a ride by entering details such as pickup location, destination, and time. The student also specifies the number of available seats for other passengers.

Other students with similar routes can:
- View the ride on the platform
- Check seat availability
- Request or directly join the ride

The system dynamically updates the number of available seats, ensuring proper coordination and preventing overbooking. All rides are displayed on a "Live Trips" board, making it easy for users to find suitable options.

**Example Flow:**
- Student A posts a ride with 3 available seats
- Student B and C join the ride
- Seat count updates from 3 → 1
- Ride becomes unavailable once seats are filled

**This approach:**
- Reduces travel costs by sharing expenses
- Minimizes the number of vehicles on the road
- Promotes eco-friendly commuting
- Builds a sense of community within the campus

---

## 5. Architecture

Eco-Share follows a three-tier architecture to ensure scalability, security, and efficient performance.

### 1. Presentation Layer (Frontend)
This layer provides the user interface developed using React.js. It allows users to register, log in, post rides, view live trips, book bikes, and join rides. The interface dynamically displays real-time updates such as seat availability, active trips, and bike status.

**Technologies:**
- React 18.3 + Vite
- React Router v6 for navigation
- Tailwind CSS for responsive styling
- Axios for HTTP requests
- React Context for state management

### 2. Application Layer (Backend)
The backend manages all business logic, including ride creation, joining functionality, seat updates, and bike management. It also handles authentication and role-based access control, ensuring that only authorized users can access the platform. This layer processes requests and communicates with the database.

**Technologies:**
- Node.js with Express.js
- JWT authentication
- Bcryptjs for password hashing
- CORS for cross-origin requests

### 3. Data Layer (Database)
The database stores all system-related data, including user details, ride information, bike inventory, and booking records. It ensures data consistency, integrity, and efficient retrieval of information.

**Technologies:**
- MongoDB with Mongoose ODM
- Indexed collections for performance

---

## 6. Project Flow (System Flow)

1. User registers using a college email address
2. User logs into the system
3. User can post a ride or view available rides
4. Other users join rides based on availability
5. Seat count updates automatically
6. Ride details are displayed on the Live Trips board
7. Users can book and return available bikes
8. Dashboard provides personalized trip and booking history

---

## 7. User Flow

### Student/User Flow
**Explanation:**
- The user registers using a valid college email address
- After login, the user accesses the dashboard
- The user can either post a ride or view available trips
- The user joins a ride based on availability
- The system updates the seat count automatically
- The user can also book bikes for short trips

**Steps:**
1. Register → Login → Access Dashboard
2. Post Ride / View Live Trips
3. Join Ride → Seat Update → Travel Confirmation
4. Book Bike → Use Bike → Return Bike

### Ride Creator Flow
**Explanation:**
- The user creates a ride by entering travel details
- The number of seats is defined
- The ride is published for others to join
- The creator monitors participants

**Steps:**
1. Login → Post Ride → Enter Details
2. Set Seat Limit → Publish Ride
3. Monitor Participants

### Ride Joiner Flow
**Explanation:**
- The user browses available rides
- The user selects a ride and checks seat availability
- If seats are available, the user joins the ride and receives confirmation

**Steps:**
1. Login → View Live Trips
2. Select Ride → Check Availability
3. Join Ride → Confirmation

### Bike Rental Flow
**Explanation:**
- The user browses available bikes
- Selects a bike and books it
- Uses the bike for short-distance campus travel
- Returns the bike when done

**Steps:**
1. Login → View Available Bikes
2. Filter by Type/Location → Book Now
3. Complete Trip → Return Bike

### Admin Flow
**Explanation:**
- The admin manages users and ensures valid registrations
- The admin monitors rides and system activities
- Necessary actions are taken to maintain system integrity

**Steps:**
1. Login (Admin) → Manage Users
2. Verify Email Domains → Monitor Rides
3. Maintain System

---

## 8. Project Structure

```
Eco-Share/
├── backend/
│   ├── config/
│   │   └── db.js                    # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js        # Authentication logic
│   │   ├── rideController.js        # Ride management logic
│   │   └── bikeController.js        # Bike management logic
│   ├── middleware/
│   │   ├── authMiddleware.js        # JWT verification
│   │   └── errorMiddleware.js       # Error handling
│   ├── models/
│   │   ├── User.js                  # User schema
│   │   ├── Ride.js                  # Ride schema
│   │   └── Bike.js                  # Bike schema
│   ├── routes/
│   │   ├── authRoutes.js            # Auth endpoints
│   │   ├── rideRoutes.js            # Ride endpoints
│   │   └── bikeRoutes.js            # Bike endpoints
│   ├── .env.example
│   ├── package.json
│   └── server.js                    # Express app configuration
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── api/
│   │   │   ├── axios.js             # Axios instance with interceptors
│   │   │   ├── errorHandler.js      # Error handling utility
│   │   │   ├── services.js          # API service methods
│   │   │   └── hooks.js             # Custom React hooks
│   │   ├── components/
│   │   │   └── ProtectedRoute.jsx   # Route guard component
│   │   ├── context/
│   │   │   ├── AuthContext.jsx      # Authentication state
│   │   │   └── ToastContext.jsx     # Toast notifications
│   │   ├── pages/
│   │   │   ├── HomePage.jsx         # Landing page
│   │   │   ├── LoginPage.jsx        # Login form
│   │   │   ├── RegisterPage.jsx     # Registration form
│   │   │   ├── RideListingPage.jsx  # Browse rides
│   │   │   ├── CreateRidePage.jsx   # Post ride form
│   │   │   ├── BikeListingPage.jsx  # Browse bikes
│   │   │   └── DashboardPage.jsx    # User dashboard
│   │   ├── App.jsx                  # Main router & layout
│   │   ├── main.jsx                 # React entry point
│   │   └── index.css                # Global styles
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── .gitignore
├── README.md                        # This file
└── Eco-Share – Campus Carpooling & Bike Sharing.pdf
```

---

## 9. Pre-Requisites

- Basic knowledge of HTML, CSS, and JavaScript
- Understanding of React.js and React Hooks
- Knowledge of backend development and RESTful APIs
- Familiarity with database concepts (SQL/NoSQL)
- Node.js and npm installed locally

---

## 10. Required Technologies

**Frontend:**
- React.js (18.3+)
- Vite (build tool)
- React Router (v6)
- Tailwind CSS
- Axios

**Backend:**
- Node.js with Express.js
- MongoDB (database)
- Mongoose (ODM)
- JWT (authentication)
- Bcryptjs (password hashing)

**Development Tools:**
- npm/yarn (package managers)
- Git (version control)
- Postman/Thunder Client (API testing)

**Deployment:**
- Render / Railway / Heroku (backend)
- Vercel / Netlify (frontend)

---

## 11. Suggested Database

### Users Collection
- `_id` (ObjectId)
- `name` (String)
- `email` (String, unique)
- `password` (String, hashed)
- `role` (String: student, driver, admin)
- `createdAt` (Date)

### Rides Collection
- `_id` (ObjectId)
- `driver` (ObjectId, ref: User)
- `source` (String)
- `destination` (String)
- `departureTime` (Date)
- `totalSeats` (Number)
- `availableSeats` (Number)
- `fare` (Number)
- `status` (String: active, completed, cancelled)
- `passengers` (Array of ObjectId, ref: User)
- `description` (String)
- `createdAt` (Date)

### Bikes Collection
- `_id` (ObjectId)
- `bikeName` (String)
- `bikeNumber` (String, unique)
- `bikeType` (String: standard, electric, mountain)
- `location` (String)
- `isAvailable` (Boolean)
- `currentUser` (ObjectId, ref: User)
- `pricePerHour` (Number)
- `condition` (String: excellent, good, fair)
- `rentalHistory` (Array of bookings)
- `createdAt` (Date)

---

## 12. Key Features

✅ **Post a Ride** with origin, destination, departure time, and seat count

✅ **Real-time Seat Counter** that updates automatically when passengers join

✅ **Live Trips Board** displaying all available rides for campus travel

✅ **Secure Login** using email and password with JWT authentication

✅ **Easy Ride Joining System** with one-click booking

✅ **Bike Sharing Module** with availability and rental tracking

✅ **User Dashboard** showing posted rides, bookings, and current activities

✅ **Search & Filter** rides by source, destination, and availability

✅ **Mobile Responsive** design for all devices

✅ **Toast Notifications** for user feedback

---

## 13. Optional Advanced Features

- Email notifications for ride updates and reminders
- GPS-based route optimization and live tracking
- User rating and feedback system for drivers and passengers
- In-app messaging between ride creator and joiners
- Ride history and analytics dashboard
- Payment integration for bike rentals
- Admin dashboard for system monitoring
- Automated ride completion and archival
- Bike maintenance tracking and reservation
- Carbon footprint calculator

---

## 14. Getting Started

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file from .env.example
cp .env.example .env

# Start development server
npm run dev
```

### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Create .env file from .env.example
cp .env.example .env

# Start development server
npm run dev
```

### Default Ports
- Backend: `http://localhost:5000`
- Frontend: `http://localhost:5173`

---

## 15. API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user (protected)

### Rides
- `POST /api/rides` - Create new ride (protected)
- `GET /api/rides` - Get all active rides
- `GET /api/rides/search` - Search rides by source/destination
- `GET /api/rides/:id` - Get ride details
- `POST /api/rides/:id/book` - Join a ride (protected)

### Bikes
- `POST /api/bikes` - Add new bike
- `GET /api/bikes` - Get all bikes
- `GET /api/bikes/available` - Get available bikes only
- `GET /api/bikes/:id` - Get bike details
- `POST /api/bikes/:id/book` - Book a bike (protected)
- `POST /api/bikes/:id/return` - Return a bike (protected)

---

## 16. Learning Outcomes

By working on this project, you will gain:

- ✓ Understanding of real-world problem solving and solution design
- ✓ Hands-on experience in full-stack development
- ✓ Knowledge of authentication, authorization, and access control
- ✓ Database design and data management best practices
- ✓ Development of scalable and user-friendly applications
- ✓ Experience with REST API design and implementation
- ✓ Frontend-backend integration techniques
- ✓ Error handling and data validation strategies
- ✓ Responsive UI/UX design implementation

---

## 17. Contributing

Contributions are welcome! Please follow the MVC architecture pattern and ensure code quality before submitting pull requests.

---

## 18. License

This project is open source and available under the MIT License.
