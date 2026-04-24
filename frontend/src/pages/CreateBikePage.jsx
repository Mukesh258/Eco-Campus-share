import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { bikeService } from "../api/services";
import { handleApiError } from "../api/errorHandler";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import Button from "../components/Button";
import Input from "../components/Input";
import MapView, { getCoords, getNearestLocationName, CAMPUS_CENTER, CAMPUS_LOCATIONS } from "../components/MapView";
import { Bike, Zap, Mountain, MapPin, Wrench, Navigation } from "lucide-react";

const CreateBikePage = () => {
  const [form, setForm] = useState({ bikeName: "", bikeNumber: "", bikeType: "standard", location: "Current Location", pricePerHour: "", condition: "good" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const { auth } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  if (!auth?.token) return <div className="flex min-h-[50vh] items-center justify-center"><p className="text-uber-gray-500">Please log in to add a bike.</p></div>;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: name === "pricePerHour" ? Number(value) : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.bikeName.trim()) { setError("Name required."); return; }
    if (!form.bikeNumber.trim()) { setError("Number required."); return; }
    if (!form.location.trim()) { setError("Location required."); return; }
    if (!form.pricePerHour || form.pricePerHour < 0) { setError("Valid price required."); return; }
    setLoading(true);
    try { await bikeService.addBike(form); toast.success("Bike added! 🚲"); navigate("/bikes"); }
    catch (err) { const msg = handleApiError(err).message; setError(msg); toast.error(msg); }
    finally { setLoading(false); }
  };

  const [liveLocation, setLiveLocation] = useState(null);

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
      (err) => console.error("CreateBike location watch failed", err),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const handleLocateMe = () => {
    if (liveLocation) {
      setForm(p => ({ ...p, location: "Current Location" }));
      toast.success("Using your current location!");
      return;
    }

    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = [pos.coords.latitude, pos.coords.longitude];
        const locName = getNearestLocationName(coords);
        setForm(p => ({ ...p, location: locName }));
        setLocating(false);
        toast.success(`Location set to ${locName}!`);
      },
      (err) => {
        console.error(err);
        toast.error("Unable to retrieve your location");
        setLocating(false);
      },
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 }
    );
  };

  const locCoords = form.location === "Current Location" ? liveLocation : getCoords(form.location);
  const mapMarkers = locCoords ? [{ position: locCoords, color: "#4285F4", pulse: form.location === "Current Location", popup: <span>📍 {form.location}</span> }] : [];

  const [showSug, setShowSug] = useState(false);
  const suggestions = Object.keys(CAMPUS_LOCATIONS);
  const filterSug = (val) => suggestions.filter(s => s.toLowerCase().includes(val.toLowerCase())).slice(0, 5);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-uber-black">Add a Bike</h1>
            <p className="mt-1 text-uber-gray-500 text-sm">List your bike for the campus community.</p>
          </div>
          <div className="rounded-2xl bg-white shadow-sm border border-uber-border p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && <div className="rounded-xl bg-uber-red-DEFAULT/10 border border-uber-red-DEFAULT/20 px-4 py-3 text-sm text-uber-red-DEFAULT">⚠️ {error}</div>}
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Bike Name" name="bikeName" type="text" icon={<Bike size={14} />} placeholder="e.g., Mountain Pro" value={form.bikeName} onChange={handleChange} required />
                <Input label="Bike Number" name="bikeNumber" type="text" placeholder="e.g., BIKE-001" value={form.bikeNumber} onChange={handleChange} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-uber-black mb-2">Bike Type</label>
                <div className="grid grid-cols-3 gap-3">
                  {[["standard", Bike, "Standard"], ["electric", Zap, "Electric"], ["mountain", Mountain, "Mountain"]].map(([val, Icon, label]) => (
                    <button key={val} type="button" onClick={() => setForm(p => ({...p, bikeType: val}))}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-medium transition-all ${form.bikeType === val ? "bg-uber-black/5 border-uber-black text-uber-black" : "bg-uber-surface border-transparent text-uber-gray-500 hover:border-uber-gray-300"}`}>
                      <Icon size={20} />{label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex gap-2 items-end relative">
                  <div className="flex-1">
                    <Input label="Location" name="location" type="text" icon={<MapPin size={14} />} placeholder="e.g., Campus Gate A" value={form.location} 
                      onChange={handleChange} onFocus={() => setShowSug(true)} onBlur={() => setTimeout(() => setShowSug(false), 200)} required />
                    {showSug && (
                      <div className="absolute top-[100%] left-0 right-14 z-50 mt-1 bg-white border border-uber-border rounded-xl shadow-lg overflow-hidden animate-menu-down">
                        {filterSug(form.location).map(s => (
                          <button key={s} type="button" onClick={() => setForm(p => ({...p, location: s}))} className="w-full px-4 py-2.5 text-left text-sm hover:bg-uber-surface text-uber-black flex items-center gap-2">
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
                <Input label="Price/Hour (₹)" name="pricePerHour" type="number" icon={<span className="text-xs font-bold">₹</span>} placeholder="50" value={form.pricePerHour} onChange={handleChange} min="0" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-uber-black mb-2">Condition</label>
                <div className="grid grid-cols-3 gap-3">
                  {[["excellent", "✨", "Excellent"], ["good", "👍", "Good"], ["fair", "⚠️", "Fair"]].map(([val, icon, label]) => (
                    <button key={val} type="button" onClick={() => setForm(p => ({...p, condition: val}))}
                      className={`flex items-center justify-center gap-1.5 p-3 rounded-xl border text-xs font-medium transition-all ${form.condition === val ? "bg-uber-green-DEFAULT/10 border-uber-green-dark text-uber-green-dark" : "bg-uber-surface border-transparent text-uber-gray-500 hover:border-uber-gray-300"}`}>
                      {icon} {label}
                    </button>
                  ))}
                </div>
              </div>
              {form.bikeName && form.bikeNumber && (
                <div className="rounded-xl bg-uber-surface border border-uber-border p-4 text-sm animate-scale-in">
                  <p className="font-semibold text-uber-black mb-1">📋 Preview</p>
                  <p className="text-uber-black font-medium">{form.bikeName} — <span className="text-uber-gray-500 font-normal">{form.bikeNumber}</span></p>
                  <p className="text-uber-gray-500">📍 {form.location || "—"} • ₹{form.pricePerHour || 0}/hr • {form.condition}</p>
                </div>
              )}
              <Button type="submit" loading={loading} className="w-full" size="lg">Add Bike</Button>
            </form>
          </div>
        </div>
        <div className="lg:w-[420px] flex-shrink-0">
          <div className="lg:sticky lg:top-20">
            <h3 className="text-sm font-semibold text-uber-gray-500 mb-3">Location Preview</h3>
            <MapView height="500px" markers={mapMarkers} center={locCoords || CAMPUS_CENTER} zoom={locCoords ? 16 : 14} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateBikePage;
