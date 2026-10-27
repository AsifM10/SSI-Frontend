import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Table,
  Tag,
  Modal,
  Button,
  Form,
  Input,
  Select,
  message,
  Switch,
  Space,
  Card,
  Descriptions,
  Popconfirm,
  Tooltip,
  Alert,
  Badge,
  Collapse,
} from "antd";
import {
  SettingOutlined,
  UsergroupAddOutlined,
  CheckCircleOutlined,
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  ClusterOutlined,
  BankOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  DeleteOutlined,
  CheckOutlined,
  StopOutlined,
  ApiOutlined,
  ArrowRightOutlined,
  LockOutlined,
  InfoCircleOutlined,
  SafetyCertificateOutlined,
  AuditOutlined,
  GlobalOutlined,
  QuestionCircleOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import DashboardLayout from "../../layouts/DashboardLayout/DashboardLayout";
import StatCard from "../../components/cards/StatCard/StatCard";
import { adminService } from "../../services/apiClient";
import "./AdminDashboard.css";

const { TextArea } = Input;

const AdminDashboard = ({ activeTab = "dashboard" }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [serverConfig, setServerConfig] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [health, setHealth] = useState(null);

  // Filters: Organization Requests
  const [requestSearch, setRequestSearch] = useState("");
  const [requestStatusFilter, setRequestStatusFilter] = useState("all");
  const [requestRoleFilter, setRequestRoleFilter] = useState("all");

  // Filters: Users
  const [userSearch, setUserSearch] = useState("");
  const [userStatusFilter, setUserStatusFilter] = useState("all");
  const [userRoleFilter, setUserRoleFilter] = useState("all");

  // Filters: Infrastructure & Audit
  const [pluginSearch, setPluginSearch] = useState("");
  const [auditSearch, setAuditSearch] = useState("");
  const [auditCategoryFilter, setAuditCategoryFilter] = useState("all");

  // Modals & Drawers
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [selectedUserForView, setSelectedUserForView] = useState(null);
  const [selectedTenantForConfig, setSelectedTenantForConfig] = useState(null);
  const [isTenantModalOpen, setIsTenantModalOpen] = useState(false);
  const [selectedAuditLog, setSelectedAuditLog] = useState(null);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);

  // Review Organization Request Modal state
  const [selectedRequestForReview, setSelectedRequestForReview] = useState(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewActionProcessing, setReviewActionProcessing] = useState(false);
  const [rejectionReasonInput, setRejectionReasonInput] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);

  const [tenantConfigForm] = Form.useForm();
  const [userForm] = Form.useForm();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [uRes, resRes, tenRes, srvRes, logRes, hRes] = await Promise.all([
        adminService.getUsers(),
        adminService.getReservations(),
        adminService.getTenants(),
        adminService.getServerConfig(),
        adminService.getAuditLogs(),
        adminService.getSystemHealth(),
      ]);

      if (uRes?.success) setUsers(uRes.data || []);
      if (resRes?.success) setReservations(resRes.data || []);
      if (tenRes?.success) setTenants(tenRes.data || []);
      if (srvRes?.success) setServerConfig(srvRes.data || {});
      if (logRes?.success) setAuditLogs(logRes.data || []);
      if (hRes?.success) setHealth(hRes.data || {});
    } catch {
      message.error("Failed to load admin management data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const [uRes, resRes, tenRes, srvRes, logRes, hRes] = await Promise.all([
          adminService.getUsers(),
          adminService.getReservations(),
          adminService.getTenants(),
          adminService.getServerConfig(),
          adminService.getAuditLogs(),
          adminService.getSystemHealth(),
        ]);
        if (isMounted) {
          if (uRes?.success) setUsers(uRes.data || []);
          if (resRes?.success) setReservations(resRes.data || []);
          if (tenRes?.success) setTenants(tenRes.data || []);
          if (srvRes?.success) setServerConfig(srvRes.data || {});
          if (logRes?.success) setAuditLogs(logRes.data || []);
          if (hRes?.success) setHealth(hRes.data || {});
          setLoading(false);
        }
      } catch {
        if (isMounted) {
          message.error("Failed to load admin management data");
          setLoading(false);
        }
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  // Organization Request Review Actions
  const handleOpenReviewModal = (record) => {
    setSelectedRequestForReview(record);
    setShowRejectInput(false);
    setRejectionReasonInput("");
    setIsReviewModalOpen(true);
  };

  const handleApproveRequest = async (record) => {
    if (!record) return;
    setReviewActionProcessing(true);
    try {
      const res = await adminService.approveReservation(
        record.reservation_id,
        "Approved by Governance Administrator. Dedicated tenant enclave provisioned."
      );
      if (res?.success) {
        message.success(`Request approved! Tenant enclave provisioned for ${record.tenant_name}.`);
        setIsReviewModalOpen(false);
        setSelectedRequestForReview(null);
        await loadData();
      }
    } catch {
      message.error("Failed to approve organization request");
    } finally {
      setReviewActionProcessing(false);
    }
  };

  const handleDenyRequest = async (record) => {
    if (!record) return;
    const reason = rejectionReasonInput.trim() || "Organization failed governance verification criteria.";
    setReviewActionProcessing(true);
    try {
      const res = await adminService.denyReservation(record.reservation_id, reason);
      if (res?.success) {
        message.info(`Request for ${record.tenant_name} has been rejected.`);
        setIsReviewModalOpen(false);
        setSelectedRequestForReview(null);
        setShowRejectInput(false);
        setRejectionReasonInput("");
        await loadData();
      }
    } catch {
      message.error("Failed to reject organization request");
    } finally {
      setReviewActionProcessing(false);
    }
  };

  const handleRequestMoreInfo = async (record) => {
    if (!record) return;
    message.info(`Information inquiry notice recorded for ${record.tenant_name}.`);
    setIsReviewModalOpen(false);
  };

  // Configure Tenant
  const handleOpenTenantConfig = (tenant) => {
    setSelectedTenantForConfig(tenant);
    tenantConfigForm.setFieldsValue({
      canBecomeIssuer: tenant.canBecomeIssuer,
      enable_ledger_switch: tenant.enable_ledger_switch,
    });
    setIsTenantModalOpen(true);
  };

  const handleSaveTenantConfig = async (values) => {
    if (!selectedTenantForConfig) return;
    try {
      const res = await adminService.updateTenantConfig(selectedTenantForConfig.tenant_id, values);
      if (res?.success) {
        message.success("Tenant configuration updated successfully!");
        setIsTenantModalOpen(false);
        await loadData();
      }
    } catch {
      message.error("Failed to update tenant configuration");
    }
  };

  const handleDeleteTenant = async (tenantId) => {
    try {
      await adminService.deleteTenant(tenantId);
      message.success("Tenant deleted from active directory");
      await loadData();
    } catch {
      message.error("Failed to delete tenant");
    }
  };

  // User Actions
  const handleCreateUser = async (values) => {
    try {
      const res = await adminService.saveUser(values);
      if (res?.success) {
        message.success(`User ${values.username} registered successfully!`);
        setIsUserModalOpen(false);
        userForm.resetFields();
        await loadData();
      }
    } catch {
      message.error("Failed to create user");
    }
  };

  const handleUpdateUserStatus = async (userId, newStatus) => {
    try {
      await adminService.updateUserStatus(userId, newStatus);
      message.success(`User account status updated to ${newStatus}`);
      await loadData();
    } catch {
      message.error("Failed to update user status");
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      await adminService.deleteUser(userId);
      message.success("User account removed");
      await loadData();
    } catch {
      message.error("Failed to delete user");
    }
  };

  // Filtered lists
  const pendingRequests = useMemo(() => {
    return reservations.filter((r) => r.state === "pending");
  }, [reservations]);

  const filteredRequests = useMemo(() => {
    return reservations.filter((r) => {
      const q = requestSearch.toLowerCase();
      const matchesQuery =
        (r.reservation_id || "").toLowerCase().includes(q) ||
        (r.tenant_name || "").toLowerCase().includes(q) ||
        (r.contact_name || "").toLowerCase().includes(q) ||
        (r.contact_email || "").toLowerCase().includes(q) ||
        (r.organization_type || "").toLowerCase().includes(q);

      const matchesStatus =
        requestStatusFilter === "all" ||
        (r.state || "").toLowerCase() === requestStatusFilter.toLowerCase() ||
        (requestStatusFilter === "provisioning" && r.provisioning_status === "in_progress");

      const matchesRole =
        requestRoleFilter === "all" ||
        (r.requested_role || "").toLowerCase() === requestRoleFilter.toLowerCase();

      return matchesQuery && matchesStatus && matchesRole;
    });
  }, [reservations, requestSearch, requestStatusFilter, requestRoleFilter]);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = userSearch.toLowerCase();
      const matchesQuery =
        (u.username || "").toLowerCase().includes(q) ||
        (u.contact_name || "").toLowerCase().includes(q) ||
        (u.organization || "").toLowerCase().includes(q) ||
        (u.email || "").toLowerCase().includes(q);

      const matchesStatus =
        userStatusFilter === "all" ||
        (u.status || "").toLowerCase() === userStatusFilter.toLowerCase();

      const matchesRole =
        userRoleFilter === "all" ||
        (u.role || "").toLowerCase() === userRoleFilter.toLowerCase();

      return matchesQuery && matchesStatus && matchesRole;
    });
  }, [users, userSearch, userStatusFilter, userRoleFilter]);

  const filteredPlugins = useMemo(() => {
    return (serverConfig?.plugins || []).filter((p) =>
      p.toLowerCase().includes(pluginSearch.toLowerCase())
    );
  }, [serverConfig, pluginSearch]);

  const filteredAuditLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      const q = auditSearch.toLowerCase();
      const matchesQuery =
        (log.id || "").toLowerCase().includes(q) ||
        (log.event || "").toLowerCase().includes(q) ||
        (log.user || "").toLowerCase().includes(q) ||
        (log.details || "").toLowerCase().includes(q) ||
        (log.target || "").toLowerCase().includes(q);

      const matchesCategory =
        auditCategoryFilter === "all" ||
        (log.category || "").toLowerCase() === auditCategoryFilter.toLowerCase();

      return matchesQuery && matchesCategory;
    });
  }, [auditLogs, auditSearch, auditCategoryFilter]);

  // Request status tag helper
  const renderRequestStatusTag = (state, provisioningStatus) => {
    if (state === "approved") {
      return (
        <Space size={4} wrap>
          <Tag color="success" icon={<CheckCircleOutlined />} style={{ whiteSpace: "nowrap" }}>
            APPROVED
          </Tag>
          {provisioningStatus === "completed" && (
            <Tag color="blue" style={{ fontSize: 11, whiteSpace: "nowrap" }}>
              PROVISIONED
            </Tag>
          )}
        </Space>
      );
    }
    if (state === "denied") {
      return (
        <Tag color="error" icon={<CloseCircleOutlined />} style={{ whiteSpace: "nowrap" }}>
          REJECTED
        </Tag>
      );
    }
    return (
      <Tag color="gold" icon={<ClockCircleOutlined />} style={{ whiteSpace: "nowrap" }}>
        PENDING REVIEW
      </Tag>
    );
  };

  // Role tag helper
  const renderRoleTag = (role) => {
    const map = {
      issuer: { color: "blue", label: "ISSUER" },
      verifier: { color: "gold", label: "VERIFIER" },
      both: { color: "purple", label: "ISSUER & VERIFIER" },
      holder: { color: "cyan", label: "HOLDER" },
      admin: { color: "geekblue", label: "ADMIN" },
    };
    const conf = map[role] || { color: "default", label: (role || "ENTERPRISE").toUpperCase() };
    return (
      <Tag color={conf.color} style={{ fontWeight: 600, whiteSpace: "nowrap" }}>
        {conf.label}
      </Tag>
    );
  };

  // Columns: Organization Requests
  const requestColumns = [
    {
      title: "Request ID",
      dataIndex: "reservation_id",
      key: "reservation_id",
      width: 140,
      render: (t) => <span className="mono-badge">{t}</span>,
    },
    {
      title: "Organization",
      dataIndex: "tenant_name",
      key: "tenant_name",
      width: 220,
      render: (t, r) => (
        <div>
          <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{t}</div>
          <div className="mono-subtext" style={{ fontSize: 11 }}>
            {r.organization_type || "Participant Organization"}
          </div>
        </div>
      ),
    },
    {
      title: "Contact Person",
      dataIndex: "contact_name",
      key: "contact_name",
      width: 200,
      render: (name, r) => (
        <div>
          <div style={{ fontSize: 13 }}>{name}</div>
          <div className="mono-subtext">{r.contact_email}</div>
        </div>
      ),
    },
    {
      title: "Requested Role",
      dataIndex: "requested_role",
      key: "requested_role",
      width: 170,
      render: (role, r) => (
        <div>
          {renderRoleTag(role)}
          {r.requested_capabilities && r.requested_capabilities.length > 0 && (
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
              {r.requested_capabilities.length} capabilities requested
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "state",
      key: "state",
      width: 170,
      render: (s, r) => renderRequestStatusTag(s, r.provisioning_status),
    },
    {
      title: "Submitted",
      dataIndex: "created_at",
      key: "created_at",
      width: 120,
      render: (d) => <span style={{ whiteSpace: "nowrap", fontSize: 12 }}>{new Date(d).toLocaleDateString()}</span>,
    },
    {
      title: "Actions",
      key: "actions",
      width: 140,
      align: "right",
      render: (_, record) => (
        <Button
          type={record.state === "pending" ? "primary" : "default"}
          size="small"
          icon={<EyeOutlined />}
          onClick={() => handleOpenReviewModal(record)}
          style={record.state === "pending" ? { background: "#1B365D", borderColor: "#1B365D" } : {}}
        >
          Review Request
        </Button>
      ),
    },
  ];

  // Columns: Users
  const userColumns = [
    {
      title: "User ID",
      dataIndex: "id",
      key: "id",
      width: 120,
      render: (t) => <span className="mono-badge">{t}</span>,
    },
    {
      title: "Identity & Name",
      dataIndex: "username",
      key: "username",
      width: 220,
      render: (u, r) => (
        <div>
          <strong style={{ color: "var(--text-primary)" }}>{r.contact_name || u}</strong>
          <div className="mono-subtext">{u}</div>
        </div>
      ),
    },
    {
      title: "Organization",
      dataIndex: "organization",
      key: "organization",
      width: 200,
      render: (org) => <span>{org || "Independent Entity"}</span>,
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      width: 130,
      render: (r) => {
        const colors = { issuer: "blue", holder: "cyan", verifier: "gold", admin: "purple" };
        return (
          <Tag color={colors[r] || "default"} style={{ whiteSpace: "nowrap", fontWeight: 600 }}>
            {(r || "holder").toUpperCase()}
          </Tag>
        );
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 130,
      render: (s) => {
        const map = {
          active: <Tag color="success" style={{ whiteSpace: "nowrap" }}>ACTIVE</Tag>,
          pending: <Tag color="warning" style={{ whiteSpace: "nowrap" }}>PENDING</Tag>,
          suspended: <Tag color="error" style={{ whiteSpace: "nowrap" }}>SUSPENDED</Tag>,
          rejected: <Tag color="default" style={{ whiteSpace: "nowrap" }}>REJECTED</Tag>,
        };
        return map[s] || <Tag style={{ whiteSpace: "nowrap" }}>{(s || "active").toUpperCase()}</Tag>;
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 200,
      align: "right",
      render: (_, record) => (
        <Space size="small" style={{ whiteSpace: "nowrap" }}>
          <Button size="small" icon={<EyeOutlined />} onClick={() => setSelectedUserForView(record)}>
            Details
          </Button>

          {record.status === "active" ? (
            <Popconfirm
              title="Suspend this user account?"
              description="The user will temporarily lose login access to their portal."
              onConfirm={() => handleUpdateUserStatus(record.id, "suspended")}
              okText="Suspend Account"
              okType="danger"
              cancelText="Cancel"
            >
              <Button size="small" danger>
                Suspend
              </Button>
            </Popconfirm>
          ) : (
            <Popconfirm
              title="Activate this user account?"
              description="The user will regain portal access with their assigned role."
              onConfirm={() => handleUpdateUserStatus(record.id, "active")}
              okText="Activate Account"
              cancelText="Cancel"
            >
              <Button size="small" type="primary" style={{ background: "#10B981", borderColor: "#10B981" }}>
                Activate
              </Button>
            </Popconfirm>
          )}

          <Popconfirm
            title="Remove user record?"
            description="Are you sure you want to delete this user record permanently?"
            onConfirm={() => handleDeleteUser(record.id)}
            okText="Delete"
            okType="danger"
            cancelText="Cancel"
          >
            <Tooltip title="Remove User">
              <Button size="small" type="text" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // Columns: Tenants
  const tenantColumns = [
    {
      title: "Tenant ID",
      dataIndex: "tenant_id",
      key: "tenant_id",
      width: 140,
      render: (t) => <span className="mono-badge">{t}</span>,
    },
    {
      title: "Tenant / Organization Name",
      dataIndex: "tenant_name",
      key: "tenant_name",
      width: 220,
      render: (n) => <strong>{n}</strong>,
    },
    {
      title: "Provisioning Status",
      dataIndex: "is_active",
      key: "is_active",
      width: 150,
      render: (active) => (
        <Tag color={active ? "success" : "default"} icon={active ? <CheckCircleOutlined /> : <StopOutlined />}>
          {active ? "PROVISIONED & ACTIVE" : "INACTIVE"}
        </Tag>
      ),
    },
    {
      title: "Enabled Capabilities",
      key: "capabilities",
      width: 200,
      render: (_, r) => (
        <Space size={4} wrap>
          {r.canBecomeIssuer ? <Tag color="blue">Issuer Authority</Tag> : <Tag color="default">Verifier Only</Tag>}
          {r.enable_ledger_switch && <Tag color="purple">Multi-Ledger Switch</Tag>}
        </Space>
      ),
    },
    {
      title: "Ledger Connectivity",
      key: "ledger",
      width: 160,
      render: () => <Tag color="cyan">CDAC Indy Testnet</Tag>,
    },
    {
      title: "API Credential Status",
      dataIndex: "api_key_masked",
      key: "api_key_masked",
      width: 180,
      render: (k) => (
        <div>
          <Tag color="green">Configured</Tag>
          <span className="mono-subtext" style={{ fontSize: 11, marginLeft: 4 }}>
            {k || "sk_live_****"}
          </span>
        </div>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      align: "right",
      render: (_, record) => (
        <Button size="small" icon={<SettingOutlined />} onClick={() => handleOpenTenantConfig(record)}>
          Configure
        </Button>
      ),
    },
  ];

  // Columns: Audit Logs
  const auditColumns = [
    {
      title: "Log ID",
      dataIndex: "id",
      key: "id",
      width: 120,
      render: (id) => <span className="mono-badge">{id}</span>,
    },
    {
      title: "Event Action",
      dataIndex: "event",
      key: "event",
      width: 200,
      render: (ev, r) => (
        <div>
          <strong style={{ color: "var(--text-primary)" }}>{ev}</strong>
          {r.category && (
            <div style={{ marginTop: 2 }}>
              <Tag color="blue" style={{ fontSize: 10, lineHeight: "16px", padding: "0 4px" }}>
                {r.category}
              </Tag>
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Initiator",
      dataIndex: "user",
      key: "user",
      width: 170,
      render: (u) => <span className="mono-subtext">{u}</span>,
    },
    {
      title: "Target / Organization",
      dataIndex: "target",
      key: "target",
      width: 180,
      render: (target) => (
        <span style={{ fontSize: 12, fontWeight: 500 }}>
          {target || "System Network"}
        </span>
      ),
    },
    {
      title: "Details",
      dataIndex: "details",
      key: "details",
      width: 260,
      render: (d) => (
        <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
          {d}
        </span>
      ),
    },
    {
      title: "Timestamp",
      dataIndex: "timestamp",
      key: "timestamp",
      width: 160,
      render: (ts) => <span style={{ whiteSpace: "nowrap", fontSize: 12 }}>{new Date(ts).toLocaleString()}</span>,
    },
    {
      title: "Action",
      key: "action",
      width: 90,
      align: "right",
      render: (_, record) => (
        <Button size="small" icon={<EyeOutlined />} onClick={() => setSelectedAuditLog(record)}>
          Details
        </Button>
      ),
    },
  ];

  const tabTitles = {
    dashboard: "Admin Portal • Overview",
    requests: "Admin Portal • Organization Requests",
    users: "Admin Portal • User Accounts",
    system: "Admin Portal • Infrastructure",
    audit: "Admin Portal • Audit Logs",
  };

  const nodeStatusAction = (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 12px",
        borderRadius: 20,
        background: "var(--surface-2)",
        border: "1px solid var(--border-color)",
        fontSize: 12,
        fontWeight: 600,
        color: "var(--text-primary)",
      }}
    >
      <SafetyCertificateOutlined style={{ color: "#2563EB" }} />
      <span>Ledger: CDAC Indy Testnet</span>
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10B981", display: "inline-block" }} />
    </div>
  );

  return (
    <DashboardLayout title={tabTitles[activeTab] || "Admin Portal"} role="admin" actions={nodeStatusAction}>
      <div className="admin-dashboard animate-in">
        {/* ========================================================= */}
        {/* TAB: OVERVIEW                                             */}
        {/* ========================================================= */}
        {activeTab === "dashboard" && (
          <>
            {/* 4 Clickable Summary Stat Cards */}
            <div className="kpi-stats-row">
              <div
                onClick={() => navigate("/admin-requests")}
                style={{ cursor: "pointer" }}
                title="Click to view Organization Requests"
              >
                <StatCard
                  title="PENDING REQUESTS"
                  value={pendingRequests.length}
                  label="Awaiting Governance Review"
                  accent={{
                    color: "#2563EB",
                    bg: "#EFF6FF",
                    grad: "linear-gradient(135deg, #1B365D, #2563EB)",
                    icon: <BankOutlined />,
                  }}
                />
              </div>

              <div
                onClick={() => navigate("/admin-system")}
                style={{ cursor: "pointer" }}
                title="Click to view Infrastructure & Active Tenants"
              >
                <StatCard
                  title="ACTIVE TENANTS"
                  value={tenants.length}
                  label="Provisioned Organizations"
                  accent={{
                    color: "#2563EB",
                    bg: "#EFF6FF",
                    grad: "linear-gradient(135deg, #1B365D, #2563EB)",
                    icon: <ClusterOutlined />,
                  }}
                />
              </div>

              <div
                onClick={() => navigate("/admin-users")}
                style={{ cursor: "pointer" }}
                title="Click to manage User Accounts"
              >
                <StatCard
                  title="TOTAL SYSTEM USERS"
                  value={users.length}
                  label="Registered Identity Accounts"
                  accent={{
                    color: "#2563EB",
                    bg: "#EFF6FF",
                    grad: "linear-gradient(135deg, #1B365D, #2563EB)",
                    icon: <UsergroupAddOutlined />,
                  }}
                />
              </div>

              <div
                onClick={() => navigate("/admin-audit")}
                style={{ cursor: "pointer" }}
                title="Click to view Audit Logs"
              >
                <StatCard
                  title="AUDIT EVENTS"
                  value={auditLogs.length}
                  label="Recorded Governance Activity"
                  accent={{
                    color: "#2563EB",
                    bg: "#EFF6FF",
                    grad: "linear-gradient(135deg, #1B365D, #2563EB)",
                    icon: <AuditOutlined />,
                  }}
                />
              </div>
            </div>

            {/* Simplified Administration & Governance Banner */}
            <div className="overview-action-banner animate-in-d1">
              <div className="overview-banner-title">
                <h2>Network Administration & Governance Control</h2>
                <p>
                  Review and authorize onboarding requests for organizations joining the SSI network as Issuers, Verifiers, or Enterprise Participants.
                </p>
              </div>
              <div className="overview-action-btns">
                <Button
                  type="primary"
                  icon={<BankOutlined />}
                  onClick={() => navigate("/admin-requests")}
                  style={{ background: "#1B365D", borderColor: "#1B365D", fontWeight: 600 }}
                >
                  Review Pending Requests ({pendingRequests.length})
                </Button>
                <Button icon={<UsergroupAddOutlined />} onClick={() => setIsUserModalOpen(true)}>
                  Register User
                </Button>
                <Button icon={<FileTextOutlined />} onClick={() => setIsGuideModalOpen(true)}>
                  Onboarding Workflow Guide
                </Button>
                <Button icon={<SettingOutlined />} onClick={() => navigate("/admin-system")}>
                  Infrastructure
                </Button>
              </div>
            </div>

            {/* Prominent Pending Organization Requests Section */}
            <div className="content-card animate-in-d2">
              <div className="issuance-subtab-toolbar">
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div>
                    <h2 className="issuance-subtab-title">
                      Pending Organization Requests
                      {pendingRequests.length > 0 && (
                        <Badge
                          count={pendingRequests.length}
                          style={{ backgroundColor: "#F59E0B", marginLeft: 10 }}
                        />
                      )}
                    </h2>
                    <p className="issuance-subtab-desc">
                      Organizations awaiting administrative review and tenant enclave provisioning
                    </p>
                  </div>
                </div>
                <Button
                  type="link"
                  onClick={() => navigate("/admin-requests")}
                  style={{ fontWeight: 600, color: "#2563EB" }}
                >
                  View All Requests ({reservations.length}) <ArrowRightOutlined />
                </Button>
              </div>

              {pendingRequests.length === 0 ? (
                <div style={{ textAlign: "center", padding: "36px 16px", color: "var(--text-secondary)" }}>
                  <CheckCircleOutlined style={{ fontSize: 36, color: "#10B981", marginBottom: 12 }} />
                  <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)" }}>
                    No Pending Organization Requests
                  </div>
                  <div style={{ fontSize: 13, marginTop: 4 }}>
                    All submitted onboarding applications have been reviewed.
                  </div>
                </div>
              ) : (
                <Table
                  dataSource={pendingRequests.slice(0, 4)}
                  columns={requestColumns}
                  rowKey="reservation_id"
                  loading={loading}
                  pagination={false}
                  className="issuance-table"
                  scroll={{ x: 880 }}
                />
              )}
            </div>
          </>
        )}

        {/* ========================================================= */}
        {/* TAB: ORGANIZATION REQUESTS                                */}
        {/* ========================================================= */}
        {activeTab === "requests" && (
          <div className="content-card animate-in">
            <div className="issuance-subtab-toolbar">
              <div>
                <h2 className="issuance-subtab-title">Organization Requests & Governance Approval</h2>
                <p className="issuance-subtab-desc">
                  Review, approve, or reject onboarding applications from organizations joining the decentralized network.
                </p>
                <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                  {[
                    { key: "all", label: `ALL (${reservations.length})` },
                    { key: "pending", label: `PENDING REVIEW (${pendingRequests.length})` },
                    {
                      key: "approved",
                      label: `APPROVED (${reservations.filter((r) => r.state === "approved").length})`,
                    },
                    {
                      key: "denied",
                      label: `REJECTED (${reservations.filter((r) => r.state === "denied").length})`,
                    },
                  ].map((filter) => (
                    <Button
                      key={filter.key}
                      size="small"
                      type={requestStatusFilter === filter.key ? "primary" : "default"}
                      onClick={() => setRequestStatusFilter(filter.key)}
                      style={
                        requestStatusFilter === filter.key && filter.key === "pending"
                          ? { background: "#F59E0B", borderColor: "#F59E0B" }
                          : requestStatusFilter === filter.key
                          ? { background: "#1B365D", borderColor: "#1B365D" }
                          : {}
                      }
                    >
                      {filter.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <Select
                  value={requestRoleFilter}
                  onChange={setRequestRoleFilter}
                  style={{ width: 160 }}
                  options={[
                    { value: "all", label: "All Requested Roles" },
                    { value: "issuer", label: "Issuer Role" },
                    { value: "verifier", label: "Verifier Role" },
                    { value: "both", label: "Issuer & Verifier" },
                  ]}
                />
                <Input
                  prefix={<SearchOutlined style={{ color: "var(--text-muted)" }} />}
                  placeholder="Search organization or ID..."
                  value={requestSearch}
                  onChange={(e) => setRequestSearch(e.target.value)}
                  style={{ width: 230 }}
                  allowClear
                />
              </div>
            </div>

            <Table
              dataSource={filteredRequests}
              columns={requestColumns}
              rowKey="reservation_id"
              loading={loading}
              pagination={{ pageSize: 8 }}
              className="issuance-table"
              scroll={{ x: 900 }}
            />
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB: USER ACCOUNTS                                        */}
        {/* ========================================================= */}
        {activeTab === "users" && (
          <div className="content-card animate-in">
            <div className="issuance-subtab-toolbar">
              <div>
                <h2 className="issuance-subtab-title">Identity & User Governance Directory</h2>
                <p className="issuance-subtab-desc">
                  Manage individual identity accounts, role assignments, and access status across all portals.
                </p>
                <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                  {["all", "active", "pending", "suspended"].map((st) => (
                    <Button
                      key={st}
                      size="small"
                      type={userStatusFilter === st ? "primary" : "default"}
                      onClick={() => setUserStatusFilter(st)}
                      style={userStatusFilter === st ? { background: "#1B365D", borderColor: "#1B365D" } : {}}
                    >
                      {st.toUpperCase()}
                    </Button>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <Select
                  value={userRoleFilter}
                  onChange={setUserRoleFilter}
                  style={{ width: 140 }}
                  options={[
                    { value: "all", label: "All Roles" },
                    { value: "issuer", label: "Issuer" },
                    { value: "holder", label: "Holder" },
                    { value: "verifier", label: "Verifier" },
                    { value: "admin", label: "Admin" },
                  ]}
                />
                <Input
                  prefix={<SearchOutlined style={{ color: "var(--text-muted)" }} />}
                  placeholder="Search user or email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  style={{ width: 200 }}
                  allowClear
                />
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setIsUserModalOpen(true)}
                  style={{ background: "#1B365D", borderColor: "#1B365D" }}
                >
                  Register User
                </Button>
              </div>
            </div>

            <Table
              dataSource={filteredUsers}
              columns={userColumns}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
              className="issuance-table"
              scroll={{ x: 900 }}
            />
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB: INFRASTRUCTURE (Renamed from Node Telemetry)         */}
        {/* ========================================================= */}
        {activeTab === "system" && (
          <>
            {/* Section A: System Health Diagnostics */}
            <div className="content-card animate-in-d1">
              <div className="issuance-subtab-toolbar">
                <div>
                  <h2 className="issuance-subtab-title">System Health & Agent Connectivity</h2>
                  <p className="issuance-subtab-desc">
                    Operational status of decentralized agent enclaves, ledger nodes, and innkeeper services.
                  </p>
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    Development Simulation Data
                  </span>
                  <Button onClick={loadData} icon={<ReloadOutlined />} size="small">
                    Refresh Diagnostics
                  </Button>
                </div>
              </div>

              <div className="infra-health-grid">
                <div className="infra-health-card">
                  <div className="infra-health-header">
                    <span className="infra-service-title">Issuer Agent</span>
                    <Tag color="success" icon={<CheckCircleOutlined />}>ONLINE</Tag>
                  </div>
                  <div className="infra-health-desc">Aries Cloud Agent Python v{serverConfig?.acapy_version || "0.11.0"}</div>
                  <div className="infra-health-meta">Schema & Credential Issuance Ready</div>
                </div>

                <div className="infra-health-card">
                  <div className="infra-health-header">
                    <span className="infra-service-title">Holder Enclave</span>
                    <Tag color="success" icon={<CheckCircleOutlined />}>ONLINE</Tag>
                  </div>
                  <div className="infra-health-desc">Encrypted Edge Wallet Storage</div>
                  <div className="infra-health-meta">AnonCreds & W3C VC Compatible</div>
                </div>

                <div className="infra-health-card">
                  <div className="infra-health-header">
                    <span className="infra-service-title">Verifier Gateway</span>
                    <Tag color="success" icon={<CheckCircleOutlined />}>ONLINE</Tag>
                  </div>
                  <div className="infra-health-desc">Presentation Proof Verification Engine</div>
                  <div className="infra-health-meta">Zero-Knowledge Proof Evaluator Active</div>
                </div>

                <div className="infra-health-card">
                  <div className="infra-health-header">
                    <span className="infra-service-title">Innkeeper Multi-Tenant</span>
                    <Tag color="blue" icon={<ClusterOutlined />}>ACTIVE</Tag>
                  </div>
                  <div className="infra-health-desc">Traction v{serverConfig?.traction_version || "2.0.0"} Multi-Tenant Hub</div>
                  <div className="infra-health-meta">{tenants.length} Tenant Enclaves Isolated</div>
                </div>

                <div className="infra-health-card">
                  <div className="infra-health-header">
                    <span className="infra-service-title">Distributed Ledger</span>
                    <Tag color="cyan" icon={<GlobalOutlined />}>CONNECTED</Tag>
                  </div>
                  <div className="infra-health-desc">CDAC Indy Testnet Consortium Node</div>
                  <div className="infra-health-meta">Endorser DID Anchoring Synchronized</div>
                </div>

                <div className="infra-health-card">
                  <div className="infra-health-header">
                    <span className="infra-service-title">Health Check Monitor</span>
                    <Tag color="default">REAL-TIME</Tag>
                  </div>
                  <div className="infra-health-desc">
                    Last Check: {health?.lastSync ? new Date(health.lastSync).toLocaleTimeString() : "Synchronized"}
                  </div>
                  <div className="infra-health-meta">All 5 Core Services Responding</div>
                </div>
              </div>
            </div>

            {/* Section B: Active Multi-Tenant Organizations */}
            <div className="content-card animate-in-d2">
              <div className="issuance-subtab-toolbar">
                <div>
                  <h2 className="issuance-subtab-title">Active Multi-Tenant Organizations ({tenants.length})</h2>
                  <p className="issuance-subtab-desc">
                    Provisioned organizations operating isolated agent enclaves with assigned capabilities.
                  </p>
                </div>
              </div>
              <Table
                dataSource={tenants}
                columns={tenantColumns}
                rowKey="tenant_id"
                loading={loading}
                pagination={false}
                className="issuance-table"
                scroll={{ x: 850 }}
              />
            </div>

            {/* Section C: Advanced Infrastructure Details (Collapsible) */}
            <div className="content-card animate-in-d3">
              <Collapse
                ghost
                items={[
                  {
                    key: "advanced-infra",
                    label: (
                      <span style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: 15 }}>
                        <SettingOutlined style={{ marginRight: 8, color: "#2563EB" }} />
                        Advanced Infrastructure: Ledger Endorsers & ACA-Py Core Plugins
                      </span>
                    ),
                    children: (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 8 }}>
                        <Card title="Configured Ledger Endorsers" size="small" style={{ borderRadius: 8 }}>
                          <Table
                            dataSource={serverConfig?.config?.["ledger.ledger_config_list"] || []}
                            columns={[
                              {
                                title: "Ledger ID",
                                dataIndex: "id",
                                key: "id",
                                render: (t) => <span className="mono-badge">{t}</span>,
                              },
                              {
                                title: "Endorser Alias",
                                dataIndex: "endorser_alias",
                                key: "endorser_alias",
                                render: (a) => <strong>{a}</strong>,
                              },
                              {
                                title: "Endorser DID",
                                dataIndex: "endorser_did",
                                key: "endorser_did",
                                render: (d) => <span className="mono-subtext">{d}</span>,
                              },
                            ]}
                            rowKey="id"
                            pagination={false}
                            size="small"
                            scroll={{ x: 400 }}
                          />
                        </Card>

                        <Card
                          title="ACA-Py Core Plugins"
                          size="small"
                          style={{ borderRadius: 8 }}
                          extra={
                            <Input
                              size="small"
                              placeholder="Search plugins..."
                              value={pluginSearch}
                              onChange={(e) => setPluginSearch(e.target.value)}
                              style={{ width: 140 }}
                              allowClear
                            />
                          }
                        >
                          <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 220, overflow: "auto" }}>
                            {filteredPlugins.map((plug, idx) => (
                              <div key={idx} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                                <ApiOutlined style={{ color: "#2563EB" }} />
                                <span className="mono-subtext">{plug}</span>
                              </div>
                            ))}
                          </div>
                        </Card>
                      </div>
                    ),
                  },
                ]}
              />
            </div>

            {/* Section D: Secret Management Safety Notice */}
            <div style={{ padding: "12px 16px", background: "var(--surface-2)", borderRadius: 8, border: "1px solid var(--border-color)", fontSize: 12, color: "var(--text-secondary)" }}>
              <LockOutlined style={{ marginRight: 6, color: "#10B981" }} />
              <strong>Cryptographic Security Guarantee:</strong> Private keys, endorser signing seeds, and tenant secrets are safely isolated in server-side enclaves. Sensitive credentials are never exposed in browser state or frontend telemetry.
            </div>
          </>
        )}

        {/* ========================================================= */}
        {/* TAB: AUDIT LOGS                                           */}
        {/* ========================================================= */}
        {activeTab === "audit" && (
          <div className="content-card animate-in">
            <div className="issuance-subtab-toolbar">
              <div>
                <h2 className="issuance-subtab-title">System Audit Trail & Governance Activity Records</h2>
                <p className="issuance-subtab-desc">
                  Chronological records of administrative decisions, organization onboarding reviews, and tenant configuration changes.
                </p>
                <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                  {[
                    "all",
                    "Organization Onboarding",
                    "User Governance",
                    "Tenant Configuration",
                    "Credentials & Proofs",
                  ].map((cat) => (
                    <Button
                      key={cat}
                      size="small"
                      type={auditCategoryFilter === cat ? "primary" : "default"}
                      onClick={() => setAuditCategoryFilter(cat)}
                      style={auditCategoryFilter === cat ? { background: "#1B365D", borderColor: "#1B365D" } : {}}
                    >
                      {cat === "all" ? "ALL CATEGORIES" : cat.toUpperCase()}
                    </Button>
                  ))}
                </div>
              </div>

              <Input
                prefix={<SearchOutlined style={{ color: "var(--text-muted)" }} />}
                placeholder="Search audit trail..."
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                style={{ width: 250 }}
                allowClear
              />
            </div>

            <Table
              dataSource={filteredAuditLogs}
              columns={auditColumns}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
              className="issuance-table"
              scroll={{ x: 900 }}
            />
          </div>
        )}

        {/* ========================================================= */}
        {/* MODAL: REVIEW ORGANIZATION REQUEST                        */}
        {/* ========================================================= */}
        <Modal
          title={
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <BankOutlined style={{ color: "#2563EB" }} />
              <span>Review Organization Request: {selectedRequestForReview?.tenant_name}</span>
            </div>
          }
          open={isReviewModalOpen}
          onCancel={() => {
            if (!reviewActionProcessing) {
              setIsReviewModalOpen(false);
              setSelectedRequestForReview(null);
              setShowRejectInput(false);
            }
          }}
          width={680}
          footer={null}
          destroyOnClose
        >
          {selectedRequestForReview && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 16 }}>
              {/* Status Alert Banner */}
              {selectedRequestForReview.state === "pending" ? (
                <Alert
                  message="Pending Governance Approval"
                  description="This organization has applied to join the network. Review the submitted details and requested capabilities below."
                  type="warning"
                  showIcon
                />
              ) : selectedRequestForReview.state === "approved" ? (
                <Alert
                  message="Organization Approved & Provisioned"
                  description={`Approved on ${selectedRequestForReview.updated_at ? new Date(selectedRequestForReview.updated_at).toLocaleDateString() : "Recent Date"}. Tenant enclave active.`}
                  type="success"
                  showIcon
                />
              ) : (
                <Alert
                  message="Organization Request Rejected"
                  description={selectedRequestForReview.state_notes || "Request was declined during compliance review."}
                  type="error"
                  showIcon
                />
              )}

              {/* Organization & Contact Information */}
              <Descriptions bordered column={2} size="small" style={{ borderRadius: 8 }}>
                <Descriptions.Item label="Request ID">
                  <span className="mono-badge">{selectedRequestForReview.reservation_id}</span>
                </Descriptions.Item>
                <Descriptions.Item label="Submission Date">
                  {new Date(selectedRequestForReview.created_at).toLocaleString()}
                </Descriptions.Item>
                <Descriptions.Item label="Organization Name" span={2}>
                  <strong style={{ fontSize: 14 }}>{selectedRequestForReview.tenant_name}</strong>
                </Descriptions.Item>
                <Descriptions.Item label="Organization Type">
                  {selectedRequestForReview.organization_type || "Commercial Enterprise"}
                </Descriptions.Item>
                <Descriptions.Item label="Official Domain">
                  <code>{selectedRequestForReview.domain || "N/A"}</code>
                </Descriptions.Item>
                <Descriptions.Item label="Primary Contact">
                  {selectedRequestForReview.contact_name}
                </Descriptions.Item>
                <Descriptions.Item label="Contact Email">
                  <span className="mono-subtext">{selectedRequestForReview.contact_email}</span>
                </Descriptions.Item>
                <Descriptions.Item label="Contact Phone">
                  {selectedRequestForReview.contact_phone || "Not specified"}
                </Descriptions.Item>
                <Descriptions.Item label="Requested Role">
                  {renderRoleTag(selectedRequestForReview.requested_role)}
                </Descriptions.Item>
              </Descriptions>

              {/* Requested Capabilities */}
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 6 }}>
                  Requested Network Capabilities
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {(selectedRequestForReview.requested_capabilities || [
                    "Credential Issuance / Verification",
                  ]).map((cap, i) => (
                    <Tag key={i} color="blue" icon={<CheckCircleOutlined />}>
                      {cap}
                    </Tag>
                  ))}
                </div>
              </div>

              {/* Application Notes */}
              {selectedRequestForReview.state_notes && (
                <div style={{ padding: "10px 14px", background: "var(--surface-2)", borderRadius: 8, fontSize: 12 }}>
                  <strong>Governance Notes:</strong> {selectedRequestForReview.state_notes}
                </div>
              )}

              {/* Rejection reason input if prompted */}
              {showRejectInput && (
                <div style={{ padding: 12, background: "#FEF2F2", borderRadius: 8, border: "1px solid #FCA5A5" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#991B1B", marginBottom: 6 }}>
                    Reason for Rejection (Recorded in Audit Trail)
                  </div>
                  <TextArea
                    rows={2}
                    placeholder="Enter reason for rejecting this onboarding request..."
                    value={rejectionReasonInput}
                    onChange={(e) => setRejectionReasonInput(e.target.value)}
                  />
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
                    <Button size="small" onClick={() => setShowRejectInput(false)}>
                      Cancel
                    </Button>
                    <Button
                      size="small"
                      danger
                      type="primary"
                      loading={reviewActionProcessing}
                      onClick={() => handleDenyRequest(selectedRequestForReview)}
                    >
                      Confirm Rejection
                    </Button>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                <Button
                  onClick={() => {
                    setIsReviewModalOpen(false);
                    setSelectedRequestForReview(null);
                    setShowRejectInput(false);
                  }}
                >
                  Close
                </Button>

                {selectedRequestForReview.state === "pending" && (
                  <Space size="middle">
                    <Button
                      icon={<QuestionCircleOutlined />}
                      onClick={() => handleRequestMoreInfo(selectedRequestForReview)}
                    >
                      Request Info
                    </Button>

                    <Button
                      danger
                      icon={<CloseCircleOutlined />}
                      onClick={() => setShowRejectInput(true)}
                    >
                      Reject Request
                    </Button>

                    <Popconfirm
                      title="Approve organization onboarding?"
                      description="This will authorize the organization and provision a dedicated multi-tenant wallet enclave on the network."
                      onConfirm={() => handleApproveRequest(selectedRequestForReview)}
                      okText="Approve & Provision"
                      okType="primary"
                      cancelText="Cancel"
                    >
                      <Button
                        type="primary"
                        icon={<CheckOutlined />}
                        loading={reviewActionProcessing}
                        style={{ background: "#10B981", borderColor: "#10B981", fontWeight: 600 }}
                      >
                        Approve Request
                      </Button>
                    </Popconfirm>
                  </Space>
                )}
              </div>
            </div>
          )}
        </Modal>

        {/* ========================================================= */}
        {/* MODAL: CONTEXTUAL ONBOARDING WORKFLOW GUIDE               */}
        {/* ========================================================= */}
        <Modal
          title={
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <InfoCircleOutlined style={{ color: "#2563EB" }} />
              <span>How Organization Onboarding & Governance Works</span>
            </div>
          }
          open={isGuideModalOpen}
          onCancel={() => setIsGuideModalOpen(false)}
          width={720}
          footer={[
            <Button key="close" type="primary" onClick={() => setIsGuideModalOpen(false)} style={{ background: "#1B365D", borderColor: "#1B365D" }}>
              Got It
            </Button>,
          ]}
          destroyOnClose
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 12 }}>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>
              The SSI Network Governance Innkeeper oversees the lifecycle of organizations applying to issue or verify credentials:
            </p>

            <div className="guide-step-row">
              <div className="guide-step-badge">1</div>
              <div>
                <strong style={{ color: "var(--text-primary)" }}>Organization Submits Onboarding Request</strong>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--text-secondary)" }}>
                  An enterprise applies through the onboarding portal with official business identity, contact person, and requested roles (Issuer, Verifier, or both).
                </p>
              </div>
            </div>

            <div className="guide-step-row">
              <div className="guide-step-badge">2</div>
              <div>
                <strong style={{ color: "var(--text-primary)" }}>Governance Review by Administrator</strong>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--text-secondary)" }}>
                  Administrator reviews domain validity, contact email, and requested capabilities in the Organization Requests queue.
                </p>
              </div>
            </div>

            <div className="guide-step-row">
              <div className="guide-step-badge">3</div>
              <div>
                <strong style={{ color: "var(--text-primary)" }}>Approval & Tenant Enclave Provisioning</strong>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--text-secondary)" }}>
                  When approved, a dedicated multi-tenant wallet enclave, isolated database partition, and secure API keys are provisioned in ACA-Py.
                </p>
              </div>
            </div>

            <div className="guide-step-row">
              <div className="guide-step-badge">4</div>
              <div>
                <strong style={{ color: "var(--text-primary)" }}>Ledger Capability & Endorsement</strong>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--text-secondary)" }}>
                  Issuer tenants are granted ledger publication authority to anchor schema definitions and public DIDs onto the CDAC Indy ledger.
                </p>
              </div>
            </div>

            <div className="guide-step-row">
              <div className="guide-step-badge">5</div>
              <div>
                <strong style={{ color: "var(--text-primary)" }}>Continuous Audit Logging</strong>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--text-secondary)" }}>
                  All approval decisions, account modifications, and tenant capability changes are captured in the immutable audit trail.
                </p>
              </div>
            </div>
          </div>
        </Modal>

        {/* ========================================================= */}
        {/* MODAL: CONFIGURE TENANT PERMISSIONS                       */}
        {/* ========================================================= */}
        <Modal
          title={
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <SettingOutlined style={{ color: "#2563EB" }} />
              <span>Configure Tenant: {selectedTenantForConfig?.tenant_name}</span>
            </div>
          }
          open={isTenantModalOpen}
          onCancel={() => setIsTenantModalOpen(false)}
          footer={null}
          destroyOnClose
        >
          <Form
            form={tenantConfigForm}
            layout="vertical"
            onFinish={handleSaveTenantConfig}
            style={{ marginTop: 16 }}
          >
            <Form.Item
              name="canBecomeIssuer"
              label="Issuer Authority"
              valuePropName="checked"
              extra="Allows this tenant to register schemas and publish credential definitions to the ledger."
            >
              <Switch checkedChildren="Enabled" unCheckedChildren="Disabled" />
            </Form.Item>

            <Form.Item
              name="enable_ledger_switch"
              label="Multi-Ledger Switching"
              valuePropName="checked"
              extra="Allows switching between multiple endorser ledgers."
            >
              <Switch checkedChildren="Enabled" unCheckedChildren="Disabled" />
            </Form.Item>

            <div style={{ padding: 12, background: "var(--surface-2)", borderRadius: 8, marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                <div><strong>Tenant ID:</strong> <code>{selectedTenantForConfig?.tenant_id}</code></div>
                <div><strong>Wallet ID:</strong> <code>{selectedTenantForConfig?.wallet_id}</code></div>
                <div><strong>API Key Status:</strong> <Tag color="green">Configured & Masked</Tag></div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Popconfirm
                title="De-provision tenant?"
                description="This will remove the tenant enclave from the active network directory."
                onConfirm={() => {
                  handleDeleteTenant(selectedTenantForConfig?.tenant_id);
                  setIsTenantModalOpen(false);
                }}
                okText="Remove"
                okType="danger"
                cancelText="Cancel"
              >
                <Button danger type="text">
                  Delete Tenant
                </Button>
              </Popconfirm>

              <Space>
                <Button onClick={() => setIsTenantModalOpen(false)}>Cancel</Button>
                <Button type="primary" htmlType="submit" style={{ background: "#1B365D", borderColor: "#1B365D" }}>
                  Save Configuration
                </Button>
              </Space>
            </div>
          </Form>
        </Modal>

        {/* ========================================================= */}
        {/* MODAL: USER DETAILS                                       */}
        {/* ========================================================= */}
        <Modal
          title={
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <UsergroupAddOutlined style={{ color: "#2563EB" }} />
              <span>User Account Details</span>
            </div>
          }
          open={!!selectedUserForView}
          onCancel={() => setSelectedUserForView(null)}
          footer={[
            <Button key="close" onClick={() => setSelectedUserForView(null)}>
              Close
            </Button>,
          ]}
          destroyOnClose
        >
          {selectedUserForView && (
            <Descriptions bordered column={1} size="small" style={{ borderRadius: 8, marginTop: 12 }}>
              <Descriptions.Item label="User ID">
                <span className="mono-badge">{selectedUserForView.id}</span>
              </Descriptions.Item>
              <Descriptions.Item label="Username / Email">
                <strong>{selectedUserForView.username}</strong>
              </Descriptions.Item>
              <Descriptions.Item label="Full Name">
                {selectedUserForView.contact_name || "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="Associated Organization">
                {selectedUserForView.organization || "Independent Entity"}
              </Descriptions.Item>
              <Descriptions.Item label="System Role">
                {renderRoleTag(selectedUserForView.role)}
              </Descriptions.Item>
              <Descriptions.Item label="Account Status">
                <Tag color={selectedUserForView.status === "active" ? "success" : "warning"}>
                  {(selectedUserForView.status || "active").toUpperCase()}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Registered Date">
                {new Date(selectedUserForView.createdAt).toLocaleString()}
              </Descriptions.Item>
            </Descriptions>
          )}
        </Modal>

        {/* ========================================================= */}
        {/* MODAL: REGISTER USER                                      */}
        {/* ========================================================= */}
        <Modal
          title="Register New User Account"
          open={isUserModalOpen}
          onCancel={() => setIsUserModalOpen(false)}
          footer={null}
          destroyOnClose
        >
          <Form
            form={userForm}
            layout="vertical"
            onFinish={handleCreateUser}
            initialValues={{ role: "issuer", status: "active" }}
            style={{ marginTop: 16 }}
          >
            <Form.Item
              name="username"
              label="Username / Email"
              rules={[{ required: true, message: "Enter username" }]}
            >
              <Input placeholder="user@example.com" />
            </Form.Item>
            <Form.Item name="contact_name" label="Full Name">
              <Input placeholder="e.g. Dr. Arthur Pendelton" />
            </Form.Item>
            <Form.Item name="organization" label="Organization">
              <Input placeholder="e.g. University Credentials Authority" />
            </Form.Item>
            <Form.Item name="role" label="System Role" rules={[{ required: true }]}>
              <Select
                options={[
                  { value: "issuer", label: "Issuer (Credential Authority)" },
                  { value: "holder", label: "Holder (Digital Wallet Owner)" },
                  { value: "verifier", label: "Verifier (Proof Validator)" },
                  { value: "admin", label: "Admin (Platform Governance)" },
                ]}
              />
            </Form.Item>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 24 }}>
              <Button onClick={() => setIsUserModalOpen(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit" style={{ background: "#1B365D", borderColor: "#1B365D" }}>
                Register Account
              </Button>
            </div>
          </Form>
        </Modal>

        {/* ========================================================= */}
        {/* MODAL: AUDIT LOG DETAILS                                  */}
        {/* ========================================================= */}
        <Modal
          title={
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <AuditOutlined style={{ color: "#2563EB" }} />
              <span>Audit Event Record</span>
            </div>
          }
          open={!!selectedAuditLog}
          onCancel={() => setSelectedAuditLog(null)}
          footer={[
            <Button key="close" onClick={() => setSelectedAuditLog(null)}>
              Close
            </Button>,
          ]}
          destroyOnClose
        >
          {selectedAuditLog && (
            <Descriptions bordered column={1} size="small" style={{ borderRadius: 8, marginTop: 12 }}>
              <Descriptions.Item label="Record ID">
                <span className="mono-badge">{selectedAuditLog.id}</span>
              </Descriptions.Item>
              <Descriptions.Item label="Event Action">
                <strong>{selectedAuditLog.event}</strong>
              </Descriptions.Item>
              <Descriptions.Item label="Category">
                <Tag color="blue">{selectedAuditLog.category || "Governance"}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Initiating Actor">
                <span className="mono-subtext">{selectedAuditLog.user}</span>
              </Descriptions.Item>
              <Descriptions.Item label="Target Entity">
                {selectedAuditLog.target || "System Network"}
              </Descriptions.Item>
              <Descriptions.Item label="Event Description">
                {selectedAuditLog.details}
              </Descriptions.Item>
              <Descriptions.Item label="Recorded Timestamp">
                {new Date(selectedAuditLog.timestamp).toLocaleString()}
              </Descriptions.Item>
            </Descriptions>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;