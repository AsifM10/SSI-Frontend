import { useState, useEffect } from "react";
import { getMachinesByProject } from "../../../services/machineService";
import { getGpuMetrics } from "../../../services/gpuService";
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
import useMonitoringProjects from "../../../hooks/useMonitoringProjects";
import "./GpuPage.css";

// Machine configurations for GPU monitoring

const GpuPage = () => {
  const { projectId } = useParams();
const [showMachineModal, setShowMachineModal] = useState(false);
const { projects, onProjectChange } = useMonitoringProjects(projectId);

const [machines, setMachines] = useState([]);
const [activeMachine, setActiveMachine] = useState(
  localStorage.getItem("selectedMachine") || ""
);

const [chartData, setChartData] = useState([]);

const [currentGpu, setCurrentGpu] = useState(0);
const [avgGpu, setAvgGpu] = useState(0);
const [maxGpu, setMaxGpu] = useState(0);
const [minGpu, setMinGpu] = useState(0);

const [hasGpu, setHasGpu] = useState(false);
const [gpuLabel, setGpuLabel] = useState("");
const [selectedRange, setSelectedRange] = useState("Last 15 Minutes");

const [isLoading, setIsLoading] = useState(false);


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

  const machineObj =
    data.find(
      (m) => m.machineId === Number(machineToLoad)
    );

  loadGpuMetrics(machineToLoad, selectedRange, machineObj);
}
    
    } catch (error) {
      console.error(error);
    }
  };

  if (projectId) {
    fetchMachines();
  }
}, [projectId]);


const rangeMap = {
  "Last 5 Minutes": "5m",
  "Last 15 Minutes": "15m",
  "Last 1 Hour": "1h",
  "Last 6 Hours": "6h",
  "Last 24 Hours": "24h",
  "Last 7 Days": "7d",
};


const machineHasGpu = (machine) =>
  Boolean(
    machine &&
      (Number(machine.gpuCount) > 0 ||
        (machine.gpuModel &&
          machine.gpuModel.trim() !== "" &&
          machine.gpuModel !== "None" &&
          machine.gpuModel !== "N/A"))
  );

const loadGpuMetrics = async (
  machineId,
  range = selectedRange,
  machine
) => {
  try {
    setIsLoading(true);

    const data = await getGpuMetrics(
  machineId,
  rangeMap[range]
);

    const hasGpuNow =
      (machine
        ? machineHasGpu(machine)
        : machines.some(
            (m) =>
              Number(m.machineId) === Number(machineId) &&
              machineHasGpu(m)
          )) ||
      Number(data.total) > 0;

    setHasGpu(hasGpuNow);

    if (!hasGpuNow) {
      setCurrentGpu(0);
      setAvgGpu(0);
      setMaxGpu(0);
      setMinGpu(0);
      setGpuLabel("");
      setChartData([]);
      return;
    }

    setCurrentGpu(data.current || 0);
    setAvgGpu(data.avg || 0);
    setMaxGpu(data.max || 0);
    setMinGpu(data.min || 0);

    setGpuLabel(
      `${data.used || 0} / ${data.total || 0} ${data.unit || ""}`
    );

    const startLabel = {
  "Last 5 Minutes": "-5m",
  "Last 15 Minutes": "-15m",
  "Last 1 Hour": "-1h",
  "Last 6 Hours": "-6h",
  "Last 24 Hours": "-24h",
  "Last 7 Days": "-7d",
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
    console.error(error);

    setHasGpu(false);
    setCurrentGpu(0);
    setAvgGpu(0);
    setMaxGpu(0);
    setMinGpu(0);
    setGpuLabel("");
    setChartData([]);
  } finally {
    setIsLoading(false);
  }
};

useEffect(() => {
  if (activeMachine) {
    const machine = machines.find(
      (m) => Number(m.machineId) === Number(activeMachine)
    );

    loadGpuMetrics(activeMachine, selectedRange, machine);
  }
}, [activeMachine, selectedRange]);



  return (
    <MainLayout title="GPU Monitoring">
      <div className="gpu-monitoring-container animate-in animate-in-d1">


        <MonitoringHeader
  projects={projects}
  projectId={projectId}
  onProjectChange={onProjectChange}
  machines={machines}
  selectedMachine={activeMachine}
  selectedRange={selectedRange}
  onRangeChange={(range) => {
  setSelectedRange(range);
  loadGpuMetrics(activeMachine, range);
}}
  onMachineChange={(machineId) => {
  localStorage.setItem(
    "selectedMachine",
    machineId
  );

  setActiveMachine(machineId);
  loadGpuMetrics(machineId);
}}
  onAddMachine={() => setShowMachineModal(true)}
  onRefresh={() =>
  loadGpuMetrics(activeMachine)
}
/>

        {/* GPU Usage Main Card */}
        <div className="gpu-usage-card">
          {(isLoading || !hasGpu) && (
            <MetricState
              loading={isLoading}
              message="No GPU available"
              icon={<FiCpu />}
            />
          )}
          <div className="gpu-card-header">
            <div className="gpu-title-left">
              <div className="gpu-icon-box">
                <FiCpu />
              </div>
              <h2>GPU Usage</h2>
            </div>
            
            <div className="gpu-stats-right">
              {hasGpu ? (
                <>
                  <div className="stat-summary-item">
                    <span className="stat-lbl">Current</span>
                    <span className="stat-val highlight">{currentGpu}%</span>
                  </div>
                  <div className="stat-summary-item">
                    <span className="stat-lbl">Avg</span>
                    <span className="stat-val">{avgGpu}%</span>
                  </div>
                  <div className="stat-summary-item">
                    <span className="stat-lbl">Max</span>
                    <span className="stat-val">{maxGpu}%</span>
                  </div>
                </>
              ) : (
                <span className="gpu-no-available-tag">No GPU Available</span>
              )}
            </div>
          </div>

          {/* Area Chart Container */}
          <div className="gpu-chart-wrapper">
            {hasGpu ? (
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="chartGpuGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" style={{ stopColor: "var(--chart-3)", stopOpacity: 0.15 }} />
                      <stop offset="95%" style={{ stopColor: "var(--chart-3)", stopOpacity: 0 }} />
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
                    tickFormatter={(val) => `${val}%`}
                    style={{ stroke: "var(--text-muted)", fontSize: 12, fontWeight: 500 }}
                    tickLine={false}
                    dx={-10}
                  />
                  
                  <Tooltip
                    formatter={(value) => [`${value}%`, "GPU Usage"]}
                    labelFormatter={() => ""}
                    contentStyle={{
                      background: "var(--card-bg)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
                      fontSize: "12px",
                      fontFamily: "inherit"
                    }}
                  />

                  <Area
                    type="monotone"
                    dataKey="usage"
                    style={{ stroke: "var(--chart-3)" }}
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#chartGpuGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="no-gpu-wrapper">
                <FiCpu className="no-gpu-icon" />
                <h3>No GPU Available</h3>
                <p>This machine does not have a GPU installed or active.</p>
              </div>
            )}
            
            {/* Center X-Axis Custom Label */}
            <div className="chart-x-label">
  TIME ({selectedRange.toUpperCase().replace("LAST ", "")})
</div>
          </div>

          {/* Footer Card Statistics */}
          {hasGpu && (
            <div className="gpu-card-footer">
              <div className="footer-metric-col">
                <span className="metric-lbl">Min</span>
                <strong className="metric-val">{minGpu}%</strong>
              </div>
              <div className="footer-metric-col">
                <span className="metric-lbl">Avg</span>
                <strong className="metric-val">{avgGpu}%</strong>
              </div>
              <div className="footer-metric-col">
                <span className="metric-lbl">Max</span>
                <strong className="metric-val">{maxGpu}%</strong>
              </div>
            </div>
          )}
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

export default GpuPage;
