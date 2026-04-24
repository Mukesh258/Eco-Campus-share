import express from "express";
import { bookRide, createRide, getAllRides, getRideById, searchRides, getRecommendations, leaveRide, cancelRide, startRide, endRide, removePassenger } from "../controllers/rideController.js";
import { authorizeRoles, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, authorizeRoles("driver", "admin"), createRide);
router.get("/", getAllRides);
router.get("/search", searchRides);
router.get("/recommendations", protect, getRecommendations);
router.get("/:id", getRideById);
router.post("/:id/book", protect, authorizeRoles("student", "admin"), bookRide);
router.post("/:id/leave", protect, authorizeRoles("student", "admin"), leaveRide);
router.post("/:id/start", protect, authorizeRoles("driver", "admin"), startRide);
router.post("/:id/end", protect, authorizeRoles("driver", "admin"), endRide);
router.delete("/:id", protect, authorizeRoles("driver", "admin"), cancelRide);
router.delete("/:rideId/passengers/:userId", protect, authorizeRoles("driver", "admin"), removePassenger);

export default router;
