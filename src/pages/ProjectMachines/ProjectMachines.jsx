import { useEffect, useState } from "react";
import {
  getMachinesByProject,
} from "../../services/machineService";
import { getProjectSummary } from "../../services/projectService";
import {
  DesktopOutlined,
  WifiOutlined,
  ArrowRightOutlined,
  ArrowLeftOutlined,
  PlusOutlined,
  SearchOutlined,
  DeleteOutlined,
  EditOutlined,
  LoadingOutlined,
} from "@ant-design/icons";

import { useParams, useNavigate, Link } from "react-router-dom";

import MainLayout from "../../layouts/MainLayout/MainLayout";

import AddMachineModal from "../../components/monitoring/AddMachineModal/AddMachineModal";
import DeleteConfirmationModal from "../../components/modals/DeleteConfirmationModal/DeleteConfirmationModal";
import StatusIndicator from "../../components/StatusIndicator/StatusIndicator";
import DataTable from "../../components/DataTable/DataTable";
import { normalizeTags } from "../../utils/helpers";

import "./ProjectMachines.css";
import "../DepartmentDetails/DepartmentDetails.css";

const renderTags = (entity) => {
  const tags = normalizeTags(entity.tags);

  return (
    <div className="dt-tags">
      {tags.length > 0 ? (
        <>
          {tags.slice(0, 4).map((tag, i) => (
            <span key={i} className="dt-tag">{tag}</span>
          ))}
          {tags.length > 4 && (
            <span className="dt-tag dt-tag-more">+{tags.length - 4}</span>
          )}
        </>
      ) : (
        <span className="dt-tag-empty">-</span>
      )}
    </div>
  );
};

const ProjectMachines = () => {
  const { projectId } = useParams();

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [machines, setMachines] = useState([]);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [machineModalOpen, setMachineModalOpen] = useState(false);
  const [editingMachine, setEditingMachine] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ open: false, machineId: null, hostname: "" });

  const canManage = user.role === "DEPT_ADMIN";

  useEffect(() => {
    const checkProjectAccess = async () => {
      try {
        const data = await getProjectSummary(projectId);
        setProject(data);
        if (
          (user.role === "DEPT_ADMIN" || user.role === "DEPT_VIEWER") &&
          data?.deptId &&
          Number(data.deptId) !== Number(user.deptId)
        ) {
          navigate("/dashboard");
        }
      } catch (err) {
        console.error("Project access check failed:", err);
      }
    };
    checkProjectAccess();
  }, [projectId]);

  const fetchMachines = async () => {
    try {
      setLoading(true);
      const data = await getMachinesByProject(projectId);
      setMachines(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchMachines();
    }
  }, [projectId]);

  const filteredMachines = machines.filter(
    (m) =>
      m.hostname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.ipAddress?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleViewMachine = (machine) => {
    localStorage.setItem("selectedMachine", String(machine.machineId));
    navigate(`/monitoring/${projectId}`);
  };

  const handleEditMachine = (machine) => {
    setEditingMachine(machine);
    setMachineModalOpen(true);
  };

  const handleDeleteMachine = (machine) => {
    setDeleteModal({
      open: true,
      machineId: machine.machineId,
      hostname: machine.hostname,
    });
  };

  const confirmDeleteMachine = async () => {
    setDeleteModal((prev) => ({ ...prev, open: false }));
    await fetchMachines();
  };

  const breadcrumb = (
    <>
      <Link to="/dashboard" className="bc-link">Dashboard</Link>
      <span className="bc-sep">›</span>
      {project?.deptName && (
        <>
          <Link to={`/departments/${project.deptName}`} className="bc-link">
            {project.deptName}
          </Link>
          <span className="bc-sep">›</span>
        </>
      )}
      <span className="bc-current">{project?.projectName || "Machines"}</span>
    </>
  );

  return (
    <MainLayout title="Machines" breadcrumb={breadcrumb}>
      <div className="department-details-page">
        <div className="department-page-top">
          <div className="department-top-actions">
            {machines.length > 0 && (
              <button
                className="projects-back-top-btn"
                onClick={() => navigate(-1)}
              >
                <ArrowLeftOutlined />
                <span>Back</span>
              </button>
            )}

            {canManage && (
              <button
                className="add-project-top-btn"
                onClick={() => setMachineModalOpen(true)}
              >
                <PlusOutlined />
                <span>Add Machine</span>
              </button>
            )}

            {machines.length > 0 && (
              <div className="department-search">
                <SearchOutlined className="department-search-icon" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            )}
          </div>
        </div>

        <div className="projects-table-wrapper">
          {loading ? (
            <div className="projects-empty-state">
              <div className="projects-empty-icon">
                <LoadingOutlined />
              </div>
              <h3>Loading machines...</h3>
            </div>
          ) : filteredMachines.length === 0 ? (
            <div className="projects-empty-state">
              <div className="projects-empty-icon">
                <DesktopOutlined />
              </div>
              <h3>{searchQuery ? "No matching machines" : "No machines found"}</h3>
              <p>
                {searchQuery
                  ? "Try a different search term."
                  : "This project doesn't have any machines yet."}
              </p>
              <button
                className="projects-back-btn"
                onClick={() => navigate(-1)}
              >
                <ArrowLeftOutlined />
                Back
              </button>
            </div>
          ) : (
            <DataTable
              columns={[
                {
                  title: "Hostname",
                  width: "17%",
                  render: (machine) => (
                    <span className="dt-name-text">{machine.hostname}</span>
                  ),
                },
                {
                  title: "IP Address",
                  width: "12%",
                  render: (machine) => (
                    <span className="dt-ip">
                      <WifiOutlined />
                      {machine.ipAddress || "-"}
                    </span>
                  ),
                },
                { title: "CPU Cores", width: "8%", align: "center", render: (m) => `${m.cpuCores} Cores` },
                { title: "Memory", width: "8%", align: "center", render: (m) => `${m.memoryGb} GB` },
                { title: "Storage", width: "8%", align: "center", render: (m) => `${m.storageGb} GB` },
                {
                  title: "Status",
                  width: "8%",
                  align: "center",
                  render: (m) => <StatusIndicator status={m.status} />,
                },
                { title: "Tags", width: "21%", render: renderTags },
                {
                  title: "",
                  width: "18%",
                  render: (machine) => (
                    <div className="dt-actions">
                      <button
                        className="dt-action-btn dt-action-view"
                        title="View"
                        onClick={() => handleViewMachine(machine)}
                      >
                        <ArrowRightOutlined />
                      </button>
                      {canManage && (
                        <button
                          className="dt-action-btn dt-action-edit"
                          title="Edit"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditMachine(machine);
                          }}
                        >
                          <EditOutlined />
                        </button>
                      )}
                      {canManage && (
                        <button
                          className="dt-action-btn dt-action-delete"
                          title="Delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteMachine(machine);
                          }}
                        >
                          <DeleteOutlined />
                        </button>
                      )}
                    </div>
                  ),
                },
              ]}
              rows={filteredMachines}
              onRowClick={handleViewMachine}
              rowKey={(machine) => machine.machineId}
            />
          )}
        </div>
      </div>

      <AddMachineModal
        open={machineModalOpen}
        onClose={() => {
          setMachineModalOpen(false);
          setEditingMachine(null);
        }}
        projectId={projectId}
        machine={editingMachine}
        onMachineCreated={fetchMachines}
      />

      <DeleteConfirmationModal
        open={deleteModal.open}
        title="Delete Machine"
        entityName={deleteModal.hostname}
        description="Are you sure you want to delete this machine? This action cannot be undone."
        deleteApi={`/api/machines/${deleteModal.machineId}`}
        onSuccess={confirmDeleteMachine}
        onCancel={() => setDeleteModal({ open: false, machineId: null, hostname: "" })}
      />
    </MainLayout>
  );
};

export default ProjectMachines;
