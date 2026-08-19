import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { selectUser } from "../../store/slices/authSlice";
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  SafetyCertificateOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

import api from "../../services/api";
import MainLayout from "../../layouts/MainLayout/MainLayout";

import "./UserProfile.css";

const UserProfile = () => {
  const navigate = useNavigate();
  const authUser = useSelector(selectUser) || {};
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/api/users/me").then((res) => {
      if (res.data.success) setProfile(res.data.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const user = profile || authUser;

  return (
    <MainLayout title="My Profile" showTopbar={false}>
      <div className="user-profile-page">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeftOutlined />
          Back
        </button>

        <div className="profile-card">
          <div className="profile-top">
            <div className="profile-avatar">
              <UserOutlined />
            </div>
            <div>
              <h2>{loading ? "..." : user?.personName}</h2>
              <p>{loading ? "" : user?.designation}</p>
            </div>
          </div>

          <div className="profile-details">
            <div className="profile-row">
              <div className="profile-label">
                <MailOutlined />
                <span>Email</span>
              </div>
              <strong>{user?.email}</strong>
            </div>

            <div className="profile-row">
              <div className="profile-label">
                <PhoneOutlined />
                <span>Phone</span>
              </div>
              <strong>{user?.phoneNo || "\u2014"}</strong>
            </div>

            <div className="profile-row">
              <div className="profile-label">
                <SafetyCertificateOutlined />
                <span>Role</span>
              </div>
              <div className="role-badge">{user?.role}</div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default UserProfile;
