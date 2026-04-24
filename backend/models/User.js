import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ["student", "driver", "admin"],
      default: "student"
    },
    isOnline: {
      type: Boolean,
      default: false
    },
    averageRating: {
      type: Number,
      default: 5.0,
      min: 1,
      max: 5
    },
    totalRatings: {
      type: Number,
      default: 0
    },
    completedRides: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
