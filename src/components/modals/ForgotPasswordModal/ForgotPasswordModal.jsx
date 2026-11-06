import { useState } from "react";
import {
  CloseOutlined,
  MailOutlined,
  LockOutlined,
  SafetyOutlined,
  ArrowLeftOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
} from "@ant-design/icons";
import "./ForgotPasswordModal.css";
import { authService } from "../../../services/apiClient";
import { useNavigate } from "react-router-dom";

const STEP_EMAIL = 1;
const STEP_OTP = 2;
const STEP_RESET = 3;

const ForgotPasswordModal = ({ open, onClose }) => {
  const [step, setStep] = useState(STEP_EMAIL);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  if (!open) return null;

  const resetState = () => {
    setStep(STEP_EMAIL);
    setEmail("");
    setOtp("");
    setPassword("");
    setConfirmPassword("");
    setError("");
    setSuccess(false);
    setLoading(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleSendOtp = async () => {
    if (!email.trim()) {
      setError("Please enter your email");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const result = await authService.forgotPassword({ email: email.trim() });
      if (result.success || result.status === 200 || result.data) {
        setStep(STEP_OTP);
      } else {
        setError(result.message || "Failed to send reset code");
      }
    } catch (error) {
      setError(error?.response?.data?.message || error.message || "Unable to send reset code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!otp.trim()) {
      setError("Please enter the reset code");
      return;
    }
    setError("");
    setStep(STEP_RESET);
  };

  const handleResetPassword = async () => {
    if (!password) {
      setError("Please enter a new password");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const payload = {
        email: email.trim(),
        code: otp.trim(),
        newPassword: password,
      };
      const response = await authService.resetPassword(payload);
      if (response.success || response.status === 200 || response.data) {
        setError("");
        setSuccess(true);
      } else {
        setError(response.message || "Failed to reset password!");
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to reset password!");
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="fp-steps">
      <div className={`fp-step ${step >= STEP_EMAIL ? "active" : ""} ${step > STEP_EMAIL ? "done" : ""}`}>
        <span className="fp-step-num">{step > STEP_EMAIL ? "✓" : "1"}</span>
        <span className="fp-step-label">Email</span>
      </div>
      <div className="fp-step-line" />
      <div className={`fp-step ${step >= STEP_OTP ? "active" : ""}`}>
        <span className="fp-step-num">{step > STEP_OTP ? "✓" : "2"}</span>
        <span className="fp-step-label">OTP</span>
      </div>
      <div className="fp-step-line" />
      <div className={`fp-step ${step >= STEP_RESET ? "active" : ""}`}>
        <span className="fp-step-num">{step > STEP_RESET ? "✓" : "3"}</span>
        <span className="fp-step-label">Reset</span>
      </div>
    </div>
  );

  return (
    <div className="modal-overlay">
      <div className="fp-modal">
        <div className="modal-header">
          <h2>
            {step === STEP_EMAIL && "Forgot Password"}
            {step === STEP_OTP && "Enter OTP"}
            {step === STEP_RESET && "Reset Password"}
          </h2>
          <button className="close-btn" onClick={handleClose}>
            <CloseOutlined />
          </button>
        </div>

        {renderStepIndicator()}

        {success ? (
          <div className="fp-success">
            <SafetyOutlined />
            <h3>Password Reset Successful!</h3>
            <p>You can now sign in with your new password.</p>
            <button className="fp-btn" onClick={() => { handleClose(); navigate("/"); }}>
              Back to Login
            </button>
          </div>
        ) : (
          <>
            {error && <div className="fp-error">{error}</div>}

            {step === STEP_EMAIL && (
              <div className="fp-body">
                <p className="fp-subtitle">
                  Enter your registered email address to verify your identity.
                </p>
                <div className="input-wrapper">
                  <MailOutlined className="input-icon" />
                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                    autoFocus
                  />
                </div>
                <button className="fp-btn" onClick={handleSendOtp}>
                  Verify
                </button>
              </div>
            )}

            {step === STEP_OTP && (
              <div className="fp-body">
                <p className="fp-subtitle">
                  Enter the OTP sent to your email to verify your identity.
                </p>
                <div className="input-wrapper">
                  <LockOutlined className="input-icon" />
                  <input
                    type="number"
                    placeholder="OTP"
                    maxLength="6"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && verifyOtp()}
                    autoFocus
                  />
                </div>
                <button className="fp-btn" onClick={verifyOtp}>
                  Verify
                </button>
              </div>
            )}

            {step === STEP_RESET && (
              <div className="fp-body">
                <p className="fp-subtitle">
                  Choose a strong password you haven't used before.
                </p>
                <div className="input-wrapper">
                  <LockOutlined className="input-icon" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="New Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoFocus
                  />
                  <span
                    className="fp-eye"
                    onClick={() => setShowPassword((v) => !v)}
                  >
                    {showPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                  </span>
                </div>
                <div className="input-wrapper">
                  <LockOutlined className="input-icon" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <span
                    className="fp-eye"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                  >
                    {showConfirmPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                  </span>
                </div>
                <button className="fp-btn" onClick={handleResetPassword}>
                  Reset Password
                </button>
              </div>
            )}

            <div className="fp-back">
              <ArrowLeftOutlined />
              <span onClick={handleClose}>Back to Login</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordModal;