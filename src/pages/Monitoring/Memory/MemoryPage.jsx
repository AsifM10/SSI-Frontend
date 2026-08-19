import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { FiDatabase } from "react-icons/fi";
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

import { getMachinesByProject } from "../../../services/machineService";
import { getMemoryMetrics } from "../../../services/memoryService";
import useMonitoringProjects from "../../../hooks/useMonitoringProjects";

import "./MemoryPage.css";

const MemoryPage = () => {
  const { projectId } = useParams();

  const [showMachineModal, setShowMachineModal] = useState(false);
  const { projects, onProjectChange } = useMonitoringProjects(projectId);

  const [machines, setMachines] = useState([]);
  const [activeMachine, setActiveMachine] = useState(
  localStorage.getItem("selectedMachine") || ""
);

  const [chartData, setChartData] = useState([]);

  const [currentMemory, setCurrentMemory] = useState(0);
  const [avgMemory, setAvgMemory] = useState(0);
  const [maxMemory, setMaxMemory] = useState(0);
  const [minMemory, setMinMemory] = useState(0);

  const [usedMemory, setUsedMemory] = useState(0);
  const [totalMemory, setTotalMemory] = useState(0);
  const [memoryUnit, setMemoryUnit] = useState("GB");
  const [selectedRange, setSelectedRange] = useState("Last 15 Minutes");

  const [isLoading, setIsLoading] = useState(false);
  const [hasData, setHasData] = useState(true);

  useEffect(() => {
    const fetchMachines = async () => {
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
  loadMemoryMetrics(machineToLoad, selectedRange);
}
      } catch (error) {
        console.error("FETCH MACHINES ERROR:", error);
      }
    };

    if (projectId) {
      fetchMachines();
    }
  }, [projectId]);

  const loadMemoryMetrics = async (
  machineId,
  range = selectedRange
) => {
    try {
      setIsLoading(true);

      const data = await getMemoryMetrics(
  machineId,
  rangeMap[range]
);

      const dataAvailable =
      data &&
      (Number(data.current) > 0 ||
        Number(data.avg) > 0 ||
        Number(data.max) > 0 ||
        Number(data.min) > 0 ||
        Number(data.used) > 0 ||
        (data.dataPoints && data.dataPoints.length > 0));

      setHasData(!!dataAvailable);

      setCurrentMemory(data.current || 0);

      setAvgMemory(
        Number(
          (((data.avg || 0) / (data.total || 1)) * 100).toFixed(1)
        )
      );

      setMaxMemory(
        Number(
          (((data.max || 0) / (data.total || 1)) * 100).toFixed(1)
        )
      );

      setMinMemory(
        Number(
          (((data.min || 0) / (data.total || 1)) * 100).toFixed(1)
        )
      );

      setUsedMemory(data.used || 0);
      setTotalMemory(data.total || 0);
      setMemoryUnit(data.unit || "GB");

      const startLabel = {
  "Last 5 Minutes": "-5m",
  "Last 15 Minutes": "-15m",
  "Last 1 Hour": "-1h",
  "Last 6 Hours": "-6h",
  "Last 24 Hours": "-24h",
  "Last 7 Days": "-7d",
}[range];

const formattedChart = (data.dataPoints || []).map((point, index) => ({
  usage: Number(
    (((point.value || 0) / (data.total || 1)) * 100).toFixed(1)
  ),

  displayTime:
    index === 0
      ? startLabel
      : index === data.dataPoints.length - 1
      ? "now"
      : `point-${index}`,
}));

setChartData(formattedChart);

} catch (error) {
  console.error("MEMORY ERROR:", error);
  setHasData(false);
} finally {
  setIsLoading(false);
}
};



  
  useEffect(() => {
  if (activeMachine) {
    loadMemoryMetrics(activeMachine, selectedRange);
  }
}, [activeMachine, selectedRange]);



  return (
    <MainLayout title="Memory Monitoring">
      <div className="memory-monitoring-container animate-in animate-in-d1">
        <MonitoringHeader
  projects={projects}
  projectId={projectId}
  onProjectChange={onProjectChange}
  machines={machines}
  selectedRange={selectedRange}
  selectedMachine={activeMachine}

  onRangeChange={(range) => {
    setSelectedRange(range);
    loadMemoryMetrics(activeMachine, range);
  }}

  onMachineChange={(machineId) => {
    localStorage.setItem("selectedMachine", machineId);

    setActiveMachine(machineId);
    loadMemoryMetrics(machineId, selectedRange);
  }}

  onAddMachine={() => setShowMachineModal(true)}

  onRefresh={() =>
    loadMemoryMetrics(activeMachine, selectedRange)
  }
/>
          
        <div className="memory-usage-card">
          {(isLoading || !hasData) && (
            <MetricState
              loading={isLoading}
              message="No Memory data available"
              icon={<FiDatabase />}
            />
          )}
          <div className="memory-card-header">
            <div className="memory-title-left">
              <div className="memory-icon-box">
                <FiDatabase />
              </div>
              <h2>Memory Usage</h2>
            </div>

            <div className="memory-stats-right">
              <div className="stat-summary-item">
                <span className="stat-lbl">Current</span>
                <span className="stat-val highlight">
                  {usedMemory} / {totalMemory} {memoryUnit}
                  <span className="stat-pct-badge">
                    {currentMemory}%
                  </span>
                </span>
              </div>

              <div className="stat-summary-item">
                <span className="stat-lbl">Avg</span>
                <span className="stat-val">
                  {avgMemory}%
                </span>
              </div>

              <div className="stat-summary-item">
                <span className="stat-lbl">Max</span>
                <span className="stat-val">
                  {maxMemory}%
                </span>
              </div>
            </div>
          </div>

          <div className="memory-chart-wrapper">
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart
                data={chartData}
                margin={{
                  top: 10,
                  right: 10,
                  left: -20,
                  bottom: 0,
                }}
              >
                <defs>
                  <linearGradient
                    id="chartMemoryGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      style={{ stopColor: "var(--chart-1)", stopOpacity: 0.15 }}
                    />
                    <stop
                      offset="95%"
                      style={{ stopColor: "var(--chart-1)", stopOpacity: 0 }}
                    />
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
  stroke="#94a3b8"
  fontSize={12}
  fontWeight={500}
  tickLine={false}
  dy={10}
/>

                <YAxis
                  domain={[0, 100]}
                  ticks={[0, 25, 50, 75, 100]}
                  tickFormatter={(value) => `${value}%`}
                  style={{ stroke: "var(--text-muted)", fontSize: 12, fontWeight: 500 }}
                  tickLine={false}
                  dx={-10}
                />

                <Tooltip
                  labelFormatter={() => ""}
                  formatter={(value) => [
                    `${Number(value).toFixed(1)}%`,
                    "Memory Usage",
                  ]}
                  contentStyle={{
                    background: "var(--card-bg)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "8px",
                    boxShadow:
                      "0 4px 6px -1px rgba(0,0,0,0.05)",
                    fontSize: "12px",
                  }}
                />

                <Area
                  type="monotone"
                  dataKey="usage"
                  style={{ stroke: "var(--chart-1)" }}
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#chartMemoryGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>

<div className="chart-x-label">
  TIME ({selectedRange.toUpperCase().replace("LAST ", "")})
</div>
          </div>

          <div className="memory-card-footer">
            <div className="footer-metric-col">
              <span className="metric-lbl">Min</span>
              <strong className="metric-val">
                {minMemory}%
              </strong>
            </div>

            <div className="footer-metric-col">
              <span className="metric-lbl">Avg</span>
              <strong className="metric-val">
                {avgMemory}%
              </strong>
            </div>

            <div className="footer-metric-col">
              <span className="metric-lbl">Max</span>
              <strong className="metric-val">
                {maxMemory}%
              </strong>
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

const rangeMap = {
  "Last 5 Minutes": "5m",
  "Last 15 Minutes": "15m",
  "Last 1 Hour": "1h",
  "Last 6 Hours": "6h",
  "Last 24 Hours": "24h",
  "Last 7 Days": "7d",
};

export default MemoryPage;