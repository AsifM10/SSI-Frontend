import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectUser } from "../../store/slices/authSlice";
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
  Popconfirm,
  Tooltip,
  Tabs,
  Popover,
  Avatar,
  Steps,
  Alert,
  Descriptions,
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
  ArrowLeftOutlined,
  DatabaseOutlined,
  DeploymentUnitOutlined,
  InfoCircleOutlined,
  CommentOutlined,
  ApartmentOutlined,
  GlobalOutlined,
  FieldStringOutlined,
} from "@ant-design/icons";
import DashboardLayout from "../../layouts/DashboardLayout/DashboardLayout";
import StatCard from "../../components/cards/StatCard/StatCard";
import ConnectionModal from "../../components/modals/ConnectionModal/ConnectionModal";
import ViewTemplateModal from "../../components/modals/ViewTemplateModal/ViewTemplateModal";
import CredentialDetailsModal from "../../components/modals/CredentialDetailsModal/CredentialDetailsModal";
import { issuerService, buildRequiredHolderAttributes } from "../../services/apiClient";
import "./IssuerDashboard.css";
import "../../components/modals/ViewTemplateModal/ViewTemplateModal.css";

const { Option } = Select;

const IssuerDashboard = ({ activeTab = "dashboard" }) => {
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const [loading, setLoading] = useState(true);
  const [didInfo, setDidInfo] = useState(null);
  const [dashboardStats, setDashboardStats] = useState({});
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

  // Schema form & wizard state
  const [schemaCreationStep, setSchemaCreationStep] = useState(0);
  const [schemaPreviewData, setSchemaPreviewData] = useState(null);
  const [isPublishingSchema, setIsPublishingSchema] = useState(false);
  const [schemaAttributes, setSchemaAttributes] = useState(["fullName", "email", "role"]);
  const [newAttributeInput, setNewAttributeInput] = useState("");
  const [publishingCredDefSchemaId, setPublishingCredDefSchemaId] = useState(null);

  // Issue dynamic form
  const [selectedCredDefForIssue, setSelectedCredDefForIssue] = useState(null);
  const [loadingIssueAttributes, setLoadingIssueAttributes] = useState(false);
  const [issueForm] = Form.useForm();
  const [schemaForm] = Form.useForm();
  const [credDefForm] = Form.useForm();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [didRes, schemaRes, defRes, connRes, actRes, propRes, statsRes] = await Promise.all([
        issuerService.getDID().catch(() => ({ success: true, did: null })),
        issuerService.getSchemas().catch(() => ({ success: true, data: [] })),
        issuerService.getCredentialDefinitions().catch(() => ({ success: true, data: [] })),
        issuerService.getConnections().catch(() => ({ success: true, data: [] })),
        issuerService.getIssuanceActivity().catch(() => ({ success: true, data: [] })),
        issuerService.getProposals ? issuerService.getProposals().catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
        issuerService.getDashboardStats ? issuerService.getDashboardStats().catch(() => ({ success: true, data: {} })) : Promise.resolve({ success: true, data: {} }),
      ]);

      if (didRes?.success && didRes.data) setDidInfo(didRes.data);
      if (statsRes?.data) setDashboardStats(statsRes.data);

      const rawSchemas = Array.isArray(schemaRes?.data) ? schemaRes.data : [];
      const rawDefs = Array.isArray(defRes?.data) ? defRes.data : [];

      const currentIssuerDid = (
        didRes?.data?.rawDid ||
        didRes?.data?.did ||
        didInfo?.rawDid ||
        didInfo?.did ||
        user?.rawDid ||
        user?.did ||
        "KkFmaEgH6pkHJGnyMtpBm2"
      ).replace(/^did:sov:/, "");

      const enrichedDefs = rawDefs.map((def) => {
        const parts = String(def.id || def.cred_def_id || "").split(":");
        const seqNo = def.seqNo || (parts.length >= 4 && !isNaN(Number(parts[3])) ? parts[3] : null);
        const matchingSchema = rawSchemas.find(
          (s) =>
            s.id === def.schemaId ||
            s.schema_id === def.schemaId ||
            (seqNo && String(s.seqNo) === String(seqNo)) ||
            (s.seqNo && def.id && def.id.includes(`:${s.seqNo}:`))
        );
        let finalId = def.id || def.cred_def_id;
        if (!finalId || !finalId.includes(":3:CL:")) {
          const sNo = seqNo || matchingSchema?.seqNo;
          if (sNo) finalId = `${currentIssuerDid}:3:CL:${sNo}:${def.tag || "default"}`;
        }
        return {
          ...def,
          id: finalId,
          cred_def_id: finalId,
          credentialDefinitionId: finalId,
          seqNo: seqNo || matchingSchema?.seqNo,
          schemaName: matchingSchema?.name || matchingSchema?.schemaName || def.schemaName || def.tag || "Credential Template",
          schemaId: matchingSchema?.id || def.schemaId,
          attributes: matchingSchema?.attributes || def.attributes || [],
        };
      });

      // Cross-link schemas and credential definitions so both hold references to each other
      const schemasWithCredDefs = rawSchemas.map((s) => {
        const matchingDef = enrichedDefs.find(
          (d) =>
            d.schemaId === s.id ||
            d.schema_id === s.id ||
            (s.seqNo && String(d.seqNo) === String(s.seqNo)) ||
            (d.id && s.seqNo && d.id.includes(`:${s.seqNo}:`)) ||
            (s.name && d.schemaName && d.schemaName.toLowerCase() === s.name.toLowerCase()) ||
            (d.tag && s.name && s.name.toLowerCase().includes(d.tag.toLowerCase()))
        );
        return {
          ...s,
          credDefId: matchingDef?.id || matchingDef?.cred_def_id || null,
          cred_def_id: matchingDef?.id || matchingDef?.cred_def_id || null,
          credDefTag: matchingDef?.tag || null,
        };
      });

      // Also enrich defs with matching schema names and attributes
      enrichedDefs.forEach((d) => {
        const matchingSchema = schemasWithCredDefs.find(
          (s) =>
            s.id === d.schemaId ||
            s.schema_id === d.schemaId ||
            (d.seqNo && String(s.seqNo) === String(d.seqNo)) ||
            (s.seqNo && d.id && d.id.includes(`:${s.seqNo}:`)) ||
            (s.name && d.schemaName && d.schemaName.toLowerCase() === s.name.toLowerCase()) ||
            (d.tag && s.name && (s.name.toLowerCase().includes(d.tag.toLowerCase()) || d.tag.toLowerCase().includes(s.name.toLowerCase())))
        );
        if (matchingSchema) {
          d.schemaName = matchingSchema.name || matchingSchema.schemaName || d.schemaName;
          const sAttrs =
            matchingSchema.attributes && matchingSchema.attributes.length > 0
              ? matchingSchema.attributes
              : matchingSchema.attrNames && matchingSchema.attrNames.length > 0
                ? matchingSchema.attrNames
                : [];
          if ((!d.attributes || d.attributes.length === 0) && sAttrs.length > 0) {
            d.attributes = sAttrs;
          }
          d.schemaId = matchingSchema.id || d.schemaId;
        }
      });

      setSchemas(schemasWithCredDefs);
      setCredDefs(enrichedDefs);
      if (enrichedDefs.length > 0 && !selectedCredDefForIssue) {
        setSelectedCredDefForIssue(enrichedDefs[0]);
      }
      if (connRes?.success) setConnections(Array.isArray(connRes.data) ? connRes.data : []);
      if (actRes?.success) setActivities(Array.isArray(actRes.data) ? actRes.data : []);
      if (propRes?.success) setProposals(Array.isArray(propRes.data) ? propRes.data : []);
    } catch {
      message.error("Failed to load issuer data");
    } finally {
      setLoading(false);
    }
  }, [selectedCredDefForIssue]);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      await loadData();
      if (!isMounted) return;
    })();
    return () => {
      isMounted = false;
    };
  }, [loadData]);

  const userDid = user?.did || (user?.rawDid ? (user.rawDid.startsWith("did:") ? user.rawDid : `did:sov:${user.rawDid}`) : null);
  const fetchedDid = didInfo?.did || (didInfo?.rawDid ? (didInfo.rawDid.startsWith("did:") ? didInfo.rawDid : `did:sov:${didInfo.rawDid}`) : null);
  const currentIssuerDID = fetchedDid || userDid || null;
  const isWalletProvisioned = Boolean(currentIssuerDID || (user?.tenantId && user?.walletId));

  const handleCopyDID = () => {
    if (!currentIssuerDID) {
      message.warning("DID not yet provisioned on ledger. Wallet provisioning required.");
      return;
    }
    navigator.clipboard.writeText(currentIssuerDID);
    message.success("DID copied to clipboard!");
  };

  // Create Schema Wizard Handlers
  const handleOpenCreateSchemaModal = () => {
    setSchemaCreationStep(0);
    setSchemaPreviewData(null);
    setIsSchemaModalOpen(true);
  };

  const handleCloseCreateSchemaModal = () => {
    setIsSchemaModalOpen(false);
    setSchemaCreationStep(0);
    setSchemaPreviewData(null);
  };

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

  const applyAttributePreset = (presetName) => {
    if (presetName === "student") {
      schemaForm.setFieldsValue({ name: "Degree Certificate", version: "1.0" });
      setSchemaAttributes(["studentId", "fullName", "degreeName", "major", "graduationDate", "gpa", "institution"]);
    } else if (presetName === "employee") {
      schemaForm.setFieldsValue({ name: "Corporate Employee ID", version: "1.0" });
      setSchemaAttributes(["employeeId", "fullName", "jobTitle", "department", "email", "dateOfJoining", "securityClearance"]);
    } else if (presetName === "citizen") {
      schemaForm.setFieldsValue({ name: "Citizen Identity Card", version: "1.0" });
      setSchemaAttributes(["citizenId", "fullName", "dob", "gender", "address", "state", "issuingAuthority"]);
    }
    message.info(`Applied '${presetName}' template attributes!`);
  };

  const handleProceedToPreview = async () => {
    try {
      const values = await schemaForm.validateFields();
      if (schemaAttributes.length === 0) {
        message.warning("Please specify at least one attribute for the schema");
        return;
      }
      setSchemaPreviewData({
        name: values.name.trim(),
        version: (values.version || "1.0").trim(),
        tag: (values.tag || "default").trim(),
        supportRevocation: values.supportRevocation !== false,
        attributes: [...schemaAttributes],
      });
      setSchemaCreationStep(1);
    } catch {
      // form validation failed
    }
  };

  const handleBackToEditSchema = () => {
    setSchemaCreationStep(0);
  };

  const handleFinalPublishSchema = async () => {
    if (!schemaPreviewData) return;
    setIsPublishingSchema(true);
    try {
      // Use the unified schema & credential definition creation API:
      // POST http://10.210.13.22:5000/api/v1/issuer/credential-definitions
      const name = schemaPreviewData.name.trim();
      const version = (schemaPreviewData.version || "1.0").trim();
      const tag = (schemaPreviewData.tag || "default").trim();
      const supportRevocation = Boolean(schemaPreviewData.supportRevocation);
      const attrs = schemaPreviewData.attributes || [];

      const payload = {
        schemaName: name,
        schema_name: name,
        schemaVersion: version,
        schema_version: version,
        attributes: attrs,
        requiredHolderAttributes: buildRequiredHolderAttributes(attrs),
        issuanceMode: "AUTO_ISSUE",
        tag: tag,
        support_revocation: supportRevocation,
        supportRevocation: supportRevocation,
      };

      const res = await issuerService.createSchemaAndCredDef(payload);

      if (
        res?.success ||
        res?.credential_definition_id ||
        res?.data?.credential_definition_id ||
        res?.schema_id ||
        res?.data?.schema_id ||
        res?.id
      ) {
        message.success(`Schema '${name}' & Credential Definition registered on ledger!`);
        setIsSchemaModalOpen(false);
        setSchemaCreationStep(0);
        setSchemaPreviewData(null);
        schemaForm.resetFields();
        setSchemaAttributes(["fullName", "email", "role"]);
        await loadData();
      } else {
        message.error(res?.message || "Failed to create Schema & Credential Definition");
      }
    } catch (err) {
      message.error(err.message || "Failed to publish schema & cred def to ledger");
    } finally {
      setIsPublishingSchema(false);
    }
  };

  // Publish Credential Definition for an existing schema
  const handlePublishCredDefForSchema = async (schemaRecord) => {
    if (!schemaRecord?.id) return;
    setPublishingCredDefSchemaId(schemaRecord.id);
    try {
      const attrs = schemaRecord.attributes || [];
      const res = await issuerService.createCredentialDefinition({
        schemaId: schemaRecord.id,
        schemaName: schemaRecord.name,
        schemaVersion: schemaRecord.version || "1.0",
        attributes: attrs,
        requiredHolderAttributes: buildRequiredHolderAttributes(attrs),
        issuanceMode: "AUTO_ISSUE",
        tag: "default",
        supportRevocation: false,
        revocationRegistrySize: 1000,
      });
      if (res?.success) {
        message.success(`Credential Definition registered on ledger for '${schemaRecord.name}'!`);
        await loadData();
      } else {
        message.error(res?.message || "Failed to publish Credential Definition");
      }
    } catch (err) {
      message.error(err?.message || "Failed to publish Credential Definition to ledger");
    } finally {
      setPublishingCredDefSchemaId(null);
    }
  };

  // Create Credential Definition from modal
  const handleCreateCredDef = async (values) => {
    try {
      const targetSchema = schemas.find(s => s.id === values.schemaId);
      const attrs = targetSchema?.attributes || [];
      const res = await issuerService.createCredentialDefinition({
        schemaId: values.schemaId,
        schemaName: targetSchema?.name,
        schemaVersion: targetSchema?.version || "1.0",
        attributes: attrs,
        requiredHolderAttributes: buildRequiredHolderAttributes(attrs),
        issuanceMode: "AUTO_ISSUE",
        tag: values.tag || "default",
        supportRevocation: values.supportRevocation || false,
        revocationRegistrySize: values.revocationRegistrySize || 1000,
      });
      if (res?.success) {
        message.success("Credential Definition registered on ledger!");
        setIsCredDefModalOpen(false);
        credDefForm.resetFields();
        await loadData();
      } else {
        message.error(res?.message || "Failed to create Credential Definition");
      }
    } catch (err) {
      message.error(err.message || "Failed to create Credential Definition");
    }
  };

  // Dynamic Issue Credential
  const handleCredDefChange = async (defId) => {
    const found = credDefs.find((d) => d.id === defId);
    setSelectedCredDefForIssue(found || null);

    // If attributes are missing, dynamically fetch from ledger definition and schema
    if (found && (!found.attributes || found.attributes.length === 0)) {
      setLoadingIssueAttributes(true);
      try {
        const parts = String(found.id || "").split(":");
        const seqNo = found.seqNo || (parts.length >= 4 && !isNaN(Number(parts[3])) ? parts[3] : null);

        // 1. Check if matching schema exists in schemas
        const schemaList = Array.isArray(schemas) ? schemas : [];
        let matching = schemaList.find(
          (s) =>
            s.id === found.schemaId ||
            s.schema_id === found.schemaId ||
            (seqNo && String(s.seqNo) === String(seqNo)) ||
            (seqNo && s.id && s.id.includes(`:${seqNo}:`)) ||
            (s.name && found.schemaName && s.name.toLowerCase() === found.schemaName.toLowerCase()) ||
            (s.name && found.tag && s.name.toLowerCase() === found.tag.toLowerCase()) ||
            (s.name && found.tag && (s.name.toLowerCase().includes(found.tag.toLowerCase()) || found.tag.toLowerCase().includes(s.name.toLowerCase())))
        );

        const matchingAttrs =
          matching?.attributes && matching.attributes.length > 0
            ? matching.attributes
            : matching?.attrNames && matching.attrNames.length > 0
              ? matching.attrNames
              : [];

        if (matchingAttrs.length > 0) {
          found.attributes = matchingAttrs;
          found.schemaName = matching.name || matching.schemaName || found.schemaName;
          found.schemaId = matching.id || matching.schema_id;
          setSelectedCredDefForIssue({ ...found });
          setLoadingIssueAttributes(false);
          return;
        }

        // 2. Query Cred Def details from ledger
        let attrs = [];
        try {
          const cdRes = await issuerApi.getCredDef(found.id);
          const cd = cdRes?.data?.credential_definition || cdRes?.credential_definition || cdRes?.data || cdRes;
          const schemaIdFromCd = cd?.schemaId || cd?.schema_id || seqNo;

          if (cd?.value?.primary?.r) {
            attrs = Object.keys(cd.value.primary.r).filter((k) => k !== "master_secret");
          }

          if (attrs.length === 0 && schemaIdFromCd) {
            try {
              const sRes = await issuerApi.getSchema(schemaIdFromCd);
              const sData = sRes?.data?.schema || sRes?.schema || sRes?.data;
              const fetched = sData?.attrNames || sData?.attributes || sData?.attr_names || [];
              if (Array.isArray(fetched) && fetched.length > 0) {
                attrs = fetched;
              }
              if (sData?.name) {
                found.schemaName = sData.name;
              }
              found.schemaId = sData?.id || schemaIdFromCd;
            } catch {
              // ignore
            }
          }
        } catch {
          // ignore
        }

        if (attrs.length > 0) {
          found.attributes = attrs;
          setSelectedCredDefForIssue({ ...found });
        }
      } catch (err) {
        console.warn("Could not dynamically load cred def attributes:", err);
      } finally {
        setLoadingIssueAttributes(false);
      }
    }
  };

  const handleOpenIssueModal = () => {
    if (credDefs.length > 0) {
      const def = selectedCredDefForIssue || credDefs[0];
      setSelectedCredDefForIssue(def);
      issueForm.setFieldsValue({
        credentialDefinitionId: def.id,
        holderDid: connections[0]?.connection_id || connections[0]?.their_did || "",
      });
      if (def?.id) {
        handleCredDefChange(def.id);
      }
    }
    setIsIssueModalOpen(true);
  };

  const handleIssueCredential = async (values) => {
    try {
      if (!values.credentialDefinitionId) {
        message.warning("Please select a published Credential Template");
        return;
      }
      if (!values.holderDid) {
        message.warning("Please select a recipient holder");
        return;
      }

      // 1. Resolve true AnonCreds Credential Definition ID
      const selectedDef =
        credDefs.find((d) => d.id === values.credentialDefinitionId || d.cred_def_id === values.credentialDefinitionId) ||
        selectedCredDefForIssue ||
        credDefs[0];

      let effectiveCredDefId = selectedDef?.cred_def_id || selectedDef?.id || values.credentialDefinitionId;

      const targetSchema =
        schemas.find(
          (s) =>
            s.id === selectedDef?.schemaId ||
            s.schema_id === selectedDef?.schemaId ||
            (selectedDef?.seqNo && String(s.seqNo) === String(selectedDef.seqNo))
        ) ||
        schemas.find((s) => effectiveCredDefId && s.seqNo && effectiveCredDefId.includes(`:${s.seqNo}:`));

      const parts = String(effectiveCredDefId || "").split(":");
      const seqNo =
        selectedDef?.seqNo ||
        targetSchema?.seqNo ||
        (parts.length >= 4 && !isNaN(Number(parts[3])) ? parts[3] : "219");

      const issuerDid = (
        didInfo?.rawDid ||
        didInfo?.did ||
        user?.rawDid ||
        user?.did ||
        parts[0] ||
        "KkFmaEgH6pkHJGnyMtpBm2"
      ).replace(/^did:sov:/, "");

      if (!effectiveCredDefId || !effectiveCredDefId.includes(":3:CL:")) {
        if (seqNo) {
          effectiveCredDefId = `${issuerDid}:3:CL:${seqNo}:${selectedDef?.tag || "default"}`;
        }
      }

      // 2. Resolve recipient connection ID (UUID)
      const targetConn = connections.find(
        (c) =>
          c.connection_id === values.holderDid ||
          c.id === values.holderDid ||
          c.their_did === values.holderDid
      );
      const effectiveConnectionId = targetConn?.connection_id || targetConn?.id || values.holderDid;

      const schemaAttrs =
        selectedDef?.attributes && selectedDef.attributes.length > 0
          ? selectedDef.attributes
          : targetSchema?.attributes && targetSchema.attributes.length > 0
            ? targetSchema.attributes
            : activeCredDefSchema?.attributes && activeCredDefSchema.attributes.length > 0
              ? activeCredDefSchema.attributes
              : [];

      if (schemaAttrs.length === 0) {
        message.warning("Please wait for this template's claim attributes to load or select a published template.");
        return;
      }

      // 3. Build flat key-value attributes object strictly matching Swagger schema:
      // ex: { "student_name": "rahul Batham" }
      const attributesObject = {};

      schemaAttrs.forEach((attrName) => {
        // Case-insensitive lookup in form values so ledger schema match always succeeds
        const foundKey = Object.keys(values).find(
          (k) => k.toLowerCase() === attrName.toLowerCase()
        );
        const val = foundKey !== undefined && values[foundKey] !== undefined ? String(values[foundKey]) : "";
        attributesObject[attrName] = val;
      });

      // Fallback: if schemaAttrs didn't catch any, map all non-system values
      if (Object.keys(attributesObject).length === 0) {
        Object.entries(values).forEach(([k, v]) => {
          if (k !== "credentialDefinitionId" && k !== "holderDid" && v !== undefined && v !== null) {
            attributesObject[k] = String(v);
          }
        });
      }

      const schemaDetails = {
        seqNo,
        tag: selectedDef?.tag || "default",
        comment: "Direct student identity credential issuance",
      };

      const res = await issuerService.issueCredential(
        effectiveCredDefId,
        effectiveConnectionId,
        attributesObject,
        schemaDetails
      );
      if (res?.success) {
        message.success("Credential offer sent to holder!");
        setIsIssueModalOpen(false);
        issueForm.resetFields();
        await loadData();
      } else {
        message.error(res?.message || "Failed to issue credential");
      }
    } catch (err) {
      message.error(err?.message || "Failed to issue credential");
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
      const res = await issuerService.revokeCredential(selectedRecordToRevoke, revokeReason);
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

  const safeActivities = Array.isArray(activities) ? activities : [];
  const safeSchemas = Array.isArray(schemas) ? schemas : [];

  const filteredActivities = safeActivities.filter(
    (a) =>
      String(a?.id || a?.cred_ex_id || "").toLowerCase().includes(searchFilter.toLowerCase()) ||
      String(a?.holderDid || a?.holder_did || a?.holderName || "").toLowerCase().includes(searchFilter.toLowerCase())
  );

  const activeCredDefSchema = safeSchemas.find(
    (s) =>
      s?.id === selectedCredDefForIssue?.schemaId ||
      s?.schema_id === selectedCredDefForIssue?.schemaId ||
      (selectedCredDefForIssue?.seqNo && String(s?.seqNo) === String(selectedCredDefForIssue.seqNo)) ||
      (selectedCredDefForIssue?.id && s?.seqNo && selectedCredDefForIssue.id.includes(`:${s.seqNo}:`))
  );
  const currentAttributesForIssue =
    selectedCredDefForIssue?.attributes && selectedCredDefForIssue.attributes.length > 0
      ? selectedCredDefForIssue.attributes
      : activeCredDefSchema?.attributes && activeCredDefSchema.attributes.length > 0
        ? activeCredDefSchema.attributes
        : [];

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
      width: 240,
      render: (id, record) => {
        const found = credDefs.find(
          (d) =>
            d.id === id ||
            d.cred_def_id === id ||
            (record?.schemaName && d.schemaName?.toLowerCase() === record.schemaName?.toLowerCase()) ||
            (record?.schemaId && (d.schemaId === record.schemaId || d.id?.includes(`:${record.schemaId}:`)))
        );
        const schemaName =
          found?.schemaName ||
          (record?.schemaName && record.schemaName !== "Verifiable Credential" ? record.schemaName : null) ||
          (record?.schema_name && record.schema_name !== "Verifiable Credential" ? record.schema_name : null) ||
          found?.tag ||
          (id && id !== "N/A" ? id : "Verifiable Credential");

        const displayDefId = (id && id !== "N/A" ? id : found?.id) || "";

        return (
          <div style={{ maxWidth: 240 }}>
            <span style={{ fontWeight: 600, color: "var(--text-primary)", display: "block", wordBreak: "break-word" }}>
              {schemaName}
            </span>
            {displayDefId && displayDefId !== schemaName && (
              <span className="mono-subtext" style={{ fontSize: 11, display: "block" }}>
                {displayDefId.length > 28 ? `${displayDefId.slice(0, 16)}...${displayDefId.slice(-8)}` : displayDefId}
              </span>
            )}
          </div>
        );
      },
    },
    {
      title: "Holder DID",
      dataIndex: "holderDid",
      key: "holderDid",
      width: 200,
      render: (did, record) => {
        const matchingConn = connections.find(
          (c) =>
            c.connection_id === record?.connection_id ||
            c.id === record?.connection_id ||
            c.their_did === did
        );
        const label = matchingConn?.their_label || matchingConn?.alias || record?.holderName;
        return (
          <div>
            {label && label !== "Connected Holder" && label !== "Edge Holder" && (
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", display: "block" }}>
                {label}
              </span>
            )}
            <Tooltip title={did}>
              <span className="mono-subtext" style={{ whiteSpace: "nowrap" }}>
                {did ? `${did.slice(0, 16)}...${did.slice(-4)}` : "—"}
              </span>
            </Tooltip>
          </div>
        );
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 130,
      render: (status, record) => {
        const rawState = String(record?.raw?.state || record?.state || status || "").toLowerCase().replace(/_/g, "-");
        const isRevoked = record?.revocationStatus === "revoked" || record?.revoked || rawState === "deleted";
        const isIssued = [
          "credential-acked",
          "credential-issued",
          "credential-received",
          "done",
          "issued",
          "stored",
        ].includes(rawState);

        if (isRevoked) {
          return (
            <Tag color="error" icon={<CloseCircleOutlined />} style={{ whiteSpace: "nowrap" }}>
              REVOKED
            </Tag>
          );
        }
        return isIssued || status === "issued" ? (
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
            <Tag key={a} color="geekblue">{a}</Tag>
          ))}
        </div>
      ),
    },
    {
      title: "Cred Def ID",
      dataIndex: "credentialDefinitionId",
      key: "credentialDefinitionId",
      render: (_, record) => {
        const matching = credDefs.find(
          (cd) =>
            cd.schemaId === record.id ||
            cd.schema_id === record.id ||
            (record.seqNo && String(cd.seqNo) === String(record.seqNo)) ||
            (cd.id && record.seqNo && cd.id.includes(`:${record.seqNo}:`))
        );
        if (matching) {
          const cdId = matching.credentialDefinitionId || matching.id;
          return (
            <Tooltip title={cdId}>
              <Tag color="cyan" style={{ fontFamily: "monospace", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis" }}>
                {cdId}
              </Tag>
            </Tooltip>
          );
        }
        return (
          <Button
            size="small"
            type="primary"
            ghost
            loading={publishingCredDefSchemaId === record.id}
            onClick={() => handlePublishCredDefForSchema(record)}
            style={{ fontSize: 11 }}
          >
            Publish Cred Def
          </Button>
        );
      },
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
      render: (_, record) => {
        const matching = credDefs.find(
          (cd) =>
            cd.schemaId === record.id ||
            cd.schema_id === record.id ||
            (record.seqNo && String(cd.seqNo) === String(record.seqNo)) ||
            (cd.id && record.seqNo && cd.id.includes(`:${record.seqNo}:`))
        );
        return (
          <Space>
            <Button size="small" icon={<EyeOutlined />} onClick={() => setSelectedSchemaForView(record)}>
              View Template
            </Button>
            {!matching && (
              <Button
                size="small"
                type="primary"
                loading={publishingCredDefSchemaId === record.id}
                onClick={() => handlePublishCredDefForSchema(record)}
              >
                Create Cred Def
              </Button>
            )}
          </Space>
        );
      },
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
      title={currentIssuerDID ? `Click to copy Issuer DID (${currentIssuerDID})` : "DID Not Provisioned Yet (Pending Admin Approval / Provisioning)"}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 12px",
        borderRadius: 20,
        background: currentIssuerDID ? "var(--surface-2)" : "#FEF3C7",
        border: currentIssuerDID ? "1px solid var(--border-color)" : "1px solid #F59E0B",
        fontSize: 12,
        fontWeight: 600,
        color: currentIssuerDID ? "var(--text-primary)" : "#B45309",
        cursor: currentIssuerDID ? "pointer" : "default",
        transition: "all 0.2s ease",
      }}
    >
      <SafetyCertificateOutlined style={{ color: currentIssuerDID ? "#2563EB" : "#F59E0B" }} />
      <span>
        {currentIssuerDID
          ? `DID: ${currentIssuerDID.length > 22 ? `${currentIssuerDID.slice(0, 19)}...` : currentIssuerDID}`
          : "DID: Pending Provisioning"}
      </span>
      {currentIssuerDID && <CopyOutlined style={{ fontSize: 11, color: "var(--text-muted)" }} />}
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
                value={
                  dashboardStats?.totalIssuances ??
                  dashboardStats?.total_issuances ??
                  activities.length
                }
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
                value={
                  dashboardStats?.activeSchemas ??
                  dashboardStats?.active_schemas ??
                  schemas.length
                }
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
                value={
                  dashboardStats?.activeCredentials ??
                  dashboardStats?.active_credentials ??
                  activities.filter((a) => !a.revoked && a.revocationStatus !== "revoked").length
                }
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
                value={
                  dashboardStats?.connectedHolders ??
                  dashboardStats?.connected_holders ??
                  connections.length
                }
                label="Active Peer Connections"
                accent={{
                  color: "#2563EB",
                  bg: "#EFF6FF",
                  grad: "linear-gradient(135deg, #1B365D, #2563EB)",
                  icon: <TeamOutlined />,
                }}
              />
            </div>

            {/* Unprovisioned Tenant Sub-Wallet Alert */}
            {!isWalletProvisioned && (
              <div
                style={{
                  background: "#FFFBEB",
                  border: "1px solid #FDE68A",
                  borderRadius: 12,
                  padding: "16px 20px",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 14,
                }}
              >
                <InfoCircleOutlined style={{ color: "#D97706", fontSize: 22, marginTop: 2 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#92400E", marginBottom: 4 }}>
                    Tenant Sub-Wallet & Public DID Not Provisioned
                  </div>
                  <div style={{ fontSize: 13, color: "#78350F", lineHeight: 1.6 }}>
                    Your account registration status is <strong>"{user?.registrationStatus || 'APPROVED'}"</strong>, but its dedicated ACA-Py multi-tenant sub-wallet has not yet been initialized on the <strong>CDAC-SSI Ledger</strong>.
                    <br />
                    To provision the tenant sub-wallet and obtain a live public DID, execute the provisioning endpoint in Swagger:
                    <div style={{ marginTop: 8, padding: "8px 12px", background: "#FEF3C7", borderRadius: 6, fontFamily: "monospace", fontSize: 12 }}>
                      <strong>POST</strong> /api/v1/admin/registrations/{user?.userId || user?.id || "425d669b-477c-4182-854c-1611397edf1f"}/approve
                      <br />
                      <strong>Body:</strong> &#123; "walletName": "{(user?.username || 'asif_issuer')}_subwallet" &#125;
                    </div>
                  </div>
                </div>
              </div>
            )}

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
                <SafetyCertificateOutlined style={{ color: currentIssuerDID ? "#2563EB" : "#F59E0B", fontSize: 18 }} />
                <div>
                  <span style={{ fontSize: 11, textTransform: "uppercase", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.5px" }}>
                    Issuer Identity (DID):
                  </span>{" "}
                  {currentIssuerDID ? (
                    <code style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{currentIssuerDID}</code>
                  ) : (
                    <Tag color="warning" style={{ fontWeight: 700 }}>PENDING WALLET PROVISIONING</Tag>
                  )}
                </div>
              </div>
              <Button size="small" icon={<CopyOutlined />} onClick={handleCopyDID} disabled={!currentIssuerDID}>
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
                  <div className="telemetry-val">
                    <a
                      href="http://10.210.13.22:9000/"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "inherit", textDecoration: "none" }}
                    >
                      CDAC-SSI Ledger
                    </a>
                  </div>
                  <div className="telemetry-sub">Status: Synced • Running on port 9000</div>
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
                dataSource={safeActivities.slice(0, 3)}
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
              <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenCreateSchemaModal} style={{ background: "#1B365D", borderColor: "#1B365D", borderRadius: 8, fontWeight: 600 }}>
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
                            onClick={handleOpenIssueModal}
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
          destroyOnHidden
        >
          {credDefs.length === 0 && (
            <Alert
              type="warning"
              showIcon
              message="No Credential Definitions Registered"
              description={
                <span>
                  Before issuing credentials, you must publish a Credential Definition for a Schema. Please visit the{" "}
                  <a
                    onClick={() => {
                      setIsIssueModalOpen(false);
                      setActiveTab("schemas");
                    }}
                    style={{ fontWeight: 600, textDecoration: "underline" }}
                  >
                    Schemas & Templates tab
                  </a>{" "}
                  and click <strong>Publish Cred Def</strong>.
                </span>
              }
              style={{ marginBottom: 16 }}
            />
          )}

          {connections.length === 0 && (
            <Alert
              type="info"
              showIcon
              message="No Active Peer Connections"
              description="You need at least one connected Holder wallet to issue a credential. Please use the Connections tab or QR code to connect with a Holder."
              style={{ marginBottom: 16 }}
            />
          )}

          <Form
            form={issueForm}
            layout="vertical"
            onFinish={handleIssueCredential}
            initialValues={{
              credentialDefinitionId: selectedCredDefForIssue?.id || credDefs[0]?.id || "",
              holderDid: connections[0]?.connection_id || connections[0]?.their_did || "",
            }}
            style={{ marginTop: 16 }}
          >
            <Form.Item
              name="credentialDefinitionId"
              label="Select Credential Schema / Template"
              rules={[{ required: true, message: "Please select a credential template" }]}
            >
              <Select onChange={handleCredDefChange} placeholder="Select Credential Template">
                {credDefs.map((def) => {
                  const displayName =
                    def.schemaName && def.schemaName !== "Credential Template"
                      ? def.schemaName
                      : (def.tag || def.id);
                  const tagSuffix =
                    def.tag && def.tag !== displayName && def.tag !== "default"
                      ? ` (${def.tag})`
                      : def.tag === "default" && def.schemaName && def.schemaName !== "default"
                        ? " (default)"
                        : "";
                  const label = `${displayName}${tagSuffix}`;
                  return (
                    <Option key={def.id} value={def.id}>
                      {label}
                    </Option>
                  );
                })}
              </Select>
            </Form.Item>

            <Form.Item
              name="holderDid"
              label="Recipient Holder Connection"
              rules={[{ required: true, message: "Please select recipient" }]}
            >
              <Select placeholder="Select connected holder">
                {connections.map((conn) => (
                  <Option key={conn.connection_id || conn.id} value={conn.connection_id || conn.id || conn.their_did}>
                    {conn.their_label || conn.holderName || "Connected Peer"} {conn.their_did ? `(${conn.their_did.slice(0, 16)}...)` : `[${conn.connection_id?.slice(0, 8)}...]`}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <div style={{ marginTop: 16, marginBottom: 8 }}>
              <strong style={{ fontSize: 13, color: "var(--text-primary)" }}>
                Schema Attributes for '{activeCredDefSchema?.name || selectedCredDefForIssue?.schemaName || "Selected Schema"}':
              </strong>
            </div>

            <div style={{ background: "rgba(0,0,0,0.02)", padding: 12, borderRadius: 8, marginBottom: 16 }}>
              {loadingIssueAttributes ? (
                <div style={{ textAlign: "center", padding: "16px 8px" }}>
                  <Spin indicator={<SyncOutlined spin style={{ fontSize: 20, color: "#2563eb" }} />} />
                  <div style={{ marginTop: 8, fontSize: 13, color: "#64748b" }}>
                    Fetching claim attributes from ledger definition...
                  </div>
                </div>
              ) : currentAttributesForIssue.length === 0 ? (
                <div style={{ color: "#64748b", fontSize: 13, padding: 8 }}>
                  No claim attributes found for this template on ledger. Please select a template with registered claims.
                </div>
              ) : (
                currentAttributesForIssue.map((attr) => (
                  <Form.Item
                    key={attr}
                    name={attr}
                    label={attr.charAt(0).toUpperCase() + attr.slice(1)}
                    rules={[{ required: true, message: `Please enter ${attr}` }]}
                    style={{ marginBottom: 10 }}
                  >
                    <Input placeholder={`Enter value for ${attr}`} />
                  </Form.Item>
                ))
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
              <Button onClick={() => setIsIssueModalOpen(false)}>Cancel</Button>
              <Button
                type="primary"
                htmlType="submit"
                disabled={
                  credDefs.length === 0 ||
                  connections.length === 0 ||
                  loadingIssueAttributes ||
                  currentAttributesForIssue.length === 0
                }
              >
                Sign & Issue Credential
              </Button>
            </div>
          </Form>
        </Modal>

        {/* Create Schema Modal with Preview Step */}
        <Modal
          title={
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <FileTextOutlined style={{ color: "#2563EB", fontSize: 20 }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>
                  {schemaCreationStep === 0 ? "Create New Credential Schema" : "Preview Schema Before Ledger Registration"}
                </div>
                <div style={{ fontSize: 12, color: "#64748b", fontWeight: 400 }}>
                  {schemaCreationStep === 0
                    ? "Configure schema definition, claim attributes, and version"
                    : "Verify all schema claims before anchoring to the immutable ledger"}
                </div>
              </div>
            </div>
          }
          open={isSchemaModalOpen}
          onCancel={handleCloseCreateSchemaModal}
          footer={null}
          width={720}
          centered
          className="schema-details-modal"
          destroyOnHidden
        >
          <div className="schema-modal-scrollable-body">
            <Steps
            current={schemaCreationStep}
            size="small"
            style={{ marginBottom: 20, marginTop: 8 }}
            items={[
              {
                title: "1. Define Schema",
                description: "Attributes & Metadata",
              },
              {
                title: "2. Preview & Register",
                description: "Verify before anchoring",
              },
            ]}
          />

          <div style={{ display: schemaCreationStep === 0 ? "block" : "none" }}>
            <Form form={schemaForm} layout="vertical" onFinish={handleProceedToPreview} style={{ marginTop: 12 }}>
              <div style={{ marginBottom: 16, background: "#f8fafc", padding: "10px 14px", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 6 }}>
                  Quick Schema Presets:
                </div>
                <Space wrap size="small">
                  <Button size="small" onClick={() => applyAttributePreset("student")}>
                    🎓 Degree / Education
                  </Button>
                  <Button size="small" onClick={() => applyAttributePreset("employee")}>
                    💼 Corporate Employee
                  </Button>
                  <Button size="small" onClick={() => applyAttributePreset("citizen")}>
                    🏛️ Citizen ID / KYC
                  </Button>
                </Space>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
                <Form.Item
                  name="name"
                  label="Schema Name"
                  rules={[{ required: true, message: "Please input schema name" }]}
                >
                  <Input placeholder="e.g. Employee ID, Degree Certificate, Testing_Schema" />
                </Form.Item>

                <Form.Item
                  name="version"
                  label="Version"
                  initialValue="1.0"
                  rules={[{ required: true, message: "Please enter version" }]}
                >
                  <Input placeholder="1.0" />
                </Form.Item>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12, marginBottom: 8 }}>
                <Form.Item
                  name="tag"
                  label="Credential Definition Tag"
                  initialValue="default"
                  rules={[{ required: true, message: "Please enter credential definition tag" }]}
                >
                  <Input placeholder="e.g. default, test_subject" />
                </Form.Item>

                <Form.Item
                  name="supportRevocation"
                  label="Revocation Support"
                  valuePropName="checked"
                  initialValue={true}
                >
                  <Switch checkedChildren="Enabled" unCheckedChildren="Disabled" defaultChecked />
                </Form.Item>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <label style={{ fontWeight: 600, fontSize: 13, color: "#1e293b" }}>
                    Credential Attributes ({schemaAttributes.length})
                  </label>
                  <span style={{ fontSize: 12, color: "#64748b" }}>Press Enter or click Add</span>
                </div>
                <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                  <Input
                    placeholder="Add attribute claim (e.g. employeeId, department, gpa, clearanceLevel)"
                    value={newAttributeInput}
                    onChange={(e) => setNewAttributeInput(e.target.value)}
                    onPressEnter={(e) => {
                      e.preventDefault();
                      handleAddAttribute();
                    }}
                  />
                  <Button type="dashed" onClick={handleAddAttribute} icon={<PlusOutlined />}>
                    Add Claim
                  </Button>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 8,
                    padding: 12,
                    background: "#f1f5f9",
                    borderRadius: 8,
                    border: "1px dashed #cbd5e1",
                    minHeight: 52,
                    alignItems: "center",
                  }}
                >
                  {schemaAttributes.length === 0 ? (
                    <span style={{ fontSize: 12, color: "#94a3b8" }}>No attributes added yet. Add at least one attribute.</span>
                  ) : (
                    schemaAttributes.map((attr) => (
                      <Tag
                        key={attr}
                        closable
                        onClose={() => handleRemoveAttribute(attr)}
                        color="blue"
                        style={{ fontSize: 13, padding: "4px 10px", borderRadius: 6, fontWeight: 500 }}
                      >
                        {attr}
                      </Tag>
                    ))
                  )}
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 24 }}>
                <Button onClick={handleCloseCreateSchemaModal}>Cancel</Button>
                <Button type="primary" htmlType="submit" icon={<ArrowRightOutlined />} style={{ background: "#2563EB", borderColor: "#2563EB" }}>
                  Proceed to Schema Preview
                </Button>
              </div>
            </Form>
          </div>

          <div style={{ display: schemaCreationStep === 1 ? "block" : "none" }}>
            <div style={{ marginTop: 12 }}>
              {/* SECTION 1: BASIC INFORMATION PREVIEW */}
              <div className="schema-section-card">
                <div className="schema-section-header">
                  <span className="schema-section-title">
                    <ApartmentOutlined style={{ color: "#2563eb" }} />
                    1. Basic Information
                  </span>
                  <Tag color="processing" icon={<ClockCircleOutlined />} style={{ borderRadius: 12, fontWeight: 600 }}>
                    READY TO ANCHOR
                  </Tag>
                </div>
                <div className="schema-section-content">
                  <div className="schema-basic-grid">
                    <div className="schema-info-item">
                      <span className="schema-info-label">Schema Name</span>
                      <span className="schema-info-value" style={{ fontSize: 15, color: "#1e3a8a" }}>
                        {schemaPreviewData?.name}
                      </span>
                    </div>

                    <div className="schema-info-item">
                      <span className="schema-info-label">Version</span>
                      <span className="schema-info-value">
                        <Tag color="blue" style={{ borderRadius: 6, fontWeight: 600, fontSize: 12 }}>
                          v{schemaPreviewData?.version}
                        </Tag>
                      </span>
                    </div>

                    <div className="schema-info-item">
                      <span className="schema-info-label">Cred Def Tag</span>
                      <span className="schema-info-value">
                        <Tag color="purple" style={{ borderRadius: 6, fontWeight: 600, fontSize: 12 }}>
                          {schemaPreviewData?.tag || "default"}
                        </Tag>
                      </span>
                    </div>

                    <div className="schema-info-item">
                      <span className="schema-info-label">Revocation Support</span>
                      <span className="schema-info-value">
                        <Tag color={schemaPreviewData?.supportRevocation !== false ? "green" : "orange"} style={{ borderRadius: 6, fontWeight: 600, fontSize: 12 }}>
                          {schemaPreviewData?.supportRevocation !== false ? "Enabled (Accumulator)" : "Disabled"}
                        </Tag>
                      </span>
                    </div>

                    <div className="schema-info-item" style={{ gridColumn: "1 / -1" }}>
                      <span className="schema-info-label">Issuer Sovereign DID</span>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
                        <code style={{ fontSize: 12, color: "#0369a1", background: "#f0f9ff", padding: "2px 8px", borderRadius: 4 }}>
                          {currentIssuerDID || "did:sov:JuGgR7FBWxcAPhPG6kgZbU"}
                        </code>
                        <Tag color="cyan" style={{ fontSize: 11, borderRadius: 10 }}>
                          Author DID
                        </Tag>
                      </div>
                    </div>

                    <div className="schema-info-item" style={{ gridColumn: "1 / -1" }}>
                      <span className="schema-info-label">Target Distributed Ledger</span>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
                        <span style={{ fontSize: 13, color: "#0f172a", fontWeight: 600 }}>
                          <GlobalOutlined style={{ color: "#0284c7", marginRight: 6 }} />
                          CDAC-SSI Ledger (10.210.13.22:9000)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 2: CREDENTIAL ATTRIBUTES (PROMINENT!) */}
              <div className="schema-section-card attributes-prominent-card">
                <div className="schema-section-header attributes-prominent-header">
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <FieldStringOutlined style={{ color: "#2563eb", fontSize: 17 }} />
                    <span className="schema-section-title attributes-prominent-title">
                      2. Credential Attributes
                    </span>
                    <span className="attributes-badge-counter">
                      {schemaPreviewData?.attributes?.length || 0} Defined Claims
                    </span>
                  </div>
                </div>

                <div className="schema-section-content">
                  <div className="attributes-grid-container">
                    {schemaPreviewData?.attributes?.map((attr, idx) => (
                      <div key={idx} className="attribute-item-card">
                        <div className="attribute-pill-left">
                          <span className="attribute-index-tag">#{idx + 1}</span>
                          <span className="attribute-name-text">{attr}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* IMMUTABLE LEDGER NOTICE */}
              <Alert
                message="Immutable Ledger Verification Notice"
                description="Once this schema is anchored on the distributed ledger, its attributes and name cannot be modified or deleted. Please ensure all required claim fields are accurate before confirming."
                type="warning"
                showIcon
                style={{ borderRadius: 8, marginBottom: 20 }}
              />

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Button icon={<ArrowLeftOutlined />} onClick={handleBackToEditSchema}>
                  Back to Edit
                </Button>
                <Space>
                  <Button onClick={handleCloseCreateSchemaModal}>Cancel</Button>
                  <Button
                    type="primary"
                    loading={isPublishingSchema}
                    onClick={handleFinalPublishSchema}
                    icon={<SafetyCertificateOutlined />}
                    style={{ background: "#2563EB", borderColor: "#2563EB", fontWeight: 600, padding: "0 20px" }}
                  >
                    Confirm & Register on Ledger
                  </Button>
                </Space>
              </div>
            </div>
          </div>
          </div>
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
          destroyOnHidden
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
          destroyOnHidden
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
          credDef={
            credDefs.find(
              (cd) =>
                cd.schemaId === selectedSchemaForView?.id ||
                cd.schema_id === selectedSchemaForView?.id ||
                (selectedSchemaForView?.seqNo && String(cd.seqNo) === String(selectedSchemaForView.seqNo)) ||
                (cd.id && selectedSchemaForView?.seqNo && cd.id.includes(`:${selectedSchemaForView.seqNo}:`)) ||
                (selectedSchemaForView?.name &&
                  cd.schemaName &&
                  cd.schemaName.toLowerCase() === selectedSchemaForView.name.toLowerCase())
            ) || null
          }
          credDefs={credDefs}
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