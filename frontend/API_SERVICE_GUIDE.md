# API Service Layer Documentation

## Overview

The Eco-Share frontend uses a centralized API service layer built with Axios. This ensures consistent token handling, error management, and API interactions across the application.

## Architecture

### Files

- **`api/axios.js`** - Axios instance with request/response interceptors
- **`api/services.js`** - Organized service functions for auth, rides, and bikes
- **`api/errorHandler.js`** - Centralized error handling utility
- **`api/hooks.js`** - Custom React hooks for API operations
- **`context/AuthContext.jsx`** - Authentication state & token management

## How It Works

### 1. Token Management

Tokens are automatically added to all API requests via Axios interceptor:

```javascript
// In api/axios.js request interceptor
config.headers.Authorization = `Bearer ${token}`;
```

### 2. Service Layer Pattern

All API calls go through organized service functions:

```javascript
// In api/services.js

export const rideService = {
  getAllRides: async () => {
    try {
      const { data } = await api.get("/rides");
      return data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
  // ... more methods
};
```

### 3. Error Handling

Errors are standardized with status code mapping:

```javascript
// In api/errorHandler.js
const error = handleApiError(err);
// Returns: { status, message, type }
// Types: validation, auth, permission, notfound, server, network, error, unknown
```

## Usage in Components

### Basic Data Fetching

```javascript
import { useEffect, useState } from "react";
import { rideService } from "../api/services";
import { handleApiError } from "../api/errorHandler";

function MyComponent() {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await rideService.getAllRides();
        setRides(data);
      } catch (err) {
        const errorObj = handleApiError(err);
        setError(errorObj.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // ... rest of component
}
```

### With Custom Hook

```javascript
import { useApiCall } from "../api/hooks";
import { rideService } from "../api/services";

function MyComponent() {
  const executeCall = useApiCall();
  const [rides, setRides] = useState([]);

  const loadRides = async () => {
    const result = await executeCall(() => rideService.getAllRides());
    
    if (result.success) {
      setRides(result.data);
    } else {
      // Error is already handled (logout on 401, etc.)
      console.error(result.error);
    }
  };

  return {
    /* ... */
  };
}
```

## Available Services

### authService

```javascript
authService.register(userData)    // { name, email, password, role }
authService.login(credentials)     // { email, password }
authService.getCurrentUser()       // No params
```

### rideService

```javascript
rideService.createRide(rideData)   // { source, destination, departureTime, ... }
rideService.getAllRides()          // No params
rideService.searchRides(src, dest) // source, destination strings
rideService.getRideById(id)        // ride ID
rideService.bookRide(id)           // ride ID
```

### bikeService

```javascript
bikeService.addBike(bikeData)      // { bikeName, bikeNumber, ... }
bikeService.getAllBikes()          // No params
bikeService.getAvailableBikes()    // No params
bikeService.getBikeById(id)        // bike ID
bikeService.bookBike(id)           // bike ID
bikeService.returnBike(id)         // bike ID
```

## Error Handling Examples

### Validation Error

```javascript
try {
  await rideService.createRide({ /* invalid data */ });
} catch (error) {
  // error = { status: 400, message: "...", type: "validation" }
}
```

### Auth Error (Auto-logout)

```javascript
// If API returns 401, axios interceptor automatically:
// 1. Clears localStorage.ecoShareAuth
// 2. Dispatches auth-logout event
// 3. useAuth hook logs out user
```

### Network Error

```javascript
try {
  await rideService.getAllRides();
} catch (error) {
  // error = { status: 0, message: "Network error...", type: "network" }
}
```

## Best Practices

1. **Always use services, not direct api calls**
   ```javascript
   // ✅ Good
   const rides = await rideService.getAllRides();
   
   // ❌ Avoid
   const { data } = await api.get("/rides");
   ```

2. **Use handleApiError for human-readable messages**
   ```javascript
   // ✅ Good
   const errorObj = handleApiError(err);
   setError(errorObj.message); // "Unauthorized. Please log in."
   
   // ❌ Avoid
   setError(err.response?.data?.message); // Raw API response
   ```

3. **Leverage custom hooks for common patterns**
   ```javascript
   // ✅ Good
   const executeCall = useApiCall();
   const result = await executeCall(() => rideService.getAllRides());
   
   // ❌ Avoid
   // Manual try-catch in every component
   ```

4. **Handle loading states properly**
   ```javascript
   {loading ? (
     <Spinner />
   ) : error ? (
     <ErrorMessage message={error} />
   ) : (
     <Content data={data} />
   )}
   ```

## Configuration

### API Base URL

Set in `.env.example`:
```
VITE_API_URL=http://localhost:5000/api
```

At runtime, defaults to `http://localhost:5000/api` if not set.

### Request Timeout

Default: 10 seconds (in `api/axios.js`)

```javascript
const api = axios.create({
  // ...
  timeout: 10000 // milliseconds
});
```

## Debugging

### Enable Request/Response Logging

Add to `api/axios.js`:

```javascript
// After response interceptor
api.interceptors.response.use(
  (response) => {
    console.log("API Response:", response);
    return response;
  },
  // ...
);
```

### Check Token in Storage

```javascript
// In browser console
JSON.parse(localStorage.getItem("ecoShareAuth"))
// Returns: { _id, name, email, role, token }
```
