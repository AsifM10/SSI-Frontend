import { ResponsiveContainer, AreaChart, Area, Tooltip } from "recharts";
import { motion } from "framer-motion";

import "./SparklineChart.css";

const SparklineChart = ({ color }) => {
  const data = [
    { value: 20 },
    { value: 30 },
    { value: 22 },
    { value: 40 },
    { value: 28 },
    { value: 35 },
    { value: 25 },
    { value: 45 },
    { value: 32 },
    { value: 38 },
  ];

  return (
    <motion.div
      className="sparkline-wrapper"
      initial={{ opacity: 0, scaleY: 0.8 }}
      animate={{ opacity: 1, scaleY: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <ResponsiveContainer width="100%" height={70}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Tooltip
            contentStyle={{
              background: "var(--card-bg)",
              border: "1px solid var(--border-color)",
              borderRadius: 8,
              fontSize: 12,
              color: "var(--text-primary)",
            }}
            formatter={(v) => [`${v}%`, "Usage"]}
            labelStyle={{ display: "none" }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            fill={`url(#grad-${color})`}
            strokeWidth={2}
            animationDuration={800}
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
};

export default SparklineChart;
