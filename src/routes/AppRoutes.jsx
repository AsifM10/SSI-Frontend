import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import RoleGuard from "./RoleGuard";
import Home from "../pages/Home/Home";
import RoleSelection from "../pages/RoleSelection/RoleSelection";
import LoginPage from "../pages/LoginPage/LoginPage";
import CheckStatus from "../pages/CheckStatus/CheckStatus";
import IssuerDashboard from "../pages/IssuerDashboard/IssuerDashboard";
import HolderDashboard from "../pages/HolderDashboard/HolderDashboard";
import VerifierDashboard from "../pages/VerifierDashboard/VerifierDashboard";
import AdminDashboard from "../pages/AdminDashboard/AdminDashboard";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ========================= */}
        {/* Public Routes             */}
        {/* ========================= */}
        <Route path="/" element={<Home />} />
        <Route path="/role-selection" element={<RoleSelection />} />
        <Route path="/check-status" element={<CheckStatus />} />

        {/* Public Login Routes (Role specific & unified) */}
        <Route path="/login" element={<LoginPage role="issuer" />} />
        <Route path="/select-role" element={<LoginPage role="issuer" />} />
        <Route path="/login/issuer" element={<LoginPage key="issuer" role="issuer" />} />
        <Route path="/login/holder" element={<LoginPage key="holder" role="holder" />} />
        <Route path="/login/verifier" element={<LoginPage key="verifier" role="verifier" />} />
        <Route path="/login/admin" element={<LoginPage key="admin" role="admin" />} />
        <Route path="/login/:role" element={<LoginPage />} />

        {/* Public Register Routes */}
        <Route path="/register" element={<LoginPage initialMode="register" role="issuer" />} />
        <Route path="/register/issuer" element={<LoginPage key="reg-issuer" initialMode="register" role="issuer" />} />
        <Route path="/register/holder" element={<LoginPage key="reg-holder" initialMode="register" role="holder" />} />
        <Route path="/register/verifier" element={<LoginPage key="reg-verifier" initialMode="register" role="verifier" />} />
        <Route path="/register/:role" element={<LoginPage initialMode="register" />} />

        {/* ========================= */}
        {/* Issuer Role Routes        */}
        {/* ========================= */}
        <Route
          path="/issuer-dashboard"
          element={
            <RoleGuard allowedRoles={["issuer"]}>
              <IssuerDashboard activeTab="dashboard" />
            </RoleGuard>
          }
        />
        <Route
          path="/issuer-schemas"
          element={
            <RoleGuard allowedRoles={["issuer"]}>
              <IssuerDashboard activeTab="schemas" />
            </RoleGuard>
          }
        />
        <Route
          path="/issuer-did"
          element={<Navigate to="/issuer-dashboard" replace />}
        />
        <Route
          path="/issuer-credentials"
          element={<Navigate to="/issuer-schemas" replace />}
        />
        <Route
          path="/issuer-connections"
          element={
            <RoleGuard allowedRoles={["issuer"]}>
              <IssuerDashboard activeTab="connections" />
            </RoleGuard>
          }
        />
        <Route
          path="/issuer-issuance"
          element={
            <RoleGuard allowedRoles={["issuer"]}>
              <IssuerDashboard activeTab="issuance" />
            </RoleGuard>
          }
        />

        {/* ========================= */}
        {/* Holder Role Routes        */}
        {/* ========================= */}
        <Route
          path="/holder-dashboard"
          element={
            <RoleGuard allowedRoles={["holder"]}>
              <HolderDashboard activeTab="dashboard" />
            </RoleGuard>
          }
        />
        <Route
          path="/holder-connections"
          element={
            <RoleGuard allowedRoles={["holder"]}>
              <HolderDashboard activeTab="connections" />
            </RoleGuard>
          }
        />
        <Route
          path="/holder-credentials"
          element={
            <RoleGuard allowedRoles={["holder"]}>
              <HolderDashboard activeTab="credentials" />
            </RoleGuard>
          }
        />
        <Route
          path="/holder-offers"
          element={
            <RoleGuard allowedRoles={["holder"]}>
              <HolderDashboard activeTab="offers" />
            </RoleGuard>
          }
        />
        <Route
          path="/holder-proof-requests"
          element={
            <RoleGuard allowedRoles={["holder"]}>
              <HolderDashboard activeTab="proofs" />
            </RoleGuard>
          }
        />
        <Route
          path="/holder-proofs"
          element={
            <RoleGuard allowedRoles={["holder"]}>
              <HolderDashboard activeTab="proofs" />
            </RoleGuard>
          }
        />

        {/* ========================= */}
        {/* Verifier Role Routes      */}
        {/* ========================= */}
        <Route
          path="/verifier-dashboard"
          element={
            <RoleGuard allowedRoles={["verifier"]}>
              <VerifierDashboard activeTab="dashboard" />
            </RoleGuard>
          }
        />
        <Route
          path="/verifier-connections"
          element={
            <RoleGuard allowedRoles={["verifier"]}>
              <VerifierDashboard activeTab="connections" />
            </RoleGuard>
          }
        />
        <Route
          path="/verifier-proof-requests"
          element={
            <RoleGuard allowedRoles={["verifier"]}>
              <VerifierDashboard activeTab="proof-requests" />
            </RoleGuard>
          }
        />
        <Route
          path="/verifier-history"
          element={
            <RoleGuard allowedRoles={["verifier"]}>
              <VerifierDashboard activeTab="history" />
            </RoleGuard>
          }
        />

        {/* ========================= */}
        {/* Admin Role Routes         */}
        {/* ========================= */}
        <Route
          path="/admin-dashboard"
          element={
            <RoleGuard allowedRoles={["admin"]}>
              <AdminDashboard activeTab="dashboard" />
            </RoleGuard>
          }
        />
        <Route
          path="/admin-requests"
          element={
            <RoleGuard allowedRoles={["admin"]}>
              <AdminDashboard activeTab="requests" />
            </RoleGuard>
          }
        />
        <Route
          path="/admin-users"
          element={
            <RoleGuard allowedRoles={["admin"]}>
              <AdminDashboard activeTab="users" />
            </RoleGuard>
          }
        />
        <Route
          path="/admin-system"
          element={
            <RoleGuard allowedRoles={["admin"]}>
              <AdminDashboard activeTab="system" />
            </RoleGuard>
          }
        />
        <Route
          path="/admin-audit"
          element={
            <RoleGuard allowedRoles={["admin"]}>
              <AdminDashboard activeTab="audit" />
            </RoleGuard>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}