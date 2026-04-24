import Bike from "../models/Bike.js";

// Add new bike
export const addBike = async (req, res, next) => {
  try {
    const { bikeName, bikeNumber, bikeType, location, pricePerHour, condition } = req.body;

    if (!bikeName || !bikeNumber || !location || !pricePerHour) {
      res.status(400);
      throw new Error("Missing required fields: bikeName, bikeNumber, location, pricePerHour");
    }

    // Check if bike number already exists
    const existingBike = await Bike.findOne({ bikeNumber });
    if (existingBike) {
      res.status(400);
      throw new Error("Bike with this number already exists");
    }

    const bike = await Bike.create({
      bikeName,
      bikeNumber,
      bikeType: bikeType || "standard",
      location,
      pricePerHour,
      condition: condition || "good",
      isAvailable: true,
    });

    res.status(201).json(bike);
  } catch (error) {
    next(error);
  }
};

// Get all bikes
export const getAllBikes = async (req, res, next) => {
  try {
    const bikes = await Bike.find()
      .populate("currentUser", "name email")
      .sort({ bikeName: 1 });

    res.status(200).json(bikes);
  } catch (error) {
    next(error);
  }
};

// Get available bikes only
export const getAvailableBikes = async (req, res, next) => {
  try {
    const { bikeType } = req.query;
    
    const query = { isAvailable: true };
    if (bikeType) {
      query.bikeType = bikeType;
    }

    const bikes = await Bike.find(query).sort({ bikeName: 1 });

    res.status(200).json(bikes);
  } catch (error) {
    next(error);
  }
};

// Get bike by ID
export const getBikeById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const bike = await Bike.findById(id).populate("currentUser", "name email");

    if (!bike) {
      res.status(404);
      throw new Error("Bike not found");
    }

    res.status(200).json(bike);
  } catch (error) {
    next(error);
  }
};

// Book a bike
export const bookBike = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const bike = await Bike.findById(id);
    if (!bike) {
      res.status(404);
      throw new Error("Bike not found");
    }

    if (!bike.isAvailable) {
      res.status(400);
      throw new Error("Bike is not available for booking");
    }

    // Update bike status
    bike.isAvailable = false;
    bike.currentUser = userId;
    await bike.save();

    const updatedBike = await bike.populate("currentUser", "name email");

    res.status(200).json({
      message: "Bike booked successfully",
      bike: updatedBike,
    });
  } catch (error) {
    next(error);
  }
};

// Return a bike
export const returnBike = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const { hoursUsed } = req.body;

    const bike = await Bike.findById(id);
    if (!bike) {
      res.status(404);
      throw new Error("Bike not found");
    }

    if (bike.isAvailable) {
      res.status(400);
      throw new Error("Bike is already available");
    }

    if (bike.currentUser.toString() !== userId.toString()) {
      res.status(403);
      throw new Error("You cannot return a bike that you didn't book");
    }

    // Add to rental history
    bike.rentalHistory.push({
      user: userId,
      returnDate: new Date(),
      hoursUsed: hoursUsed || 1,
    });

    // Update bike status
    bike.isAvailable = true;
    bike.currentUser = null;
    await bike.save();

    const updatedBike = await bike.populate("rentalHistory.user", "name email");

    res.status(200).json({
      message: "Bike returned successfully",
      bike: updatedBike,
    });
  } catch (error) {
    next(error);
  }
};
