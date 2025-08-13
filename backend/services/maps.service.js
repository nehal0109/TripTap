const axios = require("axios");
const captainModel = require("../models/captain.model");

const getPlaceIdNew = async (placeName) => {
  const apiKey = process.env.GOOGLE_MAPS_API;
  const url = "https://places.googleapis.com/v1/places:searchText";

  try {
    const response = await axios.post(
      url,
      { textQuery: placeName },
      {
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": "places.id,places.displayName",
        },
      }
    );

    const place = response.data.places?.[0];
    if (!place) throw new Error(`No Place ID found for "${placeName}"`);

    console.log(`Place: ${place.displayName.text}, ID: ${place.id}`);
    return place.id;
  } catch (err) {
    console.error(
      "Error fetching Place ID:",
      err.response?.data || err.message
    );
    throw err;
  }
};

const getLatLngFromPlace = async (placeName) => {
  const apiKey = process.env.GOOGLE_MAPS_API_2;
  const url = "https://places.googleapis.com/v1/places:searchText";

  try {
    console.log(placeName);
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
      "❌ Error fetching place coordinates: (Map Service)",
      err.response?.data || err.message
    );
    throw err;
  }
};

module.exports.getAddressCoordinate = async (placeName) => {
  const apiKey = process.env.GOOGLE_MAPS_API_2;
  const url = "https://places.googleapis.com/v1/places:searchText";

  try {
    const response = await axios.post(
      url,
      { textQuery: placeName },
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
      "❌ Error fetching place coordinates:",
      err.response?.data || err.message
    );
    throw err;
  }
};

module.exports.getDistanceTime = async (origin, destination) => {
  if (!origin || !destination) {
    throw new Error("Origin and destination are required");
  }

  // Step 1: Convert place names to latitude and longitude
  const pickupLatLng = await getLatLngFromPlace(origin);
  const destinationLatLng = await getLatLngFromPlace(destination);

  if (!pickupLatLng || !destinationLatLng) {
    throw new Error("Could not retrieve latitude/longitude for places.");
  }

  console.log("🚀 Pickup Lat/Lng:", pickupLatLng);
  console.log("🚀 Destination Lat/Lng:", destinationLatLng);

  const apiKey = process.env.GOOGLE_MAPS_API_2;
  const url = "https://routes.googleapis.com/directions/v2:computeRoutes";

  try {
    const response = await axios.post(
      url,
      {
        origin: { location: { latLng: pickupLatLng } },
        destination: { location: { latLng: destinationLatLng } },
        travelMode: "DRIVE",
        routingPreference: "TRAFFIC_AWARE",
        computeAlternativeRoutes: false,
        routeModifiers: {
          avoidTolls: false,
          avoidHighways: false,
          avoidFerries: false,
        },
        languageCode: "en-US",
        units: "METRIC",
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask":
            "routes.distanceMeters,routes.duration,routes.legs",
        },
      }
    );

    const route = response.data.routes?.[0];
    console.log(route.distanceMeters);
    console.log(route.duration);
    if (!route) throw new Error("No route found!");

    return {
      distanceMeters: route.distanceMeters,
      duration: route.duration,
      pickup: pickupLatLng,
      destination: destinationLatLng,
    };
  } catch (err) {
    console.error(
      "❌ Error fetching route:",
      err.response?.data || err.message
    );
    if (err.response)
      console.error(
        "⚠️ Full Error Response:",
        JSON.stringify(err.response.data, null, 2)
      );
    throw err;
  }
};

module.exports.getAutoCompleteSuggestions = async (input) => {
  if (!input) {
    throw new Error("query is required");
  }

  const apiKey = process.env.GOOGLE_MAPS_API;
  const url = "https://places.googleapis.com/v1/places:autocomplete";

  try {
    const response = await axios.post(
      url,
      { input: input },
      {
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
        },
      }
    );

    if (response.data.suggestions && Array.isArray(response.data.suggestions)) {
      const placeNames = response.data.suggestions.map(
        (suggestion) => suggestion.placePrediction.text.text
      );

      console.log("Extracted Place Names:", placeNames);
      return placeNames;
    } else {
      throw new Error("Invalid response structure from API");
    }
  } catch (err) {
    console.error(err);
    throw err;
  }
};

module.exports.getCaptainsInTheRadius = async (
  lng,
  ltd,
  radius,
  vehicleType
) => {
  // const captains = await captainModel.find({
  //   location: {
  //     $geoWithin: {
  //       $centerSphere: [[lng, ltd], radius / 6371],
  //     },
  //   },
  // });

  console.log("Vehicle Type:", vehicleType);
  vehicleType = vehicleType === "moto" ? "motorcycle" : vehicleType;

  const newCaptains = await captainModel.find({ "vehicle.vehicleType": vehicleType });

  console.log(newCaptains);

  return newCaptains;
};
