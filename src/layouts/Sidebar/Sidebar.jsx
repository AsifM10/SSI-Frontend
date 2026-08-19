import {
  HomeOutlined,
  ApartmentOutlined,
  AlertOutlined,
  BarChartOutlined,
  FileTextOutlined,
  UserOutlined,
  DesktopOutlined,
} from "@ant-design/icons";

import { NavLink } from "react-router-dom";
import { useSelector } from "react-redux";
import { useState, useEffect } from "react";
import { selectUser } from "../../store/slices/authSlice";
import { getProjectsForUser } from "../../services/projectService";

import "./Sidebar.css";

const Sidebar = ({ collapsed }) => {
  const user = useSelector(selectUser) || {};
  const canViewReports =
    user.role === "CENTRAL_ADMIN" || user.role === "DEPT_ADMIN";

  const isDeptUser = user.role === "DEPT_ADMIN" || user.role === "DEPT_VIEWER";

  // Dept users land directly on their department's project list,
  // while central users see the full departments overview.
  const departmentsTo =
    isDeptUser && user.deptId ? `/departments/${user.deptId}` : "/departments";
  const departmentsLabel = isDeptUser ? "Projects" : "Departments";

  const [fallbackProjectId, setFallbackProjectId] = useState(null);

  const lastProject = localStorage.getItem("lastMonitoringProject");
  const lastProjectValid =
    lastProject &&
    lastProject !== "undefined" &&
    lastProject !== "null" &&
    !Number.isNaN(Number(lastProject));

  useEffect(() => {
    if (lastProjectValid) return;

    let cancelled = false;
    const loadDefaultProject = async () => {
      try {
        const data = await getProjectsForUser(user);
        if (!cancelled && data && data.length > 0) {
          const withMachines = data.find(
            (p) => Number(p.machineCount) > 0
          );
          const firstProjectId = (withMachines || data[0]).projectId;
          setFallbackProjectId(firstProjectId);
          localStorage.setItem("lastMonitoringProject", firstProjectId);
        }
      } catch (err) {
        console.error("Failed to resolve default monitoring project:", err);
      }
    };
    loadDefaultProject();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const monitoringProjectId = lastProjectValid ? lastProject : fallbackProjectId;
  const monitoringTo = monitoringProjectId
    ? `/monitoring/${monitoringProjectId}`
    : "/departments";
  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="sidebar-top">
        <div className="sidebar-logo">
          <div className="logo-icon">
            <DesktopOutlined />
          </div>

          {!collapsed && (
            <div>
              <h2>MONITORING</h2>
              <p>DASHBOARD</p>
            </div>
          )}
        </div>

        <div className="sidebar-menu">
          <NavLink
            to="/dashboard"
            end
            className={({ isActive }) =>
              `sidebar-menu-item ${isActive ? "active" : ""}`
            }
            style={{ '--item-accent': '#4F46E5' }}
          >
            <HomeOutlined />
            {!collapsed && <span>Dashboard</span>}
          </NavLink>

          <NavLink
            to={departmentsTo}
            className={({ isActive }) =>
              `sidebar-menu-item ${isActive ? "active" : ""}`
            }
            style={{ '--item-accent': '#F59E0B' }}
          >
            <ApartmentOutlined />
            {!collapsed && <span>{departmentsLabel}</span>}
          </NavLink>

          <NavLink
            to={monitoringTo}
            className={({ isActive }) =>
              `sidebar-menu-item ${isActive ? "active" : ""}`
            }
            style={{ '--item-accent': '#10B981' }}
          >
            <BarChartOutlined />
            {!collapsed && <span>Monitoring</span>}
          </NavLink>

          {canViewReports && (
            <NavLink
              to="/reports"
              className={({ isActive }) =>
                `sidebar-menu-item ${isActive ? "active" : ""}`
              }
              style={{ '--item-accent': '#06B6D4' }}
            >
              <FileTextOutlined />
              {!collapsed && <span>Reports</span>}
            </NavLink>
          )}

          <NavLink
            to="/alerts"
            className={({ isActive }) =>
              `sidebar-menu-item ${isActive ? "active" : ""}`
            }
            style={{ '--item-accent': '#F43F5E' }}
          >
            <AlertOutlined />
            {!collapsed && <span>Alerts</span>}
          </NavLink>

          <NavLink
            to="/users"
            className={({ isActive }) =>
              `sidebar-menu-item ${isActive ? "active" : ""}`
            }
            style={{ '--item-accent': '#8B5CF6' }}
          >
            <UserOutlined />
            {!collapsed && <span>Users</span>}
          </NavLink>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
