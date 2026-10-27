import {
  HomeOutlined,
  EyeOutlined,
  UsergroupAddOutlined,
  ApiOutlined,
  ClockCircleOutlined,
  SettingOutlined,
  InfoOutlined,
  SafetyCertificateOutlined,
  AuditOutlined,
  WalletOutlined,
  BankOutlined,
} from "@ant-design/icons";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./Sidebar.css";

const Sidebar = ({ collapsed, role }) => {
  const { user } = useAuth();

  const currentRole = role || user?.role || "issuer";
  const isIssuer = currentRole === "issuer";
  const isHolder = currentRole === "holder";
  const isVerifier = currentRole === "verifier";
  const isAdmin = currentRole === "admin";

  const navigationSections = [];

  if (isIssuer) {
    navigationSections.push({
      title: "Core",
      items: [
        { key: "issuer-dashboard", path: "/issuer-dashboard", icon: HomeOutlined, label: "Overview" },
      ],
    });
    navigationSections.push({
      title: "Credentials & Issuance",
      items: [
        { key: "issuer-schemas", path: "/issuer-schemas", icon: ApiOutlined, label: "Schemas" },
        { key: "issuer-connections", path: "/issuer-connections", icon: UsergroupAddOutlined, label: "Connections" },
        { key: "issuer-issuance", path: "/issuer-issuance", icon: ClockCircleOutlined, label: "Issuance History" },
      ],
    });
  }

  if (isHolder) {
    navigationSections.push({
      title: "Digital Wallet",
      items: [
        { key: "holder-dashboard", path: "/holder-dashboard", icon: HomeOutlined, label: "Overview" },
        { key: "holder-credentials", path: "/holder-credentials", icon: WalletOutlined, label: "My Credentials" },
        { key: "holder-offers", path: "/holder-offers", icon: ApiOutlined, label: "Credential Offers" },
        { key: "holder-proof-requests", path: "/holder-proof-requests", icon: EyeOutlined, label: "Proof Requests" },
        { key: "holder-connections", path: "/holder-connections", icon: UsergroupAddOutlined, label: "Connections" },
      ],
    });
  }

  if (isVerifier) {
    navigationSections.push({
      title: "Core",
      items: [
        { key: "verifier-dashboard", path: "/verifier-dashboard", icon: HomeOutlined, label: "Overview" },
      ],
    });
    navigationSections.push({
      title: "Proofs & Verification",
      items: [
        { key: "verifier-proof-requests", path: "/verifier-proof-requests", icon: EyeOutlined, label: "Proof Requests" },
        { key: "verifier-history", path: "/verifier-history", icon: AuditOutlined, label: "Verification History" },
        { key: "verifier-connections", path: "/verifier-connections", icon: UsergroupAddOutlined, label: "Holder Connections" },
      ],
    });
  }

  if (isAdmin) {
    navigationSections.push({
      title: "Core",
      items: [
        { key: "admin-dashboard", path: "/admin-dashboard", icon: HomeOutlined, label: "Overview" },
      ],
    });
    navigationSections.push({
      title: "Governance",
      items: [
        { key: "admin-requests", path: "/admin-requests", icon: BankOutlined, label: "Organization Requests" },
        { key: "admin-users", path: "/admin-users", icon: UsergroupAddOutlined, label: "User Accounts" },
      ],
    });
    navigationSections.push({
      title: "Infrastructure & Auditing",
      items: [
        { key: "admin-system", path: "/admin-system", icon: SettingOutlined, label: "Infrastructure" },
        { key: "admin-audit", path: "/admin-audit", icon: InfoOutlined, label: "Audit Logs" },
      ],
    });
  }

  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="sidebar-top">
        {/* Brand Logo Header */}
        <div className="sidebar-logo">
          <div className="logo-icon">
            <SafetyCertificateOutlined style={{ fontSize: 22, color: "#FFFFFF" }} />
          </div>
          {!collapsed && (
            <div>
              <div className="sidebar-brand-title">
                SSI <span>Portal</span>
              </div>
              <p className="sidebar-brand-subtitle">CDAC Framework</p>
            </div>
          )}
        </div>

        {/* Navigation Sections */}
        <div className="sidebar-menu">
          {navigationSections.map((section, idx) => (
            <div key={idx} className="sidebar-section">
              {!collapsed && (
                <div className="sidebar-section-title">{section.title}</div>
              )}
              {section.items.map((item) => (
                <NavLink
                  key={item.key}
                  to={item.path}
                  className={({ isActive }) =>
                    `sidebar-menu-item ${isActive ? "active" : ""}`
                  }
                  title={collapsed ? item.label : ""}
                >
                  <item.icon className="sidebar-item-icon" />
                  {!collapsed && <span className="sidebar-item-label">{item.label}</span>}
                </NavLink>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Node Status */}
      <div className="sidebar-footer">
        {!collapsed ? (
          <div className="sidebar-node-status">
            <span className="node-ping-dot" />
            <span className="node-status-text">Ledger Node: Active</span>
          </div>
        ) : (
          <div className="sidebar-node-status" style={{ justifyContent: "center" }} title="Ledger Node: Active">
            <span className="node-ping-dot" />
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;