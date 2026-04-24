import { useState, useEffect } from "react";
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, Car, Bike, MapPin, LayoutDashboard, LogOut, Plus, UserCircle, Link as LinkIcon } from "lucide-react";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import RideListingPage from "./pages/RideListingPage";
import BikeListingPage from "./pages/BikeListingPage";
import CreateRidePage from "./pages/CreateRidePage";
import CreateBikePage from "./pages/CreateBikePage";
import ActiveRidePage from "./pages/ActiveRidePage";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";
import { useToast } from "./context/ToastContext";
import { connectSocket, disconnectSocket } from "./utils/socket";

const NavLink = ({ to, children, icon: Icon, onClick }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
        isActive
          ? "bg-uber-black/5 text-uber-black"
          : "text-uber-gray-500 hover:bg-uber-surface hover:text-uber-black"
      }`}
    >
      {Icon && <Icon size={16} />}
      {children}
    </Link>
  );
};

const App = () => {
  const { auth, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isLandingPage = location.pathname === "/";
  const isRegisterPage = location.pathname === "/register";
  const isLoginPage = location.pathname === "/login";
  const hideNavActions = isRegisterPage || isLoginPage;
  const dashboardPath = auth?.role === "driver" ? "/driver/dashboard" : "/student/dashboard";

  useEffect(() => {
    if (auth?.token) {
      connectSocket();
    } else {
      disconnectSocket();
    }
    return () => disconnectSocket();
  }, [auth?.token]);

  const handleLogout = () => {
    logout();
    setMobileOpen(false);
    toast.success("You've been logged out successfully.");
    navigate("/");
  };

  const closeMobile = () => setMobileOpen(false);

  return (
    <div className="flex flex-col min-h-screen bg-uber-surface">
      {/* ── Navbar ── */}
      {!isLandingPage && (
        <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-uber-border">
          <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
            {/* Logo */}
            <Link
              to="/"
              onClick={closeMobile}
              className="flex items-center gap-2.5 text-xl font-bold text-uber-black tracking-tight hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 rounded-lg bg-uber-black flex items-center justify-center">
                <Car size={18} className="text-white" />
              </div>
              <span>Eco-Share</span>
            </Link>

            {/* Desktop nav */}
            {!hideNavActions && (
              <div className="hidden md:flex items-center gap-1">
                {auth?.token ? (
                  <>
                    <NavLink to="/rides" icon={Car}>Rides</NavLink>
                    <NavLink to="/bikes" icon={Bike}>Bikes</NavLink>
                    {(auth?.role === "driver" || auth?.role === "admin") && (
                      <>
                        <NavLink to="/create-ride" icon={Plus}>Post Ride</NavLink>
                        <NavLink to="/create-bike" icon={Plus}>Add Bike</NavLink>
                      </>
                    )}
                    <NavLink to={dashboardPath} icon={LayoutDashboard}>Dashboard</NavLink>
                    <div className="w-px h-6 bg-uber-border mx-2" />
                    <div className="flex items-center gap-2 ml-1">
                      <div className="w-8 h-8 rounded-full bg-uber-surface border border-uber-border flex items-center justify-center text-uber-black text-xs font-bold">
                        {auth.name?.charAt(0)?.toUpperCase() || "U"}
                      </div>
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-uber-gray-500 hover:bg-uber-red-DEFAULT/10 hover:text-uber-red-DEFAULT transition-all"
                      >
                        <LogOut size={14} />
                        Logout
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <NavLink to="/" icon={MapPin}>Home</NavLink>
                    <NavLink to="/rides" icon={Car}>Rides</NavLink>
                    <NavLink to="/bikes" icon={Bike}>Bikes</NavLink>
                    <div className="w-px h-6 bg-uber-border mx-2" />
                    <Link
                      to="/login"
                      className="px-4 py-2 text-sm font-medium text-uber-gray-500 hover:text-uber-black transition-colors"
                    >
                      Log in
                    </Link>
                    <Link
                      to="/register"
                      className="ml-1 rounded-lg bg-uber-black px-4 py-2 text-sm font-semibold text-white hover:bg-uber-gray-100 transition-colors"
                    >
                      Sign up
                    </Link>
                  </>
                )}
              </div>
            )}

            {/* Mobile hamburger */}
            {!hideNavActions && (
              <button
                className="md:hidden p-2 rounded-lg hover:bg-uber-surface text-uber-black"
                onClick={() => setMobileOpen((o) => !o)}
                aria-label="Toggle menu"
              >
                {mobileOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            )}
          </nav>

          {/* Mobile dropdown */}
          {mobileOpen && (
            <div className="md:hidden animate-menu-down border-t border-uber-border bg-white px-4 py-3 flex flex-col gap-1">
              {auth?.token ? (
                <>
                  <NavLink to="/rides" icon={Car} onClick={closeMobile}>Rides</NavLink>
                  <NavLink to="/bikes" icon={Bike} onClick={closeMobile}>Bikes</NavLink>
                  {(auth?.role === "driver" || auth?.role === "admin") && (
                    <>
                      <NavLink to="/create-ride" icon={Plus} onClick={closeMobile}>Post Ride</NavLink>
                      <NavLink to="/create-bike" icon={Plus} onClick={closeMobile}>Add Bike</NavLink>
                    </>
                  )}
                  <NavLink to={dashboardPath} icon={LayoutDashboard} onClick={closeMobile}>Dashboard</NavLink>
                  <div className="h-px bg-uber-border my-2" />
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-uber-red-DEFAULT hover:bg-uber-red-DEFAULT/10 text-left transition-all"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <NavLink to="/" icon={MapPin} onClick={closeMobile}>Home</NavLink>
                  <NavLink to="/rides" icon={Car} onClick={closeMobile}>Rides</NavLink>
                  <NavLink to="/bikes" icon={Bike} onClick={closeMobile}>Bikes</NavLink>
                  <div className="h-px bg-uber-border my-2" />
                  <NavLink to="/login" icon={UserCircle} onClick={closeMobile}>Log in</NavLink>
                  <Link
                    to="/register"
                    onClick={closeMobile}
                    className="rounded-lg bg-uber-black px-3 py-2.5 text-sm font-semibold text-white hover:bg-uber-gray-100 text-center mt-1 transition-colors"
                  >
                    Sign up
                  </Link>
                </>
              )}
            </div>
          )}
        </header>
      )}

      {/* ── Main ── */}
      <main className="flex-1 w-full">
        <div className="page-enter">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/dashboard" element={<Navigate to={dashboardPath} replace />} />
            <Route path="/rides" element={<RideListingPage />} />
            <Route path="/bikes" element={<BikeListingPage />} />
            <Route
              path="/create-ride"
              element={
                <ProtectedRoute allowedRoles={["driver", "admin"]}>
                  <CreateRidePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/create-bike"
              element={
                <ProtectedRoute>
                  <CreateBikePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/driver/dashboard"
              element={
                <ProtectedRoute allowedRoles={["driver", "admin"]}>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/dashboard"
              element={
                <ProtectedRoute allowedRoles={["student", "admin"]}>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route path="/active-ride/:id" element={<ProtectedRoute><ActiveRidePage /></ProtectedRoute>} />
          </Routes>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="mt-auto border-t border-uber-border bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-uber-gray-500">
            <div className="w-6 h-6 rounded-md bg-uber-surface border border-uber-border flex items-center justify-center">
              <Car size={12} className="text-uber-black" />
            </div>
            Eco-Share
          </div>
          <p className="text-xs text-uber-gray-400">
            Campus Mobility, Reimagined. © {new Date().getFullYear()}
          </p>
          <div className="flex items-center gap-4 text-xs text-uber-gray-400">
            <span>Carpooling</span>
            <span>•</span>
            <span>Bike Sharing</span>
            <span>•</span>
            <span>Sustainability</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
