import "./GaugeChart.css";

const GaugeChart = ({ value, color, label, refreshKey, display }) => {
  const radius = 58;

  const circumference = Math.PI * radius;

  const progress = circumference - (value / 100) * circumference;

  return (
    <div className="gauge-chart">
      <svg viewBox="0 0 160 100" className="gauge-svg">
        <path
          d="M 20 80 A 58 58 0 0 1 140 80"
          fill="none"
          stroke="#dfe7f3"
          strokeWidth="12"
          strokeLinecap="round"
        />

        <path
          d="M 20 80 A 58 58 0 0 1 140 80"
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={progress}
          className="gauge-progress-path"
        />
      </svg>

      <div className="gauge-content">
        <h2 key={refreshKey}>{display ?? `${value}%`}</h2>

        <p>{label}</p>
      </div>
    </div>
  );
};

export default GaugeChart;
