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
  Steps,
  Collapse,
  Alert,
  Empty,
  Switch,
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
  InfoCircleOutlined,
  CopyOutlined,
  QuestionCircleOutlined,
  SendOutlined,
} from "@ant-design/icons";
import DashboardLayout from "../../layouts/DashboardLayout/DashboardLayout";
import StatCard from "../../components/cards/StatCard/StatCard";
import ConnectionModal from "../../components/modals/ConnectionModal/ConnectionModal";
import { verifierService } from "../../services/apiClient";
import "./VerifierDashboard.css";

const { Option } = Select;

const DEFAULT_CREDENTIAL_TEMPLATES = [
  {
    id: "national-id",
    name: "National Identity / Age Verification",
    description: "Standard citizen identification card with age and residency claims",
    attributes: [
      { key: "fullName", label: "Full Name" },
      { key: "email", label: "Email Address" },
      { key: "age", label: "Age" },
      { key: "nationality", label: "Nationality" },
    ],
    defaultPredicate: { name: "age", p_type: ">=", p_value: "18", label: "Age >= 18" },
  },
  {
    id: "university-degree",
    name: "University Degree Verification",
    description: "Higher education graduation credential with academic major and GPA",
    attributes: [
      { key: "studentName", label: "Student Name" },
      { key: "degreeType", label: "Degree" },
      { key: "major", label: "Major / Specialization" },
      { key: "graduationYear", label: "Graduation Year" },
      { key: "gradeAverage", label: "Grade Average (GPA)" },
    ],
    defaultPredicate: { name: "gradeAverage", p_type: ">=", p_value: "3.5", label: "GPA >= 3.5" },
  },
  {
    id: "cyber-cert",
    name: "Cyber Security Certification",
    description: "Professional IT security accreditation and skill verification",
    attributes: [
      { key: "holderName", label: "Holder Name" },
      { key: "certificateId", label: "Certificate ID" },
      { key: "issueDate", label: "Issue Date" },
      { key: "expiryDate", label: "Expiry Date" },
      { key: "securityLevel", label: "Security Level" },
    ],
    defaultPredicate: { name: "securityLevel", p_type: ">=", p_value: "2", label: "Security Level >= 2" },
  },
  {
    id: "corporate-id",
    name: "Corporate Employee ID & Clearance",
    description: "Enterprise organizational identity, department, and access clearance",
    attributes: [
      { key: "fullName", label: "Full Name" },
      { key: "employeeId", label: "Employee ID" },
      { key: "department", label: "Department" },
      { key: "designation", label: "Designation" },
      { key: "clearanceLevel", label: "Clearance Level" },
    ],
    defaultPredicate: { name: "clearanceLevel", p_type: ">=", p_value: "2", label: "Clearance Level >= 2" },
  },
];

const VerifierDashboard = ({ activeTab = "dashboard" }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [presentations, setPresentations] = useState([]);
  const [connections, setConnections] = useState([]);
  const [searchFilter, setSearchFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [historySearch, setHistorySearch] = useState("");
  const [historyFilter, setHistoryFilter] = useState("all");
  const [connectionSearch, setConnectionSearch] = useState("");

  // Modals
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isConnectionModalOpen, setIsConnectionModalOpen] = useState(false);
  const [isWorkflowModalOpen, setIsWorkflowModalOpen] = useState(false);
  const [selectedRecordForDetails, setSelectedRecordForDetails] = useState(null);

  // Request form state
  const [requestForm] = Form.useForm();
  const [selectedTemplate, setSelectedTemplate] = useState("national-id");
  const [selectedAttributes, setSelectedAttributes] = useState(["fullName", "email", "age"]);
  const [predicateEnabled, setPredicateEnabled] = useState(true);
  const [predicateAttr, setPredicateAttr] = useState("age");
  const [predicateOp, setPredicateOp] = useState(">=");
  const [predicateVal, setPredicateVal] = useState("18");
  const [hasRestrictions, setHasRestrictions] = useState(false);
  const [restrictionIssuerDid, setRestrictionIssuerDid] = useState("");
  const [submittingRequest, setSubmittingRequest] = useState(false);

  const loadData = async (showLoadingSpinner = false) => {
    if (showLoadingSpinner) setLoading(true);
    try {
      const [presRes, connRes] = await Promise.all([
        verifierService.getPresentations ? verifierService.getPresentations() : verifierService.getProofRequests(),
        verifierService.getConnections(),
      ]);

      if (presRes?.success) {
        setPresentations(presRes.data || []);
      }
      if (connRes?.success) {
        setConnections(connRes.data || []);
      }
    } catch {
      message.error("Failed to load verifier data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const fetchInitialData = async () => {
      try {
        const [presRes, connRes] = await Promise.all([
          verifierService.getPresentations ? verifierService.getPresentations() : verifierService.getProofRequests(),
          verifierService.getConnections(),
        ]);
        if (!isMounted) return;
        if (presRes?.success) setPresentations(presRes.data || []);
        if (connRes?.success) setConnections(connRes.data || []);
      } catch {
        if (isMounted) message.error("Failed to load verifier data");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchInitialData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleTemplateSelect = (templateId) => {
    const tmpl = DEFAULT_CREDENTIAL_TEMPLATES.find((t) => t.id === templateId);
    if (!tmpl) return;
    setSelectedTemplate(templateId);
    requestForm.setFieldsValue({
      requestName: tmpl.name,
      comment: tmpl.description,
    });
    setSelectedAttributes(tmpl.attributes.map((a) => a.key));
    if (tmpl.defaultPredicate) {
      setPredicateEnabled(true);
      setPredicateAttr(tmpl.defaultPredicate.name);
      setPredicateOp(tmpl.defaultPredicate.p_type);
      setPredicateVal(String(tmpl.defaultPredicate.p_value));
    } else {
      setPredicateEnabled(false);
    }
  };

  const handleOpenCreateRequest = (connectionId = null) => {
    const targetConnId = connectionId || connections[0]?.connection_id || "conn-v-1";
    requestForm.setFieldsValue({
      connectionId: targetConnId,
      requestName: "National Identity / Age Verification",
      comment: "Required for identity and age compliance check",
    });
    handleTemplateSelect("national-id");
    setIsRequestModalOpen(true);
  };

  const handleCreateProofRequest = async (values) => {
    setSubmittingRequest(true);
    try {
      const predicates = predicateEnabled
        ? [
            {
              name: predicateAttr,
              p_type: predicateOp,
              p_value: Number(predicateVal) || 18,
              label: `${predicateAttr} ${predicateOp} ${predicateVal}`,
            },
          ]
        : [];

      const currentTmpl = DEFAULT_CREDENTIAL_TEMPLATES.find((t) => t.id === selectedTemplate);
      const formattedAttrs = selectedAttributes.map((attrKey) => {
        const found = currentTmpl?.attributes.find((a) => a.key === attrKey);
        return { name: attrKey, label: found?.label || attrKey };
      });

      const restrictions = hasRestrictions && restrictionIssuerDid.trim()
        ? [{ issuer_did: restrictionIssuerDid.trim() }]
        : [];

      const payload = {
        name: values.requestName || "Custom Proof Request",
        connectionId: values.connectionId,
        requestedAttributes: formattedAttrs,
        requestedPredicates: predicates,
        restrictions,
        comment: values.comment || "Proof verification requested via Verifier Portal",
      };

      const res = await verifierService.createProofRequest(payload);
      if (res?.success) {
        message.success("Proof request dispatched to holder wallet!");
        setIsRequestModalOpen(false);
        requestForm.resetFields();
        setPredicateEnabled(false);
        setHasRestrictions(false);
        setRestrictionIssuerDid("");
        await loadData();
      } else {
        message.error(res?.message || "Failed to dispatch proof request");
      }
    } catch {
      message.error("Failed to dispatch proof request");
    } finally {
      setSubmittingRequest(false);
    }
  };

  const handleApproveVerify = async (exchangeId) => {
    try {
      const res = await verifierService.verifyPresentation(exchangeId);
      if (res?.success) {
        message.success("Cryptographic presentation verified and approved!");
        await loadData();
        if (selectedRecordForDetails?.presentation_exchange_id === exchangeId) {
          const updated = {
            ...selectedRecordForDetails,
            state: "verified",
            verified: "true",
            completed_at: new Date().toISOString(),
          };
          setSelectedRecordForDetails(updated);
        }
      } else {
        message.error(res?.message || "Failed to verify presentation");
      }
    } catch {
      message.error("Failed to verify presentation");
    }
  };

  const handleRejectPresentation = async (exchangeId) => {
    const reason = prompt("Enter reason for rejection:", "Claims did not satisfy verifier policy requirements");
    if (reason === null) return;
    try {
      const res = await verifierService.rejectPresentation(exchangeId, reason);
      if (res?.success) {
        message.info("Presentation rejected.");
        await loadData();
        if (selectedRecordForDetails?.presentation_exchange_id === exchangeId) {
          const updated = {
            ...selectedRecordForDetails,
            state: "abandoned",
            verified: "false",
            rejection_reason: reason,
            completed_at: new Date().toISOString(),
          };
          setSelectedRecordForDetails(updated);
        }
      }
    } catch {
      message.error("Failed to reject presentation");
    }
  };

  const handleDeletePresentation = async (exchangeId) => {
    try {
      await verifierService.deletePresentation(exchangeId);
      message.success("Record deleted");
      if (selectedRecordForDetails?.presentation_exchange_id === exchangeId) {
        setSelectedRecordForDetails(null);
      }
      loadData();
    } catch {
      message.error("Failed to delete record");
    }
  };

  // Status-derived datasets
  const verifiedCount = presentations.filter(
    (p) => p.state === "verified" || p.verified === "true" || p.verified === true
  ).length;

  const presentationsAwaitingVerification = presentations.filter(
    (p) => p.state === "presentation_received"
  );

  const requestsAwaitingHolder = presentations.filter(
    (p) => p.state === "request_sent"
  );

  const completedPresentations = presentations.filter(
    (p) => p.state === "verified" || p.verified === "true" || p.verified === true
  );

  const failedOrRejectedPresentations = presentations.filter(
    (p) => p.state === "abandoned" || p.state === "rejected" || p.state === "failed"
  );

  const currentVerifierDID = "did:sov:V3RF81mC9w4qP2xT8Y";
  const handleCopyDID = () => {
    navigator.clipboard.writeText(currentVerifierDID);
    message.success("Verifier DID copied to clipboard!");
  };

  // Helper for human-readable statuses
  const renderStatusBadge = (record) => {
    const state = record.state;
    const isVerified = state === "verified" || record.verified === "true" || record.verified === true;
    const isRejected = state === "abandoned" || state === "rejected";
    const isReceived = state === "presentation_received";
    const isPendingHolder = state === "request_sent";

    if (isVerified) {
      return (
        <Tag color="success" icon={<CheckCircleOutlined />} style={{ whiteSpace: "nowrap" }}>
          Verified
        </Tag>
      );
    }
    if (isReceived) {
      return (
        <Tag color="blue" icon={<EyeOutlined />} style={{ whiteSpace: "nowrap" }}>
          Presentation Received
        </Tag>
      );
    }
    if (isPendingHolder) {
      return (
        <Tag color="gold" icon={<ClockCircleOutlined />} style={{ whiteSpace: "nowrap" }}>
          Awaiting Presentation
        </Tag>
      );
    }
    if (isRejected) {
      return (
        <Tag color="error" icon={<CloseCircleOutlined />} style={{ whiteSpace: "nowrap" }}>
          Rejected
        </Tag>
      );
    }
    return (
      <Tag color="default" style={{ whiteSpace: "nowrap" }}>
        {state || "Pending"}
      </Tag>
    );
  };

  // Top header DID badge
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
        background: "var(--surface-2, #f8fafc)",
        border: "1px solid var(--border-color, #e2e8f0)",
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

  // Filtered Proof Requests
  const filteredPresentations = presentations.filter((p) => {
    const idStr = p.presentation_exchange_id || p.id || "";
    const holderStr = p.holder_name || p.their_label || "";
    const nameStr = p.name || "";
    const matchesSearch =
      idStr.toLowerCase().includes(searchFilter.toLowerCase()) ||
      holderStr.toLowerCase().includes(searchFilter.toLowerCase()) ||
      nameStr.toLowerCase().includes(searchFilter.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === "awaiting_presentation") return p.state === "request_sent";
    if (statusFilter === "presentation_received") return p.state === "presentation_received";
    if (statusFilter === "verified") return p.state === "verified" || p.verified === "true" || p.verified === true;
    if (statusFilter === "rejected") return p.state === "abandoned" || p.state === "rejected" || p.state === "failed";
    return true;
  });

  // Filtered History
  const filteredHistory = presentations
    .filter((p) => p.state === "verified" || p.verified === "true" || p.state === "abandoned" || p.state === "rejected" || p.state === "failed")
    .filter((p) => {
      const idStr = p.presentation_exchange_id || p.id || "";
      const holderStr = p.holder_name || p.their_label || "";
      const nameStr = p.name || "";
      const matchesSearch =
        idStr.toLowerCase().includes(historySearch.toLowerCase()) ||
        holderStr.toLowerCase().includes(historySearch.toLowerCase()) ||
        nameStr.toLowerCase().includes(historySearch.toLowerCase());

      if (!matchesSearch) return false;

      if (historyFilter === "verified") return p.state === "verified" || p.verified === "true";
      if (historyFilter === "rejected") return p.state === "abandoned" || p.state === "rejected" || p.state === "failed";
      return true;
    });

  // Filtered Connections
  const filteredConnections = connections.filter((c) => {
    const label = c.their_label || "";
    const did = c.their_did || "";
    return (
      label.toLowerCase().includes(connectionSearch.toLowerCase()) ||
      did.toLowerCase().includes(connectionSearch.toLowerCase())
    );
  });

  // Proof Requests Columns
  const proofRequestColumns = [
    {
      title: "Request ID",
      dataIndex: "presentation_exchange_id",
      key: "presentation_exchange_id",
      width: 140,
      render: (id, record) => {
        const displayId = id || record.id;
        return (
          <Tooltip title={`Click to copy: ${displayId}`}>
            <span
              className="mono-badge"
              style={{ cursor: "pointer" }}
              onClick={() => {
                navigator.clipboard.writeText(displayId);
                message.success("Request ID copied");
              }}
            >
              {displayId}
            </span>
          </Tooltip>
        );
      },
    },
    {
      title: "Holder Connection",
      key: "holder",
      width: 210,
      render: (_, record) => {
        const holderName = record.holder_name || record.their_label || "Connected Holder";
        const did = record.holder_did || record.their_did;
        return (
          <div>
            <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{holderName}</div>
            {did && (
              <div className="mono-subtext" style={{ fontSize: 11, color: "var(--text-muted)" }}>
                {did.slice(0, 16)}...
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: "Request Title & Purpose",
      dataIndex: "name",
      key: "name",
      width: 230,
      render: (name, record) => (
        <div>
          <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>
            {name || "Credential Verification"}
          </div>
          {record.comment && (
            <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>
              {record.comment.length > 55 ? `${record.comment.slice(0, 55)}...` : record.comment}
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Requested Claims & Predicates",
      key: "claims",
      width: 250,
      render: (_, record) => {
        const attrsObj = record.presentation_request?.requested_attributes || {};
        const predsObj = record.presentation_request?.requested_predicates || {};
        const attrList = Object.values(attrsObj);
        const predList = Object.values(predsObj);

        return (
          <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", alignItems: "center" }}>
            {attrList.map((a, i) => (
              <Tag key={i} color="geekblue" style={{ fontSize: 11 }}>
                {a.label || a.name}
              </Tag>
            ))}
            {predList.map((pr, i) => (
              <Tag key={`pr-${i}`} color="purple" style={{ fontSize: 11 }}>
                {pr.label || `${pr.name} ${pr.p_type} ${pr.p_value}`}
              </Tag>
            ))}
            {attrList.length === 0 && predList.length === 0 && (
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Standard Claims</span>
            )}
          </div>
        );
      },
    },
    {
      title: "Status",
      key: "status",
      width: 170,
      render: (_, record) => renderStatusBadge(record),
    },
    {
      title: "Date",
      dataIndex: "created_at",
      key: "created_at",
      width: 120,
      render: (d) => (
        <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
          {d ? new Date(d).toLocaleDateString() : "—"}
        </span>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 210,
      align: "right",
      render: (_, record) => {
        const exId = record.presentation_exchange_id || record.id;
        const isReceived = record.state === "presentation_received";

        return (
          <Space size="small" style={{ whiteSpace: "nowrap" }}>
            {isReceived ? (
              <Button
                size="small"
                type="primary"
                icon={<CheckOutlined />}
                style={{ background: "#10B981", borderColor: "#10B981" }}
                onClick={() => handleApproveVerify(exId)}
              >
                Verify
              </Button>
            ) : null}

            <Button
              size="small"
              type={isReceived ? "default" : "primary"}
              icon={<EyeOutlined />}
              onClick={() => setSelectedRecordForDetails(record)}
            >
              View Details
            </Button>

            <Popconfirm
              title="Archive this verification record?"
              description="This will remove the record from your active list."
              onConfirm={() => handleDeletePresentation(exId)}
              okText="Yes"
              cancelText="No"
            >
              <Button size="small" type="text" danger icon={<DeleteOutlined />} title="Archive record" />
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  // Holder Connections Columns
  const connectionColumns = [
    {
      title: "Holder Name & Role",
      dataIndex: "their_label",
      key: "their_label",
      width: 240,
      render: (label, record) => (
        <div>
          <strong style={{ fontSize: 13.5, color: "var(--text-primary)" }}>
            {label || record.holderName || "Connected Holder"}
          </strong>
          {record.role && (
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
              Role: {record.role}
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Pairwise DID",
      dataIndex: "their_did",
      key: "their_did",
      width: 280,
      render: (d, record) => {
        const targetDid = d || record.holderDid;
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span className="mono-subtext" style={{ whiteSpace: "nowrap" }}>
              {targetDid ? `${targetDid.slice(0, 22)}...` : "—"}
            </span>
            {targetDid && (
              <Tooltip title="Copy DID">
                <Button
                  size="small"
                  type="text"
                  icon={<CopyOutlined style={{ fontSize: 11 }} />}
                  onClick={() => {
                    navigator.clipboard.writeText(targetDid);
                    message.success("Holder DID copied");
                  }}
                />
              </Tooltip>
            )}
          </div>
        );
      },
    },
    {
      title: "Connection Status",
      dataIndex: "state",
      key: "state",
      width: 150,
      render: (s) => (
        <Tag color={s === "active" || s === "completed" ? "green" : "gold"} style={{ whiteSpace: "nowrap" }}>
          {s === "active" || s === "completed" ? "Connected" : "Invitation Sent"}
        </Tag>
      ),
    },
    {
      title: "Connected Since",
      dataIndex: "created_at",
      key: "created_at",
      width: 140,
      render: (d) => (
        <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
          {d ? new Date(d).toLocaleDateString() : "Recent"}
        </span>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 160,
      align: "right",
      render: (_, record) => {
        const connId = record.connection_id || record.id;
        const isActive = record.state === "active" || record.state === "completed";
        return (
          <Button
            size="small"
            type="primary"
            icon={<SendOutlined />}
            disabled={!isActive}
            onClick={() => handleOpenCreateRequest(connId)}
            style={{ background: isActive ? "#1B365D" : undefined, borderColor: isActive ? "#1B365D" : undefined }}
          >
            Request Proof
          </Button>
        );
      },
    },
  ];

  // Verification History Columns
  const historyColumns = [
    {
      title: "Exchange ID",
      dataIndex: "presentation_exchange_id",
      key: "presentation_exchange_id",
      width: 140,
      render: (id) => <span className="mono-badge">{id}</span>,
    },
    {
      title: "Verification Request",
      dataIndex: "name",
      key: "name",
      width: 240,
      render: (name, record) => (
        <div>
          <div style={{ fontWeight: 600 }}>{name}</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
            Holder: {record.holder_name || record.their_label}
          </div>
        </div>
      ),
    },
    {
      title: "Outcome",
      key: "outcome",
      width: 140,
      render: (_, record) => {
        const isVerified = record.state === "verified" || record.verified === "true";
        return isVerified ? (
          <Tag color="success" icon={<CheckCircleOutlined />}>VERIFIED</Tag>
        ) : (
          <Tag color="error" icon={<CloseCircleOutlined />}>REJECTED</Tag>
        );
      },
    },
    {
      title: "Cryptographic Checks",
      key: "checks",
      width: 240,
      render: (_, record) => {
        const isVerified = record.state === "verified" || record.verified === "true";
        return isVerified ? (
          <span style={{ fontSize: 12, color: "#166534" }}>
            <CheckCircleOutlined style={{ marginRight: 4 }} /> Signature Valid • Non-Revoked
          </span>
        ) : (
          <span style={{ fontSize: 12, color: "#991B1B" }}>
            <CloseCircleOutlined style={{ marginRight: 4 }} /> {record.rejection_reason || "Declined by Holder"}
          </span>
        );
      },
    },
    {
      title: "Completion Date",
      dataIndex: "completed_at",
      key: "completed_at",
      width: 150,
      render: (d, record) => {
        const dateVal = d || record.updated_at || record.created_at;
        return (
          <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
            {dateVal ? new Date(dateVal).toLocaleString() : "—"}
          </span>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 140,
      align: "right",
      render: (_, record) => (
        <Button size="small" icon={<EyeOutlined />} onClick={() => setSelectedRecordForDetails(record)}>
          View Audit Details
        </Button>
      ),
    },
  ];

  const tabTitles = {
    dashboard: "Verifier Portal • Overview",
    "proof-requests": "Verifier Portal • Proof Requests",
    history: "Verifier Portal • Verification History",
    connections: "Verifier Portal • Holder Connections",
  };

  return (
    <DashboardLayout title={tabTitles[activeTab] || "Verifier Portal"} role="verifier" actions={didBadgeAction}>
      <div className="verifier-dashboard animate-in">
        {/* ========================================================= */}
        {/* TAB 1: OVERVIEW DASHBOARD                                 */}
        {/* ========================================================= */}
        {activeTab === "dashboard" && (
          <>
            {/* 4 Summary Stat Cards */}
            <div className="kpi-stats-row">
              <StatCard
                title="VERIFIED PROOFS"
                value={verifiedCount}
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
                value={requestsAwaitingHolder.length}
                label="Awaiting Holder Response"
                accent={{
                  color: "#2563EB",
                  bg: "#EFF6FF",
                  grad: "linear-gradient(135deg, #1B365D, #2563EB)",
                  icon: <ClockCircleOutlined />,
                }}
              />
              <StatCard
                title="TOTAL PRESENTATIONS"
                value={presentations.length}
                label="Submitted Proof Inquiries"
                accent={{
                  color: "#2563EB",
                  bg: "#EFF6FF",
                  grad: "linear-gradient(135deg, #1B365D, #2563EB)",
                  icon: <AuditOutlined />,
                }}
              />
              <StatCard
                title="CONNECTED HOLDERS"
                value={connections.length}
                label="Digital Wallet Connections"
                accent={{
                  color: "#2563EB",
                  bg: "#EFF6FF",
                  grad: "linear-gradient(135deg, #1B365D, #2563EB)",
                  icon: <TeamOutlined />,
                }}
              />
            </div>

            {/* Verifier Identity Bar & Quick Workflow Guide */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 20px",
                background: "var(--surface-1, #ffffff)",
                border: "1px solid var(--border-color, #e2e8f0)",
                borderRadius: 12,
                fontSize: 13,
                flexWrap: "wrap",
                gap: 12,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <SafetyCertificateOutlined style={{ color: "#2563EB", fontSize: 20 }} />
                <div>
                  <span style={{ fontSize: 11, textTransform: "uppercase", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.5px" }}>
                    Active Verifier Node (DID):
                  </span>{" "}
                  <code style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{currentVerifierDID}</code>
                </div>
              </div>
              <Space size="middle">
                <Button size="small" icon={<CopyOutlined />} onClick={handleCopyDID}>
                  Copy DID
                </Button>
                <Button
                  size="small"
                  icon={<QuestionCircleOutlined />}
                  onClick={() => setIsWorkflowModalOpen(true)}
                  style={{ color: "#2563EB", borderColor: "#DBEAFE", background: "#EFF6FF" }}
                >
                  How Verification Works
                </Button>
              </Space>
            </div>

            {/* VERIFICATION STATUS & PENDING WORK SECTION (Replaces Technical Cards) */}
            <div className="verification-status-section animate-in-d1">
              <div className="verification-status-header">
                <h3>
                  <AuditOutlined style={{ color: "#2563EB" }} /> Verification Status & Pending Attention
                </h3>
                <span style={{ fontSize: 12.5, color: "var(--text-secondary)" }}>
                  Current workload and verification pipeline state
                </span>
              </div>

              <div className="verification-status-grid">
                {/* 1. Presentations Awaiting Verification */}
                <div className={`status-mini-card ${presentationsAwaitingVerification.length > 0 ? "attention" : "muted"}`}>
                  <div className="status-mini-top">
                    <div>
                      <div className="status-mini-title">Awaiting Verification</div>
                      <div className="status-mini-count" style={{ color: presentationsAwaitingVerification.length > 0 ? "#2563EB" : undefined }}>
                        {presentationsAwaitingVerification.length}
                      </div>
                    </div>
                    <div className="status-mini-icon" style={{ background: "#EFF6FF", color: "#2563EB" }}>
                      <EyeOutlined />
                    </div>
                  </div>
                  <div className="status-mini-desc">
                    {presentationsAwaitingVerification.length > 0
                      ? "Presentations received from holders ready for cryptographic checks."
                      : "No presentations pending verification."}
                  </div>
                  {presentationsAwaitingVerification.length > 0 && (
                    <Button
                      size="small"
                      type="primary"
                      onClick={() => {
                        setStatusFilter("presentation_received");
                        navigate("/verifier-proof-requests");
                      }}
                      className="status-mini-action"
                    >
                      Review & Verify
                    </Button>
                  )}
                </div>

                {/* 2. Requests Awaiting Holder Response */}
                <div className="status-mini-card warning">
                  <div className="status-mini-top">
                    <div>
                      <div className="status-mini-title">Awaiting Holder Response</div>
                      <div className="status-mini-count">{requestsAwaitingHolder.length}</div>
                    </div>
                    <div className="status-mini-icon" style={{ background: "#FEF3C7", color: "#D97706" }}>
                      <ClockCircleOutlined />
                    </div>
                  </div>
                  <div className="status-mini-desc">
                    Dispatched proof inquiries awaiting holder presentation submission.
                  </div>
                  <Button
                    size="small"
                    type="link"
                    style={{ padding: 0, height: "auto" }}
                    onClick={() => {
                      setStatusFilter("awaiting_presentation");
                      navigate("/verifier-proof-requests");
                    }}
                  >
                    View Inquiries <ArrowRightOutlined />
                  </Button>
                </div>

                {/* 3. Recently Completed Verifications */}
                <div className="status-mini-card success">
                  <div className="status-mini-top">
                    <div>
                      <div className="status-mini-title">Successfully Verified</div>
                      <div className="status-mini-count">{completedPresentations.length}</div>
                    </div>
                    <div className="status-mini-icon" style={{ background: "#DCFCE7", color: "#16A34A" }}>
                      <CheckCircleOutlined />
                    </div>
                  </div>
                  <div className="status-mini-desc">
                    Credentials validated against issuer ledger anchors and non-revocation state.
                  </div>
                  <Button
                    size="small"
                    type="link"
                    style={{ padding: 0, height: "auto" }}
                    onClick={() => navigate("/verifier-history")}
                  >
                    View History <ArrowRightOutlined />
                  </Button>
                </div>

                {/* 4. Failed or Incomplete Inquiries */}
                <div className="status-mini-card muted">
                  <div className="status-mini-top">
                    <div>
                      <div className="status-mini-title">Rejected / Declined</div>
                      <div className="status-mini-count">{failedOrRejectedPresentations.length}</div>
                    </div>
                    <div className="status-mini-icon" style={{ background: "#F1F5F9", color: "#64748B" }}>
                      <CloseCircleOutlined />
                    </div>
                  </div>
                  <div className="status-mini-desc">
                    Inquiries rejected or declined by holder wallets.
                  </div>
                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    Audited in verification history
                  </span>
                </div>
              </div>
            </div>

            {/* Recent Verification Activity */}
            <div className="content-card animate-in-d2">
              <div className="issuance-subtab-toolbar" style={{ borderBottom: "none", paddingBottom: 0, marginBottom: 16 }}>
                <div>
                  <h2 className="issuance-subtab-title" style={{ fontSize: 17 }}>Recent Verification Activity</h2>
                  <p className="issuance-subtab-desc">
                    Latest credential presentations and dispatched verification inquiries
                  </p>
                </div>
                <Space>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => handleOpenCreateRequest()}
                    style={{ background: "#1B365D", borderColor: "#1B365D" }}
                  >
                    Dispatch Proof Request
                  </Button>
                  <Button type="link" onClick={() => navigate("/verifier-proof-requests")} style={{ fontWeight: 600, color: "#2563EB" }}>
                    View All Requests <ArrowRightOutlined />
                  </Button>
                </Space>
              </div>

              <Table
                dataSource={presentations.slice(0, 4)}
                columns={proofRequestColumns}
                rowKey={(r) => r.presentation_exchange_id || r.id}
                loading={loading}
                pagination={false}
                className="issuance-table"
                scroll={{ x: 1000 }}
              />
            </div>
          </>
        )}

        {/* ========================================================= */}
        {/* TAB 2: PROOF REQUESTS & AUDIT LOG                        */}
        {/* ========================================================= */}
        {activeTab === "proof-requests" && (
          <div className="content-card animate-in-d1">
            <div className="issuance-subtab-toolbar">
              <div>
                <h2 className="issuance-subtab-title">Proof Requests</h2>
                <p className="issuance-subtab-desc">
                  Dispatch proof inquiries, inspect incoming credential presentations, and validate cryptographic proofs.
                </p>
              </div>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => handleOpenCreateRequest()}
                style={{ background: "#1B365D", borderColor: "#1B365D" }}
              >
                Dispatch Proof Request
              </Button>
            </div>

            {/* Filter toolbar */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Button
                  size="small"
                  type={statusFilter === "all" ? "primary" : "default"}
                  onClick={() => setStatusFilter("all")}
                >
                  All ({presentations.length})
                </Button>
                <Button
                  size="small"
                  type={statusFilter === "presentation_received" ? "primary" : "default"}
                  onClick={() => setStatusFilter("presentation_received")}
                >
                  Presentation Received ({presentationsAwaitingVerification.length})
                </Button>
                <Button
                  size="small"
                  type={statusFilter === "awaiting_presentation" ? "primary" : "default"}
                  onClick={() => setStatusFilter("awaiting_presentation")}
                >
                  Awaiting Presentation ({requestsAwaitingHolder.length})
                </Button>
                <Button
                  size="small"
                  type={statusFilter === "verified" ? "primary" : "default"}
                  onClick={() => setStatusFilter("verified")}
                >
                  Verified ({completedPresentations.length})
                </Button>
                <Button
                  size="small"
                  type={statusFilter === "rejected" ? "primary" : "default"}
                  onClick={() => setStatusFilter("rejected")}
                >
                  Rejected ({failedOrRejectedPresentations.length})
                </Button>
              </div>

              <Input
                prefix={<SearchOutlined style={{ color: "var(--text-muted)" }} />}
                placeholder="Filter by ID, holder, or title..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                style={{ width: 260 }}
                allowClear
              />
            </div>

            <Table
              dataSource={filteredPresentations}
              columns={proofRequestColumns}
              rowKey={(r) => r.presentation_exchange_id || r.id}
              loading={loading}
              pagination={{ pageSize: 8, showTotal: (t) => `Total ${t} proof requests` }}
              className="issuance-table"
              scroll={{ x: 1000 }}
              locale={{
                emptyText: (
                  <Empty
                    description="No proof requests found matching filter"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  >
                    <Button type="primary" size="small" onClick={() => handleOpenCreateRequest()}>
                      Create Proof Request
                    </Button>
                  </Empty>
                ),
              }}
            />
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: VERIFICATION HISTORY                               */}
        {/* ========================================================= */}
        {activeTab === "history" && (
          <div className="content-card animate-in-d1">
            <div className="issuance-subtab-toolbar">
              <div>
                <h2 className="issuance-subtab-title">Verification History & Audit Log</h2>
                <p className="issuance-subtab-desc">
                  Searchable historical record of verified credentials, rejected presentations, and proof outcomes.
                </p>
              </div>
              <Tag color="cyan" icon={<AuditOutlined />}>
                Audit Trail Active • Development Mode
              </Tag>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
              <div style={{ display: "flex", gap: 8 }}>
                <Button
                  size="small"
                  type={historyFilter === "all" ? "primary" : "default"}
                  onClick={() => setHistoryFilter("all")}
                >
                  All History ({completedPresentations.length + failedOrRejectedPresentations.length})
                </Button>
                <Button
                  size="small"
                  type={historyFilter === "verified" ? "primary" : "default"}
                  onClick={() => setHistoryFilter("verified")}
                >
                  Verified ({completedPresentations.length})
                </Button>
                <Button
                  size="small"
                  type={historyFilter === "rejected" ? "primary" : "default"}
                  onClick={() => setHistoryFilter("rejected")}
                >
                  Rejected ({failedOrRejectedPresentations.length})
                </Button>
              </div>

              <Input
                prefix={<SearchOutlined style={{ color: "var(--text-muted)" }} />}
                placeholder="Search history by holder, title, ID..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                style={{ width: 280 }}
                allowClear
              />
            </div>

            <Table
              dataSource={filteredHistory}
              columns={historyColumns}
              rowKey={(r) => r.presentation_exchange_id || r.id}
              loading={loading}
              pagination={{ pageSize: 8, showTotal: (t) => `Total ${t} history records` }}
              className="issuance-table"
              scroll={{ x: 960 }}
              locale={{
                emptyText: <Empty description="No verification history records found" image={Empty.PRESENTED_IMAGE_SIMPLE} />,
              }}
            />
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: HOLDER CONNECTIONS                                 */}
        {/* ========================================================= */}
        {activeTab === "connections" && (
          <div className="content-card animate-in-d1">
            <div className="issuance-subtab-toolbar">
              <div>
                <h2 className="issuance-subtab-title">Holder Connections</h2>
                <p className="issuance-subtab-desc">
                  Pairwise encrypted DIDComm connection channels with digital identity holders.
                </p>
              </div>
              <Button
                type="primary"
                icon={<LinkOutlined />}
                onClick={() => setIsConnectionModalOpen(true)}
                style={{ background: "#1B365D", borderColor: "#1B365D" }}
              >
                Open Connection Manager
              </Button>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
              <Input
                prefix={<SearchOutlined style={{ color: "var(--text-muted)" }} />}
                placeholder="Search holder connections..."
                value={connectionSearch}
                onChange={(e) => setConnectionSearch(e.target.value)}
                style={{ width: 280 }}
                allowClear
              />
            </div>

            <Table
              dataSource={filteredConnections}
              columns={connectionColumns}
              rowKey={(r) => r.connection_id || r.id}
              loading={loading}
              pagination={false}
              className="issuance-table"
              scroll={{ x: 800 }}
              locale={{
                emptyText: <Empty description="No holder connections found" image={Empty.PRESENTED_IMAGE_SIMPLE} />,
              }}
            />
          </div>
        )}

        {/* ========================================================= */}
        {/* MODAL 1: CREATE / DISPATCH PROOF REQUEST                  */}
        {/* ========================================================= */}
        <Modal
          title={
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "#EFF6FF", color: "#2563EB", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ScanOutlined />
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>Dispatch Proof Request</div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 400 }}>
                  Configure required attributes, predicates, and recipient holder connection
                </div>
              </div>
            </div>
          }
          open={isRequestModalOpen}
          onCancel={() => setIsRequestModalOpen(false)}
          footer={null}
          width={680}
          destroyOnClose
        >
          <Form
            form={requestForm}
            layout="vertical"
            onFinish={handleCreateProofRequest}
            style={{ marginTop: 16 }}
          >
            {/* 1. Recipient Connection */}
            <Form.Item
              name="connectionId"
              label="Recipient Holder Connection"
              rules={[{ required: true, message: "Please select a holder connection" }]}
            >
              <Select placeholder="Select connected holder wallet">
                {connections.map((c) => (
                  <Option key={c.connection_id || c.id} value={c.connection_id || c.id}>
                    {c.their_label || "Connected Holder"} {c.role ? `(${c.role})` : ""} — {c.their_did ? `${c.their_did.slice(0, 16)}...` : ""}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            {/* 2. Predefined Policy Templates */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 13 }}>
                Credential Verification Template:
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {DEFAULT_CREDENTIAL_TEMPLATES.map((tmpl) => (
                  <div
                    key={tmpl.id}
                    onClick={() => handleTemplateSelect(tmpl.id)}
                    style={{
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: selectedTemplate === tmpl.id ? "2px solid #2563EB" : "1px solid var(--border-color, #e2e8f0)",
                      background: selectedTemplate === tmpl.id ? "#EFF6FF" : "var(--surface-2, #f8fafc)",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: 12.5, color: selectedTemplate === tmpl.id ? "#2563EB" : "var(--text-primary)" }}>
                      {tmpl.name}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                      {tmpl.attributes.length} attributes configured
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Title & Purpose */}
            <Form.Item
              name="requestName"
              label="Proof Inquiry Title"
              rules={[{ required: true, message: "Please enter inquiry title" }]}
            >
              <Input placeholder="e.g. Identity & Age Verification, Degree Background Check" />
            </Form.Item>

            <Form.Item name="comment" label="Verification Purpose / Note to Holder">
              <Input.TextArea
                rows={2}
                placeholder="Explain why this credential presentation is being requested..."
              />
            </Form.Item>

            {/* 4. Attribute Selection */}
            <div style={{ background: "var(--surface-2, #f8fafc)", border: "1px solid var(--border-color, #e2e8f0)", padding: 14, borderRadius: 10, marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <label style={{ fontWeight: 600, fontSize: 13, margin: 0 }}>
                  Requested Attributes to Reveal:
                </label>
                <Space size="small">
                  <Button
                    size="small"
                    type="link"
                    style={{ padding: 0 }}
                    onClick={() => {
                      const tmpl = DEFAULT_CREDENTIAL_TEMPLATES.find((t) => t.id === selectedTemplate);
                      setSelectedAttributes(tmpl?.attributes.map((a) => a.key) || []);
                    }}
                  >
                    Select All
                  </Button>
                </Space>
              </div>

              {(() => {
                const tmpl = DEFAULT_CREDENTIAL_TEMPLATES.find((t) => t.id === selectedTemplate);
                const options = tmpl?.attributes.map((a) => ({ label: a.label, value: a.key })) || [];
                return (
                  <Checkbox.Group
                    options={options}
                    value={selectedAttributes}
                    onChange={setSelectedAttributes}
                    style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}
                  />
                );
              })()}
            </div>

            {/* 5. Zero-Knowledge Predicates */}
            <div
              style={{
                background: predicateEnabled ? "#F0FDF4" : "var(--surface-2, #f8fafc)",
                border: predicateEnabled ? "1px solid #BBF7D0" : "1px solid var(--border-color, #e2e8f0)",
                borderRadius: 10,
                padding: 14,
                marginBottom: 16,
                transition: "all 0.2s ease",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <strong style={{ fontSize: 13, color: predicateEnabled ? "#166534" : "var(--text-primary)" }}>
                    Zero-Knowledge Predicate Rule
                  </strong>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                    Prove numerical criteria without leaking exact underlying value
                  </div>
                </div>
                <Switch checked={predicateEnabled} onChange={setPredicateEnabled} />
              </div>

              {predicateEnabled && (
                <div style={{ display: "flex", gap: 10, marginTop: 12, alignItems: "center" }}>
                  <Input
                    placeholder="Attribute"
                    value={predicateAttr}
                    onChange={(e) => setPredicateAttr(e.target.value)}
                    style={{ width: "40%" }}
                  />
                  <Select value={predicateOp} onChange={setPredicateOp} style={{ width: "25%" }}>
                    <Option value=">=">&gt;= (At least)</Option>
                    <Option value=">">&gt; (Greater than)</Option>
                    <Option value="<=">&lt;= (At most)</Option>
                    <Option value="<">&lt; (Less than)</Option>
                  </Select>
                  <Input
                    placeholder="Threshold"
                    value={predicateVal}
                    onChange={(e) => setPredicateVal(e.target.value)}
                    style={{ width: "35%" }}
                  />
                </div>
              )}
            </div>

            {/* 6. Issuer Restrictions (Optional) */}
            <div style={{ marginBottom: 16 }}>
              <Checkbox checked={hasRestrictions} onChange={(e) => setHasRestrictions(e.target.checked)}>
                <span style={{ fontSize: 12.5 }}>Restrict verification to specific Issuer DID (Optional)</span>
              </Checkbox>
              {hasRestrictions && (
                <div style={{ marginTop: 8 }}>
                  <Input
                    placeholder="e.g. did:sov:M6Mbe3qx7vBQAitT21A2K1"
                    value={restrictionIssuerDid}
                    onChange={(e) => setRestrictionIssuerDid(e.target.value)}
                  />
                </div>
              )}
            </div>

            {/* Simulated Banner */}
            <Alert
              type="info"
              showIcon
              message="Simulated Verifier Operation"
              description="Offline development mode: The proof request is handled via the mock service architecture without calling live network ledger nodes."
              style={{ marginBottom: 20 }}
            />

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <Button onClick={() => setIsRequestModalOpen(false)}>Cancel</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={submittingRequest}
                icon={<SendOutlined />}
                style={{ background: "#1B365D", borderColor: "#1B365D" }}
              >
                Dispatch Proof Request
              </Button>
            </div>
          </Form>
        </Modal>

        {/* ========================================================= */}
        {/* MODAL 2: VERIFICATION DETAILS & RESULTS                   */}
        {/* ========================================================= */}
        <Modal
          title={
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: "#EFF6FF", color: "#2563EB", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <FileProtectOutlined style={{ fontSize: 18 }} />
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>
                  {selectedRecordForDetails?.name || "Verification Record Details"}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 400 }}>
                  Exchange ID: <span className="mono-subtext">{selectedRecordForDetails?.presentation_exchange_id || selectedRecordForDetails?.id}</span>
                </div>
              </div>
            </div>
          }
          open={!!selectedRecordForDetails}
          onCancel={() => setSelectedRecordForDetails(null)}
          footer={[
            selectedRecordForDetails?.state === "presentation_received" && (
              <Button
                key="verify"
                type="primary"
                icon={<CheckOutlined />}
                style={{ background: "#10B981", borderColor: "#10B981" }}
                onClick={() => {
                  handleApproveVerify(selectedRecordForDetails.presentation_exchange_id || selectedRecordForDetails.id);
                }}
              >
                Verify Presentation
              </Button>
            ),
            selectedRecordForDetails?.state === "presentation_received" && (
              <Button
                key="reject"
                danger
                icon={<StopOutlined />}
                onClick={() => {
                  handleRejectPresentation(selectedRecordForDetails.presentation_exchange_id || selectedRecordForDetails.id);
                }}
              >
                Reject
              </Button>
            ),
            <Button key="close" onClick={() => setSelectedRecordForDetails(null)}>
              Close
            </Button>,
          ].filter(Boolean)}
          width={700}
        >
          {selectedRecordForDetails && (
            <div style={{ display: "flex", flexDirection: "column", gap: 18, marginTop: 12 }}>
              {/* Verification Progress Timeline */}
              <div style={{ background: "var(--surface-2, #f8fafc)", padding: "16px 20px", borderRadius: 10, border: "1px solid var(--border-color, #e2e8f0)" }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 12, letterSpacing: "0.5px" }}>
                  Verification Lifecycle Progress
                </div>
                {(() => {
                  const state = selectedRecordForDetails.state;
                  const isVerified = state === "verified" || selectedRecordForDetails.verified === "true";
                  const isReceived = state === "presentation_received";
                  const isRejected = state === "abandoned" || state === "rejected";

                  let currentStep;
                  let stepStatus;

                  if (isVerified) {
                    currentStep = 3;
                    stepStatus = "finish";
                  } else if (isRejected) {
                    currentStep = isReceived ? 2 : 1;
                    stepStatus = "error";
                  } else if (isReceived) {
                    currentStep = 1;
                    stepStatus = "process";
                  } else {
                    currentStep = 0;
                    stepStatus = "process";
                  }

                  return (
                    <Steps
                      size="small"
                      current={currentStep}
                      status={stepStatus}
                      items={[
                        { title: "Dispatched", description: "Request sent" },
                        { title: "Presented", description: isReceived || isVerified ? "Received" : "Pending" },
                        { title: "Validation", description: isVerified ? "Valid" : isRejected ? "Failed" : "Pending" },
                        { title: "Outcome", description: isVerified ? "Verified" : isRejected ? "Rejected" : "In Progress" },
                      ]}
                    />
                  );
                })()}
              </div>

              {/* Status Header Alert */}
              {selectedRecordForDetails.rejection_reason && (
                <Alert
                  type="error"
                  showIcon
                  message="Presentation Rejected"
                  description={`Reason: ${selectedRecordForDetails.rejection_reason}`}
                />
              )}

              {/* Summary Metadata */}
              <Descriptions bordered size="small" column={2} style={{ borderRadius: 8 }}>
                <Descriptions.Item label="Holder Connection" span={2}>
                  <strong>{selectedRecordForDetails.holder_name || selectedRecordForDetails.their_label || "Connected Holder"}</strong>
                  {selectedRecordForDetails.holder_did && (
                    <span className="mono-subtext" style={{ marginLeft: 8 }}>
                      ({selectedRecordForDetails.holder_did})
                    </span>
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="Current Status">
                  {renderStatusBadge(selectedRecordForDetails)}
                </Descriptions.Item>
                <Descriptions.Item label="Created Date">
                  {selectedRecordForDetails.created_at ? new Date(selectedRecordForDetails.created_at).toLocaleString() : "—"}
                </Descriptions.Item>
                {selectedRecordForDetails.completed_at && (
                  <Descriptions.Item label="Completed Date" span={2}>
                    {new Date(selectedRecordForDetails.completed_at).toLocaleString()}
                  </Descriptions.Item>
                )}
                {selectedRecordForDetails.comment && (
                  <Descriptions.Item label="Inquiry Purpose" span={2}>
                    {selectedRecordForDetails.comment}
                  </Descriptions.Item>
                )}
              </Descriptions>

              {/* Disclosed & Verified Claims */}
              <Card
                size="small"
                title={
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>Disclosed Credential Attributes</span>
                    <span style={{ fontSize: 11, fontWeight: 400, color: "var(--text-muted)" }}>
                      Selective disclosure verified
                    </span>
                  </div>
                }
              >
                {selectedRecordForDetails.presentation?.requested_proof?.revealed_attrs ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {Object.entries(selectedRecordForDetails.presentation.requested_proof.revealed_attrs).map(([key, val]) => (
                      <div
                        key={key}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "6px 8px",
                          borderBottom: "1px solid rgba(0,0,0,0.04)",
                        }}
                      >
                        <span style={{ fontWeight: 600, fontSize: 13 }}>
                          {val.label || key}
                        </span>
                        <Tag color="geekblue" style={{ fontSize: 12 }}>
                          {typeof val === "object" ? val.raw : String(val)}
                        </Tag>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: "12px 0", color: "var(--text-secondary)", fontSize: 13 }}>
                    <InfoCircleOutlined style={{ marginRight: 6, color: "#2563EB" }} />
                    {selectedRecordForDetails.state === "request_sent"
                      ? "Awaiting holder wallet submission. Requested attributes will appear here once presented."
                      : "No raw attributes disclosed."}
                  </div>
                )}
              </Card>

              {/* Predicate Proofs */}
              {selectedRecordForDetails.presentation?.requested_proof?.predicates &&
                Object.keys(selectedRecordForDetails.presentation.requested_proof.predicates).length > 0 && (
                  <Card size="small" title="Zero-Knowledge Predicates (Data Concealed)">
                    {Object.entries(selectedRecordForDetails.presentation.requested_proof.predicates).map(([key, pred]) => (
                      <div
                        key={key}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "6px 8px",
                        }}
                      >
                        <div>
                          <strong style={{ fontSize: 13 }}>{pred.label || key}</strong>
                          <div style={{ fontSize: 11.5, color: "var(--text-muted)" }}>
                            {pred.detail || "Cryptographically proven via zero-knowledge proof"}
                          </div>
                        </div>
                        <Tag color="green" icon={<CheckCircleOutlined />}>
                          SATISFIED (ZKP)
                        </Tag>
                      </div>
                    ))}
                  </Card>
                )}

              {/* Cryptographic Checks Breakdown */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)" }}>
                  Cryptographic Verification Checks
                </div>

                <div className={`check-result-box ${selectedRecordForDetails.presentation ? "pass" : "warn"}`}>
                  <CheckCircleOutlined style={{ marginTop: 2, fontSize: 16 }} />
                  <div>
                    <strong>Cryptographic Proof Signature:</strong>{" "}
                    {selectedRecordForDetails.presentation
                      ? "Valid CL-Signature authenticated against Issuer Public Key."
                      : "Pending presentation receipt from holder."}
                  </div>
                </div>

                <div className={`check-result-box ${selectedRecordForDetails.presentation ? "pass" : "warn"}`}>
                  <CheckCircleOutlined style={{ marginTop: 2, fontSize: 16 }} />
                  <div>
                    <strong>Schema & Credential Definition:</strong>{" "}
                    {selectedRecordForDetails.presentation
                      ? "Verified matches approved template schema on ledger anchor."
                      : "Pending schema binding verification."}
                  </div>
                </div>

                <div className={`check-result-box ${selectedRecordForDetails.presentation ? "pass" : "warn"}`}>
                  <CheckCircleOutlined style={{ marginTop: 2, fontSize: 16 }} />
                  <div>
                    <strong>Non-Revocation Accumulator Status:</strong>{" "}
                    {selectedRecordForDetails.presentation
                      ? "Active. Accumulator witness confirms credential has not been revoked."
                      : "Pending real-time revocation accumulator check."}
                  </div>
                </div>
              </div>

              {/* Advanced Technical Details Collapsible */}
              <Collapse
                ghost
                size="small"
                items={[
                  {
                    key: "advanced",
                    label: (
                      <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                        Advanced Technical & Ledger Identifiers
                      </span>
                    ),
                    children: (
                      <div style={{ background: "var(--surface-2, #f8fafc)", padding: 10, borderRadius: 6, fontSize: 11, fontFamily: "monospace", overflowX: "auto" }}>
                        <div>Schema ID: {selectedRecordForDetails.presentation?.identifiers?.[0]?.schema_id || "M6Mbe3qx7vBQAitT21A2K1:2:Credential:1.0"}</div>
                        <div>Cred Def ID: {selectedRecordForDetails.presentation?.identifiers?.[0]?.cred_def_id || "M6Mbe3qx7vBQAitT21A2K1:3:CL:12401:default"}</div>
                        <div>Rev Reg ID: {selectedRecordForDetails.presentation?.identifiers?.[0]?.rev_reg_id || "CL_ACCUM:Active"}</div>
                        <div style={{ marginTop: 6, color: "var(--text-muted)" }}>Exchange Record: {selectedRecordForDetails.presentation_exchange_id}</div>
                      </div>
                    ),
                  },
                ]}
              />
            </div>
          )}
        </Modal>

        {/* ========================================================= */}
        {/* MODAL 3: HOW VERIFICATION WORKS GUIDELINES                */}
        {/* ========================================================= */}
        <Modal
          title={
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <QuestionCircleOutlined style={{ color: "#2563EB" }} />
              <span>How SSI Verification Works</span>
            </div>
          }
          open={isWorkflowModalOpen}
          onCancel={() => setIsWorkflowModalOpen(false)}
          footer={[
            <Button key="close" type="primary" onClick={() => setIsWorkflowModalOpen(false)}>
              Got It
            </Button>,
          ]}
          width={640}
        >
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 8 }}>
            Self-Sovereign Identity enables verifiers to authenticate claims without seeing unnecessary personal data or contacting issuers in real time.
          </p>

          <div className="workflow-modal-steps">
            <div className="workflow-step-card">
              <div className="workflow-step-badge">1</div>
              <div className="workflow-step-body">
                <h4>Craft Policy & Select Claims</h4>
                <p>The verifier determines required attributes and optional zero-knowledge predicates (e.g. confirming age &ge; 18 without learning date of birth).</p>
              </div>
            </div>

            <div className="workflow-step-card">
              <div className="workflow-step-badge">2</div>
              <div className="workflow-step-body">
                <h4>Dispatch Request to Holder</h4>
                <p>An encrypted DIDComm presentation exchange inquiry is securely transmitted to the candidate's digital identity wallet.</p>
              </div>
            </div>

            <div className="workflow-step-card">
              <div className="workflow-step-badge">3</div>
              <div className="workflow-step-body">
                <h4>Receive Selective Disclosure</h4>
                <p>The holder wallet generates a zero-knowledge cryptographic proof containing only the permitted claims, concealing all other credential fields.</p>
              </div>
            </div>

            <div className="workflow-step-card">
              <div className="workflow-step-badge">4</div>
              <div className="workflow-step-body">
                <h4>Cryptographic & Ledger Validation</h4>
                <p>The verifier validates cryptographic signatures against the issuer's public key anchored on the ledger and checks real-time revocation status.</p>
              </div>
            </div>

            <div className="workflow-step-card">
              <div className="workflow-step-badge">5</div>
              <div className="workflow-step-body">
                <h4>Verification Decision & Audit Trail</h4>
                <p>Upon mathematical confirmation, access is granted and a local verification audit event is preserved without storing private personal data.</p>
              </div>
            </div>
          </div>
        </Modal>

        {/* ========================================================= */}
        {/* MODAL 4: CONNECTION MANAGER                               */}
        {/* ========================================================= */}
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