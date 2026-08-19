import { useState, useRef, useEffect } from "react";
import { useSelector } from "react-redux";
import { selectUser } from "../../store/slices/authSlice";
import {
  FileTextOutlined,
  ReloadOutlined,
  DesktopOutlined,
  DatabaseOutlined,
  InboxOutlined,
  RobotFilled,
  BarChartOutlined,
  ApartmentOutlined,
  ProjectOutlined,
  InfoCircleOutlined,
  LockOutlined,
  DownloadOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import { Select, message, Modal } from "antd";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LabelList, Label,
} from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";
import { Link } from "react-router-dom";
import MainLayout from "../../layouts/MainLayout/MainLayout";
import {
  getSystemReport,
  getDepartmentReport,
  getProjectReport,
  getMachineReport,
} from "../../services/reportService";
import api from "../../services/api";
import "./Reports.css";

const titleCase = (str) => str.charAt(0).toUpperCase() + str.slice(1);

const reportTypes = ["department", "project", "machine"];
const allPeriods = ["daily", "weekly", "monthly", "yearly"];
const months = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);

const metricsConfig = {
  cpu: { icon: <DesktopOutlined />, color: "#F59E0B", label: "CPU" },
  memory: { icon: <DatabaseOutlined />, color: "#3B82F6", label: "Memory" },
  storage: { icon: <InboxOutlined />, color: "#10B981", label: "Storage" },
  gpu: { icon: <RobotFilled />, color: "#8B5CF6", label: "GPU" },
};

const MetricLineChart = ({ dataPoints, color, unit }) => {
  if (!dataPoints || dataPoints.length === 0) return null;

  const chartData = dataPoints.map((dp) => ({
    label: dp.label,
    avg: Number(dp.weightedAvg?.toFixed(1)) || 0,
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;
    const dp = dataPoints.find((d) => d.label === label);
    if (!dp) return null;
    return (
      <div className="chart-tooltip">
        <div className="chart-tooltip-label">{label}</div>
        <div className="chart-tooltip-row">
          <span className="chart-tooltip-dot" style={{ background: color }} />
          <span>Average: <strong>{dp.weightedAvg?.toFixed(1)}</strong></span>
        </div>
        <div className="chart-tooltip-row" style={{ marginTop: 2 }}>
          <span style={{ color: "var(--text-muted)" }}>Min: {dp.min?.toFixed(1)} &nbsp;|&nbsp; Max: {dp.max?.toFixed(1)}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="metric-chart-section">
      <ResponsiveContainer width="100%" height={Math.max(200, dataPoints.length * 32 + 40)}>
        <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 20, bottom: 4 }}>
          <defs>
            <linearGradient id={`grad-${color.replace(/\W/g, "")}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.25} />
              <stop offset="100%" stopColor={color} stopOpacity={0.03} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--surface-3)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "var(--text-muted)" }}
            tickLine={false}
            axisLine={{ stroke: "var(--border-color)", strokeWidth: 1 }}
          />
          <YAxis
            domain={["dataMin - 0.5", "dataMax + 0.5"]}
            tick={{ fontSize: 11, fill: "var(--text-muted)" }}
            tickLine={false}
            axisLine={false}
            width={55}
            tickCount={6}
            tickFormatter={(v) => v.toFixed(1)}
          >
            <Label
              value={unit || ""}
              position="insideTopLeft"
              offset={-4}
              style={{ fontSize: 11, fill: "var(--text-muted)", fontWeight: 600 }}
            />
          </YAxis>
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: "var(--border-color)", strokeDasharray: "4 4" }} />
          <Area
            type="monotone"
            dataKey="avg"
            stroke={color}
            strokeWidth={2.5}
            fill={`url(#grad-${color.replace(/\W/g, "")})`}
            dot={{ r: 3.5, fill: color, stroke: "var(--card-bg)", strokeWidth: 2 }}
            activeDot={{ r: 5.5, fill: color, stroke: "var(--card-bg)", strokeWidth: 2 }}
          >
            <LabelList
              dataKey="avg"
              position="top"
              offset={6}
              style={{ fontSize: 10, fill: "var(--text-secondary)", fontWeight: 600 }}
            />
          </Area>
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

const NoDataMessage = ({ label }) => (
  <div className="no-data-block">
    <RobotFilled className="no-data-icon" />
    <span>No {label} data available</span>
  </div>
);

const MetricSection = ({ title, data, color, icon }) => {
  const hasData = data && data.dataPoints && data.dataPoints.length > 0;

  return (
    <div className="report-metric-section" style={{ "--accent": color }}>
      <h3 className="metric-title">
        <span className="metric-icon" style={{ color, background: `${color}18` }}>{icon}</span>
        {title}
        {data?.unit && <span className="metric-unit">{data.unit}</span>}
      </h3>
      {data?.summary ? (
        <div className="metric-summary">
          {[
            { label: "Weighted Avg", value: data.summary?.weightedAvg, colored: true },
            { label: "Min", value: data.summary?.globalMin },
            { label: "Max", value: data.summary?.globalMax },
          ].map((item) => (
            <div className="summary-item" key={item.label}>
              <span className="summary-label">{item.label}</span>
              <span className="summary-value" style={item.colored ? { color } : undefined}>
                {item.value?.toFixed(2) ?? "—"}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <NoDataMessage label={title} />
      )}
      {hasData && (
        <MetricLineChart dataPoints={data.dataPoints} color={color} unit={data.unit} />
      )}
    </div>
  );
};

const LoadingSkeleton = () => (
  <div className="report-results skeleton">
    <div className="skeleton-header">
      <div className="skeleton-line w-60" />
      <div className="skeleton-line w-40" />
    </div>
    <div className="report-metrics-grid">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="skeleton-card">
          <div className="skeleton-line w-40" />
          <div className="skeleton-row"><div className="skeleton-line w-20" /><div className="skeleton-line w-20" /><div className="skeleton-line w-20" /></div>
          <div className="skeleton-line w-90" /><div className="skeleton-line w-90" /><div className="skeleton-line w-90" />
        </div>
      ))}
    </div>
  </div>
);

const scopeIcons = {
  system: <BarChartOutlined />,
  department: <ApartmentOutlined />,
  project: <ProjectOutlined />,
  machine: <DesktopOutlined />,
};

const Reports = () => {
  const user = useSelector(selectUser) || {};
  const isDeptUser = user.role === "DEPT_ADMIN";

  const [reportType, setReportType] = useState("");
  const [selectedDeptId, setSelectedDeptId] = useState(isDeptUser ? user.deptId : undefined);
  const [selectedProjectId, setSelectedProjectId] = useState(undefined);
  const [selectedMachineId, setSelectedMachineId] = useState(undefined);
  const [period, setPeriod] = useState("monthly");
  const [month, setMonth] = useState(undefined);
  const [year, setYear] = useState(undefined);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [error, setError] = useState("");

  const [departments, setDepartments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [machines, setMachines] = useState([]);
  const [loadingDepts, setLoadingDepts] = useState(!isDeptUser);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingMachines, setLoadingMachines] = useState(false);
  const [infoOpen, setInfoOpen] = useState(true);
  const [selectedDeptName, setSelectedDeptName] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const resultsRef = useRef(null);
  const printRef = useRef(null);

  // Load departments (only for central roles)
  useEffect(() => {
    if (!isDeptUser) {
      const load = async () => {
        try {
          const res = await api.get("/api/departments/summary");
          if (res.data?.data) setDepartments(res.data.data);
        } catch { /* not critical */ }
        setLoadingDepts(false);
      };
      load();
    }
  }, []);

  // Fetch department name whenever deptId is available
  useEffect(() => {
    const deptId = isDeptUser ? user.deptId : selectedDeptId;
    if (deptId) {
      const load = async () => {
        try {
          const res = await api.get(`/api/departments/summary/${deptId}`);
          if (res.data?.data) setSelectedDeptName(res.data.data?.[0]?.deptName || "");
        } catch { setSelectedDeptName(""); }
      };
      load();
    } else {
      setSelectedDeptName("");
    }
  }, [isDeptUser ? user.deptId : selectedDeptId]);

  // Load projects when deptId is known (mount for dept users, on dept select for central)
  useEffect(() => {
    const deptId = isDeptUser ? user.deptId : selectedDeptId;
    if (deptId) {
      const load = async () => {
        setLoadingProjects(true);
        try {
          const res = await api.get(`/api/projects/department/${deptId}/summary`);
          if (res.data?.data) setProjects(res.data.data);
        } catch { /* not critical */ }
        setLoadingProjects(false);
      };
      load();
    } else if (!isDeptUser) {
      setProjects([]);
    }
  }, [isDeptUser ? user.deptId : selectedDeptId]);

  // Load machines when projectId is selected
  useEffect(() => {
    if (selectedProjectId) {
      const load = async () => {
        setLoadingMachines(true);
        try {
          const res = await api.get(`/api/machines/project/${selectedProjectId}`);
          if (res.data?.data) setMachines(res.data.data);
        } catch { /* not critical */ }
        setLoadingMachines(false);
      };
      load();
    } else {
      setMachines([]);
    }
  }, [selectedProjectId]);

  const filteredPeriods = reportType === "department"
    ? allPeriods.filter((p) => p === "monthly" || p === "yearly")
    : allPeriods;

  const showMonth = period === "daily" || period === "weekly";
  const showYear = period !== "yearly";

  const needsEntity = reportType && reportType !== "system";
  const deptRequired = reportType === "project" || reportType === "machine" || (reportType === "department" && !isDeptUser);
  const projectRequired = reportType === "machine";
  const deptSelected = isDeptUser ? !!selectedDeptId : !!selectedDeptId;
  const projectSelected = !!selectedProjectId;
  const machineSelected = !!selectedMachineId;

  const canGenerate = !!reportType && (
    reportType === "system" ||
    (reportType === "department" && (isDeptUser || deptSelected)) ||
    (reportType === "project" && deptSelected && projectSelected) ||
    (reportType === "machine" && deptSelected && projectSelected && machineSelected)
  ) && (showMonth ? month && year : showYear ? year : true);

  const resetConfig = () => {
    setPeriod("monthly");
    setMonth(undefined);
    setYear(undefined);
    setReportData(null);
    setError("");
  };

  const handleReportTypeChange = (val) => {
    setReportType(val);
    setSelectedProjectId(undefined);
    setSelectedMachineId(undefined);
    if (!isDeptUser) setSelectedDeptId(undefined);
    resetConfig();
  };

  const handlePeriodChange = (val) => {
    setPeriod(val);
    if (val === "monthly" || val === "yearly") setMonth(undefined);
    if (val === "yearly") setYear(undefined);
    setReportData(null);
    setError("");
  };

  const buildQueryParams = () => {
    const params = { period };
    if (showMonth) params.month = String(month).padStart(2, "0");
    if (showYear) params.year = year;
    return params;
  };

  const validate = () => {
    if (showMonth) {
      if (!month) return "Month is required.";
      if (month < 1 || month > 12) return "Invalid month. Use 01-12.";
    }
    if (showYear) {
      if (!year) return "Year is required.";
      if (String(year).length !== 4) return "Invalid year. Use 4 digits (e.g. 2026).";
    }
    return null;
  };

  const handleGenerate = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError("");
    setReportData(null);
    try {
      const params = buildQueryParams();
      let data;
      switch (reportType) {
        case "system":
          data = await getSystemReport(params.period, params.month, params.year);
          break;
        case "department": {
          const deptId = isDeptUser ? user.deptId : selectedDeptId;
          data = await getDepartmentReport(deptId, params.period, params.month, params.year);
          break;
        }
        case "project":
          data = await getProjectReport(selectedProjectId, params.period, params.month, params.year);
          break;
        case "machine":
          data = await getMachineReport(selectedMachineId, params.period, params.month, params.year);
          break;
      }
      setReportData(data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (reportData && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [reportData]);

  const filteredProjects = deptSelected ? projects : [];

  const filteredMachines = projectSelected ? machines : [];

  const handleDownloadPdf = async () => {
    if (!reportData) return;
    setDownloadingPdf(true);
    try {
      const { scope, scopeName, period, machineCount, generatedAt, cpu, memory, storage, gpu } = reportData;
      const scopeLabels = { department: "Department", project: "Project", machine: "Machine" };
      const scopeLabel = scopeLabels[scope] || "";
      const generatedDate = generatedAt ? new Date(generatedAt).toLocaleString() : new Date().toLocaleString();
      const filename = `${scopeName || scopeLabel}-report-${period}-${new Date().toISOString().split("T")[0]}.pdf`;

      const doc = new jsPDF("p", "mm", "a4");
      const pw = doc.internal.pageSize.getWidth();
      const ph = doc.internal.pageSize.getHeight();
      const m = 22;
      const cw = pw - m * 2;
      let y = m;

      const fontSize = {
        title: 20, subtitle: 13, small: 10,
        metricTitle: 15, metricUnit: 10,
        summaryLabel: 10, summaryValue: 14,
        tableHead: 10, tableBody: 11, footer: 9,
      };

      const color = {
        text: [40, 40, 40], textMuted: [90, 90, 90], textLight: [110, 110, 110],
        border: [200, 200, 200], headBg: [240, 240, 240], altRow: [245, 245, 245],
      };

      const metrics = [
        { key: "CPU", data: cpu, accent: [245, 158, 11] },
        { key: "Memory", data: memory, accent: [59, 130, 246] },
        { key: "Storage", data: storage, accent: [16, 185, 129] },
        { key: "GPU", data: gpu, accent: [139, 92, 246] },
      ];

      const checkPage = (need) => {
        if (y + need > ph - m) { doc.addPage(); y = m; }
      };
      const pageBottom = () => ph - 12;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(fontSize.title);
      doc.setTextColor(...color.text);
      doc.text("Monitoring Report", m, y);
      y += 9;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(fontSize.subtitle);
      doc.setTextColor(...color.textMuted);
      doc.text(scopeName || `${scopeLabel} Report`, m, y);
      y += 7;
      doc.setFontSize(fontSize.small);
      doc.text(`Generated ${generatedDate}`, m, y);
      y += 14;

      doc.setDrawColor(...color.border);
      doc.setLineWidth(0.4);
      doc.line(m, y, pw - m, y);
      y += 10;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      const metaItems = [
        { label: "Scope", value: scopeLabel },
        { label: "Period", value: typeof period === "string" ? period.charAt(0).toUpperCase() + period.slice(1) : period },
        { label: "Machines", value: String(machineCount) },
      ];
      const metaColW = cw / metaItems.length;
      metaItems.forEach((item, i) => {
        const x = m + i * metaColW;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(...color.textMuted);
        doc.text(item.label.toUpperCase(), x, y);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(12);
        doc.setTextColor(...color.text);
        doc.text(String(item.value), x, y + 6);
      });
      y += 18;

      doc.setDrawColor(...color.border);
      doc.setLineWidth(0.4);
      doc.line(m, y, pw - m, y);
      y += 12;

      let chartIdx = 0;
      for (const metric of metrics) {
        if (!metric.data) continue;
        const { unit, summary, dataPoints } = metric.data;

        checkPage(60);

        doc.setFillColor(...metric.accent);
        doc.rect(m, y, 4, 14, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(fontSize.metricTitle);
        doc.setTextColor(...color.text);
        const titleW = doc.getTextWidth(metric.key);
        doc.text(metric.key, m + 11, y + 10);
        if (unit) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(fontSize.metricUnit);
          doc.setTextColor(...color.textLight);
          doc.text(`(${unit})`, m + 11 + titleW + 5, y + 10);
        }
        y += 20;

        if (summary) {
          checkPage(22);
          const sumData = [[
            { content: "Weighted Avg", styles: { fontStyle: "bold", textColor: color.textMuted, fontSize: fontSize.summaryLabel, cellPadding: 1 } },
            { content: String(summary.weightedAvg?.toFixed(2) ?? "—"), styles: { fontStyle: "bold", textColor: metric.accent, fontSize: fontSize.summaryValue, cellPadding: 1 } },
            { content: "Min", styles: { fontStyle: "bold", textColor: color.textMuted, fontSize: fontSize.summaryLabel, cellPadding: 1 } },
            { content: String(summary.globalMin?.toFixed(2) ?? "—"), styles: { fontStyle: "bold", fontSize: fontSize.summaryValue, cellPadding: 1 } },
            { content: "Max", styles: { fontStyle: "bold", textColor: color.textMuted, fontSize: fontSize.summaryLabel, cellPadding: 1 } },
            { content: String(summary.globalMax?.toFixed(2) ?? "—"), styles: { fontStyle: "bold", fontSize: fontSize.summaryValue, cellPadding: 1 } },
          ]];
          autoTable(doc, {
            startY: y, margin: { left: m + 4, right: m + 4 },
            tableWidth: cw - 8, body: sumData, theme: "plain",
            tableLineWidth: 0,
            columnStyles: {
              0: { cellWidth: 28 }, 1: { cellWidth: (cw - 8 - 28 * 2 - 24 * 2) / 2 },
              2: { cellWidth: 12 }, 3: { cellWidth: (cw - 8 - 28 * 2 - 24 * 2) / 2 },
              4: { cellWidth: 12 }, 5: { cellWidth: (cw - 8 - 28 * 2 - 24 * 2) / 2 },
            },
          });
          y = doc.lastAutoTable.finalY + 10;
        }

        if (dataPoints && dataPoints.length > 0) {
          checkPage(20 + dataPoints.length * 8);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(8);
          doc.setTextColor(...color.textMuted);
          doc.text("DATA POINTS", m + 4, y);
          y += 5;

          autoTable(doc, {
            startY: y, margin: { left: m + 4, right: m + 4 },
            tableWidth: cw - 8,
            head: [[
              { content: "Label", styles: { fontStyle: "bold", fontSize: fontSize.tableHead, textColor: color.textMuted, fillColor: color.headBg, cellPadding: 3 } },
              { content: "Min", styles: { fontStyle: "bold", fontSize: fontSize.tableHead, textColor: color.textMuted, fillColor: color.headBg, cellPadding: 3, halign: "right" } },
              { content: "Avg", styles: { fontStyle: "bold", fontSize: fontSize.tableHead, textColor: color.textMuted, fillColor: color.headBg, cellPadding: 3, halign: "right" } },
              { content: "Max", styles: { fontStyle: "bold", fontSize: fontSize.tableHead, textColor: color.textMuted, fillColor: color.headBg, cellPadding: 3, halign: "right" } },
            ]],
            body: dataPoints.map((dp) => [
              { content: String(dp.label ?? ""), styles: { fontSize: fontSize.tableBody, cellPadding: 3 } },
              { content: String(dp.min?.toFixed(1) ?? "—"), styles: { fontSize: fontSize.tableBody, halign: "right", cellPadding: 3 } },
              { content: String(dp.weightedAvg?.toFixed(1) ?? "—"), styles: { fontSize: fontSize.tableBody, fontStyle: "bold", halign: "right", textColor: metric.accent, cellPadding: 3 } },
              { content: String(dp.max?.toFixed(1) ?? "—"), styles: { fontSize: fontSize.tableBody, halign: "right", cellPadding: 3 } },
            ]),
            theme: "grid", headStyles: { lineColor: color.border, lineWidth: 0.4 },
            bodyStyles: { lineColor: [230, 230, 230], lineWidth: 0.3 },
            alternateRowStyles: { fillColor: color.altRow },
            columnStyles: {
              0: { cellWidth: "auto" }, 1: { cellWidth: 28, halign: "right" },
              2: { cellWidth: 28, halign: "right" }, 3: { cellWidth: 28, halign: "right" },
            },
          });
          y = doc.lastAutoTable.finalY + 14;

          // Chart image
          try {
            const sections = printRef.current?.querySelectorAll(".metric-chart-section");
            const section = sections?.[chartIdx];
            if (section) {
              const canvas = await html2canvas(section, { scale: 3, useCORS: true, backgroundColor: "#ffffff" });
              const maxH = 130;
              const imgW = cw - 8;
              const imgH = Math.min(maxH, imgW * (canvas.height / canvas.width));
              checkPage(imgH + 8);
              doc.addImage(canvas.toDataURL("image/png"), "PNG", m + 4, y, imgW, imgH, undefined, "FAST");
              y += imgH + 12;
            }
          } catch { /* chart capture skipped */ }
          chartIdx++;
        } else {
          y += 10;
        }
      }

      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(fontSize.footer);
        doc.setTextColor(...color.textLight);
        doc.text(`Page ${i} of ${totalPages}`, pw - m, pageBottom(), { align: "right" });
        doc.text("Monitoring Report", m, pageBottom());
      }

      const blob = doc.output("blob");
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setShowSuccessModal(true);
    } catch (err) {
      console.error("PDF Error:", err);
      message.error("Failed to download report");
    } finally {
      setDownloadingPdf(false);
    }
  };

  const selectedReportType = !!reportType;

  return (
    <MainLayout
      title="Reports"
      breadcrumb={
        <>
          <Link to="/dashboard" className="bc-link">Dashboard</Link>
          <span className="bc-sep">›</span>
          <span className="bc-current">Reports</span>
        </>
      }
    >
      <div className="info-guide-card">
        <div className="info-guide-header" onClick={() => setInfoOpen(!infoOpen)}>
          <div className="info-guide-title">
            <InfoCircleOutlined className="info-guide-icon" />
            <span>How to Use Reports</span>
          </div>
          <button className="info-guide-toggle">{infoOpen ? "−" : "+"}</button>
        </div>
        {infoOpen && (
          <div className="info-guide-body">
            <div className="info-guide-steps">
              <div className="info-guide-step">
                <span className="info-guide-step-num">1</span>
                <div>
                  <strong>Select Report Type</strong>
                  <p>Choose Department, Project, or Machine from the dropdown.</p>
                </div>
              </div>
              <div className="info-guide-step">
                <span className="info-guide-step-num">2</span>
                <div>
                  <strong>Choose Entity</strong>
                  <p>Cascading dropdowns appear based on your selection — Department → Project → Machine (as needed).</p>
                </div>
              </div>
              <div className="info-guide-step">
                <span className="info-guide-step-num">3</span>
                <div>
                  <strong>Configure Period</strong>
                  <p>Select the time range for your report. For daily or weekly reports, pick both a month and year. Monthly reports only need a year, while yearly reports cover the full year automatically.</p>
                  <p className="info-guide-note">Note: Department reports only support Monthly &amp; Yearly periods.</p>
                </div>
              </div>
              <div className="info-guide-step">
                <span className="info-guide-step-num">4</span>
                <div>
                  <strong>Generate</strong>
                  <p>Click "Generate Report" to view results with summary KPIs and trend charts.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="config-card">
        <div className="config-section">
          <div className="config-section-header">
            <span className="config-step-badge">1</span>
            <span className="config-section-title">Choose Report Type</span>
            {selectedReportType && (
              <span className="config-done-badge">
                {scopeIcons[reportType]} {titleCase(reportType)}
                {reportType === "department" && selectedDeptName && <span> - {selectedDeptName}</span>}
              </span>
            )}
          </div>
          <div className="config-section-body">
            <div className="form-row">
              <div className="form-group">
                <label>Report Type</label>
                <Select value={reportType || undefined} onChange={handleReportTypeChange} className="form-select" placeholder="Select report type">
                  {reportTypes.map((t) => (
                    <Select.Option key={t} value={t}>
                      <span className="scope-option">{scopeIcons[t]} {titleCase(t)}</span>
                    </Select.Option>
                  ))}
                </Select>
              </div>

              {reportType === "department" && !isDeptUser && (
                <div className="form-group">
                  <label>Department</label>
                  <Select
                    value={selectedDeptId}
                    onChange={(v) => { setSelectedDeptId(v); resetConfig(); }}
                    className="form-select"
                    placeholder="Select department"
                    loading={loadingDepts}
                    notFoundContent={loadingDepts ? "Loading..." : "No departments"}
                  >
                    {departments.map((d) => (
                      <Select.Option key={d.deptId || d.id} value={d.deptId || d.id}>
                        {d.deptName || d.name}
                      </Select.Option>
                    ))}
                  </Select>
                </div>
              )}

              {reportType === "department" && isDeptUser && (
                <div className="form-group">
                  <label>Department</label>
                  <Select value={user.deptId} className="form-select" disabled>
                    <Select.Option value={user.deptId}>
                      {selectedDeptName || `Department #${user.deptId}`}
                    </Select.Option>
                  </Select>
                </div>
              )}

              {(reportType === "project" || reportType === "machine") && isDeptUser && (
                <div className="form-group">
                  <label>Department</label>
                  <Select value={user.deptId} className="form-select" disabled>
                    <Select.Option value={user.deptId}>
                      {selectedDeptName || `Department #${user.deptId}`}
                    </Select.Option>
                  </Select>
                </div>
              )}

              {(reportType === "project" || reportType === "machine") && !isDeptUser && (
                <div className="form-group">
                  <label>Department</label>
                  <Select
                    value={selectedDeptId}
                    onChange={(v) => { setSelectedDeptId(v); setSelectedProjectId(undefined); setSelectedMachineId(undefined); resetConfig(); }}
                    className="form-select"
                    placeholder="Select department"
                    loading={loadingDepts}
                    notFoundContent={loadingDepts ? "Loading..." : "No departments"}
                  >
                    {departments.map((d) => (
                      <Select.Option key={d.deptId || d.id} value={d.deptId || d.id}>
                        {d.deptName || d.name}
                      </Select.Option>
                    ))}
                  </Select>
                </div>
              )}

              {reportType === "project" && deptSelected && (
                <div className="form-group">
                  <label>Project</label>
                  <Select
                    value={selectedProjectId}
                    onChange={(v) => { setSelectedProjectId(v); resetConfig(); }}
                    className="form-select"
                    placeholder="Select project"
                    loading={loadingProjects}
                    notFoundContent={loadingProjects ? "Loading projects..." : "No projects for this department"}
                  >
                    {filteredProjects.map((p) => (
                      <Select.Option key={p.projectId || p.id} value={p.projectId || p.id}>
                        {p.projectName || p.name}
                      </Select.Option>
                    ))}
                  </Select>
                </div>
              )}

              {reportType === "machine" && deptSelected && (
                <div className="form-group">
                  <label>Project</label>
                  <Select
                    value={selectedProjectId}
                    onChange={(v) => { setSelectedProjectId(v); setSelectedMachineId(undefined); resetConfig(); }}
                    className="form-select"
                    placeholder="Select project"
                    loading={loadingProjects}
                    notFoundContent={loadingProjects ? "Loading projects..." : "No projects for this department"}
                  >
                    {filteredProjects.map((p) => (
                      <Select.Option key={p.projectId || p.id} value={p.projectId || p.id}>
                        {p.projectName || p.name}
                      </Select.Option>
                    ))}
                  </Select>
                </div>
              )}

              {reportType === "machine" && projectSelected && (
                <div className="form-group">
                  <label>Machine</label>
                  <Select
                    value={selectedMachineId}
                    onChange={(v) => { setSelectedMachineId(v); resetConfig(); }}
                    className="form-select"
                    placeholder="Select machine"
                    loading={loadingMachines}
                    notFoundContent={loadingMachines ? "Loading machines..." : "No machines for this project"}
                    dropdownMatchSelectWidth={false}
                  >
                    {filteredMachines.map((m) => (
                      <Select.Option key={m.machineId || m.id} value={m.machineId || m.id}>
                        {m.hostname ? `${m.hostname} (${m.ipAddress})` : m.machineName || m.name || `Machine #${m.machineId || m.id}`}
                      </Select.Option>
                    ))}
                  </Select>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="config-divider" />

        <div className={`config-section ${!selectedReportType ? "disabled" : ""}`}>
          <div className="config-section-header">
            <span className="config-step-badge">2</span>
            <span className="config-section-title">Configure & Generate</span>
            {!selectedReportType && (
              <span className="config-lock-badge"><LockOutlined /> Select a report type first</span>
            )}
          </div>
          <div className="config-section-body">
            <div className="form-row">
              <div className="form-group">
                <label>Period</label>
                <Select value={period} onChange={handlePeriodChange} className="form-select" disabled={!selectedReportType}>
                  {filteredPeriods.map((p) => (
                    <Select.Option key={p} value={p}>{titleCase(p)}</Select.Option>
                  ))}
                </Select>
              </div>
              {showMonth && (
                <div className="form-group">
                  <label>Month</label>
                  <Select
                    value={month}
                    onChange={(v) => { setMonth(v); setReportData(null); setError(""); }}
                    className="form-select"
                    placeholder="Select month"
                    disabled={!selectedReportType}
                  >
                    {months.map((m) => (<Select.Option key={m.value} value={m.value}>{m.label}</Select.Option>))}
                  </Select>
                </div>
              )}
              {showYear && (
                <div className="form-group">
                  <label>Year</label>
                  <Select
                    value={year}
                    onChange={(v) => { setYear(v); setReportData(null); setError(""); }}
                    className="form-select"
                    placeholder="Select year"
                    disabled={!selectedReportType}
                  >
                    {years.map((y) => (<Select.Option key={y} value={y}>{y}</Select.Option>))}
                  </Select>
                </div>
              )}
              <div className="form-group form-action">
                <label>&nbsp;</label>
                <button className="btn-primary" onClick={handleGenerate} disabled={loading || !canGenerate}>
                  {loading ? <ReloadOutlined spin /> : <FileTextOutlined />}
                  {loading ? " Generating..." : " Generate Report"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <span className="error-icon">!</span>
          {error}
        </div>
      )}

      <div ref={resultsRef}>
        {loading && <LoadingSkeleton />}
        {!loading && !reportData && !error && (
          <div className="empty-state">
            <div className="empty-icon"><BarChartOutlined /></div>
            <h3>No Report Generated</h3>
            <p>Configure the settings above and click "Generate Report" to view results.</p>
          </div>
        )}
        {!loading && reportData && (
          <div className="report-results" ref={printRef}>
            <div className="report-results-actions">
              <button className="print-btn" onClick={handleDownloadPdf} disabled={downloadingPdf}>
                {downloadingPdf ? <LoadingOutlined /> : <DownloadOutlined />}
                {downloadingPdf ? " Downloading..." : " Download PDF"}
              </button>
            </div>
            <div className="report-summary-header">
              <div className="summary-title-row">
                <span className="scope-icon-badge" style={{ background: `${metricsConfig[reportData.scope === "system" ? "cpu" : "memory"].color}15` }}>
                  {scopeIcons[reportData.scope] || <BarChartOutlined />}
                </span>
                <div>
                  <h2>
                    {reportData.scope === "system"
                      ? "System Report"
                      : `${titleCase(reportData.scope)}: ${reportData.scopeName}`
                    }
                  </h2>
                  {reportData.generatedAt && (
                    <span className="generated-at">Generated on {new Date(reportData.generatedAt).toLocaleString()}</span>
                  )}
                </div>
              </div>
              <div className="summary-kv-row">
                {reportData.scopeId && (
                  <div className="kv-item">
                    <span className="kv-label">{titleCase(reportData.scope)} ID</span>
                    <span className="kv-sep">-</span>
                    <span className="kv-value kv-value-id">{reportData.scopeId}</span>
                  </div>
                )}
                <div className="kv-item">
                  <span className="kv-label">Scope</span>
                  <span className="kv-sep">-</span>
                  <span className="kv-value">{scopeIcons[reportData.scope]} {titleCase(reportData.scope)}</span>
                </div>
                <div className="kv-item">
                  <span className="kv-label">Period</span>
                  <span className="kv-sep">-</span>
                  <span className="kv-value">{titleCase(reportData.period)}</span>
                </div>
                <div className="kv-item">
                  <span className="kv-label">Machines</span>
                  <span className="kv-sep">-</span>
                  <span className="kv-value">{reportData.machineCount}</span>
                </div>
              </div>
            </div>
            <div className="report-metrics-grid">
              {Object.entries(metricsConfig).map(([key, config]) => (
                <MetricSection key={key} title={config.label} data={reportData[key]} color={config.color} icon={config.icon} />
              ))}
            </div>
          </div>
        )}
      </div>

      <Modal
        className="report-success-modal"
        open={showSuccessModal}
        onOk={() => setShowSuccessModal(false)}
        onCancel={() => setShowSuccessModal(false)}
        footer={null}
        closable={false}
        width={500}
      >
        <div className="success-modal-content">
          <div className="success-modal-icon">
            <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
              <circle cx="28" cy="28" r="28" fill="#10B981" opacity="0.12" />
              <circle cx="28" cy="28" r="20" fill="#10B981" />
              <path d="M22 28L26 32L34 24" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h3 className="success-modal-title">Report Downloaded!</h3>
          <p className="success-modal-text">Your report has been downloaded successfully.</p>
          <button className="success-modal-btn" onClick={() => setShowSuccessModal(false)}>OK</button>
        </div>
      </Modal>
    </MainLayout>
  );
};

export default Reports;
