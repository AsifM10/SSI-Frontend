import {
  WarningFilled,
  ExclamationCircleFilled,
  InfoCircleFilled,
} from "@ant-design/icons";
import { Link } from "react-router-dom";
import MainLayout from "../../layouts/MainLayout/MainLayout";

import "./Alerts.css";

const alertIcons = {
  critical: <WarningFilled />,
  warning: <ExclamationCircleFilled />,
  info: <InfoCircleFilled />,
};

const Alerts = () => {
  const alerts = [
    {
      title: "ML Trainer — GPU above 90% for 12 minutes",

      description: "Triggered by threshold rule: gpu.usage > 90%",

      time: "2 min ago",

      type: "critical",
    },

    {
      title: "ML Trainer — Memory above 75%",

      description: "Sustained pressure on ml-train-01",

      time: "8 min ago",

      type: "critical",
    },

    {
      title: "Vision Inference — CPU sustained at 71%",

      description: "Above warning threshold on vision-gpu-01",

      time: "14 min ago",

      type: "warning",
    },

    {
      title: "Hyperledger Fabric — Storage approaching 75%",

      description: "Disk /var/hyperledger growing at 1.2 GB/hr",

      time: "1 h ago",

      type: "warning",
    },

    {
      title: "IPFS — Agent updated to v1.3.2",

      description: "Auto-update completed successfully",

      time: "3 h ago",

      type: "info",
    },

    {
      title: "AI Cluster — Backup completed",

      description: "Nightly snapshot completed successfully",

      time: "7 h ago",

      type: "info",
    },
  ];

  return (
    <MainLayout
      title="Alerts"
      breadcrumb={
        <>
          <Link to="/dashboard" className="bc-link">Dashboard</Link>
          <span className="bc-sep">›</span>
          <span className="bc-current">Alerts</span>
        </>
      }
    >
      <div className="alerts-page">
        {/* ALERTS LIST */}

        <div className="alerts-list">
          {alerts.map((alert, index) => (
            <div key={index} className={`alert-card ${alert.type} animate-in`} style={{ animationDelay: `${index * 0.08}s` }}>
              <div className="alert-bar"></div>

              <div className="alert-type-icon">
                {alertIcons[alert.type]}
              </div>

              {/* CONTENT */}

              <div className="alert-content">
                <h3>{alert.title}</h3>

                <p>{alert.description}</p>
              </div>

              {/* RIGHT */}

              <div className="alert-right">
                <span className="alert-time">{alert.time}</span>

                <div className={`alert-badge ${alert.type}`}>
                  {alert.type.toUpperCase()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </MainLayout>
  );
};

export default Alerts;
