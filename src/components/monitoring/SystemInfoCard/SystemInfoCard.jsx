import {
  ClockCircleOutlined,
  GlobalOutlined,
  DesktopOutlined,
  SyncOutlined,
  HddOutlined,
  FieldTimeOutlined,
} from "@ant-design/icons";

import "./SystemInfoCard.css";

const SystemInfoCard = ({ systemInfo }) => {
  return (
    <div className="system-info-card">
      {/* HEADER */}

      <div className="system-info-header">
        <span className="system-pulse">↯</span>

        <h3>System Information</h3>
      </div>

      {/* GRID */}

      <div className="system-grid">
        {/* UPTIME */}

        <div className="system-item">
          <span className="system-label">
            <ClockCircleOutlined className="system-icon" />
            Uptime
          </span>

         <strong>{systemInfo?.uptime || "-"}</strong>
        </div>

        {/* IP */}

        <div className="system-item">
          <span className="system-label">
            <GlobalOutlined className="system-icon" />
            IP Address
          </span>

          <strong>{systemInfo?.ipAddress || "-"}</strong>
        </div>

        {/* OS */}

        <div className="system-item">
          <span className="system-label">
            <DesktopOutlined className="system-icon" />
            OS
          </span>

         <strong>{systemInfo?.osType || "-"}</strong>
        </div>

        {/* LAST UPDATED */}

        <div className="system-item">
          <span className="system-label">
            <SyncOutlined className="system-icon" />
            Last Updated
          </span>

          <strong className="live-status">
  {systemInfo?.lastUpdated || "-"}
  <span className="live-dot"></span>
</strong>
        </div>

        {/* HOSTNAME */}

        <div className="system-item">
          <span className="system-label">
            <HddOutlined className="system-icon" />
            Hostname
          </span>

          <strong>{systemInfo?.hostname || "-"}</strong>
        </div>

        {/* STATUS */}

        <div className="system-item">
          <span className="system-label">
            <FieldTimeOutlined className="system-icon" />
            Status
          </span>

          <div className="status-pill">
  {systemInfo?.status || "Unknown"}
</div>
        </div>
      </div>

      {/* FOOTER */}

      <p className="system-footer">
        All times are shown in your local timezone ⓘ
      </p>
    </div>
  );
};

export default SystemInfoCard;
