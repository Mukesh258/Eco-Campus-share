import { useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { isAuthError } from "./errorHandler";

// Hook for handling API calls with auth checking
export const useApiCall = () => {
  const { logout } = useAuth();

  const executeCall = useCallback(
    async (apiFunction) => {
      try {
        const result = await apiFunction();
        return { success: true, data: result };
      } catch (error) {
        // If it's an auth error, logout user
        if (isAuthError(error)) {
          logout();
        }
        return { success: false, error };
      }
    },
    [logout]
  );

  return executeCall;
};

// Hook for handling async operations with loading state
export const useAsyncOperation = () => {
  const executeCall = useApiCall();

  const execute = useCallback(
    async (apiFunction) => {
      try {
        const result = await executeCall(apiFunction);
        return result;
      } catch (err) {
        console.error("Async operation failed:", err);
        return { success: false, error: err };
      }
    },
    [executeCall]
  );

  return execute;
};
