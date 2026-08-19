import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { selectUser } from "../../store/slices/authSlice";
import { DesktopOutlined } from "@ant-design/icons";
import MainLayout from "../../layouts/MainLayout/MainLayout";
import KpiStatsRow from "../cards/StatCard/KpiStatsRow";
import DashboardGuide from "./DashboardGuide";
import "../../pages/Dashboard/Dashboard.css";
import api from "../../services/api";

const DashboardOverview = () => {
  const [departments, setDepartments] = useState([]);
  const [counts, setCounts] = useState(null);
  const user = useSelector(selectUser);

  const isCentral =
    user?.role === "CENTRAL_ADMIN" || user?.role === "CENTRAL_VIEWER";

  const fetchDepartments = async () => {
    try {
      const token = localStorage.getItem("token");

      const url =
        isCentral
          ? "/api/departments/summary"
          : `/api/departments/summary/${user.deptId}`;

      const response = await api.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const raw = response.data?.data ?? [];
      const deptArray = Array.isArray(raw) ? raw : [raw].filter(Boolean);
      const departmentData = deptArray.map((dept) => ({
        icon: <DesktopOutlined />,
        title: dept.deptName,
        deptId: dept.deptId,
        projects: dept.projectCount,
        machines: dept.machineCount,
        alerts: dept.activeAlerts,
        status: dept.overallStatus,
      }));

      setDepartments(departmentData);
    } catch (error) {
      console.error("Department Fetch Error:", error);
    }
  };

  const fetchCounts = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await api.get("/count", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = response.data?.data;
      if (data && data.departmentCount != null) {
        setCounts({
          departments: data.departmentCount ?? 0,
          projects: data.projectCount ?? 0,
          machines: data.machineCount ?? 0,
        });
      }
    } catch (error) {
      console.error("Count Fetch Error:", error);
    }
  };

  useEffect(() => {
    fetchDepartments();
    fetchCounts();
  }, []);

  return (
    <MainLayout title={isCentral ? "Dashboard" : departments[0]?.title || "Dashboard"}>
      <div className="dashboard-page">
        <div className="animate-in animate-in-d1">
          <KpiStatsRow
            departments={departments}
            showDepartments={isCentral}
            counts={counts}
          />
        </div>

        <DashboardGuide />
      </div>
    </MainLayout>
  );
};

export default DashboardOverview;
