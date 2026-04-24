import express from "express";
import {
  addBike,
  getAllBikes,
  getAvailableBikes,
  getBikeById,
  bookBike,
  returnBike,
} from "../controllers/bikeController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", addBike);
router.get("/", getAllBikes);
router.get("/available", getAvailableBikes);
router.get("/:id", getBikeById);
router.post("/:id/book", protect, bookBike);
router.post("/:id/return", protect, returnBike);

export default router;
