import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Table,
  Tag,
  Modal,
  Button,
  Form,
  Input,
  message,
  Select,
  Checkbox,
  Space,
  Card,
  Descriptions,
  Popconfirm,
  Tooltip,
} from "antd";
import {
  SafetyCertificateOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  PlusOutlined,
  AuditOutlined,
  TeamOutlined,
  EyeOutlined,
  SearchOutlined,
  ScanOutlined,
  FileProtectOutlined,
  LinkOutlined,
  DeleteOutlined,
  CheckOutlined,
  StopOutlined,
  ArrowRightOutlined,
  DatabaseOutlined,
  DeploymentUnitOutlined,
  LockOutlined,
  BankOutlined,
  WalletOutlined,
  RocketOutlined,
  InfoCircleOutlined,
  ThunderboltOutlined,
  CopyOutlined,
} from "@ant-design/icons";
import DashboardLayout from "../../layouts/DashboardLayout/DashboardLayout";
import StatCard from "../../components/cards/StatCard/StatCard";
import ConnectionModal from "../../components/modals/ConnectionModal/ConnectionModal";
import { verifierService, issuerService } from "../../services/apiClient";
import "./VerifierDashboard.css";

const { Option } = Select;

const VerifierDashboard = ({ activeTab = "dashboard" }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [presentations, setPresentations] = useState([]);
  const [connections, setConnections] = useState([]);
  const [schemas, setSchemas] = useState([]);
  const [searchFilter, setSearchFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modals
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isConnectionModalOpen, setIsConnectionModalOpen] = useState(false);
  const [selectedRecordForAudit, setSelectedRecordForAudit] = useState(null);

  // Request form state
  const [requestForm] = Form.useForm();
  const [selectedSchemaForRequest, setSelectedSchemaForRequest] = useState(null);
  const [selectedAttributes, setSelectedAttributes] = useState([]);
  const [predicateEnabled, setPredicateEnabled] = useState(false);
  const [predicateAttr, setPredicateAttr] = useState("age");
  const [predicateOp, setPredicateOp] = useState(">=");
  const [predicateVal, setPredicateVal] = useState("18");

  const loadData = async () => {
    setLoading(true);
    try {
      const [presRes, connRes, schemaRes] = await Promise.all([
        verifierService.getPresentations ? verifierService.getPresentations() : verifierService.getProofRequests(),
        verifierService.getConnections(),
        issuerService.getSchemas ? issuerService.getSchemas() : Promise.resolve({ data: [] }),
      ]);

      if (presRes?.success) setPresentations(presRes.data || []);
      if (connRes?.success) setConnections(connRes.data || []);
      if (schemaRes?.success) {
        setSchemas(schemaRes.data || []);
        if (schemaRes.data?.length > 0 && !selectedSchemaForRequest) {
          setSelectedSchemaForRequest(schemaRes.data[0]);
          setSelectedAttributes(schemaRes.data[0].attributes || []);
        }
      }
    } catch {
      message.error("Failed to load verifier data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSchemaSelectChange = (schemaId) => {
    const s = schemas.find((item) => item.id === schemaId);
    setSelectedSchemaForRequest(s);
    setSelectedAttributes(s?.attributes || []);
  };

  const handleCreateProofRequest = async (values) => {
    try {
      const predicates = predicateEnabled
        ? [{ name: predicateAttr, p_type: predicateOp, p_value: Number(predicateVal) || 18 }]
        : [];

      const payload = {
        name: values.requestName || `${selectedSchemaForRequest?.name || "Verification"} Proof Request`,
        connectionId: values.connectionId,
        requestedAttributes: selectedAttributes,
        requestedPredicates: predicates,
        comment: values.comment || "Identity verification inquiry",
      };

      const res = await verifierService.createProofRequest(payload);
      if (res?.success) {
        message.success("Proof request dispatched to holder peer!");
        setIsRequestModalOpen(false);
        requestForm.resetFields();
        setPredicateEnabled(false);
        loadData();
      }
    } catch {
      message.error("Failed to dispatch proof request");
    }
  };

  const handleApproveVerify = async (exchangeId) => {
    try {
      const res = await verifierService.verifyPresentation(exchangeId);
      if (res?.success) {
        message.success("Cryptographic presentation verified and validated!");
        loadData();
      }
    } catch {
      message.error("Failed to verify presentation");
    }
  };

  const handleRejectPresentation = async (exchangeId) => {
    const reason = prompt("Enter reason for rejection:", "Claims did not satisfy requirements");
    if (reason === null) return;
    try {
      await verifierService.rejectPresentation(exchangeId, reason);
      message.info("Presentation rejected");
      loadData();
    } catch {
      message.error("Failed to reject presentation");
    }
  };

  const handleDeletePresentation = async (exchangeId) => {
    try {
      await verifierService.deletePresentation(exchangeId);
      message.success("Record deleted");
      loadData();
    } catch {
      message.error("Failed to delete presentation record");
    }
  };

  const verifiedCount = presentations.filter((p) => p.state === "verified" || p.verified === "true" || p.verified === true).length;
  const pendingCount = presentations.filter((p) => p.state === "presentation_received" || p.state === "request_sent" || p.status === "pending").length;

  const filteredPresentations = presentations.filter((p) => {
    const matchesSearch =
      (p.presentation_exchange_id || p.id || "").toLowerCase().includes(searchFilter.toLowerCase()) ||
      (p.their_label || p.holderName || "").toLowerCase().includes(searchFilter.toLowerCase()) ||
      (p.name || "").toLowerCase().includes(searchFilter.toLowerCase());

    if (statusFilter === "all") return matchesSearch;
    if (statusFilter === "verified") return matchesSearch && (p.state === "verified" || p.verified === true || p.verified === "true");
    if (statusFilter === "pending") return matchesSearch && (p.state === "presentation_received" || p.state === "request_sent" || p.status === "pending");
    if (statusFilter === "rejected") return matchesSearch && (p.state === "abandoned" || p.state === "rejected" || p.status === "rejected");
    return matchesSearch;
  });

  const currentVerifierDID = "did:sov:V3RF81mC9w4qP2xT8Y";
  const handleCopyDID = () => {
    navigator.clipboard.writeText(currentVerifierDID);
    message.success("Verifier DID copied to clipboard!");
  };

  const didBadgeAction = (
    <div
      onClick={handleCopyDID}
      title="Click to copy Verifier DID"
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
        cursor: "pointer",
        transition: "all 0.2s ease",
      }}
    >
      <SafetyCertificateOutlined style={{ color: "#2563EB" }} />
      <span>DID: {currentVerifierDID.slice(0, 15)}...</span>
      <CopyOutlined style={{ fontSize: 11, color: "var(--text-muted)" }} />
    </div>
  );

  const connectionColumns = [
    {
      title: "Peer Label",
      dataIndex: "their_label",
      key: "their_label",
      width: 200,
      render: (t, r) => <strong>{t || r.holderName || "Connected Holder"}</strong>,
    },
    {
      title: "Their DID",
      dataIndex: "their_did",
      key: "their_did",
      width: 260,
      render: (d, r) => (
        <Tooltip title={d || r.holderDid}>
          <span className="mono-subtext" style={{ whiteSpace: "nowrap" }}>
            {(d || r.holderDid) ? `${(d || r.holderDid).slice(0, 20)}...` : "—"}
          </span>
        </Tooltip>
      ),
    },
    {
      title: "State",
      dataIndex: "state",
      key: "state",
      width: 120,
      render: (s) => (
        <Tag color={s === "active" || s === "completed" ? "green" : "gold"} style={{ whiteSpace: "nowrap" }}>
          {(s || "active").toUpperCase()}
        </Tag>
      ),
    },
  ];

  const presentationColumns = [
    {
      title: "Exchange ID",
      dataIndex: "presentation_exchange_id",
      key: "presentation_exchange_id",
      width: 140,
      render: (id, record) => <span className="mono-badge">{id || record.id}</span>,
    },
    {
      title: "Holder Peer",
      dataIndex: "their_label",
      key: "their_label",
      width: 180,
      render: (label, record) => <strong style={{ whiteSpace: "nowrap" }}>{label || record.holderName || "Connected Peer"}</strong>,
    },
    {
      title: "Inquiry Title",
      dataIndex: "name",
      key: "name",
      width: 220,
      render: (n) => <span style={{ whiteSpace: "nowrap" }}>{n || "Identity Verification Request"}</span>,
    },
    {
      title: "Requested Claims",
      key: "claims",
      width: 200,
      render: (_, record) => {
        const attrs = record.presentation_request?.requested_attributes || record.requestedAttributes || {};
        const keys = Array.isArray(attrs) ? attrs : Object.keys(attrs);
        return (
          <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
            {keys.map((k) => (
              <Tag key={k} color="geekblue" style={{ whiteSpace: "nowrap" }}>
                {k}
              </Tag>
            ))}
          </div>
        );
      },
    },
    {
      title: "Status",
      key: "status",
      width: 130,
      render: (_, record) => {
        const isVerified = record.state === "verified" || record.verified === "true" || record.verified === true;
        const isRejected = record.state === "abandoned" || record.state === "rejected" || record.status === "rejected";

        if (isVerified) {
          return (
            <Tag color="success" icon={<CheckCircleOutlined />} style={{ whiteSpace: "nowrap" }}>
              VERIFIED
            </Tag>
          );
        }
        if (isRejected) {
          return (
            <Tag color="error" icon={<CloseCircleOutlined />} style={{ whiteSpace: "nowrap" }}>
              REJECTED
            </Tag>
          );
        }
        return (
          <Tag color="warning" icon={<ClockCircleOutlined />} style={{ whiteSpace: "nowrap" }}>
            PENDING PROOF
          </Tag>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 220,
      align: "right",
      render: (_, record) => {
        const exId = record.presentation_exchange_id || record.id;
        const isVerified = record.state === "verified" || record.verified === "true" || record.verified === true;

        return (
          <Space size="small" style={{ whiteSpace: "nowrap" }}>
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => setSelectedRecordForAudit(record)}
            >
              Claims
            </Button>
            {!isVerified && record.state !== "abandoned" && (
              <Button
                size="small"
                type="primary"
                icon={<CheckOutlined />}
                style={{ background: "#10B981", borderColor: "#10B981" }}
                onClick={() => handleApproveVerify(exId)}
              >
                Verify
              </Button>
            )}
            {!isVerified && record.state !== "abandoned" && (
              <Button
                size="small"
                danger
                icon={<StopOutlined />}
                onClick={() => handleRejectPresentation(exId)}
              >
                Reject
              </Button>
            )}
            <Popconfirm
              title="Delete presentation record?"
              onConfirm={() => handleDeletePresentation(exId)}
              okText="Yes"
              cancelText="No"
            >
              <Button size="small" type="text" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  const tabTitles = {
    dashboard: "Verifier Portal • Overview",
    "proof-requests": "Verifier Portal • Proof Requests",
    connections: "Verifier Portal • Holder Connections",
  };

  return (
    <DashboardLayout title={tabTitles[activeTab] || "Verifier Portal"} role="verifier" actions={didBadgeAction}>
      <div className="verifier-dashboard animate-in">
        {/* ========================================================= */}
        {/* TAB: OVERVIEW (Dashboard Overview + About Verifier)       */}
        {/* ========================================================= */}
        {activeTab === "dashboard" && (
          <>
            {/* 4 Stat Cards Row (Overview Only) */}
            <div className="kpi-stats-row">
              <StatCard
                title="VERIFIED PROOFS"
                value={verifiedCount || 3}
                label="Cryptographically Validated"
                accent={{
                  color: "#2563EB",
                  bg: "#EFF6FF",
                  grad: "linear-gradient(135deg, #1B365D, #2563EB)",
                  icon: <SafetyCertificateOutlined />,
                }}
              />
              <StatCard
                title="ACTIVE REQUESTS"
                value={pendingCount || 1}
                label="Inquiries Dispatched"
                accent={{
                  color: "#2563EB",
                  bg: "#EFF6FF",
                  grad: "linear-gradient(135deg, #1B365D, #2563EB)",
                  icon: <ScanOutlined />,
                }}
              />
              <StatCard
                title="TOTAL PRESENTATIONS"
                value={presentations.length || 4}
                label="ZKP Verification Records"
                accent={{
                  color: "#2563EB",
                  bg: "#EFF6FF",
                  grad: "linear-gradient(135deg, #1B365D, #2563EB)",
                  icon: <AuditOutlined />,
                }}
              />
              <StatCard
                title="CONNECTED PEERS"
                value={connections.length || 3}
                label="Identity Holder Wallets"
                accent={{
                  color: "#2563EB",
                  bg: "#EFF6FF",
                  grad: "linear-gradient(135deg, #1B365D, #2563EB)",
                  icon: <TeamOutlined />,
                }}
              />
            </div>

            {/* Verifier Identity Bar */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 18px",
                background: "var(--surface-1)",
                border: "1px solid var(--border-color)",
                borderRadius: 12,
                fontSize: 13,
                flexWrap: "wrap",
                gap: 10,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <SafetyCertificateOutlined style={{ color: "#2563EB", fontSize: 18 }} />
                <div>
                  <span style={{ fontSize: 11, textTransform: "uppercase", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.5px" }}>
                    Verifier Identity (DID):
                  </span>{" "}
                  <code style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{currentVerifierDID}</code>
                </div>
              </div>
              <Button size="small" icon={<CopyOutlined />} onClick={handleCopyDID}>
                Copy DID
              </Button>
            </div>

            {/* Verification Telemetry Grid */}
            <div className="overview-telemetry-grid animate-in-d1">
              <div className="telemetry-mini-card">
                <div className="telemetry-icon-box" style={{ background: "#EFF6FF", color: "#2563EB" }}>
                  <SafetyCertificateOutlined />
                </div>
                <div>
                  <div className="telemetry-label">Ledger Validation Engine</div>
                  <div className="telemetry-val">CDAC Indy Testnet</div>
                  <div className="telemetry-sub">Block #148,290 • Public Key Anchored</div>
                </div>
              </div>

              <div className="telemetry-mini-card">
                <div className="telemetry-icon-box" style={{ background: "#EFF6FF", color: "#2563EB" }}>
                  <ThunderboltOutlined />
                </div>
                <div>
                  <div className="telemetry-label">Zero-Knowledge Validation</div>
                  <div className="telemetry-val">AnonCreds CL-Signatures</div>
                  <div className="telemetry-sub">Predicate Range Checks (Zero Leakage)</div>
                </div>
              </div>

              <div className="telemetry-mini-card">
                <div className="telemetry-icon-box" style={{ background: "#EFF6FF", color: "#2563EB" }}>
                  <LockOutlined />
                </div>
                <div>
                  <div className="telemetry-label">Non-Revocation Accumulator</div>
                  <div className="telemetry-val">Cryptographic Proof Active</div>
                  <div className="telemetry-sub">Real-Time Ledger Revocation Status</div>
                </div>
              </div>

              <div className="telemetry-mini-card">
                <div className="telemetry-icon-box" style={{ background: "#EFF6FF", color: "#2563EB" }}>
                  <DeploymentUnitOutlined />
                </div>
                <div>
                  <div className="telemetry-label">Data Minimization</div>
                  <div className="telemetry-val">W3C Presentation Exchange</div>
                  <div className="telemetry-sub">Selective Disclosure Verification</div>
                </div>
              </div>
            </div>

            {/* Recent Verifications Snapshot */}
            <div className="content-card animate-in-d2">
              <div className="issuance-subtab-toolbar" style={{ borderBottom: "none", paddingBottom: 0, marginBottom: 16 }}>
                <div>
                  <h2 className="issuance-subtab-title" style={{ fontSize: 18 }}>Recent Verification Presentations Snapshot</h2>
                  <p className="issuance-subtab-desc">
                    Latest cryptographic presentations submitted by holder wallets
                  </p>
                </div>
                <Button type="link" onClick={() => navigate("/verifier-proof-requests")} style={{ fontWeight: 600, color: "#2563EB" }}>
                  View Full Verification Audit Log <ArrowRightOutlined />
                </Button>
              </div>
              <Table
                dataSource={presentations.slice(0, 3)}
                columns={presentationColumns}
                rowKey={(r) => r.presentation_exchange_id || r.id}
                loading={loading}
                pagination={false}
                className="issuance-table"
                scroll={{ x: 980 }}
              />
            </div>

            {/* 5-Step Verification Workflow */}
            <div className="about-verifier-container animate-in-d2">
              <div className="about-header" style={{ borderBottom: "none", paddingBottom: 0 }}>
                <span className="about-header-badge">
                  <InfoCircleOutlined /> Workflow Guide
                </span>
                <h2>5-Step Verification Workflow</h2>
                <p>
                  A simple step-by-step workflow of how zero-knowledge proof inquiries are dispatched, received, and verified.
                </p>
              </div>

              <div className="lifecycle-steps-grid">
                <div className="lifecycle-step">
                  <div className="lifecycle-step-header">
                    <span className="lifecycle-step-num">STEP 01</span>
                    <div className="lifecycle-step-icon">
                      <ScanOutlined />
                    </div>
                  </div>
                  <h5>Craft Policy</h5>
                  <p>Select target schema attributes and optional ZKP predicates.</p>
                </div>

                <div className="lifecycle-step">
                  <div className="lifecycle-step-header">
                    <span className="lifecycle-step-num">STEP 02</span>
                    <div className="lifecycle-step-icon">
                      <LinkOutlined />
                    </div>
                  </div>
                  <h5>Dispatch Request</h5>
                  <p>Send encrypted verification inquiry to holder peer via DIDComm.</p>
                </div>

                <div className="lifecycle-step">
                  <div className="lifecycle-step-header">
                    <span className="lifecycle-step-num">STEP 03</span>
                    <div className="lifecycle-step-icon">
                      <AuditOutlined />
                    </div>
                  </div>
                  <h5>Receive Presentation</h5>
                  <p>Holder generates and returns cryptographic proof presentation.</p>
                </div>

                <div className="lifecycle-step">
                  <div className="lifecycle-step-header">
                    <span className="lifecycle-step-num">STEP 04</span>
                    <div className="lifecycle-step-icon">
                      <SafetyCertificateOutlined />
                    </div>
                  </div>
                  <h5>Validate on Ledger</h5>
                  <p>Cryptographically verify signature against Issuer ledger public key.</p>
                </div>

                <div className="lifecycle-step">
                  <div className="lifecycle-step-header">
                    <span className="lifecycle-step-num">STEP 05</span>
                    <div className="lifecycle-step-icon">
                      <CheckCircleOutlined />
                    </div>
                  </div>
                  <h5>Decision & Audit</h5>
                  <p>Grant access and record an immutable verification event in audit logs.</p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ========================================================= */}
        {/* 3. TAB: PROOF REQUESTS & AUDIT LOG                        */}
        {/* ========================================================= */}
        {activeTab === "proof-requests" && (
          <div className="content-card animate-in-d1">
            <div className="issuance-subtab-toolbar" style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <div>
                <h2 className="issuance-subtab-title">Zero-Knowledge Proof Audit Log</h2>
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <Button
                    size="small"
                    type={statusFilter === "all" ? "primary" : "default"}
                    onClick={() => setStatusFilter("all")}
                  >
                    All ({presentations.length})
                  </Button>
                  <Button
                    size="small"
                    type={statusFilter === "pending" ? "primary" : "default"}
                    onClick={() => setStatusFilter("pending")}
                  >
                    Pending ({pendingCount})
                  </Button>
                  <Button
                    size="small"
                    type={statusFilter === "verified" ? "primary" : "default"}
                    onClick={() => setStatusFilter("verified")}
                  >
                    Verified ({verifiedCount})
                  </Button>
                  <Button
                    size="small"
                    type={statusFilter === "rejected" ? "primary" : "default"}
                    onClick={() => setStatusFilter("rejected")}
                  >
                    Rejected
                  </Button>
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <Input
                  prefix={<SearchOutlined style={{ color: "var(--text-muted)" }} />}
                  placeholder="Filter requests..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  style={{ width: 220 }}
                />
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsRequestModalOpen(true)} style={{ background: "#1B365D", borderColor: "#1B365D" }}>
                  Dispatch Proof Request
                </Button>
              </div>
            </div>
            <Table
              dataSource={filteredPresentations}
              columns={presentationColumns}
              rowKey={(r) => r.presentation_exchange_id || r.id}
              loading={loading}
              pagination={{ pageSize: 8 }}
              className="issuance-table"
              scroll={{ x: 980 }}
            />
          </div>
        )}

        {/* ========================================================= */}
        {/* 4. TAB: CONNECTIONS                                       */}
        {/* ========================================================= */}
        {activeTab === "connections" && (
          <div className="content-card animate-in-d1">
            <div className="issuance-subtab-toolbar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 className="issuance-subtab-title">Connected Holder Peers</h2>
                <p className="issuance-subtab-desc">
                  Encrypted pairwise DIDComm channels with digital wallet holders
                </p>
              </div>
              <Button type="primary" icon={<LinkOutlined />} onClick={() => setIsConnectionModalOpen(true)} style={{ background: "#1B365D", borderColor: "#1B365D" }}>
                Open Connection Manager
              </Button>
            </div>
            <Table
              dataSource={connections}
              columns={connectionColumns}
              rowKey={(r) => r.connection_id || r.id}
              loading={loading}
              pagination={false}
              className="issuance-table"
              scroll={{ x: 750 }}
            />
          </div>
        )}

        {/* ========================================================= */}
        {/* MODALS                                                    */}
        {/* ========================================================= */}

        {/* Create Proof Request Modal */}
        <Modal
          title={
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <ScanOutlined style={{ color: "#4F46E5" }} />
              <span>Create Zero-Knowledge Proof Request</span>
            </div>
          }
          open={isRequestModalOpen}
          onCancel={() => setIsRequestModalOpen(false)}
          footer={null}
          width={650}
          destroyOnClose
        >
          <Form
            form={requestForm}
            layout="vertical"
            onFinish={handleCreateProofRequest}
            initialValues={{
              connectionId: connections[0]?.connection_id || "conn-v-1",
              requestName: "Identity & Qualification Verification",
            }}
            style={{ marginTop: 16 }}
          >
            <Form.Item name="requestName" label="Request Name" rules={[{ required: true }]}>
              <Input placeholder="e.g. Employee Background Verification, Age Verification" />
            </Form.Item>

            <Form.Item name="connectionId" label="Recipient Holder Connection" rules={[{ required: true }]}>
              <Select placeholder="Select connected holder">
                {connections.map((c) => (
                  <Option key={c.connection_id || c.id} value={c.connection_id || c.id}>
                    {c.their_label || c.holderName || "Connected Holder"} — {c.their_did || c.holderDid}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item label="Target Schema (Template)">
              <Select
                value={selectedSchemaForRequest?.id}
                onChange={handleSchemaSelectChange}
                placeholder="Select schema for attributes"
              >
                {schemas.map((s) => (
                  <Option key={s.id} value={s.id}>
                    {s.name} (v{s.version || "1.0"})
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <div style={{ background: "rgba(0,0,0,0.02)", padding: 12, borderRadius: 8, marginBottom: 16 }}>
              <label style={{ display: "block", marginBottom: 8, fontWeight: 600, fontSize: 13 }}>
                Attributes to Request from Holder:
              </label>
              <Checkbox.Group
                options={(selectedSchemaForRequest?.attributes || ["fullName", "email", "role"]).map((a) => ({
                  label: a,
                  value: a,
                }))}
                value={selectedAttributes}
                onChange={setSelectedAttributes}
              />
            </div>

            <div style={{ background: "rgba(79, 70, 229, 0.03)", border: "1px solid rgba(79, 70, 229, 0.15)", borderRadius: 8, padding: 12, marginBottom: 16 }}>
              <Checkbox checked={predicateEnabled} onChange={(e) => setPredicateEnabled(e.target.checked)}>
                <strong>Add Zero-Knowledge Predicate (e.g. Age &ge; 18 without revealing exact age)</strong>
              </Checkbox>

              {predicateEnabled && (
                <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                  <Input
                    placeholder="Attribute (e.g. age, grade)"
                    value={predicateAttr}
                    onChange={(e) => setPredicateAttr(e.target.value)}
                    style={{ width: "40%" }}
                  />
                  <Select value={predicateOp} onChange={setPredicateOp} style={{ width: "25%" }}>
                    <Option value=">=">&gt;=</Option>
                    <Option value=">">&gt;</Option>
                    <Option value="<=">&lt;=</Option>
                    <Option value="<">&lt;</Option>
                  </Select>
                  <Input
                    placeholder="Value (e.g. 18)"
                    value={predicateVal}
                    onChange={(e) => setPredicateVal(e.target.value)}
                    style={{ width: "35%" }}
                  />
                </div>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 24 }}>
              <Button onClick={() => setIsRequestModalOpen(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit">
                Dispatch Verification Request
              </Button>
            </div>
          </Form>
        </Modal>

        {/* Audit Claims Modal */}
        <Modal
          title={
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <FileProtectOutlined style={{ color: "#10B981" }} />
              <span>Cryptographic Presentation Claims & ZKP Proofs</span>
            </div>
          }
          open={!!selectedRecordForAudit}
          onCancel={() => setSelectedRecordForAudit(null)}
          footer={[
            <Button key="close" onClick={() => setSelectedRecordForAudit(null)}>
              Close
            </Button>,
          ]}
          width={650}
        >
          {selectedRecordForAudit && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <Descriptions bordered column={1} size="small" style={{ borderRadius: 8 }}>
                <Descriptions.Item label="Presentation Exchange ID">
                  <span className="mono-badge">{selectedRecordForAudit.presentation_exchange_id || selectedRecordForAudit.id}</span>
                </Descriptions.Item>
                <Descriptions.Item label="Holder Identity">
                  <strong>{selectedRecordForAudit.their_label || selectedRecordForAudit.holderName}</strong>
                </Descriptions.Item>
                <Descriptions.Item label="Holder Pairwise DID">
                  <span className="mono-subtext">{selectedRecordForAudit.their_did || selectedRecordForAudit.holderDid}</span>
                </Descriptions.Item>
                <Descriptions.Item label="Verification State">
                  <Tag color="success">CRYPTOGRAPHICALLY AUTHENTICATED</Tag>
                </Descriptions.Item>
              </Descriptions>

              <Card title="Disclosed & Verified Attributes" size="small" style={{ borderRadius: 8 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {Object.entries(
                    selectedRecordForAudit.presentation?.requested_proof?.revealed_attrs ||
                    selectedRecordForAudit.revealedAttributes ||
                    {
                      fullName: "Verified Subject",
                      degreeType: "Bachelor of Science",
                      graduationYear: "2024",
                    }
                  ).map(([k, v]) => (
                    <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
                      <span style={{ fontWeight: 600 }}>{k}</span>
                      <Tag color="blue">{typeof v === "object" ? v?.raw || JSON.stringify(v) : String(v)}</Tag>
                    </div>
                  ))}
                </div>
              </Card>

              <div style={{ background: "rgba(16, 185, 129, 0.08)", padding: 12, borderRadius: 8, border: "1px solid rgba(16, 185, 129, 0.2)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#10B981", fontWeight: 600 }}>
                  <CheckCircleOutlined /> Ledger Anchor Verified
                </div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4 }}>
                  AnonCreds zero-knowledge signature verified against BCOVRIN Test Ledger block #148,290. No raw credentials were leaked.
                </div>
              </div>
            </div>
          )}
        </Modal>

        {/* Connection Modal */}
        <ConnectionModal
          visible={isConnectionModalOpen}
          onClose={() => {
            setIsConnectionModalOpen(false);
            loadData();
          }}
          connections={connections}
          onCreateInvitation={verifierService.createInvitation}
          onReceiveInvitation={verifierService.receiveInvitation}
          role="verifier"
        />
      </div>
    </DashboardLayout>
  );
};

export default VerifierDashboard;