# Spec: Strict Role Portal Isolation & Login Boundary Enforcement

> **Document:** `docs/intent/role_portal_isolation.md`  
> **Initiative:** Single-Portal Authentication Exclusivity across SSI Ecosystem  
> **Status:** Confirmed Specification  
> **Scope:** `ssi-backend` (`auth.controller.js`) & `SSI-Frontend` (`LoginPage.jsx`, `authSlice.js`, `auth.api.js`, `RoleGuard.jsx`)

---

## 1. Objective & Background

### Problem Statement
Currently, authentication endpoints (`POST /api/v1/auth/login` and `POST /api/v1/auth/token`) authenticate users solely against their username/email and password without verifying the calling portal's intended role. 
If an end-user registered as a `holder` inputs their credentials into the `/login/issuer` or `/login/admin` portal, authentication succeeds and either redirects them to the wrong role dashboard or causes cross-portal session pollution.

### Desired Outcome
Enforce strict single-portal authentication exclusivity. An agent or user account belonging to role $R_A$ cannot log in through the portal section of role $R_B$. Any mismatch must be explicitly rejected, terminating authentication before session credentials or cookies are issued.

---

## 2. Role Scopes & Portals

| Role Identifier | Designated Portal Route | Registration Route | Designated Dashboard |
|---|---|---|---|
| `holder` | `/login/holder` | `/register/holder` | `/holder-dashboard` |
| `issuer` | `/login/issuer` | `/register/issuer` | `/issuer-dashboard` |
| `verifier` | `/login/verifier` | `/register/verifier` | `/verifier-dashboard` |
| `admin` | `/login/admin` | N/A (Invited / Pre-seeded) | `/admin-dashboard` |

---

## 3. Defense-in-Depth Architecture

```
User submits credentials at /login/:portalRole
                   │
                   ▼
[Frontend: LoginPage.jsx] ─── Transmits { username, password, role: activeRole }
                   │
                   ▼
[Backend: POST /api/v1/auth/login]
                   │
         Verify User & Password?
             ├─── Invalid ───► HTTP 401 Unauthorized
             └─── Valid
                   │
         Did request specify 'role'?
             ├─── No (Legacy/Swagger) ───► Proceed with login (backward compatible)
             └─── Yes
                   │
         user.role === requestedRole?
             ├─── No (Mismatch) ─────────► HTTP 403 Forbidden { success: false, code: 'ROLE_MISMATCH', message: '...' }
             │                             (NO cookie set, NO token issued)
             └─── Yes (Match)
                   │
                   ▼
         Issue Session Cookie & Return HTTP 200 OK
                   │
                   ▼
[Frontend: Client Post-Auth Verification]
         result.user.role === activeRole?
             ├─── No ────────────────────► Discard, dispatch logout(), clear storage, show Error Alert
             └─── Yes ───────────────────► Navigate to /:userRole-dashboard
```

---

## 4. Technical Specifications

### A. Backend (`ssi-backend/src/controllers/auth.controller.js`)

#### 1. Payload Contract:
`POST /api/v1/auth/login` and `POST /api/v1/auth/token`
```json
{
  "username": "user@example.com",
  "password": "SecurePassword123!",
  "role": "issuer" // Optional: 'issuer' | 'holder' | 'verifier' | 'admin'
}
```

#### 2. Validation Logic:
```javascript
// Inside login handler in auth.controller.js:
const { email, username, identifier, password, role: requestedRole } = req.body || {};

// ... password verified successfully ...

// Portal Isolation Check (only if role is explicitly supplied)
if (requestedRole) {
  const normalizedRequestedRole = String(requestedRole).trim().toLowerCase();
  const normalizedUserRole = String(user.role).trim().toLowerCase();

  if (normalizedUserRole !== normalizedRequestedRole) {
    const roleLabels = {
      issuer: "Credential Issuer",
      holder: "Digital Wallet Holder",
      verifier: "Verifier Authority",
      admin: "System Administrator",
    };
    const registeredLabel = roleLabels[normalizedUserRole] || normalizedUserRole;
    const requestedLabel = roleLabels[normalizedRequestedRole] || normalizedRequestedRole;

    return res.status(403).json({
      success: false,
      code: "ROLE_MISMATCH",
      message: `Unauthorized Portal: This account is registered as a ${registeredLabel}. Please log in via the ${registeredLabel} portal.`,
      registeredRole: normalizedUserRole,
      attemptedRole: normalizedRequestedRole,
    });
  }
}
```

#### 3. Security Assertions:
- When a mismatch occurs, execution terminates **before** calling `saveSession()`, setting the `apiKey` cookie, or generating live access tokens.

---

### B. Frontend (`SSI-Frontend`)

#### 1. API Service & Redux Thunk (`authSlice.js` & `auth.api.js`):
- `loginUser` async thunk accepts `{ username, email, password, role }`.
- Passes `role` into `authApi.login(payload)`.

#### 2. Login Page Logic (`LoginPage.jsx`):
- In `handleLogin`:
  ```javascript
  const payload = {
    username: form.username,
    password: form.password,
    role: activeRole,
  };
  const result = await login(payload);

  // Client-side fail-safe assertion
  const userRole = result?.user?.role || result?.role;
  if (userRole && userRole.toLowerCase() !== activeRole.toLowerCase()) {
    await logout();
    setLoginError(
      `Unauthorized Portal: This account is registered as a ${userRole}. Please log in through the ${userRole} portal.`
    );
    return;
  }

  navigate(`/${userRole}-dashboard`, { replace: true });
  ```

#### 3. Active Session Cross-Portal Interceptor (`LoginPage.jsx`):
- When mounting `LoginPage.jsx` or when `user` state changes:
  ```javascript
  useEffect(() => {
    if (user && user.role) {
      if (user.role.toLowerCase() !== activeRole.toLowerCase()) {
        message.warning({
          content: `Active session detected as ${user.role}. Please log out before switching portals.`,
          key: "portal-session-warning",
        });
        navigate(`/${user.role}-dashboard`, { replace: true });
      }
    }
  }, [user, activeRole, navigate]);
  ```

---

## 5. Verification Strategy & Test Cases

| Test Case | Attempted Portal | Account Role | Expected Outcome |
|---|---|---|---|
| **TC-01** | `/login/issuer` | `holder` | **Rejected:** HTTP 403 `ROLE_MISMATCH`, UI displays error alert, no session cookie created. |
| **TC-02** | `/login/admin` | `verifier` | **Rejected:** HTTP 403 `ROLE_MISMATCH`, UI displays error alert, no session cookie created. |
| **TC-03** | `/login/holder` | `admin` | **Rejected:** HTTP 403 `ROLE_MISMATCH`, UI displays error alert, no session cookie created. |
| **TC-04** | `/login/holder` | `holder` | **Success:** HTTP 200 OK, session cookie issued, navigates to `/holder-dashboard`. |
| **TC-05** | `/login/issuer` (active Holder session) | `holder` | **Redirected:** User is intercepted on mount and redirected to `/holder-dashboard` with notification. |
| **TC-06** | Swagger / API without `role` | `issuer` | **Success:** HTTP 200 OK (Backward compatibility preserved for raw CLI tools). |

---

## 6. Commands for Verification
```powershell
# SSI-Frontend Lint & Build
cd r:\ssi-usecase\SSI-Frontend
npm run lint
npm run build

# ssi-backend Verification
cd r:\ssi-usecase\ssi-backend
node --test tests/integration/auth.test.js
```
