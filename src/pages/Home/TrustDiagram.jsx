import React from "react";
import "./TrustDiagram.css";

const TrustDiagram = ({ activeRole, onSelectRole, interactive = false }) => {
  const handleNodeClick = (role) => {
    if (onSelectRole) {
      onSelectRole(role);
    }
  };

  return (
    <div className={`trust-diagram-wrapper ${interactive ? "is-clickable" : ""}`}>
      <svg
        className="trust-diagram-svg"
        viewBox="0 0 560 360"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Gradients */}
          <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1E3A8A" />
            <stop offset="50%" stopColor="#2563EB" />
            <stop offset="100%" stopColor="#1D4ED8" />
          </linearGradient>

          <linearGradient id="pedestalGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="60%" stopColor="#F1F5F9" />
            <stop offset="100%" stopColor="#E2E8F0" />
          </linearGradient>

          <linearGradient id="hexGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#F8FAFC" />
          </linearGradient>

          <linearGradient id="hexGradActive" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#EFF6FF" />
            <stop offset="100%" stopColor="#DBEAFE" />
          </linearGradient>

          <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="10" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          <filter id="nodeShadow" x="-30%" y="-20%" width="160%" height="160%">
            <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#0F172A" floodOpacity="0.08" />
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#0F172A" floodOpacity="0.04" />
          </filter>

          <filter id="nodeShadowActive" x="-40%" y="-30%" width="180%" height="180%">
            <feDropShadow dx="0" dy="10" stdDeviation="12" floodColor="#2563EB" floodOpacity="0.25" />
            <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#2563EB" floodOpacity="0.15" />
          </filter>

          <filter id="centerShadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="12" stdDeviation="16" floodColor="#1E3A8A" floodOpacity="0.12" />
          </filter>
        </defs>

        {/* Ambient Isometric Grid Background */}
        <g opacity="0.45" stroke="#E2E8F0" strokeWidth="0.8">
          <path d="M40 180 L280 40 L520 180 L280 320 Z" fill="none" strokeDasharray="3 3" />
          <path d="M100 180 L280 80 L460 180 L280 280 Z" fill="none" strokeDasharray="2 2" />
          <line x1="280" y1="40" x2="280" y2="320" stroke="#CBD5E1" strokeWidth="0.6" strokeDasharray="4 4" />
          <line x1="40" y1="180" x2="520" y2="180" stroke="#CBD5E1" strokeWidth="0.6" strokeDasharray="4 4" />
        </g>

        {/* Circuit Connecting Lines from Center to Nodes */}
        {/* Top-Left: Issuer */}
        <g className="circuit-branch">
          <line
            x1="280"
            y1="175"
            x2="135"
            y2="90"
            stroke={activeRole === "issuer" ? "#2563EB" : "#93C5FD"}
            strokeWidth={activeRole === "issuer" ? "2.5" : "2"}
            strokeDasharray={activeRole === "issuer" ? "none" : "4 4"}
          />
          <circle cx="207" cy="132" r="3" fill="#2563EB" className="pulse-dot" />
        </g>

        {/* Top-Right: Holder */}
        <g className="circuit-branch">
          <line
            x1="280"
            y1="175"
            x2="425"
            y2="90"
            stroke={activeRole === "holder" ? "#2563EB" : "#93C5FD"}
            strokeWidth={activeRole === "holder" ? "2.5" : "2"}
            strokeDasharray={activeRole === "holder" ? "none" : "4 4"}
          />
          <circle cx="352" cy="132" r="3" fill="#2563EB" className="pulse-dot" />
        </g>

        {/* Bottom-Left: Verifier */}
        <g className="circuit-branch">
          <line
            x1="280"
            y1="185"
            x2="140"
            y2="265"
            stroke={activeRole === "verifier" ? "#2563EB" : "#93C5FD"}
            strokeWidth={activeRole === "verifier" ? "2.5" : "2"}
            strokeDasharray={activeRole === "verifier" ? "none" : "4 4"}
          />
          <circle cx="210" cy="225" r="3" fill="#2563EB" className="pulse-dot" />
        </g>

        {/* Bottom-Right: Admin */}
        <g className="circuit-branch">
          <line
            x1="280"
            y1="185"
            x2="420"
            y2="265"
            stroke={activeRole === "admin" ? "#2563EB" : "#93C5FD"}
            strokeWidth={activeRole === "admin" ? "2.5" : "2"}
            strokeDasharray={activeRole === "admin" ? "none" : "4 4"}
          />
          <circle cx="350" cy="225" r="3" fill="#2563EB" className="pulse-dot" />
        </g>

        {/* Center Multi-Tiered Isometric Pedestal */}
        <g filter="url(#centerShadow)">
          <ellipse cx="280" cy="195" rx="72" ry="34" fill="#E2E8F0" />
          <ellipse cx="280" cy="188" rx="66" ry="30" fill="url(#pedestalGrad)" stroke="#CBD5E1" strokeWidth="1.2" />
          <ellipse cx="280" cy="184" rx="56" ry="24" fill="none" stroke="#60A5FA" strokeWidth="1.5" strokeDasharray="5 3" />
          <ellipse cx="280" cy="180" rx="48" ry="20" fill="#FFFFFF" stroke="#93C5FD" strokeWidth="1.5" />
          <ellipse cx="280" cy="180" rx="36" ry="14" fill="#EFF6FF" />
        </g>

        {/* Center Glowing Navy 3D Shield */}
        <g className="center-shield-glow" transform="translate(254, 126)">
          <ellipse cx="26" cy="56" rx="18" ry="6" fill="#1E3A8A" opacity="0.25" filter="url(#softGlow)" />
          <path
            d="M26 6 L48 15 C48 34 38 48 26 55 C14 48 4 34 4 15 Z"
            fill="url(#shieldGrad)"
            stroke="#60A5FA"
            strokeWidth="1.8"
          />
          <path
            d="M26 12 L42 19 C42 33 34 43 26 48 C18 43 10 33 10 19 Z"
            fill="none"
            stroke="#93C5FD"
            strokeWidth="1.2"
            opacity="0.8"
          />
          <path
            d="M20 28 L24 32 L32 23"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>

        {/* ======================================================== */}
        {/* 4 FLOATING ISOMETRIC HEXAGONAL NODES                    */}
        {/* ======================================================== */}

        {/* 1. TOP-LEFT: ISSUER */}
        <g
          className={`floating-node node-issuer ${activeRole === "issuer" ? "is-active" : ""}`}
          transform="translate(95, 45)"
          filter={activeRole === "issuer" ? "url(#nodeShadowActive)" : "url(#nodeShadow)"}
          onClick={() => handleNodeClick("issuer")}
          style={{ cursor: onSelectRole ? "pointer" : "default" }}
        >
          <path
            d="M40 4 L74 23 L74 61 L40 80 L6 61 L6 23 Z"
            fill={activeRole === "issuer" ? "url(#hexGradActive)" : "url(#hexGrad)"}
            stroke={activeRole === "issuer" ? "#2563EB" : "#E2E8F0"}
            strokeWidth={activeRole === "issuer" ? "2.5" : "1.5"}
          />
          <g transform="translate(25, 23)" stroke={activeRole === "issuer" ? "#2563EB" : "#1E3A8A"} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 10 L15 2 L28 10 Z" fill="#EFF6FF" />
            <line x1="5" y1="10" x2="5" y2="20" />
            <line x1="11" y1="10" x2="11" y2="20" />
            <line x1="19" y1="10" x2="19" y2="20" />
            <line x1="25" y1="10" x2="25" y2="20" />
            <line x1="1" y1="22" x2="29" y2="22" />
          </g>
          <text
            x="40"
            y="96"
            textAnchor="middle"
            fill={activeRole === "issuer" ? "#2563EB" : "#0F172A"}
            fontSize="13"
            fontWeight={activeRole === "issuer" ? "800" : "700"}
            fontFamily="system-ui, sans-serif"
          >
            Issuer
          </text>
        </g>

        {/* 2. TOP-RIGHT: HOLDER */}
        <g
          className={`floating-node node-holder ${activeRole === "holder" ? "is-active" : ""}`}
          transform="translate(385, 45)"
          filter={activeRole === "holder" ? "url(#nodeShadowActive)" : "url(#nodeShadow)"}
          onClick={() => handleNodeClick("holder")}
          style={{ cursor: onSelectRole ? "pointer" : "default" }}
        >
          <path
            d="M40 4 L74 23 L74 61 L40 80 L6 61 L6 23 Z"
            fill={activeRole === "holder" ? "url(#hexGradActive)" : "url(#hexGrad)"}
            stroke={activeRole === "holder" ? "#2563EB" : "#E2E8F0"}
            strokeWidth={activeRole === "holder" ? "2.5" : "1.5"}
          />
          <g transform="translate(26, 23)" stroke={activeRole === "holder" ? "#2563EB" : "#1E3A8A"} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="14" cy="8" r="5" fill="#EFF6FF" />
            <path d="M4 23 C4 17 8 15 14 15 C20 15 24 17 24 23" />
          </g>
          <text
            x="40"
            y="96"
            textAnchor="middle"
            fill={activeRole === "holder" ? "#2563EB" : "#0F172A"}
            fontSize="13"
            fontWeight={activeRole === "holder" ? "800" : "700"}
            fontFamily="system-ui, sans-serif"
          >
            Holder
          </text>
        </g>

        {/* 3. BOTTOM-LEFT: VERIFIER */}
        <g
          className={`floating-node node-verifier ${activeRole === "verifier" ? "is-active" : ""}`}
          transform="translate(100, 215)"
          filter={activeRole === "verifier" ? "url(#nodeShadowActive)" : "url(#nodeShadow)"}
          onClick={() => handleNodeClick("verifier")}
          style={{ cursor: onSelectRole ? "pointer" : "default" }}
        >
          <path
            d="M40 4 L74 23 L74 61 L40 80 L6 61 L6 23 Z"
            fill={activeRole === "verifier" ? "url(#hexGradActive)" : "url(#hexGrad)"}
            stroke={activeRole === "verifier" ? "#2563EB" : "#E2E8F0"}
            strokeWidth={activeRole === "verifier" ? "2.5" : "1.5"}
          />
          <g transform="translate(26, 23)" stroke={activeRole === "verifier" ? "#2563EB" : "#1E3A8A"} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 3 L25 8 C25 18 19 23 14 26 C9 23 3 18 3 8 Z" fill="#EFF6FF" />
            <path d="M10 14 L13 17 L19 11" stroke="#2563EB" strokeWidth="2" />
          </g>
          <text
            x="40"
            y="96"
            textAnchor="middle"
            fill={activeRole === "verifier" ? "#2563EB" : "#0F172A"}
            fontSize="13"
            fontWeight={activeRole === "verifier" ? "800" : "700"}
            fontFamily="system-ui, sans-serif"
          >
            Verifier
          </text>
        </g>

        {/* 4. BOTTOM-RIGHT: ADMIN */}
        <g
          className={`floating-node node-admin ${activeRole === "admin" ? "is-active" : ""}`}
          transform="translate(380, 215)"
          filter={activeRole === "admin" ? "url(#nodeShadowActive)" : "url(#nodeShadow)"}
          onClick={() => handleNodeClick("admin")}
          style={{ cursor: onSelectRole ? "pointer" : "default" }}
        >
          <path
            d="M40 4 L74 23 L74 61 L40 80 L6 61 L6 23 Z"
            fill={activeRole === "admin" ? "url(#hexGradActive)" : "url(#hexGrad)"}
            stroke={activeRole === "admin" ? "#2563EB" : "#E2E8F0"}
            strokeWidth={activeRole === "admin" ? "2.5" : "1.5"}
          />
          <g transform="translate(26, 23)" stroke={activeRole === "admin" ? "#2563EB" : "#1E3A8A"} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="14" cy="14" r="4" fill="#EFF6FF" />
            <path d="M14 2 L14 5 M14 23 L14 26 M2 14 L5 14 M23 14 L26 14 M5.5 5.5 L7.5 7.5 M20.5 20.5 L22.5 22.5 M5.5 22.5 L7.5 20.5 M20.5 7.5 L22.5 5.5" />
          </g>
          <text
            x="40"
            y="96"
            textAnchor="middle"
            fill={activeRole === "admin" ? "#2563EB" : "#0F172A"}
            fontSize="13"
            fontWeight={activeRole === "admin" ? "800" : "700"}
            fontFamily="system-ui, sans-serif"
          >
            Admin
          </text>
        </g>
      </svg>
    </div>
  );
};

export default TrustDiagram;
