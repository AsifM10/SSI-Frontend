/**
 * Mock authentication service for development.
 * 
 * TODO: Replace with real backend API service when backend contract is provided.
 * 
 * This service mimics the authentication endpoint structure that the backend will
 * provide. Currently uses mock data for the four SSI roles: issuer, holder, verifier, admin.
 */

// Mock user data for each role
const MOCK_USERS = {
  issuer: {
    userId: "issuer-001",
    username: "issuer@example.com",
    email: "issuer@example.com",
    role: "issuer",
  },
  holder: {
    userId: "holder-001",
    username: "holder@example.com",
    email: "holder@example.com",
    role: "holder",
  },
  verifier: {
    userId: "verifier-001",
    username: "verifier@example.com",
    email: "verifier@example.com",
    role: "verifier",
  },
  admin: {
    userId: "admin-001",
    username: "admin@example.com",
    email: "admin@example.com",
    role: "admin",
  },
};

/**
 * Simulates user login.
 * In production, this will POST to the backend auth endpoint.
 * 
 * @param {Object} credentials - { username, password }
 * @returns {Promise<Object>} - { success, user, token }
 */
export const mockLogin = async (credentials) => {
  const { username, password } = credentials;

  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 800));

  // 1. Check credentials against mock default users
  for (const [role, user] of Object.entries(MOCK_USERS)) {
    if ((user.username.toLowerCase() === username.toLowerCase() || user.email.toLowerCase() === username.toLowerCase()) && password === "password123") {
      const token = `mock-jwt-token-${role}-${Date.now()}`;
      return {
        success: true,
        user: {
          ...user,
          token,
        },
        token,
      };
    }
  }

  // 2. Check credentials against dynamically registered users in localStorage
  try {
    const registeredUsers = JSON.parse(localStorage.getItem("mock_registered_users") || "[]");
    const matched = registeredUsers.find(
      (u) =>
        (u.username.toLowerCase() === username.toLowerCase() ||
         u.email.toLowerCase() === username.toLowerCase()) &&
        u.password === password
    );

    if (matched) {
      const token = `mock-jwt-token-${matched.role}-${Date.now()}`;
      return {
        success: true,
        user: {
          userId: matched.userId,
          username: matched.username,
          email: matched.email,
          role: matched.role,
          first_name: matched.first_name,
          last_name: matched.last_name,
          organizationName: matched.organizationName,
          token,
        },
        token,
      };
    }
  } catch (err) {
    console.error("Error reading registered users from localStorage:", err);
  }

  return {
    success: false,
    message: "Invalid username or password",
  };
};

/**
 * Registers a new user with strict role-based validation matching Swagger RegisterRequest.
 * 
 * @param {Object} registerData
 * @returns {Promise<Object>}
 */
export const mockRegister = async (registerData) => {
  await new Promise((resolve) => setTimeout(resolve, 800));

  const {
    username,
    email,
    password,
    role = "holder",
    verificationMethod = "email",
    first_name,
    last_name,
    phone,
    organizationName,
    organizationType,
    CredentialIssuerDomain,
    region,
    dob,
    gender,
    occupation,
    institutionOrOrganization,
  } = registerData;

  // 1. Username validation
  if (!username || username.trim().length < 3 || username.trim().length > 50) {
    throw new Error("Username must be between 3 and 50 characters.");
  }
  const usernameRegex = /^[a-zA-Z0-9_-]+$/;
  if (!usernameRegex.test(username.trim())) {
    throw new Error("Username can only contain alphanumeric characters, underscores, and hyphens.");
  }

  // 2. Email validation
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    throw new Error("Please enter a valid email address.");
  }

  // 3. Password complexity validation (Swagger regex)
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&^#()[\]{}|/\\-_+=<>.,:;~`])[A-Za-z\d@$!%*?&^#()[\]{}|/\\-_+=<>.,:;~`]{8,100}$/;
  if (!password || !passwordRegex.test(password)) {
    throw new Error(
      "Password must be 8-100 characters and contain at least one uppercase letter, one lowercase letter, one digit, and one special character."
    );
  }

  // 4. Role validation
  if (!["holder", "issuer", "verifier"].includes(role)) {
    throw new Error("Invalid role. Role must be one of: holder, issuer, or verifier.");
  }

  // 5. Role-specific validation
  if (role === "issuer" || role === "verifier") {
    if (!first_name || !first_name.trim()) throw new Error("First legal name is required.");
    if (!last_name || !last_name.trim()) throw new Error("Last legal name is required.");
    if (!organizationName || !organizationName.trim()) throw new Error("Organization Name is required.");
    if (!organizationType) throw new Error("Organization Type is required.");
  }

  if (role === "issuer") {
    if (!CredentialIssuerDomain) throw new Error("Credential Issuer Domain is required for issuer.");
    if (!region || !region.state || !region.city) {
      throw new Error("Operating region (State and City) is required for issuer.");
    }
  }

  // 6. Check unique constraints against existing mock & registered users
  let registeredUsers = [];
  try {
    registeredUsers = JSON.parse(localStorage.getItem("mock_registered_users") || "[]");
  } catch {
    registeredUsers = [];
  }

  const existingDefault = Object.values(MOCK_USERS).some(
    (u) => u.username.toLowerCase() === username.trim().toLowerCase() || u.email.toLowerCase() === email.trim().toLowerCase()
  );
  const existingDynamic = registeredUsers.some(
    (u) => u.username.toLowerCase() === username.trim().toLowerCase() || u.email.toLowerCase() === email.trim().toLowerCase()
  );

  if (existingDefault || existingDynamic) {
    throw new Error(`User with username '${username}' or email '${email}' already exists.`);
  }

  const newUser = {
    userId: `${role}-${Date.now()}`,
    username: username.trim(),
    email: email.trim(),
    password, // Stored for mock login validation
    role,
    verificationMethod: verificationMethod || "email",
    first_name: first_name?.trim() || "",
    last_name: last_name?.trim() || "",
    phone: phone?.trim() || "",
    organizationName: organizationName?.trim() || "",
    organizationType: organizationType || "",
    CredentialIssuerDomain: CredentialIssuerDomain || "",
    region: region || {},
    dob: dob || "",
    gender: gender || "",
    occupation: occupation || "",
    institutionOrOrganization: institutionOrOrganization?.trim() || "",
    createdAt: new Date().toISOString(),
  };

  registeredUsers.push(newUser);
  localStorage.setItem("mock_registered_users", JSON.stringify(registeredUsers));

  return {
    success: true,
    message: `Account registered successfully as ${role.toUpperCase()}! You can now log in.`,
    user: {
      userId: newUser.userId,
      username: newUser.username,
      email: newUser.email,
      role: newUser.role,
    },
  };
};

/**
 * Simulates user logout.
 * In production, this will POST to the backend logout endpoint.
 * 
 * @returns {Promise<Object>} - { success }
 */
export const mockLogout = async () => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return { success: true };
};

/**
 * Gets the current user session.
 * In production, this will check the backend for active session.
 * 
 * @returns {Object} - { user, isAuthenticated }
 */
export const mockGetSession = () => {
  const storedUser = localStorage.getItem("user");
  if (storedUser) {
    const user = JSON.parse(storedUser);
    return {
      isAuthenticated: true,
      user,
    };
  }
  return { isAuthenticated: false, user: null };
};

/**
 * Simulates session expiry check.
 * In production, this will check token expiry with the backend.
 * 
 * @returns {boolean} - True if session is expired
 */
export const mockIsSessionExpired = () => {
  const loginTime = localStorage.getItem("loginTime");
  if (!loginTime) return true;
  const diff = Date.now() - Number(loginTime);
  // Mock: session expires after 2 hours
  return diff > 2 * 60 * 60 * 1000;
};