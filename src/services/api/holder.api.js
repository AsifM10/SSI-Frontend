/**
 * Holder API Module (React JavaScript)
 * Covers Credentials Storage, Issue Credential 2.0 Acceptance & Present Proof 2.0 Presentation
 */

import apiClient from './client';
import { ENDPOINTS } from './endpoints';

export const holderApi = {
  // 0. Dashboard Statistics
  async getDashboardStats() {
    const res = await apiClient.get(ENDPOINTS.HOLDER.DASHBOARD_STATS);
    return res.data;
  },

  // 1. Credentials in Wallet
  async getStoredCredentials() {
    const res = await apiClient.get(ENDPOINTS.HOLDER.CREDENTIALS);
    return res.data;
  },

  async getCredentials() {
    return this.getStoredCredentials();
  },

  async getCredential(credentialId) {
    const res = await apiClient.get(ENDPOINTS.HOLDER.CREDENTIAL_ITEM(credentialId));
    return res.data;
  },

  async deleteCredential(credentialId) {
    const res = await apiClient.delete(ENDPOINTS.HOLDER.CREDENTIAL_ITEM(credentialId));
    return res.data;
  },

  // 2. Credential Offers & Storage (Aries Issue-Credential 2.0)
  async getOffers() {
    try {
      const res = await apiClient.get(ENDPOINTS.HOLDER.OFFERS);
      const data = res?.data?.cred_ex_record || res?.data?.results || res?.data || res?.results || res;
      if (data && (Array.isArray(data) || typeof data === "object")) {
        return res.data;
      }
    } catch (err) {
      console.warn("GET /holder/credentials/offers error, trying fallback:", err?.message || err);
    }

    try {
      const fallback = await apiClient.get(ENDPOINTS.HOLDER.CREDENTIAL_REQUESTS);
      return fallback.data;
    } catch {
      return { success: true, data: [] };
    }
  },

  async acceptOffer(credExId) {
    const res = await apiClient.post(ENDPOINTS.HOLDER.ACCEPT_OFFER(credExId), {});
    return res.data;
  },

  async declineOffer(credExId) {
    const res = await apiClient.post(ENDPOINTS.HOLDER.DECLINE_OFFER(credExId), {});
    return res.data;
  },

  async storeCredential(credExId, payload) {
    const res = await apiClient.post(
      ENDPOINTS.HOLDER.STORE_CREDENTIAL(credExId),
      payload || {}
    );
    return res.data;
  },

  // Compatibility aliases
  async getCredentialExchanges(params) {
    return this.getOffers(params);
  },

  async sendCredentialRequest(credExId, payload) {
    return this.acceptOffer(credExId, payload);
  },

  // 3. Proof Presentation Lifecycle (Aries Present-Proof 2.0)
  async getProofRequests(params) {
    const res = await apiClient.get(ENDPOINTS.HOLDER.PROOF_REQUESTS, { params });
    return res.data;
  },

  async getProofExchanges(params) {
    return this.getProofRequests(params);
  },

  async presentProof(presExId, payload) {
    const res = await apiClient.post(
      ENDPOINTS.HOLDER.PRESENT_PROOF(presExId),
      payload || {}
    );
    return res.data;
  },

  async sendProofPresentation(presExId, payload) {
    return this.presentProof(presExId, payload);
  },

  // 4. Dynamic Credential Intake Form
  async getSchemaIntakeForm(schemaId) {
    const res = await apiClient.get(ENDPOINTS.HOLDER.SCHEMA_INTAKE_FORM(schemaId));
    return res.data;
  },

  async initiateCredentialRequest(schemaId, payload) {
    const res = await apiClient.post(ENDPOINTS.HOLDER.SCHEMA_INITIATE_REQUEST(schemaId), payload);
    return res.data;
  },

  async submitCredentialInputs(schemaId, payload) {
    const res = await apiClient.post(ENDPOINTS.HOLDER.SCHEMA_SUBMIT_INPUTS(schemaId), payload);
    return res.data;
  },
};

export default holderApi;
