/**
 * Mock issuer service for development.
 * 
 * Provides mock data and interactive state handlers for:
 * - Credential definitions
 * - Schemas / Templates
 * - DID management
 * - Connections
 * - Issuance activity & Revocation
 * - Holder Proposals
 */

// In-memory state for local testing
let MOCK_SCHEMAS = [
  {
    id: "schema-degree-1",
    name: "University Degree",
    version: "1.0",
    issuer: "did:example:issuer1",
    attributes: ["studentName", "degreeType", "major", "graduationYear", "gradeAverage"],
    mandatoryFields: ["studentName", "degreeType", "graduationYear"],
    status: "active",
    createdAt: "2024-01-10T08:00:00Z",
  },
  {
    id: "schema-cert-2",
    name: "Cyber Security Certification",
    version: "1.0",
    issuer: "did:example:issuer1",
    attributes: ["holderName", "certificateId", "issueDate", "expiryDate", "securityLevel"],
    mandatoryFields: ["holderName", "certificateId", "securityLevel"],
    status: "active",
    createdAt: "2024-03-18T11:30:00Z",
  },
  {
    id: "schema-emp-3",
    name: "Corporate Employee ID",
    version: "1.0",
    issuer: "did:example:issuer1",
    attributes: ["employeeId", "fullName", "department", "designation", "clearanceLevel"],
    mandatoryFields: ["employeeId", "fullName", "department"],
    status: "active",
    createdAt: "2024-02-15T16:20:00Z",
  },
];

let MOCK_CREDENTIAL_DEFINITIONS = [
  {
    id: "cred-def-degree-1",
    schemaId: "schema-degree-1",
    schemaName: "University Degree",
    tag: "template-1",
    supportRevocation: true,
    identifier: "did:example:issuer1",
    status: "active",
    type: "CL_ACCUM",
    createdAt: "2024-01-15T10:30:00Z",
  },
  {
    id: "cred-def-cert-2",
    schemaId: "schema-cert-2",
    schemaName: "Cyber Security Certification",
    tag: "template-1",
    supportRevocation: true,
    identifier: "did:example:issuer1",
    status: "active",
    type: "CL_ACCUM",
    createdAt: "2024-03-22T14:15:00Z",
  },
  {
    id: "cred-def-emp-3",
    schemaId: "schema-emp-3",
    schemaName: "Corporate Employee ID",
    tag: "template-1",
    supportRevocation: false,
    identifier: "did:example:issuer1",
    status: "active",
    type: "CL",
    createdAt: "2024-02-20T08:45:00Z",
  },
];

const MOCK_DID = {
  did: "did:example:issuer1",
  method: "Indy / CDAC Ledger",
  verificationKey: "Ed25519-mock-pubkey-issuer-89abf03",
  created: "2024-01-10T08:00:00Z",
};

let MOCK_CONNECTIONS = [
  {
    id: "conn-1",
    holderDid: "did:example:holder1",
    holderName: "Alice Johnson",
    alias: "Alice (Student Wallet)",
    status: "active",
    createdAt: "2024-05-01T10:00:00Z",
  },
  {
    id: "conn-2",
    holderDid: "did:example:holder2",
    holderName: "Bob Smith",
    alias: "Bob (Tech Staff)",
    status: "active",
    createdAt: "2024-05-05T14:30:00Z",
  },
  {
    id: "conn-3",
    holderDid: "did:example:holder3",
    holderName: "Charlie Rao",
    alias: "Charlie (Researcher)",
    status: "pending",
    createdAt: "2024-05-08T11:20:00Z",
  },
];

let MOCK_ISSUANCE_ACTIVITY = [
  {
    id: "cred-ex-101",
    credentialDefinitionId: "cred-def-degree-1",
    schemaName: "University Degree",
    holderDid: "did:example:holder1",
    holderName: "Alice Johnson",
    attributes: {
      studentName: "Alice Johnson",
      degreeType: "Bachelor of Technology",
      major: "Computer Science & Engineering",
      graduationYear: "2024",
      gradeAverage: "9.2 CGPA",
    },
    status: "issued",
    revoked: false,
    issuedAt: "2024-05-10T14:00:00Z",
  },
  {
    id: "cred-ex-102",
    credentialDefinitionId: "cred-def-cert-2",
    schemaName: "Cyber Security Certification",
    holderDid: "did:example:holder2",
    holderName: "Bob Smith",
    attributes: {
      holderName: "Bob Smith",
      certificateId: "CYBER-SEC-8921",
      issueDate: "2024-04-15",
      expiryDate: "2027-04-15",
      securityLevel: "Level 3 - Enterprise",
    },
    status: "issued",
    revoked: false,
    issuedAt: "2024-05-12T09:30:00Z",
  },
  {
    id: "cred-ex-103",
    credentialDefinitionId: "cred-def-emp-3",
    schemaName: "Corporate Employee ID",
    holderDid: "did:example:holder1",
    holderName: "Alice Johnson",
    attributes: {
      employeeId: "EMP-4482",
      fullName: "Alice Johnson",
      department: "Cryptographic Research",
      designation: "Lead Security Auditor",
      clearanceLevel: "Top Secret",
    },
    status: "revoked",
    revoked: true,
    revocationReason: "Role transferred to external agency",
    issuedAt: "2024-02-18T10:15:00Z",
    revokedAt: "2024-04-01T16:00:00Z",
  },
];

let MOCK_PROPOSALS = [
  {
    id: "prop-1",
    holderDid: "did:example:holder3",
    holderName: "Charlie Rao",
    schemaId: "schema-cert-2",
    schemaName: "Cyber Security Certification",
    attributes: {
      holderName: "Charlie Rao",
      certificateId: "CYBER-SEC-9904",
      issueDate: "2024-05-14",
      expiryDate: "2027-05-14",
      securityLevel: "Level 2 - Professional",
    },
    comment: "Completed practical defense lab assessment, requesting signed credential.",
    createdAt: "2024-05-14T08:00:00Z",
    status: "pending",
  },
  {
    id: "prop-2",
    holderDid: "did:example:holder1",
    holderName: "Alice Johnson",
    schemaId: "schema-emp-1",
    schemaName: "Corporate Employee ID",
    attributes: {
      fullName: "Alice Johnson",
      employeeId: "EMP-9201",
      department: "Cloud Security",
      role: "Security Engineer",
    },
    comment: "New hire onboarding verification request.",
    createdAt: "2024-05-15T09:30:00Z",
    status: "pending",
  },
  {
    id: "prop-3",
    holderDid: "did:example:holder2",
    holderName: "Bob Smith",
    schemaId: "schema-edu-3",
    schemaName: "Academic Degree Certificate",
    attributes: {
      studentName: "Bob Smith",
      degree: "Master of Technology",
      major: "Cybersecurity & Cryptography",
      graduationYear: "2024",
    },
    comment: "Graduation credential issuance request.",
    createdAt: "2024-05-16T11:15:00Z",
    status: "pending",
  },
];

let MOCK_INVITATIONS = [
  {
    id: "inv-issuer-1",
    alias: "Issuer Portal Open Registration",
    multiUse: true,
    invitationUrl: "https://ssi.cdac.in/invite?c_i=eyJhbGciOiJFZDI1NTE5IiwidHlwZSI6ImRpZGNvbW0ifQ==",
    createdAt: "2024-05-01T09:00:00Z",
  },
];

export const mockIssuerApi = {
  getDID: async () => {
    return { success: true, data: MOCK_DID };
  },

  getSchemas: async () => {
    return { success: true, data: [...MOCK_SCHEMAS] };
  },

  createSchema: async (payload) => {
    const newSchema = {
      id: `schema-${Date.now().toString(36)}`,
      name: payload.name.trim(),
      version: payload.version || "1.0",
      issuer: MOCK_DID.did,
      attributes: payload.attributes.filter(Boolean),
      mandatoryFields: payload.mandatoryFields || [],
      status: "active",
      createdAt: new Date().toISOString(),
    };
    MOCK_SCHEMAS.unshift(newSchema);
    return { success: true, data: newSchema };
  },

  getCredentialDefinitions: async () => {
    return { success: true, data: [...MOCK_CREDENTIAL_DEFINITIONS] };
  },

  createCredentialDefinition: async (payload) => {
    const schema = MOCK_SCHEMAS.find((s) => s.id === payload.schemaId);
    const newDef = {
      id: `cred-def-${Date.now().toString(36)}`,
      schemaId: payload.schemaId,
      schemaName: schema?.name || "Verifiable Schema",
      tag: payload.tag || "template-1",
      supportRevocation: !!payload.supportRevocation,
      identifier: MOCK_DID.did,
      status: "active",
      type: payload.supportRevocation ? "CL_ACCUM" : "CL",
      createdAt: new Date().toISOString(),
    };
    MOCK_CREDENTIAL_DEFINITIONS.unshift(newDef);
    return { success: true, data: newDef };
  },

  getConnections: async () => {
    return { success: true, data: [...MOCK_CONNECTIONS] };
  },

  getIssuanceActivity: async () => {
    return { success: true, data: [...MOCK_ISSUANCE_ACTIVITY] };
  },

  issueCredential: async (credentialDefinitionId, holderDid, payload) => {
    const credDef = MOCK_CREDENTIAL_DEFINITIONS.find((d) => d.id === credentialDefinitionId);
    const connection = MOCK_CONNECTIONS.find((c) => c.holderDid === holderDid);
    const newActivity = {
      id: `cred-ex-${Date.now().toString(36)}`,
      credentialDefinitionId,
      schemaName: credDef?.schemaName || "Custom Credential",
      holderDid,
      holderName: connection?.holderName || "Connected Holder",
      attributes: payload?.attributes || payload?.details || {},
      status: "issued",
      revoked: false,
      issuedAt: new Date().toISOString(),
    };
    MOCK_ISSUANCE_ACTIVITY.unshift(newActivity);
    return { success: true, data: newActivity };
  },

  revokeCredential: async (activityId, reason) => {
    const item = MOCK_ISSUANCE_ACTIVITY.find((a) => a.id === activityId);
    if (item) {
      item.status = "revoked";
      item.revoked = true;
      item.revocationReason = reason || "Revoked by issuer";
      item.revokedAt = new Date().toISOString();
    }
    return { success: true, data: item };
  },

  deleteActivity: async (activityId) => {
    MOCK_ISSUANCE_ACTIVITY = MOCK_ISSUANCE_ACTIVITY.filter((a) => a.id !== activityId);
    return { success: true };
  },

  getProposals: async () => {
    return { success: true, data: [...MOCK_PROPOSALS] };
  },

  acceptProposal: async (proposalId, { credDefId } = {}) => {
    const prop = MOCK_PROPOSALS.find((p) => p.id === proposalId);
    if (prop) {
      prop.status = "approved";
      await mockIssuerApi.issueCredential(
        credDefId || MOCK_CREDENTIAL_DEFINITIONS[0].id,
        prop.holderDid,
        { attributes: prop.attributes }
      );
      MOCK_PROPOSALS = MOCK_PROPOSALS.filter((p) => p.id !== proposalId);
    }
    return { success: true };
  },

  rejectProposal: async (proposalId, reason) => {
    MOCK_PROPOSALS = MOCK_PROPOSALS.filter((p) => p.id !== proposalId);
    return { success: true, reason };
  },

  // Connection Invitations
  getInvitations: async () => {
    return { success: true, data: [...MOCK_INVITATIONS] };
  },

  createInvitation: async ({ alias, multiUse }) => {
    const newInv = {
      id: `inv-${Date.now().toString(36)}`,
      alias: alias || "Issuer Peer Invitation",
      multiUse: !!multiUse,
      invitationUrl: `https://ssi.cdac.in/invite?c_i=${btoa(JSON.stringify({ alias, did: MOCK_DID.did, ts: Date.now() }))}`,
      createdAt: new Date().toISOString(),
    };
    MOCK_INVITATIONS.unshift(newInv);
    return { success: true, data: newInv };
  },

  acceptInvitation: async ({ invitationUrl, alias }) => {
    const newConn = {
      id: `conn-${Date.now().toString(36)}`,
      holderDid: `did:example:holder${Math.floor(Math.random() * 900 + 100)}`,
      holderName: alias || "New Peer Holder",
      alias: alias || "Accepted Peer Connection",
      status: "active",
      createdAt: new Date().toISOString(),
    };
    MOCK_CONNECTIONS.unshift(newConn);
    return { success: true, data: newConn };
  },

  deleteConnection: async (connId) => {
    MOCK_CONNECTIONS = MOCK_CONNECTIONS.filter((c) => c.id !== connId);
    return { success: true };
  },
};