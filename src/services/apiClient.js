/**
 * API Client for SSI Application.
 * 
 * Bridges frontend components with either Mock services (for local development/demo)
 * or real backend API routes (provided by backend team).
 * 
 * To switch to real backend APIs:
 * Set VITE_USE_MOCK=false in .env and configure VITE_API_BASE_URL.
 */

import api from "./api";
import {
  mockLogin,
  mockRegister,
  mockLogout,
  mockGetSession,
  mockIsSessionExpired,
} from "./mockAuthService";
import { mockIssuerApi } from "./mockIssuerService";
import { mockHolderApi } from "./mockHolderService";
import { mockVerifierApi } from "./mockVerifierService";
import { mockAdminApi } from "./mockAdminService";

// Toggle between mock and real API. Defaults to true if not specified.
export const MOCK_MODE = import.meta.env.VITE_USE_MOCK !== "false";

/**
 * Authentication Service
 * When MOCK_MODE is true, validates against mock accounts.
 * When MOCK_MODE is false, calls backend /auth routes.
 */
export const authService = {
  login: async ({ username, password }) => {
    if (MOCK_MODE) {
      return await mockLogin({ username, password });
    }
    const response = await api.post("/auth/login", { username, password });
    return response.data;
  },

  register: async (registerData) => {
    if (MOCK_MODE) {
      return await mockRegister(registerData);
    }
    const response = await api.post("/auth/register", registerData);
    return response.data;
  },

  logout: async () => {
    if (MOCK_MODE) {
      return await mockLogout();
    }
    try {
      const response = await api.post("/auth/logout");
      return response.data;
    } catch {
      return { success: true };
    }
  },

  getSession: () => {
    if (MOCK_MODE) {
      return mockGetSession();
    }
    const storedUser = localStorage.getItem("user");
    return {
      isAuthenticated: !!storedUser,
      user: storedUser ? JSON.parse(storedUser) : null,
    };
  },

  isSessionExpired: () => {
    return mockIsSessionExpired();
  },
};

/**
 * Issuer Service
/**
 * Issuer Service
 */
export const issuerService = {
  getDID: async () => {
    if (MOCK_MODE) return await mockIssuerApi.getDID();
    const res = await api.get("/issuer/did");
    return res.data;
  },

  getSchemas: async () => {
    if (MOCK_MODE) return await mockIssuerApi.getSchemas();
    const res = await api.get("/issuer/schemas");
    return res.data;
  },

  createSchema: async (schemaData) => {
    if (MOCK_MODE) return await mockIssuerApi.createSchema(schemaData);
    const res = await api.post("/issuer/schemas", schemaData);
    return res.data;
  },

  getCredentialDefinitions: async () => {
    if (MOCK_MODE) return await mockIssuerApi.getCredentialDefinitions();
    const res = await api.get("/issuer/credential-definitions");
    return res.data;
  },

  createCredentialDefinition: async (credDefData) => {
    if (MOCK_MODE) return await mockIssuerApi.createCredentialDefinition(credDefData);
    const res = await api.post("/issuer/credential-definitions", credDefData);
    return res.data;
  },

  getConnections: async () => {
    if (MOCK_MODE) return await mockIssuerApi.getConnections();
    const res = await api.get("/issuer/connections");
    return res.data;
  },

  createInvitation: async (alias) => {
    if (MOCK_MODE) return await mockIssuerApi.createInvitation(alias);
    const res = await api.post("/issuer/invitations", { alias });
    return res.data;
  },

  receiveInvitation: async (invitationPayload) => {
    if (MOCK_MODE) return await mockIssuerApi.receiveInvitation(invitationPayload);
    const res = await api.post("/issuer/invitations/receive", invitationPayload);
    return res.data;
  },

  getIssuanceActivity: async () => {
    if (MOCK_MODE) return await mockIssuerApi.getIssuanceActivity();
    const res = await api.get("/issuer/issuance-activity");
    return res.data;
  },

  issueCredential: async (credentialDefId, holderDid, attributes) => {
    if (MOCK_MODE) {
      return await mockIssuerApi.issueCredential(credentialDefId, holderDid, attributes);
    }
    const res = await api.post("/issuer/issue-credential", {
      credentialDefinitionId: credentialDefId,
      holderDid,
      attributes,
    });
    return res.data;
  },

  revokeCredential: async (credentialExchangeId, reason) => {
    if (MOCK_MODE) return await mockIssuerApi.revokeCredential(credentialExchangeId, reason);
    const res = await api.post(`/issuer/credentials/${credentialExchangeId}/revoke`, { reason });
    return res.data;
  },

  deleteActivityRecord: async (recordId) => {
    if (MOCK_MODE) return await mockIssuerApi.deleteActivityRecord(recordId);
    const res = await api.delete(`/issuer/issuance-activity/${recordId}`);
    return res.data;
  },

  getProposals: async () => {
    if (MOCK_MODE) return await mockIssuerApi.getProposals();
    const res = await api.get("/issuer/proposals");
    return res.data;
  },

  acceptProposal: async (proposalId) => {
    if (MOCK_MODE) return await mockIssuerApi.acceptProposal(proposalId);
    const res = await api.post(`/issuer/proposals/${proposalId}/accept`);
    return res.data;
  },

  rejectProposal: async (proposalId, reason) => {
    if (MOCK_MODE) return await mockIssuerApi.rejectProposal(proposalId, reason);
    const res = await api.post(`/issuer/proposals/${proposalId}/reject`, { reason });
    return res.data;
  },
};

/**
 * Holder Service (Digital Wallet)
 */
export const holderService = {
  getCredentials: async () => {
    if (MOCK_MODE) return await mockHolderApi.getCredentials();
    const res = await api.get("/holder/credentials");
    return res.data;
  },

  deleteCredential: async (credentialId) => {
    if (MOCK_MODE) return await mockHolderApi.deleteCredential(credentialId);
    const res = await api.delete(`/holder/credentials/${credentialId}`);
    return res.data;
  },

  getConnections: async () => {
    if (MOCK_MODE) return await mockHolderApi.getConnections();
    const res = await api.get("/holder/connections");
    return res.data;
  },

  createInvitation: async (alias) => {
    if (MOCK_MODE) return await mockHolderApi.createInvitation(alias);
    const res = await api.post("/holder/invitations", { alias });
    return res.data;
  },

  receiveInvitation: async (invitationPayload) => {
    if (MOCK_MODE) return await mockHolderApi.receiveInvitation(invitationPayload);
    const res = await api.post("/holder/invitations/receive", invitationPayload);
    return res.data;
  },

  getOffers: async () => {
    if (MOCK_MODE) return await mockHolderApi.getOffers();
    const res = await api.get("/holder/credential-offers");
    return res.data;
  },

  getProofRequests: async () => {
    if (MOCK_MODE) return await mockHolderApi.getProofRequests();
    const res = await api.get("/holder/proof-requests");
    return res.data;
  },

  acceptOffer: async (offerId) => {
    if (MOCK_MODE) return await mockHolderApi.acceptOffer(offerId);
    const res = await api.post(`/holder/offers/${offerId}/accept`);
    return res.data;
  },

  declineOffer: async (offerId) => {
    if (MOCK_MODE) return await mockHolderApi.declineOffer(offerId);
    const res = await api.post(`/holder/offers/${offerId}/decline`);
    return res.data;
  },

  respondToProofRequest: async (requestId, credentials, presentation) => {
    if (MOCK_MODE) {
      return await mockHolderApi.respondToProofRequest(requestId, credentials, presentation);
    }
    const res = await api.post(`/holder/proof-requests/${requestId}/respond`, {
      credentials,
      presentation,
    });
    return res.data;
  },

  createPresentation: async (presentationData) => {
    if (MOCK_MODE) return await mockHolderApi.createPresentation(presentationData);
    const res = await api.post("/holder/presentations", presentationData);
    return res.data;
  },

  sharePresentation: async (presentationData) => {
    if (MOCK_MODE) return await mockHolderApi.sharePresentation(presentationData);
    const res = await api.post("/holder/presentations/share", presentationData);
    return res.data;
  },

  submitProposal: async (proposalData) => {
    if (MOCK_MODE) return await mockHolderApi.submitProposal(proposalData);
    const res = await api.post("/holder/proposals", proposalData);
    return res.data;
  },
};

/**
 * Verifier Service
 */
export const verifierService = {
  getPresentations: async () => {
    if (MOCK_MODE) return await mockVerifierApi.getPresentations();
    const res = await api.get("/verifier/presentations");
    return res.data;
  },

  getProofRequests: async () => {
    if (MOCK_MODE) return await mockVerifierApi.getProofRequests();
    const res = await api.get("/verifier/proof-requests");
    return res.data;
  },

  createProofRequest: async (requestData, holderConnection) => {
    if (MOCK_MODE) return await mockVerifierApi.createProofRequest(requestData, holderConnection);
    const res = await api.post("/verifier/proof-requests", requestData);
    return res.data;
  },

  getVerificationResults: async (requestId) => {
    if (MOCK_MODE) return await mockVerifierApi.getVerificationResults(requestId);
    const res = await api.get(`/verifier/verification-results/${requestId}`);
    return res.data;
  },

  verifyPresentation: async (presentationExchangeId) => {
    if (MOCK_MODE) return await mockVerifierApi.verifyPresentation(presentationExchangeId);
    const res = await api.post(`/verifier/presentations/${presentationExchangeId}/verify`);
    return res.data;
  },

  rejectPresentation: async (presentationExchangeId, reason) => {
    if (MOCK_MODE) return await mockVerifierApi.rejectPresentation(presentationExchangeId, reason);
    const res = await api.post(`/verifier/presentations/${presentationExchangeId}/reject`, { reason });
    return res.data;
  },

  deletePresentation: async (presentationExchangeId) => {
    if (MOCK_MODE) return await mockVerifierApi.deletePresentation(presentationExchangeId);
    const res = await api.delete(`/verifier/presentations/${presentationExchangeId}`);
    return res.data;
  },

  getConnections: async () => {
    if (MOCK_MODE) return await mockVerifierApi.getConnections();
    const res = await api.get("/verifier/connections");
    return res.data;
  },

  createInvitation: async (alias) => {
    if (MOCK_MODE) return await mockVerifierApi.createInvitation(alias);
    const res = await api.post("/verifier/invitations", { alias });
    return res.data;
  },

  receiveInvitation: async (invitationPayload) => {
    if (MOCK_MODE) return await mockVerifierApi.receiveInvitation(invitationPayload);
    const res = await api.post("/verifier/invitations/receive", invitationPayload);
    return res.data;
  },
};

/**
 * Admin Service (Innkeeper)
 */
export const adminService = {
  getUsers: async () => {
    if (MOCK_MODE) return await mockAdminApi.getUsers();
    const res = await api.get("/admin/users");
    return res.data;
  },

  getUser: async (id) => {
    if (MOCK_MODE) return await mockAdminApi.getUser(id);
    const res = await api.get(`/admin/users/${id}`);
    return res.data;
  },

  saveUser: async (userData) => {
    if (MOCK_MODE) return await mockAdminApi.saveUser(userData);
    const res = await api.post("/admin/users", userData);
    return res.data;
  },

  updateUserStatus: async (id, status) => {
    if (MOCK_MODE) return await mockAdminApi.updateUserStatus(id, status);
    const res = await api.patch(`/admin/users/${id}/status`, { status });
    return res.data;
  },

  deleteUser: async (id) => {
    if (MOCK_MODE) return await mockAdminApi.deleteUser(id);
    const res = await api.delete(`/admin/users/${id}`);
    return res.data;
  },

  getReservations: async () => {
    if (MOCK_MODE) return await mockAdminApi.getReservations();
    const res = await api.get("/admin/reservations");
    return res.data;
  },

  approveReservation: async (reservationId, notes) => {
    if (MOCK_MODE) return await mockAdminApi.approveReservation(reservationId, notes);
    const res = await api.post(`/admin/reservations/${reservationId}/approve`, { notes });
    return res.data;
  },

  denyReservation: async (reservationId, reason) => {
    if (MOCK_MODE) return await mockAdminApi.denyReservation(reservationId, reason);
    const res = await api.post(`/admin/reservations/${reservationId}/deny`, { reason });
    return res.data;
  },

  getTenants: async () => {
    if (MOCK_MODE) return await mockAdminApi.getTenants();
    const res = await api.get("/admin/tenants");
    return res.data;
  },

  updateTenantConfig: async (tenantId, updates) => {
    if (MOCK_MODE) return await mockAdminApi.updateTenantConfig(tenantId, updates);
    const res = await api.patch(`/admin/tenants/${tenantId}`, updates);
    return res.data;
  },

  deleteTenant: async (tenantId) => {
    if (MOCK_MODE) return await mockAdminApi.deleteTenant(tenantId);
    const res = await api.delete(`/admin/tenants/${tenantId}`);
    return res.data;
  },

  getServerConfig: async () => {
    if (MOCK_MODE) return await mockAdminApi.getServerConfig();
    const res = await api.get("/admin/server-config");
    return res.data;
  },

  getSystemHealth: async () => {
    if (MOCK_MODE) return await mockAdminApi.getSystemHealth();
    const res = await api.get("/admin/system-health");
    return res.data;
  },

  getAuditLogs: async () => {
    if (MOCK_MODE) return await mockAdminApi.getAuditLogs();
    const res = await api.get("/admin/audit-logs");
    return res.data;
  },
};

export default {
  auth: authService,
  issuer: issuerService,
  holder: holderService,
  verifier: verifierService,
  admin: adminService,
};