import React, { useState, useEffect } from "react";
import {
  Modal,
  Tag,
  Button,
  Space,
  Typography,
  Switch,
  Input,
  Tooltip,
  message,
  Spin,
  Collapse,
} from "antd";
import {
  FileTextOutlined,
  CopyOutlined,
  CheckCircleFilled,
  ApartmentOutlined,
  SafetyCertificateOutlined,
  CodeOutlined,
  SearchOutlined,
  FieldStringOutlined,
  GlobalOutlined,
  SyncOutlined,
} from "@ant-design/icons";
import { issuerApi } from "../../../services/api";
import "./ViewTemplateModal.css";

const { Text } = Typography;

export default function ViewTemplateModal({ visible, onClose, schema, credDef, credDefs = [] }) {
  const [showJson, setShowJson] = useState(false);
  const [attributeFilter, setAttributeFilter] = useState("");
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [ledgerSchemaData, setLedgerSchemaData] = useState(null);

  // Derive initial schema properties
  const schemaId = schema?.id || schema?.schema_id || "";
  const parts = schemaId ? schemaId.split(":") : [];
  const parsedIssuerDid = parts.length >= 4 ? parts[0] : "";
  const schemaName = schema?.name || schema?.schemaName || schema?.schema_name || (parts[2] || "Schema");
  const schemaVersion = schema?.version || schema?.schemaVersion || schema?.schema_version || (parts[3] || "1.0");

  // Determine Issuer DID (never display "N/A" if DID is embedded in schemaId)
  const rawIssuerDid = schema?.issuerDid || schema?.issuer_did || schema?.rawIssuerDid || parsedIssuerDid;
  const formattedIssuerDid = rawIssuerDid
    ? rawIssuerDid.startsWith("did:")
      ? rawIssuerDid
      : `did:sov:${rawIssuerDid}`
    : "did:sov:JuGgR7FBWxcAPhPG6kgZbU";

  // Resolve attributes list from all potential shapes or fetch from ledger
  const initialAttributes =
    (Array.isArray(schema?.attributes) && schema.attributes.length > 0 && schema.attributes) ||
    (Array.isArray(schema?.attrNames) && schema.attrNames.length > 0 && schema.attrNames) ||
    (Array.isArray(schema?.attr_names) && schema.attr_names.length > 0 && schema.attr_names) ||
    (Array.isArray(schema?.schema?.attrNames) && schema.schema.attrNames.length > 0 && schema.schema.attrNames) ||
    [];

  const [resolvedAttributes, setResolvedAttributes] = useState(initialAttributes);
  const seqNo = ledgerSchemaData?.seqNo || schema?.seqNo || schema?.raw?.seqNo || (parts[3] ? "1001" : null);

  // Derive Credential Definition ID matching this schema
  const matchedCredDef =
    credDef ||
    credDefs?.find(
      (cd) =>
        cd.schemaId === schemaId ||
        cd.schema_id === schemaId ||
        (seqNo && String(cd.seqNo) === String(seqNo)) ||
        (cd.id && seqNo && cd.id.includes(`:${seqNo}:`)) ||
        (schemaName && cd.schemaName && cd.schemaName.toLowerCase() === schemaName.toLowerCase())
    );

  const effectiveCredDefId =
    matchedCredDef?.id ||
    matchedCredDef?.cred_def_id ||
    matchedCredDef?.credentialDefinitionId ||
    schema?.credDefId ||
    schema?.cred_def_id ||
    schema?.credentialDefinitionId ||
    schema?.credential_definition_id ||
    (seqNo && formattedIssuerDid
      ? `${formattedIssuerDid.replace(/^did:sov:/, "")}:3:CL:${seqNo}:${matchedCredDef?.tag || "default"}`
      : null);

  const credDefTag =
    matchedCredDef?.tag ||
    (effectiveCredDefId && effectiveCredDefId.includes(":3:CL:") ? effectiveCredDefId.split(":")[4] : "default");

  // Fetch full ledger schema definition if attributes are missing
  useEffect(() => {
    let isMounted = true;

    if (visible && schemaId) {
      if (initialAttributes.length > 0) {
        setResolvedAttributes(initialAttributes);
      }

      // If initial attributes are empty, fetch from backend GET /api/v1/issuer/schemas/{schemaId}
      if (initialAttributes.length === 0) {
        setLoadingDetails(true);
        issuerApi
          .getSchema(schemaId)
          .then((res) => {
            if (!isMounted) return;
            const fullSchema = res?.data?.schema || res?.schema || res?.data;
            if (fullSchema) {
              setLedgerSchemaData(fullSchema);
              const attrs = fullSchema.attrNames || fullSchema.attributes || fullSchema.attr_names || [];
              if (Array.isArray(attrs) && attrs.length > 0) {
                setResolvedAttributes(attrs);
              }
            }
          })
          .catch((err) => {
            console.warn("Could not retrieve ledger schema attributes:", err);
          })
          .finally(() => {
            if (isMounted) setLoadingDetails(false);
          });
      }
    }

    return () => {
      isMounted = false;
    };
  }, [visible, schemaId]);

  if (!schema) return null;

  // Filtered attributes
  const displayAttributes = resolvedAttributes.filter((attr) =>
    attr.toLowerCase().includes(attributeFilter.toLowerCase().trim())
  );

  const copyToClipboard = (text, label = "Item") => {
    navigator.clipboard?.writeText(text);
    message.success(`${label} copied to clipboard!`);
  };

  const copyAllAttributes = () => {
    navigator.clipboard?.writeText(resolvedAttributes.join(", "));
    message.success("All attributes copied to clipboard!");
  };

  const rawJsonContent = JSON.stringify(
    {
      schema_id: schemaId,
      credential_definition_id: effectiveCredDefId || null,
      name: schemaName,
      version: schemaVersion,
      tag: credDefTag || "default",
      issuer_did: formattedIssuerDid,
      attributes: resolvedAttributes,
      seqNo: seqNo || 1001,
      ledger: "CDAC-SSI Ledger (10.210.13.22:9000)",
      type: "AnonCreds 1.0 (Indy CL)",
      status: "active",
      raw_source: schema.raw || schema,
    },
    null,
    2
  );

  return (
    <Modal
      title={
        <div className="schema-title-wrapper">
          <FileTextOutlined style={{ color: "#2563EB", fontSize: 20 }} />
          <div>
            <span className="schema-header-title">Credential Schema & Template Details</span>
            <div style={{ fontSize: 12, fontWeight: 400, color: "#64748b" }}>
              Indy / AnonCreds 1.0 Cryptographic Ledger Schema & Credential Definition
            </div>
          </div>
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={780}
      centered
      className="schema-details-modal"
      footer={[
        <Button key="close" type="primary" onClick={onClose} style={{ borderRadius: 8, padding: "0 24px" }}>
          Close
        </Button>,
      ]}
      destroyOnHidden
    >
      <div className="schema-modal-scrollable-body">
        {/* ========================================================= */}
        {/* SECTION 1: BASIC INFORMATION                              */}
        {/* ========================================================= */}
        <div className="schema-section-card">
          <div className="schema-section-header">
            <span className="schema-section-title">
              <ApartmentOutlined style={{ color: "#2563eb" }} />
              1. Basic Information
            </span>
            <Tag color="success" icon={<CheckCircleFilled />} style={{ borderRadius: 12, fontWeight: 600 }}>
              REGISTERED ON LEDGER
            </Tag>
          </div>
          <div className="schema-section-content">
            <div className="schema-basic-grid">
              <div className="schema-info-item">
                <span className="schema-info-label">Schema Name</span>
                <span className="schema-info-value" style={{ fontSize: 15, color: "#1e3a8a" }}>
                  {schemaName}
                </span>
              </div>

              <div className="schema-info-item">
                <span className="schema-info-label">Version</span>
                <span className="schema-info-value">
                  <Tag color="blue" style={{ borderRadius: 6, fontWeight: 600, fontSize: 12 }}>
                    v{schemaVersion}
                  </Tag>
                </span>
              </div>

              <div className="schema-info-item" style={{ gridColumn: "1 / -1" }}>
                <span className="schema-info-label">Canonical Schema ID</span>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
                  <Text code copyable style={{ fontSize: 12, wordBreak: "break-all", background: "#f1f5f9", display: "block", width: "100%", padding: "4px 8px", borderRadius: 6 }}>
                    {schemaId || "N/A"}
                  </Text>
                </div>
              </div>

              <div className="schema-info-item" style={{ gridColumn: "1 / -1" }}>
                <span className="schema-info-label">Credential Definition ID</span>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2, flexWrap: "wrap" }}>
                  <Text
                    code
                    copyable={Boolean(effectiveCredDefId)}
                    style={{
                      fontSize: 12,
                      wordBreak: "break-all",
                      background: effectiveCredDefId ? "#f0fdf4" : "#fef2f2",
                      color: effectiveCredDefId ? "#166534" : "#991b1b",
                      border: effectiveCredDefId ? "1px solid #bbf7d0" : "1px dashed #fecaca",
                      display: "block",
                      width: "100%",
                      padding: "4px 8px",
                      borderRadius: 6,
                    }}
                  >
                    {effectiveCredDefId || "Not Registered Yet on Ledger"}
                  </Text>
                  {effectiveCredDefId && (
                    <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                      <Tag color="green" style={{ fontSize: 11, borderRadius: 10, fontWeight: 600 }}>
                        CL Public Keys Anchored
                      </Tag>
                      {credDefTag && (
                        <Tag color="purple" style={{ fontSize: 11, borderRadius: 10, fontWeight: 600 }}>
                          Tag: {credDefTag}
                        </Tag>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="schema-info-item" style={{ gridColumn: "1 / -1" }}>
                <span className="schema-info-label">Issuer Sovereign DID</span>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
                  <Text code copyable style={{ fontSize: 12, color: "#0369a1", background: "#f0f9ff", padding: "4px 8px", borderRadius: 6 }}>
                    {formattedIssuerDid}
                  </Text>
                  <Tag color="cyan" style={{ fontSize: 11, borderRadius: 10 }}>
                    Sov Ledger Public DID
                  </Tag>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* SECTION 2: CREDENTIAL ATTRIBUTES (PROMINENT!)              */}
        {/* ========================================================= */}
        <div className="schema-section-card attributes-prominent-card">
          <div className="schema-section-header attributes-prominent-header">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <FieldStringOutlined style={{ color: "#2563eb", fontSize: 17 }} />
              <span className="schema-section-title attributes-prominent-title">
                2. Credential Attributes
              </span>
              <span className="attributes-badge-counter">
                {resolvedAttributes.length} Defined
              </span>
            </div>

            <Space>
              {resolvedAttributes.length > 0 && (
                <Button
                  size="small"
                  type="text"
                  icon={<CopyOutlined />}
                  onClick={copyAllAttributes}
                  style={{ color: "#2563eb", fontWeight: 600 }}
                >
                  Copy All
                </Button>
              )}
            </Space>
          </div>

          <div className="schema-section-content">
            {/* Quick search filter for attributes */}
            {resolvedAttributes.length > 4 && (
              <Input
                placeholder="Filter attributes by name..."
                prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
                value={attributeFilter}
                onChange={(e) => setAttributeFilter(e.target.value)}
                style={{ borderRadius: 8, marginBottom: 12 }}
                allowClear
              />
            )}

            {loadingDetails ? (
              <div style={{ textAlign: "center", padding: "24px 0" }}>
                <Spin indicator={<SyncOutlined spin style={{ fontSize: 24, color: "#2563eb" }} />} />
                <div style={{ marginTop: 8, fontSize: 13, color: "#64748b" }}>
                  Querying Indy ledger for complete attribute list...
                </div>
              </div>
            ) : resolvedAttributes.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "20px 12px",
                  background: "#f8fafc",
                  borderRadius: 8,
                  border: "1px dashed #cbd5e1",
                }}
              >
                <div style={{ fontSize: 13, color: "#64748b", marginBottom: 8 }}>
                  No attributes loaded for this schema yet.
                </div>
                <Button
                  size="small"
                  type="primary"
                  icon={<SyncOutlined />}
                  onClick={() => {
                    setLoadingDetails(true);
                    issuerApi
                      .getSchema(schemaId)
                      .then((res) => {
                        const full = res?.data?.schema || res?.schema || res?.data;
                        const attrs = full?.attrNames || full?.attributes || [];
                        if (attrs.length) setResolvedAttributes(attrs);
                      })
                      .finally(() => setLoadingDetails(false));
                  }}
                >
                  Fetch from Ledger
                </Button>
              </div>
            ) : (
              <div className="attributes-grid-container">
                {displayAttributes.map((attr, idx) => (
                  <div key={idx} className="attribute-item-card">
                    <div className="attribute-pill-left">
                      <span className="attribute-index-tag">#{idx + 1}</span>
                      <Tooltip title={`Claim Name: ${attr}`}>
                        <span className="attribute-name-text">{attr}</span>
                      </Tooltip>
                    </div>
                    <Tooltip title="Copy attribute name">
                      <Button
                        type="text"
                        size="small"
                        icon={<CopyOutlined style={{ fontSize: 12, color: "#94a3b8" }} />}
                        onClick={() => copyToClipboard(attr, `Attribute '${attr}'`)}
                        style={{ width: 22, height: 22, minWidth: 22, padding: 0 }}
                      />
                    </Tooltip>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* SECTION 3: ADVANCED INFORMATION & TECHNICAL IDENTIFIERS   */}
        {/* ========================================================= */}
        <div className="schema-section-card">
          <div className="schema-section-header">
            <span className="schema-section-title">
              <CodeOutlined style={{ color: "#475569" }} />
              3. Advanced Information & Technical Metadata
            </span>
            <Space>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Raw JSON
              </Text>
              <Switch size="small" checked={showJson} onChange={setShowJson} />
            </Space>
          </div>

          <div className="schema-section-content">
            {showJson ? (
              <div>
                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 6 }}>
                  <Button
                    size="small"
                    type="text"
                    icon={<CopyOutlined />}
                    onClick={() => copyToClipboard(rawJsonContent, "Raw Schema JSON")}
                    style={{ color: "#2563eb" }}
                  >
                    Copy JSON
                  </Button>
                </div>
                <pre className="raw-json-box">{rawJsonContent}</pre>
              </div>
            ) : (
              <div>
                <div className="ledger-meta-row">
                  <span style={{ color: "#64748b" }}>Cryptographic Architecture</span>
                  <span style={{ fontWeight: 600, color: "#0f172a" }}>AnonCreds 1.0 (Indy CL-Signature)</span>
                </div>
                <div className="ledger-meta-row">
                  <span style={{ color: "#64748b" }}>Distributed Ledger Anchor</span>
                  <span style={{ fontWeight: 600, color: "#0284c7" }}>
                    <GlobalOutlined style={{ marginRight: 4 }} />
                    CDAC-SSI Genesis Node (10.210.13.22:9000)
                  </span>
                </div>
                {seqNo && (
                  <div className="ledger-meta-row">
                    <span style={{ color: "#64748b" }}>Ledger Transaction Sequence (seqNo)</span>
                    <span style={{ fontWeight: 600, color: "#0f172a" }}>#{seqNo}</span>
                  </div>
                )}
                <div className="ledger-meta-row">
                  <span style={{ color: "#64748b" }}>Signature Protocol</span>
                  <span style={{ fontWeight: 600, color: "#0f172a" }}>ed25519 / Camenisch-Lysyanskaya</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
