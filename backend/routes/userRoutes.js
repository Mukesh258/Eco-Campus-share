import express from "express";
import {
  setDriverOnlineStatus,
  getAvailableDrivers,
  getDriverProfile,
  rateDriver,
  ratePassenger,
  getUserRatings
} from "../controllers/userController.js";
import { authorizeRoles, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/driver-online-status", protect, authorizeRoles("driver", "admin"), setDriverOnlineStatus);
router.get("/available-drivers", getAvailableDrivers);
router.get("/driver/:driverId", getDriverProfile);
router.post("/rate-driver/:rideId", protect, rateDriver);
router.post("/rate-passenger/:rideId", protect, ratePassenger);
router.get("/ratings/:userId", getUserRatings);

export default router;
