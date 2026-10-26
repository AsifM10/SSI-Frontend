import { useEffect, useRef, useState } from "react";
import "./StatCard.css";

const StatCard = ({ title, value, label, sub, accent }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const animated = useRef(false);
  const rafRef = useRef(null);

  useEffect(() => {
    const target = Number(value) || 0;
    if (animated.current) {
      setDisplayValue(target);
      return;
    }

    const duration = 900;
    const start = performance.now();
    animated.current = true;

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(target * eased));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        animated.current = false;
      }
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(rafRef.current);
  }, [value]);

  return (
    <div
      className="stat-card"
      style={{
        "--stat-bg": accent?.bg,
        "--stat-color": accent?.color,
        "--stat-grad": accent?.grad,
      }}
    >
      <span className="stat-card-shine" />
      <div className="stat-card-icon">
        {accent?.icon}
      </div>
      <div className="stat-card-content">
        <span className="stat-card-title">{title}</span>
        <strong className="stat-card-value">{displayValue}</strong>
        {label && <span className="stat-card-label">{label}</span>}
        {sub}
      </div>
    </div>
  );
};

export default StatCard;
