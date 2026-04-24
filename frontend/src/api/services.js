import api from "./axios";
import { handleApiError } from "./errorHandler";

// Auth endpoints
export const authService = {
  register: async (userData) => {
    try {
      const { data } = await api.post("/auth/register", userData);
      return data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  login: async (credentials) => {
    try {
      const { data } = await api.post("/auth/login", credentials);
      return data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  getCurrentUser: async () => {
    try {
      const { data } = await api.get("/auth/me");
      return data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  updateProfile: async (userData) => {
    try {
      const { data } = await api.put("/auth/profile", userData);
      return data;
    } catch (error) {
      throw handleApiError(error);
    }
  }
};

// Ride endpoints
export const rideService = {
  createRide: async (rideData) => {
    try {
      const { data } = await api.post("/rides", rideData);
      return data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  getAllRides: async () => {
    try {
      const { data } = await api.get("/rides");
      return data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  searchRides: async (source, destination) => {
    try {
      const params = new URLSearchParams();
      if (source) params.append("source", source);
      if (destination) params.append("destination", destination);

      const { data } = await api.get(`/rides/search?${params.toString()}`);
      return data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  getRideById: async (id) => {
    try {
      const { data } = await api.get(`/rides/${id}`);
      return data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  bookRide: async (id) => {
    try {
      const { data } = await api.post(`/rides/${id}/book`);
      return data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  getRecommendations: async (location = "", timing = "") => {
    try {
      const params = new URLSearchParams();
      if (location) params.append("location", location);
      if (timing) params.append("timing", timing);
      
      const { data } = await api.get(`/rides/recommendations?${params.toString()}`);
      return data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  leaveRide: async (id) => {
    try {
      const { data } = await api.post(`/rides/${id}/leave`);
      return data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  cancelRide: async (id) => {
    try {
      const { data } = await api.delete(`/rides/${id}`);
      return data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  startRide: async (id) => {
    try {
      const { data } = await api.post(`/rides/${id}/start`);
      return data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  endRide: async (id) => {
    try {
      const { data } = await api.post(`/rides/${id}/end`);
      return data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  removePassenger: async (rideId, userId) => {
    try {
      const { data } = await api.delete(`/rides/${rideId}/passengers/${userId}`);
      return data;
    } catch (error) {
      throw handleApiError(error);
    }
  }
};

// Bike endpoints
export const bikeService = {
  addBike: async (bikeData) => {
    try {
      const { data } = await api.post("/bikes", bikeData);
      return data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  getAllBikes: async () => {
    try {
      const { data } = await api.get("/bikes");
      return data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  getAvailableBikes: async (bikeType) => {
    try {
      let url = "/bikes/available";
      if (bikeType) {
        url += `?bikeType=${bikeType}`;
      }
      const { data } = await api.get(url);
      return data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  getBikeById: async (id) => {
    try {
      const { data } = await api.get(`/bikes/${id}`);
      return data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  bookBike: async (id) => {
    try {
      const { data } = await api.post(`/bikes/${id}/book`);
      return data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  returnBike: async (id, hoursUsed) => {
    try {
      const { data } = await api.post(`/bikes/${id}/return`, { hoursUsed });
      return data;
    } catch (error) {
      throw handleApiError(error);
    }
  }
};

// User/Driver services
export const userService = {
  setDriverOnlineStatus: async (isOnline) => {
    try {
      const { data } = await api.post("/users/driver-online-status", { isOnline });
      return data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  getAvailableDrivers: async () => {
    try {
      const { data } = await api.get("/users/available-drivers");
      return data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  getDriverProfile: async (driverId) => {
    try {
      const { data } = await api.get(`/users/driver/${driverId}`);
      return data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  rateDriver: async (rideId, rating, review) => {
    try {
      const { data } = await api.post(`/users/rate-driver/${rideId}`, { rating, review });
      return data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  ratePassenger: async (rideId, rating, review) => {
    try {
      const { data } = await api.post(`/users/rate-passenger/${rideId}`, { rating, review });
      return data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  getUserRatings: async (userId) => {
    try {
      const { data } = await api.get(`/users/ratings/${userId}`);
      return data;
    } catch (error) {
      throw handleApiError(error);
    }
  }
};
