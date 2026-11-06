import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import store from "./store/store";
import App from "./App";

import "./styles/reset.css";
import "./styles/variables.css";
import "./styles/global.css";

import { AuthProvider } from "./context/AuthContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <Provider store={store}>
    <AuthProvider>
      <App />
    </AuthProvider>
  </Provider>
);

// Expose diagnostic test helper in browser console during development
if (import.meta.env.DEV) {
  import("./services/api/index.js").then((api) => {
    window.testApiRoutes = async () => {
      console.log("🚀 Running Browser API Route Diagnostics...");
      const tests = [
        { name: "Server Health Probe", fn: () => api.apiClient.get(api.ENDPOINTS.SERVER.STATUS_LIVE) },
        { name: "Server Ready Probe", fn: () => api.apiClient.get(api.ENDPOINTS.SERVER.STATUS_READY) },
        { name: "Auth Profile (Protected)", fn: () => api.authApi.getMe() },
        { name: "Pending Approvals", fn: () => api.adminApi.getPendingRegistrations() },
        { name: "Issuer Schemas", fn: () => api.issuerApi.getRecordedSchemas() },
        { name: "Holder Credentials", fn: () => api.holderApi.getStoredCredentials() },
        { name: "Verifier Proof Requests", fn: () => api.verifierApi.getProofRequests() },
        { name: "Connections List", fn: () => api.connectionsApi.listConnections() },
      ];

      const report = [];
      for (const t of tests) {
        try {
          const res = await t.fn();
          report.push({ Test: t.name, Status: res.status || 200, Result: "✅ Success / 200 OK" });
        } catch (err) {
          const status = err.status || err.response?.status || (err.message?.includes("No authorization credentials") ? 401 : null);
          const isExpectedProtected = status === 401 || status === 403;
          report.push({
            Test: t.name,
            Status: status || "ERR",
            Result: isExpectedProtected ? "✅ Route Active (Auth Guard 401 - Protected)" : `❌ ${err.message}`,
          });
        }
      }
      console.table(report);
      return report;
    };
    window.setAuthToken = (token) => {
      api.setManualAuthToken(token);
      console.log("🔑 Auth token set successfully in client & localStorage:", token);
    };
    console.log("💡 Tip: Type `await window.testApiRoutes()` in this console to verify all API routes live.");
    console.log("💡 Tip: Type `window.setAuthToken('YOUR_TOKEN')` to manually attach a Swagger token.");
  });
}