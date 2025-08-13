import React, { useState, useEffect } from 'react';
import { Upload } from 'lucide-react';
import axios from 'axios';

const AdminHome = () => {
  const [adData, setAdData] = useState({
    title: '',
    description: '',
    image: null,
    businessName: '',
    city: '',
  });
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchAds = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/admin/ads`, {
        headers: { 'x-auth-token': token }
      });
      setAds(response.data);
    } catch (error) {
      console.error('Error fetching ads:', error);
    }
  };

  useEffect(() => {
    fetchAds();
  }, []);

  const handleChange = (e) => {
    setAdData({ ...adData, [e.target.name]: e.target.value });
  };

  const handleImageUpload = (e) => {
    setAdData({ ...adData, image: e.target.files[0] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('title', adData.title);
      formData.append('description', adData.description);
      formData.append('businessName', adData.businessName);
      formData.append('city', adData.city.toUpperCase());
      if (adData.image) {
        formData.append('image', adData.image);
      } else {
        console.error("No image selected");
      }
      console.log("Submitting:", formData);
      
      const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/admin/ads`, formData, {
        headers: {
          'x-auth-token': token,
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log('Ad created:', response.data);
      fetchAds();
      setAdData({ title: '', description: '', image: null, businessName: '' });
    } catch (error) {
      console.error('Error uploading ad:', error);
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gray-100">
      <div className="w-full max-w-md bg-white shadow-lg rounded-2xl p-6">
        <h2 className="text-xl font-semibold text-gray-800 text-center mb-4">Upload Ad Details</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="block font-medium text-gray-700">Title</label>
            <input id="title" name="title" value={adData.title} onChange={handleChange} required className="w-full p-2 border rounded-lg focus:ring focus:ring-blue-300" />
          </div>
          <div>
            <label htmlFor="description" className="block font-medium text-gray-700">Description</label>
            <textarea id="description" name="description" value={adData.description} onChange={handleChange} className="w-full p-2 border rounded-lg focus:ring focus:ring-blue-300"></textarea>
          </div>
          <div>
            <label htmlFor="businessName" className="block font-medium text-gray-700">Business Name</label>
            <input id="businessName" name="businessName" value={adData.businessName} onChange={handleChange} required className="w-full p-2 border rounded-lg focus:ring focus:ring-blue-300" />
          </div>
          <div>
            <label htmlFor="city" className="block font-medium text-gray-700">City</label>
            <input id="city" name="city" value={adData.city} onChange={handleChange} required className="w-full p-2 border rounded-lg focus:ring focus:ring-blue-300" />
          </div>
          <div className="border-dashed border-2 border-gray-300 rounded-lg p-4 text-center">
            <input id="image" type="file" name="image" className="hidden" onChange={handleImageUpload} />
            <label htmlFor="image" className="cursor-pointer flex flex-col items-center justify-center text-gray-500">
              <Upload className="w-8 h-8 mb-2" />
              {adData.image ? adData.image.name : 'Click to upload image'}
            </label>
          </div>
          <button type="submit" className="w-full bg-green-600 text-white p-2 rounded-lg hover:bg-blue-700" disabled={loading}>
            {loading ? 'Uploading...' : 'Upload Ad'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminHome;
