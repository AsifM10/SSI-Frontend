import { Tooltip } from "antd";
import {
  ExclamationCircleFilled,
  CloseCircleFilled,
  DisconnectOutlined,
} from "@ant-design/icons";
import "./StatusIndicator.css";

const STATUS_META = {
  healthy: {
    label: "Healthy",
    tip: "All systems operating normally",
    color: "#22C55E",
  },
  warning: {
    label: "Warning",
    tip: "Some metrics are above normal levels",
    color: "#F59E0B",
    icon: ExclamationCircleFilled,
  },
  critical: {
    label: "Critical",
    tip: "Metrics are at dangerous levels",
    color: "#EF4444",
    icon: CloseCircleFilled,
  },
  offline: {
    label: "Offline",
    tip: "Machine is not reachable",
    color: "#94A3B8",
    icon: DisconnectOutlined,
  },
};

const normalizeStatus = (status) => {
  const s = String(status || "").toLowerCase().replace(/[\s-]/g, "");
  if (s === "healthy") return "healthy";
  if (s === "warning") return "warning";
  if (s === "critical") return "critical";
  if (s === "offline") return "offline";
  return null;
};

const StatusIndicator = ({ status }) => {
  const key = normalizeStatus(status);

  if (!key) {
    return (
      <Tooltip title="No Machines — No machines available" color="#64748B">
        <span className="status-indicator-none">—</span>
      </Tooltip>
    );
  }

  const meta = STATUS_META[key];

  if (key === "healthy") {
    return (
      <Tooltip title={`${meta.label} — ${meta.tip}`} color={meta.color}>
        <span className="status-indicator status-dot healthy" aria-label={meta.label} />
      </Tooltip>
    );
  }

  const Icon = meta.icon;

  return (
    <Tooltip title={`${meta.label} — ${meta.tip}`} color={meta.color}>
      <span className={`status-indicator ${key}`} aria-label={meta.label}>
        <Icon style={{ color: meta.color }} />
      </span>
    </Tooltip>
  );
};

export default StatusIndicator;