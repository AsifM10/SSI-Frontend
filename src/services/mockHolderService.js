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
    connection_id: "conn-holder-1",
    their_label: "State University Academic Registry",
    peerName: "State University Academic Registry",
    their_did: "did:example:university-registry-01",
    peerDid: "did:example:university-registry-01",
    role: "Issuer",
    status: "active",
    state: "active",
    createdAt: "2024-05-01T10:00:00Z",
  },
  {
    id: "conn-holder-2",
    connection_id: "conn-holder-2",
    their_label: "C-DAC Identity & Trust Authority",
    peerName: "C-DAC Identity & Trust Authority",
    their_did: "did:example:cdac-authority-892",
    peerDid: "did:example:cdac-authority-892",
    role: "Issuer",
    status: "active",
    state: "active",
    createdAt: "2024-05-03T11:20:00Z",
  },
  {
    id: "conn-holder-3",
    connection_id: "conn-holder-3",
    their_label: "FinTech Compliance & KYC Hub",
    peerName: "FinTech Compliance & KYC Hub",
    their_did: "did:example:fintech-kyc-verifier-44",
    peerDid: "did:example:fintech-kyc-verifier-44",
    role: "Verifier",
    status: "active",
    state: "active",
    createdAt: "2024-05-05T14:30:00Z",
  },
  {
    id: "conn-holder-4",
    connection_id: "conn-holder-4",
    their_label: "National Employment & Skill Verifier",
    peerName: "National Employment & Skill Verifier",
    their_did: "did:example:employment-verifier-71",
    peerDid: "did:example:employment-verifier-71",
    role: "Verifier",
    status: "active",
    state: "active",
    createdAt: "2024-05-08T09:15:00Z",
  },
];

let MOCK_OFFERS = [
  {
    id: "offer-emp-1",
    senderDid: "did:example:cdac-authority-892",
    senderName: "C-DAC Enterprise Issuer",
    credentialDefinition: "Corporate Employee ID",
    schemaId: "schema-emp-3",
    attributes: {
      employeeId: "EMP-9921",
      fullName: "Alice Johnson",
      department: "Decentralized Systems",
      designation: "Security Architect",
      clearanceLevel: "Level 4 - National",
      issuedDate: "2024-05-14",
    },
    comment: "Pre-approved corporate credential offer. Accept to store in your digital wallet.",
    createdAt: "2024-05-14T10:00:00Z",
  },
];

let MOCK_PROOF_REQUESTS = [
  {
    id: "pres-req-101",
    verifierDid: "did:example:fintech-kyc-verifier-44",
    verifierName: "FinTech Compliance & KYC Hub",
    name: "Higher Education & Degree Verification",
    purpose: "Mandatory qualification verification for security architect role onboarding.",
    requestedAttributes: ["studentName", "degreeType", "graduationYear"],
    requestedPredicates: [
      { name: "graduationYear", p_type: ">=", p_value: 2020 },
    ],
    status: "pending",
    comment: "Requires verification of accredited higher education degree qualification.",
    createdAt: "2024-05-14T09:00:00Z",
  },
  {
    id: "pres-req-102",
    verifierDid: "did:example:employment-verifier-71",
    verifierName: "National Employment & Skill Verifier",
    name: "Cyber Security Certification Check",
    purpose: "Verification of enterprise cybersecurity credentials for platform trust validation.",
    requestedAttributes: ["holderName", "certificateId", "securityLevel"],
    requestedPredicates: [],
    status: "pending",
    comment: "Routine verification of valid technical certification.",
    createdAt: "2024-05-15T11:30:00Z",
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

  respondToProofRequest: async (requestId, credentialsOrParams, presentation) => {
    const req = MOCK_PROOF_REQUESTS.find((r) => r.id === requestId);
    if (req) {
      req.status = "presented";
      MOCK_PROOF_REQUESTS = MOCK_PROOF_REQUESTS.filter((r) => r.id !== requestId);
    }
    const revealedAttrs =
      presentation?.revealedAttributes ||
      credentialsOrParams?.revealedAttrs ||
      credentialsOrParams?.revealedAttributes ||
      {};
    const satisfiedPredicates = presentation?.predicates || credentialsOrParams?.predicates || [];
    return {
      success: true,
      data: {
        presentationId: `pres-${Date.now().toString(36)}`,
        status: "verified",
        disclosedAttributes: revealedAttrs,
        satisfiedPredicates,
      },
    };
  },

  rejectProofRequest: async (requestId, reason) => {
    MOCK_PROOF_REQUESTS = MOCK_PROOF_REQUESTS.filter((r) => r.id !== requestId);
    return { success: true, reason };
  },

  declineProofRequest: async (requestId, reason) => {
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