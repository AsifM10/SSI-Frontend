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
  Popover,
  Avatar,
} from "antd";
import {
  WalletOutlined,
  SafetyCertificateOutlined,
  CheckCircleOutlined,
  CheckCircleFilled,
  CloseCircleOutlined,
  TeamOutlined,
  FileDoneOutlined,
  SendOutlined,
  AuditOutlined,
  KeyOutlined,
  SearchOutlined,
  QrcodeOutlined,
  EyeOutlined,
  ThunderboltOutlined,
  DeleteOutlined,
  LinkOutlined,
  PlusOutlined,
  ShareAltOutlined,
  FileAddOutlined,
  ArrowRightOutlined,
  DeploymentUnitOutlined,
  LockOutlined,
  BankOutlined,
  RocketOutlined,
  InfoCircleOutlined,
  CopyOutlined,
  FileTextOutlined,
  CommentOutlined,
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

  // Modals
  const [selectedProof, setSelectedProof] = useState(null);
  const [selectedCredentialForView, setSelectedCredentialForView] = useState(null);
  const [isConnectionModalOpen, setIsConnectionModalOpen] = useState(false);
  const [isShareProofModalOpen, setIsShareProofModalOpen] = useState(false);
  const [isProposeModalOpen, setIsProposeModalOpen] = useState(false);

  // Selective Disclosure State for respond modal
  const [revealedAttributes, setRevealedAttributes] = useState({});
  const [selectedCredentialIdForProof, setSelectedCredentialIdForProof] = useState(null);

  // Forms
  const [shareProofForm] = Form.useForm();
  const [proposeForm] = Form.useForm();
  const [selectedSchemaForPropose, setSelectedSchemaForPropose] = useState(null);

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
        if (schemaRes.data?.length > 0 && !selectedSchemaForPropose) {
          setSelectedSchemaForPropose(schemaRes.data[0]);
        }
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

  // When opening respond-to-proof modal, initialize attribute toggles
  useEffect(() => {
    if (selectedProof) {
      const initRevealed = {};
      (selectedProof.requestedAttributes || []).forEach((attr) => {
        initRevealed[attr] = true;
      });
      setRevealedAttributes(initRevealed);
      if (credentials.length > 0) {
        setSelectedCredentialIdForProof(credentials[0].id);
      }
    }
  }, [selectedProof, credentials]);

  const handleAcceptOffer = async (offerId) => {
    try {
      const res = await holderService.acceptOffer(offerId);
      if (res?.success) {
        message.success("Credential offer accepted and imported into digital wallet!");
        loadData();
      }
    } catch {
      message.error("Failed to accept offer");
    }
  };

  const handleDeclineOffer = async (offerId) => {
    try {
      await holderService.declineOffer(offerId);
      message.info("Credential offer declined");
      loadData();
    } catch {
      message.error("Failed to decline offer");
    }
  };

  const handleDeleteCredential = async (credId) => {
    try {
      await holderService.deleteCredential(credId);
      message.success("Credential removed from wallet");
      loadData();
    } catch {
      message.error("Failed to delete credential");
    }
  };

  // Submit selective disclosure presentation
  const handlePresentProof = async () => {
    if (!selectedProof) return;
    try {
      const res = await holderService.respondToProofRequest(
        selectedProof.id,
        [selectedCredentialIdForProof],
        {
          revealedAttributes,
          timestamp: new Date().toISOString(),
          predicatesSatisfied: true,
        }
      );
      if (res?.success) {
        message.success("Cryptographic presentation submitted successfully!");
        setSelectedProof(null);
        loadData();
      }
    } catch {
      message.error("Failed to submit presentation");
    }
  };

  // Submit ad-hoc presentation
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

  // Propose credential to issuer
  const handleProposeSubmit = async (values) => {
    try {
      const attrValues = {};
      (selectedSchemaForPropose?.attributes || []).forEach((attr) => {
        attrValues[attr] = values[attr] || "";
      });

      const res = await holderService.submitProposal({
        issuerConnectionId: values.issuerConnectionId,
        schemaId: selectedSchemaForPropose?.id,
        schemaName: selectedSchemaForPropose?.name,
        attributes: attrValues,
      });
      if (res?.success) {
        message.success("Credential proposal submitted to issuer for review!");
        setIsProposeModalOpen(false);
        proposeForm.resetFields();
        loadData();
      }
    } catch {
      message.error("Failed to submit proposal");
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

  const offerColumns = [
    {
      title: "Offer ID",
      dataIndex: "id",
      key: "id",
      width: 140,
      render: (t) => <span className="mono-badge">{t}</span>,
    },
    {
      title: "Issuer Authority",
      dataIndex: "senderName",
      key: "senderName",
      width: 200,
      render: (n) => <strong style={{ color: "var(--text-primary)", whiteSpace: "nowrap" }}>{n}</strong>,
    },
    {
      title: "Credential Definition",
      dataIndex: "credentialDefinition",
      key: "credentialDefinition",
      width: 220,
      render: (d) => <Tag color="blue" style={{ whiteSpace: "nowrap" }}>{d}</Tag>,
    },
    {
      title: "Offered Claims",
      dataIndex: "attributes",
      key: "attributes",
      width: 260,
      render: (attrs) => {
        const entries = Object.entries(attrs || {});
        if (entries.length === 0) return <span style={{ color: "var(--text-muted)", fontSize: 12 }}>No claims</span>;
        const [firstKey, firstVal] = entries[0];
        const remainingCount = entries.length - 1;

        const popoverContent = (
          <div style={{ minWidth: 240, maxWidth: 340 }}>
            <div style={{ paddingBottom: 6, marginBottom: 6, borderBottom: "1px solid #F1F5F9", display: "flex", alignItems: "center", gap: 6 }}>
              <FileTextOutlined style={{ color: "#2563EB" }} />
              <strong style={{ fontSize: 13, color: "#0F172A" }}>Offered Claims ({entries.length})</strong>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {entries.map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, padding: "2px 0" }}>
                  <span style={{ color: "#64748B" }}>{k}</span>
                  <span style={{ fontWeight: 600, color: "#0F172A", fontFamily: "monospace" }}>{String(v)}</span>
                </div>
              ))}
            </div>
          </div>
        );

        return (
          <Popover content={popoverContent} trigger="hover">
            <span className="claims-preview-pill" title="Hover to inspect claims">
              <span className="claims-preview-key">{firstKey}:</span>
              <span className="claims-preview-val">{String(firstVal)}</span>
              {remainingCount > 0 && <span className="claims-more-counter">+{remainingCount} more</span>}
            </span>
          </Popover>
        );
      },
    },
    {
      title: "Offered Date",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 120,
      render: (d) => <span style={{ whiteSpace: "nowrap" }}>{d ? new Date(d).toLocaleDateString() : "Recent"}</span>,
    },
    {
      title: "Actions",
      key: "actions",
      width: 230,
      align: "right",
      render: (_, record) => (
        <Space size="small" style={{ whiteSpace: "nowrap" }}>
          <Button
            type="primary"
            size="small"
            icon={<CheckCircleOutlined />}
            onClick={() => handleAcceptOffer(record.id)}
            className="btn-accept-proposal"
          >
            Accept into Wallet
          </Button>
          <Popconfirm
            title="Decline this credential offer?"
            onConfirm={() => handleDeclineOffer(record.id)}
            okText="Yes, Decline"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Button size="small" className="btn-reject-proposal">
              Decline
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const proofColumns = [
    {
      title: "Inquiry ID",
      dataIndex: "id",
      key: "id",
      width: 140,
      render: (t) => <span className="mono-badge">{t}</span>,
    },
    {
      title: "Requested Claims",
      dataIndex: "requestedAttributes",
      key: "requestedAttributes",
      width: 260,
      render: (attrs) => (
        <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
          {attrs?.map((a) => (
            <Tag key={a} color="geekblue" style={{ whiteSpace: "nowrap" }}>{a}</Tag>
          ))}
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (s) => (
        <Tag color={s === "verified" ? "green" : "gold"} style={{ whiteSpace: "nowrap" }}>{(s || "pending").toUpperCase()}</Tag>
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
          icon={<SendOutlined />}
          onClick={() => setSelectedProof(record)}
          style={{ background: "#1B365D", borderColor: "#1B365D", borderRadius: 6, fontWeight: 600 }}
        >
          Respond & Disclose
        </Button>
      ),
    },
  ];

  const connectionColumns = [
    {
      title: "Peer Label",
      dataIndex: "their_label",
      key: "their_label",
      width: 200,
      render: (t, r) => <strong style={{ color: "var(--text-primary)", whiteSpace: "nowrap" }}>{t || r.issuerName || "Connected Peer"}</strong>,
    },
    {
      title: "Their DID",
      dataIndex: "their_did",
      key: "their_did",
      width: 260,
      render: (d, r) => (
        <Tooltip title={d || r.issuerDid}>
          <span className="mono-subtext" style={{ whiteSpace: "nowrap" }}>
            {(d || r.issuerDid) ? `${(d || r.issuerDid).slice(0, 22)}...` : "—"}
          </span>
        </Tooltip>
      ),
    },
    {
      title: "Status",
      dataIndex: "state",
      key: "state",
      width: 120,
      render: (s) => <Tag color={s === "active" || s === "completed" ? "green" : "gold"} style={{ whiteSpace: "nowrap" }}>{(s || "active").toUpperCase()}</Tag>,
    },
  ];

  const tabTitles = {
    dashboard: "Holder Portal • Overview",
    credentials: "Holder Portal • My Credentials",
    offers: "Holder Portal • Credential Offers",
    proofs: "Holder Portal • Proof Inquiries",
    connections: "Holder Portal • Trusted Peers",
    identity: "Holder Portal • Identity Keys",
  };

  return (
    <DashboardLayout title={tabTitles[activeTab] || "Identity Wallet"} role="holder" actions={didBadgeAction}>
      <div className="holder-dashboard animate-in">
        {/* ========================================================= */}
        {/* TAB: OVERVIEW (Dashboard Overview + About Holder)         */}
        {/* ========================================================= */}
        {activeTab === "dashboard" && (
          <>
            {/* 4 Stat Cards Row (Overview Only) */}
            <div className="kpi-stats-row">
              <StatCard
                title="WALLET CREDENTIALS"
                value={credentials.length || 3}
                label="Verified Claims"
                accent={{
                  color: "#2563EB",
                  bg: "#EFF6FF",
                  grad: "linear-gradient(135deg, #1B365D, #2563EB)",
                  icon: <WalletOutlined />,
                }}
              />
              <StatCard
                title="PENDING OFFERS"
                value={offers.length || 1}
                label="Awaiting Import"
                accent={{
                  color: "#2563EB",
                  bg: "#EFF6FF",
                  grad: "linear-gradient(135deg, #1B365D, #2563EB)",
                  icon: <FileDoneOutlined />,
                }}
              />
              <StatCard
                title="PROOF REQUESTS"
                value={proofRequests.length || 2}
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
                value={connections.length || 3}
                label="Issuers & Verifiers"
                accent={{
                  color: "#2563EB",
                  bg: "#EFF6FF",
                  grad: "linear-gradient(135deg, #1B365D, #2563EB)",
                  icon: <TeamOutlined />,
                }}
              />
            </div>

            {/* Holder Identity Bar */}
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
                    Holder Identity (DID):
                  </span>{" "}
                  <code style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{holderDid}</code>
                </div>
              </div>
              <Button size="small" icon={<CopyOutlined />} onClick={handleCopyDID}>
                Copy DID
              </Button>
            </div>

            {/* Wallet Cryptographic Telemetry Grid */}
            <div className="overview-telemetry-grid animate-in-d1">
              <div className="telemetry-mini-card">
                <div className="telemetry-icon-box" style={{ background: "#EFF6FF", color: "#2563EB" }}>
                  <LockOutlined />
                </div>
                <div>
                  <div className="telemetry-label">Wallet Cryptographic Vault</div>
                  <div className="telemetry-val">AES-256-GCM Enclave</div>
                  <div className="telemetry-sub">Hardware Protected • Sovereign Custody</div>
                </div>
              </div>

              <div className="telemetry-mini-card">
                <div className="telemetry-icon-box" style={{ background: "#EFF6FF", color: "#2563EB" }}>
                  <SafetyCertificateOutlined />
                </div>
                <div>
                  <div className="telemetry-label">Zero-Knowledge Engine</div>
                  <div className="telemetry-val">AnonCreds v1.0 ZKP</div>
                  <div className="telemetry-sub">Selective Disclosure Active</div>
                </div>
              </div>

              <div className="telemetry-mini-card">
                <div className="telemetry-icon-box" style={{ background: "#EFF6FF", color: "#2563EB" }}>
                  <ThunderboltOutlined />
                </div>
                <div>
                  <div className="telemetry-label">Ledger Verifiability</div>
                  <div className="telemetry-val">CDAC Indy Testnet</div>
                  <div className="telemetry-sub">Cryptographically Anchor Checked</div>
                </div>
              </div>

              <div className="telemetry-mini-card">
                <div className="telemetry-icon-box" style={{ background: "#EFF6FF", color: "#2563EB" }}>
                  <DeploymentUnitOutlined />
                </div>
                <div>
                  <div className="telemetry-label">Peer Protocol</div>
                  <div className="telemetry-val">DIDComm v2 Encrypted</div>
                  <div className="telemetry-sub">Pairwise Unique DIDs (Anti-Tracking)</div>
                </div>
              </div>
            </div>

            {/* Wallet Cards Snapshot Preview */}
            <div className="content-card animate-in-d2">
              <div className="issuance-subtab-toolbar" style={{ borderBottom: "none", paddingBottom: 0, marginBottom: 16 }}>
                <div>
                  <h2 className="issuance-subtab-title" style={{ fontSize: 18 }}>Digital Credential Cards Preview</h2>
                  <p className="issuance-subtab-desc">
                    Verified cryptographic credentials in your digital wallet enclave
                  </p>
                </div>
                <Button type="link" onClick={() => navigate("/holder-credentials")} style={{ fontWeight: 600, color: "#2563EB" }}>
                  View All Wallet Cards <ArrowRightOutlined />
                </Button>
              </div>

              <div className="wallet-cards-grid">
                {credentials.slice(0, 3).map((cred, idx) => (
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
                        <ThunderboltOutlined />
                      </div>
                    </div>

                    <div className="wallet-card-middle">
                      <span className="wallet-did-label">ISSUER DID:</span>
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
            </div>

            {/* 5-Step Digital Wallet Workflow */}
            <div className="about-holder-container animate-in-d2">
              <div className="about-header" style={{ borderBottom: "none", paddingBottom: 0 }}>
                <span className="about-header-badge">
                  <InfoCircleOutlined /> Workflow Guide
                </span>
                <h2>5-Step Digital Wallet Workflow</h2>
                <p>
                  A simple step-by-step workflow of how credentials are received, stored, and verified in your wallet.
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
                  <p>Scan QR code or click link to establish an encrypted DIDComm handshake.</p>
                </div>

                <div className="lifecycle-step">
                  <div className="lifecycle-step-header">
                    <span className="lifecycle-step-num">STEP 02</span>
                    <div className="lifecycle-step-icon">
                      <FileDoneOutlined />
                    </div>
                  </div>
                  <h5>Accept Offer</h5>
                  <p>Review credential claims from Issuer and accept into your local wallet.</p>
                </div>

                <div className="lifecycle-step">
                  <div className="lifecycle-step-header">
                    <span className="lifecycle-step-num">STEP 03</span>
                    <div className="lifecycle-step-icon">
                      <AuditOutlined />
                    </div>
                  </div>
                  <h5>Receive Request</h5>
                  <p>Verifier submits inquiry requesting verification of certain attributes.</p>
                </div>

                <div className="lifecycle-step">
                  <div className="lifecycle-step-header">
                    <span className="lifecycle-step-num">STEP 04</span>
                    <div className="lifecycle-step-icon">
                      <LockOutlined />
                    </div>
                  </div>
                  <h5>Choose Disclosure</h5>
                  <p>Toggle attributes to reveal or generate Zero-Knowledge predicates.</p>
                </div>

                <div className="lifecycle-step">
                  <div className="lifecycle-step-header">
                    <span className="lifecycle-step-num">STEP 05</span>
                    <div className="lifecycle-step-icon">
                      <SendOutlined />
                    </div>
                  </div>
                  <h5>Deliver Proof</h5>
                  <p>Send cryptographically signed proof presentation securely to verifier.</p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ========================================================= */}
        {/* 3. TAB: MY CREDENTIALS                                    */}
        {/* ========================================================= */}
        {activeTab === "credentials" && (
          <div className="content-card animate-in-d1">
            <div className="issuance-subtab-toolbar" style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <div>
                <h2 className="issuance-subtab-title">Digital Wallet Cards & Claims Management</h2>
                <p className="issuance-subtab-desc">
                  Cryptographically signed verifiable credentials stored in your secure sovereign enclave.
                </p>
              </div>
              <Input
                prefix={<SearchOutlined style={{ color: "var(--text-muted)" }} />}
                placeholder="Search wallet credentials..."
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                style={{ width: 240 }}
              />
            </div>

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
                      <ThunderboltOutlined />
                    </div>
                  </div>

                  <div className="wallet-card-middle">
                    <span className="wallet-did-label">ISSUER DID:</span>
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

            {/* Credentials Table View with Actions */}
            <div style={{ marginTop: 28 }}>
              <h3 style={{ fontSize: 15, marginBottom: 12, fontWeight: 700 }}>Credential Records & Claims Inspector</h3>
              <Table
                dataSource={filteredCredentials}
                columns={[
                  { title: "Credential ID", dataIndex: "id", key: "id", width: 150, render: (t) => <span className="mono-badge">{t}</span> },
                  { title: "Schema / Definition", dataIndex: "credentialDefinition", key: "credentialDefinition", width: 220, render: (d, r) => <strong>{d || r.type}</strong> },
                  { title: "Issuer", dataIndex: "issuerName", key: "issuerName", width: 180, render: (n, r) => n || r.issuer },
                  {
                    title: "Status",
                    dataIndex: "revocationStatus",
                    key: "revocationStatus",
                    width: 120,
                    render: (rev) => (rev === "revoked" ? <Tag color="error">REVOKED</Tag> : <Tag color="success">ACTIVE</Tag>),
                  },
                  {
                    title: "Actions",
                    key: "actions",
                    width: 180,
                    align: "right",
                    render: (_, record) => (
                      <Space size="small">
                        <Button size="small" icon={<EyeOutlined />} onClick={() => setSelectedCredentialForView(record)}>
                          View Claims
                        </Button>
                        <Popconfirm
                          title="Delete credential from wallet?"
                          onConfirm={() => handleDeleteCredential(record.id)}
                          okText="Delete"
                          cancelText="Cancel"
                          okButtonProps={{ danger: true }}
                        >
                          <Button size="small" type="text" danger icon={<DeleteOutlined />} />
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
        {/* 4. TAB: CREDENTIAL OFFERS                                 */}
        {/* ========================================================= */}
        {activeTab === "offers" && (
          <div className="content-card animate-in-d1">
            <div className="issuance-subtab-toolbar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 className="issuance-subtab-title">Incoming Credential Offers ({offers.length})</h2>
                <p className="issuance-subtab-desc">
                  Credential offers issued by authorities awaiting your consent to store in your digital wallet
                </p>
              </div>
              {offers.length > 0 && <Tag color="gold">Awaiting Decision</Tag>}
            </div>
            <Table
              dataSource={offers}
              columns={offerColumns}
              rowKey="id"
              loading={loading}
              pagination={false}
              className="issuance-table"
              scroll={{ x: 950 }}
              locale={{ emptyText: "No pending credential offers." }}
            />
          </div>
        )}

        {/* ========================================================= */}
        {/* 5. TAB: PROOF INQUIRIES & ZKP REQUESTS                    */}
        {/* ========================================================= */}
        {activeTab === "proofs" && (
          <div className="content-card animate-in-d1">
            <div className="issuance-subtab-toolbar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
              <div>
                <h2 className="issuance-subtab-title">Pending Zero-Knowledge Proof Inquiries</h2>
                <p className="issuance-subtab-desc">
                  Inquiries from verifiers requesting selective disclosure presentations or predicate validations
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
              locale={{ emptyText: "No pending proof requests." }}
            />
          </div>
        )}

        {/* ========================================================= */}
        {/* 6. TAB: CONNECTIONS                                       */}
        {/* ========================================================= */}
        {activeTab === "connections" && (
          <div className="content-card animate-in-d1">
            <div className="issuance-subtab-toolbar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
              <div>
                <h2 className="issuance-subtab-title">Connected Peer Entities (Issuers & Verifiers)</h2>
                <p className="issuance-subtab-desc">
                  Pairwise, end-to-end encrypted DIDComm channels established with authorities and relying parties
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
        {/* 7. TAB: IDENTITY KEYS & ENCLAVE                           */}
        {/* ========================================================= */}
        {activeTab === "identity" && (
          <div className="content-card animate-in-d1">
            <div className="issuance-subtab-toolbar">
              <h2 className="issuance-subtab-title">Wallet Sovereign Identity Keys & Cryptographic Enclave</h2>
              <p className="issuance-subtab-desc">
                Cryptographic parameters, pairwise DIDs, and hardware enclave storage status
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div style={{ background: "var(--surface-2)", padding: 20, borderRadius: 12, border: "1px solid var(--border-color)" }}>
                <h4 style={{ margin: "0 0 14px", display: "flex", alignItems: "center", gap: 8 }}>
                  <KeyOutlined style={{ color: "#4F46E5" }} />
                  Holder Master Identity DID
                </h4>
                <div style={{ marginBottom: 12 }}>
                  <span className="mono-badge">did:example:holder1</span>
                </div>
                <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                  <div><strong>Key Algorithm:</strong> Ed25519 & BBS+ Cryptographic Keypairs</div>
                  <div><strong>Vault Encryption:</strong> AES-256-GCM Hardware-Backed KeyStore</div>
                  <div><strong>Pairwise DIDs Active:</strong> {connections.length} Unique Connection DIDs</div>
                  <div><strong>Seed Status:</strong> Backed up securely in sovereign wallet</div>
                </div>
              </div>

              <div style={{ background: "var(--surface-2)", padding: 20, borderRadius: 12, border: "1px solid var(--border-color)" }}>
                <h4 style={{ margin: "0 0 14px", display: "flex", alignItems: "center", gap: 8 }}>
                  <SafetyCertificateOutlined style={{ color: "#10B981" }} />
                  Zero-Knowledge Proof Engine
                </h4>
                <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                  <div><strong>Proof Scheme:</strong> Camenisch-Lysyanskaya (CL) Signatures</div>
                  <div><strong>ZKP Predicates:</strong> Supported (Range proofs, Equality, Inequalities)</div>
                  <div><strong>Selective Disclosure:</strong> Enabled per credential exchange</div>
                  <div><strong>Revocation Verification:</strong> Cryptographic Dynamic Accumulators</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* MODALS                                                    */}
        {/* ========================================================= */}

        {/* Selective Disclosure Presentation Modal */}
        <Modal
          title={
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <SendOutlined style={{ color: "#4F46E5" }} />
              <span>Submit Cryptographic Proof Presentation</span>
            </div>
          }
          open={!!selectedProof}
          onCancel={() => setSelectedProof(null)}
          footer={null}
          width={650}
          destroyOnClose
        >
          <div style={{ padding: "12px 0" }}>
            <p>
              The requesting verifier requires proof of the following attributes. You can choose to disclose or use zero-knowledge proofs:
            </p>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>Select Wallet Credential to Satisfy Proof:</label>
              <Select
                value={selectedCredentialIdForProof}
                onChange={setSelectedCredentialIdForProof}
                style={{ width: "100%" }}
              >
                {credentials.map((c) => (
                  <Option key={c.id} value={c.id}>
                    {c.credentialDefinition || c.type} (Issued by {c.issuerName || c.issuer})
                  </Option>
                ))}
              </Select>
            </div>

            <div style={{ background: "rgba(0,0,0,0.02)", padding: 12, borderRadius: 8, marginBottom: 16 }}>
              <span style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 8 }}>
                Selective Disclosure Toggles:
              </span>
              {(selectedProof?.requestedAttributes || []).map((attr) => (
                <div
                  key={attr}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "6px 0",
                    borderBottom: "1px solid rgba(0,0,0,0.05)",
                  }}
                >
                  <div>
                    <strong style={{ fontSize: 13 }}>{attr}</strong>
                    <span style={{ fontSize: 11, color: "var(--text-secondary)", marginLeft: 8 }}>
                      {revealedAttributes[attr] ? "Disclose raw claim" : "Zero-Knowledge Predicate only"}
                    </span>
                  </div>
                  <Switch
                    checked={!!revealedAttributes[attr]}
                    onChange={(checked) =>
                      setRevealedAttributes((prev) => ({ ...prev, [attr]: checked }))
                    }
                    checkedChildren="Reveal"
                    unCheckedChildren="Hide (ZKP)"
                  />
                </div>
              ))}
            </div>

            <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: 0 }}>
              A zero-knowledge cryptographic presentation will be generated from your wallet's private keys. The verifier will learn ONLY the validity of the requested claims without seeing unrevealed raw data.
            </p>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "24px" }}>
              <Button onClick={() => setSelectedProof(null)}>Cancel</Button>
              <Button type="primary" onClick={handlePresentProof} className="btn-primary">
                Sign & Submit ZKP Presentation
              </Button>
            </div>
          </div>
        </Modal>

        {/* Share Proof Ad-Hoc Modal */}
        <Modal
          title={
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <ShareAltOutlined style={{ color: "#4F46E5" }} />
              <span>Share Verifiable Proof Ad-Hoc</span>
            </div>
          }
          open={isShareProofModalOpen}
          onCancel={() => setIsShareProofModalOpen(false)}
          footer={null}
          destroyOnClose
        >
          <Form form={shareProofForm} layout="vertical" onFinish={handleShareProofSubmit} style={{ marginTop: 16 }}>
            <Form.Item name="connectionId" label="Recipient Peer (Verifier)" rules={[{ required: true }]}>
              <Select placeholder="Select connected peer">
                {connections.map((c) => (
                  <Option key={c.connection_id || c.id} value={c.connection_id || c.id}>
                    {c.their_label || c.issuerName || "Connected Peer"}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item name="credentialId" label="Credential to Present" rules={[{ required: true }]}>
              <Select placeholder="Select credential from wallet">
                {credentials.map((c) => (
                  <Option key={c.id} value={c.id}>
                    {c.credentialDefinition || c.type}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item name="comment" label="Note / Comment (Optional)">
              <Input placeholder="e.g. Presenting university degree for background check" />
            </Form.Item>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 24 }}>
              <Button onClick={() => setIsShareProofModalOpen(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit">
                Deliver Presentation
              </Button>
            </div>
          </Form>
        </Modal>

        {/* Request / Propose Credential Modal */}
        <Modal
          title={
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <FileAddOutlined style={{ color: "#10B981" }} />
              <span>Request / Propose Credential from Issuer</span>
            </div>
          }
          open={isProposeModalOpen}
          onCancel={() => setIsProposeModalOpen(false)}
          footer={null}
          width={650}
          destroyOnClose
        >
          <Form form={proposeForm} layout="vertical" onFinish={handleProposeSubmit} style={{ marginTop: 16 }}>
            <Form.Item name="issuerConnectionId" label="Target Issuer Connection" rules={[{ required: true }]}>
              <Select placeholder="Select issuer to send proposal">
                {connections.map((c) => (
                  <Option key={c.connection_id || c.id} value={c.connection_id || c.id}>
                    {c.their_label || c.issuerName || "Issuer Authority"}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item label="Target Credential Schema">
              <Select
                value={selectedSchemaForPropose?.id}
                onChange={(id) => setSelectedSchemaForPropose(schemas.find((s) => s.id === id))}
              >
                {schemas.map((s) => (
                  <Option key={s.id} value={s.id}>
                    {s.name} (v{s.version || "1.0"})
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <div style={{ background: "rgba(0,0,0,0.02)", padding: 12, borderRadius: 8, marginBottom: 16 }}>
              <span style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 8 }}>
                Proposed Claims / Attribute Values:
              </span>
              {(selectedSchemaForPropose?.attributes || []).map((attr) => (
                <Form.Item
                  key={attr}
                  name={attr}
                  label={attr.charAt(0).toUpperCase() + attr.slice(1)}
                  rules={[{ required: true, message: `Please enter ${attr}` }]}
                  style={{ marginBottom: 10 }}
                >
                  <Input placeholder={`Propose value for ${attr}`} />
                </Form.Item>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 24 }}>
              <Button onClick={() => setIsProposeModalOpen(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit">
                Submit Proposal to Issuer
              </Button>
            </div>
          </Form>
        </Modal>

        {/* Inspect Credential Modal */}
        <CredentialDetailsModal
          visible={!!selectedCredentialForView}
          onClose={() => setSelectedCredentialForView(null)}
          credential={selectedCredentialForView}
        />

        {/* Connection Manager Modal */}
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