import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { message } from "antd";
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
  CheckCircleOutlined,
  CloseCircleOutlined,
  MailOutlined,
  PhoneOutlined,
  CalendarOutlined,
  AuditOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import TrustDiagram from "../Home/TrustDiagram";
import { authService } from "../../services/apiClient";
import "./LoginPage.css";

const LoginPage = ({ role: propRole, initialMode = "login" }) => {
  const { role: paramRole } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { login, register, logout, user } = useAuth();
  const { dark, toggleTheme } = useTheme();

  const activeRole = propRole || paramRole || "issuer";

  // Determine mode: "login", "register", "verify-otp", "forgot-password", or "reset-password"
  const isRegisterRoute = location.pathname.startsWith("/register") || initialMode === "register";
  const [mode, setMode] = useState(isRegisterRoute && activeRole !== "admin" ? "register" : "login");

  // In-Card Email OTP State
  const [otpState, setOtpState] = useState({
    email: "",
    userId: "",
    otp: "",
    isVerifying: false,
    isResending: false,
    resendCooldown: 0,
    errorMsg: "",
    isSuccess: false,
  });

  // In-Card Forgot & Reset Password State
  const [resetState, setResetState] = useState({
    email: "",
    code: "",
    newPassword: "",
    confirmPassword: "",
    isSendingCode: false,
    isResetting: false,
    resendCooldown: 0,
    errorMsg: "",
    isSuccess: false,
    showNewPassword: false,
    showConfirmPassword: false,
  });

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
    username: "",
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
  const [resetSuccess, setResetSuccess] = useState("");
  const [isRegSubmitting, setIsRegSubmitting] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState({
    checking: false,
    available: null,
    message: "",
    suggestions: [],
    error: false,
    checkedUsername: "",
  });

  // Real-time username availability check
  const trimmedUsername = regForm.username.trim();
  const isUsernameFormatValid = /^[a-zA-Z0-9_-]{3,50}$/.test(trimmedUsername);
  const isUsernamePending =
    isUsernameFormatValid && usernameStatus.checkedUsername !== trimmedUsername;
  const isUsernameReady =
    isUsernameFormatValid &&
    !isUsernamePending &&
    (usernameStatus.available === true || usernameStatus.error);

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

  // Real-time reset password check flags
  const resetPwd = resetState.newPassword || "";
  const resetPwdChecks = {
    length: resetPwd.length >= 8 && resetPwd.length <= 100,
    upper: /[A-Z]/.test(resetPwd),
    lower: /[a-z]/.test(resetPwd),
    digit: /\d/.test(resetPwd),
    special: /[@$!%*?&^#()[\]{}|/\\-_+=<>.,:;~`]/.test(resetPwd),
  };
  const isResetPwdValid = Object.values(resetPwdChecks).every(Boolean);
  const passwordsMatch = Boolean(resetPwd && resetPwd === resetState.confirmPassword);

  // Sync state when activeRole changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm({
      username: "",
      password: "",
    });
    setLoginError("");
    setRegError("");
    setRegSuccess("");
    setResetSuccess("");
    setIsSubmitting(false);

    // If admin is clicked in register/otp mode, force login mode since admin cannot self-register
    if (activeRole === "admin" && (mode === "register" || mode === "verify-otp")) {
      setMode("login");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRole]);

  // Debounced username availability check
  useEffect(() => {
    let cancelled = false;

    const timer = setTimeout(async () => {
      if (!isUsernameFormatValid) {
        setUsernameStatus({
          checking: false,
          available: null,
          message: "",
          suggestions: [],
          error: false,
          checkedUsername: trimmedUsername,
        });
        return;
      }

      setUsernameStatus({
        checking: true,
        available: null,
        message: "",
        suggestions: [],
        error: false,
        checkedUsername: trimmedUsername,
      });

      try {
        const res = await authService.checkUsername(trimmedUsername);
        if (cancelled) return;

        const available =
          typeof res?.available === "boolean"
            ? res.available
            : typeof res?.data?.available === "boolean"
            ? res.data.available
            : null;
        const suggestions = Array.isArray(res?.suggestions)
          ? res.suggestions
          : Array.isArray(res?.data?.suggestions)
          ? res.data.suggestions
          : [];

        setUsernameStatus({
          checking: false,
          available,
          message: res?.message || res?.data?.message || "",
          suggestions,
          error: false,
          checkedUsername: trimmedUsername,
        });
      } catch (err) {
        if (cancelled) return;

        setUsernameStatus({
          checking: false,
          available: null,
          message:
            err?.response?.data?.message ||
            err?.message ||
            "Could not verify username availability.",
          suggestions: [],
          error: true,
          checkedUsername: trimmedUsername,
        });
      }
    }, 450);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [trimmedUsername, isUsernameFormatValid]);

  // Resend OTP countdown timer
  useEffect(() => {
    let timer;
    if (otpState.resendCooldown > 0) {
      timer = setInterval(() => {
        setOtpState((prev) => ({
          ...prev,
          resendCooldown: Math.max(0, prev.resendCooldown - 1),
        }));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [otpState.resendCooldown]);

  // Reset password resend code countdown timer
  useEffect(() => {
    let timer;
    if (resetState.resendCooldown > 0) {
      timer = setInterval(() => {
        setResetState((prev) => ({
          ...prev,
          resendCooldown: Math.max(0, prev.resendCooldown - 1),
        }));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resetState.resendCooldown]);

  // Session check - redirect if already logged in to this active role
  useEffect(() => {
    if (user && user.role === activeRole) {
      navigate(`/${activeRole}-dashboard`, { replace: true });
    }
  }, [user, activeRole, navigate]);

  const hasActiveConflictingSession = Boolean(user && user.role !== activeRole);

  const handleRoleChange = (targetRole) => {
    if (targetRole !== activeRole) {
      setMode("login");
      setLoginError("");
      setRegError("");
      setRegSuccess("");
      navigate(`/login/${targetRole}`);
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
    setResetSuccess("");

    if (newMode === "register" || newMode === "verify-otp") {
      navigate(`/register/${activeRole}`, { replace: true });
    } else {
      navigate(`/login/${activeRole}`, { replace: true });
    }
  };

  // Helper to jump directly to In-Card OTP Verification step
  const switchToOtpVerification = (targetEmail = "") => {
    const emailToUse =
      targetEmail ||
      regForm.email.trim() ||
      (form.username.includes("@") ? form.username.trim() : "");

    setOtpState({
      email: emailToUse,
      userId: "",
      otp: "",
      isVerifying: false,
      isResending: false,
      resendCooldown: 0,
      errorMsg: "",
      isSuccess: false,
    });
    setMode("verify-otp");
  };

  // Login Handlers
  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    if (isSubmitting) return;
    setLoginError("");
    setResetSuccess("");
    setIsSubmitting(true);

    try {
      const result = await login(form);
      const userRole = result?.user?.role || activeRole;
      navigate(`/${userRole}-dashboard`, { replace: true });
    } catch (err) {
      const errStr = typeof err === "string" ? err : err.message || "Login failed. Please check credentials.";
      const lower = errStr.toLowerCase();
      if (
        lower.includes("identity verification") ||
        lower.includes("verify their email") ||
        lower.includes("verification is still pending") ||
        lower.includes("email approval pending") ||
        lower.includes("email unverified")
      ) {
        const potentialEmail = form.username.includes("@") ? form.username.trim() : regForm.email.trim();
        setLoginError(
          <div>
            <div style={{ marginBottom: 6 }}>{errStr}</div>
            <button
              type="button"
              style={{
                color: "#2563eb",
                fontWeight: 700,
                textDecoration: "underline",
                cursor: "pointer",
                padding: 0,
                background: "transparent",
                border: "none",
              }}
              onClick={() => switchToOtpVerification(potentialEmail)}
            >
              📬 Complete Account Registration Verification →
            </button>
          </div>
        );
      } else if (errStr.toLowerCase().includes("invalid credentials")) {
        setLoginError(
          "Invalid credentials. Please enter your registered username and password."
        );
      } else {
        setLoginError(errStr);
      }
      setIsSubmitting(false);
    }
  };

  // In-Card OTP Verification Handlers
  const handleInCardVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    const cleanOtp = (otpState.otp || "").trim();
    const cleanEmail = (otpState.email || "").trim();

    if (!cleanOtp) {
      setOtpState((prev) => ({ ...prev, errorMsg: "Please enter the 6-digit OTP code." }));
      return;
    }

    if (!cleanEmail) {
      setOtpState((prev) => ({ ...prev, errorMsg: "Missing recipient email address." }));
      return;
    }

    setOtpState((prev) => ({ ...prev, isVerifying: true, errorMsg: "" }));

    try {
      const payload = {
        email: cleanEmail,
        otp: cleanOtp,
      };
      if (otpState.userId) payload.userId = otpState.userId;

      const res = await authService.verifyEmail(payload);

      if (res?.success || res?.status === 200 || res?.data) {
        setOtpState((prev) => ({ ...prev, isSuccess: true, isVerifying: false, errorMsg: "" }));
        message.success("Email verified successfully!");

        // Auto-fill login form username and transition to login after short delay
        setForm((prev) => ({ ...prev, username: cleanEmail || regForm.username }));
        setLoginError("");

        setTimeout(() => {
          setMode("login");
          setRegSuccess("Account verified! Please sign in with your credentials.");
        }, 1200);
      } else {
        setOtpState((prev) => ({
          ...prev,
          isVerifying: false,
          errorMsg: res?.message || "Invalid or expired OTP. Please check and try again.",
        }));
      }
    } catch (err) {
      const serverMsg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to verify OTP. Please try again.";
      setOtpState((prev) => ({
        ...prev,
        isVerifying: false,
        errorMsg: serverMsg,
      }));
    }
  };

  const handleInCardResendOtp = async () => {
    if (otpState.resendCooldown > 0 || otpState.isResending) return;
    const cleanEmail = (otpState.email || "").trim();
    if (!cleanEmail) {
      setOtpState((prev) => ({ ...prev, errorMsg: "Missing recipient email address." }));
      return;
    }

    setOtpState((prev) => ({ ...prev, isResending: true, errorMsg: "" }));

    try {
      const res = await authService.resendOtp({ email: cleanEmail });
      if (res?.success || res?.status === 200 || res?.data) {
        message.success("New OTP sent to " + cleanEmail);
        setOtpState((prev) => ({
          ...prev,
          isResending: false,
          resendCooldown: 30,
          errorMsg: "",
        }));
      } else {
        setOtpState((prev) => ({
          ...prev,
          isResending: false,
          errorMsg: res?.message || "Failed to resend OTP",
        }));
      }
    } catch (err) {
      const serverMsg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to resend OTP. Please try again.";
      setOtpState((prev) => ({
        ...prev,
        isResending: false,
        errorMsg: serverMsg,
      }));
    }
  };

  // Forgot / Reset Password Handlers
  const switchToForgotPassword = () => {
    const potentialEmail = form.username.includes("@") ? form.username.trim() : "";
    setResetState({
      email: potentialEmail,
      code: "",
      newPassword: "",
      confirmPassword: "",
      isSendingCode: false,
      isResetting: false,
      resendCooldown: 0,
      errorMsg: "",
      isSuccess: false,
      showNewPassword: false,
      showConfirmPassword: false,
    });
    setLoginError("");
    setResetSuccess("");
    setMode("forgot-password");
  };

  const handleSendForgotPassword = async (e) => {
    if (e) e.preventDefault();
    const cleanEmail = (resetState.email || "").trim();
    if (!cleanEmail) {
      setResetState((prev) => ({ ...prev, errorMsg: "Please enter your registered email address." }));
      return;
    }

    setResetState((prev) => ({ ...prev, isSendingCode: true, errorMsg: "" }));

    try {
      const res = await authService.forgotPassword({ email: cleanEmail });
      if (res?.success || res?.status === 200 || res?.data) {
        message.success(`Password reset code sent to ${cleanEmail}`);
        setResetState((prev) => ({
          ...prev,
          isSendingCode: false,
          resendCooldown: 30,
          errorMsg: "",
        }));
        setMode("reset-password");
      } else {
        setResetState((prev) => ({
          ...prev,
          isSendingCode: false,
          errorMsg: res?.message || "Failed to send reset code. Please verify your email.",
        }));
      }
    } catch (err) {
      const serverMsg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to send password reset code. Please check the email entered.";
      setResetState((prev) => ({
        ...prev,
        isSendingCode: false,
        errorMsg: serverMsg,
      }));
    }
  };

  const handleResendResetCode = async () => {
    if (resetState.resendCooldown > 0 || resetState.isSendingCode) return;
    const cleanEmail = (resetState.email || "").trim();
    if (!cleanEmail) return;

    setResetState((prev) => ({ ...prev, isSendingCode: true, errorMsg: "" }));

    try {
      const res = await authService.forgotPassword({ email: cleanEmail });
      if (res?.success || res?.status === 200 || res?.data) {
        message.success(`New reset code sent to ${cleanEmail}`);
        setResetState((prev) => ({
          ...prev,
          isSendingCode: false,
          resendCooldown: 30,
          errorMsg: "",
        }));
      } else {
        setResetState((prev) => ({
          ...prev,
          isSendingCode: false,
          errorMsg: res?.message || "Failed to resend reset code.",
        }));
      }
    } catch (err) {
      setResetState((prev) => ({
        ...prev,
        isSendingCode: false,
        errorMsg: err?.response?.data?.message || err?.message || "Failed to resend reset code.",
      }));
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    if (e) e.preventDefault();
    const cleanEmail = (resetState.email || "").trim();
    const cleanCode = (resetState.code || "").trim();

    if (!cleanEmail) {
      setResetState((prev) => ({ ...prev, errorMsg: "Missing recipient email address." }));
      return;
    }

    if (!cleanCode) {
      setResetState((prev) => ({ ...prev, errorMsg: "Please enter the 6-digit verification code." }));
      return;
    }

    if (!isResetPwdValid) {
      setResetState((prev) => ({
        ...prev,
        errorMsg: "Password must be 8-100 characters and include uppercase, lowercase, number, and special character.",
      }));
      return;
    }

    if (resetState.newPassword !== resetState.confirmPassword) {
      setResetState((prev) => ({ ...prev, errorMsg: "Passwords do not match." }));
      return;
    }

    setResetState((prev) => ({ ...prev, isResetting: true, errorMsg: "" }));

    try {
      const payload = {
        email: cleanEmail,
        code: cleanCode,
        newPassword: resetState.newPassword,
      };

      const res = await authService.resetPassword(payload);

      if (res?.success || res?.status === 200 || res?.data) {
        setResetState((prev) => ({
          ...prev,
          isResetting: false,
          isSuccess: true,
          errorMsg: "",
        }));
        message.success("Password reset successfully!");

        // Pre-fill login username
        setForm((prev) => ({ ...prev, username: cleanEmail, password: "" }));
        setLoginError("");
        setResetSuccess("Password reset successfully! Please sign in with your updated password.");

        setTimeout(() => {
          setMode("login");
        }, 1200);
      } else {
        setResetState((prev) => ({
          ...prev,
          isResetting: false,
          errorMsg: res?.message || "Failed to reset password. Please check your verification code.",
        }));
      }
    } catch (err) {
      const serverMsg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to reset password. Please check the code and try again.";
      setResetState((prev) => ({
        ...prev,
        isResetting: false,
        errorMsg: serverMsg,
      }));
    }
  };

  // Registration Handlers
  const handleRegChange = (e) => {
    const { name, value } = e.target;
    setRegForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegister = async (e) => {
    if (e) e.preventDefault();
    if (isRegSubmitting) return;
    setRegError("");
    setRegSuccess("");

    // Validate username format and availability
    if (!isUsernameFormatValid) {
      setRegError("Username can only contain alphanumeric characters, underscores, and hyphens (3-50 chars).");
      return;
    }

    if (!isUsernamePending && usernameStatus.available === false) {
      setRegError("That username is already taken. Please choose a different one.");
      return;
    }

    if (isUsernamePending || usernameStatus.checking || (usernameStatus.available !== true && !usernameStatus.error)) {
      setRegError("Please wait while we verify your username availability.");
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
      const registeredEmail = regForm.email.trim();
      const newUserId = res?.data?.userId || res?.data?.id || res?.userId || "";

      setRegSuccess(
        res?.message ||
          `Registration submitted! Verification code sent to ${registeredEmail}.`
      );
      setForm((prev) => ({ ...prev, username: regForm.username.trim() }));
      setIsRegSubmitting(false);

      // Smoothly transition inside the same registration card to Step 2: OTP Verification
      setOtpState({
        email: registeredEmail,
        userId: newUserId,
        otp: "",
        isVerifying: false,
        isResending: false,
        resendCooldown: 30,
        errorMsg: "",
        isSuccess: false,
      });
      setMode("verify-otp");
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
              <h2>
                {mode === "register" || mode === "verify-otp"
                  ? "Register New Agent"
                  : mode === "forgot-password" || mode === "reset-password"
                  ? "Reset Agent Password"
                  : "Select & Authenticate Agent"}
              </h2>
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
              {/* Top Row: Heading */}
              <div className="folder-body-header">
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <h3 className="login-heading">
                    {mode === "register"
                      ? "register:"
                      : mode === "verify-otp"
                      ? "verify otp:"
                      : mode === "forgot-password"
                      ? "forgot password:"
                      : mode === "reset-password"
                      ? "reset password:"
                      : "login:"}
                  </h3>
                  <span className="active-role-pill">
                    {currentRoleInfo.icon}
                    <span>{currentRoleInfo.name}</span>
                  </span>
                </div>

                {activeRole === "admin" && (
                  <span className="admin-lock-badge">System Operator</span>
                )}
                {mode === "verify-otp" && (
                  <span className="step-badge-indicator">Step 2 of 2</span>
                )}
                {mode === "forgot-password" && (
                  <span className="step-badge-indicator">Step 1 of 2</span>
                )}
                {mode === "reset-password" && (
                  <span className="step-badge-indicator">Step 2 of 2</span>
                )}
              </div>

              <p className="login-subtext">
                {mode === "register"
                  ? `Create a verified ${currentRoleInfo.name} entity on the decentralized trust network.`
                  : mode === "verify-otp"
                  ? `Enter the 6-digit OTP code sent to your email to activate your account.`
                  : mode === "forgot-password"
                  ? `Enter your registered email address to receive a password reset code.`
                  : mode === "reset-password"
                  ? `Enter the verification code sent to your email and set your new password.`
                  : `Enter your credentials to access the ${currentRoleInfo.name} portal.`}
              </p>



              {hasActiveConflictingSession && (
                <div
                  className="session-conflict-card animate-in"
                  style={{
                    padding: "24px 20px",
                    background: "var(--surface-2, #F8FAFC)",
                    borderRadius: 12,
                    border: "1px solid var(--border-color, #E2E8F0)",
                    textAlign: "center",
                    marginTop: 16,
                  }}
                >
                  <LockOutlined style={{ fontSize: 36, color: "#2563EB", marginBottom: 12 }} />
                  <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 8px", color: "var(--text-primary)" }}>
                    Active Portal Session Detected
                  </h3>
                  <p
                    style={{
                      fontSize: 13,
                      color: "var(--text-secondary)",
                      lineHeight: 1.5,
                      margin: "0 0 20px",
                    }}
                  >
                    You are currently signed into the <strong>{user?.role?.toUpperCase()}</strong> portal as{" "}
                    <code>{user?.username}</code>. Only one active portal session is permitted at a time in this browser.
                    To access the <strong>{activeRole.toUpperCase()}</strong> portal, please log out of your active session.
                  </p>
                  <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                    <button
                      type="button"
                      onClick={() => navigate(`/${user?.role}-dashboard`, { replace: true })}
                      style={{
                        padding: "9px 18px",
                        borderRadius: 8,
                        background: "#1B365D",
                        color: "#FFFFFF",
                        border: "none",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Return to {user?.role?.toUpperCase()} Dashboard
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await logout();
                      }}
                      style={{
                        padding: "9px 18px",
                        borderRadius: 8,
                        background: "transparent",
                        color: "#EF4444",
                        border: "1px solid #EF4444",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Log Out
                    </button>
                  </div>
                </div>
              )}

              {/* ======================================================= */}
              {/* MODE 1: LOGIN FORM                                      */}
              {/* ======================================================= */}
              {!hasActiveConflictingSession && mode === "login" && (
                <>
                  {resetSuccess && (
                    <div className="login-success-banner animate-in" style={{ marginBottom: 16 }}>
                      <CheckCircleOutlined style={{ fontSize: 16, color: "#16A34A" }} />
                      <div>
                        <strong>Password Reset Successful!</strong>
                        <div style={{ fontSize: 12, opacity: 0.9 }}>{resetSuccess}</div>
                      </div>
                    </div>
                  )}

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
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                        <label htmlFor="password" style={{ margin: 0 }}>Password</label>
                        <button
                          type="button"
                          className="forgot-password-link"
                          onClick={switchToForgotPassword}
                        >
                          Forgot password?
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
                </>
              )}

              {/* ======================================================= */}
              {/* MODE 2: REGISTER FORM (Matches Swagger RegisterRequest) */}
              {/* ======================================================= */}
              {!hasActiveConflictingSession && mode === "register" && (
                <>
                  <div className="in-card-stepper">
                    <div className="in-card-step active">
                      <span className="step-circle">1</span>
                      <span className="step-label">Account Details</span>
                    </div>
                    <div className="in-card-step-connector" />
                    <div
                      className="in-card-step clickable"
                      onClick={() => switchToOtpVerification()}
                      title="Jump to OTP Verification"
                    >
                      <span className="step-circle">2</span>
                      <span className="step-label">Verify Email OTP</span>
                    </div>
                  </div>

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

                        {trimmedUsername.length > 0 && (
                          <div
                            className={`username-status-row ${
                              isUsernamePending || usernameStatus.checking
                                ? "checking"
                                : !isUsernameFormatValid
                                ? "invalid"
                                : usernameStatus.available === true
                                ? "available"
                                : usernameStatus.available === false
                                ? "taken"
                                : usernameStatus.error
                                ? "error"
                                : ""
                            }`}
                          >
                            {isUsernamePending || usernameStatus.checking ? (
                              <>
                                <ReloadOutlined spin className="username-status-icon" />
                                <span>Checking availability...</span>
                              </>
                            ) : !isUsernameFormatValid ? (
                              <>
                                <CloseCircleOutlined className="username-status-icon" />
                                <span>Use 3-50 letters, numbers, underscores, or hyphens.</span>
                              </>
                            ) : usernameStatus.available === true ? (
                              <>
                                <CheckCircleOutlined className="username-status-icon" />
                                <span>{usernameStatus.message || "Username is available"}</span>
                              </>
                            ) : usernameStatus.available === false ? (
                              <>
                                <CloseCircleOutlined className="username-status-icon" />
                                <span>{usernameStatus.message || "Username is already taken"}</span>
                              </>
                            ) : usernameStatus.error ? (
                              <>
                                <CloseCircleOutlined className="username-status-icon" />
                                <span>{usernameStatus.message}</span>
                              </>
                            ) : null}
                          </div>
                        )}

                        {!isUsernamePending && usernameStatus.available === false && usernameStatus.suggestions.length > 0 && (
                          <div className="username-suggestions">
                            <span className="username-suggestions-label">Try:</span>
                            {usernameStatus.suggestions.map((suggestion) => (
                              <button
                                key={suggestion}
                                type="button"
                                className="username-suggestion-chip"
                                onClick={() =>
                                  setRegForm((prev) => ({ ...prev, username: suggestion }))
                                }
                              >
                                {suggestion}
                              </button>
                            ))}
                          </div>
                        )}
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
                      disabled={isRegSubmitting || !isPwdValid || !isUsernameReady}
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

              {/* ======================================================= */}
              {/* MODE 3: IN-CARD EMAIL OTP VERIFICATION                 */}
              {/* ======================================================= */}
              {!hasActiveConflictingSession && mode === "verify-otp" && (
                <>
                  <div className="in-card-stepper">
                    <div
                      className="in-card-step completed clickable"
                      onClick={() => setMode("register")}
                      title="Back to Account Details"
                    >
                      <span className="step-circle">
                        <CheckCircleOutlined />
                      </span>
                      <span className="step-label">Account Details</span>
                    </div>
                    <div className="in-card-step-connector completed" />
                    <div className="in-card-step active">
                      <span className="step-circle">2</span>
                      <span className="step-label">Registration Email OTP</span>
                    </div>
                  </div>

                  <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 14, padding: "9px 12px", background: "rgba(37,99,235,0.06)", borderRadius: 8, border: "1px solid rgba(37,99,235,0.15)", lineHeight: 1.45 }}>
                    ℹ️ <strong>Account Activation:</strong> This step verifies your email to complete registration. If you requested a password reset, please <button type="button" onClick={() => handleModeSwitch("login")} style={{ color: "#2563eb", fontWeight: 600, background: "none", border: "none", padding: 0, cursor: "pointer", textDecoration: "underline" }}>return to Sign In</button> and click <em>Forgot password?</em>.
                  </div>

                  {otpState.errorMsg && (
                    <div className="login-error-banner animate-in">
                      <span>{otpState.errorMsg}</span>
                    </div>
                  )}

                  {otpState.isSuccess && (
                    <div className="login-success-banner animate-in">
                      <CheckCircleOutlined style={{ fontSize: 16 }} />
                      <div>
                        <strong>Email Identity Verified!</strong>
                        <div style={{ fontSize: 11, opacity: 0.85 }}>
                          Redirecting to Sign In...
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Target Email Box */}
                  <div className="in-card-otp-email-box">
                    <div className="in-card-otp-email-info">
                      <MailOutlined style={{ fontSize: 18, color: "#2563EB" }} />
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 11,
                            color: "var(--text-secondary)",
                            fontWeight: 600,
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                          }}
                        >
                          Verification Code Sent To
                        </div>
                        <div className="email-addr">
                          {otpState.email || regForm.email || "Registered Email"}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="in-card-change-email-btn"
                      onClick={() => setMode("register")}
                    >
                      Edit Details
                    </button>
                  </div>

                  <form onSubmit={handleInCardVerifyOtp} className="folder-form-content">
                    <div className="form-group-custom">
                      <label htmlFor="in-card-otp-input">
                        Enter 6-Digit OTP <span className="req-asterisk">*</span>
                      </label>
                      <div className="input-wrapper-custom">
                        <SafetyCertificateOutlined className="input-icon-custom" style={{ color: "#2563EB" }} />
                        <input
                          id="in-card-otp-input"
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          autoFocus
                          maxLength={6}
                          disabled={otpState.isSuccess || otpState.isVerifying}
                          value={otpState.otp}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                            setOtpState((prev) => ({ ...prev, otp: val, errorMsg: "" }));
                          }}
                          placeholder="••••••"
                          className="in-card-otp-input-field"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={otpState.isVerifying || otpState.isSuccess || otpState.otp.trim().length === 0}
                      className="folder-submit-btn"
                      style={{ background: "#2563EB" }}
                    >
                      {otpState.isVerifying ? (
                        <span>Verifying OTP...</span>
                      ) : otpState.isSuccess ? (
                        <span>Verified!</span>
                      ) : (
                        <>
                          <span>Verify Email OTP</span>
                          <ArrowRightOutlined className="btn-arrow" />
                        </>
                      )}
                    </button>
                  </form>

                  <div className="in-card-otp-footer">
                    <div className="in-card-resend-wrap">
                      {otpState.resendCooldown > 0 ? (
                        <span className="resend-countdown-text">
                          Resend OTP in <strong>{otpState.resendCooldown}s</strong>
                        </span>
                      ) : (
                        <button
                          type="button"
                          className="in-card-resend-btn"
                          disabled={otpState.isResending || otpState.isSuccess}
                          onClick={handleInCardResendOtp}
                        >
                          <ReloadOutlined className={otpState.isResending ? "spin" : ""} />
                          <span>{otpState.isResending ? "Sending..." : "Resend OTP"}</span>
                        </button>
                      )}
                    </div>

                    <div className="in-card-otp-nav-links">
                      <button
                        type="button"
                        className="text-link-btn"
                        onClick={() => setMode("register")}
                      >
                        ← Back to Details
                      </button>
                      <span>•</span>
                      <button
                        type="button"
                        className="text-link-btn"
                        onClick={() => handleModeSwitch("login")}
                      >
                        Sign In instead
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* ======================================================= */}
              {/* MODE 4: FORGOT PASSWORD (STEP 1: REQUEST RESET CODE)   */}
              {/* ======================================================= */}
              {!hasActiveConflictingSession && mode === "forgot-password" && (
                <>
                  <div className="in-card-stepper">
                    <div className="in-card-step active">
                      <span className="step-circle">1</span>
                      <span className="step-label">Request Code</span>
                    </div>
                    <div className="in-card-step-connector" />
                    <div
                      className="in-card-step clickable"
                      onClick={() => setMode("reset-password")}
                      title="Already have a reset code"
                    >
                      <span className="step-circle">2</span>
                      <span className="step-label">Set New Password</span>
                    </div>
                  </div>

                  {resetState.errorMsg && (
                    <div className="login-error-banner animate-in">
                      <span>{resetState.errorMsg}</span>
                    </div>
                  )}

                  <form onSubmit={handleSendForgotPassword} className="folder-form-content">
                    <div className="form-group-custom">
                      <label htmlFor="forgot-email">
                        Registered Email Address <span className="req-asterisk">*</span>
                      </label>
                      <div className="input-wrapper-custom">
                        <MailOutlined className="input-icon-custom" />
                        <input
                          id="forgot-email"
                          type="email"
                          required
                          autoFocus
                          value={resetState.email}
                          onChange={(e) =>
                            setResetState((prev) => ({
                              ...prev,
                              email: e.target.value,
                              errorMsg: "",
                            }))
                          }
                          placeholder="e.g. name@domain.com"
                          autoComplete="email"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={resetState.isSendingCode || !resetState.email.trim()}
                      className="folder-submit-btn"
                      style={{ background: "#2563EB" }}
                    >
                      {resetState.isSendingCode ? (
                        <span>Sending Reset Code...</span>
                      ) : (
                        <>
                          <span>Send Password Reset Code</span>
                          <ArrowRightOutlined className="btn-arrow" />
                        </>
                      )}
                    </button>
                  </form>

                  <div className="in-card-otp-footer">
                    <div className="in-card-otp-nav-links">
                      <button
                        type="button"
                        className="text-link-btn"
                        onClick={() => handleModeSwitch("login")}
                      >
                        ← Return to Sign In
                      </button>
                      <span>•</span>
                      <button
                        type="button"
                        className="text-link-btn"
                        onClick={() => setMode("reset-password")}
                      >
                        Have a code? Enter code →
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* ======================================================= */}
              {/* MODE 5: RESET PASSWORD (STEP 2: VERIFY CODE & NEW PWD) */}
              {/* ======================================================= */}
              {!hasActiveConflictingSession && mode === "reset-password" && (
                <>
                  <div className="in-card-stepper">
                    <div
                      className="in-card-step completed clickable"
                      onClick={() => setMode("forgot-password")}
                      title="Back to Email Step"
                    >
                      <span className="step-circle">
                        <CheckCircleOutlined />
                      </span>
                      <span className="step-label">Request Code</span>
                    </div>
                    <div className="in-card-step-connector completed" />
                    <div className="in-card-step active">
                      <span className="step-circle">2</span>
                      <span className="step-label">Set New Password</span>
                    </div>
                  </div>

                  {resetState.errorMsg && (
                    <div className="login-error-banner animate-in">
                      <span>{resetState.errorMsg}</span>
                    </div>
                  )}

                  {resetState.isSuccess && (
                    <div className="login-success-banner animate-in">
                      <CheckCircleOutlined style={{ fontSize: 16 }} />
                      <div>
                        <strong>Password Reset Successfully!</strong>
                        <div style={{ fontSize: 11, opacity: 0.85 }}>
                          Redirecting to Sign In...
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Target Email Box */}
                  <div className="in-card-otp-email-box">
                    <div className="in-card-otp-email-info">
                      <MailOutlined style={{ fontSize: 18, color: "#2563EB" }} />
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 11,
                            color: "var(--text-secondary)",
                            fontWeight: 600,
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                          }}
                        >
                          Reset Code Sent To
                        </div>
                        <div className="email-addr">
                          {resetState.email || "Registered Email"}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="in-card-change-email-btn"
                      onClick={() => setMode("forgot-password")}
                    >
                      Change Email
                    </button>
                  </div>

                  <form onSubmit={handleResetPasswordSubmit} className="folder-form-content">
                    {/* 6-Digit Code */}
                    <div className="form-group-custom">
                      <label htmlFor="reset-code-input">
                        6-Digit Password Reset Code (from Email) <span className="req-asterisk">*</span>
                      </label>
                      <div className="input-wrapper-custom">
                        <SafetyCertificateOutlined className="input-icon-custom" style={{ color: "#2563EB" }} />
                        <input
                          id="reset-code-input"
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          autoFocus
                          maxLength={6}
                          disabled={resetState.isSuccess || resetState.isResetting}
                          value={resetState.code}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                            setResetState((prev) => ({ ...prev, code: val, errorMsg: "" }));
                          }}
                          placeholder="••••••"
                          className="in-card-otp-input-field"
                        />
                      </div>
                    </div>

                    {/* New Password */}
                    <div className="form-group-custom">
                      <label htmlFor="reset-new-password">
                        New Strong Password <span className="req-asterisk">*</span>
                      </label>
                      <div className="input-wrapper-custom">
                        <LockOutlined className="input-icon-custom" />
                        <input
                          id="reset-new-password"
                          type={resetState.showNewPassword ? "text" : "password"}
                          required
                          disabled={resetState.isSuccess || resetState.isResetting}
                          value={resetState.newPassword}
                          onChange={(e) =>
                            setResetState((prev) => ({
                              ...prev,
                              newPassword: e.target.value,
                              errorMsg: "",
                            }))
                          }
                          placeholder="Enter new password..."
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          className="pwd-toggle-btn"
                          onClick={() =>
                            setResetState((prev) => ({
                              ...prev,
                              showNewPassword: !prev.showNewPassword,
                            }))
                          }
                          tabIndex="-1"
                        >
                          {resetState.showNewPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                        </button>
                      </div>

                      {/* Password Requirements Checklist */}
                      <div className="password-checklist-grid">
                        <span className={`pwd-check-item ${resetPwdChecks.length ? "valid" : ""}`}>
                          {resetPwdChecks.length ? <CheckCircleOutlined /> : <CloseCircleOutlined />} 8-100 chars
                        </span>
                        <span className={`pwd-check-item ${resetPwdChecks.upper ? "valid" : ""}`}>
                          {resetPwdChecks.upper ? <CheckCircleOutlined /> : <CloseCircleOutlined />} 1 Uppercase (A-Z)
                        </span>
                        <span className={`pwd-check-item ${resetPwdChecks.lower ? "valid" : ""}`}>
                          {resetPwdChecks.lower ? <CheckCircleOutlined /> : <CloseCircleOutlined />} 1 Lowercase (a-z)
                        </span>
                        <span className={`pwd-check-item ${resetPwdChecks.digit ? "valid" : ""}`}>
                          {resetPwdChecks.digit ? <CheckCircleOutlined /> : <CloseCircleOutlined />} 1 Number (0-9)
                        </span>
                        <span className={`pwd-check-item ${resetPwdChecks.special ? "valid" : ""}`}>
                          {resetPwdChecks.special ? <CheckCircleOutlined /> : <CloseCircleOutlined />} 1 Special Char
                        </span>
                      </div>
                    </div>

                    {/* Confirm New Password */}
                    <div className="form-group-custom">
                      <label htmlFor="reset-confirm-password">
                        Confirm New Password <span className="req-asterisk">*</span>
                      </label>
                      <div className="input-wrapper-custom">
                        <LockOutlined className="input-icon-custom" />
                        <input
                          id="reset-confirm-password"
                          type={resetState.showConfirmPassword ? "text" : "password"}
                          required
                          disabled={resetState.isSuccess || resetState.isResetting}
                          value={resetState.confirmPassword}
                          onChange={(e) =>
                            setResetState((prev) => ({
                              ...prev,
                              confirmPassword: e.target.value,
                              errorMsg: "",
                            }))
                          }
                          placeholder="Re-enter new password..."
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          className="pwd-toggle-btn"
                          onClick={() =>
                            setResetState((prev) => ({
                              ...prev,
                              showConfirmPassword: !prev.showConfirmPassword,
                            }))
                          }
                          tabIndex="-1"
                        >
                          {resetState.showConfirmPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                        </button>
                      </div>

                      {resetState.confirmPassword && (
                        <div className={`pwd-match-indicator ${passwordsMatch ? "valid" : "invalid"}`}>
                          {passwordsMatch ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                          <span>{passwordsMatch ? "Passwords match" : "Passwords do not match"}</span>
                        </div>
                      )}
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={
                        resetState.isResetting ||
                        resetState.isSuccess ||
                        !resetState.code.trim() ||
                        !isResetPwdValid ||
                        !passwordsMatch
                      }
                      className="folder-submit-btn"
                      style={{ background: "#2563EB" }}
                    >
                      {resetState.isResetting ? (
                        <span>Updating Password...</span>
                      ) : resetState.isSuccess ? (
                        <span>Password Updated!</span>
                      ) : (
                        <>
                          <span>Reset Password</span>
                          <ArrowRightOutlined className="btn-arrow" />
                        </>
                      )}
                    </button>
                  </form>

                  <div className="in-card-otp-footer">
                    <div className="in-card-resend-wrap">
                      {resetState.resendCooldown > 0 ? (
                        <span className="resend-countdown-text">
                          Resend code in <strong>{resetState.resendCooldown}s</strong>
                        </span>
                      ) : (
                        <button
                          type="button"
                          className="in-card-resend-btn"
                          disabled={resetState.isSendingCode || resetState.isSuccess}
                          onClick={handleResendResetCode}
                        >
                          <ReloadOutlined className={resetState.isSendingCode ? "spin" : ""} />
                          <span>{resetState.isSendingCode ? "Sending..." : "Resend Code"}</span>
                        </button>
                      )}
                    </div>

                    <div className="in-card-otp-nav-links">
                      <button
                        type="button"
                        className="text-link-btn"
                        onClick={() => setMode("forgot-password")}
                      >
                        ← Back to Email Step
                      </button>
                      <span>•</span>
                      <button
                        type="button"
                        className="text-link-btn"
                        onClick={() => handleModeSwitch("login")}
                      >
                        Return to Sign In
                      </button>
                    </div>
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