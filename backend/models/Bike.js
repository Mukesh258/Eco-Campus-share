import mongoose from "mongoose";

const bikeSchema = new mongoose.Schema(
  {
    bikeName: {
      type: String,
      required: true,
      trim: true,
    },
    bikeNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    bikeType: {
      type: String,
      enum: ["standard", "electric", "mountain"],
      default: "standard",
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    currentUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    pricePerHour: {
      type: Number,
      required: true,
      min: 0,
    },
    condition: {
      type: String,
      enum: ["excellent", "good", "fair"],
      default: "good",
    },
    rentalHistory: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        bookingDate: {
          type: Date,
          default: Date.now,
        },
        returnDate: {
          type: Date,
          default: null,
        },
        hoursUsed: {
          type: Number,
          default: 0,
        },
      },
    ],
  },
  { timestamps: true }
);

const Bike = mongoose.model("Bike", bikeSchema);
export default Bike;
