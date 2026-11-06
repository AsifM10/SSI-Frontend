/**
 * Canonical Backend API Endpoint Constants (React JavaScript)
 * Matching backend routes mounted under /api/v1
 */

export const ENDPOINTS = {
  // Authentication & Onboarding
  AUTH: {
    REGISTER: '/registration',
    RESEND_OTP: '/registration/resend-otp',
    VERIFY_EMAIL: '/registration/verify/email',
    VERIFY_EKYC: '/registration/verify/ekyc',
    CHANGE_VERIFICATION_METHOD: '/registration/change-verification-method',
    VERIFY_EPRAMAAN: '/registration/verify/epramaan',
    SUBMIT_APPROVAL: '/registration/submit-approval',
    STATUS: (userId) => `/registration/status/${userId}`,
    REGISTRATION_STATUS: (userId) => `/registration/status/${userId}`,
    LOGIN: '/auth/login',
    TOKEN: '/auth/token',
    LOGOUT: '/auth/logout',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    ME: '/profile/me',
    CHANGE_PASSWORD: '/profile/change-password',
    API_KEYS: '/profile/api-keys',
    API_KEY_ITEM: (id) => `/profile/api-keys/${id}`,
    API_KEY_ROTATE: (id) => `/profile/api-keys/${id}/rotate`,
    AVATAR: '/profile/avatar',
    DOCUMENTS: '/profile/documents',
  },

  // Profile Self-Service
  PROFILE: {
    ME: '/profile/me',
    DIDS: '/profile/dids',
    CHANGE_PASSWORD: '/profile/change-password',
    AVATAR: '/profile/avatar',
    DOCUMENTS: '/profile/documents',
    API_KEYS: '/profile/api-keys',
    API_KEY_ITEM: (id) => `/profile/api-keys/${id}`,
    API_KEY_ROTATE: (id) => `/profile/api-keys/${id}/rotate`,
  },

  // Admin Management
  ADMIN: {
    DASHBOARD_STATS: '/admin/dashboard/stats',
    USERS: '/admin/users',
    USER_ITEM: (userId) => `/admin/users/${userId}`,
    USER_AGENT_TOKEN: (userId) => `/admin/users/${userId}/agent-token`,
    REGISTRATIONS_PENDING: '/admin/registrations/pending',
    REGISTRATIONS: '/admin/registrations',
    APPROVE_REGISTRATION: (userId) => `/admin/registrations/${userId}/approve`,
    REJECT_REGISTRATION: (userId) => `/admin/registrations/${userId}/reject`,
    TENANT_MAPPING: (userId) => `/admin/registrations/${userId}/mapping`,
    AUDIT_LOGS: '/admin/audit-logs',
  },

  // Issuer APIs
  ISSUER: {
    DASHBOARD_STATS: '/issuer/dashboard/stats',
    SCHEMAS: '/issuer/schemas',
    SCHEMAS_RECORDED: '/issuer/schemas',
    SCHEMA_RECORDED_ITEM: (schemaId) => `/issuer/schemas/${encodeURIComponent(schemaId)}`,
    SCHEMA_ITEM: (schemaId) => `/issuer/schemas/${encodeURIComponent(schemaId)}`,
    ANONCREDS_SCHEMAS: '/issuer/schemas',
    ANONCREDS_SCHEMA_ITEM: (schemaId) => `/issuer/schemas/${encodeURIComponent(schemaId)}`,
    CREDENTIAL_DEFINITIONS: '/issuer/credential-definitions',
    CREDENTIAL_DEFINITIONS_RECORDED: '/issuer/credential-definitions',
    CREDENTIAL_DEFINITION_RECORDED_ITEM: (credDefId) => `/issuer/credential-definitions/${encodeURIComponent(credDefId)}`,
    CREDENTIAL_DEFINITION_ITEM: (credDefId) => `/issuer/credential-definitions/${encodeURIComponent(credDefId)}`,
    DEPRECATE_CRED_DEF: (credDefId) => `/issuer/credential-definitions/${encodeURIComponent(credDefId)}/deprecate`,
    CRED_DEF_REVOCATION_STATUS: (credDefId) => `/issuer/credential-definitions/${encodeURIComponent(credDefId)}/revocation-status`,
    ANONCREDS_CRED_DEFS: '/issuer/credential-definitions',
    ANONCREDS_CRED_DEF_ITEM: (credDefId) => `/issuer/credential-definitions/${encodeURIComponent(credDefId)}`,
    REVOCATION_REVOKE: '/issuer/revoke',
    ISSUE_CREDENTIAL: '/issuer/issue-credential',
    CREDENTIALS: '/issuer/credentials',
    CREDENTIAL_ITEM: (credExId) => `/issuer/credentials/${credExId}`,
    CREDENTIAL_RECORDS: '/issuer/credentials/records',
    CREDENTIAL_RECORD_ITEM: (credExId) => `/issuer/credentials/records/${credExId}`,
    CREDENTIAL_EXCHANGES: '/issuer/credential-exchanges',
    CREDENTIAL_EXCHANGE_ITEM: (credExId) => `/issuer/credential-exchanges/${credExId}`,
    ISSUE_CREDENTIAL_RECORD_ISSUE: (credExId) => `/issuer/credentials/records/${credExId}/issue`,
    ISSUE_CREDENTIAL_RECORD_PROBLEM_REPORT: (credExId) => `/issuer/credentials/records/${credExId}/problem-report`,
    ISSUE_CREDENTIAL_20_RECORDS: '/issuer/credentials/records',
    ISSUE_CREDENTIAL_20_RECORD_ITEM: (credExId) => `/issuer/credentials/records/${credExId}`,
    ISSUE_CREDENTIAL_20_REVOCATION_STATUS: (credRevId) => `/issuer/credentials/${credRevId}/revocation-status`,
    ISSUE_CREDENTIAL_20_ISSUE: (credExId) => `/issuer/credentials/records/${credExId}/issue`,
    ISSUE_CREDENTIAL_20_PROBLEM_REPORT: (credExId) => `/issuer/credentials/records/${credExId}/problem-report`,
    QR_CONNECTION: '/issuer/qr/connection',
    QR_RECORDS: '/issuer/qr/records',
    QR_RECORD_ITEM: (inviMsgId) => `/issuer/qr/records/${inviMsgId}`,
    CREDENTIAL_REQUESTS: '/issuer/credential-requests',
    CREDENTIAL_REQUEST_APPROVE: (requestId) => `/issuer/credential-requests/${requestId}/approve`,
    CREDENTIAL_REQUEST_REJECT: (requestId) => `/issuer/credential-requests/${requestId}/reject`,
  },

  // Holder APIs
  HOLDER: {
    DASHBOARD_STATS: '/holder/dashboard/stats',
    CREDENTIALS: '/holder/credentials',
    CREDENTIAL_ITEM: (credentialId) => `/holder/credentials/${credentialId}`,
    OFFERS: '/holder/credentials/offers',
    OFFER_ITEM: (credExId) => `/holder/credentials/offers/${credExId}`,
    ACCEPT_OFFER: (credExId) => `/holder/credentials/accept-offer/${credExId}`,
    DECLINE_OFFER: (credExId) => `/holder/credentials/offers/${credExId}/decline`,
    STORE_CREDENTIAL: (credExId) => `/holder/credentials/store/${credExId}`,
    PROOF_REQUESTS: '/holder/proof-requests',
    PRESENT_PROOF: (presExId) => `/holder/proofs/present/${presExId}`,
    CREDENTIAL_EXCHANGES: '/holder/credentials/offers',
    CREDENTIAL_EXCHANGE_ITEM: (credExId) => `/holder/credentials/offers/${credExId}`,
    CREDENTIAL_EXCHANGE_SEND_REQUEST: (credExId) => `/holder/credentials/accept-offer/${credExId}`,
    CREDENTIAL_EXCHANGE_STORE: (credExId) => `/holder/credentials/store/${credExId}`,
    PROOF_EXCHANGES: '/holder/proof-requests',
    PROOF_EXCHANGE_ITEM: (presExId) => `/holder/proof-requests/${presExId}`,
    PROOF_EXCHANGE_SEND_PRESENTATION: (presExId) => `/holder/proofs/present/${presExId}`,
    SCHEMA_INTAKE_FORM: (schemaId) => `/holder/schemas/${encodeURIComponent(schemaId)}/intake-form`,
    SCHEMA_INITIATE_REQUEST: (schemaId) => `/holder/schemas/${encodeURIComponent(schemaId)}/initiate-request`,
    SCHEMA_SUBMIT_INPUTS: (schemaId) => `/holder/schemas/${encodeURIComponent(schemaId)}/submit-inputs`,
    CREDENTIAL_REQUESTS: '/holder/credential-requests',
    CREDENTIAL_REQUEST_ITEM: (requestId) => `/holder/credential-requests/${requestId}`,
  },

  // Verifier APIs
  VERIFIER: {
    DASHBOARD_STATS: '/verifier/dashboard/stats',
    CREDENTIAL_CATALOG: '/verifier/credential-catalog',
    REQUEST_PROOF: '/verifier/request-proof',
    VERIFICATIONS: '/verifier/verifications',
    VERIFICATION_ITEM: (id) => `/verifier/verifications/${id}`,
    PROOF_EXCHANGES: '/verifier/verifications',
    PROOF_EXCHANGE_ITEM: (id) => `/verifier/verifications/${id}`,
    PRESENT_PROOF_20_CREATE_REQUEST: '/verifier/request-proof',
    PRESENT_PROOF_20_SEND_REQUEST: '/verifier/request-proof',
    PRESENT_PROOF_20_RECORDS: '/verifier/verifications',
    PRESENT_PROOF_20_RECORD_ITEM: (id) => `/verifier/verifications/${id}`,
    QR_VERIFICATION_REQUEST: '/verifier/qr/verification-request',
    QR_RECORDS: '/verifier/qr/records',
    QR_RECORD_RESULTS: (inviMsgId) => `/verifier/qr/records/${inviMsgId}`,
  },

  // Connections (Shared across roles)
  CONNECTIONS: {
    LIST: '/connections',
    ITEM: (connId) => `/connections/${connId}`,
    CREATE_INVITATION: '/connections/create-invitation',
    RECEIVE_INVITATION: '/connections/receive-invitation',
    STATUS: (connId) => `/connections/status/${connId}`,
    CHECK: '/connections/check',
    CHECK_ITEM: (connId) => `/connections/check/${connId}`,
    SEND_MESSAGE: (connId) => `/connections/${connId}/send-message`,
    BASIC_MESSAGES: '/connections/basicmessages',
    BASIC_MESSAGE_ITEM: (messageId) => `/connections/basicmessages/${messageId}`,
    OOB_CREATE: '/connections/create-invitation',
    OOB_RECEIVE: '/connections/receive-invitation',
  },

  // Directory (Issuer discovery)
  DIRECTORY: {
    ISSUERS: '/directory/issuers',
    CONNECT_TO_ISSUER: (issuerId) => `/directory/issuers/${issuerId}/connect`,
  },

  // Notifications
  NOTIFICATIONS: {
    LIST: '/notifications',
    ITEM: (id) => `/notifications/${id}`,
    READ_ALL: '/notifications/read-all',
    MARK_READ: (id) => `/notifications/${id}/read`,
    CLEAR_ALL: '/notifications',
  },

  // Wallet & DID
  WALLET: {
    DIDS: '/profile/dids',
    PUBLIC_DID: '/profile/me',
    CREATE_DID: '/profile/dids',
    SET_PUBLIC_DID: '/profile/dids',
  },

  // Server & Health
  SERVER: {
    STATUS: '/server/status',
    STATUS_LIVE: '/server/status/live',
    STATUS_READY: '/server/status/ready',
    PLUGINS: '/server/plugins',
    CONFIG: '/server/config',
  },
};

export default ENDPOINTS;
