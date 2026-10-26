import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import {
  AuditOutlined,
  WalletOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
  SunOutlined,
  MoonOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  LockOutlined,
  CheckCircleOutlined,
  BankOutlined,
  UserAddOutlined,
} from "@ant-design/icons";

import "./RoleSelection.css";

const RoleSelection = () => {
  const { user, logout } = useAuth();
  const { dark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleSelectRole = (role) => {
    logout();
    navigate(`/login/${role}`);
  };

  const roles = [
    {
      role: "issuer",
      title: "Issuer",
      badge: "Authority",
      desc: "Define cryptographic schemas, register credential definitions, and issue tamper-proof verifiable credentials.",
      icon: <AuditOutlined />,
      gradient: "linear-gradient(135deg, #4F46E5, #06B6D4)",
      features: ["Schema Registry (W3C)", "DID Management", "Batch Credential Issuance"],
    },
    {
      role: "holder",
      title: "Holder",
      badge: "Digital Wallet",
      desc: "Secure self-sovereign wallet to store verifiable credentials, accept offers, and generate selective disclosures.",
      icon: <WalletOutlined />,
      gradient: "linear-gradient(135deg, #06B6D4, #10B981)",
      features: ["Decentralized Wallet", "Zero-Knowledge Presentations", "Peer Connections"],
    },
    {
      role: "verifier",
      title: "Verifier",
      badge: "Validation Hub",
      desc: "Verify cryptographic presentations against decentralized ledger schemas with zero sensitive data leakage.",
      icon: <SafetyCertificateOutlined />,
      gradient: "linear-gradient(135deg, #F59E0B, #FB923C)",
      features: ["ZKP Verification", "Policy-Based Proofs", "Cryptographic Audit Trail"],
    },
    {
      role: "admin",
      title: "Admin",
      badge: "Operator",
      desc: "Manage decentralized identity ledger nodes, configure consensus policies, and inspect security telemetry.",
      icon: <SettingOutlined />,
      gradient: "linear-gradient(135deg, #8B5CF6, #6366F1)",
      features: ["Node Health Telemetry", "RBAC User Governance", "Immutable Audit Logs"],
    },
  ];

  return (
    <div className="role-selection-page">
      <div className="role-nav">
        <button className="btn btn-ghost btn-sm" onClick={() => navigate("/")}>
          <ArrowLeftOutlined /> Back to Home
        </button>
        <button
          className="btn-icon"
          onClick={toggleTheme}
          title={dark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {dark ? <SunOutlined /> : <MoonOutlined />}
        </button>
      </div>

      <div className="role-header">
        <span className="tag tag-primary" style={{ marginBottom: 12 }}>
          <LockOutlined /> AUTHENTICATED ACCESS REQUIRED
        </span>
        <h1>Select Agent Portal</h1>
        <p>
          Each agent portal is cryptographically segregated. Select an operational role below to sign in with that role's credentials.
        </p>
      </div>

      <div className="role-grid">
        {roles.map((item) => (
          <div
            key={item.role}
            className="role-select-card"
            onClick={() => handleSelectRole(item.role)}
          >
            <div className="card-accent-rail" style={{ background: item.gradient }} />
            
            <div className="role-card-header">
              <div className="role-icon-box" style={{ background: item.gradient }}>
                {item.icon}
              </div>
              <span className="card-badge">{item.badge}</span>
            </div>

            <div className="role-info">
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
            </div>

            <div className="card-features">
              {item.features.map((feat, idx) => (
                <div key={idx} className="feature-item">
                  <CheckCircleOutlined className="feature-icon" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>

            <div className="card-actions" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <button
                type="button"
                className="btn btn-primary btn-sm launch-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectRole(item.role);
                }}
              >
                Sign In to {item.title} <ArrowRightOutlined />
              </button>
              {item.role !== "admin" && (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{ fontSize: 12, fontWeight: 600, color: "var(--primary-color)", padding: "4px 8px" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    logout();
                    navigate(`/register/${item.role}`);
                  }}
                >
                  Register as new {item.title} →
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="role-onboard-bottom" style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
        <button
          className="btn btn-outline"
          onClick={() => navigate("/register")}
          style={{ borderRadius: 10, padding: "10px 20px", fontWeight: 600 }}
        >
          <UserAddOutlined style={{ marginRight: 6 }} /> Register New Agent Account
        </button>
        <button
          className="btn btn-outline"
          onClick={() => navigate("/check-status")}
          style={{ borderRadius: 10, padding: "10px 20px" }}
        >
          <BankOutlined style={{ marginRight: 6 }} /> Organization Onboarding? Check Reservation Status
        </button>
      </div>
    </div>
  );
};

export default RoleSelection;