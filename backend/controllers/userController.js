import User from "../models/User.js";
import Ride from "../models/Ride.js";

// Set driver online/offline
export const setDriverOnlineStatus = async (req, res, next) => {
  try {
    const { isOnline } = req.body;

    if (typeof isOnline !== "boolean") {
      res.status(400);
      throw new Error("isOnline must be a boolean value");
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    user.isOnline = isOnline;
    await user.save();

    res.status(200).json({
      message: `Driver is now ${isOnline ? "online" : "offline"}`,
      user
    });
  } catch (error) {
    next(error);
  }
};

// Get available drivers for matching
export const getAvailableDrivers = async (req, res, next) => {
  try {
    const drivers = await User.find({ role: "driver", isOnline: true })
      .select("name email averageRating totalRatings completedRides")
      .sort({ averageRating: -1 });

    res.status(200).json(drivers);
  } catch (error) {
    next(error);
  }
};

// Get driver profile with stats
export const getDriverProfile = async (req, res, next) => {
  try {
    const { driverId } = req.params;

    const driver = await User.findById(driverId)
      .select("name email role averageRating totalRatings completedRides isOnline");

    if (!driver) {
      res.status(404);
      throw new Error("Driver not found");
    }

    // Get recent rides
    const rides = await Ride.find({ driver: driverId, status: "completed" })
      .populate("passengers", "name email")
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      driver,
      recentRides: rides
    });
  } catch (error) {
    next(error);
  }
};

// Rate driver after ride completion
export const rateDriver = async (req, res, next) => {
  try {
    const { rideId } = req.params;
    const { rating, review } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      res.status(400);
      throw new Error("Rating must be between 1 and 5");
    }

    const ride = await Ride.findById(rideId);
    if (!ride) {
      res.status(404);
      throw new Error("Ride not found");
    }

    if (ride.status !== "completed") {
      res.status(400);
      throw new Error("Can only rate completed rides");
    }

    // Check if passenger has already rated
    if (ride.driverRating) {
      res.status(400);
      throw new Error("This ride has already been rated");
    }

    ride.driverRating = rating;
    if (review) ride.driverReview = review;
    await ride.save();

    // Update driver average rating
    const driver = await User.findById(ride.driver);
    const allRatings = await Ride.find({ 
      driver: ride.driver, 
      driverRating: { $exists: true, $ne: null } 
    });

    const totalRating = allRatings.reduce((sum, r) => sum + r.driverRating, 0);
    driver.averageRating = (totalRating / allRatings.length).toFixed(1);
    driver.totalRatings = allRatings.length;
    driver.completedRides = await Ride.countDocuments({ driver: ride.driver, status: "completed" });
    await driver.save();

    res.status(200).json({
      message: "Driver rated successfully",
      ride,
      driver
    });
  } catch (error) {
    next(error);
  }
};

// Rate passenger after ride completion
export const ratePassenger = async (req, res, next) => {
  try {
    const { rideId } = req.params;
    const { rating, review } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      res.status(400);
      throw new Error("Rating must be between 1 and 5");
    }

    const ride = await Ride.findById(rideId);
    if (!ride) {
      res.status(404);
      throw new Error("Ride not found");
    }

    if (ride.status !== "completed") {
      res.status(400);
      throw new Error("Can only rate completed rides");
    }

    if (ride.driver.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error("Not authorized to rate this ride");
    }

    if (ride.passengerRating) {
      res.status(400);
      throw new Error("This ride has already been rated");
    }

    ride.passengerRating = rating;
    if (review) ride.passengerReview = review;
    await ride.save();

    res.status(200).json({
      message: "Passenger rated successfully",
      ride
    });
  } catch (error) {
    next(error);
  }
};

// Get user's ratings and reviews
export const getUserRatings = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .select("name averageRating totalRatings completedRides");

    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    // Get rides where this user is a passenger
    const passengerRides = await Ride.find({
      passengers: userId,
      status: "completed",
      driverRating: { $exists: true, $ne: null }
    })
      .select("source destination driverRating driverReview");

    res.status(200).json({
      user,
      reviews: passengerRides
    });
  } catch (error) {
    next(error);
  }
};
