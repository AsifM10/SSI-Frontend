import { getMachinesByProject } from "../../../services/machineService";
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { FiCpu } from "react-icons/fi";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import MainLayout from "../../../layouts/MainLayout/MainLayout";
import MonitoringHeader from "../../../components/monitoring/MonitoringHeader/MonitoringHeader";
import AddMachineModal from "../../../components/monitoring/AddMachineModal/AddMachineModal";
import MetricState from "../../../components/monitoring/MetricState/MetricState";


import { getCpuMetrics } from "../../../services/cpuService";
import useMonitoringProjects from "../../../hooks/useMonitoringProjects";

import "./CpuPage.css";



// Generate a detailed mock dataset of 60 points (15 minutes at 15s intervals)

const CpuPage = () => {
  const { projectId } = useParams();
  const [showMachineModal, setShowMachineModal] = useState(false);
  const { projects, onProjectChange } = useMonitoringProjects(projectId);

const [machines, setMachines] = useState([]);
const [activeMachine, setActiveMachine] = useState(
  localStorage.getItem("selectedMachine") || ""
);

const rangeMap = {
  "Last 5 Minutes": "5m",
  "Last 15 Minutes": "15m",
  "Last 1 Hour": "1h",
  "Last 6 Hours": "6h",
  "Last 24 Hours": "24h",
};


const [chartData, setChartData] = useState([]);

const [currentCpu, setCurrentCpu] = useState(0);
const [avgCpu, setAvgCpu] = useState(0);
const [maxCpu, setMaxCpu] = useState(0);
const [minCpu, setMinCpu] = useState(0);
const [cpuLabel, setCpuLabel] = useState("");
const [selectedRange, setSelectedRange] = useState("Last 15 Minutes");

const [isLoading, setIsLoading] = useState(false);
const [hasData, setHasData] = useState(true);

const loadCpuMetrics = async (machineId, range = selectedRange) => {
  try {
    setIsLoading(true);

    const data = await getCpuMetrics(
  machineId,
  rangeMap[range]
);

    const dataAvailable =
      data &&
      (Number(data.current) > 0 ||
        Number(data.avg) > 0 ||
        Number(data.max) > 0 ||
        Number(data.min) > 0 ||
        (data.dataPoints && data.dataPoints.length > 0));

    setHasData(!!dataAvailable);

    setCurrentCpu(data.current);
    setAvgCpu(data.avg);
    setMaxCpu(data.max);
    setMinCpu(data.min);

    setCpuLabel(`${data.used} / ${data.total} ${data.unit}`);


const startLabel = {
  "Last 5 Minutes": "-5m",
  "Last 15 Minutes": "-15m",
  "Last 1 Hour": "-1h",
  "Last 6 Hours": "-6h",
  "Last 24 Hours": "-24h",
}[range];


    const formattedChart = (data.dataPoints || []).map((point, index) => ({
  usage: point.value,

  displayTime:
  index === 0
    ? startLabel
    : index === data.dataPoints.length - 1
    ? "now"
    : `point-${index}`,
}));


    setChartData(formattedChart);
  } catch (error) {
    console.error("CPU metrics error", error);
    setHasData(false);
  } finally {
    setIsLoading(false);
  }
};

const loadMachines = async () => {
  try {
    const data = await getMachinesByProject(projectId);

    setMachines(data);

    if (data.length > 0) {
  const savedMachine =
    localStorage.getItem("selectedMachine");

  const machineToLoad =
    savedMachine &&
    data.find(
      (m) => m.machineId === Number(savedMachine)
    )
      ? Number(savedMachine)
      : data[0].machineId;

  setActiveMachine(machineToLoad);
  loadCpuMetrics(machineToLoad);
}
  } catch (error) {
    console.error("Machines error", error);
  }
};



useEffect(() => {
  loadMachines();
}, []);


useEffect(() => {
  if (activeMachine) {
    loadCpuMetrics(activeMachine, selectedRange);
  }
}, [selectedRange]);

useEffect(() => {
  if (!activeMachine) return;

  const interval = setInterval(() => {
    loadCpuMetrics(activeMachine, selectedRange);
  }, 120000);

  return () => clearInterval(interval);
}, [activeMachine, selectedRange]);

  return (
    <MainLayout title="CPU Monitoring">
      <div className="cpu-monitoring-container animate-in animate-in-d1">
        <MonitoringHeader
  projects={projects}
  projectId={projectId}
  onProjectChange={onProjectChange}
  machines={machines}
  selectedMachine={activeMachine}
  selectedRange={selectedRange}

onRangeChange={(range) => {
  setSelectedRange(range);

  loadCpuMetrics(activeMachine, range);
}}

  onMachineChange={(machineId) => {
    localStorage.setItem("selectedMachine", machineId);
    setActiveMachine(machineId);
    loadCpuMetrics(machineId, selectedRange);
}}
  onAddMachine={() => setShowMachineModal(true)}
onRefresh={() => loadCpuMetrics(activeMachine, selectedRange)}/>
      <div>

        {/* CPU Usage Main Card */}
        <div className="cpu-usage-card">
          {(isLoading || !hasData) && (
            <MetricState
              loading={isLoading}
              message="No CPU data available"
              icon={<FiCpu />}
            />
          )}
          <div className="cpu-card-header">
            <div className="cpu-title-left">
              <div className="cpu-icon-box">
                <FiCpu />
              </div>
              <h2>CPU Usage</h2>
            </div>
            
            <div className="cpu-stats-right">
              <div className="stat-summary-item">
                <span className="stat-lbl">Current</span>
                <span className="stat-val highlight">
  {currentCpu}%
</span>

<div
  style={{
    fontSize: "12px",
    color: "#64748b",
    marginTop: "4px",
  }}
>
  {cpuLabel}
</div>
              </div>
              <div className="stat-summary-item">
                <span className="stat-lbl">Avg</span>
                <span className="stat-val">{avgCpu}%</span>
              </div>
              <div className="stat-summary-item">
                <span className="stat-lbl">Max</span>
                <span className="stat-val">{maxCpu}%</span>
              </div>
            </div>
          </div>

          {/* Area Chart Container */}
          <div className="cpu-chart-wrapper">
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart
  data={chartData}
  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
  onMouseMove={(state) => {
}}
>
                <defs>
                  <linearGradient id="chartCpuGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                
                <CartesianGrid
                  strokeDasharray="0"
                  stroke="#f1f5f9"
                  vertical={false}
                />
                
<XAxis
  dataKey="displayTime"
  type="category"
  interval={0}
  tickFormatter={(value) =>
    value.startsWith("point-") ? "" : value
  }
  stroke="#94a3b8"
  fontSize={12}
  fontWeight={500}
  tickLine={false}
  dy={10}
/>
                
                <YAxis
domain={[
    (dataMin) => Math.floor(dataMin - 1),
    (dataMax) => Math.ceil(dataMax + 1),
  ]}
                  tickFormatter={(val) => `${val}%`}
                  stroke="#94a3b8"
                  fontSize={12}
                  fontWeight={500}
                  tickLine={false}
                  dx={-10}
                />
                
                <Tooltip
  labelFormatter={() => ""}
  formatter={(value) => [`${value}%`, "CPU Usage"]}
  contentStyle={{
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
    fontSize: "12px",
  }}
/>

                <Area
                  type="monotone"
                  dataKey="usage"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#chartCpuGradient)"
                  activeDot={{ r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
            
            {/* Center X-Axis Custom Label */}
            <div className="chart-x-label">
  TIME ({selectedRange.toUpperCase().replace("LAST ", "")})
</div>
          </div>

          {/* Footer Card Statistics */}
          <div className="cpu-card-footer">
            <div className="footer-metric-col">
              <span className="metric-lbl">Min</span>
              <strong className="metric-val">{minCpu}%</strong>
            </div>
            <div className="footer-metric-col">
              <span className="metric-lbl">Avg</span>
              <strong className="metric-val">{avgCpu}%</strong>
            </div>
            <div className="footer-metric-col">
              <span className="metric-lbl">Max</span>
              <strong className="metric-val">{maxCpu}%</strong>
            </div>
          </div>
        </div>
      </div>
      <AddMachineModal
        open={showMachineModal}
        onClose={() => setShowMachineModal(false)}
        projectId={projectId}
      />
      </div>
    </MainLayout>
  );
};

export default CpuPage;
