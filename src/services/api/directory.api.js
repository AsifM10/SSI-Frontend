/**
 * Directory & Schema Discovery API Module (React JavaScript)
 * Covers finding registered issuers, viewing their schemas, 1-click connect,
 * and querying the public discovery schema catalog.
 */

import apiClient from './client';
import { ENDPOINTS } from './endpoints';

export const directoryApi = {
  /**
   * List accredited issuers in the directory
   */
  async getIssuers(params = {}) {
    const res = await apiClient.get(ENDPOINTS.DIRECTORY.ISSUERS, { params });
    return res.data;
  },

  /**
   * List schemas supported by a specific issuer
   */
  async getIssuerSchemas(issuerId) {
    const res = await apiClient.get(ENDPOINTS.DIRECTORY.ISSUER_SCHEMAS(issuerId));
    return res.data;
  },

  /**
   * 1-Click connect to an accredited issuer
   */
  async connectToIssuer(issuerId, payload = {}) {
    const res = await apiClient.post(ENDPOINTS.DIRECTORY.CONNECT_TO_ISSUER(issuerId), payload);
    return res.data;
  },

  /**
   * Get public discovery schemas
   */
  async getDiscoverySchemas(params = {}) {
    const res = await apiClient.get(ENDPOINTS.DISCOVERY.SCHEMAS, { params });
    return res.data;
  },

  /**
   * Get public discovery schema details
   */
  async getDiscoverySchema(schemaId) {
    const res = await apiClient.get(ENDPOINTS.DISCOVERY.SCHEMA_ITEM(schemaId));
    return res.data;
  },
};

export default directoryApi;
