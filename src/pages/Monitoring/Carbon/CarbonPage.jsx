import { getMachinesByProject } from "../../../services/machineService";
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { LuLeaf } from "react-icons/lu";
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


import { getCarbonMetrics } from "../../../services/carbonService";
import useMonitoringProjects from "../../../hooks/useMonitoringProjects";
import "./CarbonPage.css";

// Generate a detailed mock dataset of 60 points (15 minutes at 15s intervals)

const CarbonPage = () => {
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
const [totalCarbon, setTotalCarbon] = useState(0);
const [cpuLabel, setCpuLabel] = useState("");


const [selectedRange, setSelectedRange] =
  useState("Last 15 Minutes");

const [isLoading, setIsLoading] = useState(false);
const [hasData, setHasData] = useState(true);

const loadCarbonMetrics = async (
  machineId,
  range = selectedRange
) => {
      try {
        setIsLoading(true);

    const data = await getCarbonMetrics(
  machineId,
  rangeMap[range]
);

    const dataAvailable =
      data &&
      (Number(data.current) > 0 ||
        Number(data.avg) > 0 ||
        Number(data.max) > 0 ||
        Number(data.min) > 0 ||
        Number(data.totalCo2Kg) > 0 ||
        (data.dataPoints && data.dataPoints.length > 0));

    setHasData(!!dataAvailable);

    setCurrentCpu(data.current);
    setAvgCpu(data.avg);
    setMaxCpu(data.max);
    setMinCpu(data.min);

setCpuLabel(`${data.current} ${data.unit}`);
setTotalCarbon(data.totalCo2Kg || 0);
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
  loadCarbonMetrics(machineToLoad, selectedRange);
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
    loadCarbonMetrics(activeMachine, selectedRange);
  }
}, [activeMachine, selectedRange]);

useEffect(() => {
  if (!activeMachine) return;

  const interval = setInterval(() => {
    loadCarbonMetrics(activeMachine, selectedRange);
  }, 120000);

  return () => clearInterval(interval);
}, [activeMachine, selectedRange]);

  return (
    <MainLayout title="Carbon Monitoring">
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
  loadCarbonMetrics(activeMachine, range);
}}

  onMachineChange={(machineId) => {
  localStorage.setItem(
    "selectedMachine",
    machineId
  );

  setActiveMachine(machineId);
loadCarbonMetrics(machineId, selectedRange);
}}
  onAddMachine={() => setShowMachineModal(true)}
  onRefresh={() =>
  loadCarbonMetrics(activeMachine, selectedRange)
}
/>

        {/* CARBON Usage Main Card */}
        <div className="cpu-usage-card">
          {(isLoading || !hasData) && (
            <MetricState
              loading={isLoading}
              message="No Carbon data available"
              icon={<LuLeaf />}
            />
          )}
          <div className="cpu-card-header">
            <div className="cpu-title-left">
              <div
  className="cpu-icon-box"
  style={{
  background: "var(--success-bg)",
  color: "var(--success-color)",
}}
>
                <LuLeaf />
              </div>
              <h2>Carbon Footprint</h2>
            </div>
            
            <div className="cpu-stats-right">
              <div className="stat-summary-item">
                <span className="stat-lbl">Current</span>
                <span
  className="stat-val highlight"
  style={{ color: "var(--success-color)" }}
>
{currentCpu} g CO₂/hr
</span>


              </div>
              <div className="stat-summary-item">
                <span className="stat-lbl">Avg</span>
                <span className="stat-val">{avgCpu} g CO₂/hr</span>
              </div>
              <div className="stat-summary-item">
                <span className="stat-lbl">Max</span>
                <span className="stat-val">{maxCpu} g CO₂/hr</span>
              </div>
            </div>
          </div>

          {/* Area Chart Container */}
          <div className="cpu-chart-wrapper">
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart
  data={chartData}
  margin={{ top: 10, right: 20, left: 35, bottom: 0 }}
>
                <defs>
                  <linearGradient id="chartCarbonGradient" x1="0" y1="0" x2="0" y2="1">
  <stop offset="5%" style={{ stopColor: "var(--chart-1)", stopOpacity: 0.2 }} />
  <stop offset="95%" style={{ stopColor: "var(--chart-1)", stopOpacity: 0 }} />
</linearGradient>
                </defs>
                
                <CartesianGrid
                  strokeDasharray="0"
                  style={{ stroke: "var(--border-color)" }}
                  vertical={false}
                />
                
                <XAxis
  dataKey="displayTime"
  type="category"
  interval={0}
  tickFormatter={(value) =>
    value.startsWith("point-") ? "" : value
  }
  style={{
    stroke: "var(--text-muted)",
    fontSize: 12,
    fontWeight: 500,
  }}
  tickLine={false}
  dy={10}
/>
                
                <YAxis
  domain={[
    (dataMin) => Number((dataMin - 0.2).toFixed(2)),
    (dataMax) => Number((dataMax + 0.2).toFixed(2)),
  ]}
  tickFormatter={(val) => `${val} g CO₂/hr`}
  style={{ stroke: "var(--text-muted)", fontSize: 12, fontWeight: 500 }}
  tickLine={false}
  
/>
                
                <Tooltip
  labelFormatter={() => ""}
  formatter={(value) => [
    `${Number(value).toFixed(2)} g CO₂/hr`,
    "Carbon Footprint",
  ]}
  contentStyle={{
    background: "var(--card-bg)",
    border: "1px solid var(--border-color)",
    borderRadius: "8px",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
    fontSize: "12px",
    fontFamily: "inherit",
  }}
/>

                <Area
                  type="monotone"
                  dataKey="usage"
                  style={{ stroke: "var(--chart-1)" }}
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#chartCarbonGradient)"


                />
              </AreaChart>
            </ResponsiveContainer>
            
            {/* Center X-Axis Custom Label */}
            <div className="chart-x-label">
  TIME ({selectedRange.replace("Last ", "").toUpperCase()})
</div>
          </div>

          {/* Footer Card Statistics */}
          

<div className="power-bottom-section">

  <div className="energy-card">
    <h3>🍃 Total Carbon Emitted</h3>

    <div className="energy-value">
      {totalCarbon} kg CO₂
    </div>

    <p>
      Estimated CO₂ emitted during the selected time range.
    </p>
  </div>

  <div className="stats-card">
    <div className="footer-metric-col">
      <span className="metric-lbl">Min</span>
      <strong className="metric-val">{minCpu} g CO₂/hr</strong>
    </div>

    <div className="footer-metric-col">
      <span className="metric-lbl">Avg</span>
      <strong className="metric-val">{avgCpu} g CO₂/hr</strong>
    </div>

    <div className="footer-metric-col">
      <span className="metric-lbl">Max</span>
      <strong className="metric-val">{maxCpu} g CO₂/hr</strong>
    </div>
  </div>

</div>

        </div>
      </div>
      <AddMachineModal
        open={showMachineModal}
        onClose={() => setShowMachineModal(false)}
        projectId={projectId}
      />
    </MainLayout>
  );
};

export default CarbonPage;