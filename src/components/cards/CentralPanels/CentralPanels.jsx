import {
  SafetyOutlined,
  ClockCircleOutlined,
  BulbOutlined,
  ThunderboltFilled,
  CheckOutlined,
  EllipsisOutlined,
  WarningOutlined,
  ExclamationCircleFilled,
} from "@ant-design/icons";
import "./CentralPanels.css";

const LeafIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
  </svg>
);

const TreeIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 20c0-1.8.4-3.4 1.4-4.8M11 20V6c-2 0-4 1-4 3-2 0-3 1-3 3 0 2 1 3 3 3M11 20h2M13 8c0-2 2-3 4-3 1 0 2 .6 2 1.6V11h-3M15 13h3" />
  </svg>
);

const ProgressHalo = ({ value }) => (
  <svg className="panel-halo" viewBox="0 0 120 120">
    <circle cx="60" cy="60" r="52" fill="none" stroke="#F3F4F6" strokeWidth="11" />
    <circle
      cx="60"
      cy="60"
      r="59"
      fill="none"
      stroke="#10B981"
      strokeWidth="9"
      strokeLinecap="round"
      strokeDasharray={`${(value / 100) * 351.9} 351.9`}
      transform="rotate(-90 60 60)"
      className="panel-halo-arc"
    />
  </svg>
);

const SegmentedArc = () => {
  const segments = [];
  const total = 120;
  const gap = 5;
  const len = 62;
  for (let i = 0; i < 4; i++) {
    const color = i < 3 ? "#10B981" : "#E5E7EB";
    segments.push(
      <circle
        key={i}
        cx="60"
        cy="60"
        r="59"
        fill="none"
        stroke={color}
        strokeWidth="11"
        strokeLinecap="butt"
        strokeDasharray={`${len} ${total - len + gap}`}
        transform={`rotate(${16 + i * 68} 60 60)`}
      />
    );
  }
  return <svg className="panel-halo" viewBox="0 0 120 120">{segments}</svg>;
};

const PanelHeader = ({ icon, title }) => (
  <div className="panel-header">
    <div className="panel-header-left">
      <span className="panel-header-icon">{icon}</span>
      <h3>{title}</h3>
    </div>
    <button className="panel-menu-btn" title="More options"><EllipsisOutlined /></button>
  </div>
);

const InfrastructureHealth = () => {
  const subStats = [
    { label: "Machines Online", value: 18, kind: "green", check: true },
    { label: "Warnings", value: 4, kind: "yellow", warning: true },
    { label: "Critical Alerts", value: 0, kind: "red", critical: true },
    { label: "Last Updated", value: "8s ago", kind: "blue", clock: true },
  ];

  return (
    <div className="central-panel">
      <PanelHeader
        icon={<SafetyOutlined />}
        title="Infrastructure Health"
      />

      <div className="infra-main">
        <div className="infra-gauge">
          <ProgressHalo value={96} />
          <div className="infra-gauge-center">
            <strong>96%</strong>
            <span>Healthy</span>
          </div>
        </div>
        <p className="infra-desc">
          Your infrastructure is in great shape. All critical systems are running smoothly.
        </p>
      </div>

      <div className="infra-stats">
        {subStats.map((s) => (
          <div className="infra-stat" key={s.label}>
            <span className={`infra-dot infra-dot-${s.kind}`}>
              {s.check ? <CheckOutlined className="infra-check" />
                : s.warning ? <WarningOutlined className="infra-warn" />
                  : s.critical ? <ExclamationCircleFilled className="infra-crit" />
                    : s.clock ? <ClockCircleOutlined className="infra-clock" /> : null}
            </span>
            <div>
              <strong>{s.value}</strong>
              <span>{s.label}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const PowerConsumption = () => {
  const subStats = [
    { label: "Avg Today", value: "28.1 w" },
    { label: "Peak Today", value: "40.6 w" },
    { label: "Monthly Est.", value: "18.4 kWh" },
  ];

  return (
    <div className="central-panel">
      <PanelHeader
        icon={<span className="panel-icon-bolt"><ThunderboltFilled /></span>}
        title="Power Consumption"
      />

      <div className="power-gauge-wrap">
        <svg className="power-gauge" viewBox="0 0 160 100">
          <path
  d="M 20 80 A 58 58 0 0 1 140 80"
  fill="none"
  stroke="#E5E7EB"
  strokeWidth="7"
  strokeLinecap="butt"
  strokeDasharray="2 2"
/>

<path
  d="M 20 80 A 58 58 0 0 1 140 80"
  fill="none"
  stroke="#3B82F6"
  strokeWidth="7"
  strokeLinecap="butt"
  strokeDasharray="2 2"
  strokeDashoffset="0"
  
  style={{
    clipPath: "inset(0 79% 0 0)"
  }}
/>
        </svg>

        <div className="power-gauge-center">
          <span className="power-bolt"><ThunderboltFilled /></span>
          <strong>32.4 <small>w</small></strong>
          <span>Live Average</span>
          <span className="power-badge"><LeafIcon size={12} /> Efficient</span>
        </div>
      </div>

      <div className="power-substats">
        {subStats.map((s) => (
          <div className="power-substat" key={s.label}>
            <strong>{s.value}</strong>
            <span>{s.label}</span>
          </div>
        ))}
      </div>

      <div className="panel-insight panel-insight-blue">
        <span className="panel-insight-icon"><BulbOutlined /></span>
        <div>
          <strong>12% lower than yesterday</strong>
          <p>Cooling and compute loads are trending down this period.</p>
        </div>
      </div>
    </div>
  );
};

const CarbonFootprint = () => {
  const subStats = [
    { label: "Yesterday", value: "0.008 kg" },
    { label: "This Month", value: "1.84 kg" },
    { label: "Monthly Target", value: "< 2 kg" },
  ];

  return (
    <div className="central-panel">
      <PanelHeader
        icon={<span className="panel-icon-leaf"><LeafIcon size={15} /></span>}
        title="Carbon Footprint"
      />

      <div className="carbon-gauge-wrap">
        <div className="carbon-gauge-holder">
          <SegmentedArc />
          <div className="carbon-gauge-center">
            <span className="carbon-leaf"><LeafIcon size={22} /></span>
            <strong>0.006 <small>kg</small></strong>
            <span>CO₂ Today</span>
            <span className="carbon-score">
              <span className="carbon-score-letter">A+</span> Eco Score
            </span>
          </div>
        </div>
      </div>

      <div className="carbon-substats">
        {subStats.map((s) => (
          <div className="carbon-substat" key={s.label}>
            <strong>{s.value}</strong>
            <span>{s.label}</span>
          </div>
        ))}
      </div>

      <div className="panel-insight panel-insight-green">
        <span className="panel-insight-icon"><TreeIcon size={18} /></span>
        <div>
          <strong>Below monthly target</strong>
          <p>Current usage is well within the sustainability budget.</p>
        </div>
      </div>
    </div>
  );
};

const CentralPanels = () => {
  return (
    <div className="central-panels-grid">
      <InfrastructureHealth />
      <PowerConsumption />
      <CarbonFootprint />
    </div>
  );
};

export default CentralPanels;