import { useLocation, useNavigate } from "react-router-dom";
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  SafetyCertificateOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";

import MainLayout from "../../layouts/MainLayout/MainLayout";
import "../DepartmentViewer/DepartmentViewer.css";

const DepartmentAdminView = () => {

  const navigate = useNavigate();

  const { state } = useLocation();

  const admin = state || {};

  return (

    <MainLayout title="Admin Details">

      <div className="detail-page">

        <button
          className="back-btn"
          onClick={() => navigate(-1)}
        >
          <ArrowLeftOutlined />
          Back
        </button>

        <div className="detail-card">

          <h2>Department Admin Details</h2>

          <div className="detail-body">

          <div className="detail-row">
            <div className="detail-icon"><UserOutlined /></div>
            <div className="detail-content">
              <div className="detail-label">Name</div>
              <div className="detail-value">{admin.personName || ""}</div>
            </div>
          </div>

          <div className="detail-row">
            <div className="detail-icon"><MailOutlined /></div>
            <div className="detail-content">
              <div className="detail-label">Email</div>
              <div className="detail-value">{admin.email || ""}</div>
            </div>
          </div>

          <div className="detail-row">
            <div className="detail-icon"><PhoneOutlined /></div>
            <div className="detail-content">
              <div className="detail-label">Phone</div>
              <div className="detail-value">{admin.phoneNo || ""}</div>
            </div>
          </div>

          <div className="detail-row">
            <div className="detail-icon"><UserOutlined /></div>
            <div className="detail-content">
              <div className="detail-label">Department</div>
              <div className="detail-value">{admin.deptName || ""}</div>
            </div>
          </div>

          <div className="detail-row">
            <div className="detail-icon"><SafetyCertificateOutlined /></div>
            <div className="detail-content">
              <div className="detail-label">Role</div>
              <div className="detail-value">{admin.role || ""}</div>
            </div>
          </div>

          </div>

      </div>

      </div>

    </MainLayout>

  );

};

export default DepartmentAdminView;
