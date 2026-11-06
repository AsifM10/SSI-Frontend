/**
 * Issuer API Module (React JavaScript)
 * Covers Schemas, Credential Definitions, Credential Issuance 2.0, Revocation & Review Queue
 */

import apiClient from './client';
import { ENDPOINTS } from './endpoints';

export const issuerApi = {
  // 0. Dashboard Statistics
  async getDashboardStats() {
    const res = await apiClient.get(ENDPOINTS.ISSUER.DASHBOARD_STATS);
    return res.data;
  },

  // 1. Schemas
  async createSchema(payload) {
    const res = await apiClient.post(ENDPOINTS.ISSUER.SCHEMAS, payload);
    return res.data;
  },

  async getRecordedSchemas() {
    const res = await apiClient.get(ENDPOINTS.ISSUER.SCHEMAS_RECORDED);
    return res.data;
  },

  async getRecordedCredentials() {
    const res = await apiClient.get(ENDPOINTS.ISSUER.CREDENTIALS);
    return res.data;
  },

  async getCreatedSchemas() {
    const res = await apiClient.get(ENDPOINTS.ISSUER.SCHEMAS);
    return res.data;
  },

  async getSchema(schemaId) {
    const res = await apiClient.get(ENDPOINTS.ISSUER.SCHEMA_ITEM(schemaId));
    return res.data;
  },

  async deleteRecordedSchema(schemaId) {
    const res = await apiClient.delete(ENDPOINTS.ISSUER.SCHEMA_RECORDED_ITEM(schemaId));
    return res.data;
  },

  // 2. Credential Definitions
  async createCredDef(payload) {
    const res = await apiClient.post(ENDPOINTS.ISSUER.CREDENTIAL_DEFINITIONS, payload);
    return res.data;
  },

  async getRecordedCredDefs() {
    const res = await apiClient.get(ENDPOINTS.ISSUER.CREDENTIAL_DEFINITIONS_RECORDED);
    return res.data;
  },

  async getCreatedCredDefs() {
    const res = await apiClient.get(ENDPOINTS.ISSUER.CREDENTIAL_DEFINITIONS);
    return res.data;
  },

  async getCredDef(credDefId) {
    const res = await apiClient.get(ENDPOINTS.ISSUER.CREDENTIAL_DEFINITION_ITEM(credDefId));
    return res.data;
  },

  async deleteRecordedCredDef(credDefId) {
    const res = await apiClient.delete(ENDPOINTS.ISSUER.CREDENTIAL_DEFINITION_RECORDED_ITEM(credDefId));
    return res.data;
  },

  async deprecateCredDef(credDefId) {
    const res = await apiClient.post(ENDPOINTS.ISSUER.DEPRECATE_CRED_DEF(credDefId));
    return res.data;
  },

  async getCredDefRevocationStatus(credDefId) {
    const res = await apiClient.get(ENDPOINTS.ISSUER.CRED_DEF_REVOCATION_STATUS(credDefId));
    return res.data;
  },

  // 3. Credential Issuance 2.0
  async issueCredential(payload) {
    const res = await apiClient.post(ENDPOINTS.ISSUER.ISSUE_CREDENTIAL, payload);
    return res.data;
  },

  async sendCredentialOffer(payload) {
    const res = await apiClient.post(ENDPOINTS.ISSUER.ISSUE_CREDENTIAL_20_SEND_OFFER, payload);
    return res.data;
  },

  async getCredentialRecords(params) {
    const res = await apiClient.get(ENDPOINTS.ISSUER.ISSUE_CREDENTIAL_20_RECORDS, { params });
    return res.data;
  },

  async getCredentialRecord(credExId) {
    const res = await apiClient.get(ENDPOINTS.ISSUER.ISSUE_CREDENTIAL_20_RECORD_ITEM(credExId));
    return res.data;
  },

  async getCredentialRecordRevocationStatus(credExId) {
    const res = await apiClient.get(ENDPOINTS.ISSUER.ISSUE_CREDENTIAL_20_REVOCATION_STATUS(credExId));
    return res.data;
  },

  async issueCredentialRecord(credExId, payload) {
    const res = await apiClient.post(ENDPOINTS.ISSUER.ISSUE_CREDENTIAL_20_ISSUE(credExId), payload);
    return res.data;
  },

  async reportCredentialProblem(credExId, description) {
    const res = await apiClient.post(ENDPOINTS.ISSUER.ISSUE_CREDENTIAL_20_PROBLEM_REPORT(credExId), { description });
    return res.data;
  },

  // 4. Revocation Management
  async getActiveRevocationRegistry(credDefId) {
    const res = await apiClient.get(ENDPOINTS.ISSUER.REVOCATION_ACTIVE_REGISTRY(credDefId));
    return res.data;
  },

  async rotateRevocationRegistry(credDefId) {
    const res = await apiClient.post(ENDPOINTS.ISSUER.REVOCATION_ROTATE(credDefId));
    return res.data;
  },

  async publishRevocations() {
    const res = await apiClient.post(ENDPOINTS.ISSUER.REVOCATION_PUBLISH);
    return res.data;
  },

  async getRevocationRegistries() {
    const res = await apiClient.get(ENDPOINTS.ISSUER.REVOCATION_REGISTRIES);
    return res.data;
  },

  async revokeCredential(payload) {
    const res = await apiClient.post(ENDPOINTS.ISSUER.REVOCATION_REVOKE, payload);
    return res.data;
  },

  // 5. Onboarding QR Campaigns
  async createOnboardingQr(payload) {
    const res = await apiClient.post(ENDPOINTS.ISSUER.QR_CONNECTION, payload);
    return res.data;
  },

  async getQrRecords() {
    const res = await apiClient.get(ENDPOINTS.ISSUER.QR_RECORDS);
    return res.data;
  },

  async deleteQrRecord(inviMsgId) {
    const res = await apiClient.delete(ENDPOINTS.ISSUER.QR_RECORD_ITEM(inviMsgId));
    return res.data;
  },

  // 6. Dynamic Holder Intake Review Queue
  async getCredentialRequests() {
    const res = await apiClient.get(ENDPOINTS.ISSUER.CREDENTIAL_REQUESTS);
    return res.data;
  },

  async approveCredentialRequest(requestId, payload) {
    const res = await apiClient.post(ENDPOINTS.ISSUER.CREDENTIAL_REQUEST_APPROVE(requestId), payload);
    return res.data;
  },

  async rejectCredentialRequest(requestId, reason) {
    const res = await apiClient.post(ENDPOINTS.ISSUER.CREDENTIAL_REQUEST_REJECT(requestId), { reason });
    return res.data;
  },
};

export default issuerApi;
