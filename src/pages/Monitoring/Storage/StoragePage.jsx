import { useParams } from "react-router-dom";
import { getMachinesByProject } from "../../../services/machineService";
import { getStorageMetrics } from "../../../services/storageService";


import { useState, useEffect } from "react";
import { FiHardDrive } from "react-icons/fi";
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
import "./StoragePage.css";

// Machine configurations for Storage monitoring


const StoragePage = () => {
  const { projectId } = useParams();
const { projects, onProjectChange } = useMonitoringProjects(projectId);

const [machines, setMachines] = useState([]);
const [activeMachine, setActiveMachine] = useState(
  localStorage.getItem("selectedMachine") || ""
);

const [showMachineModal, setShowMachineModal] = useState(false);

const [chartData, setChartData] = useState([]);
const rangeMap = {
  "Last 5 Minutes": "5m",
  "Last 15 Minutes": "15m",
  "Last 1 Hour": "1h",
  "Last 6 Hours": "6h",
  "Last 24 Hours": "24h",
  
};

const [selectedRange, setSelectedRange] = useState("Last 15 Minutes");

const [currentRead, setCurrentRead] = useState(0);
const [currentWrite, setCurrentWrite] = useState(0);

const [currentStorage, setCurrentStorage] = useState(0);

const [usedStorage, setUsedStorage] = useState(0);

const [totalStorage, setTotalStorage] = useState(0);

const [storageUnit, setStorageUnit] = useState("GB");

const [avgStorage, setAvgStorage] = useState(0);

const [minStorage, setMinStorage] = useState(0);

const [maxStorage, setMaxStorage] = useState(0);

const [isLoading, setIsLoading] = useState(false);
const [hasData, setHasData] = useState(true);



// 👇 PASTE HERE
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
  loadStorageMetrics(machineToLoad, selectedRange);
}
    } catch (error) {
      console.error(error);
    }
  };

  if (projectId) {
    fetchMachines();
  }
}, [projectId]);



const loadStorageMetrics = async (
  machineId,
  range = selectedRange
) => {
  try {
    setIsLoading(true);

    const data = await getStorageMetrics(
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

    setCurrentStorage(data.current || 0);
    setUsedStorage(data.used || 0);
    setTotalStorage(data.total || 0);
    setCurrentRead(data.used || 0);
    setCurrentWrite(data.total || 0);
    setStorageUnit(data.unit || "GB");

    setAvgStorage(
      Number((((data.avg || 0) / (data.total || 1)) * 100).toFixed(1))
    );

    setMinStorage(
      Number((((data.min || 0) / (data.total || 1)) * 100).toFixed(1))
    );

    setMaxStorage(
      Number((((data.max || 0) / (data.total || 1)) * 100).toFixed(1))
    );

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
  console.error("STORAGE ERROR:", error);
  setHasData(false);
} finally {
  setIsLoading(false);
}
};

useEffect(() => {
  if (activeMachine) {
    loadStorageMetrics(activeMachine, selectedRange);
  }
}, [activeMachine, selectedRange]);


useEffect(() => {
  if (!activeMachine) return;

  const interval = setInterval(() => {
    loadStorageMetrics(activeMachine, selectedRange);
  }, 120000);

  return () => clearInterval(interval);
}, [activeMachine, selectedRange]);

  return (
    <MainLayout title="Storage Monitoring">
      <div className="storage-monitoring-container animate-in animate-in-d1">
        <MonitoringHeader
  projects={projects}
  projectId={projectId}
  onProjectChange={onProjectChange}
  machines={machines}
  selectedMachine={activeMachine}
  selectedRange={selectedRange}
  onRangeChange={(range) => {
  setSelectedRange(range);
  loadStorageMetrics(activeMachine, range);
}}
  onMachineChange={(machineId) => {
  localStorage.setItem(
    "selectedMachine",
    machineId
  );

  setActiveMachine(machineId);
  loadStorageMetrics(machineId, selectedRange);
}}
  onAddMachine={() => setShowMachineModal(true)}
  onRefresh={() =>
  loadStorageMetrics(activeMachine, selectedRange)
}
/>

        {/* Main Grid for Different UI Layout */}
        <div className="storage-main-grid">
          {(isLoading || !hasData) && (
            <MetricState
              loading={isLoading}
              message="No Storage data available"
              icon={<FiHardDrive />}
            />
          )}
          
          {/* Left Column: Disk Partition Usage List */}
          <div className="storage-left-col">
            <div className="disk-card">
              <div className="disk-card-header">
                <div className="disk-title-left">
                  <div className="disk-icon-box">
                    <FiHardDrive />
                  </div>
                  <div>
                    <h3>Disk Partitions</h3>
                    <p>Overview of mount points</p>
                  </div>
                </div>
                <div className="disk-summary-badge">
  {currentStorage}%
</div>
              </div>

              <div className="disk-partitions-list">

  <div className="partition-item">

    <div className="partition-meta">
      <span className="partition-path">Main Storage</span>

      <span className="partition-usage-text">
        {usedStorage} / {totalStorage} {storageUnit}
      </span>

    </div>

    <div className="partition-progress-bar-wrapper">
      <div
        className="partition-progress-bar-fill healthy"
        style={{ width: `${currentStorage}%` }}
      />
    </div>

    <div className="partition-pct-row">
      <span className="partition-status-lbl text-healthy">
        HEALTHY
      </span>

      <span className="partition-pct">
        {currentStorage}%
      </span>

    </div>

  </div>

</div>
            </div>
          </div>

          {/* Right Column: Disk I/O Activity Chart */}
          <div className="storage-right-col">
            <div className="disk-io-card">
              <div className="disk-io-header">
                <div className="disk-io-title-left">
                  <h3>Storage Usage</h3>
<p>
  Storage usage over the {selectedRange.toLowerCase()}
</p>
                </div>
                
                <div className="io-stats-right">
                  <div className="io-stat-item">
                    <span className="io-stat-lbl">Used</span>
<span className="io-stat-val text-read">
  {currentRead} {storageUnit}
</span>
                  </div>
                  <div className="io-stat-item">
                    <span className="io-stat-lbl">Total</span>
<span className="io-stat-val text-write">
  {currentWrite} {storageUnit}
</span>
                  </div>
                </div>
              </div>

              <div className="disk-io-chart-wrapper">
                <ResponsiveContainer width="100%" height={260}>
                

                 <AreaChart
  data={chartData}
  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
>
  <defs>
    <linearGradient id="storageGradient" x1="0" y1="0" x2="0" y2="1">
      <stop offset="5%" style={{ stopColor: "var(--chart-1)", stopOpacity: 0.15 }} />
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
  stroke="#94a3b8"
  fontSize={12}
  fontWeight={500}
  tickLine={false}
  dy={10}
/>

  <YAxis
    domain={[0, 100]}
    ticks={[0, 25, 50, 75, 100]}
    tickFormatter={(v) => `${v}%`}
    style={{ stroke: "var(--text-muted)", fontSize: 12 }}
    tickLine={false}
  />

  <Tooltip
  labelFormatter={() => ""}
formatter={(value) => [
  `${Number(value).toFixed(1)}%`,
  "Storage Usage",
]}  />

  <Area
  type="monotone"
  dataKey="usage"
  style={{ stroke: "var(--chart-1)" }}
  strokeWidth={2.5}
  fill="url(#storageGradient)"
  fillOpacity={1}
  isAnimationActive={false}
/>
</AreaChart>

                </ResponsiveContainer>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Grid: Disk Health & Parameters */}
        <div className="storage-health-grid">
          
          <div className="health-card">
  <span className="health-lbl">Total Capacity</span>
  <strong className="health-val">
    {totalStorage} {storageUnit}
  </strong>
</div>

         <div className="health-card">
  <span className="health-lbl">Storage Usage</span>
  <div className="smart-badge-wrapper">
    <span className="smart-badge">{currentStorage}%</span>
  </div>
</div>

          <div className="health-card">
  <span className="health-lbl">Used Space</span>
  <strong className="health-val">
    {usedStorage} {storageUnit}
  </strong>
</div>

         <div className="health-card">
  <span className="health-lbl">Free Space</span>
  <strong className="health-val">
    {(totalStorage - usedStorage).toFixed(1)} {storageUnit}
  </strong>
</div>

          <div className="health-card">
  <span className="health-lbl">Usage</span>
  <strong className="health-val">
    {currentStorage}%
  </strong>
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

export default StoragePage;
