import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { loginUser, selectAuthLoading, selectAuthError, clearError } from "../../store/slices/authSlice";
import { sendOtp } from "../../services/api";
import {
  UserOutlined,
  LockOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  DownOutlined,
  IdcardOutlined,
  MailOutlined,
  PhoneOutlined,
  TeamOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import ForgotPasswordModal from "../../components/modals/ForgotPasswordModal/ForgotPasswordModal";
import RegistrationSuccessModal from "../../components/modals/RegistrationSuccessModal/RegistrationSuccessModal";
import CDACLogo from "../../assets/CDAC.png";
import SarvekshanMonitor from "../../assets/sarvekshan_monitor.png";
import SarvekshanText from "../../assets/sarvekshan_text.png";
import "../../styles/Auth.css";

const ROLES = [
  "CENTRAL_ADMIN",
  "CENTRAL_VIEWER",
  "DEPT_ADMIN",
  "DEPT_VIEWER",
];

const CPU_POINTS = [20, 35, 30, 52, 40, 66, 48, 74, 58, 80, 60];

function Login() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const loading = useSelector(selectAuthLoading);
  const authError = useSelector(selectAuthError);

  const [user, setUser] = useState({
    username: "",
    password: "",
    role: "",
  });

  const [mode, setMode] = useState("login");

  const [regStep, setRegStep] = useState(1); // 1 = details, 2 = otp + password
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");

  const [regForm, setRegForm] = useState({
    fullName: "",
    designation: "",
    email: "",
    phone: "",
    department: "",
    password: "",
    confirmPassword: "",
  });
  const [regErrors, setRegErrors] = useState({});
  const [departments, setDepartments] = useState([]);
  const [regLoading, setRegLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showRegSuccess, setShowRegSuccess] = useState(false);
  const [toast, setToast] = useState({ type: "", message: "" });

  useEffect(() => {
    if (mode !== "register") return;
    let cancelled = false;
    setRegLoading(true);
    axios
      .get("http://10.210.12.12:8080/api/departments")
      .then((response) => {
        if (!cancelled && response.data && response.data.success) {
          setDepartments(response.data.data);
        }
      })
      .catch((error) => {
        console.error("Failed to load departments:", error);
      })
      .finally(() => {
        if (!cancelled) setRegLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [mode]);

  const demoUsers = {
    CENTRAL_ADMIN: {
      username: "centraladmin",
      password: "Admin@123",
      role: "CENTRAL_ADMIN",
    },
    CENTRAL_VIEWER: {
      username: "centralviewer",
      password: "Viewer@123",
      role: "CENTRAL_VIEWER",
    },
    DEPT_ADMIN: {
      username: "deptadmin",
      password: "Dept@123",
      role: "DEPT_ADMIN",
    },
    DEPT_VIEWER: {
      username: "deptviewer",
      password: "Viewer@123",
      role: "DEPT_VIEWER",
    },
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    dispatch(clearError());
    const result = await dispatch(loginUser({
      email: user.username,
      password: user.password,
    }));
    if (result.meta.requestStatus === "fulfilled") {
      navigate("/dashboard");
    }
  };

  const validateStep1 = () => {
    let newErrors = {};

    if (!regForm.fullName.trim()) {
      newErrors.fullName = "Full Name is required";
    }

    if (!regForm.designation.trim()) {
      newErrors.designation = "Designation is required";
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@cdac\.in$/;

    if (!regForm.email) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(regForm.email)) {
      newErrors.email = "Email must be like name@cdac.in";
    }

    const phoneRegex = /^[6-9]\d{9}$/;

    if (!regForm.phone) {
      newErrors.phone = "Phone number is required";
    } else if (!phoneRegex.test(regForm.phone)) {
      newErrors.phone = "Enter valid 10-digit mobile number";
    }

    if (!regForm.department) {
      newErrors.department = "Please select department";
    }

    setRegErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePassword = () => {
    let newErrors = {};

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

    if (!regForm.password) {
      newErrors.password = "Password is required";
    } else if (!passwordRegex.test(regForm.password)) {
      newErrors.password =
        "Password must contain uppercase, lowercase, number & special character";
    }

    if (!regForm.confirmPassword) {
      newErrors.confirmPassword = "Confirm Password is required";
    } else if (regForm.password !== regForm.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setRegErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleStep1 = async (e) => {
    e.preventDefault();

    if (!validateStep1()) {
      return;
    }

    setOtpError("");
    setRegLoading(true);

    try {
      const result = await sendOtp({ email: regForm.email, purpose: "REGISTRATION" });
      if (result.success) {
        localStorage.setItem("regForm", JSON.stringify(regForm));
        setRegStep(2);
      } else {
        setOtpError(result.message || "Failed to send OTP. Please try again.");
      }
    } catch (error) {
      console.error("OTP send error:", error);
      setOtpError("Unable to send OTP. Please try again.");
    } finally {
      setRegLoading(false);
    }
  };

  const handleStep2 = async (e) => {
    e.preventDefault();

    if (!otp.trim()) {
      setOtpError("Please enter the OTP");
      return;
    }

    if (!validatePassword()) {
      return;
    }

    setRegLoading(true);

    try {
      const payload = {
        personName: regForm.fullName,
        designation: regForm.designation,
        email: regForm.email,
        phoneNo: regForm.phone,
        password: regForm.password,
        role: "DEPT_ADMIN",
        deptId: regForm.department,
        otpCode: otp,
      };
      const response = await axios.post(
        "http://10.210.12.12:8080/api/users",
        payload,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      if (response.status === 201 || response.status === 200) {
        setRegForm({
          fullName: "",
          designation: "",
          email: "",
          phone: "",
          department: "",
          password: "",
          confirmPassword: "",
        });
        setRegErrors({});
        setOtp("");
        setRegStep(1);
        setShowRegSuccess(true);
        localStorage.removeItem("regForm");
      }
    } catch (error) {
      console.error("Registration Error:", error);
      let message = "Unable to connect to the server. Please check your network connection.";
      if (error.response && error.response.data) {
        message = error.response.data.message || "Registration failed. Please try again.";
        if (error.response.data.data) {
          const data = error.response.data.data;
          const key = Object.keys(data)[0];
          if (key) {
            message = data[key];
          }
        }
      }
      showToast("error", message);
    } finally {
      setRegLoading(false);
    }
  };

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast({ type: "", message: "" }), 3500);
  };

  const handleRegSuccessClose = () => {
    setShowRegSuccess(false);
    setMode("login");
  };

  const buildSparkPath = (points) => {
    const stepX = 100 / points.length;
    return points
      .map((p, i) => `${i === 0 ? "M" : "L"}${(i * stepX).toFixed(1)},${(100 - p).toFixed(1)}`)
      .join(" ");
  };

  const buildBars = (points) => {
    const barW = 100 / points.length;
    return points
      .map((p, i) => {
        const x = i * barW + barW * 0.18;
        const w = barW * 0.64;
        const h = 100 - p;
        const y = p;
        return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="0.8"/>`;
      })
      .join(" ");
  };

  return (
    <div className="auth-page">
      <header className="auth-header">
        <div className="auth-header-inner">
          <div className="auth-brand auth-brand-app">
            <img className="sarvekshan-monitor" src={SarvekshanMonitor} alt="Sarvekshan" />
            <img className="sarvekshan-text" src={SarvekshanText} alt="Sarvekshan" />
          </div>
          <div className="auth-brand auth-brand-cdac">
            <img src={CDACLogo} alt="Centre for Development of Advanced Computing" />
            <span>Centre for Development of Advanced Computing</span>
          </div>
        </div>
      </header>

      <div className="auth-container">
        <div className="left-section">
        <div className="twinkle-dot twinkle-dot-1"></div>
        <div className="twinkle-dot twinkle-dot-2"></div>
        <div className="twinkle-dot twinkle-dot-3"></div>
        <div className="twinkle-dot twinkle-dot-4"></div>
        <div className="twinkle-dot twinkle-dot-5"></div>

        <div className="left-deco" aria-hidden="true">
          <div className="deco-cross deco-cross-1"></div>
          <div className="deco-cross deco-cross-2"></div>
          <div className="deco-cross deco-cross-3"></div>

          <div className="inspect inspect-magnify">
            <svg className="inspect-svg" viewBox="0 0 120 140" fill="none">
              <circle cx="52" cy="52" r="34" stroke="rgba(142,92,246,0.55)" strokeWidth="2" />
              <circle cx="52" cy="52" r="18" stroke="rgba(142,92,246,0.35)" strokeWidth="1.5" />
              <circle className="inspect-dot" cx="52" cy="52" r="4" fill="#8E5CF6" />
              <line x1="78" y1="78" x2="108" y2="108" stroke="rgba(142,92,246,0.7)" strokeWidth="4" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        <div className="welcome-text">
          <span className="animate-in animate-in-d2">Welcome to</span>

          <h1 className="animate-in animate-in-d3">Monitoring Dashboard</h1>

          <div className="line animate-in animate-in-d4"></div>

          <h4 className="animate-in animate-in-d5">Monitor. Analyze. Optimize.</h4>

          <p className="animate-in animate-in-d6">
            Real-time monitoring and intelligent insights to keep your systems
            running at their best.
          </p>
        </div>

        <div className="chart-block" aria-hidden="true">
          <svg className="chart-bars" viewBox="0 0 100 100" preserveAspectRatio="none">
            {CPU_POINTS.map((p, i) => {
              const barW = 100 / CPU_POINTS.length;
              const x = i * barW + barW * 0.25;
              const w = barW * 0.5;
              const h = 100 - p;
              const y = p;
              const colors = ["#6FA9A2", "#7E63A6", "#C8894F", "#5B9A74", "#72A9A4", "#8E75BC", "#BC8F34", "#6FA382", "#6B8FC0", "#A85F80", "#776BB0"];
              return (
                <rect key={i} className="chart-bar" x={x} y={y} width={w} height={h} rx="0.8" style={{ fill: colors[i % colors.length] }} />
              );
            })}
          </svg>
          <svg className="chart-line-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path
              className="chart-line-path"
              d={buildSparkPath(CPU_POINTS)}
              fill="none"
              stroke="#D99A1F"
              pathLength={100}
            />
          </svg>
        </div>
      </div>

      <div className="right-section">
        <div className={`login-card ${mode === "register" ? "is-register" : ""} ${mode === "register" && (Object.keys(regErrors).length > 0 || otpError) ? "has-errors" : ""} animate-in animate-in-d3`}>
          <div className="user-icon animate-in animate-in-d1">
            <UserOutlined />
          </div>

          {mode === "login" ? (
            <>
              <h2 className="login-title animate-in animate-in-d2">Sign In</h2>

              <p className="sub-text animate-in animate-in-d3">Please sign in to continue</p>

              <form onSubmit={handleLogin}>
                {authError && <div className="login-error">{authError}</div>}

                <div className="input-group animate-in animate-in-d4">
                  <span className="input-icon">
                    <UserOutlined />
                  </span>

                  <input
                    type="text"
                    placeholder="Email"
                    value={user.username}
                    onChange={(e) =>
                      setUser({
                        ...user,
                        username: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div className="input-group animate-in animate-in-d5">
                  <span className="input-icon">
                    <LockOutlined />
                  </span>

                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={user.password}
                    onChange={(e) =>
                      setUser({
                        ...user,
                        password: e.target.value,
                      })
                    }
                    required
                  />

                  <span
                    className="eye-icon"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                  </span>
                </div>

                <div className="input-group animate-in animate-in-d6">
                  {showRoleDropdown && (
                    <div className="role-dropdown">
                      {ROLES.map((role) => (
                        <div
                          key={role}
                          className={`role-option ${user.role === role ? "active" : ""}`}
                          onClick={() => {
                            setUser({ ...user, role });
                            setShowRoleDropdown(false);
                          }}
                        >
                          {role}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="login-options animate-in animate-in-d2">
                  <label className="remember-me">
                    <input type="checkbox" />
                    Remember me
                  </label>

                  <span className="forgot-password" onClick={() => setShowForgotPassword(true)}>Forgot password?</span>
                </div>

                <button type="submit" className="login-btn animate-in animate-in-d4" disabled={loading}>
                  {loading ? "Signing in..." : "Login"}
                </button>
              </form>

              <p className="signin-link animate-in animate-in-d6">
                New to the platform?
                <span onClick={() => setMode("register")}>
                  {" "}
                  Create an account
                </span>
              </p>
            </>
          ) : (
            <>
              <h2 className="login-title animate-in animate-in-d2">Department User Registration</h2>

              <div className="reg-stepper">
                <div className={`reg-stepper-step ${regStep === 1 ? "active" : ""} ${regStep === 2 ? "done" : ""}`}>
                  <span className="reg-stepper-num">{regStep === 2 ? <CheckCircleOutlined /> : "1"}</span>
                  <span className="reg-stepper-label">Details</span>
                </div>
                <div className="reg-stepper-line" />
                <div className={`reg-stepper-step ${regStep === 2 ? "active" : ""}`}>
                  <span className="reg-stepper-num">2</span>
                  <span className="reg-stepper-label">Verify & Password</span>
                </div>
              </div>

              {regStep === 1 && (
                <form onSubmit={handleStep1} className="register-form">
                  <div className="input-group animate-in animate-in-d4">
                    <span className="input-icon">
                      <UserOutlined />
                    </span>
                    <input
                      type="text"
                      placeholder="Full Name *"
                      value={regForm.fullName}
                      onChange={(e) =>
                        setRegForm({ ...regForm, fullName: e.target.value })
                      }
                    />
                  </div>
                  {regErrors.fullName && <p className="error-text">{regErrors.fullName}</p>}

                  <div className="input-group animate-in animate-in-d4">
                    <span className="input-icon">
                      <IdcardOutlined />
                    </span>
                    <input
                      type="text"
                      placeholder="Designation *"
                      value={regForm.designation}
                      onChange={(e) =>
                        setRegForm({ ...regForm, designation: e.target.value })
                      }
                    />
                  </div>
                  {regErrors.designation && (
                    <p className="error-text">{regErrors.designation}</p>
                  )}

                  <div className="double-input">
                    <div>
                      <div className="input-group">
                        <span className="input-icon">
                          <MailOutlined />
                        </span>
                        <input
                          type="email"
                          placeholder="Email *"
                          value={regForm.email}
                          onChange={(e) =>
                            setRegForm({ ...regForm, email: e.target.value })
                          }
                        />
                      </div>
                      {regErrors.email && <p className="error-text">{regErrors.email}</p>}
                    </div>

                    <div>
                      <div className="input-group">
                        <span className="input-icon">
                          <PhoneOutlined />
                        </span>
                        <input
                          type="text"
                          placeholder="Phone *"
                          maxLength="10"
                          value={regForm.phone}
                          onChange={(e) =>
                            setRegForm({
                              ...regForm,
                              phone: e.target.value.replace(/\D/g, ""),
                            })
                          }
                        />
                      </div>
                      {regErrors.phone && <p className="error-text">{regErrors.phone}</p>}
                    </div>
                  </div>

                  <div className="input-group animate-in animate-in-d5">
                    <span className="input-icon">
                      <TeamOutlined />
                    </span>

                    <select
                      value={regForm.department}
                      onChange={(e) =>
                        setRegForm({
                          ...regForm,
                          department: e.target.value,
                        })
                      }
                      disabled={regLoading}
                    >
                      <option value="">
                        {regLoading ? "Loading departments..." : "Select Department *"}
                      </option>

                      {departments.map((dept) => (
                        <option key={dept.deptId} value={dept.deptId}>
                          {dept.deptName}
                        </option>
                      ))}
                    </select>
                  </div>
                  {regErrors.department && (
                    <p className="error-text">{regErrors.department}</p>
                  )}

                  <button type="submit" className="register-btn animate-in animate-in-d4" disabled={regLoading}>
                    {regLoading ? "Sending OTP..." : "Continue to Verification"}
                  </button>
                </form>
              )}

              {regStep === 2 && (
                <form onSubmit={handleStep2} className="register-form">
                  {otpError && <p className="error-text">{otpError}</p>}

                  <div className="otp-box animate-in animate-in-d4">
                    <div className="otp-box-header">
                      <MailOutlined />
                      <span>OTP sent to {regForm.email}</span>
                    </div>
                    <input
                      type="text"
                      placeholder="Enter 6-digit OTP"
                      maxLength="6"
                      className="otp-field"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                      autoFocus
                    />
                  </div>

                  <div className="double-input">
                    <div>
                      <div className="input-group">
                        <span className="input-icon">
                          <LockOutlined />
                        </span>
                        <input
                          type={showRegPassword ? "text" : "password"}
                          placeholder="Password *"
                          value={regForm.password}
                          onChange={(e) =>
                            setRegForm({ ...regForm, password: e.target.value })
                          }
                        />
                        <span
                          className="eye-icon"
                          onClick={() => setShowRegPassword(!showRegPassword)}
                        >
                          {showRegPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                        </span>
                      </div>
                      {regErrors.password && (
                        <p className="error-text">{regErrors.password}</p>
                      )}
                    </div>

                    <div>
                      <div className="input-group">
                        <span className="input-icon">
                          <LockOutlined />
                        </span>
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirm Password *"
                          value={regForm.confirmPassword}
                          onChange={(e) =>
                            setRegForm({ ...regForm, confirmPassword: e.target.value })
                          }
                        />
                        <span
                          className="eye-icon"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                        </span>
                      </div>
                      {regErrors.confirmPassword && (
                        <p className="error-text">{regErrors.confirmPassword}</p>
                      )}
                    </div>
                  </div>

                  <div className="reg-step-nav">
                    <button type="button" className="reg-back-btn" onClick={() => setRegStep(1)}>
                      <ArrowLeftOutlined /> Back
                    </button>
                    <button type="submit" className="register-btn animate-in animate-in-d4" disabled={regLoading}>
                      {regLoading ? "Creating Account..." : "Create Account"}
                    </button>
                  </div>
                </form>
              )}

              <p className="signin-link animate-in animate-in-d6">
                Already have an account?
                <span onClick={() => setMode("login")}> Sign in</span>
              </p>
            </>
          )}

          <div className="card-footer-text animate-in animate-in-d6">
            Copyright &copy; 2026 C-DAC Mumbai. All Rights Reserved.
          </div>
        </div>
      </div>

      <ForgotPasswordModal
        open={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
      />

      <RegistrationSuccessModal
        open={showRegSuccess}
        onClose={handleRegSuccessClose}
      />

      {toast.message && (
        <div className={`reg-toast reg-toast-${toast.type}`}>
          {toast.type === "error" ? (
            <span className="reg-toast-icon">
              <ExclamationCircleOutlined />
            </span>
          ) : (
            <span className="reg-toast-icon">
              <CheckCircleOutlined />
            </span>
          )}
          <span>{toast.message}</span>
        </div>
      )}
      </div>
    </div>
  );
}

export default Login;

