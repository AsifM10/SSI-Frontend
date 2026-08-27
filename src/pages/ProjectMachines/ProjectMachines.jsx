import { useEffect, useState, useMemo } from "react";
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
  FilterOutlined,
  CloseOutlined,
  TagOutlined,
  CheckCircleOutlined,
  ThunderboltOutlined,
  DownOutlined,
  ApiOutlined,
} from "@ant-design/icons";

import { useParams, useNavigate, Link } from "react-router-dom";
import { Dropdown } from "antd";

import MainLayout from "../../layouts/MainLayout/MainLayout";

import AddMachineModal from "../../components/monitoring/AddMachineModal/AddMachineModal";
import DeleteConfirmationModal from "../../components/modals/DeleteConfirmationModal/DeleteConfirmationModal";
import StatusIndicator from "../../components/StatusIndicator/StatusIndicator";
import DataTable from "../../components/DataTable/DataTable";
import { normalizeTags } from "../../utils/helpers";

import "./ProjectMachines.css";
import "../DepartmentDetails/DepartmentDetails.css";

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
        <span className="dt-tag-empty">-</span>
      )}
    </div>
  );
};

const StatusOptions = {
  healthy: "Healthy",
  warning: "Warning",
  critical: "Critical",
  offline: "Offline",
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

const MemoryOptions = [
  { value: "8", label: "8+ GB" },
  { value: "16", label: "16+ GB" },
  { value: "32", label: "32+ GB" },
  { value: "64", label: "64+ GB" },
  { value: "128", label: "128+ GB" },
  { value: "256", label: "256+ GB" },
  { value: "512", label: "512+ GB" },
];

const StorageOptions = [
  { value: "100", label: "100+ GB" },
  { value: "250", label: "250+ GB" },
  { value: "500", label: "500+ GB" },
  { value: "1000", label: "1+ TB" },
  { value: "2000", label: "2+ TB" },
  { value: "4000", label: "4+ TB" },
  { value: "8000", label: "8+ TB" },
];

const SEARCH_BY_OPTIONS = [
  { value: "name", label: "Name" },
  { value: "ip", label: "IP Address" },
  { value: "tags", label: "Tags" },
  { value: "status", label: "Status" },
  { value: "cpu", label: "CPU Cores" },
];

const SEARCH_PLACEHOLDERS = {
  name: "Search machines by hostname...",
  ip: "Search by IP address...",
  tags: "Search by tags (comma-separate multiple)...",
  status: "Search by status (healthy / warning / critical / offline)...",
  cpu: "Minimum CPU cores (e.g. 8)...",
};

const SEARCH_CHIP_LABELS = {
  name: "Name",
  ip: "IP",
  tags: "Tags",
  status: "Status",
  cpu: "CPU",
};

const SEARCH_BY_ICONS = {
  name: SearchOutlined,
  ip: ApiOutlined,
  tags: TagOutlined,
  status: CheckCircleOutlined,
  cpu: ThunderboltOutlined,
};

const parseSearchTags = (query) =>
  query
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

const SearchByIcon = ({ value }) => {
  const Icon = SEARCH_BY_ICONS[value] || SearchOutlined;
  return <Icon className="search-by-icon" />;
};

const normalizeStatus = (status) =>
  String(status || "").toLowerCase().replace(/[\s-]/g, "");

const ProjectMachines = () => {
  const { projectId } = useParams();

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [machines, setMachines] = useState([]);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchBy, setSearchBy] = useState("name");
  const [selectedTags, setSelectedTags] = useState([]);
  const [matchAll, setMatchAll] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [cpuFilter, setCpuFilter] = useState("");
  const [memoryFilter, setMemoryFilter] = useState("");
  const [storageFilter, setStorageFilter] = useState("");
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

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

  // Derive top machine tags client-side from loaded machines
  const machineTags = useMemo(() => {
    const counts = new Map();
    machines.forEach((m) => {
      normalizeTags(m.tags).forEach((t) => {
        counts.set(t, (counts.get(t) || 0) + 1);
      });
    });
    return [...counts.entries()]
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
      .slice(0, MAX_VISIBLE_TAGS);
  }, [machines]);

  const filteredMachines = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return machines.filter((m) => {
      let matchesSearch = true;

      if (q) {
        if (searchBy === "name") {
          matchesSearch = Boolean(
            m.hostname && m.hostname.toLowerCase().includes(q)
          );
        } else if (searchBy === "ip") {
          matchesSearch = Boolean(
            m.ipAddress && m.ipAddress.toLowerCase().includes(q)
          );
        } else if (searchBy === "tags") {
          const wanted = parseSearchTags(q);
          if (wanted.length > 0) {
            const machineTagsArr = normalizeTags(m.tags).map((t) => t.toLowerCase());
            matchesSearch = matchAll
              ? wanted.every((t) => machineTagsArr.includes(t))
              : wanted.some((t) => machineTagsArr.includes(t));
          }
        } else if (searchBy === "status") {
          matchesSearch =
            normalizeStatus(m.status) === q.replace(/\s/g, "").toLowerCase();
        } else if (searchBy === "cpu") {
          const minCores = parseInt(q, 10);
          matchesSearch =
            !Number.isNaN(minCores) &&
            Boolean(m.cpuCores && m.cpuCores >= minCores);
        }
      }

      const machineTagsArr = normalizeTags(m.tags).map((t) => t.toLowerCase());
      const wantedPanelTags = selectedTags.map((t) => t.toLowerCase());

      const matchesTag =
        selectedTags.length === 0 ||
        (machineTagsArr.length > 0 &&
          (matchAll
            ? wantedPanelTags.every((t) => machineTagsArr.includes(t))
            : wantedPanelTags.some((t) => machineTagsArr.includes(t))));

      const matchesStatus =
        !statusFilter || normalizeStatus(m.status) === statusFilter;

      const matchesCpu =
        !cpuFilter || (m.cpuCores && m.cpuCores >= parseInt(cpuFilter, 10));

      const matchesMemory =
        !memoryFilter || (m.memoryGb && m.memoryGb >= parseInt(memoryFilter, 10));

      const matchesStorage =
        !storageFilter || (m.storageGb && m.storageGb >= parseInt(storageFilter, 10));

      return (
        matchesSearch &&
        matchesTag &&
        matchesStatus &&
        matchesCpu &&
        matchesMemory &&
        matchesStorage
      );
    });
  }, [machines, searchQuery, searchBy, selectedTags, matchAll, statusFilter, cpuFilter, memoryFilter, storageFilter]);

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

  const activeFilterCount =
    (searchQuery ? 1 : 0) +
    selectedTags.length +
    (statusFilter ? 1 : 0) +
    (cpuFilter ? 1 : 0) +
    (memoryFilter ? 1 : 0) +
    (storageFilter ? 1 : 0);

  const hasActiveFilters = activeFilterCount > 0;

  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedTags([]);
    setMatchAll(true);
    setStatusFilter("");
    setCpuFilter("");
    setMemoryFilter("");
    setStorageFilter("");
  };

  const removeTag = (tag) => {
    setSelectedTags((prev) => prev.filter((t) => t !== tag));
  };

  const toggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
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
              <div className="project-list-toolbar">
                <div className="search-group">
                  <Dropdown
                    trigger={["click"]}
                    placement="bottomLeft"
                    menu={{
                      selectable: true,
                      selectedKeys: [searchBy],
                      onClick: ({ key }) => setSearchBy(key),
                      items: SEARCH_BY_OPTIONS.map((opt) => {
                        const OptionIcon = SEARCH_BY_ICONS[opt.value] || SearchOutlined;
                        return { key: opt.value, icon: <OptionIcon />, label: opt.label };
                      }),
                    }}
                  >
                    <button
                      type="button"
                      className="search-by-toggle"
                      title={`Search by ${SEARCH_BY_OPTIONS.find((o) => o.value === searchBy)?.label}`}
                    >
                      <SearchByIcon value={searchBy} />
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
                      aria-label={`Search machines by ${SEARCH_BY_OPTIONS.find((o) => o.value === searchBy)?.label}`}
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
            )}
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
                <span className="chip-key">Status:</span> {StatusOptions[statusFilter] || statusFilter}
                <CloseOutlined className="chip-remove" />
              </button>
            )}

            {cpuFilter && (
              <button className="active-filter-chip" onClick={() => setCpuFilter("")} title="Remove CPU filter">
                <span className="chip-key">CPU:</span> {cpuFilter}+ Cores
                <CloseOutlined className="chip-remove" />
              </button>
            )}

            {memoryFilter && (
              <button className="active-filter-chip" onClick={() => setMemoryFilter("")} title="Remove memory filter">
                <span className="chip-key">Memory:</span> {memoryFilter}+ GB
                <CloseOutlined className="chip-remove" />
              </button>
            )}

            {storageFilter && (
              <button className="active-filter-chip" onClick={() => setStorageFilter("")} title="Remove storage filter">
                <span className="chip-key">Storage:</span> {storageFilter}+ GB
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
                <FilterOutlined /> Filter Machines
              </span>
              <button className="filter-panel-close" onClick={() => setIsFilterPanelOpen(false)} aria-label="Close filters">
                <CloseOutlined />
              </button>
            </div>

            <div className="filter-panel-body">
              <div className="filter-section">
                <div className="filter-section-title">
                  <span>Tags</span>
                  <span className="filter-section-hint">Top {MAX_VISIBLE_TAGS} by usage</span>
                </div>

                {machineTags.length > 0 ? (
                  <>
                    <div className="tag-chips">
                      {machineTags.map((tag) => {
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

              <div className="filter-section">
                <div className="filter-section-title">
                  <span>Status</span>
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

              <div className="filter-section">
                <div className="filter-section-title">
                  <span>Memory</span>
                </div>
                <select
                  className="filter-select"
                  value={memoryFilter}
                  onChange={(e) => setMemoryFilter(e.target.value)}
                  aria-label="Filter by memory"
                >
                  <option value="">Any amount of memory</option>
                  {MemoryOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-section">
                <div className="filter-section-title">
                  <span>Storage</span>
                </div>
                <select
                  className="filter-select"
                  value={storageFilter}
                  onChange={(e) => setStorageFilter(e.target.value)}
                  aria-label="Filter by storage"
                >
                  <option value="">Any amount of storage</option>
                  {StorageOptions.map((opt) => (
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
          {!loading && machines.length > 0 && (
            <span>
              <strong>{filteredMachines.length}</strong> machine{filteredMachines.length === 1 ? "" : "s"} found
            </span>
          )}
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
              <h3>{hasActiveFilters ? "No matching machines" : "No machines found"}</h3>
              <p>
                {hasActiveFilters
                  ? "Try adjusting your search or filters."
                  : "This project doesn't have any machines yet."}
              </p>
              {hasActiveFilters ? (
                <button className="empty-state-clear-btn" onClick={clearAllFilters}>
                  Clear all filters
                </button>
              ) : (
                <button
                  className="projects-back-btn"
                  onClick={() => navigate(-1)}
                >
                  <ArrowLeftOutlined />
                  Back
                </button>
              )}
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
        deptId={project?.deptId}
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
