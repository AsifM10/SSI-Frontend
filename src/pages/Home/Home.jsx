import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import {
  SafetyCertificateOutlined,
  SunOutlined,
  MoonOutlined,
  ArrowRightOutlined,
  LockOutlined,
  DatabaseOutlined,
  DeploymentUnitOutlined,
  ClusterOutlined,
} from "@ant-design/icons";
import TrustDiagram from "./TrustDiagram";
import "./Home.css";

const Home = () => {
  const { user, isLoading, logout } = useAuth();
  const { dark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const bottomFeatures = [
    {
      icon: <DatabaseOutlined />,
      title: "Built on Open Standards",
      desc: "W3C, DID, Verifiable Credentials",
    },
    {
      icon: <DeploymentUnitOutlined />,
      title: "Interoperable & Scalable",
      desc: "Decentralized trust network",
    },
    {
      icon: <LockOutlined />,
      title: "Privacy-Preserving",
      desc: "Zero-knowledge proofs",
    },
    {
      icon: <SafetyCertificateOutlined />,
      title: "Enterprise Ready",
      desc: "Secure, auditable, and extensible",
    },
  ];

  if (isLoading) {
    return (
      <div className="home-page loading-screen">
        <div className="loading-container">
          <ClusterOutlined spin style={{ fontSize: 36, color: "var(--primary-color)" }} />
          <p style={{ marginTop: 16, fontWeight: 600 }}>Connecting to SSI Network...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="home-page">
      {/* Background Subtle Contour Grid */}
      <div className="subtle-bg-grid" />

      {/* Top Navigation */}
      <header className="home-navbar">
        <div className="home-brand">
          <div className="home-brand-icon">
            <svg width="22" height="24" viewBox="0 0 24 26" fill="none">
              <path
                d="M12 1L22 5.5V13.5C22 19.5 17.5 24 12 25.5C6.5 24 2 19.5 2 13.5V5.5L12 1Z"
                fill="#1D4ED8"
                stroke="#60A5FA"
                strokeWidth="1.5"
              />
              <path
                d="M8.5 13L11 15.5L15.5 10"
                stroke="#FFFFFF"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="home-brand-name">
            SSI <span>Platform</span>
          </div>
        </div>

        <div className="home-nav-actions">
          <div className="network-status-pill">
            <span className="node-pulse-dot" />
            <span>CDAC Indy Ledger: Online</span>
          </div>

          <button
            className="theme-toggle-btn"
            onClick={toggleTheme}
            title={dark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {dark ? <SunOutlined /> : <MoonOutlined />}
          </button>

          <button
            className="nav-portal-btn"
            onClick={() => navigate("/login")}
          >
            Agent Portal <ArrowRightOutlined />
          </button>
        </div>
      </header>

      {/* Active User Session Notice (if logged in) */}
      {user && (
        <div className="home-session-bar">
          <div>
            <span>Active Session: </span>
            <strong>{user.username}</strong>
            <span className="tag tag-primary" style={{ marginLeft: 8 }}>
              {user.role.toUpperCase()}
            </span>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => navigate(`/${user.role}-dashboard`)}
            >
              Resume {user.role} Dashboard
            </button>
            <button className="btn btn-outline btn-sm" onClick={() => logout()}>
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Hero Section: 2-Column Split */}
      <section className="home-hero-split">
        <div className="hero-left">
          <span className="hero-eyebrow">SELF-SOVEREIGN IDENTITY</span>
          <h1 className="hero-heading">
            Decentralized Identity
          </h1>
          <p className="hero-subtext">
            Issue, hold, and verify privacy-preserving verifiable credentials on a decentralized trust network.
          </p>

          <div className="hero-value-props">
            <div className="prop-item">
              <SafetyCertificateOutlined className="prop-icon" />
              <span>Privacy by Design</span>
            </div>
            <div className="prop-divider" />
            <div className="prop-item">
              <DeploymentUnitOutlined className="prop-icon" />
              <span>Decentralized Trust</span>
            </div>
            <div className="prop-divider" />
            <div className="prop-item">
              <LockOutlined className="prop-icon" />
              <span>Zero-Knowledge Proofs</span>
            </div>
          </div>

          <div className="hero-cta-group">
            <button
              className="hero-primary-btn"
              onClick={() => navigate("/login")}
            >
              Enter Agent Portal <ArrowRightOutlined />
            </button>
          </div>
        </div>

        <div className="hero-right">
          <TrustDiagram onSelectRole={(role) => navigate(`/login/${role}`)} />
          <div className="diagram-click-hint">
            <span>Click any agent to sign in directly</span>
          </div>
        </div>
      </section>

      {/* Trust & Specs Bottom Footer */}
      <footer className="home-bottom-footer">
        <div className="bottom-features-row">
          {bottomFeatures.map((feat, idx) => (
            <div key={idx} className="bottom-feature-item">
              <div className="bottom-feature-icon">
                {feat.icon}
              </div>
              <div className="bottom-feature-text">
                <div className="feature-title">{feat.title}</div>
                <div className="feature-desc">{feat.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="copyright-bar">
          Copyright © 2026 C-DAC Mumbai. All Rights Reserved.
        </div>
      </footer>
    </div>
  );
};

export default Home;
