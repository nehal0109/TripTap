import React, { useEffect, useState } from "react";
import axios from "axios";

const Ads = () => {
  const [ads, setAds] = useState([]);

  useEffect(() => {
    const fetchAds = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/admin/ads`);
        setAds(response.data);
      } catch (error) {
        console.error("Error fetching ads:", error);
      }
    };

    fetchAds();
  }, []);

  return (
    <div className="w-full h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="flex space-x-4 overflow-x-auto w-full max-w-7xl p-4">
        {ads.length > 0 ? (
          ads.map((ad) => (
            <div key={ad._id} className="min-w-[250px] bg-white shadow-md rounded-lg p-3">
              {ad.imageUrl && (
                <img
                  src={`${import.meta.env.VITE_BASE_URL}${ad.imageUrl}`}
                  alt={ad.title}
                  className="w-full h-40 object-cover rounded-lg mb-2"
                />
              )}
              <h3 className="text-lg font-semibold">{ad.title}</h3>
              <p className="text-sm text-gray-600">{ad.description}</p>
              <p className="text-sm font-medium text-gray-800 mt-2">{ad.businessName}</p>
            </div>
          ))
        ) : (
          <p className="text-gray-500">No ads found</p>
        )}
      </div>
    </div>
  );
};

export default Ads;
