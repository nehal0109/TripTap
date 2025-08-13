const rideModel = require("../models/ride.model");
const mapService = require("./maps.service");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const captainModel = require("../models/captain.model");

async function getFare(pickup, destination) {
  if (!pickup || !destination) {
    throw new Error("Pickup and destination are required");
  }

  // Get distance, duration, and (optionally) route details from mapService
  const distanceTime = await mapService.getDistanceTime(pickup, destination);

  // Helper function: convert meters to kilometers
  const metersToKm = (meters) => meters / 1000;
  // Helper function: convert seconds string to hours
  const secondsToHours = (seconds) => seconds / 3600;

  // Extract journey details
  const distanceKm = metersToKm(distanceTime.distanceMeters);
  // Assuming duration is a string like '2953s'
  const durationSeconds = parseInt(distanceTime.duration.replace("s", ""));
  const durationHours = secondsToHours(durationSeconds);
  const durationMinutes = durationSeconds / 60;

  // Fetch weather data using OpenWeather API at the pickup location
  const weatherData = await fetchWeatherData(
    distanceTime.pickup.latitude,
    distanceTime.pickup.longitude
  );

  // Base pricing configuration
  const baseRates = { bike: 20, auto: 40, car: 60 };
  const ecoDiscounts = { bike: 0.1, auto: 0.05, car: 0 };
  const perKmRates = { bike: 8, auto: 12, car: 15 };

  // Get current time details for dynamic multipliers
  const now = new Date();
  const currentHour = now.getHours();

  // Traffic multiplier (time-based simulation)
  const trafficMultiplier =
    (currentHour >= 8 && currentHour <= 10) ||
    (currentHour >= 17 && currentHour <= 20)
      ? 0.85 // efficient traffic flow due to better route planning or off-peak (simulated)
      : 1.1; // slower speeds, more delays

  // Safety surcharge (late night)
  const safetySurcharge = currentHour >= 22 || currentHour < 5 ? 15 : 0;

  // Happy hour discount (afternoon discount)
  const happyHourDiscount = currentHour >= 14 && currentHour < 16 ? 0.15 : 0;

  // Weather adjustments per vehicle type
  // Example: If raining, bikes might be less efficient; if too hot, autos/cars might be adjusted slightly.
  const weatherModifiers = {
    bike: weatherData.rain ? 0.1 : 0,
    auto: weatherData.temp > 30 ? -0.05 : 0,
    car: weatherData.temp > 30 ? -0.05 : 0,
  };

  // EXTRA DYNAMIC FACTORS:

  // 1. Route Complexity Multiplier:
  // We simulate route complexity based on the ratio of duration to distance.
  // A higher ratio can indicate a twisty or congested route.
  const complexityScore = durationMinutes / distanceKm;
  // Normalize: assume an average ratio is around 3 minutes per km.
  const complexityMultiplier =
    complexityScore > 3 ? 1 + (complexityScore - 3) * 0.02 : 1;

  // 2. Road Quality / Fuel Surcharge:
  // Simulate poorer road conditions with a multiplier.
  // For example, if it's raining, roads might be worse, adding an extra cost.
  const roadQualityFactor = weatherData.rain ? 1.05 : 1;

  // Helper: Calculate fare for a given vehicle type.
  const calculateVehicleFare = (vehicleType) => {
    // Base fare adjusted by an eco-friendly discount
    let fare = baseRates[vehicleType] * (1 - ecoDiscounts[vehicleType]);

    // Add distance cost (with traffic multiplier and route complexity)
    fare +=
      distanceKm *
      perKmRates[vehicleType] *
      trafficMultiplier *
      complexityMultiplier;

    // Add a cost factor based on journey duration
    // (Assume a nominal time rate; here we use 0.5 per minute as an example)
    fare += durationMinutes * 0.5;

    // Apply fuel surcharge if road conditions are poor
    fare *= roadQualityFactor;

    // Add safety surcharge
    fare += safetySurcharge;

    // Apply happy hour discount
    fare *= 1 - happyHourDiscount;

    // Apply weather adjustments
    fare *= 1 + weatherModifiers[vehicleType];

    // Ensure a minimum fare threshold (at least 50% of the base fare)
    return Math.max(fare, baseRates[vehicleType] * 0.5);
  };

  // Compute fares for each vehicle type
  const fare = {
    moto: Math.round(calculateVehicleFare("bike")),
    auto: Math.round(calculateVehicleFare("auto")),
    car: Math.round(calculateVehicleFare("car")),
    distance: distanceKm
  };

  console.log("Fare details:", fare);
  return fare;
}

// Helper function to fetch weather data from OpenWeather API
async function fetchWeatherData(lat, lon) {
  const apiKey = process.env.OPENWEATHER_API_KEY; // Replace with your valid API key
  const response = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`
  );
  const data = await response.json();

  return {
    temp: data.main.temp,
    rain: data.rain ? true : false,
  };
}

async function getCoordinates2(pickup, destination) {
  if (!pickup || !destination) {
    throw new Error("Pickup and destination are required");
  }

  const distanceTime = await mapService.getDistanceTime(pickup, destination);
  console.log(distanceTime);

  return distanceTime;
}

module.exports.getFare = getFare;
module.exports.getCoordinates2 = getCoordinates2;

function getOtp(num) {
  function generateOtp(num) {
    const otp = crypto
      .randomInt(Math.pow(10, num - 1), Math.pow(10, num))
      .toString();
    return otp;
  }
  return generateOtp(num);
}

module.exports.createRide = async ({
  user,
  pickup,
  destination,
  vehicleType,
  fare,
}) => {
  if (!user || !pickup || !destination || !vehicleType) {
    throw new Error("All fields are required");
  }

  console.log("pickup", pickup);
  console.log("destination", destination);

  const distanceTime = await mapService.getDistanceTime(pickup, destination);
  const metersToKm = (meters) => meters / 1000;
  const distanceKm = metersToKm(distanceTime.distanceMeters);

  const fare_initial = await getFare(pickup, destination);

  const finalFare =
    fare && fare[vehicleType] ? fare[vehicleType] : fare_initial[vehicleType];

  const ride = await rideModel.create({
    user,
    pickup,
    destination,
    otp: getOtp(6),
    fare: finalFare,
    distance: distanceKm,
    vehicleType,
  });

  return ride;
};


module.exports.confirmRide = async ({ rideId, captain }) => {
  if (!rideId) {
    throw new Error("Ride id is required");
  }

  // Check if the ride is already accepted
  const existingRide = await rideModel.findOne({ _id: rideId });

  if (!existingRide) {
    throw new Error("Ride not found");
  }

  if (existingRide.status === "accepted") {
    throw new Error("Ride is already accepted by another captain");
  }

  // Update ride status and assign captain
  await rideModel.findOneAndUpdate(
    { _id: rideId },
    {
      status: "accepted",
      captain: captain._id,
    }
  );

  // Fetch updated ride details
  const ride = await rideModel
    .findOne({ _id: rideId })
    .populate("user")
    .populate("captain")
    .select("+otp");

  return ride;
};


module.exports.startRide = async ({ rideId, otp, captain }) => {
  if (!rideId || !otp) {
    throw new Error("Ride id and OTP are required");
  }

  const ride = await rideModel
    .findOne({
      _id: rideId,
    })
    .populate("user")
    .populate("captain")
    .select("+otp");

  if (!ride) {
    throw new Error("Ride not found");
  }

  if (ride.status !== "accepted") {
    throw new Error("Ride not accepted");
  }

  if (ride.otp !== otp) {
    throw new Error("Invalid OTP");
  }

  await rideModel.findOneAndUpdate(
    {
      _id: rideId,
    },
    {
      status: "ongoing",
    }
  );

  return ride;
};

module.exports.endRide = async ({ rideId, captain }) => {
  if (!rideId) {
    throw new Error("Ride id is required");
  }

  const ride = await rideModel
    .findOne({
      _id: rideId,
      captain: captain._id,
    })
    .populate("user")
    .populate("captain")
    .select("+otp");

  if (!ride) {
    throw new Error("Ride not found");
  }

  if (ride.status !== "ongoing") {
    throw new Error("Ride not ongoing");
  }

  await rideModel.findOneAndUpdate(
    {
      _id: rideId,
    },
    {
      status: "completed",
    }
  );

  console.log("ride updation done");

  await captainModel.findOneAndUpdate(
    { _id: captain._id },
    { $inc: { earnings: ride.fare } }
  );

  console.log("Captain earnings updated");

  return ride;
};
