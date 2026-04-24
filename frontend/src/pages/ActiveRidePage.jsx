import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { rideService } from "../api/services";
import { handleApiError } from "../api/errorHandler";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import MapView, { getCoords, searchLocation } from "../components/MapView";
import Button from "../components/Button";
import { Navigation as NavIcon, MapPin, Clock, Users, ArrowLeft, Square, LocateFixed } from "lucide-react";
import { socket } from "../utils/socket";

const ActiveRidePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { auth } = useAuth();
  const toast = useToast();
  
  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [roadPath, setRoadPath] = useState([]);
  const [eta, setEta] = useState(null);
  const [distance, setDistance] = useState(null);
  const [destCoords, setDestCoords] = useState(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchRide();
    
    // Listen for real-time updates (like driver's location or ride ending)
    socket.on("ride-updated", (updated) => {
      if (updated._id === id) {
        setRide(updated);
        if (updated.status === "completed") {
          toast.success("Ride completed!");
          navigate("/dashboard");
        }
      }
    });

    // Start location tracking
    let watchId;
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const coords = [pos.coords.latitude, pos.coords.longitude];
          setUserLocation(coords);
          
          // If driver, emit location to others (future improvement: backend socket event)
          // For now, just update local map
        },
        (err) => console.error("GPS Error:", err),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
      );
    }

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
      socket.off("ride-updated");
    };
  }, [id]);

  // Update route when location or ride changes
  useEffect(() => {
    if (userLocation && ride?.destination) {
      getRoute();
    }
  }, [userLocation, ride?.destination]);

  const fetchRide = async () => {
    try {
      setLoading(true);
      const data = await rideService.getRideById(id);
      setRide(data);
    } catch (err) {
      toast.error(handleApiError(err).message);
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const getRoute = async () => {
    if (!userLocation || !ride?.destination) return;

    try {
      // Resolve Destination
      let dest = getCoords(ride.destination);
      if (!dest) {
        dest = await searchLocation(ride.destination);
      }
      
      if (!dest) return;
      setDestCoords(dest);

      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${userLocation[1]},${userLocation[0]};${dest[1]},${dest[0]}?overview=full&geometries=geojson`
      );
      const data = await response.json();
      if (data.routes && data.routes[0]) {
        const route = data.routes[0];
        setRoadPath(route.geometry.coordinates.map(c => [c[1], c[0]]));
        setEta(Math.round(route.duration / 60)); // minutes
        setDistance((route.distance / 1000).toFixed(1)); // km
      }
    } catch (err) {
      console.error("OSRM Error:", err);
    }
  };

  const handleEndRide = async () => {
    if (!window.confirm("Are you sure you want to end this ride?")) return;
    try {
      setProcessing(true);
      await rideService.endRide(id);
      toast.success("Ride completed!");
      navigate("/dashboard");
    } catch (err) {
      toast.error(handleApiError(err).message);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-uber-black border-t-transparent rounded-full animate-spin" />
        <p className="text-uber-gray-500 font-medium">Starting navigation...</p>
      </div>
    );
  }

  const isDriver = ride.driver?._id === auth?._id || ride.driver === auth?._id;

  const mapMarkers = [
    ...(userLocation ? [{ position: userLocation, color: "#276ef1", size: 12, popup: <span>You are here</span> }] : []),
    ...(destCoords ? [{ position: destCoords, type: "pin", color: "#ef4444", popup: <span>Destination: {ride.destination}</span> }] : [])
  ];

  const mapRoutes = roadPath.length > 0 ? [{ positions: roadPath, color: "#276ef1", weight: 6 }] : [];

  return (
    <div className="relative h-[calc(100vh-64px)] w-full overflow-hidden flex flex-col">
      {/* Top Overlay - Info */}
      <div className="absolute top-4 left-4 right-4 z-[1000] flex flex-col gap-2 pointer-events-none">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => navigate("/dashboard")}
            className="pointer-events-auto w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center text-uber-black hover:bg-uber-surface transition-all active:scale-95"
          >
            <ArrowLeft size={20} />
          </button>
          
          <div className="pointer-events-auto bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-uber-border p-3 flex items-center gap-4 animate-fade-in">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-uber-gray-400 uppercase tracking-widest leading-none">Arrival In</span>
              <span className="text-xl font-black text-uber-black leading-none mt-1">{eta || "--"} min</span>
            </div>
            <div className="w-px h-8 bg-uber-border" />
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-uber-gray-400 uppercase tracking-widest leading-none">Distance</span>
              <span className="text-xl font-black text-uber-black leading-none mt-1">{distance || "--"} km</span>
            </div>
          </div>
          
          <div className="w-10" /> {/* Spacer */}
        </div>
      </div>

      {/* Main Map Container */}
      <div className="flex-1 relative">
        <MapView 
          height="100%" 
          center={userLocation || getCoords(ride.source)} 
          zoom={16}
          markers={mapMarkers}
          routes={mapRoutes}
          fitMarkers={!userLocation} // Only fit markers if we don't have GPS yet
        />
        
        {/* Recenter Button */}
        <button 
          onClick={() => userLocation && setUserLocation([...userLocation])} 
          className="absolute bottom-32 right-4 z-[1000] w-12 h-12 rounded-full bg-white shadow-xl flex items-center justify-center text-uber-black border border-uber-border active:scale-90 transition-all"
        >
          <LocateFixed size={24} />
        </button>
      </div>

      {/* Bottom Overlay - Actions */}
      <div className="bg-white border-t border-uber-border p-6 shadow-2xl relative z-[1000] animate-menu-up">
        <div className="max-w-xl mx-auto flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-uber-black">{ride.source} → {ride.destination}</h2>
              <p className="text-sm text-uber-gray-500 flex items-center gap-2">
                <Users size={14} /> {ride.passengers.length} passengers
              </p>
            </div>
            {isDriver ? (
              <Button 
                variant="danger" 
                onClick={handleEndRide} 
                loading={processing}
                className="px-8"
              >
                <Square size={16} /> End Ride
              </Button>
            ) : (
              <div className="px-4 py-2 rounded-xl bg-uber-blue-DEFAULT/10 text-uber-blue-DEFAULT font-bold text-sm">
                Riding with {ride.driver?.name}
              </div>
            )}
          </div>
          
          {/* Instructions Summary */}
          <div className="rounded-xl bg-uber-surface p-4 flex items-center gap-3 border border-uber-border/50">
            <div className="w-8 h-8 rounded-full bg-uber-black flex items-center justify-center text-white">
              <NavIcon size={16} />
            </div>
            <p className="text-sm font-medium text-uber-black">
              {isDriver ? "Follow the highlighted route to your destination." : "Relax, your driver is on the way to the destination."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActiveRidePage;
