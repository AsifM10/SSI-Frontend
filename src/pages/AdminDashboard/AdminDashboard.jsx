import { useState, useEffect } from "react";
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
} from "antd";
import {
  SettingOutlined,
  UsergroupAddOutlined,
  CloudServerOutlined,
  SafetyOutlined,
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
  DeploymentUnitOutlined,
  LockOutlined,
  RocketOutlined,
  InfoCircleOutlined,
  SafetyCertificateOutlined,
  WalletOutlined,
  AuditOutlined,
  DesktopOutlined,
  ThunderboltOutlined,
  GlobalOutlined,
} from "@ant-design/icons";
import DashboardLayout from "../../layouts/DashboardLayout/DashboardLayout";
import StatCard from "../../components/cards/StatCard/StatCard";
import { adminService } from "../../services/apiClient";
import "./AdminDashboard.css";

const { Option } = Select;

const AdminDashboard = ({ activeTab = "dashboard" }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [serverConfig, setServerConfig] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [health, setHealth] = useState(null);

  // Filters
  const [userSearch, setUserSearch] = useState("");
  const [userStatusFilter, setUserStatusFilter] = useState("all");
  const [pluginSearch, setPluginSearch] = useState("");
  const [auditSearch, setAuditSearch] = useState("");

  // Modals
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [selectedUserForView, setSelectedUserForView] = useState(null);
  const [selectedTenantForConfig, setSelectedTenantForConfig] = useState(null);
  const [isTenantModalOpen, setIsTenantModalOpen] = useState(false);
  const [selectedAuditLog, setSelectedAuditLog] = useState(null);
  const [isHealthModalOpen, setIsHealthModalOpen] = useState(false);

  const [tenantConfigForm] = Form.useForm();
  const [userForm] = Form.useForm();

  const loadData = async () => {
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
  };

  useEffect(() => {
    loadData();
  }, []);

  // Reservation Actions
  const handleApproveReservation = async (reservationId) => {
    try {
      const res = await adminService.approveReservation(
        reservationId,
        "Approved by Governance Innkeeper Administrator"
      );
      if (res?.success) {
        message.success("Reservation approved and tenant provisioned!");
        loadData();
      }
    } catch {
      message.error("Failed to approve reservation");
    }
  };

  const handleDenyReservation = async (reservationId) => {
    const reason = prompt("Enter reason for reservation denial:", "Failed compliance verification");
    if (reason === null) return;
    try {
      const res = await adminService.denyReservation(reservationId, reason);
      if (res?.success) {
        message.info("Reservation denied");
        loadData();
      }
    } catch {
      message.error("Failed to deny reservation");
    }
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
        loadData();
      }
    } catch {
      message.error("Failed to update tenant configuration");
    }
  };

  const handleDeleteTenant = async (tenantId) => {
    try {
      await adminService.deleteTenant(tenantId);
      message.success("Tenant deleted");
      loadData();
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
        loadData();
      }
    } catch {
      message.error("Failed to create user");
    }
  };

  const handleUpdateUserStatus = async (userId, newStatus) => {
    try {
      await adminService.updateUserStatus(userId, newStatus);
      message.success(`User status updated to ${newStatus}`);
      loadData();
    } catch {
      message.error("Failed to update user status");
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      await adminService.deleteUser(userId);
      message.success("User deleted");
      loadData();
    } catch {
      message.error("Failed to delete user");
    }
  };

  // Filtered lists
  const pendingReservations = reservations.filter((r) => r.state === "pending");

  const filteredUsers = users.filter((u) => {
    const matchesQuery =
      (u.username || "").toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.contact_name || "").toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.organization || "").toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.role || "").toLowerCase().includes(userSearch.toLowerCase());

    if (userStatusFilter === "all") return matchesQuery;
    return matchesQuery && (u.status || "").toLowerCase() === userStatusFilter.toLowerCase();
  });

  const filteredPlugins = (serverConfig?.plugins || []).filter((p) =>
    p.toLowerCase().includes(pluginSearch.toLowerCase())
  );

  const filteredAuditLogs = auditLogs.filter((log) => {
    const q = auditSearch.toLowerCase();
    return (
      (log.id || "").toLowerCase().includes(q) ||
      (log.event || "").toLowerCase().includes(q) ||
      (log.user || "").toLowerCase().includes(q) ||
      (log.details || "").toLowerCase().includes(q)
    );
  });

  // Columns: Reservations
  const reservationColumns = [
    {
      title: "Reservation ID",
      dataIndex: "reservation_id",
      key: "reservation_id",
      width: 160,
      render: (t) => <span className="mono-badge">{t}</span>,
    },
    {
      title: "Tenant / Organization",
      dataIndex: "tenant_name",
      key: "tenant_name",
      width: 200,
      render: (t) => <strong>{t}</strong>,
    },
    {
      title: "Contact Person",
      dataIndex: "contact_name",
      key: "contact_name",
      width: 220,
      render: (name, r) => (
        <div>
          <div>{name}</div>
          <div className="mono-subtext">{r.contact_email}</div>
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "state",
      key: "state",
      width: 150,
      render: (s) => {
        if (s === "approved") return <Tag color="success" icon={<CheckCircleOutlined />} style={{ whiteSpace: "nowrap" }}>APPROVED</Tag>;
        if (s === "denied") return <Tag color="error" icon={<CloseCircleOutlined />} style={{ whiteSpace: "nowrap" }}>DENIED</Tag>;
        return <Tag color="warning" icon={<ClockCircleOutlined />} style={{ whiteSpace: "nowrap" }}>PENDING APPROVAL</Tag>;
      },
    },
    {
      title: "Submitted",
      dataIndex: "created_at",
      key: "created_at",
      width: 120,
      render: (d) => <span style={{ whiteSpace: "nowrap" }}>{new Date(d).toLocaleDateString()}</span>,
    },
    {
      title: "Actions",
      key: "actions",
      width: 180,
      align: "right",
      render: (_, record) => {
        if (record.state !== "pending") {
          return <span style={{ fontSize: 12, color: "var(--text-secondary)", whiteSpace: "nowrap" }}>{record.state_notes || "Completed"}</span>;
        }
        return (
          <Space size="small" style={{ whiteSpace: "nowrap" }}>
            <Button
              type="primary"
              size="small"
              icon={<CheckOutlined />}
              style={{ background: "#10B981", borderColor: "#10B981" }}
              onClick={() => handleApproveReservation(record.reservation_id)}
            >
              Approve
            </Button>
            <Button
              size="small"
              danger
              icon={<StopOutlined />}
              onClick={() => handleDenyReservation(record.reservation_id)}
            >
              Deny
            </Button>
          </Space>
        );
      },
    },
  ];

  // Columns: Tenants
  const tenantColumns = [
    {
      title: "Tenant ID",
      dataIndex: "tenant_id",
      key: "tenant_id",
      width: 150,
      render: (t) => <span className="mono-badge">{t}</span>,
    },
    {
      title: "Tenant Name",
      dataIndex: "tenant_name",
      key: "tenant_name",
      width: 200,
      render: (n) => <strong>{n}</strong>,
    },
    {
      title: "Issuer Capability",
      dataIndex: "canBecomeIssuer",
      key: "canBecomeIssuer",
      width: 160,
      render: (can) => (can ? <Tag color="blue" style={{ whiteSpace: "nowrap" }}>ISSUER ENABLED</Tag> : <Tag color="default" style={{ whiteSpace: "nowrap" }}>VERIFIER ONLY</Tag>),
    },
    {
      title: "Ledger Switching",
      dataIndex: "enable_ledger_switch",
      key: "enable_ledger_switch",
      width: 140,
      render: (sw) => (sw ? <Tag color="purple" style={{ whiteSpace: "nowrap" }}>ENABLED</Tag> : <Tag color="default" style={{ whiteSpace: "nowrap" }}>DISABLED</Tag>),
    },
    {
      title: "API Key",
      dataIndex: "api_key_masked",
      key: "api_key_masked",
      width: 150,
      render: (k) => <span className="mono-subtext">{k || "sk_live_****"}</span>,
    },
    {
      title: "Actions",
      key: "actions",
      width: 140,
      align: "right",
      render: (_, record) => (
        <Space size="small" style={{ whiteSpace: "nowrap" }}>
          <Button size="small" icon={<SettingOutlined />} onClick={() => handleOpenTenantConfig(record)}>
            Configure
          </Button>
          <Popconfirm
            title="Delete this active tenant?"
            onConfirm={() => handleDeleteTenant(record.tenant_id)}
            okText="Yes"
            cancelText="No"
          >
            <Button size="small" type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // Columns: Users
  const userColumns = [
    { title: "User ID", dataIndex: "id", key: "id", width: 140, render: (t) => <span className="mono-badge">{t}</span> },
    {
      title: "Identity & Name",
      dataIndex: "username",
      key: "username",
      width: 220,
      render: (u, r) => (
        <div>
          <strong>{r.contact_name || u}</strong>
          <div className="mono-subtext">{u}</div>
        </div>
      ),
    },
    {
      title: "Organization",
      dataIndex: "organization",
      key: "organization",
      width: 180,
      render: (org) => <span>{org || "Independent Entity"}</span>,
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      width: 120,
      render: (r) => {
        const colors = { issuer: "indigo", holder: "cyan", verifier: "gold", admin: "purple" };
        return <Tag color={colors[r] || "default"} style={{ whiteSpace: "nowrap" }}>{(r || "holder").toUpperCase()}</Tag>;
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
      width: 190,
      align: "right",
      render: (_, record) => (
        <Space size="small" style={{ whiteSpace: "nowrap" }}>
          <Button size="small" icon={<EyeOutlined />} onClick={() => setSelectedUserForView(record)}>
            Details
          </Button>
          {record.status === "active" ? (
            <Button size="small" danger onClick={() => handleUpdateUserStatus(record.id, "suspended")}>
              Suspend
            </Button>
          ) : (
            <Button size="small" type="primary" onClick={() => handleUpdateUserStatus(record.id, "active")}>
              Activate
            </Button>
          )}
          <Popconfirm
            title="Delete user record?"
            onConfirm={() => handleDeleteUser(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button size="small" type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
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
      width: 180,
      render: (ev) => <strong>{ev}</strong>,
    },
    {
      title: "Actor / Initiator",
      dataIndex: "user",
      key: "user",
      width: 180,
      render: (u) => <span className="mono-subtext">{u}</span>,
    },
    {
      title: "Event Details",
      dataIndex: "details",
      key: "details",
      width: 260,
      render: (d) => <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{d}</span>,
    },
    {
      title: "Timestamp",
      dataIndex: "timestamp",
      key: "timestamp",
      width: 160,
      render: (ts) => <span style={{ whiteSpace: "nowrap" }}>{new Date(ts).toLocaleString()}</span>,
    },
    {
      title: "Action",
      key: "action",
      width: 100,
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
    users: "Admin Portal • User Accounts",
    system: "Admin Portal • Node Telemetry",
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
      <span>Node: CDAC Indy Ledger</span>
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10B981", display: "inline-block" }} />
    </div>
  );

  return (
    <DashboardLayout title={tabTitles[activeTab] || "Admin Portal"} role="admin" actions={nodeStatusAction}>
      <div className="admin-dashboard animate-in">
        {/* ========================================================= */}
        {/* TAB: OVERVIEW (Dashboard Control, Telemetry & About)      */}
        {/* ========================================================= */}
        {activeTab === "dashboard" && (
          <>
            {/* 4 Stat Cards Row (Overview Only) */}
            <div className="kpi-stats-row">
              <StatCard
                title="PENDING RESERVATIONS"
                value={pendingReservations.length}
                label="Awaiting Governance Approval"
                accent={{
                  color: "#2563EB",
                  bg: "#EFF6FF",
                  grad: "linear-gradient(135deg, #1B365D, #2563EB)",
                  icon: <BankOutlined />,
                }}
              />
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
              <StatCard
                title="TOTAL SYSTEM USERS"
                value={users.length}
                label="Registered Accounts"
                accent={{
                  color: "#2563EB",
                  bg: "#EFF6FF",
                  grad: "linear-gradient(135deg, #1B365D, #2563EB)",
                  icon: <UsergroupAddOutlined />,
                }}
              />
              <StatCard
                title="AUDIT EVENTS"
                value={auditLogs.length}
                label="Immutable Log Records"
                accent={{
                  color: "#2563EB",
                  bg: "#EFF6FF",
                  grad: "linear-gradient(135deg, #1B365D, #2563EB)",
                  icon: <SafetyOutlined />,
                }}
              />
            </div>

            {/* Overview Action Banner */}
            <div className="overview-action-banner animate-in-d1">
              <div className="overview-banner-title">
                <h2>Platform Administration & Innkeeper Governance Control</h2>
                <p>
                  Manage multi-tenant agent enclaves, endorse tenant reservations, govern user accounts, and monitor ACA-Py ledger telemetry.
                </p>
              </div>
              <div className="overview-action-btns">
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setIsUserModalOpen(true)}
                  style={{ background: "#1B365D", borderColor: "#1B365D" }}
                >
                  Register User
                </Button>
                <Button icon={<DesktopOutlined />} onClick={() => setIsHealthModalOpen(true)}>
                  Inspect Node Health
                </Button>
                <Button icon={<AuditOutlined />} onClick={() => navigate("/admin-audit")}>
                  Audit Trail
                </Button>
                <Button icon={<SettingOutlined />} onClick={() => navigate("/admin-system")}>
                  Node Telemetry
                </Button>
              </div>
            </div>

            {/* Cryptographic & Telemetry Grid */}
            <div className="overview-telemetry-grid animate-in-d1">
              <div className="telemetry-mini-card">
                <div className="telemetry-icon-box" style={{ background: "#EFF6FF", color: "#2563EB" }}>
                  <CloudServerOutlined />
                </div>
                <div>
                  <div className="telemetry-label">AGENT ENGINE</div>
                  <div className="telemetry-val">ACA-Py v{serverConfig?.acapy_version || "0.11.0"}</div>
                  <div className="telemetry-sub">Hyperledger Aries Cloud Agent Python</div>
                </div>
              </div>

              <div className="telemetry-mini-card">
                <div className="telemetry-icon-box" style={{ background: "#EFF6FF", color: "#2563EB" }}>
                  <ClusterOutlined />
                </div>
                <div>
                  <div className="telemetry-label">GOVERNANCE MODE</div>
                  <div className="telemetry-val">Multi-Tenant Innkeeper</div>
                  <div className="telemetry-sub">Isolated Tenant Enclave Architecture</div>
                </div>
              </div>

              <div className="telemetry-mini-card">
                <div className="telemetry-icon-box" style={{ background: "#EFF6FF", color: "#2563EB" }}>
                  <GlobalOutlined />
                </div>
                <div>
                  <div className="telemetry-label">DISTRIBUTED LEDGERS</div>
                  <div className="telemetry-val">CDAC Indy Testnet</div>
                  <div className="telemetry-sub">Multi-Endorser Consensus Anchoring</div>
                </div>
              </div>

              <div className="telemetry-mini-card">
                <div className="telemetry-icon-box" style={{ background: "#EFF6FF", color: "#2563EB" }}>
                  <LockOutlined />
                </div>
                <div>
                  <div className="telemetry-label">CRYPTOGRAPHIC SECURITY</div>
                  <div className="telemetry-val">W3C AnonCreds & Ed25519</div>
                  <div className="telemetry-sub">Hardware Enclave Signing</div>
                </div>
              </div>
            </div>

            {/* Pending Reservations Snapshot */}
            <div className="content-card animate-in-d2">
              <div className="issuance-subtab-toolbar" style={{ borderBottom: "none", paddingBottom: 0, marginBottom: 16 }}>
                <div>
                  <h2 className="issuance-subtab-title" style={{ fontSize: 18 }}>Pending Tenant Reservations Snapshot</h2>
                  <p className="issuance-subtab-desc">
                    Incoming organizations requesting tenant provisioning and ledger endorser access
                  </p>
                </div>
                <Button type="link" onClick={() => navigate("/admin-system")} style={{ fontWeight: 600, color: "#2563EB" }}>
                  View All Infrastructure & Tenants <ArrowRightOutlined />
                </Button>
              </div>
              <Table
                dataSource={reservations.slice(0, 3)}
                columns={reservationColumns}
                rowKey="reservation_id"
                loading={loading}
                pagination={false}
                className="issuance-table"
                scroll={{ x: 850 }}
              />
            </div>

            {/* 5-Step Innkeeper Governance & Provisioning Lifecycle */}
            <div className="about-admin-container animate-in-d2">
              <div className="about-header" style={{ borderBottom: "none", paddingBottom: 0 }}>
                <span className="about-header-badge">
                  <InfoCircleOutlined /> Workflow Guide
                </span>
                <h2>5-Step Innkeeper Governance & Provisioning Lifecycle</h2>
                <p>
                  A simple step-by-step workflow of how tenant organizations are reviewed, provisioned, and authorized on the network.
                </p>
              </div>

              <div className="lifecycle-steps-grid">
                <div className="lifecycle-step">
                  <div className="lifecycle-step-header">
                    <span className="lifecycle-step-num">STEP 01</span>
                    <div className="lifecycle-step-icon">
                      <BankOutlined />
                    </div>
                  </div>
                  <h5>Reservation Inquiry</h5>
                  <p>Enterprise submits onboarding reservation with contact details and credentials.</p>
                </div>

                <div className="lifecycle-step">
                  <div className="lifecycle-step-header">
                    <span className="lifecycle-step-num">STEP 02</span>
                    <div className="lifecycle-step-icon">
                      <SafetyCertificateOutlined />
                    </div>
                  </div>
                  <h5>Compliance Review</h5>
                  <p>Governance administrator verifies organizational credentials and endorser eligibility.</p>
                </div>

                <div className="lifecycle-step">
                  <div className="lifecycle-step-header">
                    <span className="lifecycle-step-num">STEP 03</span>
                    <div className="lifecycle-step-icon">
                      <ClusterOutlined />
                    </div>
                  </div>
                  <h5>Enclave Provisioning</h5>
                  <p>Dedicated tenant wallet, secure keypair, and API credentials are provisioned in ACA-Py.</p>
                </div>

                <div className="lifecycle-step">
                  <div className="lifecycle-step-header">
                    <span className="lifecycle-step-num">STEP 04</span>
                    <div className="lifecycle-step-icon">
                      <GlobalOutlined />
                    </div>
                  </div>
                  <h5>Ledger Authorization</h5>
                  <p>Grant schema publication rights and configure multi-ledger endorser switching.</p>
                </div>

                <div className="lifecycle-step">
                  <div className="lifecycle-step-header">
                    <span className="lifecycle-step-num">STEP 05</span>
                    <div className="lifecycle-step-icon">
                      <AuditOutlined />
                    </div>
                  </div>
                  <h5>Telemetry & Audit</h5>
                  <p>Continuous telemetry monitoring and cryptographic audit event capture ensure compliance.</p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ========================================================= */}
        {/* 3. USERS TAB: Identity & User Governance Table            */}
        {/* ========================================================= */}
        {activeTab === "users" && (
          <div className="content-card animate-in">
            <div className="issuance-subtab-toolbar" style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <div>
                <h2 className="issuance-subtab-title">Identity & User Governance Directory</h2>
                <p className="issuance-subtab-desc">
                  Provision, monitor, and regulate user accounts across all SSI roles.
                </p>
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  {["all", "active", "pending", "suspended"].map((st) => (
                    <Button
                      key={st}
                      size="small"
                      type={userStatusFilter === st ? "primary" : "default"}
                      onClick={() => setUserStatusFilter(st)}
                    >
                      {st.toUpperCase()}
                    </Button>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <Input
                  prefix={<SearchOutlined style={{ color: "var(--text-muted)" }} />}
                  placeholder="Filter users..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  style={{ width: 220 }}
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
        {/* 4. SYSTEM TAB: Node Telemetry & Multi-Tenant Infrastructure */}
        {/* ========================================================= */}
        {activeTab === "system" && (
          <>
            {/* Ledger & Agent Status Box */}
            <div className="did-banner-card animate-in-d1">
              <div className="did-banner-left">
                <div className="did-icon-box" style={{ background: "#EFF6FF", color: "#2563EB" }}>
                  <CheckCircleOutlined />
                </div>
                <div>
                  <span className="did-sub">ACA-PY & DECENTRALIZED NETWORK TELEMETRY</span>
                  <div className="did-string">
                    Traction v{serverConfig?.traction_version || "2.0.0"} • ACA-Py v{serverConfig?.acapy_version || "0.11.0"}
                  </div>
                  <div style={{ display: "flex", gap: "8px", marginTop: "6px", flexWrap: "wrap" }}>
                    <Tag color="success">Issuer Agent: ONLINE</Tag>
                    <Tag color="success">Holder Enclave: READY</Tag>
                    <Tag color="success">Verifier Gate: ACTIVE</Tag>
                    <Tag color="blue">Innkeeper Multi-Tenant: ACTIVE</Tag>
                  </div>
                </div>
              </div>
              <div className="did-banner-actions">
                <Button onClick={loadData} icon={<ReloadOutlined />}>
                  Refresh Telemetry
                </Button>
              </div>
            </div>

            {/* Tenant Reservations Section */}
            <div className="content-card animate-in-d2">
              <div className="issuance-subtab-toolbar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h2 className="issuance-subtab-title">Tenant Onboarding Reservations ({pendingReservations.length} Pending)</h2>
                  <p className="issuance-subtab-desc">
                    Review and grant ledger endorsement credentials to incoming organizations.
                  </p>
                </div>
                <Tag color={pendingReservations.length > 0 ? "gold" : "green"}>
                  {pendingReservations.length > 0 ? "Action Required" : "All Clear"}
                </Tag>
              </div>
              <Table
                dataSource={reservations}
                columns={reservationColumns}
                rowKey="reservation_id"
                loading={loading}
                pagination={{ pageSize: 5 }}
                className="issuance-table"
                scroll={{ x: 850 }}
              />
            </div>

            {/* Active Tenants Section */}
            <div className="content-card animate-in-d2">
              <div className="issuance-subtab-toolbar">
                <h2 className="issuance-subtab-title">Active Multi-Tenant Organizations</h2>
                <p className="issuance-subtab-desc">
                  Configured tenants with dedicated wallet enclaves, endorser access, and API keys.
                </p>
              </div>
              <Table
                dataSource={tenants}
                columns={tenantColumns}
                rowKey="tenant_id"
                loading={loading}
                pagination={false}
                className="issuance-table"
                scroll={{ x: 800 }}
              />
            </div>

            {/* Ledger & Plugins Telemetry Section */}
            <div className="content-card animate-in-d3">
              <div className="issuance-subtab-toolbar">
                <h2 className="issuance-subtab-title">Configured Ledgers & ACA-Py Core Plugins</h2>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <Card title="Ledger Endorser Configurations" size="small" style={{ borderRadius: 8 }}>
                  <Table
                    dataSource={serverConfig?.config?.["ledger.ledger_config_list"] || []}
                    columns={[
                      { title: "Ledger ID", dataIndex: "id", key: "id", render: (t) => <span className="mono-badge">{t}</span> },
                      { title: "Endorser Alias", dataIndex: "endorser_alias", key: "endorser_alias", render: (a) => <strong>{a}</strong> },
                      { title: "Endorser DID", dataIndex: "endorser_did", key: "endorser_did", render: (d) => <span className="mono-subtext">{d}</span> },
                    ]}
                    rowKey="id"
                    pagination={false}
                    size="small"
                    scroll={{ x: 450 }}
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
                    />
                  }
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 200, overflow: "auto" }}>
                    {filteredPlugins.map((plug, idx) => (
                      <div key={idx} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                        <ApiOutlined style={{ color: "#2563EB" }} />
                        <span className="mono-subtext">{plug}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          </>
        )}

        {/* ========================================================= */}
        {/* 5. AUDIT TAB: Immutable System Event Trail Logs           */}
        {/* ========================================================= */}
        {activeTab === "audit" && (
          <div className="content-card animate-in">
            <div className="issuance-subtab-toolbar" style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <div>
                <h2 className="issuance-subtab-title">System Audit Trail & Immutable Event Records</h2>
                <p className="issuance-subtab-desc">
                  Tamper-resistant cryptographic audit logs tracking all administrative, ledger, and tenant events.
                </p>
              </div>
              <Input
                prefix={<SearchOutlined style={{ color: "var(--text-muted)" }} />}
                placeholder="Search audit trail..."
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                style={{ width: 240 }}
              />
            </div>
            <Table
              dataSource={filteredAuditLogs}
              columns={auditColumns}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
              className="issuance-table"
              scroll={{ x: 850 }}
            />
          </div>
        )}

        {/* ========================================================= */}
        {/* MODALS                                                    */}
        {/* ========================================================= */}

        {/* Configure Tenant Modal */}
        <Modal
          title={
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <SettingOutlined style={{ color: "#8B5CF6" }} />
              <span>Configure Tenant Permissions: {selectedTenantForConfig?.tenant_name}</span>
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
              label="Enable Issuer Capability"
              valuePropName="checked"
              extra="Permits this tenant to register schemas and publish credential definitions to the ledger."
            >
              <Switch checkedChildren="Yes" unCheckedChildren="No" />
            </Form.Item>

            <Form.Item
              name="enable_ledger_switch"
              label="Allow Ledger Switching"
              valuePropName="checked"
              extra="Permits switching between multiple endorser ledgers (BCOVRIN, Indicio, IDunion)."
            >
              <Switch checkedChildren="Yes" unCheckedChildren="No" />
            </Form.Item>

            <div style={{ padding: 12, background: "rgba(0,0,0,0.02)", borderRadius: 8, marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                <div><strong>Tenant ID:</strong> <code>{selectedTenantForConfig?.tenant_id}</code></div>
                <div><strong>Wallet ID:</strong> <code>{selectedTenantForConfig?.wallet_id}</code></div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <Button onClick={() => setIsTenantModalOpen(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit" style={{ background: "#8B5CF6", borderColor: "#8B5CF6" }}>
                Save Configurations
              </Button>
            </div>
          </Form>
        </Modal>

        {/* User Details Modal */}
        <Modal
          title={
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <UsergroupAddOutlined style={{ color: "#8B5CF6" }} />
              <span>User Identity & Role Details</span>
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
            <Descriptions bordered column={1} size="small" style={{ borderRadius: 8 }}>
              <Descriptions.Item label="User ID">
                <span className="mono-badge">{selectedUserForView.id}</span>
              </Descriptions.Item>
              <Descriptions.Item label="Username / Email">
                <strong>{selectedUserForView.username}</strong>
              </Descriptions.Item>
              <Descriptions.Item label="Contact Name">
                {selectedUserForView.contact_name || "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="Organization">
                {selectedUserForView.organization || "Independent Entity"}
              </Descriptions.Item>
              <Descriptions.Item label="System Role">
                <Tag color="purple">{(selectedUserForView.role || "holder").toUpperCase()}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Account Status">
                <Tag color={selectedUserForView.status === "active" ? "success" : "warning"}>
                  {(selectedUserForView.status || "active").toUpperCase()}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Provisioned At">
                {new Date(selectedUserForView.createdAt).toLocaleString()}
              </Descriptions.Item>
            </Descriptions>
          )}
        </Modal>

        {/* Register User Modal */}
        <Modal
          title="Provision New Identity Account"
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
              <Input placeholder="e.g. University Authority" />
            </Form.Item>
            <Form.Item name="role" label="System Role" rules={[{ required: true }]}>
              <Select
                options={[
                  { value: "issuer", label: "Issuer (Credential Authority)" },
                  { value: "holder", label: "Holder (Wallet Owner)" },
                  { value: "verifier", label: "Verifier (Proof Validator)" },
                  { value: "admin", label: "Admin (Platform Operator)" },
                ]}
              />
            </Form.Item>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 24 }}>
              <Button onClick={() => setIsUserModalOpen(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit" style={{ background: "#8B5CF6", borderColor: "#8B5CF6" }}>
                Provision Identity
              </Button>
            </div>
          </Form>
        </Modal>

        {/* Audit Log Details Modal */}
        <Modal
          title={
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <AuditOutlined style={{ color: "#8B5CF6" }} />
              <span>Immutable Audit Event Record</span>
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
            <Descriptions bordered column={1} size="small" style={{ borderRadius: 8 }}>
              <Descriptions.Item label="Log Record ID">
                <span className="mono-badge">{selectedAuditLog.id}</span>
              </Descriptions.Item>
              <Descriptions.Item label="Event Action">
                <strong>{selectedAuditLog.event}</strong>
              </Descriptions.Item>
              <Descriptions.Item label="Initiating Actor">
                <span className="mono-subtext">{selectedAuditLog.user}</span>
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

        {/* Node Health Modal */}
        <Modal
          title={
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <DesktopOutlined style={{ color: "#8B5CF6" }} />
              <span>ACA-Py Node & Enclave Health Diagnostic</span>
            </div>
          }
          open={isHealthModalOpen}
          onCancel={() => setIsHealthModalOpen(false)}
          footer={[
            <Button key="refresh" icon={<ReloadOutlined />} onClick={loadData}>
              Refresh
            </Button>,
            <Button key="close" type="primary" onClick={() => setIsHealthModalOpen(false)}>
              Dismiss
            </Button>,
          ]}
          destroyOnClose
        >
          <Descriptions bordered column={1} size="small" style={{ borderRadius: 8, marginTop: 12 }}>
            <Descriptions.Item label="Backend Status">
              <Tag color="success">{(health?.backendHealth || "healthy").toUpperCase()}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Ledger Connectivity">
              <Tag color="success">{(health?.ledgerConnectivity || "connected").toUpperCase()}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Issuer Agent Status">
              <Tag color="cyan">ONLINE (Active)</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Holder Enclave">
              <Tag color="cyan">ONLINE (Ready)</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Verifier Gateway">
              <Tag color="cyan">ONLINE (Ready)</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Innkeeper Governance">
              <Tag color="purple">ONLINE (Multi-Tenant Active)</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Last Ledger Sync">
              {health?.lastSync ? new Date(health.lastSync).toLocaleString() : "Real-time Synchronized"}
            </Descriptions.Item>
          </Descriptions>
        </Modal>
      </div>
    </DashboardLayout>
  );
};

// Fallback icon for Innkeeper Crown
const CrownOutlinedFallback = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" />
  </svg>
);

export default AdminDashboard;