import { useState, useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Avatar, Badge } from "antd";
import {
  BellOutlined,
  UserOutlined,
  DownOutlined,
  LogoutOutlined,
  SafetyCertificateOutlined,
  MoonOutlined,
  SunOutlined,
  CheckCircleOutlined,
  MailOutlined,
} from "@ant-design/icons";
import { selectUser, logout } from "../../store/slices/authSlice";
import { useTheme } from "../../context/ThemeContext";

import "./Topbar.css";

const Topbar = ({ title, actions, breadcrumb }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const { dark, toggleTheme } = useTheme();

  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profilePos, setProfilePos] = useState({ top: 0, right: 0 });
  const [notifPos, setNotifPos] = useState({ top: 0, right: 0 });
  const profileRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        profileRef.current && !profileRef.current.contains(e.target) &&
        !document.querySelector(".topbar-dropdown--profile")?.contains(e.target)
      ) {
        setProfileOpen(false);
      }
      if (
        notifRef.current && !notifRef.current.contains(e.target) &&
        !document.querySelector(".topbar-dropdown--notif")?.contains(e.target)
      ) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/");
  };

  const openDropdown = (which, btnRef, setPos) => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 10, right: window.innerWidth - rect.right });
    }
  };

  const notifications = [
    { id: 1, type: "success", text: "Machine health is stable", time: "2 min ago" },
    { id: 2, type: "warning", text: "CPU usage crossed 85% on server-01", time: "1 hr ago" },
    { id: 3, type: "info", text: "Weekly report is ready to download", time: "3 hrs ago" },
  ];

  return (
    <div className="topbar">
      <div className="topbar-title">
        <span className="topbar-title-accent" />
        <div className="topbar-title-text">
          {breadcrumb && <div className="topbar-breadcrumb">{breadcrumb}</div>}
          <h1>{title}</h1>
        </div>
      </div>

      <div className="topbar-actions">
        {actions}

        <button
          className="topbar-icon-btn"
          onClick={toggleTheme}
          title={dark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {dark ? <SunOutlined /> : <MoonOutlined />}
        </button>

        <div className="topbar-notif-wrapper" ref={notifRef}>
          <button
            className="topbar-icon-btn"
            onClick={() => {
              if (!notifOpen) openDropdown("notif", notifRef, setNotifPos);
              setNotifOpen(!notifOpen);
            }}
            title="Notifications"
          >
            <Badge dot={notifications.length > 0} offset={[-4, 4]}>
              <BellOutlined />
            </Badge>
          </button>
        </div>

        <div className="topbar-profile-wrapper" ref={profileRef}>
          <button
            className="topbar-profile-btn"
            onClick={() => {
              if (!profileOpen) openDropdown("profile", profileRef, setProfilePos);
              setProfileOpen(!profileOpen);
            }}
          >
            <Avatar
              size={34}
              icon={<UserOutlined />}
              className="topbar-avatar"
            />
            <span className="topbar-profile-name">{user?.email?.split("@")[0] || "Admin"}</span>
            <DownOutlined className="topbar-arrow" />
          </button>
        </div>
      </div>

      {notifOpen && (
        <div
          className="topbar-dropdown topbar-dropdown--notif"
          style={{ position: "fixed", top: notifPos.top, right: notifPos.right }}
        >
          <div className="topbar-dropdown-head">
            <strong>Notifications</strong>
            <span className="topbar-dropdown-count">{notifications.length}</span>
          </div>
          <div className="topbar-notif-list">
            {notifications.map((n) => (
              <div key={n.id} className="topbar-notif-item">
                <div className={`topbar-notif-icon ${n.type}`}>
                  {n.type === "success" ? <CheckCircleOutlined /> : <MailOutlined />}
                </div>
                <div className="topbar-notif-content">
                  <p>{n.text}</p>
                  <span>{n.time}</span>
                </div>
              </div>
            ))}
          </div>
          <button className="topbar-dropdown-footer" onClick={() => navigate("/alerts")}>
            View all alerts
          </button>
        </div>
      )}

      {profileOpen && (
        <div
          className="topbar-dropdown topbar-dropdown--profile"
          style={{ position: "fixed", top: profilePos.top, right: profilePos.right }}
        >
          <div className="topbar-profile-head">
            <Avatar size={42} icon={<UserOutlined />} className="topbar-profile-avatar" />
            <div className="topbar-profile-info">
              <div className="topbar-profile-name-lg">{user?.email?.split("@")[0] || "User"}</div>
              <div className="topbar-profile-email">{user?.email}</div>
            </div>
          </div>
          <div className="topbar-profile-role">
            <SafetyCertificateOutlined /> {user?.role}
          </div>
          <div className="topbar-dropdown-divider" />
          <button className="topbar-dropdown-item" onClick={() => navigate("/user-profile")}>
            <UserOutlined /> View Profile
          </button>
          <div className="topbar-dropdown-divider" />
          <button className="topbar-dropdown-item logout" onClick={handleLogout}>
            <LogoutOutlined /> Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default Topbar;