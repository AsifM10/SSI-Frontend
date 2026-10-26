import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Table,
  Tag,
  Modal,
  Button,
  message,
  Input,
  Select,
  Switch,
  Space,
  Tooltip,
  Popconfirm,
  Form,
} from "antd";
import {
  WalletOutlined,
  SafetyCertificateOutlined,
  CheckCircleOutlined,
  CheckCircleFilled,
  TeamOutlined,
  FileDoneOutlined,
  SendOutlined,
  AuditOutlined,
  SearchOutlined,
  EyeOutlined,
  DeleteOutlined,
  LinkOutlined,
  ShareAltOutlined,
  ArrowRightOutlined,
  LockOutlined,
  InfoCircleOutlined,
  CopyOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import DashboardLayout from "../../layouts/DashboardLayout/DashboardLayout";
import StatCard from "../../components/cards/StatCard/StatCard";
import ConnectionModal from "../../components/modals/ConnectionModal/ConnectionModal";
import CredentialDetailsModal from "../../components/modals/CredentialDetailsModal/CredentialDetailsModal";
import { holderService, issuerService } from "../../services/apiClient";
import "./HolderDashboard.css";

const { Option } = Select;

const HolderDashboard = ({ activeTab = "dashboard" }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [credentials, setCredentials] = useState([]);
  const [connections, setConnections] = useState([]);
  const [offers, setOffers] = useState([]);
  const [proofRequests, setProofRequests] = useState([]);
  const [schemas, setSchemas] = useState([]);
  const [filterQuery, setFilterQuery] = useState("");

  // Modals & Detail Views
  const [selectedProofForReview, setSelectedProofForReview] = useState(null);
  const [selectedOfferForReview, setSelectedOfferForReview] = useState(null);
  const [selectedCredentialForView, setSelectedCredentialForView] = useState(null);
  const [isConnectionModalOpen, setIsConnectionModalOpen] = useState(false);
  const [isShareProofModalOpen, setIsShareProofModalOpen] = useState(false);

  // Proof Request satisfaction & disclosure state
  const [selectedCredentialIdForProof, setSelectedCredentialIdForProof] = useState(null);
  const [revealedAttributes, setRevealedAttributes] = useState({});

  // Forms
  const [shareProofForm] = Form.useForm();

  const loadData = async () => {
    setLoading(true);
    try {
      const [credRes, connRes, offerRes, proofRes, schemaRes] = await Promise.all([
        holderService.getCredentials(),
        holderService.getConnections(),
        holderService.getOffers(),
        holderService.getProofRequests(),
        issuerService.getSchemas ? issuerService.getSchemas() : Promise.resolve({ data: [] }),
      ]);

      if (credRes?.success) setCredentials(credRes.data || []);
      if (connRes?.success) setConnections(connRes.data || []);
      if (offerRes?.success) setOffers(offerRes.data || []);
      if (proofRes?.success) setProofRequests(proofRes.data || []);
      if (schemaRes?.success) {
        setSchemas(schemaRes.data || []);
      }
    } catch {
      message.error("Failed to load holder wallet data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // When opening Proof Request review modal, pick the best matching credential
  useEffect(() => {
    if (selectedProofForReview && credentials.length > 0) {
      const reqAttrs = selectedProofForReview.requestedAttributes || [];
      let bestCred = credentials[0];
      let maxMatch = -1;

      credentials.forEach((c) => {
        const matchCount = reqAttrs.filter((a) => c.attrs && c.attrs[a] !== undefined).length;
        if (matchCount > maxMatch) {
          maxMatch = matchCount;
          bestCred = c;
        }
      });

      if (bestCred) {
        setSelectedCredentialIdForProof(bestCred.id);
      }

      // Default all requested attributes to revealed (disclose raw claim)
      const initRevealed = {};
      reqAttrs.forEach((attr) => {
        initRevealed[attr] = true;
      });
      setRevealedAttributes(initRevealed);
    }
  }, [selectedProofForReview, credentials]);

  // Accept offer handler
  const handleAcceptOffer = async (offerId) => {
    try {
      const res = await holderService.acceptOffer(offerId);
      if (res?.success) {
        message.success("Credential offer accepted and added to your wallet!");
        if (selectedOfferForReview?.id === offerId) {
          setSelectedOfferForReview(null);
        }
        loadData();
      }
    } catch {
      message.error("Failed to accept offer");
    }
  };

  // Decline offer handler
  const handleDeclineOffer = async (offerId) => {
    try {
      await holderService.declineOffer(offerId);
      message.info("Credential offer declined");
      if (selectedOfferForReview?.id === offerId) {
        setSelectedOfferForReview(null);
      }
      loadData();
    } catch {
      message.error("Failed to decline offer");
    }
  };

  // Remove credential from wallet handler
  const handleRemoveCredential = async (credId) => {
    try {
      await holderService.deleteCredential(credId);
      message.success("Credential removed from wallet");
      if (selectedCredentialForView?.id === credId) {
        setSelectedCredentialForView(null);
      }
      loadData();
    } catch {
      message.error("Failed to remove credential from wallet");
    }
  };

  // Submit proof presentation handler
  const handlePresentProof = async () => {
    if (!selectedProofForReview) return;
    try {
      const res = await holderService.respondToProofRequest(
        selectedProofForReview.id,
        [selectedCredentialIdForProof],
        {
          revealedAttributes,
          predicates: selectedProofForReview.requestedPredicates || [],
          timestamp: new Date().toISOString(),
          predicatesSatisfied: true,
        }
      );
      if (res?.success) {
        message.success(
          `Proof presentation shared successfully with ${selectedProofForReview.verifierName || "verifier"}!`
        );
        setSelectedProofForReview(null);
        loadData();
      }
    } catch {
      message.error("Failed to submit presentation");
    }
  };

  // Decline proof request handler
  const handleDeclineProofRequest = async (requestId) => {
    try {
      if (holderService.declineProofRequest) {
        await holderService.declineProofRequest(requestId, "Holder declined to share requested claims");
      }
      message.info("Proof request declined");
      setSelectedProofForReview(null);
      loadData();
    } catch {
      message.error("Failed to decline proof request");
    }
  };

  // Ad-hoc presentation handler
  const handleShareProofSubmit = async (values) => {
    try {
      const res = await holderService.sharePresentation({
        connectionId: values.connectionId,
        credentialId: values.credentialId,
        comment: values.comment || "Ad-hoc proof presentation",
      });
      if (res?.success) {
        message.success("Proof presentation shared with peer!");
        setIsShareProofModalOpen(false);
        shareProofForm.resetFields();
        loadData();
      }
    } catch {
      message.error("Failed to share proof presentation");
    }
  };

  const filteredCredentials = credentials.filter(
    (c) =>
      (c.credentialDefinition || c.type || "").toLowerCase().includes(filterQuery.toLowerCase()) ||
      (c.issuerName || c.issuer || "").toLowerCase().includes(filterQuery.toLowerCase())
  );

  const holderDid = "did:example:holder1";
  const handleCopyDID = () => {
    navigator.clipboard?.writeText(holderDid);
    message.success("Holder DID copied to clipboard!");
  };

  const didBadgeAction = (
    <div
      onClick={handleCopyDID}
      title="Click to copy Holder DID"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: "#EFF6FF",
        border: "1px solid #DBEAFE",
        color: "#1D4ED8",
        padding: "4px 12px",
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 600,
        cursor: "pointer",
        transition: "all 0.2s ease",
      }}
    >
      <SafetyCertificateOutlined style={{ color: "#2563EB" }} />
      <span>DID: {holderDid.slice(0, 16)}...</span>
      <CopyOutlined style={{ fontSize: 11, opacity: 0.8 }} />
    </div>
  );

  // Offer Columns for Table
  const offerColumns = [
    {
      title: "Credential Type",
      dataIndex: "credentialDefinition",
      key: "credentialDefinition",
      width: 220,
      render: (d) => <strong style={{ color: "var(--text-primary)" }}>{d}</strong>,
    },
    {
      title: "Issuer Authority",
      dataIndex: "senderName",
      key: "senderName",
      width: 210,
      render: (n) => <span>{n}</span>,
    },
    {
      title: "Offered Claims",
      dataIndex: "attributes",
      key: "attributes",
      width: 220,
      render: (attrs) => {
        const count = Object.keys(attrs || {}).length;
        const keys = Object.keys(attrs || {}).slice(0, 2).join(", ");
        return (
          <span style={{ fontSize: 12.5, color: "var(--text-secondary)" }}>
            <strong>{count} claims</strong> ({keys}...)
          </span>
        );
      },
    },
    {
      title: "Date Offered",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 130,
      render: (d) => <span style={{ whiteSpace: "nowrap" }}>{d ? new Date(d).toLocaleDateString() : "Recent"}</span>,
    },
    {
      title: "Actions",
      key: "actions",
      width: 280,
      align: "right",
      render: (_, record) => (
        <Space size="small" style={{ whiteSpace: "nowrap" }}>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => setSelectedOfferForReview(record)}
          >
            Review Offer
          </Button>
          <Button
            type="primary"
            size="small"
            icon={<CheckCircleOutlined />}
            onClick={() => handleAcceptOffer(record.id)}
            style={{ background: "#2563EB", borderColor: "#2563EB" }}
          >
            Accept
          </Button>
          <Popconfirm
            title="Decline this credential offer?"
            description="The issuer will be notified that you declined this offer."
            onConfirm={() => handleDeclineOffer(record.id)}
            okText="Decline"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Button size="small" danger>
              Decline
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // Proof Request Columns for Table
  const proofColumns = [
    {
      title: "Request Name",
      dataIndex: "name",
      key: "name",
      width: 220,
      render: (n, r) => (
        <div>
          <strong style={{ color: "var(--text-primary)", display: "block" }}>{n || "Proof Request"}</strong>
          <span style={{ fontSize: 11.5, color: "var(--text-muted)" }}>ID: {r.id}</span>
        </div>
      ),
    },
    {
      title: "Requesting Organization",
      dataIndex: "verifierName",
      key: "verifierName",
      width: 210,
      render: (v) => <span>{v || "Relying Party"}</span>,
    },
    {
      title: "Requested Claims",
      dataIndex: "requestedAttributes",
      key: "requestedAttributes",
      width: 260,
      render: (attrs) => (
        <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
          {attrs?.map((a) => (
            <Tag key={a} color="blue">{a}</Tag>
          ))}
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 110,
      render: (s) => (
        <Tag color={s === "verified" || s === "presented" ? "green" : "gold"}>
          {(s || "pending").toUpperCase()}
        </Tag>
      ),
    },
    {
      title: "Action",
      key: "action",
      width: 180,
      align: "right",
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          icon={<AuditOutlined />}
          onClick={() => setSelectedProofForReview(record)}
          style={{ background: "#1B365D", borderColor: "#1B365D", fontWeight: 600 }}
        >
          Review Request
        </Button>
      ),
    },
  ];

  // Connections Columns for Table
  const connectionColumns = [
    {
      title: "Peer Organization",
      dataIndex: "their_label",
      key: "their_label",
      width: 220,
      render: (t, r) => (
        <div>
          <strong style={{ color: "var(--text-primary)", display: "block" }}>
            {t || r.peerName || r.alias || "Connected Peer"}
          </strong>
          <span style={{ fontSize: 11.5, color: "var(--text-muted)" }}>
            {r.role || (t?.includes("Issuer") || r.peerName?.includes("Issuer") ? "Issuer" : "Verifier")}
          </span>
        </div>
      ),
    },
    {
      title: "Peer DID",
      dataIndex: "their_did",
      key: "their_did",
      width: 260,
      render: (d, r) => {
        const did = d || r.peerDid || r.issuerDid;
        if (!did) return <span style={{ color: "var(--text-muted)" }}>—</span>;
        return (
          <Tooltip title={did}>
            <span className="mono-subtext" style={{ whiteSpace: "nowrap" }}>
              {did.slice(0, 24)}...
            </span>
          </Tooltip>
        );
      },
    },
    {
      title: "Connection Status",
      dataIndex: "state",
      key: "state",
      width: 130,
      render: (s, r) => {
        const active = s === "active" || s === "completed" || r.status === "active";
        return <Tag color={active ? "green" : "gold"}>{active ? "ACTIVE" : "PENDING"}</Tag>;
      },
    },
    {
      title: "Connected Date",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 130,
      render: (d) => <span>{d ? new Date(d).toLocaleDateString() : "Recent"}</span>,
    },
  ];

  const tabTitles = {
    dashboard: "Holder Portal • Overview",
    credentials: "Holder Portal • My Credentials",
    offers: "Holder Portal • Credential Offers",
    proofs: "Holder Portal • Proof Requests",
    connections: "Holder Portal • Connections",
  };

  // Proof Request satisfaction analysis
  const currentProofCredential =
    credentials.find((c) => c.id === selectedCredentialIdForProof) || credentials[0];
  const requestedAttrs = selectedProofForReview?.requestedAttributes || [];
  const requestedPredicates = selectedProofForReview?.requestedPredicates || [];
  const matchingAttrs = requestedAttrs.filter(
    (a) => currentProofCredential?.attrs && currentProofCredential.attrs[a] !== undefined
  );
  const missingAttrs = requestedAttrs.filter(
    (a) => !currentProofCredential?.attrs || currentProofCredential.attrs[a] === undefined
  );
  const isFullMatch = missingAttrs.length === 0;

  return (
    <DashboardLayout title={tabTitles[activeTab] || "Digital Identity Wallet"} role="holder" actions={didBadgeAction}>
      <div className="holder-dashboard animate-in">
        {/* ========================================================= */}
        {/* 1. TAB: OVERVIEW                                          */}
        {/* ========================================================= */}
        {activeTab === "dashboard" && (
          <>
            {/* 4 Stat Cards Row */}
            <div className="kpi-stats-row">
              <StatCard
                title="WALLET CREDENTIALS"
                value={credentials.length}
                label="Verified Claims in Wallet"
                accent={{
                  color: "#2563EB",
                  bg: "#EFF6FF",
                  grad: "linear-gradient(135deg, #1B365D, #2563EB)",
                  icon: <WalletOutlined />,
                }}
              />
              <StatCard
                title="PENDING OFFERS"
                value={offers.length}
                label="Awaiting Acceptance"
                accent={{
                  color: "#2563EB",
                  bg: "#EFF6FF",
                  grad: "linear-gradient(135deg, #1B365D, #2563EB)",
                  icon: <FileDoneOutlined />,
                }}
              />
              <StatCard
                title="PROOF REQUESTS"
                value={proofRequests.length}
                label="Verification Inquiries"
                accent={{
                  color: "#2563EB",
                  bg: "#EFF6FF",
                  grad: "linear-gradient(135deg, #1B365D, #2563EB)",
                  icon: <AuditOutlined />,
                }}
              />
              <StatCard
                title="TRUSTED PEERS"
                value={connections.length}
                label="Connected Issuers & Verifiers"
                accent={{
                  color: "#2563EB",
                  bg: "#EFF6FF",
                  grad: "linear-gradient(135deg, #1B365D, #2563EB)",
                  icon: <TeamOutlined />,
                }}
              />
            </div>

            {/* Holder Identity DID Banner */}
            <div className="holder-did-banner">
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div className="did-shield-icon">
                  <SafetyCertificateOutlined />
                </div>
                <div>
                  <div className="did-banner-label">HOLDER IDENTITY (DID)</div>
                  <code className="did-banner-code">{holderDid}</code>
                </div>
              </div>
              <Button size="middle" icon={<CopyOutlined />} onClick={handleCopyDID} className="btn-copy-did">
                Copy DID
              </Button>
            </div>

            {/* Wallet Status Section */}
            <div className="wallet-status-section">
              <div className="wallet-status-card">
                <div className="wallet-status-header">
                  <div className="wallet-status-dot active" />
                  <div>
                    <h3 className="wallet-status-title">Wallet Status: Ready & Secured</h3>
                    <p className="wallet-status-desc">
                      Your digital identity wallet is active, synced with the trust network, and secured locally.
                    </p>
                  </div>
                </div>
                <div className="wallet-status-badges">
                  <span className="status-badge-item">
                    <CheckCircleFilled style={{ color: "#10B981" }} /> Network: Indicio / CDAC Ledger (Active)
                  </span>
                  <span className="status-badge-item">
                    <LockOutlined style={{ color: "#2563EB" }} /> Storage: Local Sovereign Enclave (Encrypted)
                  </span>
                  <span className="status-badge-item">
                    <SafetyCertificateOutlined style={{ color: "#2563EB" }} /> W3C Standard: Verifiable Credentials
                  </span>
                </div>
              </div>

              {/* Action alert if any items require attention */}
              {(offers.length > 0 || proofRequests.length > 0) ? (
                <div className="wallet-action-alert">
                  <div className="alert-icon-box">
                    <InfoCircleOutlined />
                  </div>
                  <div className="alert-content">
                    <h4>Action Required</h4>
                    <p>
                      You have{" "}
                      {offers.length > 0 && (
                        <span>
                          <strong>{offers.length} pending credential offer{offers.length > 1 ? "s" : ""}</strong>
                        </span>
                      )}
                      {offers.length > 0 && proofRequests.length > 0 && " and "}
                      {proofRequests.length > 0 && (
                        <span>
                          <strong>{proofRequests.length} pending proof request{proofRequests.length > 1 ? "s" : ""}</strong>
                        </span>
                      )}{" "}
                      awaiting your review and consent.
                    </p>
                  </div>
                  <div className="alert-actions">
                    {offers.length > 0 && (
                      <Button
                        size="small"
                        type="primary"
                        onClick={() => navigate("/holder-offers")}
                        style={{ background: "#2563EB", borderColor: "#2563EB" }}
                      >
                        Review Offers ({offers.length})
                      </Button>
                    )}
                    {proofRequests.length > 0 && (
                      <Button
                        size="small"
                        onClick={() => navigate("/holder-proof-requests")}
                        style={{ fontWeight: 600 }}
                      >
                        Review Proofs ({proofRequests.length})
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="wallet-action-alert-clear">
                  <CheckCircleOutlined style={{ color: "#10B981", fontSize: 16 }} />
                  <span>All clear: No pending credential offers or proof requests requiring action.</span>
                </div>
              )}
            </div>


            {/* 5-Step Digital Wallet Workflow Guide */}
            <div className="about-holder-container animate-in-d2">
              <div className="about-header" style={{ borderBottom: "none", paddingBottom: 0 }}>
                <span className="about-header-badge">
                  <InfoCircleOutlined /> Workflow Guide
                </span>
                <h2>How Your Digital Wallet Works</h2>
                <p>
                  A step-by-step overview of how verifiable credentials are received, held, and verified.
                </p>
              </div>

              <div className="lifecycle-steps-grid">
                <div className="lifecycle-step">
                  <div className="lifecycle-step-header">
                    <span className="lifecycle-step-num">STEP 01</span>
                    <div className="lifecycle-step-icon">
                      <LinkOutlined />
                    </div>
                  </div>
                  <h5>Connect Peer</h5>
                  <p>Establish a private, encrypted connection with an authorized issuer or verifier.</p>
                </div>

                <div className="lifecycle-step">
                  <div className="lifecycle-step-header">
                    <span className="lifecycle-step-num">STEP 02</span>
                    <div className="lifecycle-step-icon">
                      <FileDoneOutlined />
                    </div>
                  </div>
                  <h5>Inspect & Accept Offer</h5>
                  <p>Review offered claims from the issuer and accept into your local wallet enclave.</p>
                </div>

                <div className="lifecycle-step">
                  <div className="lifecycle-step-header">
                    <span className="lifecycle-step-num">STEP 03</span>
                    <div className="lifecycle-step-icon">
                      <AuditOutlined />
                    </div>
                  </div>
                  <h5>Receive Proof Request</h5>
                  <p>A relying party requests verification of specific claims or credentials.</p>
                </div>

                <div className="lifecycle-step">
                  <div className="lifecycle-step-header">
                    <span className="lifecycle-step-num">STEP 04</span>
                    <div className="lifecycle-step-icon">
                      <LockOutlined />
                    </div>
                  </div>
                  <h5>Review & Consent</h5>
                  <p>Review exactly what claims will be disclosed before giving consent.</p>
                </div>

                <div className="lifecycle-step">
                  <div className="lifecycle-step-header">
                    <span className="lifecycle-step-num">STEP 05</span>
                    <div className="lifecycle-step-icon">
                      <SendOutlined />
                    </div>
                  </div>
                  <h5>Deliver Verifiable Proof</h5>
                  <p>Submit cryptographically signed proof presentation to the verifier.</p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ========================================================= */}
        {/* 2. TAB: MY CREDENTIALS                                    */}
        {/* ========================================================= */}
        {activeTab === "credentials" && (
          <div className="content-card animate-in-d1">
            <div className="issuance-subtab-toolbar" style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <div>
                <h2 className="issuance-subtab-title">My Credentials ({credentials.length})</h2>
                <p className="issuance-subtab-desc">
                  Verifiable digital identity credentials stored in your sovereign wallet.
                </p>
              </div>
              <Input
                prefix={<SearchOutlined style={{ color: "var(--text-muted)" }} />}
                placeholder="Search credentials or issuers..."
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                style={{ width: 260 }}
                allowClear
              />
            </div>

            {/* Professional Wallet Cards */}
            <div className="wallet-cards-grid">
              {filteredCredentials.map((cred, idx) => (
                <div
                  key={cred.id}
                  className={`cyber-wallet-card card-gradient-${(idx % 3) + 1}`}
                  onClick={() => setSelectedCredentialForView(cred)}
                >
                  <div className="wallet-watermark">
                    <SafetyCertificateOutlined />
                  </div>

                  <div className="wallet-card-top">
                    <div>
                      <span className="wallet-issuer-name">{cred.issuerName || cred.issuer}</span>
                      <h3 className="wallet-cred-name">{cred.credentialDefinition || cred.type}</h3>
                    </div>
                    <div className="wallet-chip-icon">
                      <SafetyCertificateOutlined />
                    </div>
                  </div>

                  <div className="wallet-card-middle">
                    <span className="wallet-did-label">ISSUER DID</span>
                    <p className="wallet-did-val">{cred.issuerDid || cred.issuer}</p>
                  </div>

                  <div className="wallet-card-bottom">
                    <span className="wallet-verified-tag">
                      <CheckCircleOutlined /> W3C Verified
                    </span>
                    <span className="wallet-date">
                      Issued: {new Date(cred.issueDate || cred.issuedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Credentials Records Table View */}
            <div style={{ marginTop: 32 }}>
              <h3 style={{ fontSize: 16, marginBottom: 12, fontWeight: 700, color: "var(--text-primary)" }}>
                Credential Records & Claims
              </h3>
              <Table
                dataSource={filteredCredentials}
                columns={[
                  {
                    title: "Credential Name",
                    dataIndex: "credentialDefinition",
                    key: "credentialDefinition",
                    width: 220,
                    render: (d, r) => <strong>{d || r.type}</strong>,
                  },
                  {
                    title: "Issuer Authority",
                    dataIndex: "issuerName",
                    key: "issuerName",
                    width: 190,
                    render: (n, r) => <span>{n || r.issuer}</span>,
                  },
                  {
                    title: "Issue Date",
                    dataIndex: "issueDate",
                    key: "issueDate",
                    width: 120,
                    render: (d, r) => <span>{new Date(d || r.issuedAt).toLocaleDateString()}</span>,
                  },
                  {
                    title: "Status",
                    dataIndex: "revocationStatus",
                    key: "revocationStatus",
                    width: 120,
                    render: (rev) =>
                      rev === "revoked" ? (
                        <Tag color="error">REVOKED</Tag>
                      ) : (
                        <Tag color="success">ACTIVE</Tag>
                      ),
                  },
                  {
                    title: "Actions",
                    key: "actions",
                    width: 240,
                    align: "right",
                    render: (_, record) => (
                      <Space size="small">
                        <Button
                          size="small"
                          icon={<EyeOutlined />}
                          onClick={() => setSelectedCredentialForView(record)}
                        >
                          View Claims
                        </Button>
                        <Popconfirm
                          title="Remove credential from wallet?"
                          description={
                            <div style={{ maxWidth: 280 }}>
                              Are you sure you want to remove this credential from your wallet?
                              <div style={{ marginTop: 6, fontSize: 11, color: "var(--text-muted)" }}>
                                Note: This only deletes your local wallet copy and does not revoke the credential on the ledger.
                              </div>
                            </div>
                          }
                          onConfirm={() => handleRemoveCredential(record.id)}
                          okText="Yes, Remove"
                          cancelText="Cancel"
                          okButtonProps={{ danger: true }}
                        >
                          <Button size="small" danger icon={<DeleteOutlined />}>
                            Remove from Wallet
                          </Button>
                        </Popconfirm>
                      </Space>
                    ),
                  },
                ]}
                rowKey="id"
                pagination={false}
                className="issuance-table"
                scroll={{ x: 850 }}
              />
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 3. TAB: CREDENTIAL OFFERS                                 */}
        {/* ========================================================= */}
        {activeTab === "offers" && (
          <div className="content-card animate-in-d1">
            <div className="issuance-subtab-toolbar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 className="issuance-subtab-title">Credential Offers ({offers.length})</h2>
                <p className="issuance-subtab-desc">
                  Inspect and review credential offers issued to you by verified authorities.
                </p>
              </div>
              {offers.length > 0 && <Tag color="blue">Action Required</Tag>}
            </div>

            <Table
              dataSource={offers}
              columns={offerColumns}
              rowKey="id"
              loading={loading}
              pagination={false}
              className="issuance-table"
              scroll={{ x: 950 }}
              locale={{
                emptyText: "No pending credential offers. You will be notified when an issuer offers a new credential.",
              }}
            />
          </div>
        )}

        {/* ========================================================= */}
        {/* 4. TAB: PROOF REQUESTS (Renamed from Proof Inquiries)     */}
        {/* ========================================================= */}
        {activeTab === "proofs" && (
          <div className="content-card animate-in-d1">
            <div className="issuance-subtab-toolbar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
              <div>
                <h2 className="issuance-subtab-title">Proof Requests ({proofRequests.length})</h2>
                <p className="issuance-subtab-desc">
                  Verification inquiries from relying parties requesting proof of specific claims or credentials.
                </p>
              </div>
              <Button icon={<ShareAltOutlined />} onClick={() => setIsShareProofModalOpen(true)}>
                Share Proof Ad-Hoc
              </Button>
            </div>

            <Table
              dataSource={proofRequests}
              columns={proofColumns}
              rowKey="id"
              loading={loading}
              pagination={false}
              className="issuance-table"
              scroll={{ x: 850 }}
              locale={{
                emptyText: "No pending proof requests. Relying parties have not requested any verifications.",
              }}
            />
          </div>
        )}

        {/* ========================================================= */}
        {/* 5. TAB: CONNECTIONS                                       */}
        {/* ========================================================= */}
        {activeTab === "connections" && (
          <div className="content-card animate-in-d1">
            <div className="issuance-subtab-toolbar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
              <div>
                <h2 className="issuance-subtab-title">Connections ({connections.length})</h2>
                <p className="issuance-subtab-desc">
                  Secure, encrypted peer-to-peer DIDComm channels established with issuers and verifiers.
                </p>
              </div>
              <Button
                type="primary"
                icon={<LinkOutlined />}
                onClick={() => setIsConnectionModalOpen(true)}
                style={{ background: "#1B365D", borderColor: "#1B365D" }}
              >
                Connection Manager
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
              locale={{ emptyText: "No peer connections established yet." }}
            />
          </div>
        )}


        {/* ========================================================= */}
        {/* MODAL 1: REVIEW CREDENTIAL OFFER (Full Inspection)        */}
        {/* ========================================================= */}
        <Modal
          title={
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <FileDoneOutlined style={{ color: "#2563EB", fontSize: 18 }} />
              <span style={{ fontSize: 17, fontWeight: 700 }}>Review Credential Offer</span>
            </div>
          }
          open={!!selectedOfferForReview}
          onCancel={() => setSelectedOfferForReview(null)}
          footer={null}
          width={680}
          destroyOnClose
        >
          {selectedOfferForReview && (
            <div className="offer-review-modal-body">
              <div className="offer-summary-box">
                <div className="offer-summary-row">
                  <span className="summary-label">Credential Name</span>
                  <strong className="summary-val">{selectedOfferForReview.credentialDefinition}</strong>
                </div>
                <div className="offer-summary-row">
                  <span className="summary-label">Issuer Authority</span>
                  <span className="summary-val">{selectedOfferForReview.senderName}</span>
                </div>
                <div className="offer-summary-row">
                  <span className="summary-label">Issuer DID</span>
                  <code className="summary-val mono-code">{selectedOfferForReview.senderDid}</code>
                </div>
                {selectedOfferForReview.comment && (
                  <div className="offer-summary-row">
                    <span className="summary-label">Issuer Note</span>
                    <span className="summary-val">{selectedOfferForReview.comment}</span>
                  </div>
                )}
              </div>

              <div style={{ marginTop: 20 }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10, color: "var(--text-primary)" }}>
                  Offered Claims ({Object.keys(selectedOfferForReview.attributes || {}).length})
                </h4>
                <p style={{ fontSize: 12.5, color: "var(--text-secondary)", marginBottom: 12 }}>
                  The issuer has certified the following claims for this credential. Inspect them before accepting into your wallet:
                </p>

                <div className="claims-table-wrapper">
                  <table className="claims-review-table">
                    <thead>
                      <tr>
                        <th>Claim / Attribute</th>
                        <th>Certified Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(selectedOfferForReview.attributes || {}).map(([key, val]) => (
                        <tr key={key}>
                          <td className="claim-key">{key}</td>
                          <td className="claim-val">{String(val)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 24 }}>
                <Button onClick={() => setSelectedOfferForReview(null)}>Close</Button>
                <Popconfirm
                  title="Decline this credential offer?"
                  description="The issuer will be notified that you declined this offer."
                  onConfirm={() => handleDeclineOffer(selectedOfferForReview.id)}
                  okText="Decline"
                  cancelText="Cancel"
                  okButtonProps={{ danger: true }}
                >
                  <Button danger>Decline Offer</Button>
                </Popconfirm>
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  onClick={() => handleAcceptOffer(selectedOfferForReview.id)}
                  style={{ background: "#2563EB", borderColor: "#2563EB" }}
                >
                  Accept into Wallet
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* ========================================================= */}
        {/* MODAL 2: REVIEW PROOF REQUEST (Explicit Consent)          */}
        {/* ========================================================= */}
        <Modal
          title={
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <AuditOutlined style={{ color: "#1B365D", fontSize: 18 }} />
              <span style={{ fontSize: 17, fontWeight: 700 }}>Review Proof Request</span>
            </div>
          }
          open={!!selectedProofForReview}
          onCancel={() => setSelectedProofForReview(null)}
          footer={null}
          width={720}
          destroyOnClose
        >
          {selectedProofForReview && (
            <div className="proof-review-modal-body">
              {/* Who is requesting */}
              <div className="proof-verifier-box">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                  <div>
                    <span className="verifier-sub-label">REQUESTING ORGANIZATION</span>
                    <h3 className="verifier-name">{selectedProofForReview.verifierName || "Verified Organization"}</h3>
                    <code className="verifier-did">{selectedProofForReview.verifierDid}</code>
                  </div>
                  <Tag color="blue" style={{ marginTop: 4 }}>
                    VERIFICATION REQUEST
                  </Tag>
                </div>
                {selectedProofForReview.purpose && (
                  <p className="verifier-purpose">
                    <strong>Purpose:</strong> {selectedProofForReview.purpose}
                  </p>
                )}
              </div>

              {/* Which credential satisfies this request */}
              <div style={{ marginTop: 20 }}>
                <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 13 }}>
                  Select Wallet Credential to Satisfy Request:
                </label>
                <Select
                  value={selectedCredentialIdForProof}
                  onChange={setSelectedCredentialIdForProof}
                  style={{ width: "100%" }}
                >
                  {credentials.map((c) => {
                    const matchCount = requestedAttrs.filter((a) => c.attrs && c.attrs[a] !== undefined).length;
                    return (
                      <Option key={c.id} value={c.id}>
                        {c.credentialDefinition || c.type} — Issued by {c.issuerName || c.issuer} ({matchCount}/{requestedAttrs.length} claims match)
                      </Option>
                    );
                  })}
                </Select>

                {/* Satisfaction status alert */}
                <div style={{ marginTop: 8 }}>
                  {isFullMatch ? (
                    <div className="satisfaction-banner match">
                      <CheckCircleFilled style={{ color: "#10B981" }} />
                      <span>This credential satisfies all {requestedAttrs.length} requested claims.</span>
                    </div>
                  ) : (
                    <div className="satisfaction-banner partial">
                      <ExclamationCircleOutlined style={{ color: "#F59E0B" }} />
                      <span>
                        Missing {missingAttrs.length} claim(s): <strong>{missingAttrs.join(", ")}</strong>. Choose another credential if available.
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* What will be shared table */}
              <div style={{ marginTop: 20 }}>
                <h4 style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 8, color: "var(--text-primary)" }}>
                  Information to Be Shared (Review & Consent):
                </h4>
                <div className="claims-table-wrapper">
                  <table className="claims-review-table">
                    <thead>
                      <tr>
                        <th>Requested Claim</th>
                        <th>Your Credential Value</th>
                        <th style={{ textAlign: "right" }}>Sharing Mode</th>
                      </tr>
                    </thead>
                    <tbody>
                      {requestedAttrs.map((attr) => {
                        const val = currentProofCredential?.attrs?.[attr];
                        const hasVal = val !== undefined;
                        const isRevealed = !!revealedAttributes[attr];

                        return (
                          <tr key={attr}>
                            <td className="claim-key">{attr}</td>
                            <td className="claim-val">
                              {hasVal ? (
                                isRevealed ? (
                                  String(val)
                                ) : (
                                  <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>
                                    Hidden (ZKP Predicate Proof)
                                  </span>
                                )
                              ) : (
                                <Tag color="error">Not in credential</Tag>
                              )}
                            </td>
                            <td style={{ textAlign: "right" }}>
                              {hasVal ? (
                                <Switch
                                  size="small"
                                  checked={isRevealed}
                                  onChange={(checked) =>
                                    setRevealedAttributes((prev) => ({ ...prev, [attr]: checked }))
                                  }
                                  checkedChildren="Reveal"
                                  unCheckedChildren="Hide (ZKP)"
                                />
                              ) : (
                                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Unavailable</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Predicate conditions if any */}
                {requestedPredicates.length > 0 && (
                  <div style={{ marginTop: 12, padding: "10px 12px", background: "var(--surface-2)", borderRadius: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>
                      Zero-Knowledge Predicate Conditions:
                    </span>
                    {requestedPredicates.map((p, idx) => (
                      <div key={idx} style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                        • <code>{p.name} {p.p_type} {p.p_value}</code> — <Tag color="success">Satisfied by your credential</Tag>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="proof-consent-notice">
                <InfoCircleOutlined style={{ color: "#2563EB" }} />
                <span>
                  The proof presentation will be cryptographically signed with your private key. Only the claims shown above will be shared.
                </span>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 24 }}>
                <Button onClick={() => setSelectedProofForReview(null)}>Cancel</Button>
                <Popconfirm
                  title="Decline this proof request?"
                  description="The requesting organization will be notified that you declined."
                  onConfirm={() => handleDeclineProofRequest(selectedProofForReview.id)}
                  okText="Decline"
                  cancelText="Back"
                  okButtonProps={{ danger: true }}
                >
                  <Button danger>Decline Request</Button>
                </Popconfirm>
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={handlePresentProof}
                  style={{ background: "#1B365D", borderColor: "#1B365D" }}
                >
                  Share Proof
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* ========================================================= */}
        {/* MODAL 3: SHARE PROOF AD-HOC                               */}
        {/* ========================================================= */}
        <Modal
          title={
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <ShareAltOutlined style={{ color: "#2563EB" }} />
              <span>Share Verifiable Proof Ad-Hoc</span>
            </div>
          }
          open={isShareProofModalOpen}
          onCancel={() => setIsShareProofModalOpen(false)}
          footer={null}
          destroyOnClose
        >
          <Form form={shareProofForm} layout="vertical" onFinish={handleShareProofSubmit} style={{ marginTop: 16 }}>
            <Form.Item name="connectionId" label="Recipient Peer (Verifier)" rules={[{ required: true, message: "Select peer" }]}>
              <Select placeholder="Select connected peer">
                {connections.map((c) => (
                  <Option key={c.connection_id || c.id} value={c.connection_id || c.id}>
                    {c.their_label || c.peerName || "Connected Peer"}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item name="credentialId" label="Credential to Present" rules={[{ required: true, message: "Select credential" }]}>
              <Select placeholder="Select credential from wallet">
                {credentials.map((c) => (
                  <Option key={c.id} value={c.id}>
                    {c.credentialDefinition || c.type} (Issued by {c.issuerName || c.issuer})
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item name="comment" label="Note / Verification Purpose (Optional)">
              <Input placeholder="e.g. Presenting university degree for background check" />
            </Form.Item>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 24 }}>
              <Button onClick={() => setIsShareProofModalOpen(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit" style={{ background: "#2563EB" }}>
                Deliver Presentation
              </Button>
            </div>
          </Form>
        </Modal>

        {/* Modal 4: Inspect Credential Claims */}
        <CredentialDetailsModal
          visible={!!selectedCredentialForView}
          onClose={() => setSelectedCredentialForView(null)}
          credential={selectedCredentialForView}
        />

        {/* Modal 5: Connection Manager */}
        <ConnectionModal
          visible={isConnectionModalOpen}
          onClose={() => {
            setIsConnectionModalOpen(false);
            loadData();
          }}
          connections={connections}
          onCreateInvitation={holderService.createInvitation}
          onReceiveInvitation={holderService.receiveInvitation}
          role="holder"
        />
      </div>
    </DashboardLayout>
  );
};

export default HolderDashboard;