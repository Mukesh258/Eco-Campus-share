import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Car, Bike, MapPin, Shield, Zap, Leaf, ArrowRight, Users, TrendingDown, Navigation } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import MapView, { CAMPUS_CENTER } from "../components/MapView";
import Button from "../components/Button";
import Shuffle from "../components/Shuffle";

const DEMO_MARKERS = [
  { position: [23.2599, 77.4126], color: "#276ef1", pulse: true, popup: <span className="font-semibold">You are here</span> },
  { position: [23.2610, 77.4140], color: "#05a357", size: 10, popup: <span>Available ride → Library</span> },
  { position: [23.2580, 77.4115], color: "#05a357", size: 10, popup: <span>Available ride → Hostel</span> },
  { position: [23.2615, 77.4125], color: "#ffc043", size: 10, popup: <span>Bike available</span> },
  { position: [23.2595, 77.4150], color: "#ffc043", size: 10, popup: <span>Bike available</span> },
  { position: [23.2605, 77.4110], color: "#276ef1", size: 8 },
  { position: [23.2620, 77.4145], color: "#276ef1", size: 8 },
];

const DEMO_ROUTES = [
  { positions: [[23.2599, 77.4126], [23.2605, 77.4132], [23.2610, 77.4140]], color: "#276ef1", weight: 3 },
  { positions: [[23.2599, 77.4126], [23.2590, 77.4120], [23.2580, 77.4115]], color: "#05a357", weight: 3, dashed: true },
];

const AnimatedCounter = ({ end, label, icon: Icon }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const duration = 2000;
    const step = end / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setCount(end); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [end]);

  return (
    <div className="text-center p-6 rounded-2xl bg-white border border-uber-border card-hover">
      <Icon className="w-8 h-8 text-uber-black mx-auto mb-3" />
      <div className="text-4xl font-bold text-uber-black mb-1">{count}+</div>
      <div className="text-sm text-uber-gray-500">{label}</div>
    </div>
  );
};

const FeatureCard = ({ icon: Icon, title, description, delay = "0" }) => (
  <div
    className="rounded-2xl bg-white border border-uber-border p-6 card-hover animate-fade-in"
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="w-12 h-12 rounded-xl bg-uber-surface border border-uber-border flex items-center justify-center mb-4">
      <Icon className="w-6 h-6 text-uber-black" />
    </div>
    <h3 className="text-base font-bold text-uber-black mb-2">{title}</h3>
    <p className="text-sm text-uber-gray-500 leading-relaxed">{description}</p>
  </div>
);

const StepItem = ({ number, title, description }) => (
  <div className="flex gap-4 items-start">
    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-uber-black text-white flex items-center justify-center font-bold text-sm">
      {number}
    </div>
    <div>
      <h4 className="font-semibold text-uber-black text-sm">{title}</h4>
      <p className="text-uber-gray-500 text-xs mt-0.5">{description}</p>
    </div>
  </div>
);

const HomePage = () => {
  const { auth } = useAuth();

  return (
    <div className="w-full">
      {/* ── Hero Section with Map ── */}
      <section className="relative overflow-hidden min-h-screen">
        {/* Map background */}
        <div className="absolute inset-0 opacity-80">
          <MapView
            center={CAMPUS_CENTER}
            zoom={15}
            height="100%"
            markers={DEMO_MARKERS}
            routes={DEMO_ROUTES}
            className="rounded-none border-0"
          />
        </div>
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/60 via-transparent to-transparent" />

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 min-h-screen flex flex-col items-center justify-center py-16">
          <div className="mx-auto max-w-2xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-white border border-uber-border shadow-sm px-4 py-1.5 text-xs font-semibold text-uber-black mb-6 animate-fade-in">
              <Leaf size={14} className="text-uber-gray-500" /> Smart Campus Carpooling & Bike Sharing
            </div>

            <Shuffle
              text="Eco-Share"
              tag="h1"
              className="text-3xl sm:text-5xl md:text-6xl font-bold text-uber-black leading-tight mb-4 animate-slide-up"
              style={{ fontSize: "clamp(2rem, 5.5vw, 4rem)" }}
              shuffleDirection="right"
              duration={0.35}
              animationMode="evenodd"
              shuffleTimes={1}
              ease="power3.out"
              stagger={0.03}
              threshold={0.1}
              triggerOnce={true}
              triggerOnHover
              respectReducedMotion={true}
              loop={false}
              loopDelay={0}
            />

            <p className="mt-3 text-lg mb-10 animate-slide-up font-bold" style={{ animationDelay: "100ms" }}>
              <span className="text-uber-black">travel without </span>
              <span className="text-blue-600">regret</span>
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 mb-4 animate-slide-up" style={{ animationDelay: "200ms" }}>
              <Link to={auth?.token ? "/dashboard" : "/register"}>
                <Button size="lg" className="min-w-[180px] font-semibold">
                  Get Started <ArrowRight size={16} />
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="secondary" size="lg" className="min-w-[120px] font-semibold">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>

          {/* ── Stats cards over map ── */}
          <div className="w-full mt-16">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <AnimatedCounter end={250} label="Rides Shared" icon={Car} />
              <AnimatedCounter end={120} label="Active Riders" icon={Users} />
              <AnimatedCounter end={45} label="Bikes Available" icon={Bike} />
              <AnimatedCounter end={500} label="kg CO₂ Saved" icon={TrendingDown} />
            </div>
          </div>
        </div>
      </section>

      {/* ── Features Section ── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-uber-black mb-3">
            Why Eco-Share?
          </h2>
          <p className="text-uber-gray-500 max-w-lg mx-auto">
            Everything you need for smarter, greener campus mobility
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            icon={Car}
            title="Smart Carpooling"
            description="Match with students heading your way. Post or join rides in seconds with real-time seat tracking."
            delay="0"
          />
          <FeatureCard
            icon={Bike}
            title="Bike Sharing"
            description="Standard, electric, and mountain bikes at campus hotspots. Book instantly, pay by the hour."
            delay="100"
          />
          <FeatureCard
            icon={Shield}
            title="Trusted & Verified"
            description="All users are verified campus members. Ride safe with people you can trust."
            delay="200"
          />
          <FeatureCard
            icon={Zap}
            title="Real-time Updates"
            description="Live seat counts, bike availability, and ride status. Everything updates instantly."
            delay="300"
          />
          <FeatureCard
            icon={MapPin}
            title="Interactive Maps"
            description="See rides and bikes on a live map. Visualize routes and find the closest options."
            delay="400"
          />
          <FeatureCard
            icon={Leaf}
            title="Go Green"
            description="Every shared ride cuts emissions. Track your impact and help make campus sustainable."
            delay="500"
          />
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-16">
        <div className="rounded-3xl bg-white border border-uber-border p-8 sm:p-12 shadow-sm">
          <h2 className="text-3xl font-bold text-uber-black mb-10 text-center">How It Works</h2>
          <div className="grid gap-10 sm:grid-cols-2">
            <div>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-uber-surface border border-uber-border flex items-center justify-center">
                  <Car size={16} className="text-uber-black" />
                </div>
                <h3 className="font-bold text-uber-black">Carpooling</h3>
              </div>
              <div className="space-y-5">
                <StepItem number="1" title="Create an account" description="Sign up with your campus email in seconds." />
                <StepItem number="2" title="Post or find a ride" description='Browse live trips or click "Post Ride" to offer yours.' />
                <StepItem number="3" title="Book & go" description="Reserve your seat instantly. Costs are shared automatically." />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-uber-surface border border-uber-border flex items-center justify-center">
                  <Bike size={16} className="text-uber-black" />
                </div>
                <h3 className="font-bold text-uber-black">Bike Rental</h3>
              </div>
              <div className="space-y-5">
                <StepItem number="1" title="Browse bikes" description="Filter by type, condition, and location on the map." />
                <StepItem number="2" title="Book instantly" description="One tap to reserve. The bike is yours." />
                <StepItem number="3" title="Ride & return" description="Use the bike and return when done. Pay per hour." />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA Section ── */}
      {!auth?.token && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-16">
          <div className="rounded-3xl bg-uber-surface border border-uber-border p-8 sm:p-12 text-center relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl font-bold text-uber-black mb-3">Ready to ride smarter?</h2>
              <p className="text-uber-gray-500 mb-8 max-w-md mx-auto">
                Join hundreds of students already saving money and the planet with Eco-Share.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Link to="/register">
                  <Button variant="primary" size="lg" className="font-bold">
                    Get Started <ArrowRight size={16} />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="secondary" size="lg">
                    Sign In
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default HomePage;
