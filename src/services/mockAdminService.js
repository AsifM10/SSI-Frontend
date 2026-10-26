/**
 * Mock admin service for development.
 * 
 * Provides mock data and workflows matching ACA-Py / Traction v2 Innkeeper Admin:
 * - Tenant Reservations (Pending approvals, denial reasons, historical audit)
 * - Active Tenants (Endorser permissions, ledger switching, API keys)
 * - User Directory & Status Management (Active, Pending, Suspended, Rejected)
 * - ACA-Py & Ledger Telemetry (Endorser DIDs, plugins, server health)
 */

let MOCK_RESERVATIONS = [
  {
    reservation_id: "res-9081",
    tenant_name: "Apex Healthcare Verification",
    contact_name: "Dr. Evelyn Reed",
    contact_email: "evelyn.reed@apexhealth.org",
    contact_phone: "+1 (555) 234-5678",
    state: "pending",
    created_at: "2024-05-14T11:20:00Z",
    updated_at: "2024-05-14T11:20:00Z",
    state_notes: "Hospital network onboarding for medical license verifications",
  },
  {
    reservation_id: "res-9082",
    tenant_name: "Metropolitan Police Identity Services",
    contact_name: "Capt. Marcus Vance",
    contact_email: "m.vance@metropolice.gov",
    contact_phone: "+1 (555) 987-6543",
    state: "pending",
    created_at: "2024-05-14T16:45:00Z",
    updated_at: "2024-05-14T16:45:00Z",
    state_notes: "Requesting issuer capability on test ledger for digital badges",
  },
  {
    reservation_id: "res-8990",
    tenant_name: "Global Fintech Consortium",
    contact_name: "Sarah Lin",
    contact_email: "s.lin@gfintech.io",
    contact_phone: "+1 (555) 345-6789",
    state: "approved",
    created_at: "2024-05-10T09:15:00Z",
    updated_at: "2024-05-10T10:00:00Z",
    state_notes: "Provisioned with endorser access and sandbox DID",
  },
  {
    reservation_id: "res-8812",
    tenant_name: "Anonymous Web Crawlers LLC",
    contact_name: "Unknown Contact",
    contact_email: "crawler-bot@anon-proxy.net",
    contact_phone: "+0 (000) 000-0000",
    state: "denied",
    created_at: "2024-05-08T14:30:00Z",
    updated_at: "2024-05-08T15:10:00Z",
    state_notes: "Failed business domain verification and security clearance",
  },
];

let MOCK_TENANTS = [
  {
    tenant_id: "ten-001",
    tenant_name: "University Credentials Authority",
    is_active: true,
    canBecomeIssuer: true,
    enable_ledger_switch: true,
    connect_to_endorser: ["bcovrin:test"],
    created_public_did: ["did:sov:M6Mbe3qx7vBQAitT21A2K1"],
    api_key_masked: "sk_live_****...99a1",
    created_at: "2024-01-15T10:30:00Z",
    wallet_id: "wal-univ-8821",
  },
  {
    tenant_id: "ten-002",
    tenant_name: "National Verifier & Background Checks",
    is_active: true,
    canBecomeIssuer: false,
    enable_ledger_switch: false,
    connect_to_endorser: [],
    created_public_did: ["did:sov:VRF9988776655443322110"],
    api_key_masked: "sk_live_****...44f2",
    created_at: "2024-02-01T08:00:00Z",
    wallet_id: "wal-verif-3319",
  },
  {
    tenant_id: "ten-003",
    tenant_name: "Global Fintech Consortium",
    is_active: true,
    canBecomeIssuer: true,
    enable_ledger_switch: true,
    connect_to_endorser: ["bcovrin:test", "indicio:testnet"],
    created_public_did: ["did:sov:GFIN7711223344556677889"],
    api_key_masked: "sk_live_****...77c3",
    created_at: "2024-05-10T10:00:00Z",
    wallet_id: "wal-gfin-0091",
  },
];

let MOCK_USERS = [
  {
    id: "user-1",
    username: "issuer@example.com",
    email: "issuer@example.com",
    contact_name: "Dr. Arthur Pendelton",
    organization: "University Credentials Authority",
    role: "issuer",
    status: "active",
    tenant_id: "ten-001",
    createdAt: "2024-01-15T10:30:00Z",
  },
  {
    id: "user-2",
    username: "holder@example.com",
    email: "holder@example.com",
    contact_name: "Alice Johnson",
    organization: "Independent Citizen Wallet",
    role: "holder",
    status: "active",
    tenant_id: null,
    createdAt: "2024-02-20T14:15:00Z",
  },
  {
    id: "user-3",
    username: "verifier@example.com",
    email: "verifier@example.com",
    contact_name: "Elena Rostova",
    organization: "National Verifier & Background Checks",
    role: "verifier",
    status: "active",
    tenant_id: "ten-002",
    createdAt: "2024-03-10T09:00:00Z",
  },
  {
    id: "user-4",
    username: "admin@example.com",
    email: "admin@example.com",
    contact_name: "Root Governance Officer",
    organization: "Decentralized SSI Innkeeper Network",
    role: "admin",
    status: "active",
    tenant_id: "innkeeper-core",
    createdAt: "2024-01-01T08:00:00Z",
  },
  {
    id: "user-5",
    username: "pending.issuer@apexhealth.org",
    email: "pending.issuer@apexhealth.org",
    contact_name: "Dr. Evelyn Reed",
    organization: "Apex Healthcare Verification",
    role: "issuer",
    status: "pending",
    tenant_id: null,
    createdAt: "2024-05-14T11:20:00Z",
  },
  {
    id: "user-6",
    username: "suspended.user@rogueagency.com",
    email: "suspended.user@rogueagency.com",
    contact_name: "Unknown Entity",
    organization: "Flagged Enterprise",
    role: "verifier",
    status: "suspended",
    tenant_id: null,
    createdAt: "2024-04-01T12:00:00Z",
  },
];

const MOCK_SERVER_CONFIG = {
  acapy_version: "0.11.0",
  traction_version: "2.0.0-rc3",
  swagger_url: "https://traction.example.com/api/doc",
  config: {
    "ledger.ledger_config_list": [
      {
        id: "bcovrin:test",
        endorser_alias: "BCOVRIN Test Ledger",
        endorser_did: "V4SGRU86Z58d6TV7PBUe6f",
      },
      {
        id: "indicio:testnet",
        endorser_alias: "Indicio Testnet Endorser",
        endorser_did: "2wJPyULganL3zJ5i521LN7",
      },
      {
        id: "idunion:test",
        endorser_alias: "IDunion European Testnet",
        endorser_did: "7T1yULganL3zJ5i521LN99",
      },
    ],
  },
  plugins: [
    "traction_plugins.innkeeper",
    "traction_plugins.ledger",
    "traction_plugins.tenant",
    "traction_plugins.oid4vci",
    "traction_plugins.multitenant_provider",
    "aries_cloudagent.protocols.issue_credential.v2_0",
    "aries_cloudagent.protocols.present_proof.v2_0",
    "aries_cloudagent.revocation",
  ],
};

const MOCK_SYSTEM_HEALTH = {
  backendHealth: "healthy",
  ledgerConnectivity: "connected",
  agentStatus: {
    issuer: "running",
    holder: "running",
    verifier: "running",
    innkeeper: "running",
  },
  lastSync: new Date().toISOString(),
};

let MOCK_AUDIT_LOGS = [
  {
    id: "log-1",
    event: "Reservation Approval",
    user: "admin@example.com",
    timestamp: "2024-05-14T09:15:00Z",
    details: "Approved tenant reservation res-8990 (Global Fintech Consortium)",
  },
  {
    id: "log-2",
    event: "Credential Issuance",
    user: "issuer@example.com",
    timestamp: "2024-05-10T14:00:00Z",
    details: "Issued University Degree credential to holder Alice Johnson",
  },
  {
    id: "log-3",
    event: "Tenant Configuration Updated",
    user: "admin@example.com",
    timestamp: "2024-05-12T08:30:00Z",
    details: "Enabled canBecomeIssuer for tenant ten-001",
  },
  {
    id: "log-4",
    event: "Proof Presentation Verified",
    user: "verifier@example.com",
    timestamp: "2024-05-13T16:20:00Z",
    details: "Cryptographically verified academic credential for Bob Smith",
  },
];

export const mockAdminApi = {
  /** Get registered users */
  getUsers: async () => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return { success: true, data: [...MOCK_USERS] };
  },

  /** Get user by ID */
  getUser: async (id) => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const user = MOCK_USERS.find((u) => u.id === id);
    return { success: true, data: user || null };
  },

  /** Create/update user */
  saveUser: async (userData) => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    if (userData.id) {
      const idx = MOCK_USERS.findIndex((u) => u.id === userData.id);
      if (idx !== -1) {
        MOCK_USERS[idx] = { ...MOCK_USERS[idx], ...userData };
        return { success: true, data: MOCK_USERS[idx] };
      }
    }
    const newUser = {
      ...userData,
      id: `user-${Date.now().toString().slice(-4)}`,
      createdAt: new Date().toISOString(),
    };
    MOCK_USERS.unshift(newUser);
    return { success: true, data: newUser };
  },

  /** Update user status (active, pending, suspended, rejected) */
  updateUserStatus: async (userId, status) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const user = MOCK_USERS.find((u) => u.id === userId);
    if (user) {
      user.status = status;
    }
    return { success: true, data: user };
  },

  /** Delete user */
  deleteUser: async (id) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    MOCK_USERS = MOCK_USERS.filter((u) => u.id !== id);
    return { success: true };
  },

  /** Get tenant reservations */
  getReservations: async () => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return { success: true, data: [...MOCK_RESERVATIONS] };
  },

  /** Approve reservation */
  approveReservation: async (reservationId, notes = "Approved by Innkeeper Administrator") => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const resRecord = MOCK_RESERVATIONS.find((r) => r.reservation_id === reservationId);
    if (!resRecord) return { success: false, message: "Reservation not found" };

    resRecord.state = "approved";
    resRecord.updated_at = new Date().toISOString();
    resRecord.state_notes = notes;

    // Create corresponding active tenant
    const newTenant = {
      tenant_id: `ten-${Date.now().toString().slice(-4)}`,
      tenant_name: resRecord.tenant_name,
      is_active: true,
      canBecomeIssuer: true,
      enable_ledger_switch: false,
      connect_to_endorser: ["bcovrin:test"],
      created_public_did: [`did:sov:${Math.random().toString(36).substring(2, 14)}`],
      api_key_masked: `sk_live_****...${Math.floor(Math.random() * 9000 + 1000)}`,
      created_at: new Date().toISOString(),
      wallet_id: `wal-${Date.now().toString().slice(-4)}`,
    };
    MOCK_TENANTS.unshift(newTenant);

    MOCK_AUDIT_LOGS.unshift({
      id: `log-${Date.now()}`,
      event: "Reservation Approval",
      user: "admin@example.com",
      timestamp: new Date().toISOString(),
      details: `Approved reservation ${reservationId} for ${resRecord.tenant_name}`,
    });

    return { success: true, data: { reservation: resRecord, tenant: newTenant } };
  },

  /** Deny reservation */
  denyReservation: async (reservationId, reason = "Denied by governance review") => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const resRecord = MOCK_RESERVATIONS.find((r) => r.reservation_id === reservationId);
    if (!resRecord) return { success: false, message: "Reservation not found" };

    resRecord.state = "denied";
    resRecord.updated_at = new Date().toISOString();
    resRecord.state_notes = reason;

    MOCK_AUDIT_LOGS.unshift({
      id: `log-${Date.now()}`,
      event: "Reservation Denied",
      user: "admin@example.com",
      timestamp: new Date().toISOString(),
      details: `Denied reservation ${reservationId}: ${reason}`,
    });

    return { success: true, data: resRecord };
  },

  /** Get active tenants */
  getTenants: async () => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return { success: true, data: [...MOCK_TENANTS] };
  },

  /** Update tenant permissions / config */
  updateTenantConfig: async (tenantId, updates) => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const tenant = MOCK_TENANTS.find((t) => t.tenant_id === tenantId);
    if (!tenant) return { success: false, message: "Tenant not found" };

    Object.assign(tenant, updates);
    return { success: true, data: tenant };
  },

  /** Delete tenant */
  deleteTenant: async (tenantId) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    MOCK_TENANTS = MOCK_TENANTS.filter((t) => t.tenant_id !== tenantId);
    return { success: true };
  },

  /** Get server & ledger telemetry configuration */
  getServerConfig: async () => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return { success: true, data: MOCK_SERVER_CONFIG };
  },

  /** Get system health */
  getSystemHealth: async () => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return { success: true, data: MOCK_SYSTEM_HEALTH };
  },

  /** Get audit logs */
  getAuditLogs: async () => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return { success: true, data: [...MOCK_AUDIT_LOGS] };
  },
};