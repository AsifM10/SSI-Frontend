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
    their_label: "Alice Johnson (Student Holder)",
    their_did: "did:sov:WRfXPg8EcRocfdZA69HP56",
    my_did: "did:sov:V3RF81mC9w4qP2xT8Y",
    state: "active",
    rfc23_state: "completed",
    created_at: "2024-05-01T10:00:00Z",
    invitation_key: "VerKeyAliceHolder123==",
    role: "Student",
  },
  {
    connection_id: "conn-v-2",
    their_label: "Bob Smith (Corporate Employee)",
    their_did: "did:sov:TR5XPg8EcRocfdZA69HP99",
    my_did: "did:sov:V3RF81mC9w4qP2xT8Y",
    state: "active",
    rfc23_state: "completed",
    created_at: "2024-05-10T14:30:00Z",
    invitation_key: "VerKeyBobSmith456==",
    role: "Software Engineer",
  },
  {
    connection_id: "conn-v-3",
    their_label: "Carol Davis (Government Officer)",
    their_did: "did:sov:CD99XPg8EcRocfdZA69HP11",
    my_did: "did:sov:V3RF81mC9w4qP2xT8Y",
    state: "invitation-sent",
    rfc23_state: "invitation-sent",
    created_at: "2024-05-14T08:00:00Z",
    invitation_key: "VerKeyCarolDavis789==",
    role: "Compliance Officer",
  },
  {
    connection_id: "conn-v-4",
    their_label: "David Miller (Contractor)",
    their_did: "did:sov:DM88XPg8EcRocfdZA69HP44",
    my_did: "did:sov:V3RF81mC9w4qP2xT8Y",
    state: "active",
    rfc23_state: "completed",
    created_at: "2024-05-16T11:20:00Z",
    invitation_key: "VerKeyDavidMiller012==",
    role: "Security Consultant",
  },
];

let MOCK_PRESENTATIONS = [
  {
    presentation_exchange_id: "pres-ex-001",
    connection_id: "conn-v-1",
    holder_name: "Alice Johnson",
    holder_did: "did:sov:WRfXPg8EcRocfdZA69HP56",
    role: "verifier",
    name: "Identity & Age Verification",
    version: "1.0",
    state: "presentation_received",
    verified: "false",
    created_at: "2024-05-14T10:00:00Z",
    updated_at: "2024-05-14T10:15:00Z",
    completed_at: null,
    comment: "Verify candidate identity and age over 18 for background check",
    presentation_request: {
      name: "Proof of Identity & Age",
      version: "1.0",
      requested_attributes: {
        attr_1: { name: "fullName", label: "Full Name" },
        attr_2: { name: "email", label: "Email Address" },
      },
      requested_predicates: {
        pred_1: { name: "age", p_type: ">=", p_value: 18, label: "Age >= 18" },
      },
      restrictions: [
        { schema_name: "National Identity / Age", issuer_did: "did:sov:M6Mbe3qx7vBQAitT21A2K1" },
      ],
    },
    presentation: {
      requested_proof: {
        revealed_attrs: {
          attr_1: { label: "Full Name", raw: "Alice Johnson", encoded: "1098273645" },
          attr_2: { label: "Email Address", raw: "alice.johnson@example.com", encoded: "8877665544" },
        },
        predicates: {
          pred_1: { label: "Age >= 18", satisfied: true, detail: "Age >= 18 cryptographically proven (ZKP - actual birthdate hidden)" },
        },
      },
      identifiers: [
        {
          schema_id: "M6Mbe3qx7vBQAitT21A2K1:2:National Identity:1.0",
          cred_def_id: "M6Mbe3qx7vBQAitT21A2K1:3:CL:12401:default",
          rev_reg_id: "M6Mbe3qx7vBQAitT21A2K1:4:CL_ACCUM:12401",
          timestamp: 1715681400,
        },
      ],
      verification_checks: {
        proof_valid: true,
        schema_matched: true,
        revocation_check: "passed",
        predicates_satisfied: true,
        summary: "Presentation received and ready for verifier validation. All mathematical proofs and cryptographic signatures are intact.",
      },
    },
  },
  {
    presentation_exchange_id: "pres-ex-002",
    connection_id: "conn-v-2",
    holder_name: "Bob Smith",
    holder_did: "did:sov:TR5XPg8EcRocfdZA69HP99",
    role: "verifier",
    name: "Academic Credentials Verification",
    version: "1.0",
    state: "verified",
    verified: "true",
    created_at: "2024-05-12T14:20:00Z",
    updated_at: "2024-05-12T14:45:00Z",
    completed_at: "2024-05-12T14:45:00Z",
    comment: "Verification of Master degree in Computer Science",
    presentation_request: {
      name: "Degree Verification",
      version: "1.0",
      requested_attributes: {
        attr_1: { name: "studentName", label: "Student Name" },
        attr_2: { name: "degreeType", label: "Degree" },
        attr_3: { name: "major", label: "Major / Specialization" },
        attr_4: { name: "graduationYear", label: "Graduation Year" },
      },
      requested_predicates: {
        pred_1: { name: "gradeAverage", p_type: ">=", p_value: 3.5, label: "GPA >= 3.5" },
      },
      restrictions: [
        { schema_name: "University Degree", issuer_did: "did:sov:M6Mbe3qx7vBQAitT21A2K1" },
      ],
    },
    presentation: {
      requested_proof: {
        revealed_attrs: {
          attr_1: { label: "Student Name", raw: "Bob Smith", encoded: "3847291823" },
          attr_2: { label: "Degree", raw: "Master of Science in Cybersecurity", encoded: "9988771122" },
          attr_3: { label: "Major", raw: "Cybersecurity & Cryptography", encoded: "11223344" },
          attr_4: { label: "Graduation Year", raw: "2023", encoded: "2023" },
        },
        predicates: {
          pred_1: { label: "GPA >= 3.5", satisfied: true, detail: "Grade point average >= 3.5 verified via zero-knowledge predicate" },
        },
      },
      identifiers: [
        {
          schema_id: "M6Mbe3qx7vBQAitT21A2K1:2:University Degree:1.0",
          cred_def_id: "M6Mbe3qx7vBQAitT21A2K1:3:CL:12402:academic-2024",
          timestamp: 1715525100,
        },
      ],
      verification_checks: {
        proof_valid: true,
        schema_matched: true,
        revocation_check: "passed",
        predicates_satisfied: true,
        summary: "Cryptographic signature validated against University Issuer public key. Credential is active and non-revoked.",
      },
    },
  },
  {
    presentation_exchange_id: "pres-ex-003",
    connection_id: "conn-v-1",
    holder_name: "Alice Johnson",
    holder_did: "did:sov:WRfXPg8EcRocfdZA69HP56",
    role: "verifier",
    name: "Security Clearance Verification",
    version: "1.0",
    state: "request_sent",
    verified: "false",
    created_at: "2024-05-15T09:00:00Z",
    updated_at: "2024-05-15T09:00:00Z",
    completed_at: null,
    comment: "Requesting Level-3 clearance badge validation for facility access",
    presentation_request: {
      name: "Security Clearance Check",
      version: "1.0",
      requested_attributes: {
        attr_1: { name: "clearanceLevel", label: "Clearance Level" },
        attr_2: { name: "badgeId", label: "Badge Identifier" },
      },
      requested_predicates: {},
      restrictions: [],
    },
    presentation: null,
  },
  {
    presentation_exchange_id: "pres-ex-004",
    connection_id: "conn-v-4",
    holder_name: "David Miller",
    holder_did: "did:sov:DM88XPg8EcRocfdZA69HP44",
    role: "verifier",
    name: "Corporate Employment Verification",
    version: "1.0",
    state: "abandoned",
    verified: "false",
    created_at: "2024-05-11T12:00:00Z",
    updated_at: "2024-05-11T15:30:00Z",
    completed_at: "2024-05-11T15:30:00Z",
    rejection_reason: "Holder declined verification request or requested attributes were missing from credential wallet",
    comment: "Verification of current employer status and department",
    presentation_request: {
      name: "Employment Check",
      version: "1.0",
      requested_attributes: {
        attr_1: { name: "fullName", label: "Full Name" },
        attr_2: { name: "department", label: "Department" },
        attr_3: { name: "designation", label: "Designation" },
      },
      requested_predicates: {},
      restrictions: [],
    },
    presentation: null,
  },
  {
    presentation_exchange_id: "pres-ex-005",
    connection_id: "conn-v-2",
    holder_name: "Bob Smith",
    holder_did: "did:sov:TR5XPg8EcRocfdZA69HP99",
    role: "verifier",
    name: "Cyber Security Certification",
    version: "1.0",
    state: "verified",
    verified: "true",
    created_at: "2024-05-09T08:30:00Z",
    updated_at: "2024-05-09T09:10:00Z",
    completed_at: "2024-05-09T09:10:00Z",
    comment: "Professional certification compliance check",
    presentation_request: {
      name: "Cyber Security Certificate Validation",
      version: "1.0",
      requested_attributes: {
        attr_1: { name: "holderName", label: "Holder Name" },
        attr_2: { name: "certificateId", label: "Certificate ID" },
        attr_3: { name: "securityLevel", label: "Security Level" },
      },
      requested_predicates: {},
      restrictions: [],
    },
    presentation: {
      requested_proof: {
        revealed_attrs: {
          attr_1: { label: "Holder Name", raw: "Bob Smith", encoded: "3847291823" },
          attr_2: { label: "Certificate ID", raw: "SEC-CERT-2024-998", encoded: "9982024" },
          attr_3: { label: "Security Level", raw: "Level 3 - Expert", encoded: "3" },
        },
        predicates: {},
      },
      identifiers: [
        {
          schema_id: "M6Mbe3qx7vBQAitT21A2K1:2:Cyber Security Certification:1.0",
          cred_def_id: "M6Mbe3qx7vBQAitT21A2K1:3:CL:12403:cert-2024",
          timestamp: 1715243400,
        },
      ],
      verification_checks: {
        proof_valid: true,
        schema_matched: true,
        revocation_check: "passed",
        predicates_satisfied: true,
        summary: "Certificate signature confirmed by certifying body public key. Revocation status confirmed clear.",
      },
    },
  },
];

export const mockVerifierApi = {
  /** Get all presentation records */
  getPresentations: async () => {
    await new Promise((resolve) => setTimeout(resolve, 250));
    return { success: true, data: [...MOCK_PRESENTATIONS] };
  },

  /** Get proof requests (formatted for verifier portal table) */
  getProofRequests: async () => {
    await new Promise((resolve) => setTimeout(resolve, 250));
    const list = MOCK_PRESENTATIONS.map((p) => {
      const attrs = Object.values(p.presentation_request?.requested_attributes || {}).map(
        (a) => a.label || a.name
      );
      const preds = Object.values(p.presentation_request?.requested_predicates || {}).map(
        (pr) => pr.label || `${pr.name} ${pr.p_type} ${pr.p_value}`
      );

      let computedStatus = "awaiting_presentation";
      if (p.verified === "true" || p.state === "verified") {
        computedStatus = "verified";
      } else if (p.state === "presentation_received") {
        computedStatus = "presentation_received";
      } else if (p.state === "abandoned" || p.state === "rejected") {
        computedStatus = "rejected";
      } else if (p.state === "failed") {
        computedStatus = "failed";
      }

      return {
        id: p.presentation_exchange_id,
        presentation_exchange_id: p.presentation_exchange_id,
        connection_id: p.connection_id,
        holderName: p.holder_name,
        holderDid: p.holder_did,
        name: p.name,
        title: p.name,
        requestedAttributes: attrs,
        requestedPredicates: preds,
        status: computedStatus,
        state: p.state,
        verified: p.verified,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
        completedAt: p.completed_at,
        comment: p.comment,
        rejectionReason: p.rejection_reason,
        raw: p,
      };
    });
    return { success: true, data: list };
  },

  /** Create a new proof request with attributes and predicates */
  createProofRequest: async (requestData) => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const newExId = `pres-ex-${Date.now().toString().slice(-4)}`;
    
    const connectionId = requestData.connectionId || "conn-v-1";
    const conn = MOCK_VERIFIER_CONNECTIONS.find((c) => c.connection_id === connectionId) || {
      their_label: requestData.holderName || "Connected Holder",
      their_did: "did:sov:WRfXPg8EcRocfdZA69HP56",
    };

    let requestedAttrs = {};
    if (Array.isArray(requestData.requestedAttributes)) {
      requestData.requestedAttributes.forEach((attr, idx) => {
        const attrName = typeof attr === "string" ? attr : attr.name;
        const attrLabel = typeof attr === "string" ? attr : attr.label || attr.name;
        requestedAttrs[`attr_${idx + 1}`] = { name: attrName, label: attrLabel };
      });
    }

    let requestedPreds = {};
    if (Array.isArray(requestData.requestedPredicates)) {
      requestData.requestedPredicates.forEach((p, idx) => {
        requestedPreds[`pred_${idx + 1}`] = {
          name: p.name,
          p_type: p.p_type || ">=",
          p_value: Number(p.p_value) || 18,
          label: p.label || `${p.name} ${p.p_type || ">="} ${p.p_value}`,
        };
      });
    }

    const newRecord = {
      presentation_exchange_id: newExId,
      connection_id: connectionId,
      holder_name: conn.their_label.replace(/\s*\(.*?\)/, "").trim(),
      holder_did: conn.their_did,
      role: "verifier",
      name: requestData.name || "Custom Proof Request",
      version: requestData.version || "1.0",
      state: "request_sent",
      verified: "false",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      completed_at: null,
      comment: requestData.comment || "Proof verification requested via verifier portal",
      presentation_request: {
        name: requestData.name || "Custom Proof Request",
        version: "1.0",
        requested_attributes: requestedAttrs,
        requested_predicates: requestedPreds,
        restrictions: requestData.restrictions || [],
      },
      presentation: null,
    };

    MOCK_PRESENTATIONS.unshift(newRecord);
    return { success: true, data: newRecord };
  },

  /** Verify / approve received presentation record */
  verifyPresentation: async (presentationExchangeId) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const record = MOCK_PRESENTATIONS.find((p) => p.presentation_exchange_id === presentationExchangeId);
    if (!record) {
      return { success: false, message: "Presentation record not found" };
    }

    record.state = "verified";
    record.verified = "true";
    record.updated_at = new Date().toISOString();
    record.completed_at = record.updated_at;
    if (record.presentation) {
      record.presentation.verification_checks = {
        proof_valid: true,
        schema_matched: true,
        revocation_check: "passed",
        predicates_satisfied: true,
        summary: "Cryptographic signature validated against issuer ledger anchor. Credential is active and non-revoked.",
      };
    }

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
      record.completed_at = record.updated_at;
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
      Object.values(record.presentation.requested_proof.revealed_attrs).forEach((val) => {
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
      my_did: "did:sov:V3RF81mC9w4qP2xT8Y",
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
      their_label: invitationPayload.alias || "New Holder Connection",
      their_did: "did:sov:PeerHolder" + Math.floor(Math.random() * 9000 + 1000),
      my_did: "did:sov:V3RF81mC9w4qP2xT8Y",
      state: "active",
      rfc23_state: "completed",
      created_at: new Date().toISOString(),
      invitation_key: "VerKeyPeerAccepted==",
    };
    MOCK_VERIFIER_CONNECTIONS.unshift(newConn);
    return { success: true, data: newConn };
  },
};