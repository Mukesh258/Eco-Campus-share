import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { rideService, authService, userService } from "../api/services";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { socket } from "../utils/socket";
import MapView, { getCoords } from "../components/MapView";
import Button from "../components/Button";
import { Car, Bike, MapPin, Search, Plus, LayoutDashboard, LogOut, Play, Square, X, User, Mail, Shield, Calendar, Star, ChevronRight, Users, Navigation as NavIcon } from "lucide-react";

const Skeleton = ({ cls = "" }) => <div className={`skeleton rounded-lg ${cls}`} />;

const StatCard = ({ icon: Icon, label, value, sub, color = "blue" }) => {
  const bg = { blue: "bg-uber-blue-DEFAULT/10 border-uber-blue-DEFAULT/20", green: "bg-uber-green-DEFAULT/10 border-uber-green-DEFAULT/20", amber: "bg-uber-amber-DEFAULT/10 border-uber-amber-DEFAULT/20" };
  const ic = { blue: "text-uber-blue-DEFAULT", green: "text-uber-green-DEFAULT", amber: "text-uber-amber-DEFAULT" };
  return (
    <div className={`rounded-2xl border p-5 ${bg[color]} card-hover`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-uber-gray-500">{label}</p>
          <p className="mt-1.5 text-3xl font-bold text-uber-black">{value}</p>
          {sub && <p className="mt-1 text-xs text-uber-gray-500">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl ${bg[color]} flex items-center justify-center`}>
          <Icon size={20} className={ic[color]} />
        </div>
      </div>
    </div>
  );
};

const RideRow = ({ ride, onCancel, onStart, onEnd, onRemovePassenger, isProcessing }) => {
  const [showPassengers, setShowPassengers] = useState(false);
  const isActive = ride.status === "active";
  const isInProgress = ride.status === "in_progress";
  const isCompleted = ride.status === "completed";
  const borderColor = isCompleted ? "border-uber-gray-800" : isInProgress ? "border-uber-blue-DEFAULT/30" : "border-uber-border";
  
  return (
    <div className={`rounded-xl border ${borderColor} transition-all overflow-hidden`}>
      <div className={`flex items-center justify-between gap-3 bg-uber-surface px-4 py-3 hover:bg-uber-card`}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className={`font-semibold truncate text-sm ${isCompleted ? "text-uber-gray-500" : "text-uber-black"}`}>{ride.source} → {ride.destination}</p>
            {isCompleted && <span className="flex-shrink-0 rounded-full text-xs bg-uber-surface text-uber-gray-500 border border-uber-border px-2 py-0.5 font-bold">✓ Done</span>}
            {isInProgress && <span className="flex-shrink-0 rounded-full text-xs bg-uber-blue-DEFAULT/20 text-uber-blue-dark px-2 py-0.5 font-bold animate-pulse">🔴 Live</span>}
            {isActive && <span className="flex-shrink-0 rounded-full text-xs bg-uber-green-DEFAULT/15 text-uber-green-light px-2 py-0.5 font-bold">Active</span>}
          </div>
          <p className="text-xs text-uber-gray-500 mt-0.5">{new Date(ride.departureTime).toLocaleString([], { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowPassengers(!showPassengers)} title="View Passengers" 
            className={`rounded-full px-2.5 py-1 text-xs font-bold transition-all flex items-center gap-1.5 ${showPassengers ? "bg-uber-black text-white" : "bg-uber-blue-DEFAULT/15 text-uber-blue-light hover:bg-uber-blue-DEFAULT/25"}`}>
            <Users size={12} /> {ride.passengers.length}/{ride.totalSeats}
          </button>
          {isActive && (
            <>
              <button onClick={() => onStart(ride._id)} disabled={isProcessing === ride._id} className="text-xs font-semibold text-uber-blue-DEFAULT hover:text-uber-blue-light disabled:opacity-50 flex items-center gap-1"><Play size={12} />Start</button>
              <button onClick={() => onCancel(ride._id)} disabled={isProcessing === ride._id} className="text-xs font-semibold text-uber-red-DEFAULT hover:text-uber-red-light disabled:opacity-50 flex items-center gap-1"><X size={12} />Cancel</button>
            </>
          )}
          {isInProgress && (
            <div className="flex items-center gap-2">
              <Link to={`/active-ride/${ride._id}`} className="text-xs font-bold text-uber-blue-DEFAULT hover:text-uber-blue-light flex items-center gap-1 bg-uber-blue-DEFAULT/10 px-2 py-1 rounded-lg transition-all"><NavIcon size={12} />Track</Link>
              <button onClick={() => onEnd(ride._id)} disabled={isProcessing === ride._id} className="text-xs font-semibold text-uber-green-DEFAULT hover:text-uber-green-light disabled:opacity-50 flex items-center gap-1"><Square size={12} />End</button>
            </div>
          )}
        </div>
      </div>
      
      {showPassengers && (
        <div className="bg-white border-t border-uber-border p-3 space-y-2 animate-menu-down">
          <p className="text-[10px] font-bold text-uber-gray-400 uppercase tracking-wider px-1">Booked Passengers</p>
          {ride.passengers.length === 0 ? (
            <p className="text-xs text-uber-gray-400 px-1 italic">No passengers yet.</p>
          ) : (
            ride.passengers.map(p => (
              <div key={p._id} className="flex items-center justify-between bg-uber-surface rounded-lg px-3 py-2 border border-transparent hover:border-uber-border">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-uber-black/5 flex items-center justify-center text-[10px] font-bold text-uber-black">{p.name?.charAt(0).toUpperCase()}</div>
                  <div>
                    <p className="text-xs font-semibold text-uber-black">{p.name}</p>
                    <p className="text-[10px] text-uber-gray-500">{p.email}</p>
                  </div>
                </div>
                {isActive && (
                  <button onClick={() => onRemovePassenger(ride._id, p._id)} disabled={isProcessing} className="text-[10px] font-bold text-uber-red-DEFAULT hover:text-uber-red-light disabled:opacity-50">Remove</button>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

const BookingRow = ({ ride, onLeave, isProcessing }) => {
  const isExpired = new Date(ride.departureTime) < new Date();
  return (
    <div className={`flex items-center justify-between gap-3 rounded-xl border ${isExpired ? "border-uber-border bg-uber-surface" : "border-uber-border bg-white"} px-4 py-3 transition-all hover:bg-uber-surface`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={`font-semibold truncate text-sm ${isExpired ? "text-uber-gray-500" : "text-uber-black"}`}>{ride.source} → {ride.destination}</p>
          {ride.status === "in_progress" && <span className="flex-shrink-0 rounded-full text-[10px] bg-uber-blue-DEFAULT/20 text-uber-blue-dark px-2 py-0.5 font-bold animate-pulse">🔴 Live</span>}
        </div>
        <p className="text-xs text-uber-gray-500 mt-0.5">Driver: {ride.driver?.name || "Driver"} · ₹{ride.fare}/seat</p>
      </div>
      <div className="flex items-center gap-2">
        {ride.status === "in_progress" ? (
          <Link to={`/active-ride/${ride._id}`} className="text-xs font-bold text-uber-blue-DEFAULT hover:bg-uber-blue-DEFAULT/10 px-3 py-1.5 rounded-lg border border-uber-blue-DEFAULT/20 flex items-center gap-1.5 transition-all">
            <NavIcon size={12} /> Track
          </Link>
        ) : (
          <span className="rounded-full bg-uber-blue-DEFAULT/15 px-2.5 py-1 text-xs font-bold text-uber-blue-light">{new Date(ride.departureTime).toLocaleDateString([], { month: "short", day: "numeric" })}</span>
        )}
        <button onClick={() => onLeave(ride._id)} disabled={isProcessing === ride._id || isExpired}
          className={`text-xs font-semibold ${isExpired ? "text-uber-gray-600 cursor-not-allowed" : "text-uber-amber-DEFAULT hover:text-uber-amber-light disabled:opacity-50"}`}>
          {isExpired ? "Done" : "Leave"}
        </button>
      </div>
    </div>
  );
};

const DashboardPage = () => {
  const [profile, setProfile] = useState(null);
  const [postedRides, setPostedRides] = useState([]);
  const [bookedRides, setBookedRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const { auth, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const isDriverView = auth?.role === "driver" || auth?.role === "admin";
  const isStudentView = auth?.role === "student" || auth?.role === "admin";

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    const syncRide = (ride) => {
      setPostedRides((prev) => {
        const exists = prev.some((r) => r._id === ride._id);
        if (!exists && (ride.driver?._id === profile?._id || ride.driver === profile?._id)) return [ride, ...prev];
        return prev.map((r) => (r._id === ride._id ? ride : r)).filter((r) => r.status !== "cancelled");
      });
      setBookedRides((prev) => {
        const isBooked = ride.passengers?.some((p) => (p._id || p) === profile?._id);
        if (isBooked) {
          const exists = prev.some((r) => r._id === ride._id);
          return exists ? prev.map((r) => (r._id === ride._id ? ride : r)).filter((r) => r.status !== "cancelled") : [ride, ...prev];
        }
        return prev.filter((r) => r._id !== ride._id);
      });
    };

    const removeRide = (ride) => {
      setPostedRides((prev) => prev.filter((r) => r._id !== ride._id));
      setBookedRides((prev) => prev.filter((r) => r._id !== ride._id));
    };

    socket.on("ride-created", syncRide);
    socket.on("ride-updated", syncRide);
    socket.on("ride-cancelled", removeRide);

    return () => {
      socket.off("ride-created", syncRide);
      socket.off("ride-updated", syncRide);
      socket.off("ride-cancelled", removeRide);
    };
  }, [profile?._id]);

  const fetchData = async () => {
    try {
      const [profileRes, ridesRes] = await Promise.all([api.get("/auth/me"), api.get("/rides")]);
      const me = profileRes.data;
      setProfile(me); setEditName(me.name);
      const all = ridesRes.data.filter(r => r.status !== "cancelled");
      setPostedRides(all.filter(r => r.driver._id === me._id || r.driver === me._id));
      setBookedRides(all.filter(r => r.passengers.some(p => p._id === me._id || p === me._id)));
    } catch (err) { toast.error("Failed to load dashboard."); }
    finally { setLoading(false); }
  };

  const handleCancelRide = async (id) => {
    if (!window.confirm("Cancel this ride?")) return;
    try { setProcessingId(id); await rideService.cancelRide(id); toast.success("Ride cancelled."); setPostedRides(p => p.filter(r => r._id !== id)); }
    catch (err) { toast.error(err.message || "Failed."); } finally { setProcessingId(null); }
  };
  const handleLeaveRide = async (id) => {
    if (!window.confirm("Leave this ride?")) return;
    try { setProcessingId(id); await rideService.leaveRide(id); toast.success("Left ride."); setBookedRides(p => p.filter(r => r._id !== id)); }
    catch (err) { toast.error(err.message || "Failed."); } finally { setProcessingId(null); }
  };
  const handleStartRide = async (id) => {
    try {
      setProcessingId(id);
      const u = await rideService.startRide(id);
      toast.success("Ride started! Redirecting to map... 🚗");
      // Update local state first
      setPostedRides(p => p.map(r => r._id === id ? u.ride : r));
      // Then navigate to tracking
      setTimeout(() => navigate(`/active-ride/${id}`), 500);
    } catch (err) { toast.error(err.message || "Failed."); } finally { setProcessingId(null); }
  };
  const handleEndRide = async (id) => {
    if (!window.confirm("End this ride?")) return;
    try { setProcessingId(id); const u = await rideService.endRide(id); toast.success("Ride completed! ✓"); setPostedRides(p => p.map(r => r._id === id ? u.ride : r)); }
    catch (err) { toast.error(err.message || "Failed."); } finally { setProcessingId(null); }
  };
  const handleRemovePassenger = async (rideId, userId) => {
    if (!window.confirm("Remove this passenger from your ride?")) return;
    try {
      setProcessingId(rideId);
      const res = await rideService.removePassenger(rideId, userId);
      toast.success("Passenger removed.");
      setPostedRides(p => p.map(r => r._id === rideId ? res.ride : r));
    } catch (err) { toast.error(err.message || "Failed to remove passenger."); }
    finally { setProcessingId(null); }
  };
  const handleUpdateProfile = async () => {
    if (!editName.trim()) return toast.error("Name cannot be empty.");
    try { setSavingProfile(true); const u = await authService.updateProfile({ name: editName }); setProfile(u); setEditMode(false); toast.success("Profile updated!"); }
    catch (err) { toast.error(err.message || "Failed."); } finally { setSavingProfile(false); }
  };
  const handleLogout = () => { logout(); toast.success("Logged out."); navigate("/"); };

  if (loading) return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 space-y-6">
      <div className="rounded-2xl bg-uber-card h-32 animate-pulse" />
      <div className="grid gap-4 sm:grid-cols-2">{[1,2].map(i => <div key={i} className="rounded-2xl bg-uber-card h-28 animate-pulse" />)}</div>
    </div>
  );

  const totalPax = postedRides.reduce((s, r) => s + r.passengers.length, 0);

  // Map markers for active rides
  const activeRides = postedRides.filter(r => r.status === "active" || r.status === "in_progress");
  const mapMarkers = activeRides.flatMap(r => {
    const from = getCoords(r.source); const to = getCoords(r.destination);
    return [
      ...(from ? [{ position: from, color: "#276ef1", size: 10, popup: <span>📍 {r.source}</span> }] : []),
      ...(to ? [{ position: to, color: "#05a357", size: 10, popup: <span>🏁 {r.destination}</span> }] : []),
    ];
  });
  const mapRoutes = activeRides.map(r => {
    const from = getCoords(r.source); const to = getCoords(r.destination);
    return from && to ? { positions: [from, to], color: r.status === "in_progress" ? "#05a357" : "#276ef1", weight: 3 } : null;
  }).filter(Boolean);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 space-y-6">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl bg-white p-8 border border-uber-border shadow-sm">
        <div className="relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-uber-blue-DEFAULT/10 border-2 border-uber-blue-DEFAULT/20 flex items-center justify-center text-xl font-bold text-uber-blue-DEFAULT">
              {profile?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-uber-black">Welcome back, {profile?.name?.split(" ")[0]}!</h1>
              <p className="text-uber-gray-500 text-sm">Manage your rides and bookings</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-uber-blue-DEFAULT/10 border border-uber-blue-DEFAULT/20 px-3 py-1 text-xs font-semibold text-uber-blue-light capitalize">
              <Shield size={12} /> {profile?.role}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-uber-surface border border-uber-border px-3 py-1 text-xs text-uber-gray-400">
              <Mail size={12} /> {profile?.email}
            </span>
          </div>
        </div>
        <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-uber-blue-DEFAULT/5 blur-3xl" />
      </section>

      {/* Stats + Map */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-4">
          {isDriverView && <StatCard icon={Car} label="Rides Posted" value={postedRides.length} sub={`${totalPax} passengers total`} color="blue" />}
          {isStudentView && <StatCard icon={Star} label="Ride Bookings" value={bookedRides.length} sub="Trips you've joined" color="green" />}
        </div>
        <div className="lg:col-span-2">
          <h3 className="text-sm font-semibold text-uber-gray-400 mb-3">Your Active Routes</h3>
          <MapView height="280px" markers={mapMarkers} routes={mapRoutes} fitMarkers={mapMarkers.length > 0} />
        </div>
      </div>

      {/* Quick Actions */}
      <section className="rounded-2xl bg-white border border-uber-border p-6 shadow-sm">
        <h2 className="text-base font-bold text-uber-black mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            ...(isDriverView ? [{ to: "/create-ride", icon: Plus, label: "Post Ride", sub: "Share your trip", color: "uber-blue-DEFAULT" }] : []),
            ...(isStudentView ? [{ to: "/rides", icon: Search, label: "Find Rides", sub: "Browse carpools", color: "uber-green-DEFAULT" }] : []),
            ...(isDriverView ? [{ to: "/create-bike", icon: Bike, label: "Add Bike", sub: "List for rental", color: "uber-amber-DEFAULT" }] : []),
            { to: "/bikes", icon: MapPin, label: "Rent Bike", sub: "Find nearby", color: "uber-blue-light" },
          ].map(({ to, icon: Icon, label, sub, color }) => (
            <Link key={to} to={to} className="group flex items-center gap-3 rounded-xl bg-white border border-uber-border p-4 hover:border-uber-black transition-all card-hover">
              <div className={`w-10 h-10 rounded-xl bg-${color}/10 flex items-center justify-center flex-shrink-0`}>
                <Icon size={18} className={`text-${color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-uber-black truncate">{label}</p>
                <p className="text-xs text-uber-gray-500 truncate">{sub}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Rides + Bookings */}
      <div className="grid gap-6 lg:grid-cols-2">
        {isDriverView && (
        <section className="rounded-2xl bg-white shadow-sm border border-uber-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-uber-black">Your Posted Rides</h2>
            <Link to="/create-ride" className="text-xs font-semibold text-uber-blue-DEFAULT hover:text-uber-blue-light flex items-center gap-1"><Plus size={12} />New</Link>
          </div>
          {postedRides.length === 0 ? (
            <div className="rounded-xl bg-uber-surface p-6 text-center border border-uber-border">
              <p className="text-uber-gray-500 text-sm">No rides posted yet.</p>
              <Link to="/create-ride" className="mt-2 inline-block text-sm font-semibold text-uber-blue-DEFAULT hover:text-uber-blue-light">Post your first ride →</Link>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">{postedRides.map(r => <RideRow key={r._id} ride={r} onCancel={handleCancelRide} onStart={handleStartRide} onEnd={handleEndRide} onRemovePassenger={handleRemovePassenger} isProcessing={processingId} />)}</div>
          )}
        </section>
        )}

        {isStudentView && (
        <section className="rounded-2xl bg-white shadow-sm border border-uber-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-uber-black">Your Bookings</h2>
            <Link to="/rides" className="text-xs font-semibold text-uber-blue-DEFAULT hover:text-uber-blue-light flex items-center gap-1">Browse <ChevronRight size={12} /></Link>
          </div>
          {bookedRides.length === 0 ? (
            <div className="rounded-xl bg-uber-surface p-6 text-center border border-uber-border">
              <p className="text-uber-gray-500 text-sm">No bookings yet.</p>
              <Link to="/rides" className="mt-2 inline-block text-sm font-semibold text-uber-blue-DEFAULT hover:text-uber-blue-light">Find a ride →</Link>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">{bookedRides.map(r => <BookingRow key={r._id} ride={r} onLeave={handleLeaveRide} isProcessing={processingId} />)}</div>
          )}
        </section>
        )}
      </div>

      {/* Account + Logout */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl bg-white shadow-sm border border-uber-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-uber-black">Account Info</h2>
            {!editMode && <button onClick={() => setEditMode(true)} className="text-xs font-semibold text-uber-blue-DEFAULT hover:text-uber-blue-light">Edit</button>}
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between py-2 border-b border-uber-border">
              <span className="text-uber-gray-500 flex items-center gap-1.5"><User size={14} /> Name</span>
              {editMode ? (
                <div className="flex gap-2">
                  <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="rounded-lg bg-uber-surface border border-uber-border px-2 py-1 text-sm text-uber-black outline-none focus:border-uber-black" autoFocus />
                  <button onClick={handleUpdateProfile} disabled={savingProfile} className="rounded-lg bg-uber-black px-3 py-1 text-white font-bold text-xs hover:bg-uber-black/80 disabled:opacity-50">Save</button>
                  <button onClick={() => { setEditMode(false); setEditName(profile?.name); }} className="text-uber-gray-500 hover:text-uber-black text-xs">Cancel</button>
                </div>
              ) : <span className="font-semibold text-uber-black">{profile?.name}</span>}
            </div>
            <div className="flex items-center justify-between py-2 border-b border-uber-border">
              <span className="text-uber-gray-500 flex items-center gap-1.5"><Mail size={14} /> Email</span>
              <span className="font-semibold text-uber-black text-xs sm:text-sm">{profile?.email}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-uber-border">
              <span className="text-uber-gray-500 flex items-center gap-1.5"><Shield size={14} /> Role</span>
              <span className="rounded-full bg-uber-surface border border-uber-border px-3 py-0.5 text-xs font-bold capitalize text-uber-black">{profile?.role}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-uber-gray-500 flex items-center gap-1.5"><Calendar size={14} /> Joined</span>
              <span className="font-semibold text-uber-black">{new Date(profile?.createdAt).toLocaleDateString([], { year: "numeric", month: "long" })}</span>
            </div>
          </div>
        </section>

        <section className="rounded-2xl bg-uber-surface border border-uber-border p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-uber-black mb-1">Sign Out</h2>
            <p className="text-sm text-uber-gray-500">You'll need to log in again to access your dashboard.</p>
          </div>
          <button onClick={handleLogout} className="mt-6 self-start rounded-xl bg-uber-black px-6 py-3 text-sm font-bold text-white hover:bg-uber-gray-800 shadow-sm transition-all active:scale-95 flex items-center gap-2">
            <LogOut size={16} /> Logout
          </button>
        </section>
      </div>
    </div>
  );
};

export default DashboardPage;
