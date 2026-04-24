# Eco-Share: Campus Carpooling and Bike Sharing

# Demonstration Video

Add your demo link here:

https://github.com/user-attachments/assets/your-demo-video-id

# Code Explanation Video

Add your code walkthrough link here:

https://github.com/user-attachments/assets/your-code-explanation-video-id

Smarter campus commuting with shared rides, shared bikes, and real-time trip coordination.

![React](https://img.shields.io/badge/Frontend-React%2018-blue)
![Node.js](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-green)
![MongoDB](https://img.shields.io/badge/Database-MongoDB-brightgreen)
![Socket.IO](https://img.shields.io/badge/Realtime-Socket.IO-black)
![Vite](https://img.shields.io/badge/Bundler-Vite-646CFF)

## Table of Contents

- [Overview](#overview)
- [Core Features](#core-features)
- [System Architecture](#system-architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Socket Events](#socket-events)
- [Role Access Matrix](#role-access-matrix)
- [Demo Script for Viva / Presentation](#demo-script-for-viva--presentation)
- [Troubleshooting](#troubleshooting)
- [Deployment Notes](#deployment-notes)
- [Roadmap](#roadmap)
- [Contributing](#contributing)

## Overview

Eco-Share is a full-stack campus mobility platform that helps students and drivers:

- Post and join shared rides
- Track active rides in real time
- Manage bike booking and returns
- Use role-based dashboards and permissions
- Rate and review ride participants

The platform is designed for trusted institutional usage by requiring institutional email domains during registration.

## Core Features

### Authentication and Access Control

- JWT-based login/register flow
- Institutional email validation (`.edu`, `.edu.in`, `.ac.in`)
- Role-based authorization (`student`, `driver`, `admin`)
- Protected routes in frontend and backend

### Ride Management

- Drivers/admins can create rides
- Students/admins can book and leave rides
- Drivers/admins can start, end, cancel rides
- Drivers can remove a passenger from their own ride
- Automatic seat availability updates

### Smart Recommendations

- Personalized ride recommendations based on:
  - User travel history (common source/destination)
  - Typical ride timings
  - Optional location/time query hints

### Bike Sharing

- Add bikes to inventory
- Browse all/available bikes
- Book and return bikes
- Rental history tracking with usage hours

### Real-Time Experience

- Socket.IO integration for:
  - New ride broadcasts
  - Ride update broadcasts
  - Ride cancellation broadcasts
  - Live location updates during active rides

### Driver Availability and Ratings

- Drivers can toggle online/offline status
- Fetch available drivers sorted by rating
- Rate drivers and passengers after completed rides
- Retrieve user ratings and review history

## System Architecture

```text
Client (React + Vite)
  |
  | HTTP (Axios) + WebSocket (Socket.IO Client)
  v
API Server (Node.js + Express + Socket.IO)
  |
  | Mongoose ODM
  v
MongoDB
```

- Frontend handles UI, navigation, auth state, and API service abstraction.
- Backend handles auth, business logic, permissions, and real-time events.
- MongoDB stores users, rides, bike inventory, and ratings.

## Tech Stack

### Frontend

- React 18
- Vite 5
- React Router v6
- Tailwind CSS
- Axios
- Leaflet + React Leaflet
- socket.io-client
- lucide-react

### Backend

- Node.js
- Express 4
- MongoDB + Mongoose
- JWT (jsonwebtoken)
- bcryptjs
- Socket.IO
- CORS
- dotenv

## Project Structure

```text
FSD Project/
|-- backend/
|   |-- config/
|   |   `-- db.js
|   |-- controllers/
|   |   |-- authController.js
|   |   |-- bikeController.js
|   |   |-- rideController.js
|   |   `-- userController.js
|   |-- middleware/
|   |   |-- authMiddleware.js
|   |   `-- errorMiddleware.js
|   |-- models/
|   |   |-- Bike.js
|   |   |-- Ride.js
|   |   `-- User.js
|   |-- routes/
|   |   |-- authRoutes.js
|   |   |-- bikeRoutes.js
|   |   |-- rideRoutes.js
|   |   `-- userRoutes.js
|   |-- package.json
|   `-- server.js
|-- frontend/
|   |-- src/
|   |   |-- api/
|   |   |-- components/
|   |   |-- context/
|   |   |-- pages/
|   |   `-- utils/
|   |-- package.json
|   `-- vite.config.js
`-- README.md
```

## Quick Start

### Prerequisites

- Node.js 18+
- npm 9+
- MongoDB Atlas URI or local MongoDB instance

### 1. Clone and enter project

```bash
git clone <your-repo-url>
cd "FSD Project"
```

### 2. Install backend dependencies

```bash
cd backend
npm install
```

### 3. Create backend environment file

Create `backend/.env`:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_key
JWT_EXPIRES_IN=7d
```

### 4. Run backend

```bash
npm run dev
```

### 5. Install frontend dependencies

Open a second terminal:

```bash
cd frontend
npm install
```

### 6. Create frontend environment file (optional)

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

If omitted, frontend auto-resolves host-based URLs for local/LAN testing.

### 7. Run frontend

```bash
npm run dev
```

### 8. Open application

- Frontend: `http://localhost:5173`
- Backend health check: `http://localhost:5000/api/health`

## Environment Variables

### Backend (`backend/.env`)

- `PORT`: API server port (default `5000`)
- `MONGO_URI`: MongoDB connection string
- `JWT_SECRET`: JWT signing secret
- `JWT_EXPIRES_IN`: Token lifetime (default `7d`)

### Frontend (`frontend/.env`)

- `VITE_API_URL`: Base API URL (defaults to `http://<host>:5000/api`)
- `VITE_SOCKET_URL`: Socket server URL (defaults to `http://<host>:5000`)

## API Reference

Base URL: `/api`

### Health

- `GET /health` - API status

### Auth

- `POST /auth/register` - Register user
- `POST /auth/login` - Login user
- `GET /auth/me` - Get current user (protected)
- `PUT /auth/profile` - Update profile/password (protected)

### Rides

- `POST /rides` - Create ride (driver/admin)
- `GET /rides` - List rides
- `GET /rides/search?source=&destination=` - Search active rides
- `GET /rides/recommendations?location=&timing=` - Personalized recommendations (protected)
- `GET /rides/:id` - Ride details
- `POST /rides/:id/book` - Book ride (student/admin)
- `POST /rides/:id/leave` - Leave ride (student/admin)
- `POST /rides/:id/start` - Start ride (driver/admin)
- `POST /rides/:id/end` - End ride (driver/admin)
- `DELETE /rides/:id` - Cancel ride (driver/admin)
- `DELETE /rides/:rideId/passengers/:userId` - Remove passenger (driver/admin)

### Bikes

- `POST /bikes` - Add bike
- `GET /bikes` - List all bikes
- `GET /bikes/available?bikeType=` - List available bikes
- `GET /bikes/:id` - Bike details
- `POST /bikes/:id/book` - Book bike (protected)
- `POST /bikes/:id/return` - Return bike (protected)

### Users / Driver Features

- `POST /users/driver-online-status` - Toggle online status (driver/admin)
- `GET /users/available-drivers` - Get available drivers
- `GET /users/driver/:driverId` - Driver profile + recent rides
- `POST /users/rate-driver/:rideId` - Rate driver (protected)
- `POST /users/rate-passenger/:rideId` - Rate passenger (protected)
- `GET /users/ratings/:userId` - User ratings and reviews

## Socket Events

### Client to Server

- `join-ride` with `rideId`
- `update-location` with `{ rideId, userId, coords }`

### Server to Client

- `ride-created`
- `ride-updated`
- `ride-cancelled`
- `location-updated`

## Role Access Matrix

| Action | Student | Driver | Admin |
|---|---:|---:|---:|
| Register/Login | Yes | Yes | Yes |
| Create ride | No | Yes | Yes |
| Book ride | Yes | No | Yes |
| Start/End/Cancel own ride | No | Yes | Yes |
| Add bike | No | Yes | Yes |
| Book/Return bike | Yes | Yes | Yes |
| Toggle driver online status | No | Yes | Yes |

## Demo Script for Viva / Presentation

Use this sequence for a smooth project demonstration:

1. Show registration with institutional email.
2. Login as driver and create a ride.
3. Login as student and book the same ride.
4. Show seat count update and ride details refresh.
5. Start the ride and open active ride tracking page.
6. Trigger location updates to demonstrate real-time sync.
7. End ride and show final status.
8. Book and return a bike.
9. Show rating flow and driver profile statistics.

## Troubleshooting

### MongoDB connection fails

- Verify `MONGO_URI` in `backend/.env`
- Confirm Atlas IP allowlist / local MongoDB service

### 401 Unauthorized on protected APIs

- Ensure token exists in local storage (`ecoShareAuth`)
- Re-login if token expired or invalid

### CORS or network access issue on mobile/LAN

- Backend runs on `0.0.0.0` and can accept network connections
- Use your machine IP in frontend env values when needed

### Socket not receiving updates

- Confirm `VITE_SOCKET_URL` points to backend host
- Check browser console for socket connection errors

## Deployment Notes

- Deploy backend to Render/Railway/Fly/EC2 with env vars configured
- Deploy frontend to Vercel/Netlify
- Set frontend `VITE_API_URL` and `VITE_SOCKET_URL` to deployed backend URL
- Set production CORS whitelist in backend before public release

## Roadmap

- Driver route optimization and ETA prediction
- In-app chat between driver and passengers
- Payment integration for bike rental
- Push/email notifications for ride updates
- Admin analytics dashboard
- Unit/integration test coverage

## Contributing

Contributions are welcome.

1. Fork the repository
2. Create a branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -m "Add your feature"`
4. Push branch: `git push origin feature/your-feature`
5. Open a pull request

---

Built for sustainable campus mobility and smarter daily commuting.
