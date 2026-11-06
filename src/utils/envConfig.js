/**
 * Runtime Environment Configuration
 * Live Backend API: http://10.210.13.22:5000 (/api/v1)
 * Mock demo mode and mock data are permanently removed.
 */

// Permanently disabled mock mode - application always uses live backend
export const isMockModeActive = () => false;

export const setMockModeActive = () => {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.removeItem("ssi_mock_mode");
    }
  } catch {
    // ignore
  }
};

// Clear any residual localStorage mock flag immediately
try {
  if (typeof window !== "undefined" && window.localStorage) {
    localStorage.removeItem("ssi_mock_mode");
  }
} catch {
  // ignore
}

export const getApiBaseUrl = () => {
  return import.meta.env?.VITE_API_BASE_URL || "/api/v1";
};
