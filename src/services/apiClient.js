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
          ? rawData.schema_ids.map((id) => {
              const parts = String(id).split(":");
              return {
                id,
                schema_id: id,
                schemaId: id,
                name: parts[2] || id,
                version: parts[3] || "1.0",
                attributes: [],
                status: "active",
              };
            })
          : [];

      const normalized = rawList.map((s, idx) => {
        if (typeof s === "string") {
          const parts = s.split(":");
          const parsedIssuerDid = parts.length >= 4 ? parts[0] : null;
          return {
            id: s,
            schema_id: s,
            schemaId: s,
            issuerDid: parsedIssuerDid,
            name: parts[2] || s,
            version: parts[3] || "1.0",
            attributes: [],
            status: "active",
          };
        }
        const schemaId = s.schema_id || s.schemaId || s.id || `schema-${idx + 1}`;
        const parts = schemaId.includes(":") ? schemaId.split(":") : [];
        const parsedIssuerDid = parts.length >= 4 ? parts[0] : null;
        const name = s.schemaName || s.schema_name || s.name || (parts[2] || schemaId);
        const version = s.schemaVersion || s.schema_version || s.version || (parts[3] || "1.0");
        const attributes = Array.isArray(s.attributes) && s.attributes.length > 0
          ? s.attributes
          : Array.isArray(s.attrNames) && s.attrNames.length > 0
            ? s.attrNames
            : Array.isArray(s.attr_names) && s.attr_names.length > 0
              ? s.attr_names
              : [];
        return {
          id: schemaId,
          schema_id: schemaId,
          schemaId,
          issuerDid: s.issuerDid || s.issuer_did || parsedIssuerDid,
          name,
          version,
          attributes,
          attrNames: attributes,
          status: s.status || "active",
          raw: s,
        };
      });

      return { success: true, data: normalized };
    } catch (err) {
      console.warn("getSchemas error:", err?.message || err);
      return { success: true, data: [] };
    }
  },

  createSchema: async (schemaData) => {
    const payload = {
      schemaName: schemaData.name || schemaData.schemaName || schemaData.schema_name,
      schema_name: schemaData.name || schemaData.schemaName || schemaData.schema_name,
      schemaVersion: schemaData.version || schemaData.schemaVersion || schemaData.schema_version || "1.0",
      schema_version: schemaData.version || schemaData.schemaVersion || schemaData.schema_version || "1.0",
      attributes: schemaData.attributes || [],
      issuanceMode: schemaData.issuanceMode || "AUTO_ISSUE",
    };
    const res = await issuerApi.createSchema(payload);
    return res;
  },

  getCredentialDefinitions: async () => {
    try {
      // Real-time backend endpoint: GET /api/v1/issuer/credential-definitions
      const res = await issuerApi.getCreatedCredDefs();
      const rawData = res?.data?.credential_definitions || res?.data?.results || res?.data || res?.credential_definitions || res || [];
      const rawList = Array.isArray(rawData)
        ? rawData
        : Array.isArray(rawData?.credential_definition_ids)
          ? rawData.credential_definition_ids.map((id) => {
              const parts = String(id).split(":");
              return {
                id,
                cred_def_id: id,
                credentialDefinitionId: id,
                schemaId: parts[0] ? `${parts[0]}:2:${parts[3] || "schema"}:1.0` : "N/A",
                tag: parts[4] || "default",
                supportRevocation: false,
              };
            })
          : [];

      const normalized = rawList.map((d, idx) => {
        if (typeof d === "string") {
          return {
            id: d,
            cred_def_id: d,
            credentialDefinitionId: d,
            tag: "default",
          };
        }
        const credDefId = d.cred_def_id || d.credential_definition_id || d.credentialDefinitionId || d.id || `cred-def-${idx + 1}`;
        const schemaId = d.schema_id || d.schemaId || d.schema || "";
        const tag = d.tag || "default";
        const supportRevocation = Boolean(d.support_revocation ?? d.supportRevocation ?? false);
        return {
          id: credDefId,
          cred_def_id: credDefId,
          credentialDefinitionId: credDefId,
          schemaId,
          tag,
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

  createCredentialDefinition: async (credDefData) => {
    const payload = {
      schema_id: credDefData.schema_id || credDefData.schemaId || credDefData.id,
      schemaId: credDefData.schema_id || credDefData.schemaId || credDefData.id,
      tag: credDefData.tag || "default",
      support_revocation: Boolean(credDefData.support_revocation ?? credDefData.supportRevocation ?? false),
      supportRevocation: Boolean(credDefData.support_revocation ?? credDefData.supportRevocation ?? false),
      revocation_registry_size: credDefData.revocation_registry_size || credDefData.revocationRegistrySize || 1000,
    };
    const res = await issuerApi.createCredDef(payload);
    return res;
  },

  getConnections: async () => {
    try {
      const res = await connectionsApi.listConnections();
      const rawList = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.results)
          ? res.results
          : Array.isArray(res)
            ? res
            : [];
      return { success: true, data: rawList };
    } catch (err) {
      console.warn("getConnections skipped (subwallet pending):", err?.message || err);
      return { success: true, data: [], unprovisioned: true };
    }
  },

  createInvitation: async (alias) => {
    const res = await connectionsApi.createInvitation({ alias });
    return res;
  },

  receiveInvitation: async (invitationPayload) => {
    const res = await connectionsApi.receiveInvitation(invitationPayload);
    return res;
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
        const data = res?.data || res?.results || res || [];
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

      const mapped = rawRecords.map((r, idx) => ({
        id: r.cred_ex_id || r.credential_exchange_id || r.id || `act-${idx + 1}`,
        credentialDefinitionId: r.cred_def_id || r.credential_definition_id || r.credentialDefinitionId || "N/A",
        schemaName: r.schema_id || r.schemaName || "Verifiable Credential",
        holderDid: r.holder_did || r.their_did || r.connection_id || r.holderDid || "Edge Holder",
        holderName: r.holder_name || r.their_label || r.display_label || r.holderName || "Connected Holder",
        attributes: r.cred_offer?.credential_preview?.attributes || r.credential_preview?.attributes || r.attributes || {},
        status:
          r.state === "credential_acked" || r.state === "done" || r.state === "issued" || r.status === "issued"
            ? "issued"
            : r.state === "deleted" || r.revoked
              ? "revoked"
              : "pending",
        revoked: r.revocationStatus === "revoked" || r.revoked === true,
        issuedAt: r.created_at || r.updated_at || r.issuedAt || new Date().toISOString(),
        raw: r,
      }));

      return { success: true, data: mapped };
    } catch (err) {
      console.warn("Failed to fetch live issuance records:", err);
      return { success: true, data: [] };
    }
  },

  createCredentialDefinition: async (credDefData) => {
    const payload = {
      schema_id: credDefData.schemaId || credDefData.schema_id,
      schema_name: credDefData.schemaName || credDefData.schema_name,
      schema_version: credDefData.schemaVersion || credDefData.schema_version || "1.0",
      attributes: credDefData.attributes || [],
      tag: credDefData.tag || "default",
      support_revocation: credDefData.supportRevocation ?? credDefData.support_revocation ?? false,
      revocation_registry_size: credDefData.revocationRegistrySize ?? credDefData.revocation_registry_size ?? 1000,
    };
    const res = await issuerApi.createCredDef(payload);
    return res;
  },

  issueCredential: async (credentialDefId, holderDidOrConnId, attributes) => {
    const formattedAttributes =
      typeof attributes === "object" && !Array.isArray(attributes)
        ? Object.entries(attributes).map(([name, value]) => ({ name, value: String(value) }))
        : attributes;

    const payload = {
      credDefId: credentialDefId,
      connectionId: holderDidOrConnId,
      attributes: formattedAttributes,
      comment: "Official verifiable credential issuance",
      auto_issue: true,
    };
    const res = await issuerApi.issueCredential(payload);
    return res;
  },

  revokeCredential: async (recordOrId, reason) => {
    let payload = {};
    if (typeof recordOrId === "object" && recordOrId !== null) {
      payload = {
        credRevId: recordOrId.credRevId || recordOrId.cred_rev_id || recordOrId.revocationId || "1",
        revRegId: recordOrId.revRegId || recordOrId.rev_reg_id || recordOrId.revocationRegistryId || "",
        publish: true,
        reason: reason || "Administrative revocation",
      };
    } else {
      payload = {
        credRevId: String(recordOrId),
        revRegId: "",
        publish: true,
        reason: reason || "Administrative revocation",
      };
    }
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
    const res = await connectionsApi.listConnections();
    return res;
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
      const rawList = res?.data?.results || res?.data || res?.results || [];
      const normalized = (Array.isArray(rawList) ? rawList : []).map((c, idx) => {
        const id = c.referent || c.credential_id || c.id || `cred-${idx + 1}`;
        const schemaParts = (c.schema_id || "").split(":");
        const defParts = (c.cred_def_id || "").split(":");
        const schemaName = c.schema_name || schemaParts[2] || "Verifiable Credential";
        return {
          id,
          referent: id,
          credentialDefinition: c.display_title || `${schemaName} (${defParts[4] || "default"})`,
          type: schemaName,
          issuerName: c.issuer_alias || c.contact_label || "Authorized Issuer",
          issuerDid: c.issuer_did || defParts[0] || "did:sov:ledger",
          issuanceDate: c.created_at || c.issue_date || new Date().toISOString(),
          status: c.revoked ? "Revoked" : "Active",
          attrs: c.attrs || c.attributes || {},
          raw: c,
        };
      });
      return { success: true, data: normalized };
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
      const rawOffers = res?.data?.results || res?.data || res?.results || [];
      const normalized = (Array.isArray(rawOffers) ? rawOffers : []).map((o, idx) => {
        const id = o.cred_ex_id || o.credential_exchange_id || o.id || `offer-${idx + 1}`;
        const schemaName = o.schema_name || o.credential_definition_id?.split(":")[2] || "Verifiable Credential";
        return {
          id,
          cred_ex_id: id,
          connection_id: o.connection_id,
          schema_name: schemaName,
          schemaName,
          issuerName: o.contact_label || o.issuer_alias || "Authorized Issuer",
          display_status: o.display_status || o.state || "Offer Received",
          state: o.state || "offer_received",
          attributes: o.credential_proposal_dict?.credential_proposal?.attributes || o.attributes || [],
          credDefId: o.cred_def_id || o.credential_definition_id,
          createdAt: o.created_at || new Date().toISOString(),
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
    // Optionally trigger store after accept if already issued
    try {
      await holderApi.storeCredential(credExId);
    } catch {
      // ignore
    }
    return res;
  },

  declineOffer: async (credExId) => {
    const res = await holderApi.declineOffer(credExId);
    return res;
  },

  storeCredential: async (credExId) => {
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
    const res = await connectionsApi.listConnections();
    return res;
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
    const res = await connectionsApi.listConnections();
    return res;
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