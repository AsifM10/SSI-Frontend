import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  SafetyCertificateOutlined,
  CalendarOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";

import { message } from "antd";

import api from "../../services/api";
import MainLayout from "../../layouts/MainLayout/MainLayout";
import "./DepartmentViewer.css";

const DepartmentViewerView = () => {

  const navigate = useNavigate();
  const { state } = useLocation();
  const userId = state?.userId;

  const [viewer, setViewer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      message.error("No user ID provided");
      navigate(-1);
      return;
    }
    fetchViewer();
  }, [userId]);

  const fetchViewer = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/users/${userId}`);
      if (response.data.success) {
        setViewer(response.data.data);
      }
    } catch {
      message.error("Failed to fetch user details");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <MainLayout title="Viewer Details">
        <div className="register-viewer-page">
          <div className="loading">Loading...</div>
        </div>
      </MainLayout>
    );
  }

  if (!viewer) {
    return (
      <MainLayout title="Viewer Details">
        <div className="register-viewer-page">
          <div className="loading">User not found</div>
        </div>
      </MainLayout>
    );
  }

  return (

    <MainLayout title="Viewer Details">

      <div className="detail-page">

        <button
          className="back-btn"
          onClick={() => navigate(-1)}
        >
          <ArrowLeftOutlined />
          Back
        </button>

        <div className="detail-card">

          <h2>Department Viewer Details</h2>

          <div className="detail-body">

          <div className="detail-row">
            <div className="detail-icon"><UserOutlined /></div>
            <div className="detail-content">
              <div className="detail-label">Name</div>
              <div className="detail-value">{viewer.personName || ""}</div>
            </div>
          </div>

          <div className="detail-row">
            <div className="detail-icon"><MailOutlined /></div>
            <div className="detail-content">
              <div className="detail-label">Email</div>
              <div className="detail-value">{viewer.email || ""}</div>
            </div>
          </div>

          <div className="detail-row">
            <div className="detail-icon"><PhoneOutlined /></div>
            <div className="detail-content">
              <div className="detail-label">Phone</div>
              <div className="detail-value">{viewer.phoneNo || ""}</div>
            </div>
          </div>

          <div className="detail-row">
            <div className="detail-icon"><UserOutlined /></div>
            <div className="detail-content">
              <div className="detail-label">Designation</div>
              <div className="detail-value">{viewer.designation || ""}</div>
            </div>
          </div>

          <div className="detail-row">
            <div className="detail-icon"><SafetyCertificateOutlined /></div>
            <div className="detail-content">
              <div className="detail-label">Role</div>
              <div className="detail-value">{viewer.role || ""}</div>
            </div>
          </div>

          <div className="detail-row">
            <div className="detail-icon"><CalendarOutlined /></div>
            <div className="detail-content">
              <div className="detail-label">Created</div>
              <div className="detail-value">{viewer.createdDate || ""}</div>
            </div>
          </div>

          <div className="detail-row">
            <div className="detail-icon"><CalendarOutlined /></div>
            <div className="detail-content">
              <div className="detail-label">Updated</div>
              <div className="detail-value">{viewer.updatedDate || ""}</div>
            </div>
          </div>

          </div>

      </div>

      </div>

    </MainLayout>

  );

};

export default DepartmentViewerView;
