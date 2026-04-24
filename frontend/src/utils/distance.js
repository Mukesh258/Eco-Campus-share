/**
 * Calculates the distance between two coordinates in kilometers using the Haversine formula.
 * @param {number[]} coord1 - [latitude, longitude]
 * @param {number[]} coord2 - [latitude, longitude]
 * @returns {number} Distance in kilometers
 */
export const calculateDistance = (coord1, coord2) => {
  if (!coord1 || !coord2) return null;
  const [lat1, lon1] = coord1;
  const [lat2, lon2] = coord2;

  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
};

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

/**
 * Formats a distance in km to a readable string (e.g., "500m" or "1.2km")
 */
export const formatDistance = (distInKm) => {
  if (distInKm === null || distInKm === undefined) return "";
  if (distInKm < 1) {
    return `${Math.round(distInKm * 1000)}m`;
  }
  return `${distInKm.toFixed(1)}km`;
};
