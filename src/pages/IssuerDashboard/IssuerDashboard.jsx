import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Table,
  Modal,
  Button,
  Input,
  Form,
  Tag,
  message,
  Select,
  Switch,
  InputNumber,
  Space,
  Card,
  Popconfirm,
  Tooltip,
  Tabs,
  Badge,
  Popover,
  Avatar,
} from "antd";
import {
  AuditOutlined,
  FileTextOutlined,
  KeyOutlined,
  PlusOutlined,
  CopyOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  CheckCircleFilled,
  ClockCircleOutlined,
  SafetyCertificateOutlined,
  QrcodeOutlined,
  SearchOutlined,
  DeleteOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  LinkOutlined,
  InboxOutlined,
  SendOutlined,
  ArrowRightOutlined,
  DatabaseOutlined,
  DeploymentUnitOutlined,
  InfoCircleOutlined,
  CommentOutlined,
  UserOutlined,
} from "@ant-design/icons";
import DashboardLayout from "../../layouts/DashboardLayout/DashboardLayout";
import StatCard from "../../components/cards/StatCard/StatCard";
import ConnectionModal from "../../components/modals/ConnectionModal/ConnectionModal";
import ViewTemplateModal from "../../components/modals/ViewTemplateModal/ViewTemplateModal";
import CredentialDetailsModal from "../../components/modals/CredentialDetailsModal/CredentialDetailsModal";
import { issuerService } from "../../services/apiClient";
import "./IssuerDashboard.css";

const { Option } = Select;

const IssuerDashboard = ({ activeTab = "dashboard" }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [didInfo, setDidInfo] = useState(null);
  const [schemas, setSchemas] = useState([]);
  const [credDefs, setCredDefs] = useState([]);
  const [connections, setConnections] = useState([]);
  const [activities, setActivities] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [searchFilter, setSearchFilter] = useState("");
  const [issuanceSubTab, setIssuanceSubTab] = useState("history");

  // Modals
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [isSchemaModalOpen, setIsSchemaModalOpen] = useState(false);
  const [isCredDefModalOpen, setIsCredDefModalOpen] = useState(false);
  const [isConnectionModalOpen, setIsConnectionModalOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isRevokeModalOpen, setIsRevokeModalOpen] = useState(false);
  const [selectedRecordToRevoke, setSelectedRecordToRevoke] = useState(null);
  const [revokeReason, setRevokeReason] = useState("");

  // Inspection modals
  const [selectedSchemaForView, setSelectedSchemaForView] = useState(null);
  const [selectedCredentialForView, setSelectedCredentialForView] = useState(null);

  // Schema form state
  const [schemaAttributes, setSchemaAttributes] = useState(["fullName", "email", "role"]);
  const [newAttributeInput, setNewAttributeInput] = useState("");

  // Issue dynamic form
  const [selectedCredDefForIssue, setSelectedCredDefForIssue] = useState(null);
  const [issueForm] = Form.useForm();
  const [schemaForm] = Form.useForm();
  const [credDefForm] = Form.useForm();

  const loadData = async () => {
    setLoading(true);
    try {
      const [didRes, schemaRes, defRes, connRes, actRes, propRes] = await Promise.all([
        issuerService.getDID(),
        issuerService.getSchemas(),
        issuerService.getCredentialDefinitions(),
        issuerService.getConnections(),
        issuerService.getIssuanceActivity(),
        issuerService.getProposals ? issuerService.getProposals() : Promise.resolve({ data: [] }),
      ]);

      if (didRes?.success) setDidInfo(didRes.data);
      if (schemaRes?.success) setSchemas(schemaRes.data || []);
      if (defRes?.success) {
        setCredDefs(defRes.data || []);
        if (defRes.data?.length > 0 && !selectedCredDefForIssue) {
          setSelectedCredDefForIssue(defRes.data[0]);
        }
      }
      if (connRes?.success) setConnections(connRes.data || []);
      if (actRes?.success) setActivities(actRes.data || []);
      if (propRes?.success) setProposals(propRes.data || []);
    } catch {
      message.error("Failed to load issuer data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCopyDID = () => {
    const didText = didInfo?.did || "did:sov:M6Mbe3qx7vBQAitT21A2K1";
    navigator.clipboard.writeText(didText);
    message.success("DID copied to clipboard!");
  };

  const handleCopyDIDDoc = () => {
    const docString = JSON.stringify(didDocumentObject, null, 2);
    navigator.clipboard.writeText(docString);
    message.success("DID Document JSON copied to clipboard!");
  };

  // Create Schema
  const handleAddAttribute = () => {
    const trimmed = newAttributeInput.trim();
    if (trimmed && !schemaAttributes.includes(trimmed)) {
      setSchemaAttributes([...schemaAttributes, trimmed]);
      setNewAttributeInput("");
    }
  };

  const handleRemoveAttribute = (attr) => {
    setSchemaAttributes(schemaAttributes.filter((a) => a !== attr));
  };

  const handleCreateSchema = async (values) => {
    if (schemaAttributes.length === 0) {
      message.warning("Please specify at least one attribute for the schema");
      return;
    }
    try {
      const res = await issuerService.createSchema({
        name: values.name,
        version: values.version || "1.0",
        attributes: schemaAttributes,
      });
      if (res?.success) {
        // Automatically provision credential definition in the background
        try {
          await issuerService.createCredentialDefinition({
            schemaId: res.data?.id || `schema-${Date.now()}`,
            tag: "default",
            supportRevocation: true,
            revocationRegistrySize: 500,
          });
        } catch {
          // gracefully proceed
        }
        message.success(`Schema '${values.name}' published & activated on ledger!`);
        setIsSchemaModalOpen(false);
        schemaForm.resetFields();
        setSchemaAttributes(["fullName", "email", "role"]);
        loadData();
      }
    } catch (err) {
      message.error(err.message || "Failed to publish schema");
    }
  };

  // Create Credential Definition
  const handleCreateCredDef = async (values) => {
    try {
      const res = await issuerService.createCredentialDefinition({
        schemaId: values.schemaId,
        tag: values.tag || "template-1",
        supportRevocation: values.supportRevocation || false,
        revocationRegistrySize: values.revocationRegistrySize || 100,
      });
      if (res?.success) {
        message.success("Credential Definition registered on ledger!");
        setIsCredDefModalOpen(false);
        credDefForm.resetFields();
        loadData();
      }
    } catch (err) {
      message.error(err.message || "Failed to create Credential Definition");
    }
  };

  // Dynamic Issue Credential
  const handleCredDefChange = (defId) => {
    const found = credDefs.find((d) => d.id === defId);
    setSelectedCredDefForIssue(found);
  };

  const handleIssueCredential = async (values) => {
    try {
      const attrPayload = {};
      const targetSchema = schemas.find((s) => s.id === selectedCredDefForIssue?.schemaId);
      const attrs = targetSchema?.attributes || ["fullName", "email"];

      attrs.forEach((attr) => {
        attrPayload[attr] = values[attr] || "";
      });

      const res = await issuerService.issueCredential(
        values.credentialDefinitionId,
        values.holderDid,
        attrPayload
      );
      if (res?.success) {
        message.success("Credential offer sent to holder!");
        setIsIssueModalOpen(false);
        issueForm.resetFields();
        loadData();
      }
    } catch {
      message.error("Failed to issue credential");
    }
  };

  // Revocation
  const handleOpenRevokeModal = (record) => {
    setSelectedRecordToRevoke(record);
    setRevokeReason("Administrative policy update");
    setIsRevokeModalOpen(true);
  };

  const handleConfirmRevoke = async () => {
    if (!selectedRecordToRevoke) return;
    try {
      const res = await issuerService.revokeCredential(selectedRecordToRevoke.id, revokeReason);
      if (res?.success) {
        message.success("Credential successfully revoked on ledger!");
        setIsRevokeModalOpen(false);
        setSelectedRecordToRevoke(null);
        loadData();
      }
    } catch (err) {
      message.error(err.message || "Failed to revoke credential");
    }
  };

  // Delete activity record
  const handleDeleteActivity = async (recordId) => {
    try {
      await issuerService.deleteActivityRecord(recordId);
      message.success("Issuance record deleted");
      loadData();
    } catch {
      message.error("Failed to delete record");
    }
  };

  // Accept Proposal
  const handleAcceptProposal = async (proposalId) => {
    try {
      const res = await issuerService.acceptProposal(proposalId);
      if (res?.success) {
        message.success("Proposal accepted! Credential issued and delivered.");
        loadData();
      }
    } catch {
      message.error("Failed to accept proposal");
    }
  };

  // Reject Proposal
  const handleRejectProposal = async (proposalId) => {
    const reason = prompt("Enter reason for proposal rejection:", "Incomplete claims");
    if (reason === null) return;
    try {
      const res = await issuerService.rejectProposal(proposalId, reason);
      if (res?.success) {
        message.info("Proposal rejected");
        loadData();
      }
    } catch {
      message.error("Failed to reject proposal");
    }
  };

  const handleAcceptAllProposals = async () => {
    try {
      setLoading(true);
      for (const prop of proposals) {
        await issuerService.acceptProposal(prop.id);
      }
      message.success(`All ${proposals.length} credential proposals accepted & issued!`);
      loadData();
    } catch {
      message.error("Failed to accept some proposals");
      loadData();
    } finally {
      setLoading(false);
    }
  };

  const proposalColumns = [
    {
      title: "Requester (Holder)",
      dataIndex: "holderName",
      key: "holderName",
      width: 220,
      render: (name, record) => {
        const initials = (name || "ID")
          .split(" ")
          .map((n) => n[0])
          .slice(0, 2)
          .join("")
          .toUpperCase();
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Avatar style={{ backgroundColor: "#EFF6FF", color: "#2563EB", fontWeight: 750, fontSize: 11.5, border: "1px solid #DBEAFE", flexShrink: 0 }}>
              {initials}
            </Avatar>
            <div style={{ minWidth: 0 }}>
              <strong style={{ color: "var(--text-primary)", display: "block", fontSize: 13, lineHeight: 1.3 }}>
                {name || "Identity Holder"}
              </strong>
              <Tooltip title={record.holderDid}>
                <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "monospace", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 140 }}>
                  {record.holderDid || "—"}
                </span>
              </Tooltip>
            </div>
          </div>
        );
      },
    },
    {
      title: "Requested Schema",
      dataIndex: "schemaName",
      key: "schemaName",
      width: 200,
      render: (schema) => (
        <span className="schema-pill-tag">
          <SafetyCertificateOutlined style={{ marginRight: 6, color: "#2563EB" }} />
          {schema || "Verifiable Credential"}
        </span>
      ),
    },
    {
      title: "Proposed Claims",
      dataIndex: "attributes",
      key: "attributes",
      width: 270,
      render: (attrs) => {
        const entries = Object.entries(attrs || {});
        if (entries.length === 0) {
          return <span style={{ color: "var(--text-muted)", fontSize: 12 }}>No claims provided</span>;
        }
        const [firstKey, firstVal] = entries[0];
        const remainingCount = entries.length - 1;

        const popoverContent = (
          <div style={{ minWidth: 260, maxWidth: 360 }}>
            <div style={{ paddingBottom: 8, marginBottom: 8, borderBottom: "1px solid #F1F5F9", display: "flex", alignItems: "center", gap: 6 }}>
              <FileTextOutlined style={{ color: "#2563EB" }} />
              <strong style={{ fontSize: 13, color: "#0F172A" }}>Proposed Claims Payload ({entries.length})</strong>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {entries.map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, padding: "3px 0", borderBottom: "1px dashed #F1F5F9" }}>
                  <span style={{ color: "#64748B", fontWeight: 500 }}>{k}</span>
                  <span style={{ fontWeight: 600, color: "#0F172A", fontFamily: "monospace" }}>{String(v)}</span>
                </div>
              ))}
            </div>
          </div>
        );

        return (
          <div className="claims-compact-cell">
            <Popover content={popoverContent} trigger="hover" placement="right">
              <span className="claims-preview-pill" title="Hover to view all claims">
                <span className="claims-preview-key">{firstKey}:</span>
                <span className="claims-preview-val">{String(firstVal)}</span>
                {remainingCount > 0 && (
                  <span className="claims-more-counter">+{remainingCount} more</span>
                )}
              </span>
            </Popover>
          </div>
        );
      },
    },
    {
      title: "Note / Purpose",
      dataIndex: "comment",
      key: "comment",
      width: 240,
      render: (comment) => (
        <Tooltip title={comment}>
          <div className="proposal-comment-cell">
            <CommentOutlined style={{ color: "#94A3B8", marginRight: 6, flexShrink: 0 }} />
            <span className="proposal-comment-text">
              {comment || "Standard issuance request"}
            </span>
          </div>
        </Tooltip>
      ),
    },
    {
      title: "Received",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 110,
      render: (date, record) => {
        const d = date || record.created_at;
        return (
          <span style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 500 }}>
            {d ? new Date(d).toLocaleDateString() : "Recent"}
          </span>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 200,
      align: "right",
      render: (_, record) => (
        <Space size="small">
          <Button
            size="small"
            type="primary"
            icon={<CheckCircleOutlined />}
            className="btn-accept-proposal"
            onClick={() => handleAcceptProposal(record.id)}
          >
            Accept & Issue
          </Button>
          <Popconfirm
            title="Reject credential proposal?"
            description="Are you sure you want to reject this request?"
            onConfirm={() => handleRejectProposal(record.id)}
            okText="Yes, Reject"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Button size="small" className="btn-reject-proposal">
              Reject
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const filteredActivities = activities.filter(
    (a) =>
      a.id.toLowerCase().includes(searchFilter.toLowerCase()) ||
      a.holderDid.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const activeCredDefSchema = schemas.find((s) => s.id === selectedCredDefForIssue?.schemaId);
  const currentAttributesForIssue = activeCredDefSchema?.attributes || ["fullName", "email"];

  const currentIssuerDID = didInfo?.did || "did:sov:M6Mbe3qx7vBQAitT21A2K1";

  const didDocumentObject = {
    "@context": [
      "https://www.w3.org/ns/did/v1",
      "https://w3id.org/security/suites/ed25519-2020/v1",
    ],
    id: currentIssuerDID,
    verificationMethod: [
      {
        id: `${currentIssuerDID}#key-1`,
        type: "Ed25519VerificationKey2020",
        controller: currentIssuerDID,
        publicKeyMultibase: "z6MkmL7G3E2oR8BQAitT21A2K1vNx7Wj9Qp",
      },
    ],
    authentication: [`${currentIssuerDID}#key-1`],
    assertionMethod: [`${currentIssuerDID}#key-1`],
    service: [
      {
        id: `${currentIssuerDID}#didcomm`,
        type: "DIDCommMessaging",
        serviceEndpoint: "https://ssi.cdac.in/didcomm/endpoint",
        accept: ["didcomm/v2"],
      },
    ],
  };

  // Activity columns
  const activityColumns = [
    {
      title: "Exchange ID",
      dataIndex: "id",
      key: "id",
      width: 170,
      render: (text) => (
        <span className="mono-badge" style={{ whiteSpace: "nowrap", display: "inline-block" }}>
          {text}
        </span>
      ),
    },
    {
      title: "Credential Definition / Schema",
      dataIndex: "credentialDefinitionId",
      key: "credentialDefinitionId",
      width: 230,
      render: (id) => {
        const found = credDefs.find((d) => d.id === id);
        return <strong style={{ color: "var(--text-primary)", whiteSpace: "nowrap" }}>{found?.schemaName || id}</strong>;
      },
    },
    {
      title: "Holder DID",
      dataIndex: "holderDid",
      key: "holderDid",
      width: 200,
      render: (did) => (
        <Tooltip title={did}>
          <span className="mono-subtext" style={{ whiteSpace: "nowrap" }}>
            {did ? `${did.slice(0, 18)}...${did.slice(-4)}` : "—"}
          </span>
        </Tooltip>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 130,
      render: (status, record) => {
        if (record.revocationStatus === "revoked" || record.revoked) {
          return (
            <Tag color="error" icon={<CloseCircleOutlined />} style={{ whiteSpace: "nowrap" }}>
              REVOKED
            </Tag>
          );
        }
        return status === "issued" ? (
          <Tag color="success" icon={<CheckCircleOutlined />} style={{ whiteSpace: "nowrap" }}>
            ISSUED
          </Tag>
        ) : (
          <Tag color="warning" icon={<ClockCircleOutlined />} style={{ whiteSpace: "nowrap" }}>
            PENDING
          </Tag>
        );
      },
    },
    {
      title: "Issued At",
      dataIndex: "issuedAt",
      key: "issuedAt",
      width: 120,
      render: (val) => (
        <span style={{ whiteSpace: "nowrap" }}>
          {val ? new Date(val).toLocaleDateString() : "—"}
        </span>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 190,
      align: "right",
      render: (_, record) => (
        <Space size="small" style={{ whiteSpace: "nowrap" }}>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => setSelectedCredentialForView(record)}
          >
            Claims
          </Button>
          {!record.revoked && record.revocationStatus !== "revoked" && (
            <Button
              size="small"
              danger
              icon={<CloseCircleOutlined />}
              onClick={() => handleOpenRevokeModal(record)}
            >
              Revoke
            </Button>
          )}
          <Popconfirm
            title="Delete this record?"
            onConfirm={() => handleDeleteActivity(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button size="small" type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const schemaColumns = [
    { title: "Schema ID", dataIndex: "id", key: "id", render: (t) => <span className="mono-badge">{t}</span> },
    { title: "Name", dataIndex: "name", key: "name", render: (text) => <strong>{text}</strong> },
    { title: "Version", dataIndex: "version", key: "version", render: (v) => <Tag color="blue">{v || "1.0"}</Tag> },
    {
      title: "Attributes",
      dataIndex: "attributes",
      key: "attributes",
      render: (attrs) => (
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {attrs?.map((a) => (
            <Tag key={a} color="geekblue">
              {a}
            </Tag>
          ))}
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (s) => <Tag color={s === "active" ? "green" : "default"}>{(s || "active").toUpperCase()}</Tag>,
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Button size="small" icon={<EyeOutlined />} onClick={() => setSelectedSchemaForView(record)}>
          View Template
        </Button>
      ),
    },
  ];

  const connectionColumns = [
    {
      title: "Peer Label",
      dataIndex: "their_label",
      key: "their_label",
      render: (t, r) => <strong>{t || r.holderName || "Connected Holder"}</strong>,
    },
    {
      title: "Their DID",
      dataIndex: "their_did",
      key: "their_did",
      render: (d, r) => (
        <Tooltip title={d || r.holderDid}>
          <span className="mono-subtext">
            {(d || r.holderDid) ? `${(d || r.holderDid).slice(0, 20)}...` : "—"}
          </span>
        </Tooltip>
      ),
    },
    {
      title: "State",
      dataIndex: "state",
      key: "state",
      render: (s) => (
        <Tag color={s === "active" || s === "completed" ? "green" : "gold"}>
          {(s || "active").toUpperCase()}
        </Tag>
      ),
    },
  ];

  const tabTitles = {
    dashboard: "Issuer Portal • Overview",
    schemas: "Issuer Portal • Schemas",
    connections: "Issuer Portal • Connections",
    issuance: "Issuer Portal • Issuance History",
  };

  const didBadgeAction = (
    <div
      onClick={handleCopyDID}
      title="Click to copy Issuer DID"
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
      <span>DID: {currentIssuerDID.slice(0, 15)}...</span>
      <CopyOutlined style={{ fontSize: 11, color: "var(--text-muted)" }} />
    </div>
  );

  return (
    <DashboardLayout title={tabTitles[activeTab] || "Issuer Portal"} role="issuer" actions={didBadgeAction}>
      <div className="issuer-dashboard animate-in">
        {/* ========================================================= */}
        {/* TAB: OVERVIEW (Dashboard Overview)                        */}
        {/* ========================================================= */}
        {activeTab === "dashboard" && (
          <>
            {/* 4 Stat Cards Row (Overview Only) */}
            <div className="kpi-stats-row">
              <StatCard
                title="TOTAL ISSUANCES"
                value={activities.length || 3}
                label="Verifiable Credentials"
                accent={{
                  color: "#2563EB",
                  bg: "#EFF6FF",
                  grad: "linear-gradient(135deg, #1B365D, #2563EB)",
                  icon: <AuditOutlined />,
                }}
              />
              <StatCard
                title="ACTIVE SCHEMAS"
                value={schemas.length || 3}
                label="Credential Templates"
                accent={{
                  color: "#2563EB",
                  bg: "#EFF6FF",
                  grad: "linear-gradient(135deg, #1B365D, #2563EB)",
                  icon: <FileTextOutlined />,
                }}
              />
              <StatCard
                title="ACTIVE CREDENTIALS"
                value={activities.filter((a) => !a.revoked && a.revocationStatus !== "revoked").length || 3}
                label="In-Circulation & Valid"
                accent={{
                  color: "#2563EB",
                  bg: "#EFF6FF",
                  grad: "linear-gradient(135deg, #1B365D, #2563EB)",
                  icon: <CheckCircleOutlined />,
                }}
              />
              <StatCard
                title="CONNECTED HOLDERS"
                value={connections.length || 3}
                label="Active Peer Connections"
                accent={{
                  color: "#2563EB",
                  bg: "#EFF6FF",
                  grad: "linear-gradient(135deg, #1B365D, #2563EB)",
                  icon: <TeamOutlined />,
                }}
              />
            </div>

            {/* Issuer Identity Bar */}
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
                    Issuer Identity (DID):
                  </span>{" "}
                  <code style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{currentIssuerDID}</code>
                </div>
              </div>
              <Button size="small" icon={<CopyOutlined />} onClick={handleCopyDID}>
                Copy DID
              </Button>
            </div>
            {/* Real-time Telemetry Status */}
            <div className="overview-telemetry-grid animate-in-d1">
              <div className="telemetry-mini-card">
                <div className="telemetry-icon-box" style={{ background: "#EFF6FF", color: "#2563EB" }}>
                  <DatabaseOutlined />
                </div>
                <div>
                  <div className="telemetry-label">Ledger Connection</div>
                  <div className="telemetry-val">CDAC Indy Testnet</div>
                  <div className="telemetry-sub">Status: Synced • Block #148,290</div>
                </div>
              </div>

              <div className="telemetry-mini-card">
                <div className="telemetry-icon-box" style={{ background: "#EFF6FF", color: "#2563EB" }}>
                  <SafetyCertificateOutlined />
                </div>
                <div>
                  <div className="telemetry-label">Cryptographic Engine</div>
                  <div className="telemetry-val">AnonCreds v1.0</div>
                  <div className="telemetry-sub">Ed25519 & BBS+ Signatures</div>
                </div>
              </div>

              <div className="telemetry-mini-card">
                <div className="telemetry-icon-box" style={{ background: "#EFF6FF", color: "#2563EB" }}>
                  <KeyOutlined />
                </div>
                <div>
                  <div className="telemetry-label">Revocation Accumulator</div>
                  <div className="telemetry-val">Dynamic Accumulator</div>
                  <div className="telemetry-sub">Zero Sensitive Data Leakage</div>
                </div>
              </div>

              <div className="telemetry-mini-card">
                <div className="telemetry-icon-box" style={{ background: "#EFF6FF", color: "#2563EB" }}>
                  <DeploymentUnitOutlined />
                </div>
                <div>
                  <div className="telemetry-label">DIDComm Protocol</div>
                  <div className="telemetry-val">DIDComm v2 Peer</div>
                  <div className="telemetry-sub">End-to-End Encrypted Handshakes</div>
                </div>
              </div>
            </div>

            {/* Recent Issuances */}
            <div className="content-card animate-in-d2">
              <div className="issuance-subtab-toolbar" style={{ borderBottom: "none", paddingBottom: 0, marginBottom: 16 }}>
                <div>
                  <h2 className="issuance-subtab-title" style={{ fontSize: 18 }}>Recent Issuance Activity</h2>
                  <p className="issuance-subtab-desc">
                    Latest cryptographically signed verifiable credentials delivered to identity holders
                  </p>
                </div>
                <Button type="link" onClick={() => navigate("/issuer-issuance")} style={{ fontWeight: 600, color: "#2563EB" }}>
                  View Full History & Audit Log <ArrowRightOutlined />
                </Button>
              </div>
              <Table
                dataSource={activities.slice(0, 3)}
                columns={activityColumns}
                rowKey="id"
                loading={loading}
                pagination={false}
                className="issuance-table"
                scroll={{ x: 1050 }}
              />
            </div>

            {/* 5-Step Verifiable Credential Lifecycle */}
            <div className="about-issuer-container animate-in-d2">
              <div className="about-header" style={{ borderBottom: "none", paddingBottom: 0 }}>
                <span className="about-header-badge">
                  <InfoCircleOutlined /> Workflow Guide
                </span>
                <h2>5-Step Verifiable Credential Lifecycle</h2>
                <p>
                  A simple step-by-step workflow of how verifiable credentials are created, signed, and managed.
                </p>
              </div>

              <div className="lifecycle-steps-grid">
                <div className="lifecycle-step">
                  <div className="lifecycle-step-header">
                    <span className="lifecycle-step-num">STEP 01</span>
                    <div className="lifecycle-step-icon">
                      <FileTextOutlined />
                    </div>
                  </div>
                  <h5>Define Schema</h5>
                  <p>Specify the credential attributes (e.g., Name, ID, Organization) on the ledger.</p>
                </div>

                <div className="lifecycle-step">
                  <div className="lifecycle-step-header">
                    <span className="lifecycle-step-num">STEP 02</span>
                    <div className="lifecycle-step-icon">
                      <KeyOutlined />
                    </div>
                  </div>
                  <h5>Create Cred Def</h5>
                  <p>Generate cryptographic signing keys and setup revocation rules.</p>
                </div>

                <div className="lifecycle-step">
                  <div className="lifecycle-step-header">
                    <span className="lifecycle-step-num">STEP 03</span>
                    <div className="lifecycle-step-icon">
                      <LinkOutlined />
                    </div>
                  </div>
                  <h5>Connect Holder</h5>
                  <p>Establish a secure, encrypted DIDComm channel with the holder's wallet.</p>
                </div>

                <div className="lifecycle-step">
                  <div className="lifecycle-step-header">
                    <span className="lifecycle-step-num">STEP 04</span>
                    <div className="lifecycle-step-icon">
                      <SendOutlined />
                    </div>
                  </div>
                  <h5>Issue Credential</h5>
                  <p>Digitally sign and securely transmit verifiable credentials to the holder.</p>
                </div>

                <div className="lifecycle-step">
                  <div className="lifecycle-step-header">
                    <span className="lifecycle-step-num">STEP 05</span>
                    <div className="lifecycle-step-icon">
                      <SafetyCertificateOutlined />
                    </div>
                  </div>
                  <h5>Manage Status</h5>
                  <p>Audit issuance records and update non-revocation status on the ledger.</p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ========================================================= */}
        {/* 2. TAB: SCHEMAS & TEMPLATES                              */}
        {/* ========================================================= */}
        {activeTab === "schemas" && (
          <div className="content-card animate-in-d1">
            <div className="issuance-subtab-toolbar">
              <div>
                <h2 className="issuance-subtab-title" style={{ fontSize: 18 }}>Credential Schemas & Templates</h2>
                <p className="issuance-subtab-desc">
                  W3C compliant schema templates authored and anchored on the decentralized ledger
                </p>
              </div>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsSchemaModalOpen(true)} style={{ background: "#1B365D", borderColor: "#1B365D", borderRadius: 8, fontWeight: 600 }}>
                Create New Schema
              </Button>
            </div>
            <Table
              dataSource={schemas}
              columns={schemaColumns}
              rowKey="id"
              loading={loading}
              pagination={false}
              className="issuance-table"
              scroll={{ x: 900 }}
            />
          </div>
        )}

        {/* ========================================================= */}
        {/* 6. TAB: CONNECTIONS                                       */}
        {/* ========================================================= */}
        {activeTab === "connections" && (
          <div className="content-card animate-in-d1">
            <div className="issuance-subtab-toolbar">
              <div>
                <h2 className="issuance-subtab-title" style={{ fontSize: 18 }}>Connected Identity Holders</h2>
                <p className="issuance-subtab-desc">
                  Encrypted pairwise DIDComm peer connections established with digital identity wallets
                </p>
              </div>
              <Button type="primary" icon={<LinkOutlined />} onClick={() => setIsConnectionModalOpen(true)} style={{ background: "#1B365D", borderColor: "#1B365D", borderRadius: 8, fontWeight: 600 }}>
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
        {/* 4. TAB: ISSUANCE HISTORY & CREDENTIAL REQUESTS QUEUE      */}
        {/* ========================================================= */}
        {activeTab === "issuance" && (
          <div className="content-card issuance-card animate-in-d1">
            <Tabs
              activeKey={issuanceSubTab}
              onChange={setIssuanceSubTab}
              className="issuance-tabs"
              items={[
                {
                  key: "history",
                  label: (
                    <span className="issuance-tab-label">
                      <ClockCircleOutlined style={{ color: issuanceSubTab === "history" ? "#2563EB" : undefined }} />
                      <span>Issued Credentials & Audit Log</span>
                      <span className="tab-counter-badge audit-badge">
                        {activities.length}
                      </span>
                    </span>
                  ),
                  children: (
                    <div className="issuance-tab-content">
                      <div className="issuance-subtab-toolbar">
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <h3 className="issuance-subtab-title">Issued Credentials & Audit Trail</h3>
                            <span className="tab-counter-badge audit-badge">{activities.length} Records</span>
                          </div>
                          <p className="issuance-subtab-desc">
                            Immutable ledger records of signed verifiable credentials and revocation status
                          </p>
                        </div>
                        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                          <Input
                            prefix={<SearchOutlined style={{ color: "var(--text-muted)" }} />}
                            placeholder="Filter by ID or Holder DID..."
                            value={searchFilter}
                            onChange={(e) => setSearchFilter(e.target.value)}
                            style={{ width: 250, borderRadius: 8 }}
                            allowClear
                          />
                          <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => setIsIssueModalOpen(true)}
                            style={{ background: "#1B365D", borderColor: "#1B365D", borderRadius: 8, fontWeight: 600 }}
                          >
                            Issue New Credential
                          </Button>
                        </div>
                      </div>
                      <Table
                        dataSource={filteredActivities}
                        columns={activityColumns}
                        rowKey="id"
                        loading={loading}
                        pagination={{ pageSize: 8, showSizeChanger: true }}
                        className="issuance-table"
                        scroll={{ x: 1050 }}
                      />
                    </div>
                  ),
                },
                {
                  key: "requests",
                  label: (
                    <span className="issuance-tab-label">
                      <InboxOutlined style={{ color: proposals.length > 0 ? "#F59E0B" : "inherit" }} />
                      <span>Pending Requests Queue</span>
                      {proposals.length > 0 ? (
                        <span className="tab-counter-badge queue-badge">{proposals.length}</span>
                      ) : (
                        <span className="tab-counter-badge empty-badge">0</span>
                      )}
                    </span>
                  ),
                  children: (
                    <div className="issuance-tab-content">
                      <div className="issuance-subtab-toolbar">
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <h3 className="issuance-subtab-title">Incoming Credential Requests</h3>
                            {proposals.length > 0 && (
                              <span className="tab-counter-badge queue-badge">{proposals.length} Pending</span>
                            )}
                          </div>
                          <p className="issuance-subtab-desc">
                            Review and accept or reject verifiable credential requests submitted by connected peer holders
                          </p>
                        </div>
                        {proposals.length > 0 && (
                          <Button
                            type="primary"
                            icon={<CheckCircleFilled />}
                            className="btn-accept-all"
                            onClick={handleAcceptAllProposals}
                          >
                            Accept All Requests
                          </Button>
                        )}
                      </div>
                      {proposals.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "48px 20px" }}>
                          <InboxOutlined style={{ fontSize: 44, color: "var(--text-muted)", marginBottom: 12 }} />
                          <h4 style={{ margin: "0 0 6px", color: "var(--text-primary)" }}>No Pending Requests</h4>
                          <p style={{ color: "var(--text-secondary)", fontSize: 13, margin: 0 }}>
                            All holder credential requests have been processed. New requests will appear here in real-time.
                          </p>
                        </div>
                      ) : (
                        <Table
                          dataSource={proposals}
                          columns={proposalColumns}
                          rowKey="id"
                          pagination={{ pageSize: 6, showSizeChanger: true }}
                          className="issuance-table"
                          scroll={{ x: 1150 }}
                        />
                      )}
                    </div>
                  ),
                },
              ]}
            />
          </div>
        )}

        {/* ========================================================= */}
        {/* MODALS (Available across the portal)                     */}
        {/* ========================================================= */}

        {/* Dynamic Issue Credential Modal */}
        <Modal
          title={
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <SendOutlined style={{ color: "#4F46E5" }} />
              <span>Issue Verifiable Credential to Peer</span>
            </div>
          }
          open={isIssueModalOpen}
          onCancel={() => setIsIssueModalOpen(false)}
          footer={null}
          width={650}
          destroyOnClose
        >
          <Form
            form={issueForm}
            layout="vertical"
            onFinish={handleIssueCredential}
            initialValues={{
              credentialDefinitionId: credDefs[0]?.id || "cred-def-1",
              holderDid: connections[0]?.their_did || connections[0]?.holderDid || "did:sov:WRfXPg8EcRocfdZA69HP56",
            }}
            style={{ marginTop: 16 }}
          >
            <Form.Item
              name="credentialDefinitionId"
              label="Select Credential Schema / Template"
              rules={[{ required: true, message: "Please select a credential template" }]}
            >
              <Select onChange={handleCredDefChange} placeholder="Select Credential Template">
                {credDefs.map((def) => (
                  <Option key={def.id} value={def.id}>
                    {def.schemaName} ({def.tag || "default"})
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="holderDid"
              label="Recipient Holder Connection / DID"
              rules={[{ required: true, message: "Please select recipient" }]}
            >
              <Select placeholder="Select connected holder">
                {connections.map((conn) => (
                  <Option key={conn.connection_id || conn.id} value={conn.their_did || conn.holderDid}>
                    {conn.their_label || conn.holderName || "Connected Peer"} — {conn.their_did || conn.holderDid}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <div style={{ marginTop: 16, marginBottom: 8 }}>
              <strong style={{ fontSize: 13, color: "var(--text-primary)" }}>
                Schema Attributes for '{activeCredDefSchema?.name || "Selected Schema"}':
              </strong>
            </div>

            <div style={{ background: "rgba(0,0,0,0.02)", padding: 12, borderRadius: 8, marginBottom: 16 }}>
              {currentAttributesForIssue.map((attr) => (
                <Form.Item
                  key={attr}
                  name={attr}
                  label={attr.charAt(0).toUpperCase() + attr.slice(1)}
                  rules={[{ required: true, message: `Please enter ${attr}` }]}
                  style={{ marginBottom: 10 }}
                >
                  <Input placeholder={`Enter value for ${attr}`} />
                </Form.Item>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
              <Button onClick={() => setIsIssueModalOpen(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit">
                Sign & Issue Credential
              </Button>
            </div>
          </Form>
        </Modal>

        {/* Create Schema Modal */}
        <Modal
          title={
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <FileTextOutlined style={{ color: "#06B6D4" }} />
              <span>Create New W3C Credential Schema</span>
            </div>
          }
          open={isSchemaModalOpen}
          onCancel={() => setIsSchemaModalOpen(false)}
          footer={null}
          destroyOnClose
        >
          <Form form={schemaForm} layout="vertical" onFinish={handleCreateSchema} style={{ marginTop: 16 }}>
            <Form.Item name="name" label="Schema Name" rules={[{ required: true, message: "Please input schema name" }]}>
              <Input placeholder="e.g. Employee ID, Security Clearance, Degree Certificate" />
            </Form.Item>

            <Form.Item name="version" label="Version" initialValue="1.0">
              <Input placeholder="1.0" />
            </Form.Item>

            <div style={{ marginBottom: 8 }}>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>Schema Attributes:</label>
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <Input
                  placeholder="Add attribute (e.g., department, gpa, clearanceLevel)"
                  value={newAttributeInput}
                  onChange={(e) => setNewAttributeInput(e.target.value)}
                  onPressEnter={handleAddAttribute}
                />
                <Button type="dashed" onClick={handleAddAttribute} icon={<PlusOutlined />}>
                  Add
                </Button>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, padding: 8, background: "rgba(0,0,0,0.02)", borderRadius: 8 }}>
                {schemaAttributes.map((attr) => (
                  <Tag
                    key={attr}
                    closable
                    onClose={() => handleRemoveAttribute(attr)}
                    color="blue"
                    style={{ fontSize: 13, padding: "3px 8px" }}
                  >
                    {attr}
                  </Tag>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 24 }}>
              <Button onClick={() => setIsSchemaModalOpen(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit">
                Register Schema on Ledger
              </Button>
            </div>
          </Form>
        </Modal>

        {/* Create Credential Definition Modal */}
        <Modal
          title={
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <KeyOutlined style={{ color: "#8B5CF6" }} />
              <span>Create Credential Definition</span>
            </div>
          }
          open={isCredDefModalOpen}
          onCancel={() => setIsCredDefModalOpen(false)}
          footer={null}
          destroyOnClose
        >
          <Form
            form={credDefForm}
            layout="vertical"
            onFinish={handleCreateCredDef}
            initialValues={{ tag: "template-1", supportRevocation: true, revocationRegistrySize: 100 }}
            style={{ marginTop: 16 }}
          >
            <Form.Item name="schemaId" label="Target Schema" rules={[{ required: true, message: "Please select a schema" }]}>
              <Select placeholder="Select schema for definition">
                {schemas.map((s) => (
                  <Option key={s.id} value={s.id}>
                    {s.name} (v{s.version || "1.0"})
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item name="tag" label="Definition Tag / Label" rules={[{ required: true }]}>
              <Input placeholder="e.g. template-1, standard-2024" />
            </Form.Item>

            <Form.Item name="supportRevocation" label="Enable Revocation Support" valuePropName="checked">
              <Switch checkedChildren="Yes" unCheckedChildren="No" />
            </Form.Item>

            <Form.Item name="revocationRegistrySize" label="Revocation Registry Size">
              <InputNumber min={10} max={1000} style={{ width: "100%" }} />
            </Form.Item>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 24 }}>
              <Button onClick={() => setIsCredDefModalOpen(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit">
                Generate Public Key & Definition
              </Button>
            </div>
          </Form>
        </Modal>

        {/* Revocation Modal */}
        <Modal
          title={
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <CloseCircleOutlined style={{ color: "#ef4444" }} />
              <span>Revoke Verifiable Credential</span>
            </div>
          }
          open={isRevokeModalOpen}
          onCancel={() => setIsRevokeModalOpen(false)}
          onOk={handleConfirmRevoke}
          okText="Confirm Revocation"
          okButtonProps={{ danger: true }}
          destroyOnClose
        >
          <p>
            Are you sure you want to revoke credential <strong>{selectedRecordToRevoke?.id}</strong>?
            This will publish a cryptographic revocation accumulator delta to the ledger.
          </p>
          <div style={{ marginTop: 12 }}>
            <label style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>Revocation Reason:</label>
            <Input.TextArea
              rows={3}
              value={revokeReason}
              onChange={(e) => setRevokeReason(e.target.value)}
              placeholder="e.g. Employee departed, credential expired, security breach"
            />
          </div>
        </Modal>

        {/* Connection Manager Modal */}
        <ConnectionModal
          visible={isConnectionModalOpen}
          onClose={() => {
            setIsConnectionModalOpen(false);
            loadData();
          }}
          connections={connections}
          onCreateInvitation={issuerService.createInvitation}
          onReceiveInvitation={issuerService.receiveInvitation}
          role="issuer"
        />

        {/* View Template Modal */}
        <ViewTemplateModal
          visible={!!selectedSchemaForView}
          onClose={() => setSelectedSchemaForView(null)}
          schema={selectedSchemaForView}
        />

        {/* View Credential Modal */}
        <CredentialDetailsModal
          visible={!!selectedCredentialForView}
          onClose={() => setSelectedCredentialForView(null)}
          credential={selectedCredentialForView}
        />

        {/* QR Code Preview Modal */}
        <Modal
          title="Issuer Decentralized Identifier QR"
          open={isQRModalOpen}
          onCancel={() => setIsQRModalOpen(false)}
          footer={[
            <Button key="close" onClick={() => setIsQRModalOpen(false)}>
              Close
            </Button>,
          ]}
        >
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div
              style={{
                width: 180,
                height: 180,
                margin: "0 auto 16px",
                background: "var(--surface-2)",
                borderRadius: 14,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "2px dashed var(--border-color)",
              }}
            >
              <QrcodeOutlined style={{ fontSize: 90, color: "var(--primary-color)" }} />
            </div>
            <p style={{ fontWeight: 600, fontFamily: "monospace", fontSize: 13, wordBreak: "break-all" }}>
              {currentIssuerDID}
            </p>
            <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>
              Scan to establish an encrypted DIDComm v2 peer connection with this Issuer.
            </p>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default IssuerDashboard;