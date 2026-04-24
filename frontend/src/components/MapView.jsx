import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, Circle, useMapEvents, ZoomControl } from "react-leaflet";
import L from "leaflet";

// Fix default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Custom colored marker
const createIcon = (color = "#276ef1", size = 12) => {
  return L.divIcon({
    className: "custom-marker",
    html: `<div style="
      width: ${size}px; height: ${size}px;
      background: ${color};
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 8px rgba(0,0,0,0.5);
    "></div>`,
    iconSize: [size + 6, size + 6],
    iconAnchor: [(size + 6) / 2, (size + 6) / 2],
  });
};

const createPinIcon = (color = "#ef4444") => {
  return L.divIcon({
    className: "pin-marker",
    html: `<div style="position: relative; display: flex; flex-direction: column; align-items: center;">
      <div style="
        width: 30px; height: 30px;
        background: ${color};
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 2px solid white;
        box-shadow: 0 4px 10px rgba(0,0,0,0.3);
        display: flex; align-items: center; justify-content: center;
      ">
        <div style="width: 10px; height: 10px; background: white; border-radius: 50%; transform: rotate(45deg);"></div>
      </div>
    </div>`,
    iconSize: [30, 42],
    iconAnchor: [15, 42],
  });
};

// Pulsing marker for current location (Google Maps style)
const createPulseIcon = (color = "#4285F4", heading = null) => {
  return L.divIcon({
    className: "pulse-icon",
    html: `<div style="position:relative; display:flex; align-items:center; justify-content:center;">
      ${heading !== null ? `
        <div style="
          position: absolute;
          width: 0; height: 0;
          border-left: 20px solid transparent;
          border-right: 20px solid transparent;
          border-bottom: 60px solid ${color};
          opacity: 0.2;
          transform: translateY(-30px) rotate(${heading}deg);
          transform-origin: center 30px;
          filter: blur(10px);
        "></div>
      ` : ""}
      <div style="
        width: 12px; height: 12px;
        background: ${color};
        border: 2px solid white;
        border-radius: 50%;
        box-shadow: 0 0 10px rgba(66, 133, 244, 0.6);
        position: relative; z-index: 2;
      "></div>
      <div style="
        position: absolute;
        width: 30px; height: 30px;
        background: ${color};
        border-radius: 50%;
        animation: map-pulse 2s ease-out infinite;
        opacity: 0.3;
      "></div>
    </div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
};

// Bike marker
const createBikeIcon = (type = "standard", available = true) => {
  const icons = { standard: "🚲", electric: "⚡", mountain: "🏔️" };
  const bg = available ? "#05a357" : "#525252";
  return L.divIcon({
    className: "bike-marker",
    html: `<div style="
      background: ${bg}; color: white;
      width: 32px; height: 32px;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 14px;
      border: 2px solid white;
      box-shadow: 0 2px 10px rgba(0,0,0,0.5);
    ">${icons[type] || "🚲"}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

// Auto-fit map to markers
const FitBounds = ({ positions }) => {
  const map = useMap();
  useEffect(() => {
    if (positions && positions.length > 0) {
      const validPositions = positions.filter(
        (p) => p && p[0] !== undefined && p[1] !== undefined
      );
      if (validPositions.length > 0) {
        const bounds = L.latLngBounds(validPositions);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
      }
    }
  }, [positions, map]);
  return null;
};

// Campus locations (Bhopal area defaults)
const CAMPUS_CENTER = [23.2599, 77.4126];
const CAMPUS_LOCATIONS = {
  "Main Gate": [23.2599, 77.4126],
  "Library": [23.2610, 77.4140],
  "Hostel Block": [23.2580, 77.4115],
  "Canteen": [23.2595, 77.4150],
  "Sports Complex": [23.2575, 77.4135],
  "Academic Block A": [23.2605, 77.4110],
  "Academic Block B": [23.2615, 77.4125],
  "Parking Lot": [23.2590, 77.4100],
  "Auditorium": [23.2620, 77.4145],
  "Bus Stop": [23.2588, 77.4160],
};

// Get coordinates for a location name (fuzzy match or exact coords)
const getCoords = (name) => {
  if (!name || typeof name !== "string") return null;
  
  // Check if it's already an exact "lat, lng" string
  const coordsMatch = name.match(/^(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)$/);
  if (coordsMatch) {
    return [parseFloat(coordsMatch[1]), parseFloat(coordsMatch[3])];
  }

  const lower = name.toLowerCase();
  for (const [key, val] of Object.entries(CAMPUS_LOCATIONS)) {
    if (key.toLowerCase().includes(lower) || lower.includes(key.toLowerCase())) {
      return val;
    }
  }
  return null; // Return null if not a landmark, coords string, or fuzzy match
};

// Fetch coordinates for any location name using Nominatim (OpenStreetMap)
const searchLocation = async (query) => {
  if (!query || query.length < 3) return null;
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
    const data = await response.json();
    if (data && data.length > 0) {
      return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
    }
  } catch (err) {
    console.error("Geocoding error:", err);
  }
  return null;
};

// Fetch real road route using OSRM (Open Source Routing Machine)
const getRoadRoute = async (start, end) => {
  if (!start || !end) return null;
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`;
    const response = await fetch(url);
    const data = await response.json();
    if (data.code === "Ok") {
      // OSRM returns [lng, lat], we need [lat, lng]
      return data.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
    }
  } catch (err) {
    console.error("Routing error:", err);
  }
  return [start, end]; // Fallback to straight line
};

// Get nearest location name from coords
const getNearestLocationName = (coords) => {
  if (!coords || !coords[0]) return null;
  let nearestName = null;
  let minDistance = Infinity;

  for (const [name, loc] of Object.entries(CAMPUS_LOCATIONS)) {
    // Simple Euclidean distance for rough proximity on campus
    const dist = Math.sqrt(Math.pow(loc[0] - coords[0], 2) + Math.pow(loc[1] - coords[1], 2));
    if (dist < minDistance) {
      minDistance = dist;
      nearestName = name;
    }
  }
  // If they are somewhat close (within ~2km), return name, else return raw coords string
  return minDistance < 0.02 ? nearestName : `${coords[0].toFixed(4)}, ${coords[1].toFixed(4)}`;
};

const LIGHT_TILES = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
const LIGHT_ATTR = '';

const MapRecenter = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom || map.getZoom(), { duration: 1.5 });
    }
  }, [center, zoom, map]);
  return null;
};

const MapClickHandler = ({ onClick }) => {
  useMapEvents({
    click: (e) => {
      if (onClick) onClick([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
};

const MapView = ({ 
  height = "400px", 
  center, 
  zoom = 15, 
  markers = [], 
  routes = [], 
  bikes = [],
  fitMarkers = false,
  className = "",
  userLocation,
  onLocationRequest,
  onClick,
  children
}) => {
  const [mapInstance, setMapInstance] = useState(null);
  const [autoLocation, setAutoLocation] = useState(null);
  const [accuracy, setAccuracy] = useState(0);
  const [heading, setHeading] = useState(null);

  // Only watch location internally if no external location is provided
  useEffect(() => {
    if (!navigator.geolocation || userLocation) return;

    // Fast initial lock
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setAutoLocation([pos.coords.latitude, pos.coords.longitude]);
        setAccuracy(pos.coords.accuracy);
      },
      null,
      { enableHighAccuracy: false, timeout: 3000 }
    );

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const coords = [pos.coords.latitude, pos.coords.longitude];
        setAutoLocation(coords);
        setAccuracy(pos.coords.accuracy);
        setHeading(pos.coords.heading);
      },
      (err) => console.error("Internal MapView Location Error:", err),
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [userLocation]);

  const activeUserLocation = userLocation || autoLocation;
  const initialCenter = center || activeUserLocation || CAMPUS_CENTER;

  const handleLocateMe = (e) => {
    e.preventDefault();
    if (onLocationRequest) {
      onLocationRequest();
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = [pos.coords.latitude, pos.coords.longitude];
          setAutoLocation(coords);
          if (mapInstance) {
            mapInstance.flyTo(coords, 15);
          }
        },
        (err) => console.error("Geolocation error:", err)
      );
    }
  };

  const allPositions = [
    ...markers.map((m) => m.position),
    ...routes.flatMap((r) => r.positions || []),
    ...bikes.map((b) => b.position),
    ...(activeUserLocation ? [activeUserLocation] : []),
  ].filter((p) => p && p[0] && p[1]);

  return (
    <div className={`relative rounded-2xl overflow-hidden border border-uber-border ${className}`} style={{ height }}>
      <MapContainer
        center={initialCenter}
        zoom={zoom}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
        scrollWheelZoom={true}
        ref={setMapInstance}
        attributionControl={false}
        className="z-0"
      >
        <TileLayer url={LIGHT_TILES} attribution={false} />
        
        {/* Force re-center when center prop or location changes */}
        <MapRecenter center={center || activeUserLocation} zoom={zoom} />

        <MapClickHandler onClick={onClick} />

        {fitMarkers && allPositions.length > 0 && (
          <FitBounds positions={allPositions} />
        )}

        {markers.map((marker, i) => (
          <Marker
            key={`marker-${i}`}
            position={marker.position}
            icon={
              marker.type === "pin" ? createPinIcon(marker.color) :
              marker.pulse ? createPulseIcon(marker.color) : 
              createIcon(marker.color, marker.size)
            }
          >
            {marker.popup && <Popup>{marker.popup}</Popup>}
          </Marker>
        ))}

        {routes.map((route, i) => (
          <Polyline
            key={`route-${i}`}
            positions={route.positions}
            pathOptions={{
              color: route.color || "#276ef1",
              weight: route.weight || 4,
              opacity: 0.8,
              dashArray: route.dashed ? "10 6" : null,
            }}
          />
        ))}

        {bikes.map((bike, i) => (
          <Marker
            key={`bike-${i}`}
            position={bike.position}
            icon={createBikeIcon(bike.type, bike.available)}
          >
            {bike.popup && <Popup>{bike.popup}</Popup>}
          </Marker>
        ))}

        {activeUserLocation && (
          <>
            <Marker position={activeUserLocation} icon={createPulseIcon("#4285F4", heading)} zIndexOffset={1000}>
              <Popup>You are here (±{Math.round(accuracy)}m)</Popup>
            </Marker>
            <Circle 
              center={activeUserLocation} 
              radius={accuracy} 
              pathOptions={{ stroke: false, fill: true, fillColor: "#4285F4", fillOpacity: 0.15 }} 
            />
          </>
        )}

        <ZoomControl position="bottomright" />
        {children}
      </MapContainer>
      
    </div>
  );
};

export { CAMPUS_CENTER, CAMPUS_LOCATIONS, getCoords, searchLocation, getNearestLocationName, getRoadRoute, createIcon, createPulseIcon, createBikeIcon, createPinIcon };
export default MapView;
