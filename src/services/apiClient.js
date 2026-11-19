/**
 * API Client for SSI Application (React JavaScript).
 * 
 * Bridges frontend components with either Mock services (for offline demo)
 * or real backend API routes mounted on SSI Backend (/api/v1).
 * 
 * Configured via .env:
 * VITE_USE_MOCK=false
 * VITE_API_BASE_URL=http://10.210.13.22:5000/api/v1
 */
import {
  apiClient,
  ENDPOINTS,
  authApi,
  adminApi,
  issuerApi,
  holderApi,
  verifierApi,
  connectionsApi,
} from "./api/index.js";

// Permanently disabled mock mode - always false
export const getIsMockMode = () => false;
export const MOCK_MODE = false;

const extractList = (payload) => {
  const candidates = [
    payload?.data?.results,
    payload?.data?.connections,
    payload?.data,
    payload?.results,
    payload?.connections,
    payload,
  ];
  return candidates.find(Array.isArray) || [];
};

/**
 * Authentication Service
 */
export const authService = {
  login: async ({ username, email, password }) => {
    const res = await authApi.login({
      email: email || username,
      username: username || email,
      password,
    });
    return res;
  },

  register: async (registerData) => {
    const res = await authApi.register(registerData);
    return res;
  },

  checkUsername: async (username) => {
    return await authApi.checkUsername(username);
  },

  resendOtp: async (params) => {
    const payload = typeof params === "string" ? { email: params } : params;
    return await authApi.resendOtp(payload);
  },

  verifyEmail: async (payload) => {
    return await authApi.verifyEmail(payload);
  },

  forgotPassword: async (payload) => {
    return await authApi.forgotPassword(payload);
  },

  resetPassword: async (payload) => {
    return await authApi.resetPassword(payload);
  },

  changePassword: async (payload) => {
    return await authApi.changePassword(payload);
  },

  verifyEkyc: async (payload) => {
    return await authApi.verifyOfflineEkyc(payload);
  },

  submitApproval: async (payload) => {
    return await authApi.submitForApproval(payload);
  },

  getRegistrationStatus: async (userId) => {
    return await authApi.getRegistrationStatus(userId);
  },

  logout: async () => {
    try {
      const res = await authApi.logout();
      return res;
    } catch {
      return { success: true };
    }
  },

  getSession: () => {
    const storedUser = localStorage.getItem("user");
    return {
      isAuthenticated: !!storedUser,
      user: storedUser ? JSON.parse(storedUser) : null,
    };
  },

  isSessionExpired: () => {
    const loginTime = localStorage.getItem("loginTime");
    if (!loginTime) return true;
    return (Date.now() - Number(loginTime)) > 30 * 60 * 1000;
  },
};

/**
 * Issuer Service
 */
/**
 * Helper to build requiredHolderAttributes schema descriptors matching backend Swagger spec
 */
export const buildRequiredHolderAttributes = (attributes) => {
  if (!Array.isArray(attributes) || attributes.length === 0) return [];

  return attributes.map((attr) => {
    let name = "";
    let label = "";
    let type = "string";
    let required = true;
    let description = "";

    if (typeof attr === "object" && attr !== null) {
      name = attr.name || attr.key || "";
      label = attr.label || "";
      type = attr.type || "string";
      required = attr.required !== false;
      description = attr.description || "";
    } else {
      name = String(attr || "").trim();
    }

    if (!label) {
      label = name
        .replace(/_/g, " ")
        .replace(/([A-Z])/g, " $1")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/\b\w/g, (c) => c.toUpperCase());
    }

    if (!type || type === "string") {
      if (/year|age|amount|salary|roll|gpa|cgpa|tier|rank|code/i.test(name)) {
        type = "number";
      } else {
        type = "string";
      }
    }

    if (!description) {
      description = `Enter your ${label.toLowerCase()}`;
    }

    return {
      name,
      label,
      type,
      required,
      description,
    };
  });
};

export const issuerService = {
  getDID: async () => {

    try {
      // 1. Fetch live public DID from subwallet
      const res = await apiClient.get(ENDPOINTS.WALLET.PUBLIC_DID);
      const resData = res.data?.data?.result || res.data?.result || res.data?.data || res.data;
      const rawDid = resData?.did || resData?.publicDid;
      if (rawDid) {
        const formattedDid = rawDid.startsWith("did:") ? rawDid : `did:sov:${rawDid}`;
        const didPayload = {
          did: formattedDid,
          rawDid,
          verkey: resData?.verkey || null,
          method: resData?.method || "sov",
          role: resData?.role || "issuer",
          posture: resData?.posture || "posted",
        };
        try {
          const stored = localStorage.getItem("user");
          if (stored) {
            const u = JSON.parse(stored);
            if (!u.did || u.did !== formattedDid) {
              u.did = formattedDid;
              u.rawDid = rawDid;
              if (resData?.verkey) u.verkey = resData.verkey;
              localStorage.setItem("user", JSON.stringify(u));
            }
          }
        } catch {
          // ignore storage error
        }
        return {
          success: true,
          data: didPayload,
          did: formattedDid,
        };
      }
    } catch (err) {
      console.warn("Could not fetch public DID from /wallet/did/public:", err?.message || err);
    }

    try {
      // 2. Fallback to /auth/me user profile
      const meRes = await authApi.getMe();
      const meData = meRes?.data || meRes?.user || meRes;
      const rawDid = meData?.did || meData?.publicDid;
      if (rawDid) {
        const formattedDid = rawDid.startsWith("did:") ? rawDid : `did:sov:${rawDid}`;
        const didPayload = {
          did: formattedDid,
          rawDid,
          verkey: meData?.verkey || null,
          method: "sov",
          role: meData?.role || "issuer",
        };
        try {
          const stored = localStorage.getItem("user");
          if (stored) {
            const u = JSON.parse(stored);
            u.did = formattedDid;
            u.rawDid = rawDid;
            if (meData?.verkey) u.verkey = meData.verkey;
            localStorage.setItem("user", JSON.stringify(u));
          }
        } catch {
          // ignore storage error
        }
        return {
          success: true,
          data: didPayload,
          did: formattedDid,
        };
      }
    } catch (err) {
      console.warn("Could not fetch DID from /auth/me:", err?.message || err);
    }

    try {
      // 3. Fallback to /wallet/dids list
      const didsRes = await apiClient.get(ENDPOINTS.WALLET.DIDS);
      const didList = didsRes.data?.data?.results || didsRes.data?.results || didsRes.data || [];
      if (Array.isArray(didList) && didList.length > 0) {
        const posted = didList.find((d) => d.posture === "posted" || d.metadata?.posted) || didList[0];
        const rawDid = posted.did;
        if (rawDid) {
          const formattedDid = rawDid.startsWith("did:") ? rawDid : `did:sov:${rawDid}`;
          return {
            success: true,
            data: {
              did: formattedDid,
              rawDid,
              verkey: posted.verkey || null,
              method: posted.method || "sov",
              posture: posted.posture || "posted",
            },
            did: formattedDid,
          };
        }
      }
    } catch (err) {
      console.warn("Could not fetch DIDs from /wallet/dids:", err?.message || err);
    }

    // 4. Fallback to session user in localStorage
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        const u = JSON.parse(stored);
        const rawDid = u?.did || u?.rawDid;
        if (rawDid) {
          const formattedDid = rawDid.startsWith("did:") ? rawDid : `did:sov:${rawDid}`;
          return {
            success: true,
            data: {
              did: formattedDid,
              rawDid,
              verkey: u.verkey || null,
              method: "sov",
            },
            did: formattedDid,
          };
        }
      }
    } catch {
      // ignore
    }

    // 5. If unprovisioned on ACA-Py ledger, return null DID (do NOT fake another user's DID)
    return {
      success: true,
      data: {
        did: null,
        rawDid: null,
        verkey: null,
        method: "sov",
        status: "NOT_PROVISIONED",
      },
      did: null,
    };
  },

  getDashboardStats: async () => {
    try {
      const res = await issuerApi.getDashboardStats();
      return res;
    } catch (err) {
      console.warn("getDashboardStats skipped/unavailable:", err?.message || err);
      return { success: true, data: {} };
    }
  },

  getSchemas: async () => {
    try {
      // Real-time backend endpoint: GET /api/v1/issuer/schemas
      const res = await issuerApi.getCreatedSchemas();
      const rawData = res?.data?.schemas || res?.data?.results || res?.data || res?.schemas || res || [];
      const rawList = Array.isArray(rawData)
        ? rawData
        : Array.isArray(rawData?.schema_ids)
          ? rawData.schema_ids
          : [];

      // Fetch schema details for full attribute list and seqNo
      const normalized = await Promise.all(
        rawList.map(async (s, idx) => {
          const schemaId = typeof s === "string" ? s : s.schema_id || s.schemaId || s.id || `schema-${idx + 1}`;
          const parts = schemaId.includes(":") ? schemaId.split(":") : [];
          const parsedIssuerDid = parts.length >= 4 ? parts[0] : null;
          let name = (typeof s === "object" ? (s.schemaName || s.schema_name || s.name) : null) || (parts[2] || schemaId);
          let version = (typeof s === "object" ? (s.schemaVersion || s.schema_version || s.version) : null) || (parts[3] || "1.0");
          let attributes = Array.isArray(s?.attributes) && s.attributes.length > 0
            ? s.attributes
            : Array.isArray(s?.attrNames) && s.attrNames.length > 0
              ? s.attrNames
              : Array.isArray(s?.attr_names) && s.attr_names.length > 0
                ? s.attr_names
                : [];
          let seqNo = s?.seqNo || s?.schema_metadata?.seqNo || null;

          // If seqNo or attributes are missing, query schema details from the ledger
          if ((!seqNo || attributes.length === 0) && schemaId && schemaId.includes(":")) {
            try {
              const detailRes = await issuerApi.getSchema(schemaId);
              const schemaData = detailRes?.data?.schema || detailRes?.data || detailRes?.schema || {};
              const fetchedAttrs = schemaData.attrNames || schemaData.attributes || schemaData.attr_names || [];
              if (Array.isArray(fetchedAttrs) && fetchedAttrs.length > 0) {
                attributes = fetchedAttrs;
              }
              if (schemaData.name) name = schemaData.name;
              if (schemaData.version) version = schemaData.version;
              seqNo = detailRes?.data?.schema_metadata?.seqNo || schemaData.seqNo || seqNo;
            } catch {
              // fallback gracefully
            }
          }

          return {
            id: schemaId,
            schema_id: schemaId,
            schemaId,
            seqNo,
            issuerDid: s?.issuerDid || s?.issuer_did || parsedIssuerDid,
            name,
            version,
            attributes,
            attrNames: attributes,
            status: s?.status || "active",
            raw: s,
          };
        })
      );

      return { success: true, data: normalized };
    } catch (err) {
      console.warn("getSchemas error:", err?.message || err);
      return { success: true, data: [] };
    }
  },

  createSchema: async (schemaData) => {
    const name = schemaData.name || schemaData.schemaName || schemaData.schema_name;
    const version = schemaData.version || schemaData.schemaVersion || schemaData.schema_version || "1.0";
    const tag = schemaData.tag || "default";
    const attrs = Array.isArray(schemaData.attributes) ? schemaData.attributes : [];
    const supportRev = Boolean(schemaData.supportRevocation || schemaData.support_revocation);

    const payload = {
      schemaName: name,
      schema_name: name,
      schemaVersion: version,
      schema_version: version,
      attributes: attrs,
      requiredHolderAttributes:
        Array.isArray(schemaData.requiredHolderAttributes) && schemaData.requiredHolderAttributes.length > 0
          ? schemaData.requiredHolderAttributes
          : buildRequiredHolderAttributes(attrs),
      issuanceMode: schemaData.issuanceMode || "AUTO_ISSUE",
      tag,
      support_revocation: supportRev,
      supportRevocation: supportRev,
    };
    // Combined Schema & Credential Definition creation: POST /api/v1/issuer/credential-definitions
    const res = await apiClient.post(ENDPOINTS.ISSUER.CREDENTIAL_DEFINITIONS, payload);
    return res.data;
  },

  getCredentialDefinitions: async () => {
    try {
      // 1. Try real-time backend endpoint: GET /api/v1/issuer/credential-definitions
      let rawList = [];
      try {
        const res = await issuerApi.getCreatedCredDefs();
        const candidate =
          res?.data?.credential_definition_ids ||
          res?.data?.credential_definitions ||
          res?.data?.results ||
          res?.data?.data?.credential_definition_ids ||
          res?.data?.data?.credential_definitions ||
          res?.data?.data ||
          res?.data ||
          res?.credential_definition_ids ||
          res?.credential_definitions ||
          res;

        if (Array.isArray(candidate)) {
          rawList = candidate;
        } else if (Array.isArray(candidate?.credential_definition_ids)) {
          rawList = candidate.credential_definition_ids;
        } else if (Array.isArray(candidate?.credential_definitions)) {
          rawList = candidate.credential_definitions;
        } else if (Array.isArray(candidate?.results)) {
          rawList = candidate.results;
        }
      } catch (err) {
        console.warn("getCreatedCredDefs error:", err?.message || err);
      }

      // 2. If empty, fallback to recorded cred defs endpoint: GET /api/v1/issuer/credential-definitions/recorded
      if (rawList.length === 0) {
        try {
          const recRes = await issuerApi.getRecordedCredDefs();
          const recData = recRes?.data || recRes?.results || recRes;
          if (Array.isArray(recData)) {
            rawList = recData;
          }
        } catch {
          // ignore fallback error
        }
      }

      const storedUser = localStorage.getItem("user");
      let storedIssuerDid = "KkFmaEgH6pkHJGnyMtpBm2";
      if (storedUser) {
        try {
          const u = JSON.parse(storedUser);
          if (u.rawDid || u.did) {
            storedIssuerDid = String(u.rawDid || u.did).replace(/^did:sov:/, "");
          }
        } catch {
          // ignore
        }
      }

      const normalized = rawList.map((d, idx) => {
        let credDefId =
          typeof d === "string"
            ? d
            : d.cred_def_id ||
            d.credential_definition_id ||
            d.credentialDefinitionId ||
            d.id;

        const parts = String(credDefId || "").split(":");
        const seqNo =
          typeof d === "object" && d.seqNo
            ? d.seqNo
            : parts.length >= 4 && !isNaN(Number(parts[3]))
              ? parts[3]
              : null;
        const tag =
          (typeof d === "object" ? d.tag : null) ||
          (parts.length >= 5 ? parts[4] : "default");
        const schemaId =
          (typeof d === "object"
            ? d.schema_id || d.schemaId || d.schema
            : null) || (seqNo ? String(seqNo) : "");
        const supportRevocation = Boolean(
          d?.support_revocation ?? d?.supportRevocation ?? false
        );

        const schemaName =
          typeof d === "object"
            ? d.schemaName || d.schema_name || d.name || null
            : null;

        let attrs = [];
        if (typeof d === "object" && d !== null) {
          if (Array.isArray(d.attributes) && d.attributes.length > 0) {
            attrs = d.attributes.map((a) => (typeof a === "object" && a !== null ? a.name || a.label || a.key : String(a))).filter(Boolean);
          } else if (Array.isArray(d.attrNames) && d.attrNames.length > 0) {
            attrs = d.attrNames;
          } else if (Array.isArray(d.attr_names) && d.attr_names.length > 0) {
            attrs = d.attr_names;
          } else if (Array.isArray(d.requiredHolderAttributes) && d.requiredHolderAttributes.length > 0) {
            attrs = d.requiredHolderAttributes.map((a) => (typeof a === "object" && a !== null ? a.name || a.label || a.key : String(a))).filter(Boolean);
          }
        }

        // Ensure credDefId is never a dummy string
        if (!credDefId || !credDefId.includes(":3:CL:")) {
          if (seqNo) {
            credDefId = `${storedIssuerDid}:3:CL:${seqNo}:${tag}`;
          }
        }

        return {
          id: credDefId,
          cred_def_id: credDefId,
          credentialDefinitionId: credDefId,
          schemaId,
          seqNo,
          tag,
          schemaName,
          attributes: attrs,
          attrNames: attrs,
          supportRevocation,
          raw: d,
        };
      });

      return { success: true, data: normalized };
    } catch (err) {
      console.warn("getCredentialDefinitions error:", err?.message || err);
      return { success: true, data: [] };
    }
  },

  getCredentials: async () => {
    try {
      const res = await issuerApi.getRecordedCredentials();
      const rawRecords = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.results)
          ? res.results
          : Array.isArray(res?.data?.results)
            ? res.data.results
            : Array.isArray(res)
              ? res
              : [];
      return { success: true, data: rawRecords };
    } catch (err) {
      console.warn("Failed to fetch live credentials:", err);
      return { success: true, data: [] };
    }
  },

  getIssuanceActivity: async () => {
    try {
      let rawRecords = [];
      try {
        const res = await issuerApi.getRecordedCredentials();
        const data = res?.data?.results || res?.data || res?.results || res || [];
        if (Array.isArray(data)) rawRecords = data;
      } catch (e) {
        console.warn("Failed to fetch /issuer/credentials:", e?.message);
      }

      if (rawRecords.length === 0) {
        try {
          const res = await issuerApi.getCredentialRecords();
          const data = res?.data?.results || res?.data || res?.results || res || [];
          if (Array.isArray(data)) rawRecords = data;
        } catch (e) {
          // ignore
        }
      }

      const mapped = rawRecords.map((item, idx) => {
        const r = item?.cred_ex_record || item?.record || item;
        const id = r.cred_ex_id || r.credential_exchange_id || r.id || `act-${idx + 1}`;

        // 1. Resolve true Credential Definition ID from 2.0 exchange records or top-level
        const credDefId =
          r.by_format?.cred_offer?.anoncreds?.cred_def_id ||
          r.by_format?.cred_offer?.indy?.cred_def_id ||
          r.by_format?.cred_issue?.anoncreds?.cred_def_id ||
          r.by_format?.cred_issue?.indy?.cred_def_id ||
          r.by_format?.cred_proposal?.anoncreds?.cred_def_id ||
          r.by_format?.cred_proposal?.indy?.cred_def_id ||
          r.cred_def_id ||
          r.credential_definition_id ||
          r.credentialDefinitionId ||
          "";

        // 2. Resolve Schema ID & Schema Name
        const schemaId =
          r.by_format?.cred_offer?.anoncreds?.schema_id ||
          r.by_format?.cred_offer?.indy?.schema_id ||
          r.by_format?.cred_issue?.anoncreds?.schema_id ||
          r.by_format?.cred_issue?.indy?.schema_id ||
          r.schema_id ||
          r.schemaId ||
          "";

        let schemaName =
          r.by_format?.cred_offer?.anoncreds?.schema_name ||
          r.by_format?.cred_offer?.indy?.schema_name ||
          r.by_format?.cred_issue?.anoncreds?.schema_name ||
          r.by_format?.cred_issue?.indy?.schema_name ||
          r.schema_name ||
          r.schemaName;

        if (!schemaName && schemaId && schemaId.includes(":")) {
          const sParts = schemaId.split(":");
          if (sParts.length >= 3) schemaName = sParts[2];
        }
        if (!schemaName && credDefId && credDefId.includes(":")) {
          const defParts = credDefId.split(":");
          if (defParts.length >= 5 && defParts[4] !== "default") {
            schemaName = defParts[4];
          }
        }
        if (!schemaName && r.comment && !r.comment.toLowerCase().includes("offer")) {
          schemaName = r.comment;
        }
        if (!schemaName) schemaName = "Verifiable Credential";

        // 3. Extract and normalize claims/attributes into a clean dictionary
        const rawAttrs =
          r.cred_preview?.attributes ||
          r.cred_offer?.credential_preview?.attributes ||
          r.cred_proposal?.credential_preview?.attributes ||
          r.credential_preview?.attributes ||
          r.by_format?.cred_offer?.anoncreds?.attributes ||
          r.by_format?.cred_issue?.anoncreds?.attributes ||
          r.attributes ||
          r.claims ||
          {};

        const attrsObj = {};
        if (Array.isArray(rawAttrs)) {
          rawAttrs.forEach((attr) => {
            if (typeof attr === "object" && attr !== null) {
              const k = attr.name || attr.name_tag || attr.key;
              if (k) attrsObj[k] = attr.value !== undefined ? String(attr.value) : "";
            }
          });
        } else if (rawAttrs && typeof rawAttrs === "object") {
          Object.entries(rawAttrs).forEach(([k, v]) => {
            attrsObj[k] = typeof v === "object" && v?.value !== undefined ? String(v.value) : String(v ?? "");
          });
        }

        // 4. Normalize ACA-Py issue credential states (hyphenated & underscored)
        const cleanState = String(r.state || r.status || "").toLowerCase().replace(/_/g, "-");
        const isRevoked = cleanState === "deleted" || r.revoked === true || r.revocationStatus === "revoked";
        const isIssued = [
          "credential-acked",
          "credential-issued",
          "credential-received",
          "done",
          "issued",
          "stored",
        ].includes(cleanState);
        const status = isRevoked ? "revoked" : isIssued ? "issued" : "pending";

        const issueDate = r.created_at || r.updated_at || r.issuedAt || new Date().toISOString();

        return {
          id,
          credentialDefinitionId: credDefId || "N/A",
          cred_def_id: credDefId,
          credDefId,
          schemaId,
          schema_id: schemaId,
          schemaName,
          schema_name: schemaName,
          credentialDefinition: schemaName,
          holderDid: r.holder_did || r.their_did || r.connection_id || r.holderDid || "Edge Holder",
          holderName: r.holder_name || r.their_label || r.display_label || r.holderName || "Connected Holder",
          attributes: attrsObj,
          attrs: attrsObj,
          claims: attrsObj,
          raw_attributes: attrsObj,
          status,
          state: r.state || cleanState,
          revoked: isRevoked,
          revocationStatus: isRevoked ? "revoked" : "active",
          issuedAt: issueDate,
          created_at: issueDate,
          issuanceDate: issueDate,
          raw: r,
        };
      });

      return { success: true, data: mapped };
    } catch (err) {
      console.warn("Failed to fetch live issuance records:", err);
      return { success: true, data: [] };
    }
  },

  createCredentialDefinition: async (credDefData) => {
    const sId = credDefData.schemaId || credDefData.schema_id;
    const sName = credDefData.schemaName || credDefData.schema_name;
    const sVer = credDefData.schemaVersion || credDefData.schema_version || "1.0";
    const tag = credDefData.tag || "default";
    const supportRev = Boolean(credDefData.supportRevocation ?? credDefData.support_revocation ?? false);
    const revSize = credDefData.revocationRegistrySize ?? credDefData.revocation_registry_size ?? 1000;
    const attrs = Array.isArray(credDefData.attributes) ? credDefData.attributes : [];

    const payload = {
      schema_id: sId,
      schemaId: sId,
      schema_name: sName,
      schemaName: sName,
      schema_version: sVer,
      schemaVersion: sVer,
      attributes: attrs,
      requiredHolderAttributes:
        Array.isArray(credDefData.requiredHolderAttributes) && credDefData.requiredHolderAttributes.length > 0
          ? credDefData.requiredHolderAttributes
          : buildRequiredHolderAttributes(attrs),
      issuanceMode: credDefData.issuanceMode || "AUTO_ISSUE",
      tag,
      support_revocation: supportRev,
      supportRevocation: supportRev,
      revocation_registry_size: revSize,
      revocationRegistrySize: revSize,
    };
    const res = await issuerApi.createCredDef(payload);
    return res;
  },

  /**
   * Create a schema and a credential definition in one step.
   * Hits POST /api/v1/issuer/credential-definitions
   */
  createSchemaAndCredDef: async (payload) => {
    const name = payload.schemaName || payload.schema_name || payload.name;
    const version = payload.schemaVersion || payload.schema_version || payload.version || "1.0";
    const tag = payload.tag || "default";
    const attrs = Array.isArray(payload.attributes) ? payload.attributes : [];
    const supportRev = Boolean(payload.support_revocation ?? payload.supportRevocation ?? false);

    const fullPayload = {
      schemaName: name,
      schema_name: name,
      schemaVersion: version,
      schema_version: version,
      attributes: attrs,
      requiredHolderAttributes:
        Array.isArray(payload.requiredHolderAttributes) && payload.requiredHolderAttributes.length > 0
          ? payload.requiredHolderAttributes
          : buildRequiredHolderAttributes(attrs),
      issuanceMode: payload.issuanceMode || "AUTO_ISSUE",
      tag,
      support_revocation: supportRev,
      supportRevocation: supportRev,
    };
    const res = await apiClient.post(ENDPOINTS.ISSUER.CREDENTIAL_DEFINITIONS, fullPayload);
    return res.data;
  },

  issueCredential: async (credentialDefId, holderDidOrConnId, attributes, schemaDetails = {}) => {
    // 1. Build flat key-value attributes object strictly matching Swagger POST /api/v1/issuer/issue-credential
    // ex: { "student_name": "rahul Batham" }
    const attributesObject = {};
    if (Array.isArray(attributes)) {
      attributes.forEach((attr) => {
        if (typeof attr === "object" && attr !== null) {
          const name = attr.name || attr.name_tag || attr.key || "";
          if (name) {
            attributesObject[name] = String(attr.value ?? "");
          }
        }
      });
    } else if (attributes && typeof attributes === "object") {
      Object.entries(attributes).forEach(([key, val]) => {
        if (val !== undefined && val !== null) {
          attributesObject[key] = String(val);
        }
      });
    }

    // 2. Clean connection ID and credDefId
    const cleanConnId = String(holderDidOrConnId || "").trim();
    let cleanCredDefId = String(credentialDefId || "").trim();

    // Preserve valid credDefId; only fallback if completely missing or malformed
    if (!cleanCredDefId || !cleanCredDefId.includes(":3:CL:")) {
      const storedUser = localStorage.getItem("user");
      let storedIssuerDid = "KkFmaEgH6pkHJGnyMtpBm2";
      if (storedUser) {
        try {
          const u = JSON.parse(storedUser);
          if (u.rawDid || u.did) {
            storedIssuerDid = String(u.rawDid || u.did).replace(/^did:sov:/, "");
          }
        } catch {
          // ignore
        }
      }
      const seqNo = schemaDetails?.seqNo || "219";
      const tag = schemaDetails?.tag || "default";
      cleanCredDefId = `${storedIssuerDid}:3:CL:${seqNo}:${tag}`;
    }

    // 3. Exact payload matching Swagger API spec
    const payload = {
      connectionId: cleanConnId,
      credDefId: cleanCredDefId,
      attributes: attributesObject,
      comment: schemaDetails?.comment || "Direct student identity credential issuance",
      auto_issue: true,
    };

    try {
      const res = await issuerApi.issueCredential(payload);
      return res;
    } catch (err) {
      console.error("issueCredential error:", err);
      const errMsg =
        err?.response?.data?.message ||
        err?.response?.data?.details ||
        err?.message ||
        "Failed to issue credential";
      return {
        success: false,
        message: errMsg,
      };
    }
  },

  revokeCredential: async (recordOrId, reason) => {
    let credRevId = "1";
    let revRegId = "";
    let credExId = "";
    let connectionId = "";

    if (typeof recordOrId === "object" && recordOrId !== null) {
      const raw = recordOrId.raw || recordOrId;
      credExId = recordOrId.id || raw.cred_ex_id || raw.id || "";
      connectionId = recordOrId.connectionId || raw.connection_id || recordOrId.holderDid || "";
      credRevId =
        recordOrId.credRevId ||
        recordOrId.cred_rev_id ||
        raw.cred_rev_id ||
        raw.revocationId ||
        raw.revocation_id ||
        raw.rev_id ||
        raw.by_format?.cred_issue?.indy?.cred_rev_id ||
        "1";
      revRegId =
        recordOrId.revRegId ||
        recordOrId.rev_reg_id ||
        raw.rev_reg_id ||
        raw.revoc_reg_id ||
        raw.revocationRegistryId ||
        raw.revocation_registry_id ||
        raw.by_format?.cred_issue?.indy?.rev_reg_id ||
        "";

      // If revRegId is still missing, try looking up active revocation registry for this credDef
      if (!revRegId) {
        const credDefId = recordOrId.credentialDefinitionId || raw.cred_def_id || raw.credential_definition_id;
        if (credDefId && issuerApi.getActiveRevocationRegistry) {
          try {
            const regRes = await issuerApi.getActiveRevocationRegistry(credDefId);
            const foundRegId =
              regRes?.data?.revoc_reg_id ||
              regRes?.data?.revRegId ||
              regRes?.data?.rev_reg_id ||
              regRes?.revoc_reg_id;
            if (foundRegId) revRegId = foundRegId;
          } catch {
            // ignore
          }
        }
      }
    } else {
      credExId = String(recordOrId);
      credRevId = "1";
    }

    const payload = {
      credRevId: String(credRevId),
      cred_rev_id: String(credRevId),
      revRegId: revRegId,
      rev_reg_id: revRegId,
      credExId,
      cred_ex_id: credExId,
      connectionId,
      connection_id: connectionId,
      publish: true,
      notify: true,
      reason: reason || "Administrative revocation",
    };

    const res = await issuerApi.revokeCredential(payload);
    return res;
  },

  createInvitation: async (alias) => {
    return await connectionsApi.createInvitation(alias);
  },

  receiveInvitation: async (payload) => {
    return await connectionsApi.receiveInvitation(payload);
  },

  getConnections: async () => {
    try {
      const res = await connectionsApi.listConnections();
      return { success: true, data: extractList(res) };
    } catch (err) {
      console.warn("getConnections error:", err?.message || err);
      return { success: true, data: [] };
    }
  },

  getQrRecords: async () => {
    const res = await issuerApi.getQrRecords();
    return res;
  },

  createOnboardingQr: async (payload) => {
    const res = await issuerApi.createOnboardingQr(payload);
    return res;
  },
};

/**
 * Holder Service
 */
/**
 * Deduplicate credentials having identical attributes and schema/type.
 * Keeps the most recent or active credential record.
 */
export const deduplicateCredentials = (list) => {
  if (!Array.isArray(list) || list.length <= 1) return list || [];

  const map = new Map();

  for (const cred of list) {
    if (!cred) continue;

    // 1. Build deterministic attributes fingerprint
    const rawAttrs = cred.attrs || cred.attributes || cred.claims || cred.raw?.attrs || {};
    let attrEntries = [];
    if (Array.isArray(rawAttrs)) {
      attrEntries = rawAttrs.map((item) => {
        if (typeof item === "object" && item !== null) {
          return [
            String(item.name || item.name_tag || item.key || "").toLowerCase().trim(),
            String(item.value ?? "").toLowerCase().trim(),
          ];
        }
        return ["", String(item ?? "").toLowerCase().trim()];
      });
    } else if (rawAttrs && typeof rawAttrs === "object") {
      attrEntries = Object.entries(rawAttrs).map(([k, v]) => [
        String(k).toLowerCase().trim(),
        typeof v === "object" && v?.value !== undefined
          ? String(v.value).toLowerCase().trim()
          : String(v ?? "").toLowerCase().trim(),
      ]);
    }

    const sortedAttrs = attrEntries
      .filter(([k]) => Boolean(k))
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([k, v]) => `${k}=${v}`)
      .join("|");

    // 2. Identify Schema / Type
    const schemaKey = (
      cred.schemaId ||
      cred.schema_id ||
      cred.schemaName ||
      cred.schema_name ||
      cred.schema ||
      cred.credentialDefinition ||
      cred.type ||
      ""
    ).toLowerCase().trim();

    // 3. Identify Issuer DID
    const issuerKey = (
      cred.issuerDid ||
      cred.issuer_did ||
      cred.issuer ||
      ""
    ).toLowerCase().trim();

    // 4. Identify Cred Def ID if attributes are empty
    const credDefKey = (
      cred.credDefId ||
      cred.cred_def_id ||
      cred.credentialDefinitionId ||
      ""
    ).toLowerCase().trim();

    // Composite key:
    // If attributes exist: schema + issuer + attributes
    // If no attributes: schema + credDef + issuer
    const dedupKey = sortedAttrs
      ? `${schemaKey}::__${issuerKey}::__${sortedAttrs}`
      : `${schemaKey}::__${credDefKey}::__${issuerKey}`;

    if (!map.has(dedupKey)) {
      map.set(dedupKey, cred);
    } else {
      // If duplicate exists, keep the latest one (by date or higher id)
      const existing = map.get(dedupKey);
      const existingTime = new Date(existing.issueDate || existing.issuedAt || existing.created_at || 0).getTime();
      const currentTime = new Date(cred.issueDate || cred.issuedAt || cred.created_at || 0).getTime();
      if (currentTime > existingTime) {
        map.set(dedupKey, cred);
      }
    }
  }

  return Array.from(map.values());
};

const storedCredExIds = new Set();

export const holderService = {
  getDID: async () => {
    try {
      const meRes = await apiClient.get(ENDPOINTS.PROFILE.ME);
      const meData = meRes.data?.data || meRes.data;
      if (meData?.did) {
        return { success: true, data: { did: meData.did }, did: meData.did };
      }
      const didsRes = await apiClient.get(ENDPOINTS.PROFILE.DIDS);
      const didList = didsRes.data?.data?.results || didsRes.data?.data || didsRes.data || [];
      if (Array.isArray(didList) && didList.length > 0) {
        const d = didList[0]?.did || didList[0];
        return { success: true, data: { did: d }, did: d };
      }
    } catch {
      // fallback to session storage
      try {
        const stored = localStorage.getItem("user");
        if (stored) {
          const u = JSON.parse(stored);
          if (u.did) return { success: true, data: { did: u.did }, did: u.did };
        }
      } catch {
        // ignore
      }
    }
    return { success: true, data: { did: null }, did: null };
  },

  getCredentials: async () => {
    try {
      const res = await holderApi.getStoredCredentials();
      const rawList =
        res?.data?.results ||
        res?.data?.credentials ||
        res?.data ||
        res?.results ||
        (Array.isArray(res) ? res : []);
      const normalized = (Array.isArray(rawList) ? rawList : []).map((item, idx) => {
        const c = item?.raw || item?.credential || item;
        const id = c.referent || c.credential_id || c.id || c.cred_ex_id || `cred-${idx + 1}`;
        const schemaParts = String(c.schema_id || c.schemaId || "").split(":");
        const defParts = String(c.cred_def_id || c.credential_definition_id || c.credentialDefinitionId || "").split(":");
        const schemaName =
          c.schema_name ||
          c.schemaName ||
          (schemaParts.length >= 3 ? schemaParts[2] : null) ||
          (defParts.length >= 5 && defParts[4] !== "default" ? defParts[4] : null) ||
          "Verifiable Credential";

        // Normalize attrs / attributes into a clean flat object
        const rawAttrs = c.attrs || c.attributes || c.claims || {};
        const attrsObj = {};
        if (Array.isArray(rawAttrs)) {
          rawAttrs.forEach((item) => {
            if (typeof item === "object" && item !== null) {
              const k = item.name || item.name_tag || item.key;
              if (k) attrsObj[k] = item.value !== undefined ? String(item.value) : "";
            }
          });
        } else if (rawAttrs && typeof rawAttrs === "object") {
          Object.entries(rawAttrs).forEach(([k, v]) => {
            attrsObj[k] = typeof v === "object" && v?.value !== undefined ? String(v.value) : String(v ?? "");
          });
        }

        const credDefId = c.cred_def_id || c.credential_definition_id || c.credentialDefinitionId || "";
        const schemaId = c.schema_id || c.schemaId || "";
        const tag = defParts.length >= 5 ? defParts[4] : "default";
        const issuerDid = c.issuer_did || (defParts[0] ? `did:sov:${defParts[0]}` : (c.issuerDid || "did:sov:ledger"));
        const issuerName = c.issuer_alias || c.contact_label || c.issuer_name || c.issuerName || "Authorized Issuer";
        const issueDate = c.created_at || c.issue_date || c.issuedAt || new Date().toISOString();

        return {
          id,
          referent: id,
          credential_id: id,
          credentialDefinition: schemaName && tag && tag !== "default" ? `${schemaName} (${tag})` : (schemaName || "Verifiable Credential"),
          credentialDefinitionId: credDefId,
          cred_def_id: credDefId,
          credDefId,
          schemaId,
          schema_id: schemaId,
          schema: schemaName,
          schemaName,
          type: schemaName,
          issuer: issuerName,
          issuerName,
          issuerDid,
          issuanceDate: issueDate,
          issuedAt: issueDate,
          created_at: issueDate,
          status: c.revoked ? "Revoked" : "Active",
          revocationStatus: c.revoked ? "revoked" : "active",
          attrs: attrsObj,
          attributes: attrsObj,
          claims: attrsObj,
          raw: c,
        };
      });
      return { success: true, data: deduplicateCredentials(normalized) };
    } catch (err) {
      console.warn("getCredentials error:", err);
      return { success: true, data: [] };
    }
  },

  getMyCredentials: async () => {
    return await holderService.getCredentials();
  },

  getOffers: async () => {
    try {
      const res = await holderApi.getOffers();
      let rawOffers = [];
      if (res?.cred_ex_record) {
        rawOffers = [res.cred_ex_record];
      } else if (res?.data?.cred_ex_record) {
        rawOffers = [res.data.cred_ex_record];
      } else if (Array.isArray(res?.data?.results)) {
        rawOffers = res.data.results;
      } else if (Array.isArray(res?.data)) {
        rawOffers = res.data;
      } else if (Array.isArray(res?.results)) {
        rawOffers = res.results;
      } else if (Array.isArray(res)) {
        rawOffers = res;
      } else if (res?.data && typeof res.data === "object") {
        rawOffers = [res.data];
      }

      const normalized = rawOffers.map((item, idx) => {
        const o = item?.cred_ex_record || item?.record || item;
        const id = o.cred_ex_id || o.credential_exchange_id || o.id || `offer-${idx + 1}`;

        // 1. Extract claim attributes
        const attrsObj = {};
        const sources = [
          o?.cred_offer?.credential_preview?.attributes,
          o?.cred_preview?.attributes,
          o?.credential_preview?.attributes,
          o?.cred_proposal?.credential_preview?.attributes,
          o?.credential_offer_dict?.credential_preview?.attributes,
          o?.credential_proposal_dict?.credential_proposal?.attributes,
          o?.by_format?.cred_offer?.anoncreds?.attributes,
          o?.by_format?.cred_offer?.indy?.attributes,
          o?.by_format?.cred_issue?.anoncreds?.attributes,
          o?.attributes,
          o?.claims,
          o?.raw?.cred_offer?.credential_preview?.attributes,
        ];

        for (const src of sources) {
          if (!src) continue;
          if (Array.isArray(src) && src.length > 0) {
            src.forEach((it) => {
              if (typeof it === "object" && it !== null) {
                const name = it.name || it.name_tag || it.key;
                if (name) {
                  attrsObj[name] = it.value !== undefined ? String(it.value) : "";
                }
              }
            });
            if (Object.keys(attrsObj).length > 0) break;
          } else if (typeof src === "object" && !Array.isArray(src) && Object.keys(src).length > 0) {
            Object.entries(src).forEach(([k, v]) => {
              attrsObj[k] = typeof v === "object" && v?.value !== undefined ? String(v.value) : String(v ?? "");
            });
            if (Object.keys(attrsObj).length > 0) break;
          }
        }

        // 2. Extract schemaName and credDefId
        let schemaName =
          o.schema_name ||
          o.schemaName ||
          o.by_format?.cred_offer?.anoncreds?.schema_name ||
          o.by_format?.cred_offer?.indy?.schema_name ||
          o.by_format?.cred_issue?.anoncreds?.schema_name;

        const credDefId =
          o.cred_def_id ||
          o.credential_definition_id ||
          o.credDefId ||
          o.by_format?.cred_offer?.anoncreds?.cred_def_id ||
          o.by_format?.cred_offer?.indy?.cred_def_id ||
          o.by_format?.cred_issue?.anoncreds?.cred_def_id ||
          "";

        const sId =
          o.schema_id ||
          o.schemaId ||
          o.by_format?.cred_offer?.anoncreds?.schema_id ||
          o.by_format?.cred_offer?.indy?.schema_id;

        if (!schemaName && sId && sId.includes(":")) {
          const sParts = sId.split(":");
          if (sParts.length >= 3) schemaName = sParts[2];
        }

        const defParts = credDefId ? credDefId.split(":") : [];
        if (!schemaName && defParts.length >= 5 && defParts[4] !== "default") {
          schemaName = defParts[4];
        }
        if (!schemaName && o.comment && !o.comment.toLowerCase().includes("direct")) {
          schemaName = o.comment;
        }
        if (!schemaName) schemaName = "Verifiable Credential";

        const tag = defParts.length >= 5 ? defParts[4] : "default";
        const issuerDid =
          o.issuer_did ||
          o.senderDid ||
          o.sender_did ||
          o.their_did ||
          (defParts[0] ? `did:sov:${defParts[0]}` : "did:sov:issuer");

        const issuerName =
          o.senderName ||
          o.sender_name ||
          o.issuerName ||
          o.issuer_name ||
          o.contact_label ||
          o.issuer_alias ||
          o.their_label ||
          "Authorized Issuer";

        const comment =
          o.comment ||
          o.cred_offer?.comment ||
          o.cred_proposal?.comment ||
          "Official Credential Offer";

        const dateCreated = o.created_at || o.createdAt || new Date().toISOString();
        const cleanState = String(o.state || "").toLowerCase().replace(/_/g, "-");
        const displayStatus =
          cleanState === "offer-received"
            ? "Offer Received"
            : cleanState === "credential-received"
              ? "Credential Ready to Store"
              : cleanState === "done" || cleanState === "credential-acked"
                ? "Completed"
                : o.state || "Offer Received";

        return {
          id,
          cred_ex_id: id,
          credential_exchange_id: id,
          connection_id: o.connection_id,
          schema_name: schemaName,
          schemaName,
          credentialDefinition: schemaName && tag && tag !== "default" ? `${schemaName} (${tag})` : schemaName,
          credentialDefinitionId: credDefId,
          cred_def_id: credDefId,
          credDefId,
          issuerName,
          senderName: issuerName,
          issuerDid,
          senderDid: issuerDid,
          comment,
          display_status: displayStatus,
          state: o.state || cleanState,
          attributes: attrsObj,
          raw_attributes: attrsObj,
          attrs: attrsObj,
          claims: attrsObj,
          createdAt: dateCreated,
          created_at: dateCreated,
          raw: o,
        };
      });
      return { success: true, data: normalized };
    } catch (err) {
      console.warn("getOffers error:", err);
      return { success: true, data: [] };
    }
  },

  acceptOffer: async (credExId) => {
    const res = await holderApi.acceptOffer(credExId);
    // Background auto-store retry after 1.5s to capture the incoming credential once
    if (!storedCredExIds.has(credExId)) {
      setTimeout(async () => {
        try {
          if (!storedCredExIds.has(credExId)) {
            await holderApi.storeCredential(credExId);
            storedCredExIds.add(credExId);
          }
        } catch {
          // ignore if not yet arrived or already handled
        }
      }, 1500);
    }
    return res;
  },

  declineOffer: async (credExId) => {
    const res = await holderApi.declineOffer(credExId);
    return res;
  },

  storeCredential: async (credExId) => {
    storedCredExIds.add(credExId);
    const res = await holderApi.storeCredential(credExId);
    return res;
  },

  deleteCredential: async (credentialId) => {
    const res = await holderApi.deleteCredential(credentialId);
    return res;
  },

  getProofRequests: async () => {
    try {
      const res = await holderApi.getProofRequests();
      const rawRequests = res?.data?.results || res?.data || res?.results || [];
      const normalized = (Array.isArray(rawRequests) ? rawRequests : []).map((p, idx) => {
        const id = p.pres_ex_id || p.presentation_exchange_id || p.id || `proof-req-${idx + 1}`;
        const indyReq = p.presentation_request?.indy || p.proofRequest || {};
        const reqAttrs = Object.values(indyReq.requested_attributes || {}).map((a) => a.name).filter(Boolean);
        const reqPreds = Object.values(indyReq.requested_predicates || {}).map((pr) => ({
          name: pr.name,
          p_type: pr.p_type,
          p_value: pr.p_value,
          label: `${pr.name} ${pr.p_type} ${pr.p_value}`,
        }));
        return {
          id,
          presExId: id,
          connection_id: p.connection_id,
          name: indyReq.name || p.name || "Proof Request",
          verifierName: p.contact_label || "Relying Party",
          state: p.state || "request_received",
          requestedAttributes: reqAttrs.length ? reqAttrs : p.requestedAttributes || [],
          requestedPredicates: reqPreds.length ? reqPreds : p.requestedPredicates || [],
          createdAt: p.created_at || new Date().toISOString(),
          raw: p,
        };
      });
      return { success: true, data: normalized };
    } catch (err) {
      console.warn("getProofRequests error:", err);
      return { success: true, data: [] };
    }
  },

  respondToProofRequest: async (requestId, credentialIds, options) => {
    const payload = {
      credentials: credentialIds,
      revealedAttributes: options?.revealedAttributes || {},
      predicates: options?.predicates || [],
    };
    const res = await holderApi.presentProof(requestId, payload);
    return res;
  },

  sendProof: async (presExId, payload) => {
    const res = await holderApi.presentProof(presExId, payload);
    return res;
  },

  createInvitation: async (alias) => {
    return await connectionsApi.createInvitation(alias);
  },

  receiveInvitation: async (payload) => {
    return await connectionsApi.receiveInvitation(payload);
  },

  getConnections: async () => {
    try {
      const res = await connectionsApi.listConnections();
      return { success: true, data: extractList(res) };
    } catch (err) {
      console.warn("getConnections error:", err?.message || err);
      return { success: true, data: [] };
    }
  },
};

/**
 * Verifier Service
 */
export const verifierService = {
  getDID: async () => {
    try {
      const meRes = await apiClient.get(ENDPOINTS.PROFILE.ME);
      const meData = meRes.data?.data || meRes.data;
      if (meData?.did) {
        return { success: true, data: { did: meData.did }, did: meData.did };
      }
      const didsRes = await apiClient.get(ENDPOINTS.PROFILE.DIDS);
      const didList = didsRes.data?.data?.results || didsRes.data?.data || didsRes.data || [];
      if (Array.isArray(didList) && didList.length > 0) {
        const d = didList[0]?.did || didList[0];
        return { success: true, data: { did: d }, did: d };
      }
    } catch {
      // fallback
    }
    return { success: true, data: { did: null }, did: null };
  },

  getCatalog: async (query) => {
    const res = await verifierApi.getCredentialCatalog(query);
    return res;
  },

  createProofRequest: async (payload) => {
    const reqPayload = {
      connectionId: payload.connectionId || payload.connection_id,
      name: payload.name || "Proof Request",
      version: payload.version || "1.0",
      comment: payload.comment || "Proof verification requested",
      credDefId: payload.credDefId || payload.cred_def_id,
      revealedAttributes: (payload.requestedAttributes || []).map((a) => (typeof a === "object" ? a.name : a)),
      predicates: (payload.requestedPredicates || []).map((pr) => ({
        attribute: pr.name || pr.attribute,
        operator: pr.p_type || pr.operator || ">=",
        value: pr.p_value ?? pr.value ?? 1,
      })),
    };
    const res = await verifierApi.requestProof(reqPayload);
    return res;
  },

  getVerifications: async () => {
    try {
      const res = await verifierApi.getVerifications();
      const rawList = res?.data?.results || res?.data?.verifications || res?.data || res?.results || [];
      const normalized = (Array.isArray(rawList) ? rawList : []).map((v, idx) => {
        const id = v.id || v.presExId || v.pres_ex_id || `verif-${idx + 1}`;
        const verified = v.verified === true || v.verified === "true";
        return {
          id,
          presentation_exchange_id: v.presExId || v.pres_ex_id || id,
          connection_id: v.connectionId || v.connection_id,
          holderName: v.contact_label || v.holderName || "Connected Holder",
          requestName: v.name || v.display_title || "Credential Verification",
          state: v.state || (verified ? "verified" : "request_sent"),
          status: verified ? "verified" : v.display_status || v.state || "pending",
          verified: verified ? "true" : "false",
          verifiedAt: v.verifiedAt || v.completed_at || null,
          revealedClaims: v.revealed_attributes || v.revealedClaims || {},
          predicates: v.predicate_results || v.predicates || {},
          raw: v,
        };
      });
      return { success: true, data: normalized };
    } catch (err) {
      console.warn("getVerifications error:", err);
      return { success: true, data: [] };
    }
  },

  getPresentations: async () => {
    return verifierService.getVerifications();
  },

  getProofRequests: async () => {
    return verifierService.getVerifications();
  },

  verifyPresentation: async (presExId) => {
    const res = await verifierApi.getVerificationStatus(presExId);
    return res;
  },

  createInvitation: async (alias) => {
    return await connectionsApi.createInvitation(alias);
  },

  receiveInvitation: async (payload) => {
    return await connectionsApi.receiveInvitation(payload);
  },

  getConnections: async () => {
    try {
      const res = await connectionsApi.listConnections();
      return { success: true, data: extractList(res) };
    } catch (err) {
      console.warn("getConnections error:", err?.message || err);
      return { success: true, data: [] };
    }
  },

  createQrRequest: async (payload) => {
    const res = await verifierApi.createVerificationQr(payload);
    return res;
  },

  getQrRecords: async () => {
    const res = await verifierApi.getQrRecords();
    return res;
  },
};

/**
 * Admin Service (Innkeeper)
 */
export const adminService = {
  getUsers: async (filters) => {
    try {
      const res = await adminApi.getUsers(filters);
      const rawUsers = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.data?.users)
          ? res.data.users
          : Array.isArray(res)
            ? res
            : [];
      const normalized = rawUsers.map((u) => {
        const isEmailVerified = Boolean(
          u.emailVerified ??
          u.isEmailVerified ??
          u.email_verified ??
          u.verificationData?.emailVerified ??
          u.verificationData?.email_verified ??
          false
        );
        const regStatus = (u.registrationStatus || u.registration_status || "").toUpperCase();
        let status = (u.status || (u.isActive ? "active" : "pending")).toLowerCase();
        if (regStatus && regStatus !== "APPROVED" && regStatus !== "REGISTERED") {
          status = "pending";
        }

        return {
          ...u,
          id: u.id || u._id || u.userId,
          userId: u.userId || u.id || u._id,
          username: u.username || u.email,
          email: u.email || u.username,
          contact_name: u.fullName || u.contact_name || u.username,
          organization: u.organizationName || u.organization || "CDAC Enclave",
          role: u.role || "user",
          registrationStatus: regStatus || (status === "active" ? "APPROVED" : "PENDING"),
          emailVerified: isEmailVerified,
          status,
          createdAt: u.createdAt || u.created_at || new Date().toISOString(),
        };
      });
      return { success: true, data: normalized };
    } catch (err) {
      console.warn("Failed to fetch live admin users:", err);
      return { success: true, data: [] };
    }
  },

  getUser: async (id) => {
    const res = await adminApi.getUser(id);
    return res;
  },

  saveUser: async (userData) => {
    const cleanUsername = (userData.username || "").trim();
    const cleanEmail = userData.email?.trim() || (cleanUsername.includes("@") ? cleanUsername : `${cleanUsername}@cdac.in`);
    const payload = {
      username: cleanUsername,
      email: cleanEmail,
      password: userData.password || "Password123!@#",
      role: userData.role || "issuer",
      verificationMethod: "email",
      first_name: userData.first_name || userData.contact_name?.split(" ")[0] || "User",
      last_name: userData.last_name || userData.contact_name?.split(" ").slice(1).join(" ") || "Admin",
      organizationName: userData.organization || "CDAC Participant Enclave",
      organizationType: "educational_institution",
    };
    const res = await authApi.register(payload);
    return res;
  },

  updateUserStatus: async (id, status, extraRecord) => {
    // If activating or approving, use the official approve endpoint (POST /api/v1/admin/registrations/{userId}/approve)
    if (status === "active" || status === "approved") {
      const rawTenant =
        (extraRecord && (extraRecord.organization || extraRecord.tenant_name || extraRecord.username)) ||
        "subwallet";
      const cleanWallet = String(rawTenant)
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, "_")
        .slice(0, 32);
      const walletName = cleanWallet.endsWith("_subwallet") || cleanWallet.endsWith("_wallet")
        ? cleanWallet
        : `${cleanWallet}_subwallet`;

      return await adminApi.approveRegistration(id, {
        walletName,
        notes: "Approved by Governance Administrator.",
      });
    }

    const payload = {
      status,
      isActive: false,
    };
    const res = await adminApi.updateUserStatus(id, payload);
    return res;
  },

  deleteUser: async (id) => {
    const res = await adminApi.deleteUser(id);
    return res;
  },

  getReservations: async () => {
    try {
      const res = await adminApi.getPendingRegistrations();
      const rawList = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.data?.registrations)
          ? res.data.registrations
          : Array.isArray(res)
            ? res
            : [];
      const mapped = rawList.map((item) => {
        const isEmailVerified = Boolean(
          item.emailVerified ??
          item.isEmailVerified ??
          item.email_verified ??
          item.verificationData?.emailVerified ??
          item.verificationData?.email_verified ??
          false
        );
        return {
          reservation_id: item.userId || item.id || item.reservation_id,
          userId: item.userId || item.id,
          id: item.id || item.userId,
          username: item.username,
          tenant_name: item.organizationName || item.organization || item.username,
          organization_type: item.organizationType || "Participant Organization",
          domain: item.domain || item.email?.split("@")[1] || "cdac.in",
          contact_name: item.contact_name || item.fullName || item.username,
          contact_email: item.email || item.username,
          contact_phone: item.phone || item.contact_phone || "N/A",
          requested_role: item.role || "issuer",
          requested_capabilities: item.requested_capabilities || [
            `${(item.role || "issuer").toUpperCase()} Operations`,
          ],
          emailVerified: isEmailVerified,
          verificationMethod: item.verificationMethod || item.verificationData?.verificationMethod || "email",
          state:
            item.registrationStatus === "APPROVED" || item.status === "approved"
              ? "approved"
              : item.registrationStatus === "REJECTED" || item.status === "rejected"
                ? "denied"
                : "pending",
          provisioning_status: item.registrationStatus === "APPROVED" ? "completed" : "pending",
          created_at: item.createdAt || item.created_at || new Date().toISOString(),
          state_notes: item.state_notes || item.rejectionReason || "Awaiting Governance Review",
          raw: item,
        };
      });
      return { success: true, data: mapped };
    } catch (err) {
      console.warn("Failed to fetch pending registrations in live mode:", err);
      return { success: true, data: [] };
    }
  },

  approveReservation: async (reservationId, notesOrPayload, extraRecord) => {

    // Resolve target userId (UUID or unique username)
    const targetUserId =
      (typeof notesOrPayload === "object" && (notesOrPayload.userId || notesOrPayload.id)) ||
      (extraRecord && (extraRecord.userId || extraRecord.id || extraRecord.username)) ||
      reservationId;

    const rawTenant =
      (typeof notesOrPayload === "object" && notesOrPayload.walletName) ||
      (extraRecord && (extraRecord.tenant_name || extraRecord.username)) ||
      "subwallet";

    const cleanWallet = String(rawTenant)
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "_")
      .slice(0, 32);

    const walletName = cleanWallet.endsWith("_subwallet") || cleanWallet.endsWith("_wallet")
      ? cleanWallet
      : `${cleanWallet}_subwallet`;

    const notes =
      typeof notesOrPayload === "string"
        ? notesOrPayload
        : notesOrPayload?.notes || "Approved by Governance Administrator. Dedicated tenant enclave provisioned.";

    const payload = {
      walletName,
      notes,
    };

    // Strictly call POST /api/v1/admin/registrations/{userId}/approve (No PATCH fallback)
    try {
      const res = await adminApi.approveRegistration(targetUserId, payload);
      return res;
    } catch (err) {
      const rawMsg = err?.response?.data?.message || err?.message || "";
      const lower = rawMsg.toLowerCase();
      const displayName =
        (extraRecord && (extraRecord.username || extraRecord.contact_name || extraRecord.tenant_name)) ||
        (typeof notesOrPayload === "object" && (notesOrPayload.username || notesOrPayload.contact_name)) ||
        targetUserId;

      if (
        lower.includes("identity verification") ||
        lower.includes("verify their email") ||
        lower.includes("ekyc") ||
        lower.includes("epramaan") ||
        lower.includes("verification is still pending") ||
        lower.includes("verification pending")
      ) {
        err.friendlyMessage = `${displayName} email verification pending`;
      }
      throw err;
    }
  },

  denyReservation: async (reservationId, reason, extraRecord) => {
    const targetUserId = (extraRecord && (extraRecord.userId || extraRecord.id)) || reservationId;
    const res = await adminApi.rejectRegistration(targetUserId, {
      reason: reason || "Organization failed governance verification criteria.",
    });
    return res;
  },

  getTenants: async () => {
    try {
      // Derive active multi-tenant enclaves from live users/organizations
      const uRes = await adminApi.getUsers();
      const rawUsers = Array.isArray(uRes?.data) ? uRes.data : uRes?.data?.users || [];
      const tenantsFromUsers = rawUsers
        .filter((u) => u.organizationName || u.organization || u.role === "issuer" || u.role === "verifier")
        .map((u, idx) => ({
          tenant_id: u.id || `ten-${idx + 1}`,
          tenant_name: u.organizationName || u.organization || `${u.username} Organization`,
          is_active: u.status === "active" || u.isActive !== false,
          canBecomeIssuer: u.role === "issuer" || u.role === "admin",
          enable_ledger_switch: false,
          connect_to_endorser: ["CDAC-SSI Ledger"],
          created_public_did: u.did ? [u.did] : [],
          api_key_masked: u.apiKey ? `${u.apiKey.slice(0, 7)}...${u.apiKey.slice(-4)}` : "sk_live_****...configured",
          created_at: u.createdAt || new Date().toISOString(),
          wallet_id: u.wallet_id || `wal-${(u.id || idx).toString().slice(-4)}`,
        }));
      return { success: true, data: tenantsFromUsers };
    } catch (err) {
      console.warn("Failed to derive live tenants:", err);
      return { success: true, data: [] };
    }
  },

  updateTenantConfig: async (tenantId, updates) => {
    return { success: true, data: { tenantId, ...updates } };
  },

  deleteTenant: async (tenantId) => {
    return { success: true };
  },

  getServerConfig: async () => {
    try {
      const [statusRes, configRes, pluginsRes] = await Promise.allSettled([
        apiClient.get(ENDPOINTS.SERVER.STATUS),
        apiClient.get(ENDPOINTS.SERVER.CONFIG),
        apiClient.get(ENDPOINTS.SERVER.PLUGINS),
      ]);
      const statusData = statusRes.status === "fulfilled" ? statusRes.value?.data?.data : null;
      const configData = configRes.status === "fulfilled" ? configRes.value?.data?.data : null;
      const pluginsData = pluginsRes.status === "fulfilled" ? pluginsRes.value?.data?.data : null;

      return {
        success: true,
        data: {
          acapy_version: statusData?.version || "1.3.1",
          agent_label: statusData?.label || "SSI Issuer Agent",
          conductor: statusData?.conductor || {},
          traction_version: "2.0.0",
          swagger_url: "http://10.210.13.22:5000/api/doc",
          config: {
            "ledger.ledger_config_list": [
              {
                id: "cdac:ssi-ledger",
                endorser_alias: "CDAC-SSI Ledger",
                endorser_url: "http://10.210.13.22:9000/",
                endorser_did: "CDAC-SSI Genesis Node",
              },
            ],
            ...(configData || {}),
          },
          plugins: Array.isArray(pluginsData)
            ? pluginsData
            : [
              "aries_cloudagent.protocols.issue_credential.v2_0",
              "aries_cloudagent.protocols.present_proof.v2_0",
              "aries_cloudagent.revocation",
              "aries_cloudagent.connections",
              "aries_cloudagent.out_of_band",
            ],
        },
      };
    } catch {
      return {
        success: true,
        data: {
          acapy_version: "1.3.1",
          agent_label: "SSI Issuer Agent",
          traction_version: "2.0.0",
          swagger_url: "http://10.210.13.22:5000/api/doc",
          config: {
            "ledger.ledger_config_list": [
              {
                id: "cdac:ssi-ledger",
                endorser_alias: "CDAC-SSI Ledger",
                endorser_url: "http://10.210.13.22:9000/",
                endorser_did: "CDAC-SSI Genesis Node",
              },
            ],
          },
          plugins: [
            "aries_cloudagent.protocols.issue_credential.v2_0",
            "aries_cloudagent.protocols.present_proof.v2_0",
            "aries_cloudagent.revocation",
          ],
        },
      };
    }
  },

  getSystemHealth: async () => {
    try {
      const [liveRes, readyRes, statusRes] = await Promise.allSettled([
        apiClient.get(ENDPOINTS.SERVER.STATUS_LIVE),
        apiClient.get(ENDPOINTS.SERVER.STATUS_READY),
        apiClient.get(ENDPOINTS.SERVER.STATUS),
      ]);
      const isLive = liveRes.status === "fulfilled" && liveRes.value?.data?.data?.alive !== false;
      const isReady = readyRes.status === "fulfilled" && readyRes.value?.data?.data?.ready !== false;
      return {
        success: true,
        data: {
          backendHealth: isLive && isReady ? "healthy" : isLive ? "degraded" : "down",
          ledgerConnectivity: "connected",
          ledgerName: "CDAC-SSI Ledger",
          ledgerUrl: "http://10.210.13.22:9000/",
          agentStatus: {
            issuer: isLive ? "running" : "stopped",
            holder: isLive ? "running" : "stopped",
            verifier: isLive ? "running" : "stopped",
            innkeeper: isLive ? "running" : "stopped",
          },
          serverData: statusRes.status === "fulfilled" ? statusRes.value?.data?.data : null,
          lastSync: new Date().toISOString(),
        },
      };
    } catch {
      return {
        success: true,
        data: {
          backendHealth: "degraded",
          ledgerConnectivity: "connected",
          ledgerName: "CDAC-SSI Ledger",
          ledgerUrl: "http://10.210.13.22:9000/",
          lastSync: new Date().toISOString(),
        },
      };
    }
  },

  getAuditLogs: async () => {
    try {
      const res = await adminApi.getAuditLogs();
      const rawLogs = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.data?.logs)
          ? res.data.logs
          : Array.isArray(res)
            ? res
            : [];

      const normalizedLogs = rawLogs.map((log, idx) => {
        let detailsStr;
        if (typeof log.details === "object" && log.details !== null) {
          try {
            detailsStr = Object.entries(log.details)
              .map(([k, v]) => `${k}: ${v}`)
              .join(", ");
          } catch {
            detailsStr = JSON.stringify(log.details);
          }
        } else {
          detailsStr = String(log.details || log.message || "Administrative action executed");
        }

        const rawAction = log.display_action || log.action || log.event || "SYSTEM_EVENT";
        const cat =
          log.category ||
          (rawAction.includes("REGISTRATION")
            ? "Organization Onboarding"
            : rawAction.includes("USER")
              ? "User Governance"
              : rawAction.includes("TENANT") || rawAction.includes("CONFIG")
                ? "Tenant Configuration"
                : rawAction.includes("CREDENTIAL") || rawAction.includes("PROOF")
                  ? "Credentials & Proofs"
                  : "Organization Onboarding");

        return {
          id: log.id || `log-${idx + 1}`,
          event: rawAction,
          category: cat,
          user: log.display_name || log.user_label || log.username || log.userId || log.user || "System Administrator",
          target: log.target || log.userId || "System Network",
          details: detailsStr,
          rawDetails: log.details,
          status: log.status || "success",
          ipAddress: log.ipAddress || "127.0.0.1",
          timestamp: log.createdAt || log.timestamp || new Date().toISOString(),
        };
      });

      return { success: true, data: normalizedLogs };
    } catch (err) {
      console.warn("Failed to fetch live audit logs:", err);
      return { success: true, data: [] };
    }
  },
};

export default {
  auth: authService,
  issuer: issuerService,
  holder: holderService,
  verifier: verifierService,
  admin: adminService,
  connections: connectionsApi,
};