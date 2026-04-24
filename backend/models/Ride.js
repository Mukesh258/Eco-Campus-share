import mongoose from "mongoose";

const rideSchema = new mongoose.Schema(
  {
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    source: {
      type: String,
      required: true,
      trim: true
    },
    destination: {
      type: String,
      required: true,
      trim: true
    },
    departureTime: {
      type: Date,
      required: true
    },
    totalSeats: {
      type: Number,
      required: true,
      min: 1,
      max: 8
    },
    availableSeats: {
      type: Number,
      required: true,
      min: 0
    },
    fare: {
      type: Number,
      required: true,
      min: 0
    },
    status: {
      type: String,
      enum: ["active", "in_progress", "completed", "cancelled"],
      default: "active"
    },
    startedAt: {
      type: Date,
      default: null
    },
    endedAt: {
      type: Date,
      default: null
    },
    passengers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],
    description: {
      type: String,
      trim: true
    },
    driverRating: {
      type: Number,
      min: 1,
      max: 5,
      default: null
    },
    passengerRating: {
      type: Number,
      min: 1,
      max: 5,
      default: null
    },
    driverReview: {
      type: String,
      trim: true,
      default: null
    },
    passengerReview: {
      type: String,
      trim: true,
      default: null
    }
  },
  { timestamps: true }
);

const Ride = mongoose.model("Ride", rideSchema);

export default Ride;
