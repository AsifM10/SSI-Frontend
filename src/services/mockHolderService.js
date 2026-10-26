/**
 * Mock holder service for development.
 * 
 * Provides mock data for holder-facing SSI features:
 * - Wallet Credentials
 * - Peer Connections
 * - Credential Offers (accept / decline)
 * - Proof Presentations (selective disclosure & ZKP predicates)
 * - Credential Proposals to Issuers
 */

let MOCK_CREDENTIALS = [
  {
    id: "cred-deg-01",
    referent: "referent-deg-101",
    issuerDid: "did:example:issuer1",
    issuerName: "University of Example",
    credentialDefinition: "University Degree",
    schemaId: "schema-degree-1",
    attrs: {
      studentName: "Alice Johnson",
      degreeType: "Bachelor of Technology",
      major: "Computer Science & Engineering",
      graduationYear: "2024",
      gradeAverage: "9.2 CGPA",
    },
    issueDate: "2024-05-10T14:00:00Z",
    status: "verified",
    type: "CL_ACCUM",
  },
  {
    id: "cred-sec-02",
    referent: "referent-sec-202",
    issuerDid: "did:example:issuer1",
    issuerName: "C-DAC Cyber Academy",
    credentialDefinition: "Cyber Security Certification",
    schemaId: "schema-cert-2",
    attrs: {
      holderName: "Alice Johnson",
      certificateId: "CYBER-SEC-8921",
      issueDate: "2024-04-15",
      expiryDate: "2027-04-15",
      securityLevel: "Level 3 - Enterprise",
    },
    issueDate: "2024-04-22T09:00:00Z",
    status: "verified",
    type: "CL_ACCUM",
  },
];

let MOCK_CONNECTIONS = [
  {
    id: "conn-holder-1",
    peerDid: "did:example:issuer1",
    peerName: "C-DAC Credential Issuer",
    alias: "University Authority",
    status: "active",
    createdAt: "2024-05-01T10:00:00Z",
  },
  {
    id: "conn-holder-2",
    peerDid: "did:example:verifier1",
    peerName: "FinTech Compliance Verifier",
    alias: "KYC Compliance Hub",
    status: "active",
    createdAt: "2024-05-05T14:30:00Z",
  },
];

let MOCK_OFFERS = [
  {
    id: "offer-emp-1",
    senderDid: "did:example:issuer1",
    senderName: "C-DAC Enterprise Issuer",
    credentialDefinition: "Corporate Employee ID",
    schemaId: "schema-emp-3",
    attributes: {
      employeeId: "EMP-9921",
      fullName: "Alice Johnson",
      department: "Decentralized Systems",
      designation: "Security Architect",
      clearanceLevel: "Level 4 - National",
    },
    comment: "Pre-approved corporate credential offer. Accept to store in your digital wallet.",
    createdAt: "2024-05-14T10:00:00Z",
  },
];

let MOCK_PROOF_REQUESTS = [
  {
    id: "pres-req-101",
    verifierDid: "did:example:verifier1",
    verifierName: "FinTech Compliance Verifier",
    name: "Employment & Degree Verification",
    requestedAttributes: ["studentName", "degreeType", "graduationYear"],
    requestedPredicates: [
      { name: "graduationYear", p_type: ">=", p_value: 2020 },
    ],
    status: "pending",
    comment: "Required for senior identity auditor verification.",
    createdAt: "2024-05-14T09:00:00Z",
  },
];

let MOCK_INVITATIONS = [
  {
    id: "inv-holder-1",
    alias: "Peer Wallet Handshake",
    multiUse: false,
    invitationUrl: "https://ssi.cdac.in/invite?c_i=eyJhbGciOiJFZDI1NTE5IiwidHlwZSI6ImRpZGNvbW0taG9sZGVyIn0=",
    createdAt: "2024-05-02T11:00:00Z",
  },
];

export const mockHolderApi = {
  getCredentials: async () => {
    return { success: true, data: [...MOCK_CREDENTIALS] };
  },

  deleteCredential: async (id) => {
    MOCK_CREDENTIALS = MOCK_CREDENTIALS.filter((c) => c.id !== id);
    return { success: true };
  },

  getConnections: async () => {
    return { success: true, data: [...MOCK_CONNECTIONS] };
  },

  getOffers: async () => {
    return { success: true, data: [...MOCK_OFFERS] };
  },

  acceptOffer: async (offerId) => {
    const offer = MOCK_OFFERS.find((o) => o.id === offerId);
    if (offer) {
      const newCred = {
        id: `cred-${Date.now().toString(36)}`,
        referent: `referent-${Date.now().toString(36)}`,
        issuerDid: offer.senderDid,
        issuerName: offer.senderName,
        credentialDefinition: offer.credentialDefinition,
        schemaId: offer.schemaId || "schema-custom",
        attrs: offer.attributes || {},
        issueDate: new Date().toISOString(),
        status: "verified",
        type: "CL_ACCUM",
      };
      MOCK_CREDENTIALS.unshift(newCred);
      MOCK_OFFERS = MOCK_OFFERS.filter((o) => o.id !== offerId);
      return { success: true, data: newCred };
    }
    return { success: false, message: "Offer not found" };
  },

  declineOffer: async (offerId) => {
    MOCK_OFFERS = MOCK_OFFERS.filter((o) => o.id !== offerId);
    return { success: true };
  },

  getProofRequests: async () => {
    return { success: true, data: [...MOCK_PROOF_REQUESTS] };
  },

  respondToProofRequest: async (requestId, { selectedCredId, revealedAttrs, predicates }) => {
    const req = MOCK_PROOF_REQUESTS.find((r) => r.id === requestId);
    if (req) {
      req.status = "presented";
      MOCK_PROOF_REQUESTS = MOCK_PROOF_REQUESTS.filter((r) => r.id !== requestId);
    }
    return {
      success: true,
      data: {
        presentationId: `pres-${Date.now().toString(36)}`,
        status: "verified",
        disclosedAttributes: revealedAttrs,
        satisfiedPredicates: predicates,
      },
    };
  },

  rejectProofRequest: async (requestId, reason) => {
    MOCK_PROOF_REQUESTS = MOCK_PROOF_REQUESTS.filter((r) => r.id !== requestId);
    return { success: true, reason };
  },

  shareAdhocProof: async ({ connectionId, credId, revealedAttrs, predicates, comment }) => {
    return {
      success: true,
      data: {
        presentationId: `adhoc-${Date.now().toString(36)}`,
        connectionId,
        revealedAttrs,
        predicates,
        comment,
        status: "sent",
        timestamp: new Date().toISOString(),
      },
    };
  },

  requestCredentialProposal: async ({ issuerId, schemaId, attributes, comment }) => {
    return {
      success: true,
      data: {
        proposalId: `prop-${Date.now().toString(36)}`,
        issuerId,
        schemaId,
        attributes,
        comment,
        status: "proposal-sent",
        createdAt: new Date().toISOString(),
      },
    };
  },

  // Connection invitations
  getInvitations: async () => {
    return { success: true, data: [...MOCK_INVITATIONS] };
  },

  createInvitation: async ({ alias }) => {
    const newInv = {
      id: `inv-${Date.now().toString(36)}`,
      alias: alias || "Holder Wallet Invitation",
      multiUse: false,
      invitationUrl: `https://ssi.cdac.in/invite?c_i=${btoa(JSON.stringify({ alias, holder: true, ts: Date.now() }))}`,
      createdAt: new Date().toISOString(),
    };
    MOCK_INVITATIONS.unshift(newInv);
    return { success: true, data: newInv };
  },

  acceptInvitation: async ({ invitationUrl, alias }) => {
    const newConn = {
      id: `conn-${Date.now().toString(36)}`,
      peerDid: `did:example:peer${Math.floor(Math.random() * 900 + 100)}`,
      peerName: alias || "New Verified Peer",
      alias: alias || "Peer Connection",
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