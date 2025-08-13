import React, { useState } from "react";

const CustomFarePanel = ({
  fare,
  vehicleType,
  setFare,
  setCustomFarePanel,
  setConfirmRidePanel,
}) => {
  const [customFare, setCustomFare] = useState("");
  const [error, setError] = useState("");

  const baseFare = fare[vehicleType?.toLowerCase()];

  const handleSubmit = () => {
    const custom = parseFloat(customFare);

    if (isNaN(custom)) {
      setError("Please enter a valid number");
    } else if (custom < baseFare) {
      setError(`Fare must be more than ₹${baseFare}`);
    } else {
      setFare((prev) => ({
        ...prev,
        [vehicleType.toLowerCase()]: custom,
        customFare: custom,
      }));
      setCustomFarePanel(false);
      setConfirmRidePanel(true);
    }
  };

  return (
    <div className="bg-white h-[40%] p-6 rounded-t-lg shadow-lg">
      <h2 className="text-xl font-semibold mb-4">Set Your Fare</h2>
      <p className="mb-2 text-gray-700">
        Base fare for <span className="font-bold">{vehicleType}</span>: ₹
        {baseFare}
      </p>
      <input
        type="number"
        value={customFare}
        onChange={(e) => setCustomFare(e.target.value)}
        className="border border-gray-300 rounded px-4 py-2 w-full mb-2"
        placeholder={`Enter a fare more than ₹${baseFare}`}
      />
      {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
      <button
        onClick={handleSubmit}
        className="bg-black text-white w-full py-2 rounded"
      >
        Confirm Fare
      </button>
    </div>
  );
};

export default CustomFarePanel;
