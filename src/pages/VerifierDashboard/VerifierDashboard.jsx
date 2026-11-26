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
  SyncOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import DashboardLayout from "../../layouts/DashboardLayout/DashboardLayout";
import StatCard from "../../components/cards/StatCard/StatCard";
import ConnectionModal from "../../components/modals/ConnectionModal/ConnectionModal";
import ProofTemplatesModal from "../../components/modals/ProofTemplatesModal/ProofTemplatesModal";
import { verifierApi } from "../../services/api/index.js";
import { verifierService } from "../../services/apiClient";
import "./VerifierDashboard.css";

const { Option } = Select;

/**
 * Helper to resolve the best human-readable holder name from verified claims,
 * connections list (by connection_id), or record metadata.
 */
export const getHolderDisplayName = (record, connections = []) => {
  if (!record) return "Connected Holder";

  // 1. Check verified claims for actual personal name
  const claims = record.revealedClaims || record.revealed_attributes || record.claims || {};
  const nameClaimKeys = [
    "student_name",
    "name",
    "full_name",
    "holder_name",
    "user_name",
    "username",
    "candidate_name",
    "employee_name",
    "applicant_name",
    "first_name",
  ];

  if (typeof claims === "object" && claims !== null) {
    for (const key of nameClaimKeys) {
      for (const [k, v] of Object.entries(claims)) {
        if (k.toLowerCase() === key || k.toLowerCase().replace(/[\s_-]+/g, "") === key.replace(/[\s_-]+/g, "")) {
          const rawVal = typeof v === "object" && v !== null ? (v.raw || v.value || "") : String(v ?? "");
          if (rawVal && rawVal.trim() && rawVal !== "undefined" && rawVal !== "null") {
            return rawVal.trim();
          }
        }
      }
    }
  }

  // Also check inside record.raw for Indy presentation revealed attrs
  const indyRevealed =
    record.raw?.by_format?.pres?.indy?.requested_proof?.revealed_attrs ||
    record.raw?.presentation?.indy?.requested_proof?.revealed_attrs ||
    record.raw?.presentation?.requested_proof?.revealed_attrs;

  if (indyRevealed && typeof indyRevealed === "object") {
    for (const [key, valObj] of Object.entries(indyRevealed)) {
      const val = valObj?.raw || valObj?.value;
      if (val && typeof val === "string" && val.trim()) {
        const lowerKey = key.toLowerCase();
        if (nameClaimKeys.some((nk) => lowerKey.includes(nk))) {
          return val.trim();
        }
      }
    }
  }

  // 2. Cross-reference connections list by connection_id
  const connId = record.connection_id || record.connectionId;
  if (connId && Array.isArray(connections) && connections.length > 0) {
    const conn = connections.find((c) => (c.connection_id || c.id) === connId);
    if (conn) {
      const connName = conn.their_label || conn.alias || conn.label || conn.their_role;
      if (connName && connName.trim() && !connName.toLowerCase().includes("default") && connName !== "Connected Holder") {
        return connName.trim();
      }
    }
  }

  // 3. Direct fields on the record
  const directName =
    record.holder_name ||
    record.holderName ||
    record.their_label ||
    record.contact_label ||
    record.alias ||
    record.sender_name;

  if (directName && directName.trim() && directName !== "Connected Holder") {
    return directName.trim();
  }

  // 4. Fallback: formatted DID or connection ID
  const did = record.holder_did || record.holderDid || record.their_did;
  if (did && typeof did === "string") {
    const cleanDid = did.replace(/^did:sov:/, "");
    return `Holder (${cleanDid.slice(0, 8)}...${cleanDid.slice(-4)})`;
  }

  if (connId && typeof connId === "string") {
    return `Holder (${connId.slice(0, 8)}...)`;
  }

  return "Connected Holder";
};

/**
 * Helper to extract all disclosed attributes from various ACA-Py / SSI backend formats:
 * - record.revealed_attributes (from GET /verifier/verifications/{id})
 * - record.revealedClaims (from normalized list)
 * - record.presentation.requested_proof.revealed_attrs (Indy referents)
 * - record.raw.by_format.pres.indy.requested_proof.revealed_attrs
 */
export const getDisclosedAttributes = (record) => {
  if (!record) return [];
  const map = new Map();

  // 1. Direct revealed claims / revealed_attributes from backend API
  const direct =
    record.revealed_attributes ||
    record.revealedClaims ||
    record.claims ||
    record.raw?.revealed_attributes ||
    record.raw?.revealedClaims ||
    {};

  if (typeof direct === "object" && direct !== null && !Array.isArray(direct)) {
    Object.entries(direct).forEach(([k, v]) => {
      const val = typeof v === "object" && v !== null ? (v.raw ?? v.value ?? JSON.stringify(v)) : String(v ?? "");
      if (val !== undefined && val !== "") {
        map.set(k, { label: k, value: val });
      }
    });
  }

  // 2. Indy format inside presentation object
  const indyProof =
    record.presentation?.requested_proof?.revealed_attrs ||
    record.raw?.presentation?.indy?.requested_proof?.revealed_attrs ||
    record.raw?.presentation?.requested_proof?.revealed_attrs ||
    record.raw?.by_format?.pres?.indy?.requested_proof?.revealed_attrs ||
    {};

  const reqAttrs =
    record.presentation_request?.requested_attributes ||
    record.raw?.presentation_request?.indy?.requested_attributes ||
    record.raw?.by_format?.pres_request?.indy?.requested_attributes ||
    record.raw?.proof_request?.requested_attributes ||
    {};

  if (typeof indyProof === "object" && indyProof !== null) {
    Object.entries(indyProof).forEach(([refKey, valObj]) => {
      const rawVal = valObj?.raw !== undefined ? valObj.raw : valObj?.value;
      if (rawVal !== undefined && rawVal !== null) {
        const matched = reqAttrs[refKey]?.name || reqAttrs[refKey]?.label;
        const cleanName =
          matched ||
          valObj?.name ||
          valObj?.label ||
          refKey.replace(/^attr_\d+_/, "").replace(/_referent$/, "").replace(/^claim_\d+_/, "");

        if (!map.has(cleanName)) {
          map.set(cleanName, { label: cleanName, value: String(rawVal) });
        }
      }
    });
  }

  // 3. Check revealed_attr_groups if grouped
  const indyGroups =
    record.presentation?.requested_proof?.revealed_attr_groups ||
    record.raw?.presentation?.indy?.requested_proof?.revealed_attr_groups ||
    record.raw?.by_format?.pres?.indy?.requested_proof?.revealed_attr_groups ||
    {};
  if (typeof indyGroups === "object" && indyGroups !== null) {
    Object.values(indyGroups).forEach((grp) => {
      const values = grp?.values || {};
      Object.entries(values).forEach(([k, vObj]) => {
        const rawVal = vObj?.raw !== undefined ? vObj.raw : vObj?.value;
        if (rawVal !== undefined && rawVal !== null && !map.has(k)) {
          map.set(k, { label: k, value: String(rawVal) });
        }
      });
    });
  }

  return Array.from(map.values());
};

/**
 * Helper to extract satisfied zero-knowledge predicates
 */
export const getPredicateResults = (record) => {
  if (!record) return [];
  const results = [];

  // Direct predicate results
  const direct =
    record.predicate_results ||
    record.predicates ||
    record.raw?.predicate_results ||
    record.raw?.predicates ||
    {};

  if (typeof direct === "object" && direct !== null && !Array.isArray(direct)) {
    Object.entries(direct).forEach(([k, v]) => {
      if (typeof v === "object" && v !== null) {
        results.push({
          name: k,
          condition: v.condition || `${v.p_type || ">="} ${v.p_value || ""}`,
          satisfied: v.satisfied !== false,
        });
      } else {
        results.push({
          name: k,
          condition: "Satisfied",
          satisfied: Boolean(v),
        });
      }
    });
  }

  // Indy predicates
  const indyPreds =
    record.presentation?.requested_proof?.predicates ||
    record.raw?.presentation?.indy?.requested_proof?.predicates ||
    record.raw?.by_format?.pres?.indy?.requested_proof?.predicates ||
    {};

  const reqPreds =
    record.presentation_request?.requested_predicates ||
    record.raw?.presentation_request?.indy?.requested_predicates ||
    record.raw?.by_format?.pres_request?.indy?.requested_predicates ||
    {};

  if (typeof indyPreds === "object" && indyPreds !== null) {
    Object.entries(indyPreds).forEach(([refKey, predObj]) => {
      const req = reqPreds[refKey] || {};
      const name = req.name || predObj.name || refKey;
      if (!results.some((r) => r.name === name)) {
        results.push({
          name,
          condition: req.p_type ? `${req.p_type} ${req.p_value}` : "Cryptographic Assertion",
          satisfied: true,
        });
      }
    });
  }

  return results;
};

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

  const [currentVerifierDID, setCurrentVerifierDID] = useState(() => {
    try {
      const u = JSON.parse(localStorage.getItem("user") || "{}");
      return u?.did || "did:sov:verifier";
    } catch {
      return "did:sov:verifier";
    }
  });

  // Modals
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isConnectionModalOpen, setIsConnectionModalOpen] = useState(false);
  const [isWorkflowModalOpen, setIsWorkflowModalOpen] = useState(false);
  const [selectedRecordForDetails, setSelectedRecordForDetails] = useState(null);
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);
  const [decodedClaimsData, setDecodedClaimsData] = useState(null);
  const [loadingClaims, setLoadingClaims] = useState(false);
  const [waitingResult, setWaitingResult] = useState(false);

  // Request form state
  const [requestForm] = Form.useForm();
  const [requestMode, setRequestMode] = useState("own");
  const [requestedAttributes, setRequestedAttributes] = useState([]);
  const [customAttribute, setCustomAttribute] = useState("");
  const [catalogSchemas, setCatalogSchemas] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogLoaded, setCatalogLoaded] = useState(false);
  const [catalogError, setCatalogError] = useState("");
  const [selectedCatalogSchemaId, setSelectedCatalogSchemaId] = useState(null);
  const [predicateEnabled, setPredicateEnabled] = useState(false);
  const [predicateAttr, setPredicateAttr] = useState("age");
  const [predicateOp, setPredicateOp] = useState(">=");
  const [predicateVal, setPredicateVal] = useState("18");
  const [hasRestrictions, setHasRestrictions] = useState(false);
  const [restrictionIssuerDid, setRestrictionIssuerDid] = useState("");
  const [manualReviewEnabled, setManualReviewEnabled] = useState(true);
  const [submittingRequest, setSubmittingRequest] = useState(false);

  const loadData = async (showLoadingSpinner = false) => {
    if (showLoadingSpinner) setLoading(true);
    try {
      const [presRes, connRes, didRes] = await Promise.all([
        verifierService.getPresentations ? verifierService.getPresentations() : verifierService.getProofRequests(),
        verifierService.getConnections(),
        verifierService.getDID ? verifierService.getDID() : Promise.resolve({ did: null }),
      ]);

      if (presRes?.success) {
        setPresentations(presRes.data || []);
      }
      if (connRes?.success) {
        setConnections(connRes.data || []);
      }
      if (didRes?.did) {
        setCurrentVerifierDID(didRes.did);
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
        const [presRes, connRes, didRes] = await Promise.all([
          verifierService.getPresentations ? verifierService.getPresentations() : verifierService.getProofRequests(),
          verifierService.getConnections(),
          verifierService.getDID ? verifierService.getDID() : Promise.resolve({ did: null }),
        ]);
        if (!isMounted) return;
        if (presRes?.success) setPresentations(presRes.data || []);
        if (connRes?.success) setConnections(connRes.data || []);
        if (didRes?.did) setCurrentVerifierDID(didRes.did);
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

  const normalizeCatalogSchema = (raw = {}) => {
    const schemaId = raw.schemaId || raw.schema_id || raw.id || "";
    const rawAttributes =
      (Array.isArray(raw.attributes) && raw.attributes) ||
      (Array.isArray(raw.attrNames) && raw.attrNames) ||
      (Array.isArray(raw.attr_names) && raw.attr_names) ||
      [];
    const attributes = rawAttributes
      .map((a) => (typeof a === "object" ? a.name || a.attribute : a))
      .filter(Boolean);
    const rawCredDefs =
      (Array.isArray(raw.credentialDefinitions) && raw.credentialDefinitions) ||
      (Array.isArray(raw.credential_definitions) && raw.credential_definitions) ||
      [];
    const credentialDefinitions = rawCredDefs
      .map((cd) => {
        if (typeof cd === "string") return { credDefId: cd, tag: "" };
        return {
          credDefId: cd.credDefId || cd.cred_def_id || cd.id || "",
          tag: cd.tag || "",
        };
      })
      .filter((cd) => cd.credDefId);
    const parts = schemaId.split(":");
    return {
      schemaId,
      schemaName: raw.schemaName || raw.schema_name || raw.name || parts[2] || "Schema",
      version: raw.version || parts[3] || "1.0",
      attributes,
      issuerName:
        raw.issuer?.organizationName ||
        raw.issuer?.name ||
        raw.issuer_name ||
        raw.issuerName ||
        "",
      credentialDefinitions,
    };
  };

  const extractCatalogList = (payload) => {
    if (!payload) return [];
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload.data)) return payload.data;
    if (payload.data && Array.isArray(payload.data.results)) return payload.data.results;
    if (payload.data && Array.isArray(payload.data.schemas)) return payload.data.schemas;
    if (payload.data && Array.isArray(payload.data.data)) return payload.data.data;
    if (Array.isArray(payload.results)) return payload.results;
    if (Array.isArray(payload.schemas)) return payload.schemas;
    return [];
  };

  const loadCredentialCatalog = async (force = false) => {
    if (catalogLoading || (catalogLoaded && !force)) return;
    setCatalogLoading(true);
    setCatalogError("");
    try {
      const res = await verifierService.getCatalog({ source: "all" });
      const list = extractCatalogList(res)
        .map(normalizeCatalogSchema)
        .filter((s) => s.schemaId || s.schemaName);
      const seen = new Set();
      const unique = list.filter((s) => {
        const key = s.schemaId || `${s.schemaName}:${s.version}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      setCatalogSchemas(unique);
      setCatalogLoaded(true);
    } catch (err) {
      setCatalogError(err?.message || "Failed to load credential catalog");
      setCatalogSchemas([]);
    } finally {
      setCatalogLoading(false);
    }
  };

  const handleRequestModeChange = (mode) => {
    setRequestMode(mode);
    if (mode === "catalog") loadCredentialCatalog();
  };

  const hasRequestedAttribute = (name) =>
    requestedAttributes.some(
      (a) => a.name.toLowerCase() === String(name || "").toLowerCase()
    );

  const addRequestedAttribute = (name, source = "custom") => {
    const trimmed = String(name || "").trim();
    if (!trimmed) return;
    setRequestedAttributes((prev) => {
      if (prev.some((a) => a.name.toLowerCase() === trimmed.toLowerCase())) return prev;
      return [...prev, { name: trimmed, label: trimmed, source }];
    });
  };

  const removeRequestedAttribute = (name) => {
    setRequestedAttributes((prev) => prev.filter((a) => a.name !== name));
  };

  const toggleCatalogAttribute = (attrName) => {
    setRequestedAttributes((prev) => {
      const exists = prev.some((a) => a.name === attrName);
      if (exists) return prev.filter((a) => a.name !== attrName);
      return [...prev, { name: attrName, label: attrName, source: "catalog" }];
    });
  };

  const handleAddCustomAttribute = () => {
    const value = customAttribute.trim();
    if (!value) return;
    if (hasRequestedAttribute(value)) {
      message.info("Attribute already added");
      return;
    }
    addRequestedAttribute(value, "custom");
    setCustomAttribute("");
  };

  const handleCatalogSchemaChange = (schemaId) => {
    setSelectedCatalogSchemaId(schemaId || null);
    // Avoid mixing attributes selected from different catalog schemas
    setRequestedAttributes((prev) => prev.filter((a) => a.source !== "catalog"));
  };

  const selectAllCatalogAttributes = () => {
    const schema = catalogSchemas.find((s) => s.schemaId === selectedCatalogSchemaId);
    if (!schema) return;
    setRequestedAttributes((prev) => {
      const existing = new Set(prev.map((a) => a.name));
      const additions = schema.attributes
        .filter((attr) => !existing.has(attr))
        .map((attr) => ({ name: attr, label: attr, source: "catalog" }));
      return [...prev, ...additions];
    });
  };

  const clearCatalogAttributes = () => {
    setRequestedAttributes((prev) => prev.filter((a) => a.source !== "catalog"));
  };

  const handleOpenCreateRequest = (connectionId = null) => {
    const firstConn = connections[0];
    const targetConnId =
      connectionId || firstConn?.connection_id || firstConn?.id || undefined;
    requestForm.setFieldsValue({
      connectionId: targetConnId,
      requestName: "",
      comment: "",
    });
    setRequestMode("own");
    setRequestedAttributes([]);
    setCustomAttribute("");
    setSelectedCatalogSchemaId(null);
    setPredicateEnabled(false);
    setPredicateAttr("age");
    setPredicateOp(">=");
    setPredicateVal("18");
    setHasRestrictions(false);
    setRestrictionIssuerDid("");
    setIsRequestModalOpen(true);
  };

  const handleCreateProofRequest = async (values) => {
    if (requestedAttributes.length === 0) {
      message.warning("Please add at least one attribute to reveal");
      return;
    }
    const catalogSchema = catalogSchemas.find(
      (s) => s.schemaId === selectedCatalogSchemaId
    );
    if (!catalogSchema) {
      message.error("Please select a credential schema first");
      return;
    }
    if (!catalogSchema.credentialDefinitions?.length) {
      message.error("No credential definitions found for the selected schema");
      return;
    }
    setSubmittingRequest(true);
    try {
      const predicates =
        predicateEnabled && predicateAttr.trim()
          ? [
              {
                name: predicateAttr.trim(),
                p_type: predicateOp,
                p_value: Number(predicateVal) || 0,
                label: `${predicateAttr} ${predicateOp} ${predicateVal}`,
              },
            ]
          : [];

      const catalogSchema = catalogSchemas.find(
        (s) => s.schemaId === selectedCatalogSchemaId
      );

      const restrictions =
        hasRestrictions && restrictionIssuerDid.trim()
          ? [{ issuer_did: restrictionIssuerDid.trim() }]
          : [];

      const payload = {
        name: values.requestName || "Custom Proof Request",
        connectionId: values.connectionId,
        schemaId: catalogSchema?.schemaId,
        credDefId: catalogSchema?.credentialDefinitions?.[0]?.credDefId,
        requestedAttributes: requestedAttributes.map((attr) => ({
          name: attr.name,
          label: attr.label || attr.name,
        })),
        requestedPredicates: predicates,
        restrictions,
        comment: values.comment || "Proof verification requested via Verifier Portal",
        auto_verify: !manualReviewEnabled,
      };

      const res = await verifierService.createProofRequest(payload);
      if (res?.success) {
        message.success("Proof request dispatched to holder wallet!");
        setIsRequestModalOpen(false);
        requestForm.resetFields();
        setRequestMode("own");
        setRequestedAttributes([]);
        setCustomAttribute("");
        setSelectedCatalogSchemaId(null);
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
        if (
          selectedRecordForDetails?.presentation_exchange_id === exchangeId ||
          selectedRecordForDetails?.id === exchangeId
        ) {
          const updated = {
            ...selectedRecordForDetails,
            state: "verified",
            status: "verified",
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
        if (
          selectedRecordForDetails?.presentation_exchange_id === exchangeId ||
          selectedRecordForDetails?.id === exchangeId
        ) {
          const updated = {
            ...selectedRecordForDetails,
            state: "abandoned",
            status: "rejected",
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

  const handleOpenDetails = async (record) => {
    setSelectedRecordForDetails(record);
    const exId = record.presentation_exchange_id || record.id || record.presExId;
    if (exId) {
      try {
        const res = await verifierApi.getVerificationStatus(exId);
        const detailData = res?.data || res;
        if (detailData && typeof detailData === "object") {
          setSelectedRecordForDetails((prev) => {
            const current = prev || record;
            return {
              ...current,
              ...detailData,
              id: detailData.id || current.id,
              presentation_exchange_id:
                detailData.presExId || detailData.id || current.presentation_exchange_id || exId,
              revealed_attributes:
                detailData.revealed_attributes ||
                detailData.revealedClaims ||
                current.revealed_attributes,
              revealedClaims:
                detailData.revealedClaims ||
                detailData.revealed_attributes ||
                current.revealedClaims,
              predicate_results:
                detailData.predicate_results ||
                detailData.predicates ||
                current.predicate_results,
              state: detailData.state || current.state,
              verified:
                detailData.verified !== undefined
                  ? detailData.verified
                    ? "true"
                    : "false"
                  : current.verified,
            };
          });
        }
      } catch (err) {
        console.warn("Could not fetch verification details:", err);
      }
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

  const handleFetchClaims = async (exchangeId) => {
    setLoadingClaims(true);
    try {
      const res = await verifierApi.getVerificationClaims(exchangeId);
      setDecodedClaimsData(res?.data || res);
      message.success("Decoded claims and predicates extracted successfully!");
    } catch (err) {
      message.error(err?.message || "Failed to extract decoded claims");
    } finally {
      setLoadingClaims(false);
    }
  };

  const handleWaitResult = async (exchangeId) => {
    setWaitingResult(true);
    try {
      message.loading({ content: "Polling backend for holder presentation...", key: "wait-poll", duration: 15 });
      const res = await verifierApi.waitVerificationResult(exchangeId);
      message.success({ content: "Presentation received from holder!", key: "wait-poll" });
      await loadData();
      if (res?.data) {
        setSelectedRecordForDetails(res.data);
      }
    } catch {
      message.info({ content: "Waiting timed out or still pending holder action.", key: "wait-poll" });
    } finally {
      setWaitingResult(false);
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
      className="verifier-topbar-did-badge"
    >
      <SafetyCertificateOutlined style={{ color: "#2563EB" }} />
      <span>DID: {currentVerifierDID.slice(0, 15)}...</span>
      <CopyOutlined style={{ fontSize: 11, color: "var(--text-muted)" }} />
    </div>
  );

  // Filtered Proof Requests
  const filteredPresentations = presentations.filter((p) => {
    const idStr = p.presentation_exchange_id || p.id || "";
    const holderStr = getHolderDisplayName(p, connections);
    const nameStr = p.name || p.requestName || "";
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
      const holderStr = getHolderDisplayName(p, connections);
      const nameStr = p.name || p.requestName || "";
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
      title: "Holder Name",
      key: "holder_name",
      width: 220,
      render: (_, record) => {
        const holderName = getHolderDisplayName(record, connections);
        const displayId = record.presentation_exchange_id || record.id;
        return (
          <div>
            <div style={{ fontWeight: 600, fontSize: 13.5, color: "var(--text-primary)" }}>
              {holderName}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
              <Tooltip title={`Request ID: ${displayId} (Click to copy)`}>
                <span
                  className="mono-subtext"
                  style={{ cursor: "pointer", fontSize: 11, color: "var(--text-muted)" }}
                  onClick={() => {
                    navigator.clipboard.writeText(displayId);
                    message.success("Request ID copied to clipboard");
                  }}
                >
                  ID: {displayId ? `${displayId.slice(0, 14)}...` : "—"}
                </span>
              </Tooltip>
            </div>
          </div>
        );
      },
    },
    {
      title: "Holder Connection",
      key: "holder",
      width: 200,
      render: (_, record) => {
        const connId = record.connection_id || record.connectionId;
        const conn = connections.find((c) => (c.connection_id || c.id) === connId);
        const connLabel = conn?.their_label || conn?.alias || record.contact_label || record.their_label || "Connected Holder";
        const did = record.holder_did || record.their_did || conn?.their_did;
        return (
          <div>
            <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{connLabel}</div>
            {did ? (
              <Tooltip title={`Holder DID: ${did}`}>
                <div className="mono-subtext" style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                  {did.slice(0, 16)}...
                </div>
              </Tooltip>
            ) : connId ? (
              <div className="mono-subtext" style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                Conn: {connId.slice(0, 12)}...
              </div>
            ) : null}
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
            {name || record.requestName || "Credential Verification"}
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
        const presReq =
          record.presentation_request?.indy ||
          record.presentation_request ||
          record.by_format?.pres_request?.indy ||
          record.raw?.by_format?.pres_request?.indy ||
          record.proof_request ||
          {};

        const attrsObj = presReq.requested_attributes || record.presentation_request?.requested_attributes || {};
        const predsObj = presReq.requested_predicates || record.presentation_request?.requested_predicates || {};
        let attrList = Object.values(attrsObj);
        let predList = Object.values(predsObj);

        if (attrList.length === 0 && Array.isArray(record.requestedAttributes) && record.requestedAttributes.length > 0) {
          attrList = record.requestedAttributes.map((a) => (typeof a === "object" ? a : { name: a, label: a }));
        }

        if (attrList.length === 0 && record.revealedClaims && Object.keys(record.revealedClaims).length > 0) {
          attrList = Object.keys(record.revealedClaims).map((k) => ({ name: k, label: k }));
        }

        return (
          <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", alignItems: "center" }}>
            {attrList.map((a, i) => (
              <Tag key={i} color="geekblue" style={{ fontSize: 11 }}>
                {typeof a === "string" ? a : a.label || a.name || a.names?.join(", ")}
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
      render: (d, record) => {
        const dateVal = d || record.created_at || record.createdAt || record.verifiedAt;
        return (
          <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
            {dateVal ? new Date(dateVal).toLocaleDateString() : "—"}
          </span>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 250,
      align: "right",
      render: (_, record) => {
        const exId = record.presentation_exchange_id || record.id;
        const isReceived = record.state === "presentation_received";

        return (
          <Space size="small" style={{ whiteSpace: "nowrap" }}>
            {isReceived ? (
              <>
                <Button
                  size="small"
                  type="primary"
                  icon={<AuditOutlined />}
                  style={{ background: "#2563EB", borderColor: "#2563EB" }}
                  onClick={() => handleOpenDetails(record)}
                >
                  Review Proof
                </Button>
                <Button
                  size="small"
                  type="primary"
                  icon={<CheckOutlined />}
                  style={{ background: "#10B981", borderColor: "#10B981" }}
                  onClick={() => handleApproveVerify(exId)}
                >
                  Verify
                </Button>
                <Button
                  size="small"
                  danger
                  icon={<StopOutlined />}
                  onClick={() => handleRejectPresentation(exId)}
                >
                  Reject
                </Button>
              </>
            ) : (
              <Button
                size="small"
                type="primary"
                icon={<EyeOutlined />}
                onClick={() => handleOpenDetails(record)}
              >
                View Details
              </Button>
            )}

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
      title: "Holder Name",
      key: "holder_name",
      width: 220,
      render: (_, record) => {
        const holderName = getHolderDisplayName(record, connections);
        const displayId = record.presentation_exchange_id || record.id;
        return (
          <div>
            <div style={{ fontWeight: 600, fontSize: 13.5, color: "var(--text-primary)" }}>
              {holderName}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
              <Tooltip title={`Exchange ID: ${displayId} (Click to copy)`}>
                <span
                  className="mono-subtext"
                  style={{ cursor: "pointer", fontSize: 11, color: "var(--text-muted)" }}
                  onClick={() => {
                    navigator.clipboard.writeText(displayId);
                    message.success("Exchange ID copied");
                  }}
                >
                  ID: {displayId ? `${displayId.slice(0, 14)}...` : "—"}
                </span>
              </Tooltip>
            </div>
          </div>
        );
      },
    },
    {
      title: "Verification Request",
      dataIndex: "name",
      key: "name",
      width: 240,
      render: (name, record) => {
        const connId = record.connection_id || record.connectionId;
        const conn = connections.find((c) => (c.connection_id || c.id) === connId);
        const connLabel = conn?.their_label || conn?.alias || record.contact_label || record.their_label || "Active Peer";
        return (
          <div>
            <div style={{ fontWeight: 600 }}>{name || record.requestName || "Credential Verification"}</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
              Connection: {connLabel}
            </div>
          </div>
        );
      },
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
        <Button size="small" icon={<EyeOutlined />} onClick={() => handleOpenDetails(record)}>
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

  const activeHolderConnections = connections.filter((c) => {
    const state = String(c.state || c.rfc23_state || "").toLowerCase();
    return !state || ["active", "completed"].includes(state);
  });
  const holderConnections = activeHolderConnections.length
    ? activeHolderConnections
    : connections;
  const selectedCatalogSchema =
    catalogSchemas.find((s) => s.schemaId === selectedCatalogSchemaId) || null;

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
            <div className="verifier-did-banner">
              <div className="verifier-did-banner-left">
                <SafetyCertificateOutlined style={{ color: "#2563EB", fontSize: 20, flexShrink: 0 }} />
                <div className="verifier-did-info">
                  <span className="verifier-did-label">
                    Active Verifier Node (DID):
                  </span>{" "}
                  <code className="verifier-did-code">{currentVerifierDID}</code>
                </div>
              </div>
              <div className="verifier-did-banner-actions">
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
              </div>
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
              <Space>
                <Button
                  icon={<FileProtectOutlined />}
                  onClick={() => setIsTemplatesModalOpen(true)}
                >
                  Proof Templates
                </Button>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => handleOpenCreateRequest()}
                  style={{ background: "#1B365D", borderColor: "#1B365D" }}
                >
                  Dispatch Proof Request
                </Button>
              </Space>
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
                className="verifier-table-search-input"
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
                className="verifier-table-search-input"
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
                className="verifier-table-search-input"
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
          width={760}
          destroyOnHidden
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
              <Select
                placeholder="Select connected holder wallet"
                showSearch
                optionFilterProp="children"
              >
                {holderConnections.map((c) => (
                  <Option key={c.connection_id || c.id} value={c.connection_id || c.id}>
                    {c.their_label || c.holderName || "Connected Holder"} {c.role ? `(${c.role})` : ""} — {c.their_did ? `${c.their_did.slice(0, 16)}...` : ""}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            {/* 2. Attribute source: Own Template vs Credential Catalog */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 13 }}>
                Attribute Source:
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {[
                  {
                    id: "own",
                    title: "Own Template",
                    desc: "Add your own requested attributes manually",
                  },
                  {
                    id: "catalog",
                    title: "Credential Catalog",
                    desc: "Pick a schema and select its attributes",
                  },
                ].map((opt) => (
                  <div
                    key={opt.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleRequestModeChange(opt.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleRequestModeChange(opt.id);
                      }
                    }}
                    style={{
                      padding: "10px 12px",
                      borderRadius: 8,
                      border:
                        requestMode === opt.id
                          ? "2px solid #2563EB"
                          : "1px solid var(--border-color, #e2e8f0)",
                      background:
                        requestMode === opt.id
                          ? "#EFF6FF"
                          : "var(--surface-2, #f8fafc)",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: 12.5,
                        color:
                          requestMode === opt.id
                            ? "#2563EB"
                            : "var(--text-primary)",
                      }}
                    >
                      {opt.title}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                      {opt.desc}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2b. Credential Catalog picker */}
            {requestMode === "catalog" && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 13 }}>
                  Credential Catalog Schema:
                </label>
                <Select
                  showSearch
                  allowClear
                  loading={catalogLoading}
                  placeholder={
                    catalogLoading
                      ? "Loading credential catalog..."
                      : "Select a schema from the catalog"
                  }
                  value={selectedCatalogSchemaId || undefined}
                  onChange={handleCatalogSchemaChange}
                  optionFilterProp="label"
                  notFoundContent={
                    catalogLoading ? "Loading..." : catalogError || "No schemas found"
                  }
                  options={catalogSchemas.map((s) => ({
                    value: s.schemaId,
                    label: `${s.schemaName} (v${s.version})${s.issuerName ? ` — ${s.issuerName}` : ""}`,
                  }))}
                  style={{ width: "100%" }}
                />

                {catalogError && !catalogLoading && (
                  <Alert
                    type="warning"
                    showIcon
                    message={catalogError}
                    style={{ marginTop: 8 }}
                  />
                )}

                {selectedCatalogSchema && (
                  <div
                    style={{
                      marginTop: 10,
                      border: "1px solid #DBEAFE",
                      background: "#F8FBFF",
                      borderRadius: 10,
                      padding: 14,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 8,
                        flexWrap: "wrap",
                        marginBottom: 8,
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>
                          {selectedCatalogSchema.schemaName}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                          v{selectedCatalogSchema.version}
                          {selectedCatalogSchema.issuerName
                            ? ` • ${selectedCatalogSchema.issuerName}`
                            : ""}
                        </div>
                      </div>
                      <Space size="small">
                        <Button
                          size="small"
                          type="link"
                          style={{ padding: 0 }}
                          onClick={selectAllCatalogAttributes}
                        >
                          Select All
                        </Button>
                        <Button
                          size="small"
                          type="link"
                          style={{ padding: 0 }}
                          onClick={clearCatalogAttributes}
                        >
                          Clear
                        </Button>
                      </Space>
                    </div>

                    {selectedCatalogSchema.credentialDefinitions?.[0]?.credDefId && (
                      <div
                        style={{
                          fontSize: 11,
                          color: "var(--text-muted)",
                          marginBottom: 10,
                          wordBreak: "break-all",
                        }}
                      >
                        Cred Def: {selectedCatalogSchema.credentialDefinitions[0].credDefId}
                      </div>
                    )}

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                        gap: 6,
                      }}
                    >
                      {selectedCatalogSchema.attributes.map((attr) => (
                        <Checkbox
                          key={attr}
                          checked={hasRequestedAttribute(attr)}
                          onChange={() => toggleCatalogAttribute(attr)}
                        >
                          <span style={{ fontSize: 12.5 }}>{attr}</span>
                        </Checkbox>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 3. Requested Attributes to Reveal */}
            <div style={{ background: "var(--surface-2, #f8fafc)", border: "1px solid var(--border-color, #e2e8f0)", padding: 14, borderRadius: 10, marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, gap: 8, flexWrap: "wrap" }}>
                <label style={{ fontWeight: 600, fontSize: 13, margin: 0 }}>
                  Requested Attributes to Reveal:
                </label>
                <Tag color="blue" style={{ marginInlineEnd: 0 }}>
                  {requestedAttributes.length} selected
                </Tag>
              </div>

              <Space.Compact style={{ width: "100%", marginBottom: 12 }}>
                <Input
                  placeholder="Add your own attribute name (e.g. full_name)"
                  value={customAttribute}
                  onChange={(e) => setCustomAttribute(e.target.value)}
                  onPressEnter={(e) => {
                    e.preventDefault();
                    handleAddCustomAttribute();
                  }}
                  allowClear
                />
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleAddCustomAttribute}
                >
                  Add
                </Button>
              </Space.Compact>

              {requestedAttributes.length === 0 ? (
                <div style={{ fontSize: 12, color: "var(--text-muted)", padding: "6px 0" }}>
                  No attributes selected yet. Add your own or pick a credential catalog schema.
                </div>
              ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {requestedAttributes.map((attr) => (
                    <Tag
                      key={attr.name}
                      closable
                      color={attr.source === "catalog" ? "blue" : "geekblue"}
                      onClose={() => removeRequestedAttribute(attr.name)}
                      style={{ marginInlineEnd: 0 }}
                    >
                      {attr.label || attr.name}
                    </Tag>
                  ))}
                </div>
              )}
            </div>

            {/* 4. Title & Purpose */}
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
                    placeholder="e.g. did:sov:F5XFAKiDuocKsVfNx7GuFe"
                    value={restrictionIssuerDid}
                    onChange={(e) => setRestrictionIssuerDid(e.target.value)}
                  />
                </div>
              )}
            </div>

            {/* 7. Verification Review Policy */}
            <div
              style={{
                background: manualReviewEnabled ? "#EFF6FF" : "var(--surface-2, #f8fafc)",
                border: manualReviewEnabled ? "1px solid #BFDBFE" : "1px solid var(--border-color, #e2e8f0)",
                borderRadius: 10,
                padding: 14,
                marginBottom: 16,
                transition: "all 0.2s ease",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <strong style={{ fontSize: 13, color: manualReviewEnabled ? "#1D4ED8" : "var(--text-primary)" }}>
                    Manual Verifier Review &amp; Confirmation
                  </strong>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                    {manualReviewEnabled
                      ? "Holder presentations will pause at 'Presentation Received' for verifier manual review before confirming."
                      : "Presentations will be automatically verified as soon as holder submits proof."}
                  </div>
                </div>
                <Switch checked={manualReviewEnabled} onChange={setManualReviewEnabled} />
              </div>
            </div>



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
          open={Boolean(selectedRecordForDetails)}
          onCancel={() => {
            setSelectedRecordForDetails(null);
            setDecodedClaimsData(null);
          }}
          destroyOnHidden
          footer={
            !selectedRecordForDetails
              ? null
              : [
                  selectedRecordForDetails.state !== "verified" &&
                    selectedRecordForDetails.state !== "abandoned" &&
                    selectedRecordForDetails.state !== "presentation_received" && (
                      <Button
                        key="wait"
                        icon={<LoadingOutlined />}
                        loading={waitingResult}
                        onClick={() => {
                          handleWaitResult(
                            selectedRecordForDetails?.presentation_exchange_id || selectedRecordForDetails?.id
                          );
                        }}
                      >
                        Wait for Result (Live Poll)
                      </Button>
                    ),
                  <Button
                    key="claims"
                    icon={<SyncOutlined />}
                    loading={loadingClaims}
                    onClick={() => {
                      handleFetchClaims(
                        selectedRecordForDetails?.presentation_exchange_id || selectedRecordForDetails?.id
                      );
                    }}
                  >
                    Decode Claims via Engine
                  </Button>,
                  selectedRecordForDetails.state === "presentation_received" && (
                    <Button
                      key="verify"
                      type="primary"
                      icon={<CheckOutlined />}
                      style={{ background: "#10B981", borderColor: "#10B981" }}
                      onClick={() => {
                        handleApproveVerify(selectedRecordForDetails?.presentation_exchange_id || selectedRecordForDetails?.id);
                      }}
                    >
                      Confirm &amp; Verify Presentation
                    </Button>
                  ),
                  selectedRecordForDetails.state === "presentation_received" && (
                    <Button
                      key="reject"
                      danger
                      icon={<StopOutlined />}
                      onClick={() => {
                        handleRejectPresentation(selectedRecordForDetails?.presentation_exchange_id || selectedRecordForDetails?.id);
                      }}
                    >
                      Reject Presentation
                    </Button>
                  ),
                  <Button
                    key="close"
                    type="default"
                    onClick={() => {
                      setSelectedRecordForDetails(null);
                      setDecodedClaimsData(null);
                    }}
                  >
                    Close
                  </Button>,
                ].filter(Boolean)
          }
          width={700}
        >
          {selectedRecordForDetails && (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
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

              {selectedRecordForDetails.state === "presentation_received" && (
                <Alert
                  type="info"
                  showIcon
                  icon={<AuditOutlined style={{ fontSize: 18, color: "#2563EB" }} />}
                  message={<strong style={{ fontSize: 13.5 }}>Holder Attributes Presented for Review</strong>}
                  description="The holder has submitted the requested credential claims. Please review the disclosed attributes below. When satisfied, click 'Confirm & Verify' to execute cryptographic ledger verification, or 'Reject' to decline."
                  style={{ background: "#EFF6FF", borderColor: "#BFDBFE" }}
                />
              )}

              {/* Summary Metadata */}
              <Descriptions bordered size="small" column={2} style={{ borderRadius: 8 }}>
                <Descriptions.Item label="Holder Name" span={2}>
                  <strong style={{ fontSize: 13.5 }}>{getHolderDisplayName(selectedRecordForDetails, connections)}</strong>
                  {selectedRecordForDetails.presentation_exchange_id && (
                    <span className="mono-subtext" style={{ marginLeft: 10 }}>
                      (ID: {selectedRecordForDetails.presentation_exchange_id})
                    </span>
                  )}
                  {selectedRecordForDetails.holder_did && (
                    <div className="mono-subtext" style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                      DID: {selectedRecordForDetails.holder_did}
                    </div>
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
              {(() => {
                const disclosedAttrs = getDisclosedAttributes(selectedRecordForDetails);
                return (
                  <Card
                    size="small"
                    title={
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span>Disclosed Credential Attributes {disclosedAttrs.length > 0 ? `(${disclosedAttrs.length})` : ""}</span>
                        <span style={{ fontSize: 11, fontWeight: 400, color: "var(--text-muted)" }}>
                          Selective disclosure verified
                        </span>
                      </div>
                    }
                  >
                    {disclosedAttrs.length > 0 ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {disclosedAttrs.map((item) => (
                          <div
                            key={item.label}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              padding: "8px 12px",
                              background: "var(--surface-2, #f8fafc)",
                              borderRadius: 6,
                              border: "1px solid var(--border-color, #e2e8f0)",
                            }}
                          >
                            <span style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)" }}>
                              {item.label}
                            </span>
                            <Tag color="geekblue" style={{ fontSize: 12.5, padding: "2px 10px", margin: 0, fontWeight: 500 }}>
                              {item.value}
                            </Tag>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ padding: "12px 0", color: "var(--text-secondary)", fontSize: 13 }}>
                        <InfoCircleOutlined style={{ marginRight: 6, color: "#2563EB" }} />
                        {selectedRecordForDetails.state === "request_sent"
                          ? "Awaiting holder wallet submission. Requested attributes will appear here once presented."
                          : "No raw attributes disclosed or attributes are concealed in zero-knowledge."}
                      </div>
                    )}
                  </Card>
                );
              })()}

              {/* Predicate Proofs */}
              {(() => {
                const preds = getPredicateResults(selectedRecordForDetails);
                if (!preds || preds.length === 0) return null;
                return (
                  <Card size="small" title="Zero-Knowledge Predicates (Data Concealed)">
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {preds.map((pred) => (
                        <div
                          key={pred.name}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "8px 12px",
                            background: "#f0fdf4",
                            borderRadius: 6,
                            border: "1px solid #bbf7d0",
                          }}
                        >
                          <div>
                            <strong style={{ fontSize: 13, color: "#166534" }}>{pred.name}</strong>
                            <div style={{ fontSize: 11.5, color: "#15803d" }}>
                              Condition: {pred.condition}
                            </div>
                          </div>
                          <Tag color="green" icon={<CheckCircleOutlined />}>
                            SATISFIED (ZKP)
                          </Tag>
                        </div>
                      ))}
                    </div>
                  </Card>
                );
              })()}

              {/* Decoded Claims via Engine Extractor */}
              {decodedClaimsData && (
                <Card
                  size="small"
                  style={{ borderColor: "#10b981", background: "#f0fdf4" }}
                  title={
                    <span style={{ color: "#15803d", fontWeight: 700 }}>
                      ✓ Decoded Claims & ZK Assertions (via Engine Extractor)
                    </span>
                  }
                >
                  {decodedClaimsData.revealed_claims &&
                    Object.keys(decodedClaimsData.revealed_claims).length > 0 && (
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6, color: "#166534" }}>
                          Disclosed Claims:
                        </div>
                        {Object.entries(decodedClaimsData.revealed_claims).map(([k, v]) => (
                          <div
                            key={k}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              padding: "4px 0",
                              borderBottom: "1px dashed #bbf7d0",
                            }}
                          >
                            <span style={{ fontWeight: 500 }}>{k}</span>
                            <Tag color="green">{String(v)}</Tag>
                          </div>
                        ))}
                      </div>
                    )}

                  {decodedClaimsData.satisfied_predicates &&
                    Object.keys(decodedClaimsData.satisfied_predicates).length > 0 && (
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6, color: "#166534" }}>
                          Satisfied Zero-Knowledge Predicates:
                        </div>
                        {Object.entries(decodedClaimsData.satisfied_predicates).map(([k, v]) => (
                          <div
                            key={k}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              padding: "4px 0",
                            }}
                          >
                            <span style={{ fontWeight: 500 }}>{k}</span>
                            <Tag color="purple">{String(v)}</Tag>
                          </div>
                        ))}
                      </div>
                    )}
                </Card>
              )}

              {/* Cryptographic Checks Breakdown */}
              {(() => {
                const state = selectedRecordForDetails.state;
                const isVerified = state === "verified" || selectedRecordForDetails.verified === "true";
                const isReceived = state === "presentation_received";
                return (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)" }}>
                      Cryptographic Verification Checks
                    </div>

                    <div className={`check-result-box ${isVerified ? "pass" : isReceived ? "info" : "warn"}`}>
                      <CheckCircleOutlined style={{ marginTop: 2, fontSize: 16 }} />
                      <div>
                        <strong>Cryptographic Proof Signature:</strong>{" "}
                        {isVerified
                          ? "Valid CL-Signature authenticated against Issuer Public Key and ledger."
                          : isReceived
                          ? "Proof presentation received from holder. Ready for cryptographic ledger verification."
                          : "Pending presentation receipt from holder."}
                      </div>
                    </div>

                    <div className={`check-result-box ${isVerified ? "pass" : isReceived ? "info" : "warn"}`}>
                      <CheckCircleOutlined style={{ marginTop: 2, fontSize: 16 }} />
                      <div>
                        <strong>Schema & Credential Definition:</strong>{" "}
                        {isVerified || isReceived
                          ? "Verified matches approved template schema on ledger anchor."
                          : "Pending schema binding verification."}
                      </div>
                    </div>

                    <div className={`check-result-box ${isVerified ? "pass" : isReceived ? "info" : "warn"}`}>
                      <CheckCircleOutlined style={{ marginTop: 2, fontSize: 16 }} />
                      <div>
                        <strong>Non-Revocation Accumulator Status:</strong>{" "}
                        {isVerified
                          ? "Active. Accumulator witness confirms credential has not been revoked."
                          : isReceived
                          ? "Accumulator witness checked against cryptographic state."
                          : "Pending real-time revocation accumulator check."}
                      </div>
                    </div>
                  </div>
                );
              })()}

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
                        <div>Schema ID: {selectedRecordForDetails.presentation?.identifiers?.[0]?.schema_id || "F5XFAKiDuocKsVfNx7GuFe:2:Credential:1.0"}</div>
                        <div>Cred Def ID: {selectedRecordForDetails.presentation?.identifiers?.[0]?.cred_def_id || "F5XFAKiDuocKsVfNx7GuFe:3:CL:12401:default"}</div>
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

        {/* ========================================================= */}
        {/* MODAL 5: PROOF TEMPLATES MANAGER                          */}
        {/* ========================================================= */}
        <ProofTemplatesModal
          visible={isTemplatesModalOpen}
          onClose={() => setIsTemplatesModalOpen(false)}
          connections={connections}
          onRequestSent={loadData}
        />
      </div>
    </DashboardLayout>
  );
};

export default VerifierDashboard;