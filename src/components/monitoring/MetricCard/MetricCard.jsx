import "./MetricCard.css";
import GaugeChart from "../GaugeChart/GaugeChart";
import SparklineChart from "../SparklineChart/SparklineChart";

const MetricCard = ({
  refreshKey,
  title,
  icon,
  color,
  value,
  label,
  min,
  avg,
  max,
  sparklineData,
  unit = "%",
  maxValue,
  emptyText,
}) => {
  const gaugePercent =
    maxValue && maxValue > 0 ? Math.min(100, (value / maxValue) * 100) : value;
  const gaugeDisplay = maxValue && maxValue > 0 ? `${value}` : `${value}%`;

  return (
    <div className="metric-card" style={{ '--card-accent': `linear-gradient(135deg, ${color}, ${color}dd)` }}>
      {/* HEADER */}

      <div className="metric-card-header">
        <div
          className="metric-icon"
          style={{
            background: `${color}15`,
            color: color,
          }}
        >
          {icon}
        </div>

        <h3>{title}</h3>
      </div>

      {/* GAUGE */}
      <GaugeChart value={gaugePercent} color={color} label={label} refreshKey={refreshKey} display={gaugeDisplay} />
      {/* GRAPH */}

      <SparklineChart color={color} refreshKey={refreshKey} chartData={sparklineData} emptyText={emptyText} />
      {/* STATS */}

      <div className="metric-stats">
        <div>
          <span>Min</span>

          <strong key={`min-${refreshKey}`}>{min}</strong>
        </div>

        <div>
          <span>Avg</span>

          <strong key={`avg-${refreshKey}`}>{avg}</strong>
        </div>

        <div>
          <span>Max</span>

          <strong key={`max-${refreshKey}`}>{max}</strong>
        </div>
      </div>
    </div>
  );
};

export default MetricCard;
