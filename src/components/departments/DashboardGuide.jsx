import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LineChartOutlined,
  DatabaseOutlined,
  SafetyCertificateOutlined,
  FileTextOutlined,
  BellOutlined,
  TeamOutlined,
  DesktopOutlined,
  RocketOutlined,
  ArrowRightOutlined,
  ArrowLeftOutlined,
  CheckCircleFilled,
  RightOutlined,
  BankOutlined,
  AppstoreOutlined,
} from "@ant-design/icons";
import {
  FiCpu,
  FiHardDrive,
  FiZap,
} from "react-icons/fi";
import { LuLeaf } from "react-icons/lu";
import { useSelector } from "react-redux";
import { selectUser } from "../../store/slices/authSlice";
import "./DashboardGuide.css";

const metricSlides = [
  {
    icon: <FiCpu />,
    title: "CPU Monitoring",
    tag: "Compute",
    gradient: "linear-gradient(135deg, #2F5D9F, #5FA8A7)",
    description:
      "Track processor load in real time across every machine. See current, average, minimum and maximum utilisation plus the sparkline trend for any time window.",
    points: ["Live utilisation %", "Used / total cores", "Min · Avg · Max", "Trend sparklines"],
  },
  {
    icon: <FiCpu />,
    title: "GPU Monitoring",
    tag: "Accelerator",
    gradient: "linear-gradient(135deg, #5FA8A7, #8DD3C7)",
    description:
      "Monitor graphics and compute accelerator usage for ML and rendering workloads. Instantly know when a GPU is saturated or sitting idle.",
    points: ["GPU utilisation %", "Used / total GPUs", "Idle detection", "Workload spikes"],
  },
  {
    icon: <DatabaseOutlined />,
    title: "Memory Monitoring",
    tag: "RAM",
    gradient: "linear-gradient(135deg, #1D3D6E, #2F5D9F)",
    description:
      "Keep an eye on RAM consumption to catch memory pressure before it slows the whole machine down. Visualise usage per machine over any range.",
    points: ["Memory usage %", "Used / total GB", "Peak consumption", "Capacity planning"],
  },
  {
    icon: <FiHardDrive />,
    title: "Storage Monitoring",
    tag: "Disk",
    gradient: "linear-gradient(135deg, #DD6B20, #F6AD55)",
    description:
      "Monitor disk partitions and free space to avoid running out of storage. See usage breakdowns and health status for every volume.",
    points: ["Partition usage", "Used / total GB", "Health status", "Free space alerts"],
  },
  {
    icon: <FiZap />,
    title: "Power Monitoring",
    tag: "Energy",
    gradient: "linear-gradient(135deg, #E53E5E, #DD6B20)",
    description:
      "Measure the energy each machine consumes in watts. Understand live draw, daily averages, peaks and monthly energy estimates to optimise the data centre.",
    points: ["Live wattage", "Avg today / peak", "Monthly kWh estimate", "Efficiency insights"],
  },
  {
    icon: <LuLeaf />,
    title: "Carbon Footprint",
    tag: "Sustainability",
    gradient: "linear-gradient(135deg, #38A169, #68D391)",
    description:
      "Translate energy consumption into CO₂ emissions. Track daily and monthly emissions against targets and earn an eco score for your department.",
    points: ["CO₂ today", "kg emitted / month", "Eco score rating", "Sustainability targets"],
  },
];

const roleData = {
  CENTRAL_ADMIN: {
    heroTitle: "You run the whole organisation",
    heroText:
      "You have full control of the platform — create departments, approve department admins and monitor every machine across the organisation, with reporting for any scope.",
    accessShort: "Admin",
    accessSpan: "Full Control",
    ctaTitle: "Ready to see your infrastructure live?",
    ctaText: "Jump into the departments view and open any project to start monitoring.",
    ctaButton: "Open Departments",
    features: [
      {
        icon: <BankOutlined />,
        title: "Manage Departments",
        description: "Create and delete departments to keep the organisational structure up to date.",
      },
      {
        icon: <SafetyCertificateOutlined />,
        title: "Approve Dept Admins",
        description: "Approve, reject or delete department admin accounts before they get access.",
      },
      {
        icon: <DesktopOutlined />,
        title: "Global Machine Overview",
        description: "Browse every department's projects and machines with live metrics at a glance.",
      },
      {
        icon: <LineChartOutlined />,
        title: "Deep-Dive Charts",
        description: "Open any machine's dedicated charts across CPU, GPU, memory, storage, power and carbon.",
      },
      {
        icon: <FileTextOutlined />,
        title: "Reports for Any Scope",
        description: "Generate daily, weekly, monthly or yearly PDF reports for departments, projects or machines.",
      },
      {
        icon: <BellOutlined />,
        title: "Alerts & Notifications",
        description: "Get notified about critical thresholds across the whole estate so you can act early.",
      },
    ],
    steps: [
      { icon: <SafetyCertificateOutlined />, title: "Sign In", text: "Log in with your central admin credentials." },
      { icon: <BankOutlined />, title: "Explore Departments", text: "Browse the full department list and drill into any of them." },
      { icon: <TeamOutlined />, title: "Approve & Manage", text: "Approve new department admins and create departments as needed." },
      { icon: <FileTextOutlined />, title: "Report & Act", text: "Export PDF reports for any scope and respond to alerts." },
    ],
  },
  CENTRAL_VIEWER: {
    heroTitle: "Read-Only Role",
    heroText:
      "View-only access — no changes to machines or users. You can see everything across the organisation — browse every department and open any machine's live monitoring, without making changes.",
    accessShort: "View",
    accessSpan: "Read Only",
    ctaTitle: "Ready to see your infrastructure live?",
    ctaText: "Jump into the departments view and open any project to start monitoring.",
    ctaButton: "Open Departments",
    features: [
      {
        icon: <DesktopOutlined />,
        title: "Global Read Access",
        description: "View every department's projects, machines and live metrics — read-only.",
      },
      {
        icon: <LineChartOutlined />,
        title: "Deep-Dive Charts",
        description: "Open any machine's dedicated charts across all six monitoring dimensions.",
      },
      {
        icon: <DatabaseOutlined />,
        title: "Department & Project Structure",
        description: "Browse the full Department → Project → Machine hierarchy.",
      },
      {
        icon: <SafetyCertificateOutlined />,
        title: "Machine Health Overview",
        description: "See overall machine health and status at a glance across the whole estate.",
      },
      {
        icon: <BellOutlined />,
        title: "Alerts & Notifications",
        description: "See critical threshold alerts and stay informed across the organisation.",
      },
      {
        icon: <LineChartOutlined />,
        title: "Live At-a-Glance Insight",
        description: "Quickly identify busy, idle or unhealthy machines from the overview views.",
      },
    ],
    steps: [
      { icon: <SafetyCertificateOutlined />, title: "Sign In", text: "Log in with your central viewer credentials." },
      { icon: <TeamOutlined />, title: "Explore Departments", text: "Browse the full department list and drill into any of them." },
      { icon: <DesktopOutlined />, title: "Open Monitoring", text: "Open any project and switch between CPU, GPU, Memory, Storage, Power and Carbon views." },
      { icon: <BellOutlined />, title: "Monitor & Stay Informed", text: "Keep an eye on live metrics and alerts across the organisation." },
    ],
  },
  DEPT_ADMIN: {
    heroTitle: "You own your department",
    heroText:
      "You manage your department — create projects and machines, register viewers and monitor every resource in real time, with reports scoped to your department.",
    accessShort: "Admin",
    accessSpan: "Dept Access",
    ctaTitle: "Ready to see your department live?",
    ctaText: "Jump into your department and open any project to start monitoring.",
    ctaButton: "Open Projects",
    features: [
      {
        icon: <AppstoreOutlined />,
        title: "Create Projects & Machines",
        description: "Create projects and add machines so your team can start monitoring.",
      },
      {
        icon: <TeamOutlined />,
        title: "Manage Department Viewers",
        description: "Register and manage viewer accounts for your department.",
      },
      {
        icon: <DesktopOutlined />,
        title: "Department Monitoring",
        description: "Watch your department's machines with live metrics at a glance.",
      },
      {
        icon: <LineChartOutlined />,
        title: "Deep-Dive Charts",
        description: "Open any of your projects' machines across all six metric views.",
      },
      {
        icon: <FileTextOutlined />,
        title: "Department Reports",
        description: "Generate daily, weekly, monthly or yearly PDF reports for your department.",
      },
      {
        icon: <BellOutlined />,
        title: "Alerts & Notifications",
        description: "Get notified about threshold breaches in your machines before users are affected.",
      },
    ],
    steps: [
      { icon: <SafetyCertificateOutlined />, title: "Sign In", text: "Log in with your department admin credentials." },
      { icon: <AppstoreOutlined />, title: "Build Your Department", text: "Create projects and add machines so your team can start monitoring." },
      { icon: <DesktopOutlined />, title: "Open Monitoring", text: "Open any project and switch between CPU, GPU, Memory, Storage, Power and Carbon views." },
      { icon: <FileTextOutlined />, title: "Report & Act", text: "Export department PDF reports and respond to alerts to keep machines healthy." },
    ],
  },
  DEPT_VIEWER: {
    heroTitle: "Read-Only Role",
    heroText:
      "View-only access — no changes to machines or users. You get a live view of your department's infrastructure — open any project's monitoring dashboards for your department, read-only.",
    accessShort: "View",
    accessSpan: "Dept Only",
    ctaTitle: "Ready to see your department live?",
    ctaText: "Jump into your department and open any project to start monitoring.",
    ctaButton: "Open Projects",
    features: [
      {
        icon: <DesktopOutlined />,
        title: "Department Overview",
        description: "View your department's projects, machines and live metrics — read-only.",
      },
      {
        icon: <LineChartOutlined />,
        title: "Deep-Dive Charts",
        description: "Open any machine's dedicated charts across all six monitoring dimensions.",
      },
      {
        icon: <DatabaseOutlined />,
        title: "Department Structure",
        description: "Browse the Department → Project → Machine hierarchy for your area.",
      },
      {
        icon: <SafetyCertificateOutlined />,
        title: "Machine Health Overview",
        description: "See overall machine health and status at a glance within your department.",
      },
      {
        icon: <BellOutlined />,
        title: "Alerts & Notifications",
        description: "See critical threshold alerts affecting your department.",
      },
      {
        icon: <LineChartOutlined />,
        title: "Live At-a-Glance Insight",
        description: "Quickly identify busy, idle or unhealthy machines from the overview views.",
      },
    ],
    steps: [
      { icon: <SafetyCertificateOutlined />, title: "Sign In", text: "Log in with your department viewer credentials." },
      { icon: <TeamOutlined />, title: "Explore Your Department", text: "Browse your department's projects and machine counts." },
      { icon: <DesktopOutlined />, title: "Open Monitoring", text: "Open any project and switch between CPU, GPU, Memory, Storage, Power and Carbon views." },
      { icon: <BellOutlined />, title: "Monitor & Stay Informed", text: "Keep an eye on live metrics and alerts across your department." },
    ],
  },
};

const DashboardGuide = () => {
  const user = useSelector(selectUser) || {};
  const navigate = useNavigate();
  const [activeSlide, setActiveSlide] = useState(0);
  const [paused, setPaused] = useState(false);

  const role = user.role || "CENTRAL_ADMIN";
  const cfg = roleData[role] || roleData.CENTRAL_ADMIN;
  const isCentral = role === "CENTRAL_ADMIN" || role === "CENTRAL_VIEWER";

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % metricSlides.length);
    }, 4500);
    return () => clearInterval(t);
  }, [paused]);

  const goTo = (dir) => {
    setActiveSlide((prev) => (prev + dir + metricSlides.length) % metricSlides.length);
  };

  const firstName = (user.personName || "there").split(" ")[0];

  const heroCpuPoints = [20, 35, 30, 52, 40, 66, 48, 74, 58, 80, 60];
  const heroBarColors = ["#6FA9A2", "#7E63A6", "#C8894F", "#5B9A74", "#72A9A4", "#8E75BC", "#BC8F34", "#6FA382", "#6B8FC0", "#A85F80", "#776BB0"];

  const buildHeroSparkPath = (points) => {
    const stepX = 100 / points.length;
    return points
      .map((p, i) => `${i === 0 ? "M" : "L"}${(i * stepX).toFixed(1)},${(100 - p).toFixed(1)}`)
      .join(" ");
  };

  return (
      <div className="guide-page">
        {/* ================= HERO ================= */}
        <section className="guide-hero animate-in animate-in-d1">
          <div className="guide-hero-glow guide-hero-glow-1" />
          <div className="guide-hero-glow guide-hero-glow-2" />

          <div className="guide-hero-content">
            <span className="guide-badge">
              <RocketOutlined /> Welcome, {firstName}
            </span>
            <h1>
              Infrastructure Monitoring
              <span> Dashboard</span>
            </h1>
            <p>
              {cfg.heroText}
            </p>

            <div className="guide-hero-actions">
              <button
                className="guide-btn-primary"
                onClick={() =>
                  navigate(isCentral ? "/departments" : `/departments/${user.deptId}`)
                }
              >
                {cfg.ctaButton} <ArrowRightOutlined />
              </button>
              <a className="guide-btn-ghost" href="#guide-features">
                What's inside <RightOutlined />
              </a>
            </div>
          </div>

          <div className="guide-hero-art" aria-hidden="true">
            <div className="guide-hero-card">
              <div className="guide-hero-card-top">
                <span className="ghc-dot" />
                <span className="ghc-dot" />
                <span className="ghc-dot" />
              </div>
              <div className="guide-hero-chart">
                <svg className="guide-hero-bars" viewBox="0 0 100 100" preserveAspectRatio="none">
                  {heroCpuPoints.map((p, i) => {
                    const barW = 100 / heroCpuPoints.length;
                    const x = i * barW + barW * 0.25;
                    const w = barW * 0.5;
                    const h = 100 - p;
                    const y = p;
                    return (
                      <rect
                        key={i}
                        className="guide-chart-bar"
                        x={x}
                        y={y}
                        width={w}
                        height={h}
                        rx="0.8"
                        style={{ fill: heroBarColors[i % heroBarColors.length] }}
                      />
                    );
                  })}
                </svg>
                <svg className="guide-hero-line-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <path
                    className="guide-chart-line"
                    d={buildHeroSparkPath(heroCpuPoints)}
                    fill="none"
                    stroke="#D99A1F"
                    pathLength={100}
                  />
                </svg>
              </div>
              <div className="guide-hero-metrics">
                <div><strong>6</strong><span>Metrics</span></div>
                {isCentral && <div><strong>{cfg.accessShort}</strong><span>{cfg.accessSpan}</span></div>}
                <div><strong>24/7</strong><span>Live</span></div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= FEATURES ================= */}
        <section className="guide-section" id="guide-features">
          <div className="guide-section-head">
            <h2>What can you do here?</h2>
            <p>Everything below is scoped to your access — {cfg.accessSpan.toLowerCase()}.</p>
          </div>

          <div className="guide-features-grid">
            {cfg.features.map((card, i) => (
              <div className="guide-feature-card animate-in" key={card.title} style={{ animationDelay: `${i * 0.06}s` }}>
                <div className="guide-feature-icon">{card.icon}</div>
                <h3>{card.title}</h3>
                <p>{card.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ================= CAROUSEL ================= */}
        <section className="guide-section">
          <div className="guide-section-head">
            <h2>Metrics you can access</h2>
            <p>Each machine exposes six detailed monitoring dimensions.</p>
          </div>

          <div
            className="guide-carousel"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            <div
              className="guide-carousel-track"
              style={{ transform: `translateX(-${activeSlide * 100}%)` }}
            >
              {metricSlides.map((slide) => (
                <div className="guide-carousel-slide" key={slide.title}>
                  <div className="guide-slide-icon" style={{ background: slide.gradient }}>
                    {slide.icon}
                  </div>
                  <div className="guide-slide-body">
                    <span className="guide-slide-tag" style={{ background: slide.gradient }}>{slide.tag}</span>
                    <h3>{slide.title}</h3>
                    <p>{slide.description}</p>
                    <div className="guide-slide-points">
                      {slide.points.map((pt) => (
                        <span key={pt}><CheckCircleFilled /> {pt}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button className="guide-carousel-nav guide-carousel-prev" onClick={() => goTo(-1)} aria-label="Previous">
              <ArrowLeftOutlined />
            </button>
            <button className="guide-carousel-nav guide-carousel-next" onClick={() => goTo(1)} aria-label="Next">
              <ArrowRightOutlined />
            </button>

            <div className="guide-carousel-dots">
              {metricSlides.map((s, i) => (
                <button
                  key={s.title}
                  className={`guide-dot ${i === activeSlide ? "active" : ""}`}
                  onClick={() => setActiveSlide(i)}
                  aria-label={`Go to ${s.title}`}
                />
              ))}
            </div>
          </div>
        </section>

        {/* ================= GETTING STARTED ================= */}
        <section className="guide-section">
          <div className="guide-section-head">
            <h2>Getting started</h2>
            <p>Quick steps from login to actionable insight for your role.</p>
          </div>

          <div className="guide-steps">
            {cfg.steps.map((s, i) => (
              <div className="guide-step animate-in" key={s.title} style={{ animationDelay: `${i * 0.07}s` }}>
                <div className="guide-step-num">{i + 1}</div>
                <div className="guide-step-icon">{s.icon}</div>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ================= CTA ================= */}
        <section className="guide-cta animate-in">
          <div>
            <h2>{cfg.ctaTitle}</h2>
            <p>{cfg.ctaText}</p>
          </div>
          <button
            className="guide-btn-primary"
            onClick={() =>
              navigate(isCentral ? "/departments" : `/departments/${user.deptId}`)
            }
          >
            {cfg.ctaButton} <ArrowRightOutlined />
          </button>
        </section>
      </div>
  );
};

export default DashboardGuide;
