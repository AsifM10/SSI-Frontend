import { useState, useEffect, useRef } from "react";
import { Link, NavLink, useParams } from "react-router-dom";
import { FiCpu } from "react-icons/fi";
import {
  CalendarOutlined,
  DownOutlined,
  DeleteOutlined,
  DashboardOutlined,
  DesktopOutlined,
  HddOutlined,
  DatabaseOutlined,
  ThunderboltFilled,
  ApartmentOutlined,
  EyeOutlined,
  EditOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";

import { getProjectSummary } from "../../../services/projectService";
import { useSetBreadcrumb } from "../../../context/BreadcrumbContext";
import MachineDetailsModal from "../MachineDetailsModal/MachineDetailsModal";

import "./MonitoringHeader.css";

const DEFAULT_TIME_RANGES = [
  "Last 5 Minutes",
  "Last 15 Minutes",
  "Last 1 Hour",
  "Last 6 Hours",
  "Last 24 Hours",
];

const TIME_RANGE_LABELS = {
  "Last 5 Minutes": "Last 5 min",
  "Last 15 Minutes": "Last 15 min",
  "Last 1 Hour": "Last 1 hr",
  "Last 6 Hours": "Last 6 hr",
  "Last 24 Hours": "Last 24 hr",
};

const LeafIcon = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
  </svg>
);

const MonitoringHeader = ({
  projects = [],
  projectId,
  onProjectChange,
  projectName,
  machines,
  selectedMachine,
  onMachineChange,
  onAddMachine,
  onDeleteMachine,
  onEditMachine,
  timeRanges = DEFAULT_TIME_RANGES,
  selectedRange = "Last 15 Minutes",
  onRangeChange,
  onRefresh,
  isRefreshing = false,
}) => {
  const [openDropdown, setOpenDropdown] = useState(null);
  const [projectInfo, setProjectInfo] = useState(null);
  const [showMachineDetails, setShowMachineDetails] = useState(false);
  const headerRef = useRef(null);

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const isCentral =
    currentUser.role === "CENTRAL_ADMIN" || currentUser.role === "CENTRAL_VIEWER";

  const { projectId: routeProjectId } = useParams();
  const activeProjectId = projectId || routeProjectId;

const loadProjectInfo = async () => {
  try {
    const data = await getProjectSummary(activeProjectId);

    setProjectInfo(data);
  } catch (error) {
    console.error("PROJECT INFO ERROR:", error);
  }
};


useEffect(() => {
  if (activeProjectId) {
    loadProjectInfo();
  }
}, [activeProjectId]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (headerRef.current && !headerRef.current.contains(e.target)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeProject =
    projects.find((p) => Number(p.projectId) === Number(activeProjectId)) ||
    projectInfo ||
    {};

  const activeMachine =
    machines.find((m) => Number(m.machineId) === Number(selectedMachine)) || {};

  const setBreadcrumb = useSetBreadcrumb();

  useEffect(() => {
    setBreadcrumb(
      <>
        <Link to="/dashboard" className="bc-link">Dashboard</Link>
        <span className="bc-sep">›</span>
        <Link to={`/departments/${projectInfo?.deptName}`} className="bc-link">
          {projectInfo?.deptName}
        </Link>
        <span className="bc-sep">›</span>
        <span className="bc-current">{projectInfo?.projectName}</span>
      </>
    );
  }, [projectInfo, setBreadcrumb]);

  const handleRangeClick = (range) => {
  setOpenDropdown(null);

  if (onRangeChange) {
    onRangeChange(range);
  }
};

const toggleDropdown = (which) => {
  setOpenDropdown((prev) => (prev === which ? null : which));
};

  return (
    <>
<div className="monitoring-header-wrapper" ref={headerRef}>
      <div className="monitoring-header">
        <div className="monitoring-header-top">
          <h1>{activeProject.projectName || projectName || "Project Monitoring"}</h1>

          <div className="monitoring-actions">
            <button
              className="machine-view-btn"
              title="Info"
              disabled={!selectedMachine}
              onClick={() => setShowMachineDetails(true)}
            >
              <InfoCircleOutlined />
              <span>Info</span>
            </button>
            {currentUser.role === "DEPT_ADMIN" && onAddMachine && (
              <button className="add-machine-btn" onClick={onAddMachine}>
                + Add Machine
              </button>
            )}
            {currentUser.role === "DEPT_ADMIN" && onEditMachine && (
              <button
                className="machine-edit-btn"
                title="Edit Machine"
                disabled={!selectedMachine}
                onClick={onEditMachine}
              >
                <EditOutlined />
              </button>
            )}
            {currentUser.role === "DEPT_ADMIN" && onDeleteMachine && (
              <button
                className="machine-delete-btn"
                title="Delete Machine"
                disabled={!selectedMachine}
                onClick={onDeleteMachine}
              >
                <DeleteOutlined />
              </button>
            )}

            <div className="time-dropdown-wrapper">
              <button
                className="time-btn"
                onClick={() => toggleDropdown("time")}
              >
                <CalendarOutlined />
                <span>{TIME_RANGE_LABELS[selectedRange] || selectedRange}</span>
                <DownOutlined />
              </button>

              {openDropdown === "time" && (
              <div className="time-dropdown-menu">
                {timeRanges.map((range) => (
                  <button
                    key={range}
                    className={`time-option ${selectedRange === range ? "active" : ""}`}
                    onClick={() => handleRangeClick(range)}
                  >
{TIME_RANGE_LABELS[range] || range}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="monitoring-switchers">
        <div className="selector-dropdown">
          <span className="machine-label">PROJECT</span>
          <button
            className="selector-btn"
            onClick={() => toggleDropdown("project")}
          >
            <ApartmentOutlined />
            <span className="selector-name">
              {activeProject.projectName || "Select Project"}
            </span>
            <DownOutlined className="selector-caret" />
          </button>

          {openDropdown === "project" && (
            <div className="selector-menu">
              {projects.map((p) => (
                <button
                  key={p.projectId}
                  className={`selector-option ${
                    Number(p.projectId) === Number(activeProjectId) ? "active" : ""
                  }`}
                  onClick={() => {
                    if (Number(p.projectId) !== Number(activeProjectId) && onProjectChange) {
                      onProjectChange(p.projectId);
                    }
                    setOpenDropdown(null);
                  }}
                >
                  <span className="sel-name">{p.projectName}</span>
                  {isCentral && p.deptName && (
                    <span className="sel-sub">{p.deptName}</span>
                  )}
                </button>
              ))}
              {projects.length === 0 && (
                <div className="selector-empty">No projects available</div>
              )}
            </div>
          )}
        </div>

        <div className="selector-dropdown selector-dropdown--machine">
          <span className="machine-label">MACHINE</span>
          <button
            className="selector-btn"
            onClick={() => toggleDropdown("machine")}
          >
            <DesktopOutlined />
            <span className="selector-name">
              {activeMachine.hostname || "Select Machine"}
            </span>
            <DownOutlined className="selector-caret" />
          </button>

          {openDropdown === "machine" && (
            <div className="selector-menu">
              {machines.map((m) => (
                <button
                  key={m.machineId}
                  className={`selector-option ${
                    Number(m.machineId) === Number(selectedMachine) ? "active" : ""
                  }`}
                  onClick={() => {
                    if (Number(m.machineId) !== Number(selectedMachine)) {
                      onMachineChange(m.machineId);
                    }
                    setOpenDropdown(null);
                  }}
                >
                  <span className="sel-name">{m.hostname}</span>
                  {m.ipAddress && <span className="sel-sub">{m.ipAddress}</span>}
                </button>
              ))}
              {machines.length === 0 && (
                <div className="selector-empty">No machines available</div>
              )}
            </div>
          )}
        </div>
      </div>

     <div className="monitoring-tabs">
  <NavLink to={`/monitoring/${projectId}`} end>
    <DashboardOutlined /> Overview
  </NavLink>

  <NavLink to={`/monitoring/${projectId}/cpu`}>
    <FiCpu style={{ fontSize: 15 }} /> CPU
  </NavLink>

  <NavLink to={`/monitoring/${projectId}/gpu`}>
    <DesktopOutlined /> GPU
  </NavLink>

  <NavLink to={`/monitoring/${projectId}/memory`}>
    <DatabaseOutlined /> Memory
  </NavLink>

  <NavLink to={`/monitoring/${projectId}/storage`}>
    <HddOutlined /> Storage
  </NavLink>

<NavLink to={`/monitoring/${projectId}/power`}>
    <ThunderboltFilled /> Power
  </NavLink>

<NavLink to={`/monitoring/${projectId}/carbon`}>
    <LeafIcon /> Carbon
  </NavLink>


 </div>
    </div>
    </div>

    <MachineDetailsModal
      open={showMachineDetails}
      machineId={selectedMachine}
      onClose={() => setShowMachineDetails(false)}
    />
    </>
  );
};

export default MonitoringHeader;
