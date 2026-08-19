import { motion } from "framer-motion";

import "./GaugeChart.css";

const GaugeChart = ({ value, color, label }) => {
  const radius = 70;

  const circumference = Math.PI * radius;

  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <div className="gauge-chart">
      <svg viewBox="0 0 180 110" className="gauge-svg">
        {/* BG */}

        <path
          className="gauge-bg"
          d="
      M 30 90
      A 60 60 0 0 1 150 90
    "
          fill="none"
          strokeWidth="10"
          strokeLinecap="round"
        />

        {/* PROGRESS */}

        <motion.path
          d="
      M 30 90
      A 60 60 0 0 1 150 90
    "
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={188.5}
          initial={{
            strokeDashoffset: 188.5,
          }}
          animate={{
            strokeDashoffset: 188.5 - (value / 100) * 188.5,
          }}
          transition={{
            duration: 1,
            ease: "easeOut",
          }}
        />
      </svg>

      {/* CENTER CONTENT */}

      <div className="gauge-center">
        <h2>{value}%</h2>

        <p>{label}</p>
      </div>
    </div>
  );
};

export default GaugeChart;
