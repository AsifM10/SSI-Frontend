import { LoadingOutlined } from "@ant-design/icons";
import { FiActivity } from "react-icons/fi";

import "./MetricState.css";

const MetricState = ({ loading, message, icon }) => {
  if (loading) {
    return (
      <div className="metric-state metric-state-loading">
        <LoadingOutlined className="metric-state-spinner" />
        <h3>Loading data...</h3>
        <p>Fetching the latest metrics for this machine.</p>
      </div>
    );
  }

  return (
    <div className="metric-state metric-state-empty">
      {icon || <FiActivity />}
      <h3>{message}</h3>
      <p>This machine doesn't have any monitoring data for this metric yet.</p>
    </div>
  );
};

export default MetricState;