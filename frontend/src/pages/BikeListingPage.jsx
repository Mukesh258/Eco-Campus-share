import { useEffect, useState } from "react";
import { bikeService } from "../api/services";
import { handleApiError } from "../api/errorHandler";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import EmptyState from "../components/EmptyState";
import Button from "../components/Button";
import MapView, { getCoords, getNearestLocationName, CAMPUS_LOCATIONS } from "../components/MapView";
import { Bike, Zap, Mountain, MapPin, Filter, Navigation, Search } from "lucide-react";
import { calculateDistance, formatDistance } from "../utils/distance";

const BikeSkeleton = () => (
  <div className="rounded-2xl bg-white border border-uber-border p-5 space-y-3 animate-pulse">
    <div className="skeleton h-5 w-2/3" /><div className="skeleton h-3 w-1/2" /><div className="skeleton h-3 w-1/3" />
    <div className="flex justify-between pt-2"><div className="skeleton h-6 w-24 rounded-full" /><div className="skeleton h-8 w-20 rounded-xl" /></div>
  </div>
);

const Pill = ({ children, color = "gray" }) => {
  const c = { green: "bg-uber-green-DEFAULT/15 text-uber-green-light", red: "bg-uber-red-DEFAULT/15 text-uber-red-light", blue: "bg-uber-blue-DEFAULT/15 text-uber-blue-light", gray: "bg-uber-surface text-uber-gray-400", amber: "bg-uber-amber-DEFAULT/15 text-uber-amber-light" };
  return <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${c[color]}`}>{children}</span>;
};

const typeIcons = { standard: Bike, electric: Zap, mountain: Mountain };
const condColors = { excellent: "green", good: "blue", fair: "amber" };

const BikeCard = ({ bike, auth, handleBook, handleReturn, processingId }) => {
  const isBooked = bike.currentUser?._id === auth?._id || bike.currentUser === auth?._id;
  const isBusy = processingId === bike._id;
  const Icon = typeIcons[bike.bikeType] || Bike;

  return (
    <article className="rounded-2xl bg-white border border-uber-border hover:border-uber-black p-5 flex flex-col gap-3 transition-all duration-300 card-hover animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-base font-bold text-uber-black">{bike.bikeName}</h2>
          <p className="text-xs text-uber-gray-500 mt-0.5">🏷️ {bike.bikeNumber}</p>
        </div>
        <div className="flex items-center gap-2">
          {bike.distance !== undefined && (
            <div className="text-xs font-semibold text-uber-blue-DEFAULT bg-uber-blue-DEFAULT/10 px-2 py-1 rounded-lg">
              {formatDistance(bike.distance)} away
            </div>
          )}
          <div className="w-10 h-10 rounded-xl bg-uber-surface border border-uber-border flex items-center justify-center">
            <Icon size={20} className="text-uber-black" />
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Pill color="gray">{bike.bikeType.charAt(0).toUpperCase() + bike.bikeType.slice(1)}</Pill>
        <Pill color={condColors[bike.condition]}>{bike.condition}</Pill>
        <Pill color={bike.isAvailable ? "green" : "red"}>{bike.isAvailable ? "✓ Available" : "⊘ In Use"}</Pill>
      </div>
      <div className="flex items-center justify-between text-xs text-uber-gray-500 bg-uber-surface rounded-xl p-3 border border-transparent">
        <span className="flex items-center gap-1"><MapPin size={12} className="text-uber-black" /> {bike.location}</span>
        <span className="font-semibold text-uber-black">₹{bike.pricePerHour}/hr</span>
      </div>
      <div className="mt-auto pt-1">
        {auth?.token ? (
          isBooked ? (
            <Button onClick={() => handleReturn(bike._id)} disabled={isBusy} variant="danger" className="w-full" size="sm" loading={isBusy}>Return Bike</Button>
          ) : (
            <Button onClick={() => handleBook(bike._id)} disabled={!bike.isAvailable || isBusy} variant={!bike.isAvailable ? "secondary" : "primary"} className="w-full" size="sm" loading={isBusy}>
              {!bike.isAvailable ? "Not Available" : "Book Bike"}
            </Button>
          )
        ) : (
          <Button disabled variant="secondary" className="w-full" size="sm">Login to Book</Button>
        )}
      </div>
    </article>
  );
};

const BikeListingPage = () => {
  const [bikes, setBikes] = useState([]);
  const [filteredBikes, setFilteredBikes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [filterType, setFilterType] = useState("all");
  const [filterAvail, setFilterAvail] = useState("all");
  const [searchLoc, setSearchLoc] = useState("");
  const [userLocation, setUserLocation] = useState(null);
  const [locating, setLocating] = useState(false);
  const [showSug, setShowSug] = useState(false);
  const suggestions = Object.keys(CAMPUS_LOCATIONS);
  const filterSug = (val) => suggestions.filter(s => s.toLowerCase().includes(val.toLowerCase())).slice(0, 5);

  const { auth } = useAuth();
  const toast = useToast();

  const processBikes = (list, type, avail, locStr, gpsLoc) => {
    let f = [...list];
    if (type !== "all") f = f.filter(b => b.bikeType === type);
    if (avail === "available") f = f.filter(b => b.isAvailable);
    else if (avail === "my-bikes") f = f.filter(b => b.currentUser?._id === auth?._id || b.currentUser === auth?._id);
    
    let refLoc = gpsLoc;
    if (locStr) {
      const coords = getCoords(locStr);
      if (coords) refLoc = coords;
    }

    if (refLoc) {
      f = f.map(b => ({
        ...b,
        distance: calculateDistance(refLoc, getCoords(b.location))
      })).sort((a, b) => {
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return a.distance - b.distance;
      });
    } else {
      f = f.map(b => ({ ...b, distance: undefined }));
    }
    return f;
  };

  useEffect(() => { 
    fetchBikes(); 
    
    // Watch location for live proximity updates
    let watchId;
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const newLoc = [pos.coords.latitude, pos.coords.longitude];
          setUserLocation(prev => {
            if (!prev) return newLoc;
            // Only update state if moved significantly (>10m) to prevent jitter
            const d = calculateDistance(prev, newLoc);
            return (d && d > 0.01) ? newLoc : prev;
          });
        },
        (err) => console.error("Location watch failed", err),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
      );
    }
    return () => { if (watchId) navigator.geolocation.clearWatch(watchId); };
  }, []);
  
  useEffect(() => {
    setFilteredBikes(processBikes(bikes, filterType, filterAvail, searchLoc, userLocation));
  }, [bikes, filterType, filterAvail, searchLoc, userLocation, auth]);

  const handleLocateMe = () => {
    // If we already have a background location, use it instantly
    if (userLocation) {
      const locName = getNearestLocationName(userLocation);
      setSearchLoc(locName);
      toast.success(`Location set to ${locName}!`);
      return;
    }

    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    if (window.location.protocol !== "https:" && window.location.hostname !== "localhost") {
      toast.warning("Location requires HTTPS on mobile. Please type your location manually.");
    }

    setLocating(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = [pos.coords.latitude, pos.coords.longitude];
        const locName = getNearestLocationName(coords);
        setUserLocation(coords);
        setSearchLoc(locName);
        setLocating(false);
        toast.success(`Location set to ${locName}!`);
      },
      (err) => {
        console.error(err);
        toast.error("Unable to retrieve your location");
        setLocating(false);
      }
    );
  };

  const fetchBikes = async () => {
    try { setLoading(true); setBikes(await bikeService.getAllBikes()); }
    catch (err) { toast.error(handleApiError(err).message); }
    finally { setLoading(false); }
  };

  const handleBook = async (id) => {
    if (!auth?.token) { toast.error("Please login"); return; }
    try { setProcessingId(id); await bikeService.bookBike(id); toast.success("Bike booked!"); setBikes(p => p.map(b => b._id === id ? { ...b, isAvailable: false, currentUser: auth } : b)); }
    catch (err) { toast.error(handleApiError(err).message); } finally { setProcessingId(null); }
  };

  const handleReturn = async (id) => {
    if (!window.confirm("Return this bike?")) return;
    try {
      setProcessingId(id);
      const hrs = prompt("Hours used?", "1"); if (hrs === null) { setProcessingId(null); return; }
      const h = parseInt(hrs); if (isNaN(h) || h <= 0) { toast.error("Invalid hours"); setProcessingId(null); return; }
      await bikeService.returnBike(id, h); toast.success("Bike returned!");
      setBikes(p => p.map(b => b._id === id ? { ...b, isAvailable: true, currentUser: null } : b));
    } catch (err) { toast.error(handleApiError(err).message); } finally { setProcessingId(null); }
  };

  const bikeMapData = filteredBikes.map(b => {
    const pos = getCoords(b.location);
    return pos ? { position: pos, type: b.bikeType, available: b.isAvailable, popup: <div><strong>{b.bikeName}</strong><br/>₹{b.pricePerHour}/hr<br/>{b.isAvailable ? "✅ Available" : "❌ In Use"}</div> } : null;
  }).filter(Boolean);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 space-y-4 min-w-0">
          {/* Header */}
          <div className="rounded-2xl bg-white border border-uber-border p-6 shadow-sm relative overflow-hidden">
            <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-uber-surface blur-2xl" />
            <div className="relative z-10">
              <p className="text-uber-gray-500 text-xs font-semibold uppercase tracking-wide mb-1">Bike Sharing</p>
              <h1 className="text-2xl font-bold flex items-center gap-2 text-uber-black"><Bike size={24} /> Rent a Bike</h1>
              <p className="mt-1 text-uber-gray-500 text-sm">Browse campus bikes for short trips.</p>
            </div>
          </div>
          {/* Filters */}
          <div className="rounded-2xl bg-white border border-uber-border p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-uber-gray-500"><Filter size={14} className="text-uber-black" /> Filters</div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <div className="flex items-center gap-2 bg-uber-surface rounded-xl px-3 border border-transparent focus-within:border-uber-black focus-within:bg-white transition-all">
                  <Search size={16} className="text-uber-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Search near location..." 
                    value={searchLoc} 
                    onChange={(e) => setSearchLoc(e.target.value)}
                    onFocus={() => setShowSug(true)}
                    onBlur={() => setTimeout(() => setShowSug(false), 200)}
                    className="w-full bg-transparent border-none outline-none py-2.5 text-sm text-uber-black placeholder-uber-gray-400"
                  />
                </div>
                {showSug && (
                  <div className="absolute top-[100%] left-0 right-0 z-50 mt-1 bg-white border border-uber-border rounded-xl shadow-lg overflow-hidden animate-menu-down">
                    {filterSug(searchLoc).map(s => (
                      <button key={s} type="button" onClick={() => { setSearchLoc(s); setShowSug(false); }} className="w-full px-4 py-2.5 text-left text-sm hover:bg-uber-surface text-uber-black flex items-center gap-2">
                        <MapPin size={12} className="text-uber-gray-400" /> {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button onClick={handleLocateMe} disabled={locating} className="shrink-0 flex items-center gap-2 px-4 rounded-xl bg-uber-surface border border-uber-border text-sm font-semibold text-uber-black hover:bg-uber-gray-800 disabled:opacity-50 transition-all">
                <Navigation size={14} className={locating ? "animate-pulse" : ""} /> Locate Me
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mt-3">
              <select value={filterType} onChange={e => setFilterType(e.target.value)}
                className="rounded-xl bg-uber-surface border border-transparent text-uber-black px-3 py-2.5 text-sm outline-none focus:border-uber-black focus:bg-white transition-all">
                <option value="all">All Types</option>
                <option value="standard">🚲 Standard</option>
                <option value="electric">⚡ Electric</option>
                <option value="mountain">🏔️ Mountain</option>
              </select>
              <select value={filterAvail} onChange={e => setFilterAvail(e.target.value)}
                className="rounded-xl bg-uber-surface border border-transparent text-uber-black px-3 py-2.5 text-sm outline-none focus:border-uber-black focus:bg-white transition-all">
                <option value="all">All Bikes</option>
                <option value="available">Available Only</option>
                {auth?.token && <option value="my-bikes">My Bikes</option>}
              </select>
            </div>
          </div>
          {/* Grid */}
          {loading ? (
            <div className="grid gap-3 sm:grid-cols-2">{[1,2,3,4].map(i => <BikeSkeleton key={i} />)}</div>
          ) : filteredBikes.length === 0 ? (
            <EmptyState icon="🚲" title="No bikes found" description="Try adjusting filters." action={filterType !== "all" || filterAvail !== "all" ? () => { setFilterType("all"); setFilterAvail("all"); } : undefined} actionLabel="Clear Filters" />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">{filteredBikes.map(b => <BikeCard key={b._id} bike={b} auth={auth} handleBook={handleBook} handleReturn={handleReturn} processingId={processingId} />)}</div>
          )}
        </div>
        {/* Map */}
        <div className="lg:w-[420px] flex-shrink-0">
          <div className="lg:sticky lg:top-20">
            <MapView 
              height="calc(100vh - 120px)" 
              bikes={bikeMapData} 
              fitMarkers={bikeMapData.length > 0} 
              className="shadow-uber"
              userLocation={userLocation}
              onLocationRequest={handleLocateMe}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BikeListingPage;
