import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { selectUser } from "../../store/slices/authSlice";
import { DesktopOutlined, SearchOutlined, PlusOutlined, CloseOutlined } from "@ant-design/icons";
import MainLayout from "../../layouts/MainLayout/MainLayout";
import DepartmentTable from "../cards/DepartmentTable/DepartmentTable";
import AddDepartmentModal from "../modals/AddDepartmentModal/AddDepartmentModal";
import DeleteConfirmationModal from "../modals/DeleteConfirmationModal/DeleteConfirmationModal";
import "../../pages/Dashboard/Dashboard.css";
import api from "../../services/api";

const DepartmentOverview = ({ title = "Department Overview" }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteModal, setDeleteModal] = useState({ open: false, deptId: null, deptName: "" });

  const filteredDepartments = departments.filter((dept) =>
    dept.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const user = useSelector(selectUser);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const token = localStorage.getItem("token");

      const url =
        user.role === "CENTRAL_ADMIN" || user.role === "CENTRAL_VIEWER"
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
        tags: dept.tags,
      }));

      setDepartments(departmentData);
    } catch (error) {
      console.error("Department Fetch Error:", error);
    }
  };

  const handleCreateDepartment = async () => {
    await fetchDepartments();
  };

  const handleEditDepartment = (department) => {
    setEditingDepartment(department);
    setModalOpen(true);
  };

  const handleDeleteDepartment = (department) => {
    setDeleteModal({
      open: true,
      deptId: department.deptId,
      deptName: department.title,
    });
  };

  const confirmDeleteDepartment = async () => {
    setDeleteModal((prev) => ({ ...prev, open: false }));
    await fetchDepartments();
  };

  return (
    <MainLayout
      title={title}
      breadcrumb={
        <>
          <Link to="/dashboard" className="bc-link">Dashboard</Link>
          <span className="bc-sep">›</span>
          <span className="bc-current">Departments</span>
        </>
      }
    >
      <div className="dashboard-page">
        <div className="dashboard-actions animate-in animate-in-d1">
          {user.role === "CENTRAL_ADMIN" && (
            <button
              className="add-department-top-btn"
              onClick={() => setModalOpen(true)}
            >
              <PlusOutlined />
              <span>Add Department</span>
            </button>
          )}

          <div className="dashboard-search">
            <SearchOutlined className="search-icon" />
            <input
              type="text"
              placeholder="Search by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                className="search-clear-btn"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
              >
                <CloseOutlined />
              </button>
            )}
          </div>
        </div>

        <div className="animate-in animate-in-d2">
          <DepartmentTable
            departments={filteredDepartments}
            onAddClick={user.role === "CENTRAL_ADMIN" ? () => setModalOpen(true) : undefined}
            onEdit={user.role === "CENTRAL_ADMIN" ? handleEditDepartment : undefined}
            onDelete={user.role === "CENTRAL_ADMIN" ? handleDeleteDepartment : undefined}
          />
        </div>
      </div>

      <AddDepartmentModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingDepartment(null);
        }}
        onCreate={handleCreateDepartment}
        editing={editingDepartment}
      />

      <DeleteConfirmationModal
        open={deleteModal.open}
        title="Delete Department"
        entityName={deleteModal.deptName}
        description="Are you sure you want to delete this department? This action cannot be undone."
        deleteApi={`/api/departments/${deleteModal.deptId}`}
        onSuccess={confirmDeleteDepartment}
        onCancel={() => setDeleteModal({ open: false, deptId: null, deptName: "" })}
      />
    </MainLayout>
  );
};

export default DepartmentOverview;