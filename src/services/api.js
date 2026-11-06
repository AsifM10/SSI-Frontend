/**
 * Unified API bridge re-exporting the new JavaScript SDK and Redux API clients.
 * Retains backwards compatibility for default axios client and legacy named exports.
 */
import apiClient from "./api/client.js";
import authApi from "./api/auth.api.js";

export * from "./api/index.js";

// Legacy helper for OTP requests
export const sendOtp = async (data) => {
  try {
    if (data?.purpose === "FORGOT_PASSWORD") {
      const res = await authApi.forgotPassword(data.email);
      return { success: true, ...res };
    }
    const res = await authApi.resendOtp(data);
    return { success: true, ...res };
  } catch (err) {
    return { success: false, message: err?.response?.data?.message || err?.message || "Failed to send OTP" };
  }
};

export default apiClient;
