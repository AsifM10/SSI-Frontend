import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Avatar } from "antd";
import {
  UserOutlined,
  LogoutOutlined,
  SafetyCertificateOutlined,
  MoonOutlined,
  SunOutlined,
  DownOutlined,
  SearchOutlined,
  LockOutlined,
  MenuOutlined,
} from "@ant-design/icons";
import { useTheme } from "../../context/ThemeContext";
import ChangePasswordModal from "../../components/modals/ChangePasswordModal/ChangePasswordModal";
import NotificationBell from "../../components/NotificationBell/NotificationBell";
import "./Topbar.css";

const Topbar = ({ title, role, actions, breadcrumb, onOpenMobileMenu }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { dark, toggleTheme } = useTheme();

  const [profileOpen, setProfileOpen] = useState(false);
  const [profilePos, setProfilePos] = useState({ top: 0, right: 0 });
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifPos, setNotifPos] = useState({ top: 0, right: 0 });
  const [searchQuery, setSearchQuery] = useState("");
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  const profileBtnRef = useRef(null);
  const notifBtnRef = useRef(null);
  const profileDropdownRef = useRef(null);
  const notifDropdownRef = useRef(null);

  // Position calculation
  const updateProfilePos = () => {
    if (profileBtnRef.current) {
      const rect = profileBtnRef.current.getBoundingClientRect();
      setProfilePos({
        top: rect.bottom + 8,
        right: Math.max(16, window.innerWidth - rect.right),
      });
    }
  };

  const updateNotifPos = () => {
    if (notifBtnRef.current) {
      const rect = notifBtnRef.current.getBoundingClientRect();
      setNotifPos({
        top: rect.bottom + 8,
        right: Math.max(16, window.innerWidth - rect.right),
      });
    }
  };

  const toggleProfile = () => {
    if (!profileOpen) {
      updateProfilePos();
      setNotifOpen(false);
    }
    setProfileOpen((prev) => !prev);
  };

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      // Check profile dropdown
      if (profileOpen) {
        const isClickOnBtn = profileBtnRef.current && profileBtnRef.current.contains(e.target);
        const isClickInsideDropdown = profileDropdownRef.current && profileDropdownRef.current.contains(e.target);
        if (!isClickOnBtn && !isClickInsideDropdown) {
          setProfileOpen(false);
        }
      }

      // Check notification dropdown
      if (notifOpen) {
        const isClickOnNotifBtn = notifBtnRef.current && notifBtnRef.current.contains(e.target);
        const isClickInsideNotif = notifDropdownRef.current && notifDropdownRef.current.contains(e.target);
        if (!isClickOnNotifBtn && !isClickInsideNotif) {
          setNotifOpen(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [profileOpen, notifOpen]);

  // Keep dropdown aligned on resize/scroll
  useEffect(() => {
    const handleReposition = () => {
      if (profileOpen) updateProfilePos();
      if (notifOpen) updateNotifPos();
    };

    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);
    return () => {
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
    };
  }, [profileOpen, notifOpen]);

  const handleLogout = () => {
    setProfileOpen(false);
    navigate("/");
    logout();
  };

  const effectiveRole = role || user?.role || "issuer";
  const displayUsername = user?.username ? user.username.split("@")[0] : "Admin";

  const notifications = [
    { id: 1, title: "Ledger Synced", desc: "Block #148,290 verified on CDAC-SSI Ledger (9000)", time: "1 min ago" },
    { id: 2, title: "Peer Handshake", desc: "Holder did:example:holder1 connection active", time: "12 mins ago" },
    { id: 3, title: "Audit Check", desc: "Ed25519 cryptographic key verified", time: "1 hr ago" },
  ];

  return (
    <div className="topbar">
      {/* Title & Accent Rail */}
      <div className="topbar-title">
        {onOpenMobileMenu && (
          <button
            type="button"
            className="topbar-mobile-menu-btn"
            onClick={onOpenMobileMenu}
            aria-label="Open navigation menu"
            title="Open menu"
          >
            <MenuOutlined />
          </button>
        )}
        <span className="topbar-title-accent" />
        <div className="topbar-title-text">
          {breadcrumb && <div className="topbar-breadcrumb">{breadcrumb}</div>}
          <h1 title={title}>{title}</h1>
        </div>
      </div>

      {/* Global Search Bar */}
      <div className="topbar-search-container">
        <div className="topbar-search">
          <SearchOutlined className="search-icon" />
          <input
            type="text"
            placeholder="Search credentials, schemas, DIDs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <span className="search-shortcut">⌘K</span>
        </div>
      </div>

      {/* Right Actions */}
      <div className="topbar-actions">
        {actions && <div className="topbar-custom-actions">{actions}</div>}

        {/* Live Network Node Status Badge */}
        <a
          href="http://10.210.13.22:9000/"
          target="_blank"
          rel="noopener noreferrer"
          className="topbar-node-badge"
          title="CDAC-SSI Ledger (http://10.210.13.22:9000/) - Synced"
          style={{ textDecoration: "none" }}
        >
          <span className="node-pulse-dot" />
          <span className="node-label">CDAC-SSI Ledger: Synced</span>
        </a>

        {/* Dynamic Role Badge */}
        <span className="tag tag-primary topbar-role-tag">
          <SafetyCertificateOutlined />
          {effectiveRole}
        </span>

        {/* Theme Toggle Button */}
        <button
          className="topbar-icon-btn"
          onClick={toggleTheme}
          title={dark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {dark ? <SunOutlined /> : <MoonOutlined />}
        </button>

        {/* Notification Bell */}
        <NotificationBell />

        {/* Profile Button */}
        <div className="topbar-profile-wrapper" ref={profileBtnRef}>
          <button
            className="topbar-profile-btn"
            onClick={toggleProfile}
            type="button"
          >
            <Avatar
              size={34}
              icon={<UserOutlined />}
              style={{
                background: "var(--gradient-primary)",
                color: "#FFFFFF",
                boxShadow: "0 2px 8px rgba(79, 70, 229, 0.3)",
              }}
            />
            <span className="topbar-profile-name">{displayUsername}</span>
            <DownOutlined className="topbar-arrow" style={{ fontSize: 10 }} />
          </button>
        </div>
      </div>

      {/* Notifications Popover rendered via React Portal directly into body */}
      {notifOpen &&
        createPortal(
          <div
            ref={notifDropdownRef}
            className="topbar-dropdown topbar-dropdown--notif animate-in"
            style={{
              position: "fixed",
              top: notifPos.top,
              right: notifPos.right,
              zIndex: 999999,
            }}
          >
            <div className="dropdown-header">
              <strong>System Alerts</strong>
              <span className="tag tag-cyan" style={{ fontSize: 10, padding: "2px 8px" }}>
                Live
              </span>
            </div>
            <div className="notif-list">
              {notifications.map((n) => (
                <div key={n.id} className="notif-item">
                  <div className="notif-item-header">
                    <span className="notif-title">{n.title}</span>
                    <span className="notif-time">{n.time}</span>
                  </div>
                  <p className="notif-desc">{n.desc}</p>
                </div>
              ))}
            </div>
          </div>,
          document.body
        )}

      {/* Profile Popover rendered via React Portal directly into body */}
      {profileOpen &&
        createPortal(
          <div
            ref={profileDropdownRef}
            className="topbar-dropdown topbar-dropdown--profile animate-in"
            style={{
              position: "fixed",
              top: profilePos.top,
              right: profilePos.right,
              zIndex: 999999,
            }}
          >
            <div className="topbar-profile-head">
              <Avatar
                size={40}
                icon={<UserOutlined />}
                style={{ background: "var(--gradient-primary)", color: "#FFFFFF" }}
              />
              <div>
                <div className="profile-name-lg">{user?.username || "Admin"}</div>
                <div className="profile-role-sub">
                  Current Role: <strong>{user?.role || effectiveRole}</strong>
                </div>
              </div>
            </div>
            <div className="dropdown-divider" />
            <button
              className="topbar-dropdown-item"
              onClick={() => {
                setProfileOpen(false);
                navigate("/profile");
              }}
            >
              <UserOutlined /> My Profile
            </button>
            <button
              className="topbar-dropdown-item"
              onClick={() => {
                setProfileOpen(false);
                setChangePasswordOpen(true);
              }}
            >
              <LockOutlined /> Change Password
            </button>
            <button className="topbar-dropdown-item logout" onClick={handleLogout}>
              <LogoutOutlined /> Sign Out
            </button>
          </div>,
          document.body
        )}

      {/* Change Password Modal */}
      <ChangePasswordModal
        open={changePasswordOpen}
        onClose={() => setChangePasswordOpen(false)}
      />
    </div>
  );
};

export default Topbar;