/**
 * SSI API Routing Verification & Diagnostic Suite
 * Runs against the live SSI backend (http://10.210.13.22:5000/api/v1)
 * Validates endpoint reachability, routing alignment, HTTP statuses, and response formats.
 */

import axios from "axios";

const BASE_URL = process.env.VITE_API_BASE_URL || "http://10.210.13.22:5000/api/v1";

console.log(`\n================================================================`);
console.log(`🚀 SSI API ROUTING DIAGNOSTIC SUITE`);
console.log(`   Target Backend: ${BASE_URL}`);
console.log(`================================================================\n`);

const testClient = axios.create({
  baseURL: BASE_URL,
  timeout: 5000,
  validateStatus: () => true, // Don't throw on 4xx/5xx so we can evaluate exact status
  headers: {
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest",
  },
});

const ROUTE_TESTS = [
  // 1. Server & Health
  { name: "Server Live Probe", method: "GET", url: "/server/status/live", expected: [200] },
  { name: "Server Ready Probe", method: "GET", url: "/server/status/ready", expected: [200] },
  { name: "Server Plugins", method: "GET", url: "/server/plugins", expected: [200, 401] },
  { name: "Server Config", method: "GET", url: "/server/config", expected: [200, 401] },

  // 2. Authentication & Onboarding
  { name: "Auth Profile (Protected)", method: "GET", url: "/auth/me", expected: [401] },
  { name: "Auth Registration Status", method: "GET", url: "/auth/registration-status/test-id", expected: [200, 400, 404] },
  { name: "Auth Login Route", method: "POST", url: "/auth/login", data: { email: "probe@cdac.in", password: "probe" }, expected: [400, 401] },
  { name: "Auth API Keys", method: "GET", url: "/auth/api-keys", expected: [401] },

  // 3. Admin Governance
  { name: "Admin Pending Registrations", method: "GET", url: "/admin/registrations/pending", expected: [200, 401, 403] },
  { name: "Admin Users Directory", method: "GET", url: "/admin/users", expected: [200, 401, 403] },
  { name: "Admin Audit Logs", method: "GET", url: "/admin/audit-logs", expected: [200, 401, 403] },

  // 4. Issuer Portal
  { name: "Issuer Recorded Schemas", method: "GET", url: "/issuer/schemas/recorded", expected: [200, 401, 403] },
  { name: "Issuer Credential Definitions", method: "GET", url: "/issuer/credential-definitions/recorded", expected: [200, 401, 403] },
  { name: "Issuer Issued Credentials", method: "GET", url: "/issuer/issued-credentials/recorded", expected: [200, 401, 403] },

  // 5. Holder Portal
  { name: "Holder Stored Credentials", method: "GET", url: "/holder/credentials", expected: [200, 401, 403] },
  { name: "Holder Credential Exchanges", method: "GET", url: "/holder/credential-exchanges", expected: [200, 401, 403] },
  { name: "Holder Proof Exchanges", method: "GET", url: "/holder/proof-exchanges", expected: [200, 401, 403] },

  // 6. Verifier Portal
  { name: "Verifier Credential Catalog", method: "GET", url: "/verifier/credentials", expected: [200, 401, 403] },
  { name: "Verifier Proof Requests", method: "GET", url: "/verifier/proof-requests", expected: [200, 401, 403] },
  { name: "Verifier Recorded Verifications", method: "GET", url: "/verifier/verifications/recorded", expected: [200, 401, 403] },

  // 7. Connections (DIDComm)
  { name: "Connections List", method: "GET", url: "/connections", expected: [200, 401, 403] },
  { name: "OOB Records", method: "GET", url: "/connections/out-of-band/records", expected: [200, 401, 403] },
];

async function runDiagnostics() {
  let passed = 0;
  let failed = 0;
  const results = [];

  for (const test of ROUTE_TESTS) {
    const startTime = Date.now();
    try {
      const res = await testClient({
        method: test.method,
        url: test.url,
        data: test.data,
      });
      const duration = Date.now() - startTime;
      const isExpected = test.expected.includes(res.status);

      if (isExpected) {
        passed++;
      } else {
        failed++;
      }

      results.push({
        name: test.name,
        method: test.method,
        url: test.url,
        status: res.status,
        duration: `${duration}ms`,
        routedSuccessfully: isExpected ? "✅ PASS" : "⚠️ UNEXPECTED",
        note: getStatusMeaning(res.status),
      });
    } catch (err) {
      failed++;
      results.push({
        name: test.name,
        method: test.method,
        url: test.url,
        status: "ERR",
        duration: "-",
        routedSuccessfully: "❌ FAILED",
        note: err.message,
      });
    }
  }

  // Print Formatted Table
  console.table(results, ["method", "url", "status", "duration", "routedSuccessfully", "note"]);

  console.log(`\n----------------------------------------------------------------`);
  console.log(`📊 SUMMARY: ${passed} Passed | ${failed} Failed / Unexpected (${Math.round((passed / ROUTE_TESTS.length) * 100)}% Verified)`);
  console.log(`----------------------------------------------------------------`);
  console.log(`NOTE: `);
  console.log(`- 200 OK: Route reachable and publicly accessible or probe succeeded.`);
  console.log(`- 401/403: Route is alive and properly protected by Auth Guard middleware.`);
  console.log(`- 400/422: Route exists and backend input validation intercepted the probe.`);
  console.log(`- 404: Route path does not exist on backend router.`);
  console.log(`================================================================\n`);
}

function getStatusMeaning(status) {
  if (status === 200) return "200 OK (Public/Healthy)";
  if (status === 201) return "201 Created";
  if (status === 400) return "400 Handled Validation";
  if (status === 401) return "401 Protected by Auth Guard";
  if (status === 403) return "403 Forbidden / Role Restricted";
  if (status === 404) return "404 Route Not Found on Server";
  if (status === 500) return "500 Server Error";
  return `HTTP ${status}`;
}

runDiagnostics();
