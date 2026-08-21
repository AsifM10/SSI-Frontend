import {
  getMachinesByProject,
  deleteMachine,
} from "../../services/machineService"; 
import { getMachineOverview } from "../../services/metricsService";
import { getPowerMetrics } from "../../services/powerService";
import { getCarbonMetrics } from "../../services/carbonService";
import { LuLeaf } from "react-icons/lu";
import { useEffect, useState } from "react";
import { DesktopOutlined, ArrowLeftOutlined, ArrowRightOutlined } from "@ant-design/icons";
import { useParams, useNavigate } from "react-router-dom";
import { getProjectSummary } from "../../services/projectService";
import useMonitoringProjects from "../../hooks/useMonitoringProjects";

import MainLayout from "../../layouts/MainLayout/MainLayout";
import SystemInfoCard from "../../components/monitoring/SystemInfoCard/SystemInfoCard";
import AddMachineModal from "../../components/monitoring/AddMachineModal/AddMachineModal";
import MonitoringHeader from "../../components/monitoring/MonitoringHeader/MonitoringHeader";
import MetricCard from "../../components/monitoring/MetricCard/MetricCard";
import DeleteConfirmationModal from "../../components/modals/DeleteConfirmationModal/DeleteConfirmationModal";

import "./MonitoringDetails.css";

const timeRanges = [
  "Last 5 Minutes",
  "Last 15 Minutes",
  "Last 1 Hour",
  "Last 6 Hours",
  "Last 24 Hours",
  "Last 7 Days",
];

const rangeMap = {
  "Last 5 Minutes": "5m",
  "Last 15 Minutes": "15m",
  "Last 1 Hour": "1h",
  "Last 6 Hours": "6h",
  "Last 24 Hours": "24h",
  "Last 7 Days": "7d",
};

const buildMetricCards = (data, power, carbon) => {
  const cpuSparkline = (data.cpu?.sparkline || []).map((p) => p.value);
  const memSparkline = (data.memory?.sparkline || []).map((p) => p.value);
  const stoSparkline = (data.storage?.sparkline || []).map((p) => p.value);
  const powSparkline = (power?.dataPoints || []).map((p) => p.value);
  const carbSparkline = (carbon?.dataPoints || []).map((p) => p.value);

  return [
    {
      title: "CPU Usage",
      icon: "⚙",
      color: "#4f86f7",
      value: data.cpu?.percentage || 0,
      label: `${data.cpu?.used || 0} / ${data.cpu?.total || 0} Cores`,
      min: `${data.cpu?.min || 0}%`,
      avg: `${data.cpu?.avg || 0}%`,
      max: `${data.cpu?.max || 0}%`,
      sparklineData: cpuSparkline,
    },
    {
      title: "GPU Usage",
      icon: "▣",
      color: "#31c48d",
      value: data.gpu?.percentage || 0,
      label: data.gpu
        ? `${data.gpu.used} / ${data.gpu.total} GPU`
        : "No GPU",
      min: `${data.gpu?.min || 0}%`,
      avg: `${data.gpu?.avg || 0}%`,
      max: `${data.gpu?.max || 0}%`,
      sparklineData: [],
      emptyText: "No GPU available",
    },
    {
      title: "Memory Usage",
      icon: "▤",
      color: "#9b7cf6",
      value: data.memory?.percentage || 0,
      label: `${data.memory?.used || 0} / ${data.memory?.total || 0} GB`,
      min: `${data.memory?.min || 0}%`,
      avg: `${data.memory?.avg || 0}%`,
      max: `${data.memory?.max || 0}%`,
      sparklineData: memSparkline,
    },
    {
      title: "Storage Usage",
      icon: "◫",
      color: "#f4a93c",
      value: data.storage?.percentage || 0,
      label: `${data.storage?.used || 0} / ${data.storage?.total || 0} GB`,
      min: `${data.storage?.min || 0}%`,
      avg: `${data.storage?.avg || 0}%`,
      max: `${data.storage?.max || 0}%`,
      sparklineData: stoSparkline,
    },
    {
      title: "Power",
      icon: "⚡",
      color: "#e0535e",
      value: power?.current || 0,
      label: "W",
      min: `${power?.min || 0} W`,
      avg: `${power?.avg || 0} W`,
      max: `${power?.max || 0} W`,
      sparklineData: powSparkline,
      maxValue: power?.max || 0,
    },
    {
      title: "Carbon",
      icon: <LuLeaf />,
      color: "#38a169",
      value: carbon?.current || 0,
      label: carbon?.unit || "CO₂/hr",
      min: `${carbon?.min || 0} ${carbon?.unit || ""}`,
      avg: `${carbon?.avg || 0} ${carbon?.unit || ""}`,
      max: `${carbon?.max || 0} ${carbon?.unit || ""}`,
      sparklineData: carbSparkline,
      maxValue: carbon?.max || 0,
    },
  ];
};

const MonitoringDetails = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const { projects, onProjectChange } = useMonitoringProjects(projectId);

  useEffect(() => {
    if (!projectId || projectId === "undefined" || projectId === "null") {
      navigate("/dashboard", { replace: true });
    }
  }, [projectId]);

  useEffect(() => {
    const checkProjectAccess = async () => {
      if (!user || !projectId) return;
      if (user.role === "CENTRAL_ADMIN" || user.role === "CENTRAL_VIEWER") return;
      try {
        const project = await getProjectSummary(projectId);
        if (project && project.deptId && Number(project.deptId) !== Number(user.deptId)) {
          navigate("/dashboard");
        }
      } catch (err) {
        console.error("Project access check failed:", err);
      }
    };
    checkProjectAccess();
  }, [projectId]);

  const [showMachineModal, setShowMachineModal] = useState(false);
const [editingMachine, setEditingMachine] = useState(null);
const [deleteModal, setDeleteModal] = useState({ open: false, machineId: null, hostname: "", details: [] });

const [selectedRange, setSelectedRange] =
  useState("Last 15 Minutes");

const [isRefreshing, setIsRefreshing] =
  useState(false);

const [systemInfo, setSystemInfo] =
  useState({});

  const [machines, setMachines] =
  useState([]);

const [machinesLoaded, setMachinesLoaded] =
  useState(false);

useEffect(() => {
  if (!projectId) return;

  if (machines.length > 0) {
    localStorage.setItem("lastMonitoringProject", projectId);
  } else if (
    String(localStorage.getItem("lastMonitoringProject")) ===
    String(projectId)
  ) {
    localStorage.removeItem("lastMonitoringProject");
  }
}, [projectId, machines]);

const [selectedMachine, setSelectedMachine] =
  useState(localStorage.getItem("selectedMachine") || "");


const activeMachine =
  machines.find(
    (m) => m.machineId === Number(selectedMachine)
  ) || {};


  useEffect(() => {
  const fetchMetrics = async () => {
    if (!activeMachine?.machineId) return;

    try {
      const data = await getMachineOverview(
        activeMachine.machineId,
        rangeMap[selectedRange]
      );

      setSystemInfo(data.systemInfo || {});

      const powerPromise = getPowerMetrics(
        activeMachine.machineId,
        rangeMap[selectedRange]
      ).catch(() => null);
      const carbonPromise = getCarbonMetrics(
        activeMachine.machineId,
        rangeMap[selectedRange]
      ).catch(() => null);

      const [power, carbon] = await Promise.all([powerPromise, carbonPromise]);

      setMetrics(buildMetricCards(data, power, carbon));

      setRefreshKey((prev) => prev + 1);
    } catch (err) {
      console.error(err);
    }
  };

  fetchMetrics();
}, [activeMachine.machineId, selectedRange]);


  const [metrics, setMetrics] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [metricPage, setMetricPage] = useState(0);
  const [carouselPaused, setCarouselPaused] = useState(false);

  useEffect(() => {
    setMetricPage(0);
  }, [activeMachine.machineId]);

  const METRICS_PER_PAGE = 3;
  const totalPages = Math.ceil(metrics.length / METRICS_PER_PAGE);
  const metricPages = [];
  for (let i = 0; i < metrics.length; i += METRICS_PER_PAGE) {
    metricPages.push(metrics.slice(i, i + METRICS_PER_PAGE));
  }

  useEffect(() => {
    if (carouselPaused || totalPages <= 1) return;
    const t = setInterval(() => {
      setMetricPage((prev) => (prev + 1) % totalPages);
    }, 4500);
    return () => clearInterval(t);
  }, [carouselPaused, totalPages]);

  /* =========================
     FETCH MACHINES
  ========================= */

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

  setSelectedMachine(machineToLoad);
}
  } catch (error) {
    console.error(error);
  } finally {
    setMachinesLoaded(true);
  }
};

useEffect(() => {
  if (projectId) {
    fetchMachines();
  }
}, [projectId]);


  /* =========================
     LIVE DEMO UPDATE
  ========================= */


  const handleRefresh = async () => {
    if (!activeMachine?.machineId) return;
  setIsRefreshing(true);

  try {
    const data = await getMachineOverview(
  activeMachine.machineId,
  rangeMap[selectedRange]
);

    setSystemInfo(data.systemInfo || {});

    const powerPromise = getPowerMetrics(
      activeMachine.machineId,
      rangeMap[selectedRange]
    ).catch(() => null);
    const carbonPromise = getCarbonMetrics(
      activeMachine.machineId,
      rangeMap[selectedRange]
    ).catch(() => null);

    const [power, carbon] = await Promise.all([powerPromise, carbonPromise]);

    setMetrics(buildMetricCards(data, power, carbon));

    setRefreshKey((prev) => prev + 1);
  } catch (err) {
    console.error("Refresh failed:", err);
  } finally {
    setIsRefreshing(false);
  }
};

/* AUTO REFRESH EVERY 2 MINUTES */
useEffect(() => {
  if (!activeMachine?.machineId) return;

  const interval = setInterval(() => {
    handleRefresh();
  }, 120000);

  return () => clearInterval(interval);
}, [activeMachine.machineId, selectedRange]);

const handleDeleteMachine = () => {

  
  if (!selectedMachine) return;

  const machine = machines.find(
    (m) => m.machineId === selectedMachine
  );

  if (!machine) return;

  setDeleteModal({
    open: true,
    machineId: machine.machineId,
    hostname: machine.hostname,
    details: [
      { label: "Hostname", value: machine.hostname || "—" },
      { label: "IP Address", value: machine.ipAddress || "—" },
    ],
  });
};

const confirmDeleteMachine = async () => {
  const machineId = deleteModal.machineId;
  setDeleteModal({ open: false, machineId: null, hostname: "", details: [] });

  const data = await getMachinesByProject(projectId);
  setMachines(data);

  if (data.length > 0) {
    const stillExists = data.find((m) => m.machineId === machineId);
    setSelectedMachine(stillExists ? machineId : data[0].machineId);
  }
};

  if (!machinesLoaded) {
    return (
      <MainLayout title="Project Monitoring">
        <div className="monitoring-page animate-in animate-in-d1" style={{ padding: "30px" }}>
          <div className="loading-container">Loading machines...</div>
        </div>
      </MainLayout>
    );
  }

  if (machinesLoaded && machines.length === 0) {
    return (
      <MainLayout title="Project Monitoring">
        <div className="monitoring-page animate-in animate-in-d1" style={{ padding: "30px" }}>
          <div className="empty-machines-container" style={{ textAlign: "center", padding: "80px 20px" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px", color: "var(--text-muted)" }}>
              <DesktopOutlined />
            </div>
            <h2 style={{ color: "var(--text-primary)", marginBottom: "8px" }}>No Machines Found</h2>
            <p style={{ color: "var(--text-secondary)", marginBottom: "24px", fontSize: "14px" }}>
              This project doesn't have any machines yet. Add a machine to start monitoring.
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center", alignItems: "center" }}>
              <button
                className="back-to-monitoring-btn"
                onClick={() => {
                  const saved = localStorage.getItem("lastMonitoringProject");
                  const validSaved =
                    saved &&
                    saved !== "undefined" &&
                    saved !== "null" &&
                    !Number.isNaN(Number(saved));

                  if (validSaved && Number(saved) !== Number(projectId)) {
                    navigate(`/monitoring/${saved}`);
                    return;
                  }

                  const withMachines = (projects || []).find(
                    (p) =>
                      Number(p.machineCount) > 0 &&
                      Number(p.projectId) !== Number(projectId)
                  );

                  if (withMachines) {
                    navigate(`/monitoring/${withMachines.projectId}`);
                    return;
                  }

                  const isDeptUser =
                    user?.role === "DEPT_ADMIN" ||
                    user?.role === "DEPT_VIEWER";

                  navigate(
                    isDeptUser && user?.deptId
                      ? `/departments/${user.deptId}`
                      : "/departments"
                  );
                }}
              >
                <ArrowLeftOutlined /> Back to Monitoring
              </button>
              {user?.role === "DEPT_ADMIN" && (
                <button
                  className="add-machine-btn"
                  onClick={() => setShowMachineModal(true)}
                >
                  + Add Machine
                </button>
              )}
            </div>
          </div>
        </div>
        <AddMachineModal
          open={showMachineModal}
          onClose={() => {
            setShowMachineModal(false);
            setEditingMachine(null);
          }}
          projectId={projectId}
          machine={editingMachine}
          onMachineCreated={async () => {
            const data = await getMachinesByProject(projectId);
            setMachines(data);
          }}
        />
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Project Monitoring">
      <div className="monitoring-page animate-in animate-in-d1">
        <MonitoringHeader
          projects={projects}
          projectId={projectId}
          onProjectChange={onProjectChange}
          machines={machines}
          selectedMachine={selectedMachine}
          onMachineChange={(machineId) => {
  localStorage.setItem(
    "selectedMachine",
    machineId
  );

  setSelectedMachine(machineId);
}}
          onAddMachine={() => {
  setEditingMachine(null);
  setShowMachineModal(true);
}}

onEditMachine={() => {
  const machine = machines.find(
    (m) => m.machineId === selectedMachine
  );

  if (!machine) return;

  setEditingMachine(machine);
  setShowMachineModal(true);
}}
onDeleteMachine={handleDeleteMachine}

          timeRanges={timeRanges}
          selectedRange={selectedRange}
          onRangeChange={(range) => {
  setSelectedRange(range);
}}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
        />

        <div
          className="metrics-carousel"
          onMouseEnter={() => setCarouselPaused(true)}
          onMouseLeave={() => setCarouselPaused(false)}
        >
          <div className="metrics-carousel-viewport">
            <div
              className="metrics-carousel-track"
              style={{ transform: `translateX(-${metricPage * 100}%)` }}
            >
              {metricPages.map((group, gi) => (
                <div className="metrics-carousel-slide" key={gi}>
                  <div className="metrics-grid">
                    {group.map((metric) => (
                      <MetricCard
                        key={metric.title}
                        refreshKey={refreshKey}
                        title={metric.title}
                        icon={metric.icon}
                        color={metric.color}
                        value={metric.value}
                        label={metric.label}
                        min={metric.min}
                        avg={metric.avg}
                        max={metric.max}
                        sparklineData={metric.sparklineData}
                        unit={metric.unit}
                        maxValue={metric.maxValue}
                        emptyText={metric.emptyText}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {totalPages > 1 && (
            <div className="metrics-carousel-nav">
              <button
                className="metrics-nav-btn"
                onClick={() => setMetricPage((p) => Math.max(0, p - 1))}
                disabled={metricPage === 0}
                aria-label="Previous metrics"
              >
                <ArrowLeftOutlined />
              </button>

              <div className="metrics-carousel-dots">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    className={`metrics-dot ${metricPage === i ? "active" : ""}`}
                    onClick={() => setMetricPage(i)}
                    aria-label={`Go to page ${i + 1}`}
                  />
                ))}
              </div>

              <button
                className="metrics-nav-btn"
                onClick={() => setMetricPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={metricPage === totalPages - 1}
                aria-label="Next metrics"
              >
                <ArrowRightOutlined />
              </button>
            </div>
          )}
        </div>

        <SystemInfoCard
  systemInfo={systemInfo}
/>    
      </div>

<AddMachineModal
  open={showMachineModal}
  onClose={() => {
    setShowMachineModal(false);
    setEditingMachine(null);
  }}
  projectId={projectId}
  machine={editingMachine}
  onMachineCreated={async () => {
    const data = await getMachinesByProject(projectId);
    setMachines(data);
  }}
/>

      <DeleteConfirmationModal
        open={deleteModal.open}
        title="Delete Machine"
        entityName={deleteModal.hostname}
        description="Are you sure you want to delete this machine? The machine will no longer appear in monitoring dashboards and reports."
        details={deleteModal.details}
        deleteApi={`/api/machines/${deleteModal.machineId}`}
        onSuccess={confirmDeleteMachine}
        onCancel={() => setDeleteModal({ open: false, machineId: null, hostname: "", details: [] })}
      />
    </MainLayout>
  );
};

export default MonitoringDetails;