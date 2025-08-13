const rideService = require("../services/ride.service");
const { validationResult } = require("express-validator");
const mapService = require("../services/maps.service");
const { sendMessageToSocketId } = require("../socket");
const rideModel = require("../models/ride.model");
const axios = require("axios");
require("dotenv").config();

const getLatLngFromPlace = async (placeName) => {
  const apiKey = process.env.GOOGLE_MAPS_API_2;
  const url = "https://places.googleapis.com/v1/places:searchText";

  try {
    const response = await axios.post(
      url,
      { text_query: placeName },
      {
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": "places.location",
        },
      }
    );

    const place = response.data.places?.[0];
    if (!place || !place.location) throw new Error("No location found!");

    return place.location; // { latitude: 40.7128, longitude: -74.0060 }
  } catch (err) {
    console.error(
      "❌ Error fetching place coordinates: (In Ride Controller)",
      err.response?.data || err.message
    );
    throw err;
  }
};

module.exports.createRide = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { userId, pickup, destination, vehicleType, fare } = req.body;

  try {
    // Convert pickup and destination to coordinates
    // const pickupCoordinates = await getLatLngFromPlace(pickup);
    // const destinationCoordinates = await getLatLngFromPlace(destination);
    const response = await rideService.getCoordinates2(pickup, destination);
    console.log(response);

    pickupCoordinates = response.pickup;
    destinationCoordinates = response.destination;
    console.log("pickupCoordinates", pickupCoordinates);
    console.log("destinationCoordinates", destinationCoordinates);

    const ride = await rideService.createRide({
      user: req.user._id,
      pickup: pickup,
      destination: destination,
      vehicleType,
      fare,
    });
    
    console.log("Hello");

    const captainsInRadius = await mapService.getCaptainsInTheRadius(
      pickupCoordinates.latitude,
      pickupCoordinates.longitude,
      2,
      vehicleType
    );

    ride.otp = "";
    const rideWithUser = await rideModel
      .findOne({ _id: ride._id })
      .populate("user");

    captainsInRadius.forEach((captain) => {
      sendMessageToSocketId(captain.socketId, {
        event: "new-ride",
        data: rideWithUser,
      });
    });
    res.status(201).json(ride);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: err.message });
  }
};

module.exports.getFare = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { pickup, destination } = req.query;

  try {
    const fare = await rideService.getFare(pickup, destination);
    return res.status(200).json(fare);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

module.exports.confirmRide = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { rideId } = req.body;

  try {
    const ride = await rideService.confirmRide({
      rideId,
      captain: req.captain,
    });

    sendMessageToSocketId(ride.user.socketId, {
      event: "ride-confirmed",
      data: ride,
    });

    return res.status(200).json(ride);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: err.message });
  }
};

module.exports.startRide = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { rideId, otp } = req.query;

  try {
    const ride = await rideService.startRide({
      rideId,
      otp,
      captain: req.captain,
    });

    console.log(ride);

    sendMessageToSocketId(ride.user.socketId, {
      event: "ride-started",
      data: ride,
    });

    return res.status(200).json(ride);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

module.exports.endRide = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { rideId } = req.body;

  try {
    const ride = await rideService.endRide({ rideId, captain: req.captain });

    sendMessageToSocketId(ride.user.socketId, {
      event: "ride-ended",
      data: ride,
    });

    return res.status(200).json(ride);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
  s;
};
