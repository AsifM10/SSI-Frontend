import { useEffect, useState } from "react";
import {
  getProjectsByDepartment,
} from "../../services/projectService";
import {
  ApartmentOutlined,
  DesktopOutlined,
  DatabaseOutlined,
  HddOutlined,
  ArrowRightOutlined,
  ArrowLeftOutlined,
  PlusOutlined,
  RadarChartOutlined,
  ClusterOutlined,
  SearchOutlined,
  DeleteOutlined,
  EditOutlined,
  LoadingOutlined,
} from "@ant-design/icons";

import { useParams, useNavigate, Link } from "react-router-dom";

import MainLayout from "../../layouts/MainLayout/MainLayout";

import AddProjectModal from "../../components/modals/AddProjectModal/AddProjectModal";
import DeleteConfirmationModal from "../../components/modals/DeleteConfirmationModal/DeleteConfirmationModal";
import api from "../../services/api";

import "./DepartmentDetails.css";

const DepartmentDetails = () => {
  const { departmentCode } = useParams();

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deptId, setDeptId] = useState(null);
  const [deptName, setDeptName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteModal, setDeleteModal] = useState({ open: false, projectId: null, projectName: "" });

  // Look up deptId by matching departmentCode against API data
  useEffect(() => {
    const resolveDept = async () => {
      try {
        const url =
          user.role === "CENTRAL_ADMIN" || user.role === "CENTRAL_VIEWER"
            ? "/api/departments/summary"
            : `/api/departments/summary/${user.deptId}`;

        const res = await api.get(url);
        const raw = res.data?.data ?? [];
        const depts = Array.isArray(raw) ? raw : [raw];

        const matched = depts.find(
          (d) => d.deptName === departmentCode || d.deptId === Number(departmentCode)
        );

        if (matched) {
          setDeptId(matched.deptId);
          setDeptName(matched.deptName);
        } else if (depts.length === 1) {
          setDeptId(depts[0].deptId);
          setDeptName(depts[0].deptName);
        }
      } catch {
        setDeptId(null);
      }
    };
    resolveDept();
  }, [departmentCode]);

  const filteredProjects = projects.filter((p) =>
    p.projectName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Redirect DEPT_ADMIN if not their department
  useEffect(() => {
    if (deptId && user.role === "DEPT_ADMIN" && user.deptId !== deptId) {
      navigate("/dashboard");
    }
  }, [deptId]);

const fetchProjects = async () => {
  try {
    setLoading(true);

    const data = await getProjectsByDepartment(deptId);

    setProjects(data);
  } catch (error) {
    console.error(error);
  } finally {
    setLoading(false);
  }
};

  const canDeleteProject = user.role === "DEPT_ADMIN";

  const handleEditProject = (project) => {
    setEditingProject(project);
    setProjectModalOpen(true);
  };

  const handleDeleteProject = (project) => {
    setDeleteModal({
      open: true,
      projectId: project.projectId,
      projectName: project.projectName,
    });
  };

  const confirmDeleteProject = async () => {
    setDeleteModal((prev) => ({ ...prev, open: false }));
    await fetchProjects();
  };

useEffect(() => {
  if (deptId) {
    fetchProjects();
  }
}, [deptId]);

const breadcrumb = (
  <>
    <Link to="/dashboard" className="bc-link">Dashboard</Link>
    <span className="bc-sep">›</span>
    <span className="bc-current">{deptName || departmentCode}</span>
  </>
);

return (
    <MainLayout title="Projects" breadcrumb={breadcrumb}>
      <div className="department-details-page">
        <div className="department-page-top">
          <div className="department-top-actions">
            {projects.length > 0 && (
            <button
              className="projects-back-top-btn"
              onClick={() => navigate("/departments")}
            >
              <ArrowLeftOutlined />
              <span>Back</span>
            </button>
            )}

            {user.role === "DEPT_ADMIN" && (
            <button
              className="add-project-top-btn"
              onClick={() => setProjectModalOpen(true)}
            >
              <PlusOutlined />

              <span>Add Project</span>
            </button>
            )}

            {projects.length > 0 && (
            <div className="department-search">
              <SearchOutlined className="department-search-icon" />

              <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
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
              <h3>Loading projects...</h3>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="projects-empty-state">
              <div className="projects-empty-icon">
                <ApartmentOutlined />
              </div>
              <h3>{searchQuery ? "No matching projects" : "No projects found"}</h3>
              <p>
                {searchQuery
                  ? "Try a different search term."
                  : "This department doesn't have any projects yet."}
              </p>
              <button
                className="projects-back-btn"
                onClick={() => navigate("/departments")}
              >
                <ArrowLeftOutlined />
                Back
              </button>
            </div>
          ) : (
          <table className="projects-table">
            <thead>
              <tr>
                <th>Project Name</th>
                <th>Machines</th>
                <th>CPU</th>
                <th>GPU</th>
                <th>Memory</th>
                <th>Storage</th>
                <th>Status</th>
                <th>Tags</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
                {filteredProjects.map((project) => (
                  <tr
                    key={project.projectId}
                    className="project-row-click"
                    onClick={() =>
                      navigate(`/monitoring/${project.projectId}`)
                    }
                  >
                    <td className="project-name-cell">
                      <span className="project-name-icon">
                        <ApartmentOutlined />
                      </span>
                      {project.projectName}
                    </td>
                    <td>{project.machineCount}</td>
                    <td>{project.totalCpuCores} Cores</td>
                    <td>{project.totalGpuCount}</td>
                    <td>{project.totalMemoryGb} GB</td>
                    <td>{project.totalStorageGb} GB</td>
                    <td>
                      <span
                        className={`status-badge ${
                          project.overallMachineStatus === "Healthy"
                            ? "healthy"
                            : project.overallMachineStatus === "Warning"
                              ? "warning"
                              : "no-machines"
                        }`}
                      >
                        {project.overallMachineStatus}
                      </span>
                    </td>
                    <td>
                      <div className="table-tags-cell">
                        {(() => {
                          const raw = project.tags;
                          const tags = Array.isArray(raw)
                            ? raw.filter(Boolean)
                            : raw
                              ? String(raw).split(",").map((t) => t.trim()).filter(Boolean)
                              : [];

                          return tags.length > 0 ? (
                            tags.map((tag, i) => (
                              <span key={i} className="table-tag">{tag}</span>
                            ))
                          ) : (
                            <span className="table-tag-empty">—</span>
                          );
                        })()}
                      </div>
                    </td>
                    <td>
                        <div className="project-actions">
                        <button
                          className="project-view-btn"
                          title="View"
                          onClick={() =>
                            navigate(`/monitoring/${project.projectId}`)
                          }
                        >
                          <ArrowRightOutlined />
                        </button>
                        {canDeleteProject && (
                          <button
                            className="project-edit-btn"
                            title="Edit"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditProject(project);
                            }}
                          >
                            <EditOutlined />
                          </button>
                        )}
                        {canDeleteProject && (
                          <button
                            className="project-delete-btn"
                            title="Delete"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteProject(project);
                            }}
                          >
                            <DeleteOutlined />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          )}
        </div>
      </div>

      <AddProjectModal
  open={projectModalOpen}
  onClose={() => {
    setProjectModalOpen(false);
    setEditingProject(null);
  }}
  deptId={deptId}
  deptName={deptName}
  onProjectCreated={fetchProjects}
  editing={editingProject}
/>

      <DeleteConfirmationModal
        open={deleteModal.open}
        title="Delete Project"
        entityName={deleteModal.projectName}
        description="Are you sure you want to delete this project? This action cannot be undone."
        deleteApi={`/api/projects/${deleteModal.projectId}`}
        onSuccess={confirmDeleteProject}
        onCancel={() => setDeleteModal({ open: false, projectId: null, projectName: "" })}
      />
    </MainLayout>
  );
};

export default DepartmentDetails;
