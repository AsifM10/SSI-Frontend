import "./SparklineChart.css";

const SparklineChart = ({ color, chartData, refreshKey, emptyText = "No sparkline data" }) => {
  const points = chartData && chartData.length > 0 ? chartData : [];

  if (points.length === 0) {
    return (
      <div className="sparkline-chart" style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "#aaa", fontSize: 12 }}>
        {emptyText}
      </div>
    );
  }

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;

  const path = points
    .map((point, index) => {
      const x = (index / (points.length - 1)) * 300;
      const y = 60 - ((point - min) / range) * 50 - 5;
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  return (
    <div className="sparkline-chart">
      <svg viewBox="0 0 300 60" preserveAspectRatio="none">
        <path
          key={refreshKey}
          d={path}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="sparkline-line"
        />
        <path d={`${path} L300 60 L0 60 Z`} fill={color} opacity="0.12" />
      </svg>
    </div>
  );
};

export default SparklineChart;
