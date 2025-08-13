import React, { useRef, useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import CaptainDetails from '../components/CaptainDetails';
import RidePopUp from '../components/RidePopUp';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import ConfirmRidePopUp from '../components/ConfirmRidePopUp';
import { SocketContext } from '../context/SocketContext';
import { CaptainDataContext } from '../context/CaptainContext';
import axios from 'axios';
import LiveTracking from '../components/LiveTracking';

const CaptainHome = () => {
    const [ridePopupPanel, setRidePopupPanel] = useState(false);
    const [confirmRidePopupPanel, setConfirmRidePopupPanel] = useState(false);
    const [ride, setRide] = useState(null);

    const ridePopupPanelRef = useRef(null);
    const confirmRidePopupPanelRef = useRef(null);

    const { socket } = useContext(SocketContext);
    const { captain } = useContext(CaptainDataContext);

    // State for ads
    const [ads, setAds] = useState([]);
    const [currentAdIndex, setCurrentAdIndex] = useState(0);
    const [showAd, setShowAd] = useState(false);

    // Fetch ads from backend
    useEffect(() => {
        const fetchAds = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/admin/ads`);
                setAds(response.data);
                if (response.data.length > 0) {
                    setShowAd(true); // Show first ad immediately
                }
            } catch (error) {
                console.error("Error fetching ads:", error);
            }
        };

        fetchAds();
    }, []);

    // Handle closing the ad
    const closeAd = () => {
        setShowAd(false);
        setTimeout(() => {
            setCurrentAdIndex((prevIndex) => (prevIndex + 1) % ads.length);
            // Start the next ad timer only after closing
            setTimeout(() => {
                setShowAd(true);
            }, 60000); // 1-minute delay before showing the next ad
        }, 500); // Short delay before updating index
    };

    useEffect(() => {
        socket.emit('join', {
            userId: captain._id,
            userType: 'captain'
        });

        const updateLocation = () => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(position => {
                    socket.emit('update-location-captain', {
                        userId: captain._id,
                        location: {
                            ltd: position.coords.latitude,
                            lng: position.coords.longitude
                        }
                    });
                });
            }
        };

        const locationInterval = setInterval(updateLocation, 10000);
        updateLocation();

        return () => clearInterval(locationInterval);
    }, []);

    socket.on('new-ride', (data) => {
        setRide(data);
        setRidePopupPanel(true);
    });

    async function confirmRide() {
        try {
            await axios.post(
                `${import.meta.env.VITE_BASE_URL}/rides/confirm`,
                {
                    rideId: ride._id,
                    captainId: captain._id,
                },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            setRidePopupPanel(false);
            setConfirmRidePopupPanel(true);
        } catch (error) {
            console.error("Error confirming ride:", error.response?.data?.message || error.message);
            setRidePopupPanel(false);
            setConfirmRidePopupPanel(false);
        }
    }

    useGSAP(() => {
        gsap.to(ridePopupPanelRef.current, {
            transform: ridePopupPanel ? 'translateY(0)' : 'translateY(100%)'
        });
    }, [ridePopupPanel]);

    useGSAP(() => {
        gsap.to(confirmRidePopupPanelRef.current, {
            transform: confirmRidePopupPanel ? 'translateY(0)' : 'translateY(100%)'
        });
    }, [confirmRidePopupPanel]);

    return (
        <div className="h-screen relative">
            <div className={`h-screen transition-all duration-300 ${showAd ? 'filter blur-lg' : ''}`}>
                <div className='fixed p-6 top-0 flex items-center justify-between w-screen'>
                    <img className='w-16' src="https://upload.wikimedia.org/wikipedia/commons/c/cc/Uber_logo_2018.png" alt="Uber Logo" />
                    <Link to='/captain-home' className='h-10 w-10 bg-white flex items-center justify-center rounded-full'>
                        <i className="text-lg font-medium ri-logout-box-r-line"></i>
                    </Link>
                </div>
                <div className='h-3/5'>
                    <LiveTracking />
                </div>
                <div className='h-2/5 p-6'>
                    <CaptainDetails />
                </div>
            </div>

            <div ref={ridePopupPanelRef} className='fixed w-full z-10 bottom-0 translate-y-full bg-white px-3 py-10 pt-12'>
                <RidePopUp ride={ride} setRidePopupPanel={setRidePopupPanel} setConfirmRidePopupPanel={setConfirmRidePopupPanel} confirmRide={confirmRide} />
            </div>
            <div ref={confirmRidePopupPanelRef} className='fixed w-full h-screen z-10 bottom-0 translate-y-full bg-white px-3 py-10 pt-12'>
                <ConfirmRidePopUp ride={ride} setConfirmRidePopupPanel={setConfirmRidePopupPanel} setRidePopupPanel={setRidePopupPanel} />
            </div>

            {showAd && ads.length > 0 && (
                <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-gray-100 bg-opacity-50 backdrop-blur-md z-50" onClick={closeAd}>
                    <div className="bg-white p-5 rounded-lg shadow-lg max-w-sm relative">
                        {ads[currentAdIndex]?.imageUrl && (
                            <img src={`${import.meta.env.VITE_BASE_URL}${ads[currentAdIndex]?.imageUrl}`} alt={ads[currentAdIndex]?.title} className="w-full h-40 object-cover rounded-lg mb-3" />
                        )}
                        <h2 className="text-lg font-bold">{ads[currentAdIndex]?.title}</h2>
                        <p className="mt-2 text-gray-700">{ads[currentAdIndex]?.description}</p>
                        <button className="absolute top-2 right-2 text-xl font-bold text-gray-600 hover:text-black" onClick={closeAd}>×</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CaptainHome;
