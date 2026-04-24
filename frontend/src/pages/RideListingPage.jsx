import { useEffect, useState } from "react";
import { socket } from "../utils/socket";
import { rideService } from "../api/services";
import { handleApiError } from "../api/errorHandler";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import EmptyState from "../components/EmptyState";
import Button from "../components/Button";
import Input from "../components/Input";
import MapView, { getCoords, getNearestLocationName, CAMPUS_LOCATIONS } from "../components/MapView";
import { Search, MapPin, Clock, Users, Navigation } from "lucide-react";
import { calculateDistance, formatDistance } from "../utils/distance";

const RideSkeleton = () => (
  <div className="rounded-2xl bg-white border border-uber-border p-5 space-y-3 animate-pulse">
    <div className="skeleton h-5 w-2/3" /><div className="skeleton h-3 w-1/2" /><div className="skeleton h-3 w-1/3" />
    <div className="flex justify-between pt-2"><div className="skeleton h-6 w-24 rounded-full" /><div className="skeleton h-8 w-20 rounded-xl" /></div>
  </div>
);

const Pill = ({ children, color = "gray" }) => {
  const c = { green: "bg-uber-green-DEFAULT/15 text-uber-green-light", red: "bg-uber-red-DEFAULT/15 text-uber-red-light", blue: "bg-uber-blue-DEFAULT/15 text-uber-blue-light", gray: "bg-uber-surface text-uber-gray-400" };
  return <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${c[color]}`}>{children}</span>;
};

const RideCard = ({ ride, auth, bookingId, handleBook, onHover }) => {
  const booked = ride.passengers?.some((p) => p._id === auth?._id) || (typeof ride.passengers[0] === "string" && ride.passengers.includes(auth?._id));
  const own = ride.driver?._id === auth?._id || ride.driver === auth?._id;
  const full = ride.availableSeats === 0;
  const busy = bookingId === ride._id;
  const canBook = auth?.role === "student" || auth?.role === "admin";
  const driverName = ride.driver?.name || "Driver";
  const seatPct = ((ride.totalSeats - ride.availableSeats) / ride.totalSeats) * 100;

  return (
    <article className="group rounded-2xl bg-white border border-uber-border hover:border-uber-black p-5 flex flex-col gap-3 transition-all duration-300 card-hover animate-fade-in" onMouseEnter={() => onHover?.(ride)}>
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-base font-bold text-uber-black transition-colors">
            {ride.source} <span className="mx-2 text-uber-gray-400">→</span> {ride.destination}
          </h2>
          <p className="text-xs text-uber-gray-500 mt-1.5 flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-1"><Users size={12} /> {driverName}</span>
            <span className="w-1 h-1 bg-uber-gray-300 rounded-full" />
            <span className="flex items-center gap-1"><Clock size={12} /> {new Date(ride.departureTime).toLocaleString([], { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
          </p>
        </div>
        {ride.distance !== undefined && (
          <div className="flex-shrink-0 text-xs font-semibold text-uber-blue-DEFAULT bg-uber-blue-DEFAULT/10 px-2 py-1 rounded-lg">
            {formatDistance(ride.distance)} away
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <Pill color={full ? "red" : "green"}>💺 {ride.availableSeats}/{ride.totalSeats}</Pill>
        <Pill color="blue"><span className="text-[10px] font-bold">₹</span>{ride.fare}</Pill>
        {ride.status === "in_progress" && <Pill color="red">🔴 In Progress</Pill>}
        {booked && <Pill>✓ Booked</Pill>}
        {own && <Pill>Your ride</Pill>}
      </div>
      {/* Seat progress bar */}
      <div className="w-full bg-uber-surface rounded-full h-1.5">
        <div className="h-1.5 rounded-full bg-uber-black transition-all duration-500" style={{ width: `${seatPct}%` }} />
      </div>
      {ride.description && (
        <p className="text-xs text-uber-gray-500 border-l-2 border-uber-black pl-3 py-1 bg-uber-surface/50 rounded-r">{ride.description}</p>
      )}
      <div className="mt-auto pt-1">
        {auth?.token ? (
          <Button onClick={() => handleBook(ride._id)} disabled={!canBook || full || booked || own || busy} variant={booked || own || full || !canBook ? "secondary" : "primary"} className="w-full" size="sm" loading={busy}>
            {!canBook ? "Students Only" : booked ? "✓ Booked" : own ? "Your Ride" : full ? "Full" : "Book Seat"}
          </Button>
        ) : (
          <div className="w-full rounded-lg bg-uber-surface border border-uber-border py-2.5 text-center text-xs text-uber-gray-500 font-medium">Login to book</div>
        )}
      </div>
    </article>
  );
};

const RideListingPage = () => {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState([]);
  const [recLoading, setRecLoading] = useState(false);
  const [searchSource, setSearchSource] = useState("");
  const [searchDest, setSearchDest] = useState("");
  const [bookingId, setBookingId] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [locating, setLocating] = useState(false);
  const [hoveredRide, setHoveredRide] = useState(null);
  const [showSourceSug, setShowSourceSug] = useState(false);
  const [showDestSug, setShowDestSug] = useState(false);
  const suggestions = Object.keys(CAMPUS_LOCATIONS);
  const filterSug = (val) => suggestions.filter(s => s.toLowerCase().includes(val.toLowerCase())).slice(0, 5);

  const { auth } = useAuth();
  const toast = useToast();

  const filterExpiredRides = (list) => { 
    if (!Array.isArray(list)) return [];
    const now = new Date(); 
    return list.filter(r => new Date(r.departureTime) > now && r.status === "active"); 
  };

  // Sort rides if userLocation is set
  const processRides = (list, refLoc) => {
    let processed = filterExpiredRides(list);
    if (refLoc) {
      processed = processed.map(r => ({
        ...r,
        distance: calculateDistance(refLoc, getCoords(r.source))
      })).sort((a, b) => {
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return a.distance - b.distance;
      });
    } else {
      // Clear distances if no refLoc
      processed = processed.map(r => ({ ...r, distance: undefined }));
    }
    return processed;
  };

  const fetchRides = async (source = "", dest = "", refLoc = userLocation) => {
    try {
      setLoading(true);
      let data = source || dest ? await rideService.searchRides(source, dest) : await rideService.getAllRides();
      setRides(processRides(data, refLoc));
    } catch (err) { toast.error(handleApiError(err).message); }
    finally { setLoading(false); }
  };

  const fetchRecommendations = async (loc = "") => {
    if (!auth?.token) return;
    try { setRecLoading(true); const data = await rideService.getRecommendations(loc); setRecommendations(processRides(data, userLocation)); }
    catch (err) { console.error(err); }
    finally { setRecLoading(false); }
  };

  useEffect(() => { 
    const loadData = async () => {
      await fetchRides(); 
      if (auth?.token) await fetchRecommendations(); 
    };
    loadData();

    // Listen for new rides from the network
    socket.on("ride-created", (newRide) => {
      setRides(prev => {
        // Avoid duplicates
        if (prev.some(r => r._id === newRide._id)) return prev;
        
        // Add to list and re-process (sort/filter)
        const updated = [newRide, ...prev];
        return processRides(updated, userLocation);
      });
      toast.info(`New ride posted: ${newRide.source} to ${newRide.destination}!`);
    });

    socket.on("ride-updated", (updatedRide) => {
      setRides((prev) => processRides(prev.map((r) => (r._id === updatedRide._id ? updatedRide : r)), userLocation));
      setRecommendations((prev) => processRides(prev.map((r) => (r._id === updatedRide._id ? updatedRide : r)), userLocation));
    });

    socket.on("ride-cancelled", (cancelledRide) => {
      setRides((prev) => processRides(prev.filter((r) => r._id !== cancelledRide._id), userLocation));
      setRecommendations((prev) => processRides(prev.filter((r) => r._id !== cancelledRide._id), userLocation));
    });
    
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
    return () => { 
      if (watchId) navigator.geolocation.clearWatch(watchId); 
      socket.off("ride-created");
      socket.off("ride-updated");
      socket.off("ride-cancelled");
    };
  }, [auth?.token]);

  // Re-sort if userLocation changes
  useEffect(() => {
    if (!loading && rides.length > 0 && userLocation) {
      setRides(prev => processRides(prev, userLocation));
      setRecommendations(prev => processRides(prev, userLocation));
    }
  }, [userLocation, loading]);

  const handleSearch = (e) => { 
    e.preventDefault(); 
    // If user types a source, use its coords as refLoc for sorting
    let refLoc = userLocation;
    if (searchSource) {
      const coords = getCoords(searchSource);
      if (coords) refLoc = coords;
    }
    fetchRides(searchSource, searchDest, refLoc); 
    if (auth?.token) fetchRecommendations(searchSource); 
  };
  const handleClearSearch = () => { setSearchSource(""); setSearchDest(""); fetchRides("", "", userLocation); if (auth?.token) fetchRecommendations(); };

  const handleLocateMe = () => {
    // If we already have a background location, use it instantly
    if (userLocation) {
      const locName = getNearestLocationName(userLocation);
      setSearchSource(locName);
      fetchRides(locName, searchDest, userLocation);
      if (auth?.token) fetchRecommendations(locName);
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
        setSearchSource(locName);
        setLocating(false);
        fetchRides(locName, searchDest, coords);
        if (auth?.token) fetchRecommendations(locName);
        toast.success(`Location set to ${locName}!`);
      },
      (err) => {
        console.error(err);
        toast.error("Unable to retrieve your location");
        setLocating(false);
      }
    );
  };

  const handleBook = async (rideId) => {
    if (!auth?.token) { toast.warning("Please login."); return; }
    try {
      setBookingId(rideId);
      const updated = await rideService.bookRide(rideId);
      setRides((prev) => prev.map((r) => (r._id === rideId ? updated : r)));
      setRecommendations((prev) => prev.map((r) => (r._id === rideId ? updated : r)));
      toast.success("Seat booked! 🎟️");
    } catch (err) { 
      const errorMsg = handleApiError(err).message;
      toast.error(`Booking failed: ${errorMsg}`);
      console.error("Booking Error:", err);
    }
    finally { setBookingId(null); }
  };

  const hasSearch = searchSource || searchDest;
  const canPostRide = auth?.role === "driver" || auth?.role === "admin";

  // Map data
  const mapMarkers = rides.map(r => {
    const pos = getCoords(r.source);
    return pos ? { position: pos, color: r.availableSeats > 0 ? "#05a357" : "#525252", size: 10, popup: <div><strong>{r.source} → {r.destination}</strong><br/>Seats: {r.availableSeats}/{r.totalSeats}</div> } : null;
  }).filter(Boolean);

  const mapRoutes = hoveredRide ? (() => {
    const from = getCoords(hoveredRide.source);
    const to = getCoords(hoveredRide.destination);
    return from && to ? [{ positions: [from, to], color: "#276ef1", weight: 4 }] : [];
  })() : [];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left - List */}
        <div className="flex-1 space-y-4 min-w-0">
          {/* Search */}
          <div className="rounded-2xl bg-white border border-uber-border p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-xl font-bold text-uber-black">Available Rides</h1>
                <p className="text-xs text-uber-gray-500 mt-0.5">{loading ? "Loading…" : `${rides.length} ride${rides.length !== 1 ? "s" : ""}`}</p>
              </div>
              {hasSearch && <button onClick={handleClearSearch} className="text-xs text-uber-gray-500 hover:text-uber-black underline">Clear ×</button>}
            </div>
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1 relative">
                <Input type="text" placeholder="From..." icon={<MapPin size={14} />} value={searchSource} 
                  onChange={(e) => setSearchSource(e.target.value)} onFocus={() => setShowSourceSug(true)} onBlur={() => setTimeout(() => setShowSourceSug(false), 200)} />
                {showSourceSug && (
                  <div className="absolute top-[100%] left-0 right-0 z-50 mt-1 bg-white border border-uber-border rounded-xl shadow-lg overflow-hidden animate-menu-down">
                    {filterSug(searchSource).map(s => (
                      <button key={s} type="button" onClick={() => { setSearchSource(s); fetchRides(s, searchDest); }} className="w-full px-4 py-2.5 text-left text-sm hover:bg-uber-surface text-uber-black flex items-center gap-2">
                        <MapPin size={12} className="text-uber-gray-400" /> {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button type="button" onClick={handleLocateMe} disabled={locating} className="shrink-0 w-12 h-[46px] rounded-xl bg-uber-surface border border-uber-border flex items-center justify-center text-uber-black hover:bg-uber-gray-800 disabled:opacity-50" title="Locate Me">
                <Navigation size={16} className={locating ? "animate-pulse" : ""} />
              </button>
              <div className="flex-1 relative">
                <Input type="text" placeholder="To..." icon={<MapPin size={14} />} value={searchDest} 
                  onChange={(e) => setSearchDest(e.target.value)} onFocus={() => setShowDestSug(true)} onBlur={() => setTimeout(() => setShowDestSug(false), 200)} />
                {showDestSug && (
                  <div className="absolute top-[100%] left-0 right-0 z-50 mt-1 bg-white border border-uber-border rounded-xl shadow-lg overflow-hidden animate-menu-down">
                    {filterSug(searchDest).map(s => (
                      <button key={s} type="button" onClick={() => { setSearchDest(s); fetchRides(searchSource, s); }} className="w-full px-4 py-2.5 text-left text-sm hover:bg-uber-surface text-uber-black flex items-center gap-2">
                        <MapPin size={12} className="text-uber-gray-400" /> {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <Button type="submit" className="whitespace-nowrap"><Search size={14} /> Search</Button>
            </form>
          </div>

          {/* Recommendations */}
          {auth?.token && (recommendations.length > 0 || recLoading) && (
            <div className="rounded-2xl bg-uber-surface border border-uber-border p-5 shadow-sm">
              <h2 className="text-base font-bold text-uber-black mb-3 flex items-center gap-1.5">✨ Recommended</h2>
              {recLoading ? <div className="grid gap-3 sm:grid-cols-2">{[1,2].map(i => <RideSkeleton key={i} />)}</div> : (
                <div className="grid gap-3 sm:grid-cols-2">{recommendations.map(r => <RideCard key={`rec-${r._id}`} ride={r} auth={auth} bookingId={bookingId} handleBook={handleBook} onHover={setHoveredRide} />)}</div>
              )}
            </div>
          )}

          {/* Rides Grid */}
          {loading ? (
            <div className="grid gap-3 sm:grid-cols-2">{[1,2,3,4].map(i => <RideSkeleton key={i} />)}</div>
          ) : rides.length === 0 ? (
            <EmptyState
              icon="🚗"
              title={hasSearch ? "No rides match" : "No rides available"}
              description={hasSearch ? "Try different search." : "Check back later."}
              actionTo={hasSearch ? undefined : (canPostRide ? "/create-ride" : undefined)}
              action={hasSearch ? handleClearSearch : undefined}
              actionLabel={hasSearch ? "Clear search" : (canPostRide ? "Post a Ride" : undefined)}
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">{rides.map(r => <RideCard key={r._id} ride={r} auth={auth} bookingId={bookingId} handleBook={handleBook} onHover={setHoveredRide} />)}</div>
          )}
        </div>

        {/* Right - Map */}
        <div className="lg:w-[420px] flex-shrink-0">
          <div className="lg:sticky lg:top-20">
            <MapView 
              height="calc(100vh - 120px)" 
              markers={mapMarkers} 
              routes={mapRoutes} 
              fitMarkers={mapMarkers.length > 0} 
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

export default RideListingPage;
