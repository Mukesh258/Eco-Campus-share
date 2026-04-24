import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import rideRoutes from "./routes/rideRoutes.js";
import bikeRoutes from "./routes/bikeRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";

dotenv.config();
connectDB();

const allowedOrigins = (process.env.CLIENT_URLS || "http://localhost:5173,http://127.0.0.1:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser or same-origin requests with no Origin header.
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  credentials: true
};

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: corsOptions
});

app.set("io", io);

app.use(cors(corsOptions));
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ message: "Eco-Share API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/rides", rideRoutes);
app.use("/api/bikes", bikeRoutes);
app.use("/api/users", userRoutes);

app.use(notFound);
app.use(errorHandler);

// Real-time Socket logic
io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  socket.on("join-ride", (rideId) => {
    socket.join(rideId);
    console.log(`Socket ${socket.id} joined ride ${rideId}`);
  });

  socket.on("update-location", ({ rideId, userId, coords }) => {
    // Broadcast to everyone in the ride room EXCEPT the sender
    socket.to(rideId).emit("location-updated", { userId, coords });
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT} and accepting network connections`);
});
