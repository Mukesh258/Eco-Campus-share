import Ride from "../models/Ride.js";

export const createRide = async (req, res, next) => {
  try {
    const { source, destination, departureTime, totalSeats, fare, description } = req.body;

    if (!source || !destination || !departureTime || !totalSeats || fare === undefined) {
      res.status(400);
      throw new Error("Missing required fields");
    }

    if (totalSeats < 1 || totalSeats > 8) {
      res.status(400);
      throw new Error("Total seats must be between 1 and 8");
    }

    const ride = await Ride.create({
      driver: req.user._id,
      source,
      destination,
      departureTime,
      totalSeats,
      availableSeats: totalSeats,
      fare,
      description
    });

    const populatedRide = await ride.populate("driver", "name email");

    const io = req.app.get("io");
    if (io) {
      io.emit("ride-created", populatedRide);
    }

    res.status(201).json(populatedRide);
  } catch (error) {
    next(error);
  }
};

export const getAllRides = async (req, res, next) => {
  try {
    const rides = await Ride.find({ status: { $in: ["active", "in_progress", "completed"] } })
      .populate("driver", "name email")
      .populate("passengers", "name email")
      .sort({ departureTime: 1 });

    res.status(200).json(rides);
  } catch (error) {
    next(error);
  }
};

export const searchRides = async (req, res, next) => {
  try {
    const { source, destination } = req.query;

    if (!source && !destination) {
      res.status(400);
      throw new Error("Provide source or destination for search");
    }

    const query = { status: "active", availableSeats: { $gt: 0 } };

    if (source) {
      query.source = { $regex: source, $options: "i" };
    }

    if (destination) {
      query.destination = { $regex: destination, $options: "i" };
    }

    const rides = await Ride.find(query)
      .populate("driver", "name email")
      .populate("passengers", "name email")
      .sort({ departureTime: 1 });

    res.status(200).json(rides);
  } catch (error) {
    next(error);
  }
};

export const bookRide = async (req, res, next) => {
  try {
    const ride = await Ride.findById(req.params.id);

    if (!ride) {
      res.status(404);
      throw new Error("Ride not found");
    }

    if (ride.status !== "active") {
      res.status(400);
      throw new Error("Ride is not active");
    }

    if (ride.availableSeats === 0) {
      res.status(400);
      throw new Error("No available seats");
    }

    if (ride.driver.toString() === req.user._id.toString()) {
      res.status(400);
      throw new Error("Cannot book your own ride");
    }

    if (ride.passengers.includes(req.user._id)) {
      res.status(400);
      throw new Error("Already booked this ride");
    }

    ride.passengers.push(req.user._id);
    ride.availableSeats -= 1;

    await ride.save();

    const updatedRide = await ride.populate([
      { path: "driver", select: "name email" },
      { path: "passengers", select: "name email" }
    ]);

    const io = req.app.get("io");
    if (io) {
      io.emit("ride-updated", updatedRide);
    }

    res.status(200).json(updatedRide);
  } catch (error) {
    next(error);
  }
};

export const getRideById = async (req, res, next) => {
  try {
    const ride = await Ride.findById(req.params.id).populate([
      { path: "driver", select: "name email" },
      { path: "passengers", select: "name email" }
    ]);

    if (!ride) {
      res.status(404);
      throw new Error("Ride not found");
    }

    res.status(200).json(ride);
  } catch (error) {
    next(error);
  }
};

export const getRecommendations = async (req, res, next) => {
  try {
    const { location, timing } = req.query; 
    const userId = req.user._id;

    // 1. Fetch user's historical rides (driver or passenger)
    const pastRides = await Ride.find({
      $or: [{ driver: userId }, { passengers: userId }]
    });

    // 2. Extract common patterns
    const sources = {};
    const destinations = {};
    const hours = {};

    pastRides.forEach((r) => {
      sources[r.source] = (sources[r.source] || 0) + 1;
      destinations[r.destination] = (destinations[r.destination] || 0) + 1;
      
      const hr = new Date(r.departureTime).getHours();
      hours[hr] = (hours[hr] || 0) + 1;
    });

    const getTopKeys = (obj) => Object.entries(obj).sort((a,b) => b[1] - a[1]).map(e => e[0]);
    
    // Top 3 frequent locations/hours
    const topSources = getTopKeys(sources).slice(0, 3);
    const topDestinations = getTopKeys(destinations).slice(0, 3);
    const topHours = getTopKeys(hours).slice(0, 3).map(Number);

    // 3. Fetch active available rides (excluding ones the user is part of)
    let activeRides = await Ride.find({
      status: "active",
      availableSeats: { $gt: 0 },
      driver: { $ne: userId },
      passengers: { $ne: userId }
    })
      .populate("driver", "name email")
      .populate("passengers", "name email");

    // 4. Score rides based on request and history
    const reqTimingHr = timing ? parseInt(timing.split(":")[0]) : null;

    const scoredRides = activeRides.map((ride) => {
      let score = 0;
      const rHr = new Date(ride.departureTime).getHours();

      // Explicit Query Matches
      if (location && ride.source.toLowerCase().includes(location.toLowerCase())) score += 3;
      if (reqTimingHr !== null && Math.abs(rHr - reqTimingHr) <= 1) score += 3;

      // Historical Pattern Matches
      if (topSources.includes(ride.source)) score += 2;
      if (topDestinations.includes(ride.destination)) score += 1;
      if (topHours.includes(rHr)) score += 2;

      return { ride, score };
    });

    // 5. Select recommended rides
    const recommendations = scoredRides
      .filter((sr) => sr.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((sr) => sr.ride);

    res.status(200).json(recommendations);
  } catch (error) {
    next(error);
  }
};

export const leaveRide = async (req, res, next) => {
  try {
    const ride = await Ride.findById(req.params.id);

    if (!ride) {
      res.status(404);
      throw new Error("Ride not found");
    }

    if (ride.status !== "active") {
      res.status(400);
      throw new Error("Cannot leave a ride that is not active");
    }

    const passIndex = ride.passengers.indexOf(req.user._id);
    if (passIndex === -1) {
      res.status(400);
      throw new Error("You are not booked on this ride");
    }

    ride.passengers.splice(passIndex, 1);
    ride.availableSeats += 1;

    await ride.save();

    const updatedRide = await ride.populate([
      { path: "driver", select: "name email" },
      { path: "passengers", select: "name email" }
    ]);

    const io = req.app.get("io");
    if (io) {
      io.emit("ride-updated", updatedRide);
    }

    res.status(200).json(updatedRide);
  } catch (error) {
    next(error);
  }
};

export const cancelRide = async (req, res, next) => {
  try {
    const ride = await Ride.findById(req.params.id);

    if (!ride) {
      res.status(404);
      throw new Error("Ride not found");
    }

    if (ride.driver.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error("Not authorized to cancel this ride");
    }

    ride.status = "cancelled";
    await ride.save();

    const updatedRide = await ride.populate([
      { path: "driver", select: "name email" },
      { path: "passengers", select: "name email" }
    ]);

    const io = req.app.get("io");
    if (io) {
      io.emit("ride-cancelled", updatedRide);
    }

    res.status(200).json({ message: "Ride cancelled successfully", ride: updatedRide });
  } catch (error) {
    next(error);
  }
};

export const startRide = async (req, res, next) => {
  try {
    const ride = await Ride.findById(req.params.id);

    if (!ride) {
      res.status(404);
      throw new Error("Ride not found");
    }

    if (ride.driver.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error("Not authorized to start this ride");
    }

    if (ride.status !== "active") {
      res.status(400);
      throw new Error("Only active rides can be started");
    }

    ride.status = "in_progress";
    ride.startedAt = new Date();
    await ride.save();

    const updatedRide = await ride.populate([
      { path: "driver", select: "name email" },
      { path: "passengers", select: "name email" }
    ]);

    const io = req.app.get("io");
    if (io) {
      io.emit("ride-updated", updatedRide);
    }

    res.status(200).json({ message: "Ride started successfully", ride: updatedRide });
  } catch (error) {
    next(error);
  }
};

export const endRide = async (req, res, next) => {
  try {
    const ride = await Ride.findById(req.params.id);

    if (!ride) {
      res.status(404);
      throw new Error("Ride not found");
    }

    if (ride.driver.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error("Not authorized to end this ride");
    }

    if (ride.status !== "in_progress") {
      res.status(400);
      throw new Error("Only in-progress rides can be ended");
    }

    ride.status = "completed";
    ride.endedAt = new Date();
    await ride.save();

    const updatedRide = await ride.populate([
      { path: "driver", select: "name email" },
      { path: "passengers", select: "name email" }
    ]);

    const io = req.app.get("io");
    if (io) {
      io.emit("ride-updated", updatedRide);
    }

    res.status(200).json({ message: "Ride ended successfully", ride: updatedRide });
  } catch (error) {
    next(error);
  }
};

export const removePassenger = async (req, res, next) => {
  try {
    const { rideId, userId } = req.params;
    const ride = await Ride.findById(rideId);

    if (!ride) {
      res.status(404);
      throw new Error("Ride not found");
    }

    if (ride.driver.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error("Not authorized to manage passengers for this ride");
    }

    const passIndex = ride.passengers.indexOf(userId);
    if (passIndex === -1) {
      res.status(400);
      throw new Error("Passenger not found in this ride");
    }

    ride.passengers.splice(passIndex, 1);
    ride.availableSeats += 1;

    await ride.save();

    const updatedRide = await ride.populate([
      { path: "driver", select: "name email" },
      { path: "passengers", select: "name email" }
    ]);

    const io = req.app.get("io");
    if (io) {
      io.emit("ride-updated", updatedRide);
    }

    res.status(200).json({ message: "Passenger removed", ride: updatedRide });
  } catch (error) {
    next(error);
  }
};
