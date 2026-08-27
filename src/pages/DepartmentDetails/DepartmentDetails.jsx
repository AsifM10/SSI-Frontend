import { useEffect, useState, useMemo, useCallback } from "react";
import {
  getProjectsByDepartment,
  getProjectsTags,
  searchProjects,
} from "../../services/projectService";
import {
  ApartmentOutlined,
  ArrowRightOutlined,
  ArrowLeftOutlined,
  PlusOutlined,
  SearchOutlined,
  DeleteOutlined,
  EditOutlined,
  LoadingOutlined,
  FilterOutlined,
  CloseOutlined,
  TagOutlined,
  CheckCircleOutlined,
  ThunderboltOutlined,
  DownOutlined,
} from "@ant-design/icons";

import { useParams, useNavigate, Link } from "react-router-dom";

import { Dropdown } from "antd";

import MainLayout from "../../layouts/MainLayout/MainLayout";

import AddProjectModal from "../../components/modals/AddProjectModal/AddProjectModal";
import DeleteConfirmationModal from "../../components/modals/DeleteConfirmationModal/DeleteConfirmationModal";
import StatusIndicator from "../../components/StatusIndicator/StatusIndicator";
import DataTable from "../../components/DataTable/DataTable";
import { normalizeTags } from "../../utils/helpers";
import useProjectsTags from "../../hooks/useProjectsTags";
import api from "../../services/api";

import "./DepartmentDetails.css";

const MAX_VISIBLE_TAGS = 6;

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
        <span className="dt-tag-empty">—</span>
      )}
    </div>
  );
};

const StatusOptions = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
};

const CpuOptions = [
  { value: "1", label: "1+ Cores" },
  { value: "2", label: "2+ Cores" },
  { value: "4", label: "4+ Cores" },
  { value: "8", label: "8+ Cores" },
  { value: "16", label: "16+ Cores" },
  { value: "32", label: "32+ Cores" },
  { value: "64", label: "64+ Cores" },
];

const SEARCH_BY_OPTIONS = [
  { value: "name", label: "Name" },
  { value: "tags", label: "Tags" },
  { value: "status", label: "Project Status" },
  { value: "cpu", label: "CPU Cores" },
];

const SEARCH_PLACEHOLDERS = {
  name: "Search projects by name...",
  tags: "Search by tags (comma-separate multiple)...",
  status: "Search by status (ACTIVE / INACTIVE)...",
  cpu: "Minimum CPU cores (e.g. 8)...",
};

const SEARCH_CHIP_LABELS = {
  name: "Name",
  tags: "Tags",
  status: "Status",
  cpu: "CPU",
};

const SEARCH_BY_ICONS = {
  name: SearchOutlined,
  tags: TagOutlined,
  status: CheckCircleOutlined,
  cpu: ThunderboltOutlined,
};

const parseSearchTags = (query) =>
  query
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

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
  const [searchBy, setSearchBy] = useState("name");
  const [selectedTags, setSelectedTags] = useState([]);
  const [matchAll, setMatchAll] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [cpuFilter, setCpuFilter] = useState("");

  const [tagsData, setTagsData] = useState([]);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ open: false, projectId: null, projectName: "" });
  const [tagMatchIds, setTagMatchIds] = useState(null);

  useProjectsTags();

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
  }, [departmentCode, user.role, user.deptId]);

  // Fetch tags for this department
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const data = await getProjectsTags();
        if (data && data.length > 0) {
          const sorted = [...data].sort((a, b) => b.count - a.count);
          setTagsData(sorted.slice(0, MAX_VISIBLE_TAGS));
        }
      } catch (err) {
        console.error("Failed to fetch project tags:", err);
      }
    };

    fetchTags();
  }, []);

  // Fetch projects via the summary API (full row shape) and filter client-side
  const fetchProjects = useCallback(async () => {
    if (!deptId) return;

    try {
      setLoading(true);
      const data = await getProjectsByDepartment(deptId);
      setProjects(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [deptId]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Tags currently active from panel chips + typed tags (when in tags mode)
  const backendTagFilter = useMemo(() => {
    const typed =
      searchBy === "tags" && searchQuery.trim()
        ? parseSearchTags(searchQuery)
        : [];
    return [...new Set([...selectedTags, ...typed])];
  }, [searchBy, searchQuery, selectedTags]);

  // Hybrid: ask the backend which projectIds match the active tags,
  // then intersect with the summary rows client-side
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!deptId || backendTagFilter.length === 0) {
        setTagMatchIds(null);
        return;
      }
      try {
        const matches = await searchProjects({
          deptId,
          tags: backendTagFilter,
          matchAll,
        });
        if (!cancelled) {
          setTagMatchIds(
            new Set((matches || []).map((m) => m.projectId))
          );
        }
      } catch (err) {
        console.error("Backend tag search failed, falling back to local filtering:", err);
        if (!cancelled) setTagMatchIds(null);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [deptId, backendTagFilter, matchAll]);

  const filteredProjects = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return projects.filter((p) => {
      let matchesSearch = true;

      if (q) {
        if (searchBy === "name") {
          matchesSearch = Boolean(
            p.projectName && p.projectName.toLowerCase().includes(q)
          );
        } else if (searchBy === "tags") {
          const wanted = parseSearchTags(q);
          if (wanted.length > 0) {
            const projTags = normalizeTags(p.tags).map((t) => t.toLowerCase());
            matchesSearch = matchAll
              ? wanted.every((t) => projTags.includes(t))
              : wanted.some((t) => projTags.includes(t));
          }
        } else if (searchBy === "status") {
          matchesSearch =
            String(p.status || "").toUpperCase() === q.toUpperCase();
        } else if (searchBy === "cpu") {
          const minCores = parseInt(q, 10);
          matchesSearch =
            !Number.isNaN(minCores) &&
            Boolean(p.totalCpuCores && p.totalCpuCores >= minCores);
        }
      }

      const projTags = normalizeTags(p.tags).map((t) => t.toLowerCase());
      const wantedPanelTags = selectedTags.map((t) => t.toLowerCase());

      const matchesTag =
        selectedTags.length === 0 ||
        (projTags.length > 0 &&
          (matchAll
            ? wantedPanelTags.every((t) => projTags.includes(t))
            : wantedPanelTags.some((t) => projTags.includes(t))));

      const matchesStatus =
        !statusFilter || String(p.status || "").toUpperCase() === statusFilter;

      const matchesCpu =
        !cpuFilter || (p.totalCpuCores && p.totalCpuCores >= parseInt(cpuFilter, 10));

      const matchesBackend = !tagMatchIds || tagMatchIds.has(p.projectId);

      return (
        matchesSearch &&
        matchesTag &&
        matchesStatus &&
        matchesCpu &&
        matchesBackend
      );
    });
  }, [projects, searchQuery, searchBy, selectedTags, matchAll, statusFilter, cpuFilter, tagMatchIds]);

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

  const activeFilterCount =
    (searchQuery ? 1 : 0) +
    selectedTags.length +
    (statusFilter ? 1 : 0) +
    (cpuFilter ? 1 : 0);

  const hasActiveFilters = activeFilterCount > 0;

  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedTags([]);
    setMatchAll(true);
    setStatusFilter("");
    setCpuFilter("");
  };

  const removeTag = (tag) => {
    setSelectedTags((prev) => prev.filter((t) => t !== tag));
  };

  const toggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const SearchModeIcon = SEARCH_BY_ICONS[searchBy] || SearchOutlined;
  const searchByLabel = SEARCH_BY_OPTIONS.find((o) => o.value === searchBy)?.label;

  const searchByItems = SEARCH_BY_OPTIONS.map((opt) => {
    const OptionIcon = SEARCH_BY_ICONS[opt.value] || SearchOutlined;
    return { key: opt.value, icon: <OptionIcon />, label: opt.label };
  });

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
              <button className="projects-back-top-btn" onClick={() => navigate("/departments")}>
                <ArrowLeftOutlined />
                <span>Back</span>
              </button>
            )}

            {user.role === "DEPT_ADMIN" && (
              <button className="add-project-top-btn" onClick={() => setProjectModalOpen(true)}>
                <PlusOutlined />
                <span>Add Project</span>
              </button>
            )}

            <div className="project-list-toolbar">
              <div className="search-group">
                <Dropdown
                  trigger={["click"]}
                  placement="bottomLeft"
                  menu={{
                    selectable: true,
                    selectedKeys: [searchBy],
                    onClick: ({ key }) => setSearchBy(key),
                    items: searchByItems,
                  }}
                >
                  <button
                    type="button"
                    className="search-by-toggle"
                    title={`Search by ${searchByLabel}`}
                  >
                    <SearchModeIcon className="search-by-icon" />
                    <span>{SEARCH_CHIP_LABELS[searchBy]}</span>
                    <DownOutlined className="search-by-chevron" />
                  </button>
                </Dropdown>

                <div className="project-search">
                  <SearchOutlined className="search-icon" />
                  <input
                    type="text"
                    placeholder={SEARCH_PLACEHOLDERS[searchBy]}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="project-search-input"
                    aria-label={`Search projects by ${searchByLabel}`}
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

              <button
                className={`filter-toggle-btn ${isFilterPanelOpen ? "is-open" : ""} ${hasActiveFilters ? "has-filters" : ""}`}
                onClick={() => setIsFilterPanelOpen((open) => !open)}
                aria-expanded={isFilterPanelOpen}
              >
                <FilterOutlined />
                <span>Filters</span>
                {hasActiveFilters && (
                  <span className="filter-count-badge">{activeFilterCount}</span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Active filter chips */}
        {hasActiveFilters && (
          <div className="active-filters-row">
            <span className="active-filters-label">
              <FilterOutlined /> Active filters:
            </span>

            {searchQuery && (
              <button
                className="active-filter-chip"
                onClick={() => setSearchQuery("")}
                title="Remove search"
              >
                <span className="chip-key">{SEARCH_CHIP_LABELS[searchBy]}:</span> {searchQuery}
                <CloseOutlined className="chip-remove" />
              </button>
            )}

            {selectedTags.map((tag) => (
              <button key={tag} className="active-filter-chip" onClick={() => removeTag(tag)} title={`Remove tag ${tag}`}>
                <TagOutlined className="chip-tag-icon" /> {tag}
                <CloseOutlined className="chip-remove" />
              </button>
            ))}

            {statusFilter && (
              <button className="active-filter-chip" onClick={() => setStatusFilter("")} title="Remove status filter">
                <span className="chip-key">Status:</span> {statusFilter}
                <CloseOutlined className="chip-remove" />
              </button>
            )}

            {cpuFilter && (
              <button className="active-filter-chip" onClick={() => setCpuFilter("")} title="Remove CPU filter">
                <span className="chip-key">CPU:</span> {cpuFilter}+ Cores
                <CloseOutlined className="chip-remove" />
              </button>
            )}

            <button className="clear-all-btn" onClick={clearAllFilters}>
              Clear all
            </button>
          </div>
        )}

        {/* Filter panel */}
        {isFilterPanelOpen && (
          <div className="filter-panel">
            <div className="filter-panel-header">
              <span className="filter-panel-title">
                <FilterOutlined /> Filter Projects
              </span>
              <button className="filter-panel-close" onClick={() => setIsFilterPanelOpen(false)} aria-label="Close filters">
                <CloseOutlined />
              </button>
            </div>

            <div className="filter-panel-body">
              {/* Tags */}
              <div className="filter-section">
                <div className="filter-section-title">
                  <span>Tags</span>
                  <span className="filter-section-hint">Top {MAX_VISIBLE_TAGS} by usage</span>
                </div>

                {tagsData.length > 0 ? (
                  <>
                    <div className="tag-chips">
                      {tagsData.map((tag) => {
                        const isSelected = selectedTags.includes(tag.tag);
                        return (
                          <button
                            key={tag.tag}
                            className={`tag-chip ${isSelected ? "selected" : ""}`}
                            onClick={() => toggleTag(tag.tag)}
                            aria-pressed={isSelected}
                          >
                            <TagOutlined />
                            <span className="tag-chip-label">{tag.tag}</span>
                            <span className="chip-count">{tag.count}</span>
                          </button>
                        );
                      })}
                    </div>

                    {selectedTags.length > 1 && (
                      <label className="match-all-toggle">
                        <input type="checkbox" checked={matchAll} onChange={(e) => setMatchAll(e.target.checked)} />
                        <span>Match <strong>all</strong> selected tags</span>
                      </label>
                    )}

                    {selectedTags.length > 0 && (
                      <div className="selected-tags-info">
                        {selectedTags.length} tag{selectedTags.length > 1 ? "s" : ""} selected —{" "}
                        {matchAll ? "matching all" : "matching any"}
                      </div>
                    )}
                  </>
                ) : (
                  <p className="filter-section-empty">No tags available yet.</p>
                )}
              </div>

              {/* Status */}
              <div className="filter-section">
                <div className="filter-section-title">
                  <span>Project Status</span>
                </div>
                <div className="segmented-options">
                  <button
                    className={`segmented-option ${statusFilter === "" ? "active" : ""}`}
                    onClick={() => setStatusFilter("")}
                  >
                    All
                  </button>
                  {Object.entries(StatusOptions).map(([value, label]) => (
                    <button
                      key={value}
                      className={`segmented-option ${statusFilter === value ? "active" : ""}`}
                      onClick={() => setStatusFilter((prev) => (prev === value ? "" : value))}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* CPU cores */}
              <div className="filter-section">
                <div className="filter-section-title">
                  <span>CPU Cores</span>
                </div>
                <select
                  className="filter-select"
                  value={cpuFilter}
                  onChange={(e) => setCpuFilter(e.target.value)}
                  aria-label="Filter by CPU cores"
                >
                  <option value="">Any number of cores</option>
                  {CpuOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="filter-panel-footer">
              <button className="btn-clear-filters" onClick={clearAllFilters}>
                Clear all filters
              </button>
              <button className="btn-apply-filters" onClick={() => setIsFilterPanelOpen(false)}>
                Show results
              </button>
            </div>
          </div>
        )}

        {/* Results meta */}
        <div className="results-meta">
          {!loading && (
            <span>
              <strong>{filteredProjects.length}</strong> project{filteredProjects.length === 1 ? "" : "s"} found
            </span>
          )}
        </div>

        {/* Table */}
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
              <h3>{hasActiveFilters ? "No matching projects" : "No projects found"}</h3>
              <p>{hasActiveFilters ? "Try adjusting your search or filters" : "This department doesn't have any projects yet."}</p>
              {hasActiveFilters && (
                <button className="empty-state-clear-btn" onClick={clearAllFilters}>
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            <DataTable
              columns={[
                {
                  title: "Project Name",
                  width: "17%",
                  render: (project) => <span className="dt-name-text">{project.projectName}</span>,
                },
                { title: "Machines", width: "8%", align: "center", render: (p) => p.machineCount },
                { title: "CPU", width: "8%", align: "center", render: (p) => `${p.totalCpuCores} Cores` },
                { title: "GPU", width: "8%", align: "center", render: (p) => p.totalGpuCount },
                { title: "Memory", width: "8%", align: "center", render: (p) => `${p.totalMemoryGb} GB` },
                { title: "Storage", width: "8%", align: "center", render: (p) => `${p.totalStorageGb} GB` },
                {
                  title: "Status",
                  width: "9%",
                  align: "center",
                  render: (p) => <StatusIndicator status={p.overallMachineStatus} />,
                },
                {
                  title: "Tags",
                  width: "18%",
                  render: renderTags,
                },
                {
                  title: "",
                  width: "16%",
                  render: (project) => (
                    <div className="dt-actions">
                      <button
                        className="dt-action-btn dt-action-view"
                        title="View"
                        onClick={() => navigate(`/machines/${project.projectId}`)}
                      >
                        <ArrowRightOutlined />
                      </button>
                      {canDeleteProject && (
                        <button
                          className="dt-action-btn dt-action-edit"
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
                          className="dt-action-btn dt-action-delete"
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
                  ),
                },
              ]}
              rows={filteredProjects}
              onRowClick={(project) => navigate(`/machines/${project.projectId}`)}
              rowKey={(project) => project.projectId}
            />
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