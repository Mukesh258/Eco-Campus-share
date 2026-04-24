// Centralized error handling utility
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response;
    const message = data?.message || "An error occurred";

    switch (status) {
      case 400:
        return { status, message, type: "validation" };
      case 401:
        return { status, message: "Unauthorized. Please log in.", type: "auth" };
      case 403:
        return { status, message: "Access denied.", type: "permission" };
      case 404:
        return { status, message: "Resource not found.", type: "notfound" };
      case 500:
        return { status, message: "Server error. Please try again later.", type: "server" };
      default:
        return { status, message, type: "error" };
    }
  } else if (error.request) {
    // Request made but no response received
    return {
      status: 0,
      message: "Network error. Please check your connection.",
      type: "network"
    };
  } else {
    // Error in request setup
    return {
      status: 0,
      message: error.message || "An unexpected error occurred.",
      type: "unknown"
    };
  }
};

// Check if error is auth-related
export const isAuthError = (error) => {
  const handled = handleApiError(error);
  return handled.type === "auth";
};
