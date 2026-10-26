import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import {
  UserOutlined,
  LockOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  SunOutlined,
  MoonOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  BankOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  MailOutlined,
  PhoneOutlined,
  IdcardOutlined,
  GlobalOutlined,
  CalendarOutlined,
  AuditOutlined,
  UserAddOutlined,
  LoginOutlined,
} from "@ant-design/icons";
import TrustDiagram from "../Home/TrustDiagram";
import "./LoginPage.css";

const LoginPage = ({ role: propRole, initialMode = "login" }) => {
  const { role: paramRole } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { login, register, logout, user } = useAuth();
  const { dark, toggleTheme } = useTheme();

  const activeRole = propRole || paramRole || "issuer";

  // Determine mode: "login" or "register"
  const isRegisterRoute = location.pathname.startsWith("/register") || initialMode === "register";
  const [mode, setMode] = useState(isRegisterRoute && activeRole !== "admin" ? "register" : "login");

  const defaultUsernames = {
    issuer: "issuer@example.com",
    holder: "holder@example.com",
    verifier: "verifier@example.com",
    admin: "admin@example.com",
  };

  const roleMeta = {
    issuer: {
      name: "Issuer",
      icon: <BankOutlined />,
      subtitle: "Credential Issuance & Schema Registry",
      color: "#2563EB",
    },
    holder: {
      name: "Holder",
      icon: <UserOutlined />,
      subtitle: "Self-Sovereign Digital Identity Wallet",
      color: "#06B6D4",
    },
    verifier: {
      name: "Verifier",
      icon: <SafetyCertificateOutlined />,
      subtitle: "Zero-Knowledge Proof & Policy Verification",
      color: "#F59E0B",
    },
    admin: {
      name: "Admin",
      icon: <SettingOutlined />,
      subtitle: "System Governance & Multi-Tenant Infrastructure",
      color: "#8B5CF6",
    },
  };

  // -------------------------------------------------------------
  // Login Form State
  // -------------------------------------------------------------
  const [form, setForm] = useState({
    username: defaultUsernames[activeRole] || `${activeRole}@example.com`,
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // -------------------------------------------------------------
  // Registration Form State (Swagger RegisterRequest)
  // -------------------------------------------------------------
  const [regForm, setRegForm] = useState({
    username: "",
    email: "",
    password: "",
    verificationMethod: "email",
    phone: "",
    // Issuer & Verifier fields
    first_name: "",
    last_name: "",
    organizationName: "",
    organizationType: "educational_institution",
    // Issuer only
    CredentialIssuerDomain: "education",
    regionState: "Delhi",
    regionCity: "New Delhi",
    // Holder only
    dob: "",
    gender: "male",
    occupation: "student",
    institutionOrOrganization: "",
  });

  const [regShowPassword, setRegShowPassword] = useState(false);
  const [regError, setRegError] = useState("");
  const [regSuccess, setRegSuccess] = useState("");
  const [isRegSubmitting, setIsRegSubmitting] = useState(false);

  // Real-time password check flags
  const pwd = regForm.password || "";
  const pwdChecks = {
    length: pwd.length >= 8 && pwd.length <= 100,
    upper: /[A-Z]/.test(pwd),
    lower: /[a-z]/.test(pwd),
    digit: /\d/.test(pwd),
    special: /[@$!%*?&^#()[\]{}|/\\-_+=<>.,:;~`]/.test(pwd),
  };
  const isPwdValid = Object.values(pwdChecks).every(Boolean);

  // Sync state when activeRole changes
  useEffect(() => {
    setForm({
      username: defaultUsernames[activeRole] || `${activeRole}@example.com`,
      password: "",
    });
    setLoginError("");
    setRegError("");
    setRegSuccess("");
    setIsSubmitting(false);

    // If admin is clicked in register mode, force login mode since admin cannot self-register
    if (activeRole === "admin" && mode === "register") {
      setMode("login");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRole]);

  // Session check
  useEffect(() => {
    if (user) {
      if (user.role === activeRole) {
        navigate(`/${activeRole}-dashboard`, { replace: true });
      } else {
        logout();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRole]);

  const handleRoleChange = (targetRole) => {
    if (targetRole !== activeRole) {
      if (mode === "register") {
        if (targetRole === "admin") {
          setMode("login");
          navigate(`/login/admin`);
        } else {
          navigate(`/register/${targetRole}`);
        }
      } else {
        navigate(`/login/${targetRole}`);
      }
    }
  };

  const handleModeSwitch = (newMode) => {
    if (newMode === "register" && activeRole === "admin") {
      setLoginError("Admin accounts cannot be self-registered. Please sign in with system credentials.");
      return;
    }
    setMode(newMode);
    setLoginError("");
    setRegError("");
    setRegSuccess("");

    if (newMode === "register") {
      navigate(`/register/${activeRole}`, { replace: true });
    } else {
      navigate(`/login/${activeRole}`, { replace: true });
    }
  };

  // Login Handlers
  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAutoFillLogin = () => {
    setForm({
      username: defaultUsernames[activeRole] || `${activeRole}@example.com`,
      password: "password123",
    });
  };

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    if (isSubmitting) return;
    setLoginError("");
    setIsSubmitting(true);

    try {
      const result = await login(form);
      const userRole = result?.user?.role || activeRole;
      navigate(`/${userRole}-dashboard`, { replace: true });
    } catch (err) {
      setLoginError(typeof err === "string" ? err : err.message || "Login failed. Please check credentials.");
      setIsSubmitting(false);
    }
  };

  // Registration Handlers
  const handleRegChange = (e) => {
    const { name, value } = e.target;
    setRegForm((prev) => ({ ...prev, [name]: value }));
  };

  // Demo auto-fill for each role in Register mode
  const handleAutoFillReg = () => {
    if (activeRole === "issuer") {
      setRegForm({
        username: "rahul_issuer",
        email: "rahul@dtu.ac.in",
        password: "P@ssword1234",
        verificationMethod: "email",
        phone: "+91 9876543210",
        first_name: "Rahul",
        last_name: "Batham",
        organizationName: "Delhi Technological University",
        organizationType: "educational_institution",
        CredentialIssuerDomain: "education",
        regionState: "Delhi",
        regionCity: "New Delhi",
        dob: "",
        gender: "male",
        occupation: "student",
        institutionOrOrganization: "",
      });
    } else if (activeRole === "verifier") {
      setRegForm({
        username: "priya_verifier",
        email: "priya@tcs.com",
        password: "P@ssword1234",
        verificationMethod: "email",
        phone: "+91 9876501234",
        first_name: "Priya",
        last_name: "Sharma",
        organizationName: "Tata Consultancy Services",
        organizationType: "private_enterprise",
        CredentialIssuerDomain: "education",
        regionState: "Maharashtra",
        regionCity: "Mumbai",
        dob: "",
        gender: "female",
        occupation: "salaried",
        institutionOrOrganization: "",
      });
    } else if (activeRole === "holder") {
      setRegForm({
        username: "amit_holder",
        email: "amit@gmail.com",
        password: "P@ssword1234",
        verificationMethod: "email",
        phone: "+91 9876512345",
        first_name: "Amit",
        last_name: "Kumar",
        organizationName: "",
        organizationType: "educational_institution",
        CredentialIssuerDomain: "education",
        regionState: "",
        regionCity: "",
        dob: "15-08-1998",
        gender: "male",
        occupation: "student",
        institutionOrOrganization: "Indian Institute of Technology Bombay",
      });
    }
  };

  const handleRegister = async (e) => {
    if (e) e.preventDefault();
    if (isRegSubmitting) return;
    setRegError("");
    setRegSuccess("");

    // Validate username regex
    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!usernameRegex.test(regForm.username.trim())) {
      setRegError("Username can only contain alphanumeric characters, underscores, and hyphens (3-50 chars).");
      return;
    }

    // Validate password complexity
    if (!isPwdValid) {
      setRegError("Password does not meet complexity requirements (uppercase, lowercase, number, special char, 8-100 chars).");
      return;
    }

    // Validate role-specific required fields
    if (activeRole === "issuer" || activeRole === "verifier") {
      if (!regForm.first_name.trim() || !regForm.last_name.trim()) {
        setRegError("First and last legal names are required for " + roleMeta[activeRole].name + ".");
        return;
      }
      if (!regForm.organizationName.trim()) {
        setRegError("Legal entity or institution name is required.");
        return;
      }
    }

    if (activeRole === "issuer") {
      if (!regForm.regionState || !regForm.regionCity) {
        setRegError("Operating geographic region (State and City) is required for Issuer.");
        return;
      }
    }

    // Construct Swagger RegisterRequest payload
    const payload = {
      username: regForm.username.trim(),
      email: regForm.email.trim(),
      password: regForm.password,
      role: activeRole,
      verificationMethod: regForm.verificationMethod || "email",
      phone: regForm.phone?.trim() || undefined,
      first_name: regForm.first_name?.trim() || undefined,
      last_name: regForm.last_name?.trim() || undefined,
    };

    if (activeRole === "issuer") {
      payload.organizationName = regForm.organizationName.trim();
      payload.organizationType = regForm.organizationType;
      payload.CredentialIssuerDomain = regForm.CredentialIssuerDomain;
      payload.region = {
        state: regForm.regionState.trim(),
        city: regForm.regionCity.trim(),
      };
    } else if (activeRole === "verifier") {
      payload.organizationName = regForm.organizationName.trim();
      payload.organizationType = regForm.organizationType;
    } else if (activeRole === "holder") {
      if (regForm.dob) payload.dob = regForm.dob.trim();
      if (regForm.gender) payload.gender = regForm.gender;
      if (regForm.occupation) payload.occupation = regForm.occupation;
      if (regForm.institutionOrOrganization) {
        payload.institutionOrOrganization = regForm.institutionOrOrganization.trim();
      }
    }

    setIsRegSubmitting(true);

    try {
      const res = await register(payload);
      setRegSuccess(res?.message || `Successfully registered as ${roleMeta[activeRole].name}! You can now sign in.`);
      // Prefill login username with registered username
      setForm((prev) => ({ ...prev, username: regForm.username.trim() }));
      setIsRegSubmitting(false);

      // Auto switch to login tab after 2.5 seconds
      setTimeout(() => {
        setMode("login");
        setRegSuccess("");
        navigate(`/login/${activeRole}`, { replace: true });
      }, 2500);
    } catch (err) {
      setRegError(typeof err === "string" ? err : err.message || "Registration failed. Please check inputs.");
      setIsRegSubmitting(false);
    }
  };

  const currentRoleInfo = roleMeta[activeRole] || roleMeta.issuer;

  return (
    <div className="unified-login-page">
      {/* Background Subtle Contour Grid */}
      <div className="subtle-bg-grid" />

      {/* Top Navbar */}
      <header className="login-navbar">
        <div className="login-brand" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
          <div className="login-brand-icon">
            <svg width="22" height="24" viewBox="0 0 24 26" fill="none">
              <path
                d="M12 1L22 5.5V13.5C22 19.5 17.5 24 12 25.5C6.5 24 2 19.5 2 13.5V5.5L12 1Z"
                fill="#1D4ED8"
                stroke="#60A5FA"
                strokeWidth="1.5"
              />
              <path
                d="M8.5 13L11 15.5L15.5 10"
                stroke="#FFFFFF"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="login-brand-name">
            SSI <span>Platform</span>
          </div>
        </div>

        <div className="login-nav-right">
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => navigate("/")}
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            <ArrowLeftOutlined /> Back to Home
          </button>

          <button
            className="theme-toggle-btn"
            onClick={toggleTheme}
            title={dark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {dark ? <SunOutlined /> : <MoonOutlined />}
          </button>
        </div>
      </header>

      {/* Main Split Container: Diagram on Left + Folder-Tabbed Auth on Right */}
      <main className="login-main-container">
        <div className="login-split-card">
          {/* Left Side: 3D Isometric Trust Diagram */}
          <div className="login-diagram-panel">
            <div className="diagram-panel-header">
              <span className="diagram-panel-badge">Decentralized Trust Network</span>
              <h2>{mode === "register" ? "Register New Agent" : "Select & Authenticate Agent"}</h2>
              <p>
                Each portal is cryptographically segregated. Click a node below or choose a tab to authenticate or register.
              </p>
            </div>

            <div className="diagram-embed-container">
              <TrustDiagram
                activeRole={activeRole}
                onSelectRole={handleRoleChange}
                interactive={true}
              />
            </div>

            <div className="diagram-agent-indicator">
              <span className="indicator-dot" />
              <span>Current Selection: <strong>{currentRoleInfo.name}</strong></span>
            </div>
          </div>

          {/* Right Side: Folder Tabbed Auth Panel */}
          <div className="login-folder-panel">
            {/* Top Folder Tabs: issuer | holder | verifier | admin */}
            <div className="folder-tabs-bar">
              {["issuer", "holder", "verifier", "admin"].map((r) => {
                const isActive = activeRole === r;
                return (
                  <button
                    key={r}
                    type="button"
                    className={`folder-tab ${isActive ? "active-folder-tab" : ""}`}
                    onClick={() => handleRoleChange(r)}
                  >
                    <span className="tab-label">{r}</span>
                  </button>
                );
              })}
            </div>

            {/* Folder Card Body */}
            <div className="folder-card-body">
              {/* Top Row: Heading + Mode Toggle (Sign In / Register) */}
              <div className="folder-body-header">
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <h3 className="login-heading">{mode === "register" ? "register:" : "login:"}</h3>
                  <span className="active-role-pill">
                    {currentRoleInfo.icon}
                    <span>{currentRoleInfo.name}</span>
                  </span>
                </div>

                {/* Segmented Auth Mode Switcher */}
                {activeRole !== "admin" ? (
                  <div className="auth-mode-segmented">
                    <button
                      type="button"
                      className={`mode-toggle-btn ${mode === "login" ? "active" : ""}`}
                      onClick={() => handleModeSwitch("login")}
                    >
                      <LoginOutlined /> Sign In
                    </button>
                    <button
                      type="button"
                      className={`mode-toggle-btn ${mode === "register" ? "active" : ""}`}
                      onClick={() => handleModeSwitch("register")}
                    >
                      <UserAddOutlined /> Register
                    </button>
                  </div>
                ) : (
                  <span className="admin-lock-badge">System Operator</span>
                )}
              </div>

              <p className="login-subtext">
                {mode === "register"
                  ? `Create a verified ${currentRoleInfo.name} entity on the decentralized trust network.`
                  : `Enter your credentials to access the ${currentRoleInfo.name} portal.`}
              </p>

              {/* ======================================================= */}
              {/* MODE 1: LOGIN FORM                                      */}
              {/* ======================================================= */}
              {mode === "login" && (
                <>
                  {loginError && (
                    <div className="login-error-banner animate-in">
                      <span>{loginError}</span>
                    </div>
                  )}

                  <form onSubmit={handleLogin} className="folder-form-content">
                    {/* Username Field */}
                    <div className="form-group-custom">
                      <label htmlFor="username">Username or Email</label>
                      <div className="input-wrapper-custom">
                        <UserOutlined className="input-icon-custom" />
                        <input
                          id="username"
                          name="username"
                          type="text"
                          required
                          value={form.username}
                          onChange={handleLoginChange}
                          placeholder={`${activeRole}@example.com`}
                          autoComplete="username"
                        />
                      </div>
                    </div>

                    {/* Password Field */}
                    <div className="form-group-custom">
                      <div className="label-with-action">
                        <label htmlFor="password">Password</label>
                        <button
                          type="button"
                          className="autofill-btn"
                          onClick={handleAutoFillLogin}
                        >
                          <ThunderboltOutlined /> Auto-fill Demo
                        </button>
                      </div>
                      <div className="input-wrapper-custom">
                        <LockOutlined className="input-icon-custom" />
                        <input
                          id="password"
                          name="password"
                          type={showPassword ? "text" : "password"}
                          required
                          value={form.password}
                          onChange={handleLoginChange}
                          placeholder="Enter password..."
                          autoComplete="current-password"
                        />
                        <button
                          type="button"
                          className="pwd-toggle-btn"
                          onClick={() => setShowPassword(!showPassword)}
                          tabIndex="-1"
                        >
                          {showPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                        </button>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="folder-submit-btn"
                    >
                      {isSubmitting ? (
                        <span>Authenticating...</span>
                      ) : (
                        <>
                          <span>Login as {currentRoleInfo.name}</span>
                          <ArrowRightOutlined className="btn-arrow" />
                        </>
                      )}
                    </button>
                  </form>

                  {/* Switch to Register link (For Issuer, Holder, Verifier) */}
                  {activeRole !== "admin" && (
                    <div className="switch-auth-link">
                      <span>Need a new {currentRoleInfo.name} account?</span>
                      <button
                        type="button"
                        className="text-link-btn"
                        onClick={() => handleModeSwitch("register")}
                      >
                        Register here →
                      </button>
                    </div>
                  )}

                  {/* Demo Credentials Footer */}
                  <div className="demo-credentials-footer">
                    <CheckCircleOutlined style={{ color: "#10B981" }} />
                    <span>
                      Default demo login: <code>{defaultUsernames[activeRole]}</code> / <code>password123</code>
                    </span>
                  </div>
                </>
              )}

              {/* ======================================================= */}
              {/* MODE 2: REGISTER FORM (Matches Swagger RegisterRequest) */}
              {/* ======================================================= */}
              {mode === "register" && (
                <>
                  {regError && (
                    <div className="login-error-banner animate-in">
                      <span>{regError}</span>
                    </div>
                  )}

                  {regSuccess && (
                    <div className="login-success-banner animate-in">
                      <CheckCircleOutlined style={{ fontSize: 16 }} />
                      <div>
                        <strong>{regSuccess}</strong>
                        <div style={{ fontSize: 11, opacity: 0.85 }}>Switching to Sign In...</div>
                      </div>
                    </div>
                  )}

                  <div className="reg-toolbar-row">
                    <span className="reg-hint-tag">
                      <AuditOutlined /> Swagger v1.0 • {currentRoleInfo.name} Spec
                    </span>
                    <button
                      type="button"
                      className="autofill-btn"
                      onClick={handleAutoFillReg}
                    >
                      <ThunderboltOutlined /> Auto-fill Demo Data
                    </button>
                  </div>

                  <form onSubmit={handleRegister} className="folder-form-content">
                    {/* Common: Username & Email in 2 columns */}
                    <div className="form-row-2">
                      <div className="form-group-custom">
                        <label htmlFor="reg-username">
                          Username <span className="req-asterisk">*</span>
                        </label>
                        <div className="input-wrapper-custom">
                          <UserOutlined className="input-icon-custom" />
                          <input
                            id="reg-username"
                            name="username"
                            type="text"
                            required
                            minLength={3}
                            maxLength={50}
                            value={regForm.username}
                            onChange={handleRegChange}
                            placeholder={`e.g. rahul_${activeRole}`}
                            autoComplete="username"
                          />
                        </div>
                      </div>

                      <div className="form-group-custom">
                        <label htmlFor="reg-email">
                          Email Address <span className="req-asterisk">*</span>
                        </label>
                        <div className="input-wrapper-custom">
                          <MailOutlined className="input-icon-custom" />
                          <input
                            id="reg-email"
                            name="email"
                            type="email"
                            required
                            maxLength={100}
                            value={regForm.email}
                            onChange={handleRegChange}
                            placeholder="e.g. name@domain.com"
                            autoComplete="email"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Common: Password with live complexity checks */}
                    <div className="form-group-custom">
                      <label htmlFor="reg-password">
                        Strong Password <span className="req-asterisk">*</span>
                      </label>
                      <div className="input-wrapper-custom">
                        <LockOutlined className="input-icon-custom" />
                        <input
                          id="reg-password"
                          name="password"
                          type={regShowPassword ? "text" : "password"}
                          required
                          value={regForm.password}
                          onChange={handleRegChange}
                          placeholder="e.g. P@ssword1234"
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          className="pwd-toggle-btn"
                          onClick={() => setRegShowPassword(!regShowPassword)}
                          tabIndex="-1"
                        >
                          {regShowPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                        </button>
                      </div>

                      {/* Password Requirements Checklist */}
                      <div className="password-checklist-grid">
                        <span className={`pwd-check-item ${pwdChecks.length ? "valid" : ""}`}>
                          {pwdChecks.length ? <CheckCircleOutlined /> : <CloseCircleOutlined />} 8-100 chars
                        </span>
                        <span className={`pwd-check-item ${pwdChecks.upper ? "valid" : ""}`}>
                          {pwdChecks.upper ? <CheckCircleOutlined /> : <CloseCircleOutlined />} 1 Uppercase (A-Z)
                        </span>
                        <span className={`pwd-check-item ${pwdChecks.lower ? "valid" : ""}`}>
                          {pwdChecks.lower ? <CheckCircleOutlined /> : <CloseCircleOutlined />} 1 Lowercase (a-z)
                        </span>
                        <span className={`pwd-check-item ${pwdChecks.digit ? "valid" : ""}`}>
                          {pwdChecks.digit ? <CheckCircleOutlined /> : <CloseCircleOutlined />} 1 Number (0-9)
                        </span>
                        <span className={`pwd-check-item ${pwdChecks.special ? "valid" : ""}`}>
                          {pwdChecks.special ? <CheckCircleOutlined /> : <CloseCircleOutlined />} 1 Special Char
                        </span>
                      </div>
                    </div>

                    {/* Common: Verification Method & Phone */}
                    <div className="form-row-2">
                      <div className="form-group-custom">
                        <label htmlFor="reg-verificationMethod">Verification Method</label>
                        <select
                          id="reg-verificationMethod"
                          name="verificationMethod"
                          className="custom-select"
                          value={regForm.verificationMethod}
                          onChange={handleRegChange}
                        >
                          <option value="email">Email Verification</option>
                          <option value="ekyc">Aadhaar e-KYC</option>
                          <option value="kyc">Standard KYC</option>
                          <option value="epramaan">e-Pramaan (National SSO)</option>
                        </select>
                      </div>

                      <div className="form-group-custom">
                        <label htmlFor="reg-phone">Contact Phone</label>
                        <div className="input-wrapper-custom">
                          <PhoneOutlined className="input-icon-custom" />
                          <input
                            id="reg-phone"
                            name="phone"
                            type="tel"
                            maxLength={25}
                            value={regForm.phone}
                            onChange={handleRegChange}
                            placeholder="+91 9876543210"
                          />
                        </div>
                      </div>
                    </div>

                    {/* =================================================== */}
                    {/* Role-Specific Fields for ISSUER & VERIFIER          */}
                    {/* =================================================== */}
                    {(activeRole === "issuer" || activeRole === "verifier") && (
                      <>
                        <div className="form-row-2">
                          <div className="form-group-custom">
                            <label htmlFor="reg-first_name">
                              First Legal Name <span className="req-asterisk">*</span>
                            </label>
                            <input
                              id="reg-first_name"
                              name="first_name"
                              type="text"
                              required
                              maxLength={100}
                              className="custom-input-simple"
                              value={regForm.first_name}
                              onChange={handleRegChange}
                              placeholder="e.g. Rahul"
                            />
                          </div>
                          <div className="form-group-custom">
                            <label htmlFor="reg-last_name">
                              Last Legal Name <span className="req-asterisk">*</span>
                            </label>
                            <input
                              id="reg-last_name"
                              name="last_name"
                              type="text"
                              required
                              maxLength={100}
                              className="custom-input-simple"
                              value={regForm.last_name}
                              onChange={handleRegChange}
                              placeholder="e.g. Batham"
                            />
                          </div>
                        </div>

                        <div className="form-group-custom">
                          <label htmlFor="reg-organizationName">
                            Legal Entity / Organization Name <span className="req-asterisk">*</span>
                          </label>
                          <div className="input-wrapper-custom">
                            <BankOutlined className="input-icon-custom" />
                            <input
                              id="reg-organizationName"
                              name="organizationName"
                              type="text"
                              required
                              maxLength={200}
                              value={regForm.organizationName}
                              onChange={handleRegChange}
                              placeholder="e.g. Delhi Technological University"
                            />
                          </div>
                        </div>

                        <div className="form-group-custom">
                          <label htmlFor="reg-organizationType">
                            Organization Type <span className="req-asterisk">*</span>
                          </label>
                          <select
                            id="reg-organizationType"
                            name="organizationType"
                            className="custom-select"
                            value={regForm.organizationType}
                            onChange={handleRegChange}
                          >
                            <option value="educational_institution">Educational Institution</option>
                            <option value="government_agency">Government Agency</option>
                            <option value="financial_institution">Financial Institution</option>
                            <option value="healthcare_provider">Healthcare Provider</option>
                            <option value="private_enterprise">Private Enterprise</option>
                            <option value="non_profit">Non-Profit Organization</option>
                          </select>
                        </div>
                      </>
                    )}

                    {/* =================================================== */}
                    {/* Issuer ONLY Fields                                  */}
                    {/* =================================================== */}
                    {activeRole === "issuer" && (
                      <>
                        <div className="form-group-custom">
                          <label htmlFor="reg-CredentialIssuerDomain">
                            Credential Issuer Domain <span className="req-asterisk">*</span>
                          </label>
                          <select
                            id="reg-CredentialIssuerDomain"
                            name="CredentialIssuerDomain"
                            className="custom-select"
                            value={regForm.CredentialIssuerDomain}
                            onChange={handleRegChange}
                          >
                            <option value="education">Education & Academia</option>
                            <option value="identity">Identity & Civil Status</option>
                            <option value="finance">Finance & Banking</option>
                            <option value="employment">Employment & Corporate</option>
                            <option value="healthcare">Healthcare & Medical</option>
                            <option value="governance">Governance & Public Services</option>
                            <option value="membership">Membership & Professional</option>
                            <option value="business">Business & Trade</option>
                          </select>
                        </div>

                        <div className="form-row-2">
                          <div className="form-group-custom">
                            <label htmlFor="reg-regionState">
                              Operating State <span className="req-asterisk">*</span>
                            </label>
                            <input
                              id="reg-regionState"
                              name="regionState"
                              type="text"
                              required
                              className="custom-input-simple"
                              value={regForm.regionState}
                              onChange={handleRegChange}
                              placeholder="e.g. Delhi"
                            />
                          </div>
                          <div className="form-group-custom">
                            <label htmlFor="reg-regionCity">
                              Operating City <span className="req-asterisk">*</span>
                            </label>
                            <input
                              id="reg-regionCity"
                              name="regionCity"
                              type="text"
                              required
                              className="custom-input-simple"
                              value={regForm.regionCity}
                              onChange={handleRegChange}
                              placeholder="e.g. New Delhi"
                            />
                          </div>
                        </div>
                      </>
                    )}

                    {/* =================================================== */}
                    {/* Holder ONLY Fields                                  */}
                    {/* =================================================== */}
                    {activeRole === "holder" && (
                      <>
                        <div className="form-row-2">
                          <div className="form-group-custom">
                            <label htmlFor="reg-first_name">Legal First Name</label>
                            <input
                              id="reg-first_name"
                              name="first_name"
                              type="text"
                              maxLength={100}
                              className="custom-input-simple"
                              value={regForm.first_name}
                              onChange={handleRegChange}
                              placeholder="e.g. Amit"
                            />
                          </div>
                          <div className="form-group-custom">
                            <label htmlFor="reg-last_name">Legal Last Name</label>
                            <input
                              id="reg-last_name"
                              name="last_name"
                              type="text"
                              maxLength={100}
                              className="custom-input-simple"
                              value={regForm.last_name}
                              onChange={handleRegChange}
                              placeholder="e.g. Kumar"
                            />
                          </div>
                        </div>

                        <div className="form-row-2">
                          <div className="form-group-custom">
                            <label htmlFor="reg-dob">Date of Birth</label>
                            <div className="input-wrapper-custom">
                              <CalendarOutlined className="input-icon-custom" />
                              <input
                                id="reg-dob"
                                name="dob"
                                type="text"
                                maxLength={20}
                                value={regForm.dob}
                                onChange={handleRegChange}
                                placeholder="DD-MM-YYYY (e.g. 15-08-1998)"
                              />
                            </div>
                          </div>

                          <div className="form-group-custom">
                            <label htmlFor="reg-gender">Gender Identity</label>
                            <select
                              id="reg-gender"
                              name="gender"
                              className="custom-select"
                              value={regForm.gender}
                              onChange={handleRegChange}
                            >
                              <option value="male">Male</option>
                              <option value="female">Female</option>
                              <option value="other">Other</option>
                            </select>
                          </div>
                        </div>

                        <div className="form-row-2">
                          <div className="form-group-custom">
                            <label htmlFor="reg-occupation">Selectable Occupation</label>
                            <select
                              id="reg-occupation"
                              name="occupation"
                              className="custom-select"
                              value={regForm.occupation}
                              onChange={handleRegChange}
                            >
                              <option value="student">Student</option>
                              <option value="self-employed">Self-Employed</option>
                              <option value="salaried">Salaried Professional</option>
                            </select>
                          </div>

                          <div className="form-group-custom">
                            <label htmlFor="reg-institutionOrOrganization">Affiliated Institution</label>
                            <input
                              id="reg-institutionOrOrganization"
                              name="institutionOrOrganization"
                              type="text"
                              maxLength={200}
                              className="custom-input-simple"
                              value={regForm.institutionOrOrganization}
                              onChange={handleRegChange}
                              placeholder="e.g. IIT Bombay"
                            />
                          </div>
                        </div>
                      </>
                    )}

                    {/* Submit Registration Button */}
                    <button
                      type="submit"
                      disabled={isRegSubmitting || !isPwdValid}
                      className="folder-submit-btn"
                      style={{ background: "#2563EB" }}
                    >
                      {isRegSubmitting ? (
                        <span>Registering on Ledger...</span>
                      ) : (
                        <>
                          <span>Register as {currentRoleInfo.name}</span>
                          <ArrowRightOutlined className="btn-arrow" />
                        </>
                      )}
                    </button>
                  </form>

                  {/* Switch to Login link */}
                  <div className="switch-auth-link">
                    <span>Already have an account?</span>
                    <button
                      type="button"
                      className="text-link-btn"
                      onClick={() => handleModeSwitch("login")}
                    >
                      Sign In here →
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Discrete Footer */}
      <footer className="login-minimal-footer">
        <span>Copyright © 2026 C-DAC Mumbai. All Rights Reserved.</span>
      </footer>
    </div>
  );
};

export default LoginPage;