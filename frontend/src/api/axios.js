import axios from "axios";

const getBaseURL = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  const host = window.location.hostname;
  // If we are on localhost, but we want to support network testing, 
  // we can still use the machine's IP, but localhost is fine for local.
  // The key is that OTHER devices will have the machine's IP in their URL bar.
  return `http://${host}:5000/api`;
};

const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    "Content-Type": "application/json"
  },
  timeout: 10000 // 10 second timeout
});

// Request interceptor: Add token to headers
api.interceptors.request.use(
  (config) => {
    const authData = localStorage.getItem("ecoShareAuth");

    if (authData) {
      try {
        const { token } = JSON.parse(authData);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (err) {
        console.error("Failed to parse auth data:", err);
        localStorage.removeItem("ecoShareAuth");
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: Handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth data on 401
      localStorage.removeItem("ecoShareAuth");
      window.dispatchEvent(new Event("auth-logout"));
    }

    return Promise.reject(error);
  }
);

export default api;
