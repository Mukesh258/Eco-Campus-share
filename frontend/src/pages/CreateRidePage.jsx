import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import Button from "../components/Button";
import Input from "../components/Input";
import MapView, { getCoords, searchLocation, getNearestLocationName, CAMPUS_CENTER, CAMPUS_LOCATIONS, getRoadRoute } from "../components/MapView";
import { MapPin, Clock, Users as UsersIcon, FileText, Navigation } from "lucide-react";

const CreateRidePage = () => {
  const [form, setForm] = useState({ source: "", destination: "", date: "", time: "", totalSeats: 4, fare: "", description: "" });
  const [lastFocused, setLastFocused] = useState("destination");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [sourceCoords, setSourceCoords] = useState(null);
  const [destCoords, setDestCoords] = useState(null);
  const [roadPath, setRoadPath] = useState([]);
  const { auth } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  if (!auth?.token) return <div className="flex min-h-[50vh] items-center justify-center"><p className="text-uber-gray-500">Please log in to post a ride.</p></div>;
  if (auth?.role === "student") return <div className="flex min-h-[50vh] items-center justify-center"><p className="text-uber-gray-500">Only drivers can post rides. Switch to a driver account.</p></div>;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: name === "totalSeats" || name === "fare" ? Number(value) : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.source.trim() || !form.destination.trim() || !form.date || !form.time) { 
      setError("All fields are required."); return; 
    }
    const departureTime = new Date(`${form.date}T${form.time}`);
    if (departureTime < new Date()) { setError("Departure must be in the future."); return; }
    if (form.fare < 0) { setError("Fare cannot be negative."); return; }
    setLoading(true);
    try {
      await api.post("/rides", { ...form, departureTime: new Date(`${form.date}T${form.time}`).toISOString() });
      toast.success("Ride posted! 🚗");
      navigate("/rides");
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to create ride.";
      setError(msg); toast.error(msg);
    } finally { setLoading(false); }
  };

  const [liveLocation, setLiveLocation] = useState(null);

  // Background watch for instant pinning
  useEffect(() => {
    if (!navigator.geolocation) return;

    // Quick initial lock
    navigator.geolocation.getCurrentPosition(
      (pos) => setLiveLocation([pos.coords.latitude, pos.coords.longitude]),
      null,
      { enableHighAccuracy: false, timeout: 3000 }
    );

    const watchId = navigator.geolocation.watchPosition(
      (pos) => setLiveLocation([pos.coords.latitude, pos.coords.longitude]),
      (err) => console.error("CreateRide location watch failed", err),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const handleLocateMe = () => {
    if (liveLocation) {
      setForm(p => ({ ...p, source: "Current Location" }));
      toast.success("Using your current location!");
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
    // Fallback if liveLocation isn't ready yet
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = [pos.coords.latitude, pos.coords.longitude];
        const locName = getNearestLocationName(coords);
        setForm(p => ({ ...p, source: locName }));
        setLocating(false);
        toast.success(`Location set to ${locName}!`);
      },
      (err) => {
        console.error(err);
        let msg = "Unable to retrieve your location";
        if (err.code === 1) msg = "Permission denied. Check browser settings.";
        toast.error(msg);
        setLocating(false);
      },
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 }
    );
  };


  // Sync coordinates when source/destination text changes
  useEffect(() => {
    const timer = setTimeout(async () => {
      // Resolve Source
      if (form.source === "Current Location") {
        setSourceCoords(liveLocation);
      } else {
        const campus = getCoords(form.source);
        if (campus) setSourceCoords(campus);
        else if (form.source.length > 2) {
          const remote = await searchLocation(form.source);
          if (remote) setSourceCoords(remote);
        }
      }

      // Resolve Destination
      const campusDest = getCoords(form.destination);
      if (campusDest) setDestCoords(campusDest);
      else if (form.destination.length > 2) {
        const remoteDest = await searchLocation(form.destination);
        if (remoteDest) setDestCoords(remoteDest);
      }
    }, 800); // Debounce to avoid too many API calls
    return () => clearTimeout(timer);
  }, [form.source, form.destination, liveLocation]);

  // Update Road Route when coordinates change
  useEffect(() => {
    if (sourceCoords && destCoords) {
      getRoadRoute(sourceCoords, destCoords).then(path => {
        if (path) setRoadPath(path);
      });
    } else {
      setRoadPath([]);
    }
  }, [sourceCoords, destCoords]);

  const mapMarkers = [
    ...(sourceCoords ? [{ position: sourceCoords, color: "#4285F4", pulse: form.source === "Current Location", popup: <span>Pickup: {form.source}</span> }] : []),
    ...(destCoords ? [{ position: destCoords, color: "#05a357", size: 12, popup: <span>Dropoff: {form.destination}</span> }] : []),
  ];
  const mapRoutes = roadPath.length > 0 ? [{ positions: roadPath, color: "#4285F4", weight: 5 }] : [];

  const [showSourceSug, setShowSourceSug] = useState(false);
  const [showDestSug, setShowDestSug] = useState(false);
  const suggestions = Object.keys(CAMPUS_LOCATIONS);

  const filterSug = (val) => suggestions.filter(s => s.toLowerCase().includes(val.toLowerCase())).slice(0, 5);

  const handleMapClick = (coords) => {
    const locName = `${coords[0].toFixed(5)}, ${coords[1].toFixed(5)}`;
    setForm(p => ({ ...p, [lastFocused]: locName }));
    toast.success(`${lastFocused === "source" ? "Pickup" : "Dropoff"} set from map!`);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-uber-black">Post a Ride</h1>
            <p className="mt-1 text-uber-gray-500 text-sm">Share your trip and split costs.</p>
          </div>
          <div className="rounded-2xl bg-white shadow-sm border border-uber-border p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && <div className="rounded-xl bg-uber-red-DEFAULT/10 border border-uber-red-DEFAULT/20 px-4 py-3 text-sm text-uber-red-DEFAULT">⚠️ {error}</div>}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex gap-2 items-end relative">
                  <div className="flex-1">
                    <Input label="Pickup" name="source" type="text" icon={<MapPin size={14} />} placeholder="e.g., Main Gate" value={form.source} 
                      onChange={handleChange} onFocus={() => { setShowSourceSug(true); setLastFocused("source"); }} onBlur={() => setTimeout(() => setShowSourceSug(false), 200)} required />
                    {showSourceSug && (
                      <div className="absolute top-[100%] left-0 right-14 z-50 mt-1 bg-white border border-uber-border rounded-xl shadow-lg overflow-hidden animate-menu-down">
                        <button type="button" onClick={() => setForm(p => ({...p, source: "Current Location"}))} className="w-full px-4 py-2.5 text-left text-sm hover:bg-uber-surface text-uber-blue-DEFAULT font-semibold flex items-center gap-2 border-b border-uber-border">
                          <Navigation size={12} /> Use Current Location
                        </button>
                        {filterSug(form.source).map(s => (
                          <button key={s} type="button" onClick={() => setForm(p => ({...p, source: s}))} className="w-full px-4 py-2.5 text-left text-sm hover:bg-uber-surface text-uber-black flex items-center gap-2">
                            <MapPin size={12} className="text-uber-gray-400" /> {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <button type="button" onClick={handleLocateMe} disabled={locating} className="shrink-0 w-12 h-[46px] rounded-xl bg-uber-surface border border-uber-border flex items-center justify-center text-uber-black hover:bg-uber-gray-800 hover:text-white disabled:opacity-50 transition-all" title="Use Current Location">
                    <Navigation size={16} className={locating ? "animate-pulse" : ""} />
                  </button>
                </div>
                <div className="relative">
                  <Input label="Dropoff" name="destination" type="text" icon={<MapPin size={14} />} placeholder="e.g., Library" value={form.destination} 
                    onChange={handleChange} onFocus={() => { setShowDestSug(true); setLastFocused("destination"); }} onBlur={() => setTimeout(() => setShowDestSug(false), 200)} required />
                  {showDestSug && (
                    <div className="absolute top-[100%] left-0 right-0 z-50 mt-1 bg-white border border-uber-border rounded-xl shadow-lg overflow-hidden animate-menu-down">
                      {filterSug(form.destination).map(s => (
                        <button key={s} type="button" onClick={() => setForm(p => ({...p, destination: s}))} className="w-full px-4 py-2.5 text-left text-sm hover:bg-uber-surface text-uber-black flex items-center gap-2">
                          <MapPin size={12} className="text-uber-gray-400" /> {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-uber-black mb-1.5">Date</label>
                  <input type="date" name="date" value={form.date} onChange={handleChange}
                    className="w-full rounded-xl bg-uber-surface border border-transparent text-uber-black px-4 py-3 text-sm outline-none focus:border-uber-black focus:bg-white focus:ring-2 focus:ring-uber-black/10 transition-all" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-uber-black mb-1.5">Time</label>
                  <input type="time" name="time" value={form.time} onChange={handleChange}
                    className="w-full rounded-xl bg-uber-surface border border-transparent text-uber-black px-4 py-3 text-sm outline-none focus:border-uber-black focus:bg-white focus:ring-2 focus:ring-uber-black/10 transition-all" required />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-uber-black mb-1.5">Seats</label>
                  <select name="totalSeats" value={form.totalSeats} onChange={handleChange}
                    className="w-full rounded-xl bg-uber-surface border border-transparent text-uber-black px-4 py-3 text-sm outline-none focus:border-uber-black focus:bg-white transition-all">
                    {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>{n} seat{n > 1 ? "s" : ""}</option>)}
                  </select>
                </div>
                <Input label="Fare per Seat (₹)" name="fare" type="number" icon={<span className="text-xs font-bold">₹</span>} placeholder="0" value={form.fare} onChange={handleChange} min="0" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-uber-black mb-1.5">Description (optional)</label>
                <textarea name="description" placeholder="e.g., AC car, leaving sharp at 9AM…" value={form.description} onChange={handleChange}
                  className="w-full rounded-xl bg-uber-surface border border-transparent text-uber-black placeholder-uber-gray-500 px-4 py-3 text-sm outline-none focus:border-uber-black focus:bg-white focus:ring-2 focus:ring-uber-black/10 transition-all resize-none" rows={3} />
              </div>
              {form.source && form.destination && (
                <div className="rounded-xl bg-uber-surface border border-uber-border p-4 text-sm text-uber-black animate-scale-in">
                  <p className="font-semibold mb-1">📋 Summary</p>
                  <p>{form.source} → {form.destination}</p>
                  <p className="text-uber-gray-500">
                    {form.date && form.time && `${new Date(`${form.date}T${form.time}`).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })} • `}
                    {form.totalSeats} seats • {form.fare > 0 ? `₹${form.fare}/seat` : "Free"}
                  </p>
                </div>
              )}
              <Button type="submit" loading={loading} className="w-full" size="lg">Post Ride</Button>
            </form>
          </div>
        </div>
        <div className="lg:w-[420px] flex-shrink-0">
          <div className="lg:sticky lg:top-20">
            <h3 className="text-sm font-semibold text-uber-gray-500 mb-2 flex items-center justify-between">
              Route Preview
              <span className="text-[10px] font-normal text-uber-gray-400">Click map to set {lastFocused === "source" ? "Pickup" : "Dropoff"}</span>
            </h3>
            <MapView 
              height="500px" 
              markers={mapMarkers} 
              routes={mapRoutes} 
              fitMarkers={mapMarkers.length > 0} 
              center={sourceCoords || destCoords || CAMPUS_CENTER} 
              zoom={sourceCoords || destCoords ? 15 : 14} 
              onClick={handleMapClick}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateRidePage;
