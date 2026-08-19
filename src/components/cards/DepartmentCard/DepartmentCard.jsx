import { useNavigate } from "react-router-dom";
import {
  AppstoreOutlined,
  DesktopOutlined,
  AlertOutlined,
  LineChartOutlined,
  ArrowRightOutlined,
  RobotFilled,
} from "@ant-design/icons";

import "./DepartmentCard.css";

const DepartmentCard = ({
  icon,
  title,
  projects,
  machines,
  alerts,
  status,
}) => {
  const navigate = useNavigate();
  return (
    <div className="department-card">
      <div className="department-card-header">
        <div className="department-card-icon">{icon}</div>

        <div>
          <h2>{title}</h2>
        </div>
      </div>

      <div className="department-card-body">
        <div className="department-row">
          <div className="department-row-left">
            <AppstoreOutlined />
            <span>Projects</span>
          </div>

          <strong>{projects}</strong>
        </div>

        <div className="department-row">
          <div className="department-row-left">
            <DesktopOutlined />
            <span>Machines</span>
          </div>

          <strong>{machines}</strong>
        </div>

        <div className="department-row">
          <div className="department-row-left">
            <AlertOutlined />
            <span>Active alerts</span>
          </div>

          <strong>{alerts}</strong>
        </div>

        <div className="department-row">
          <div className="department-row-left">
            <LineChartOutlined />
            <span>Overall status</span>
          </div>

          <div
            className={`status-badge ${
              status === "Critical"
                ? "critical"
                : status === "Warning"
                  ? "warning"
                  : "healthy"
            }`}
          >
            {status}
          </div>
        </div>
      </div>

      <div className="department-card-footer">
        <button onClick={() => navigate(`/departments/${title}`)}>
          View department
          <ArrowRightOutlined />
        </button>
      </div>
    </div>
  );
};

export default DepartmentCard;
