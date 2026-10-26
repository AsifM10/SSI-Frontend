/**
 * Mock verifier service for development.
 * 
 * Provides mock data and workflows matching ACA-Py / Traction v2:
 * - Presentation exchange records (requested attributes, predicates, revealed claims)
 * - Create proof request with selective disclosure and ZKP predicates
 * - Verify / approve presentation records
 * - Presentation details modal data
 * - Connection management & invitations
 */

let MOCK_VERIFIER_CONNECTIONS = [
  {
    connection_id: "conn-v-1",
    their_label: "Alice Johnson (Holder)",
    their_did: "did:sov:WRfXPg8EcRocfdZA69HP56",
    my_did: "did:sov:VRF9988776655443322110",
    state: "active",
    rfc23_state: "completed",
    created_at: "2024-05-01T10:00:00Z",
    invitation_key: "VerKeyAliceHolder123==",
  },
  {
    connection_id: "conn-v-2",
    their_label: "Bob Smith (Holder)",
    their_did: "did:sov:TR5XPg8EcRocfdZA69HP99",
    my_did: "did:sov:VRF9988776655443322110",
    state: "active",
    rfc23_state: "completed",
    created_at: "2024-05-10T14:30:00Z",
    invitation_key: "VerKeyBobSmith456==",
  },
  {
    connection_id: "conn-v-3",
    their_label: "Carol Davis (Holder)",
    their_did: "did:sov:CD99XPg8EcRocfdZA69HP11",
    my_did: "did:sov:VRF9988776655443322110",
    state: "invitation-sent",
    rfc23_state: "invitation-sent",
    created_at: "2024-05-14T08:00:00Z",
    invitation_key: "VerKeyCarolDavis789==",
  },
];

let MOCK_PRESENTATIONS = [
  {
    presentation_exchange_id: "pres-ex-001",
    connection_id: "conn-v-1",
    holder_name: "Alice Johnson",
    role: "verifier",
    name: "Identity & Age Verification",
    version: "1.0",
    state: "presentation_received",
    verified: "false",
    created_at: "2024-05-14T10:00:00Z",
    updated_at: "2024-05-14T10:15:00Z",
    comment: "Verify candidate identity and age over 18 for background check",
    presentation_request: {
      name: "Proof of Identity & Age",
      version: "1.0",
      requested_attributes: {
        attr_1: { name: "fullName" },
        attr_2: { name: "email" },
      },
      requested_predicates: {
        pred_1: { name: "age", p_type: ">=", p_value: 18 },
      },
    },
    presentation: {
      requested_proof: {
        revealed_attrs: {
          attr_1: { raw: "Alice Johnson", encoded: "1098273645" },
          attr_2: { raw: "alice.johnson@example.com", encoded: "8877665544" },
        },
        predicates: {
          pred_1: { sub_proof_index: 0, satisfied: true, detail: "age >= 18 is cryptographically verified (ZKP)" },
        },
      },
      identifiers: [
        {
          schema_id: "M6Mbe3qx7vBQAitT21A2K1:2:Citizen Identity:1.0",
          cred_def_id: "M6Mbe3qx7vBQAitT21A2K1:3:CL:12401:default",
          rev_reg_id: "M6Mbe3qx7vBQAitT21A2K1:4:CL_ACCUM:12401",
          timestamp: 1715681400,
        },
      ],
    },
  },
  {
    presentation_exchange_id: "pres-ex-002",
    connection_id: "conn-v-2",
    holder_name: "Bob Smith",
    role: "verifier",
    name: "Academic Credentials Verification",
    version: "1.0",
    state: "verified",
    verified: "true",
    created_at: "2024-05-12T14:20:00Z",
    updated_at: "2024-05-12T14:45:00Z",
    comment: "Verification of Master degree in Computer Science",
    presentation_request: {
      name: "Degree Verification",
      version: "1.0",
      requested_attributes: {
        attr_1: { name: "recipientName" },
        attr_2: { name: "degree" },
        attr_3: { name: "graduationYear" },
        attr_4: { name: "gpa" },
      },
      requested_predicates: {},
    },
    presentation: {
      requested_proof: {
        revealed_attrs: {
          attr_1: { raw: "Bob Smith", encoded: "3847291823" },
          attr_2: { raw: "Master of Science in Cybersecurity", encoded: "9988771122" },
          attr_3: { raw: "2023", encoded: "2023" },
          attr_4: { raw: "3.92", encoded: "392" },
        },
        predicates: {},
      },
      identifiers: [
        {
          schema_id: "M6Mbe3qx7vBQAitT21A2K1:2:University Degree:1.0",
          cred_def_id: "M6Mbe3qx7vBQAitT21A2K1:3:CL:12402:academic-2024",
          timestamp: 1715525100,
        },
      ],
    },
  },
  {
    presentation_exchange_id: "pres-ex-003",
    connection_id: "conn-v-1",
    holder_name: "Alice Johnson",
    role: "verifier",
    name: "Security Clearance Verification",
    version: "1.0",
    state: "request_sent",
    verified: "false",
    created_at: "2024-05-15T09:00:00Z",
    updated_at: "2024-05-15T09:00:00Z",
    comment: "Requesting Level-3 clearance badge validation",
    presentation_request: {
      name: "Security Clearance Check",
      version: "1.0",
      requested_attributes: {
        attr_1: { name: "clearanceLevel" },
        attr_2: { name: "badgeId" },
      },
      requested_predicates: {},
    },
    presentation: null,
  },
];

export const mockVerifierApi = {
  /** Get all presentation records */
  getPresentations: async () => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return { success: true, data: [...MOCK_PRESENTATIONS] };
  },

  /** Get proof requests (alias for backwards compatibility) */
  getProofRequests: async () => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    // Transform presentation records into friendly proof request objects
    const list = MOCK_PRESENTATIONS.map((p) => ({
      id: p.presentation_exchange_id,
      holderDid: p.connection_id,
      holderName: p.holder_name,
      requestedAttributes: Object.values(p.presentation_request?.requested_attributes || {}).map((a) => a.name),
      status: p.verified === "true" ? "verified" : p.state === "presentation_received" ? "review" : "pending",
      createdAt: p.created_at,
      expiresAt: new Date(new Date(p.created_at).getTime() + 7 * 86400000).toISOString(),
      raw: p,
    }));
    return { success: true, data: list };
  },

  /** Create a new proof request with attributes and predicates */
  createProofRequest: async (requestData) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const newExId = `pres-ex-${Date.now().toString().slice(-4)}`;
    
    // Support either old signature (attributes, holderConnection) or new object signature
    const connectionId = requestData.connectionId || requestData.holderConnection?.id || "conn-v-1";
    const conn = MOCK_VERIFIER_CONNECTIONS.find((c) => c.connection_id === connectionId) || {
      their_label: requestData.holderConnection?.holderName || "Peer Holder",
    };

    let requestedAttrs = {};
    if (Array.isArray(requestData.attributes)) {
      requestData.attributes.forEach((attr, idx) => {
        requestedAttrs[`attr_${idx + 1}`] = { name: attr };
      });
    } else if (Array.isArray(requestData.requestedAttributes)) {
      requestData.requestedAttributes.forEach((attr, idx) => {
        requestedAttrs[`attr_${idx + 1}`] = { name: attr };
      });
    }

    let requestedPreds = {};
    if (Array.isArray(requestData.requestedPredicates)) {
      requestData.requestedPredicates.forEach((p, idx) => {
        requestedPreds[`pred_${idx + 1}`] = {
          name: p.name,
          p_type: p.p_type || ">=",
          p_value: Number(p.p_value) || 18,
        };
      });
    }

    const newRecord = {
      presentation_exchange_id: newExId,
      connection_id: connectionId,
      holder_name: conn.their_label.replace(" (Holder)", ""),
      role: "verifier",
      name: requestData.name || "Custom Proof Request",
      version: requestData.version || "1.0",
      state: "request_sent",
      verified: "false",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      comment: requestData.comment || "Proof verification requested via portal",
      presentation_request: {
        name: requestData.name || "Custom Proof Request",
        version: requestData.version || "1.0",
        requested_attributes: requestedAttrs,
        requested_predicates: requestedPreds,
      },
      presentation: null,
    };

    MOCK_PRESENTATIONS.unshift(newRecord);
    return { success: true, data: newRecord };
  },

  /** Verify / approve received presentation record */
  verifyPresentation: async (presentationExchangeId) => {
    await new Promise((resolve) => setTimeout(resolve, 600));
    const record = MOCK_PRESENTATIONS.find((p) => p.presentation_exchange_id === presentationExchangeId);
    if (!record) {
      return { success: false, message: "Presentation record not found" };
    }

    record.state = "verified";
    record.verified = "true";
    record.updated_at = new Date().toISOString();

    return {
      success: true,
      data: {
        status: "verified",
        verifiedAt: record.updated_at,
        record,
      },
    };
  },

  /** Reject a presentation exchange */
  rejectPresentation: async (presentationExchangeId, reason = "Verification failed") => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const record = MOCK_PRESENTATIONS.find((p) => p.presentation_exchange_id === presentationExchangeId);
    if (record) {
      record.state = "abandoned";
      record.verified = "false";
      record.rejection_reason = reason;
      record.updated_at = new Date().toISOString();
    }
    return { success: true, data: record };
  },

  /** Delete presentation exchange record */
  deletePresentation: async (presentationExchangeId) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    MOCK_PRESENTATIONS = MOCK_PRESENTATIONS.filter((p) => p.presentation_exchange_id !== presentationExchangeId);
    return { success: true };
  },

  /** Get verification results by ID */
  getVerificationResults: async (requestId) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const record = MOCK_PRESENTATIONS.find((p) => p.presentation_exchange_id === requestId);
    if (!record) {
      return { success: true, data: { status: "pending" } };
    }
    const revealedClaims = {};
    if (record.presentation?.requested_proof?.revealed_attrs) {
      Object.entries(record.presentation.requested_proof.revealed_attrs).forEach(([_, val]) => {
        revealedClaims[val.raw] = val.raw;
      });
    }
    return {
      success: true,
      data: {
        proofRequestId: record.presentation_exchange_id,
        status: record.verified === "true" ? "verified" : record.state,
        verifiedAt: record.verified === "true" ? record.updated_at : null,
        claims: revealedClaims,
        presentationStatus: record.state,
        record,
      },
    };
  },

  /** Get connections */
  getConnections: async () => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return { success: true, data: [...MOCK_VERIFIER_CONNECTIONS] };
  },

  /** Create new connection invitation */
  createInvitation: async (alias = "Verifier Invitation") => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const invId = `inv-v-${Date.now().toString().slice(-4)}`;
    const newInvitation = {
      connection_id: invId,
      their_label: alias,
      their_did: "did:sov:PendingPeerDid" + Math.floor(Math.random() * 9000 + 1000),
      my_did: "did:sov:VRF9988776655443322110",
      state: "invitation-sent",
      rfc23_state: "invitation-sent",
      created_at: new Date().toISOString(),
      invitation_url: `https://traction.example.com/invitation?c_i=eyJAdHlwZSI6ImRpZDpzb3Y6QnpDYX...v${invId}`,
    };
    MOCK_VERIFIER_CONNECTIONS.unshift(newInvitation);
    return { success: true, data: newInvitation };
  },

  /** Accept / receive connection invitation */
  receiveInvitation: async (invitationPayload) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const newConn = {
      connection_id: `conn-v-${Date.now().toString().slice(-4)}`,
      their_label: invitationPayload.alias || "External Holder Peer",
      their_did: "did:sov:PeerHolder" + Math.floor(Math.random() * 9000 + 1000),
      my_did: "did:sov:VRF9988776655443322110",
      state: "active",
      rfc23_state: "completed",
      created_at: new Date().toISOString(),
      invitation_key: "VerKeyPeerAccepted==",
    };
    MOCK_VERIFIER_CONNECTIONS.unshift(newConn);
    return { success: true, data: newConn };
  },
};