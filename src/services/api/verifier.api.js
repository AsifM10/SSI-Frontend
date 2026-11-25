/**
 * Verifier API Module (React JavaScript)
 * Covers Credential Catalog, Proof Request Creation, Verification Outcomes & Verification QR Codes
 */

import apiClient from './client';
import { ENDPOINTS } from './endpoints';

export const verifierApi = {
  // 0. Dashboard Statistics
  async getDashboardStats() {
    const res = await apiClient.get(ENDPOINTS.VERIFIER.DASHBOARD_STATS);
    return res.data;
  },

  // 1. High-Level DB Verification Workflow
  async getCredentialCatalog() {
    const res = await apiClient.get(ENDPOINTS.VERIFIER.CREDENTIAL_CATALOG);
    return res.data;
  },

  async requestProof(payload) {
    const res = await apiClient.post(ENDPOINTS.VERIFIER.REQUEST_PROOF, payload);
    return res.data;
  },

  async createProofRequest(payload) {
    return this.requestProof(payload);
  },

  async getVerifications() {
    const res = await apiClient.get(ENDPOINTS.VERIFIER.VERIFICATIONS);
    return res.data;
  },

  async getPresentations() {
    return this.getVerifications();
  },

  async getProofRequests(params) {
    return this.getVerifications(params);
  },

  async getProofRecords(params) {
    return this.getVerifications(params);
  },

  async getVerificationStatus(id) {
    const res = await apiClient.get(ENDPOINTS.VERIFIER.VERIFICATION_ITEM(id));
    return res.data;
  },

  async getProofRecord(id) {
    return this.getVerificationStatus(id);
  },

  async deleteVerification(id) {
    const res = await apiClient.delete(ENDPOINTS.VERIFIER.VERIFICATION_ITEM(id));
    return res.data;
  },

  async getVerificationClaims(id) {
    const res = await apiClient.get(ENDPOINTS.VERIFIER.VERIFICATION_CLAIMS(id));
    return res.data;
  },

  async waitVerificationResult(id) {
    const res = await apiClient.get(ENDPOINTS.VERIFIER.VERIFICATION_WAIT_RESULT(id));
    return res.data;
  },

  // 2. Proof Verification
  async verifyPresentation(presExId) {
    const res = await apiClient.post(ENDPOINTS.VERIFIER.VERIFICATION_VERIFY(presExId));
    return res.data;
  },

  // 2.5 Proof Templates
  async getProofTemplates() {
    const res = await apiClient.get(ENDPOINTS.VERIFIER.PROOF_TEMPLATES);
    return res.data;
  },

  async createProofTemplate(payload) {
    const res = await apiClient.post(ENDPOINTS.VERIFIER.PROOF_TEMPLATES, payload);
    return res.data;
  },

  async getProofTemplate(id) {
    const res = await apiClient.get(ENDPOINTS.VERIFIER.PROOF_TEMPLATE_ITEM(id));
    return res.data;
  },

  async deleteProofTemplate(id) {
    const res = await apiClient.delete(ENDPOINTS.VERIFIER.PROOF_TEMPLATE_ITEM(id));
    return res.data;
  },

  async requestProofFromTemplate(id, payload = {}) {
    const res = await apiClient.post(ENDPOINTS.VERIFIER.PROOF_TEMPLATE_REQUEST(id), payload);
    return res.data;
  },

  // 3. Multi-Use Verification QR Campaigns
  async createVerificationQr(payload) {
    const res = await apiClient.post(
      ENDPOINTS.VERIFIER.QR_VERIFICATION_REQUEST,
      payload
    );
    return res.data;
  },

  async getQrRecords() {
    const res = await apiClient.get(ENDPOINTS.VERIFIER.QR_RECORDS);
    return res.data;
  },

  async getQrResults(inviMsgId) {
    const res = await apiClient.get(ENDPOINTS.VERIFIER.QR_RECORD_RESULTS(inviMsgId));
    return res.data;
  },
};

export default verifierApi;
