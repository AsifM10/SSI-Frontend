import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  DesktopOutlined,
  HddOutlined,
  DatabaseOutlined,
  ControlOutlined,
  WifiOutlined,
} from "@ant-design/icons";
import MainLayout from "../../layouts/MainLayout/MainLayout";
import { getMachinesByProject } from "../../services/machineService";
import { getProjectSummary } from "../../services/projectService";
import "./ProjectDetails.css";

const statusIcon = {
  Healthy: <span className="status-badge healthy">Healthy</span>,
  Warning: <span className="status-badge warning">Warning</span>,
  Critical: <span className="status-badge critical">Critical</span>,
};

const machineStatusIcon = {
  Healthy: <span className="status-badge healthy">Healthy</span>,
  Warning: <span className="status-badge warning">Warning</span>,
  Critical: <span className="status-badge critical">Critical</span>,
  Offline: <span className="status-badge offline">Offline</span>,
};

const ProjectDetails = () => {
  const { projectId } = useParams();
  const [machines, setMachines] = useState([]);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMachines = async () => {
      try {
        const projectData = await getProjectSummary(projectId);
        setProject(projectData);
        const data = await getMachinesByProject(projectId);
        setMachines(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchMachines();
  }, [projectId]);

  return (
    <MainLayout title="Project Details">
      <div className="project-details-page">
        {project && (
          <div className="project-summary-card animate-in animate-in-d1">
            <h1>{project.projectName}</h1>
            <p className="project-summary-desc">{project.projectDescription}</p>
            <div className="project-stats-grid">
              <div className="project-stat-item">
                <small>Status</small>
                <h3>{statusIcon[project.status] || project.status}</h3>
              </div>
              <div className="project-stat-item">
                <small>Department</small>
                <h3>{project.deptName}</h3>
              </div>
              <div className="project-stat-item">
                <small>Machines</small>
                <h3>{project.machineCount}</h3>
              </div>
              <div className="project-stat-item">
                <small>Health</small>
                <h3>{statusIcon[project.overallMachineStatus] || (
                  <span className="status-badge no-machines">{project.overallMachineStatus}</span>
                )}</h3>
              </div>
              <div className="project-stat-item">
                <small>CPU</small>
                <h3>{project.totalCpuCores} Cores</h3>
              </div>
              <div className="project-stat-item">
                <small>Memory</small>
                <h3>{project.totalMemoryGb} GB</h3>
              </div>
              <div className="project-stat-item">
                <small>Storage</small>
                <h3>{project.totalStorageGb} GB</h3>
              </div>
              <div className="project-stat-item">
                <small>GPU</small>
                <h3>{project.gpuSummary}</h3>
              </div>
            </div>
          </div>
        )}

        <div className="section-header animate-in animate-in-d2">Machines</div>

        {loading ? (
          <div className="loading-container">Loading machines...</div>
        ) : machines.length === 0 ? (
          <div className="loading-container">No machines found for this project.</div>
        ) : (
          <div className="machines-grid">
            {machines.map((machine, i) => (
              <div
                key={machine.machineId}
                className="machine-card animate-in"
                style={{ animationDelay: `${i * 0.06}s` }}
              >
                <div className="machine-card-header">
                  <h3><DesktopOutlined style={{ marginRight: 8, color: "var(--primary-color)" }} />{machine.hostname}</h3>
                  {machineStatusIcon[machine.status] || (
                    <span className="status-badge offline">{machine.status}</span>
                  )}
                </div>
                <div className="machine-card-body">
                  <div className="machine-info">
                    <span className="label"><WifiOutlined /> IP</span>
                    <span className="value">{machine.ipAddress}</span>
                  </div>
                  <div className="machine-info">
                    <span className="label"><HddOutlined /> OS</span>
                    <span className="value">{machine.osType}</span>
                  </div>
                  <div className="machine-info">
                    <span className="label"><ControlOutlined /> CPU</span>
                    <span className="value">{machine.cpuCores} Cores</span>
                  </div>
                  <div className="machine-info">
                    <span className="label"><DatabaseOutlined /> Memory</span>
                    <span className="value">{machine.memoryGb} GB</span>
                  </div>
                  <div className="machine-info">
                    <span className="label"><DatabaseOutlined /> Storage</span>
                    <span className="value">{machine.storageGb} GB</span>
                  </div>
                  <div className="machine-info">
                    <span className="label"><DesktopOutlined /> GPU</span>
                    <span className="value">{machine.gpuModel || "N/A"}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default ProjectDetails;
