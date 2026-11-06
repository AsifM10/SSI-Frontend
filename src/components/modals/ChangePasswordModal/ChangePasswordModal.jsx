import { useState } from "react";
import {
  Modal,
  message,
} from "antd";
import {
  LockOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SafetyCertificateOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { authService } from "../../../services/apiClient";
import { useAuth } from "../../../context/AuthContext";
import "./ChangePasswordModal.css";

const ChangePasswordModal = ({ open, onClose }) => {
  const { logout } = useAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  // Live password complexity checks
  const pwd = newPassword || "";
  const checks = {
    length: pwd.length >= 8 && pwd.length <= 100,
    upper: /[A-Z]/.test(pwd),
    lower: /[a-z]/.test(pwd),
    digit: /\d/.test(pwd),
    special: /[@$!%*?&^#()[\]{}|/\\-_+=<>.,:;~`]/.test(pwd),
  };
  const isPwdValid = Object.values(checks).every(Boolean);
  const passwordsMatch = Boolean(newPassword && newPassword === confirmPassword);

  const resetForm = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setIsSubmitting(false);
    setErrorMsg("");
    setIsSuccess(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!currentPassword) {
      setErrorMsg("Please enter your current password.");
      return;
    }
    if (!isPwdValid) {
      setErrorMsg("New password does not meet complexity requirements.");
      return;
    }
    if (!passwordsMatch) {
      setErrorMsg("New password and confirm password do not match.");
      return;
    }
    if (currentPassword === newPassword) {
      setErrorMsg("New password cannot be the same as your current password.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const res = await authService.changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      if (res?.success || res?.status === 200 || res?.message?.toLowerCase().includes("success")) {
        setIsSuccess(true);
        message.success("Password updated successfully!");
      } else {
        setErrorMsg(res?.message || "Failed to update password. Please verify current password.");
      }
    } catch (err) {
      const serverMsg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to update password. Please verify current password.";
      setErrorMsg(serverMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignOutNow = async () => {
    handleClose();
    await logout();
  };

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      footer={null}
      destroyOnHidden
      centered
      width={480}
      className="change-password-modal"
      closeIcon={<CloseOutlined style={{ fontSize: 16 }} />}
    >
      <div className="change-pwd-container">
        {/* Modal Header */}
        <div className="change-pwd-header">
          <div className="change-pwd-icon-box">
            <LockOutlined className="change-pwd-icon" />
          </div>
          <div>
            <h3 className="change-pwd-title">Change Account Password</h3>
            <p className="change-pwd-subtitle">
              Update your account password securely without affecting your wallet, DID, or schemas.
            </p>
          </div>
        </div>

        {/* Notice Info */}
        {!isSuccess && (
          <div className="change-pwd-info-banner">
            <SafetyCertificateOutlined style={{ color: "#2563EB", fontSize: 16, marginTop: 2 }} />
            <span>
              Your Aries tenant wallet and registered schemas will remain intact. This only updates your login credentials.
            </span>
          </div>
        )}

        {/* Error banner */}
        {errorMsg && (
          <div className="change-pwd-error-banner animate-in">
            <CloseCircleOutlined style={{ color: "#DC2626", fontSize: 16, marginTop: 2 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Success View */}
        {isSuccess ? (
          <div className="change-pwd-success-card animate-in">
            <div className="success-icon-wrap">
              <CheckCircleOutlined style={{ fontSize: 42, color: "#16A34A" }} />
            </div>
            <h4>Password Updated Successfully!</h4>
            <p>
              Your account password has been changed. You can continue using your current session or sign out and sign in with your updated password.
            </p>

            <div className="success-actions">
              <button
                type="button"
                className="change-pwd-btn change-pwd-btn-secondary"
                onClick={handleClose}
              >
                Close & Stay Signed In
              </button>
              <button
                type="button"
                className="change-pwd-btn change-pwd-btn-primary"
                onClick={handleSignOutNow}
              >
                Sign Out & Test New Password →
              </button>
            </div>
          </div>
        ) : (
          /* Form View */
          <form onSubmit={handleSubmit} className="change-pwd-form">
            {/* Current Password */}
            <div className="change-pwd-form-group">
              <label htmlFor="cp-current-password">
                Current Password <span className="req">*</span>
              </label>
              <div className="change-pwd-input-wrap">
                <LockOutlined className="input-icon" />
                <input
                  id="cp-current-password"
                  type={showCurrentPassword ? "text" : "password"}
                  required
                  autoFocus
                  disabled={isSubmitting}
                  value={currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value);
                    setErrorMsg("");
                  }}
                  placeholder="Enter current password..."
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="eye-toggle-btn"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  tabIndex="-1"
                >
                  {showCurrentPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="change-pwd-form-group">
              <label htmlFor="cp-new-password">
                New Password <span className="req">*</span>
              </label>
              <div className="change-pwd-input-wrap">
                <LockOutlined className="input-icon" />
                <input
                  id="cp-new-password"
                  type={showNewPassword ? "text" : "password"}
                  required
                  disabled={isSubmitting}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setErrorMsg("");
                  }}
                  placeholder="Enter new strong password..."
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="eye-toggle-btn"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  tabIndex="-1"
                >
                  {showNewPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                </button>
              </div>

              {/* Password Complexity Checklist */}
              {newPassword && (
                <div className="pwd-checklist-grid animate-in">
                  <span className={`checklist-item ${checks.length ? "valid" : ""}`}>
                    {checks.length ? <CheckCircleOutlined /> : <CloseCircleOutlined />} 8-100 chars
                  </span>
                  <span className={`checklist-item ${checks.upper ? "valid" : ""}`}>
                    {checks.upper ? <CheckCircleOutlined /> : <CloseCircleOutlined />} 1 Uppercase (A-Z)
                  </span>
                  <span className={`checklist-item ${checks.lower ? "valid" : ""}`}>
                    {checks.lower ? <CheckCircleOutlined /> : <CloseCircleOutlined />} 1 Lowercase (a-z)
                  </span>
                  <span className={`checklist-item ${checks.digit ? "valid" : ""}`}>
                    {checks.digit ? <CheckCircleOutlined /> : <CloseCircleOutlined />} 1 Number (0-9)
                  </span>
                  <span className={`checklist-item ${checks.special ? "valid" : ""}`}>
                    {checks.special ? <CheckCircleOutlined /> : <CloseCircleOutlined />} 1 Special Char
                  </span>
                </div>
              )}
            </div>

            {/* Confirm New Password */}
            <div className="change-pwd-form-group">
              <label htmlFor="cp-confirm-password">
                Confirm New Password <span className="req">*</span>
              </label>
              <div className="change-pwd-input-wrap">
                <LockOutlined className="input-icon" />
                <input
                  id="cp-confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  disabled={isSubmitting}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setErrorMsg("");
                  }}
                  placeholder="Re-enter new password..."
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="eye-toggle-btn"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex="-1"
                >
                  {showConfirmPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                </button>
              </div>

              {confirmPassword && (
                <div className={`pwd-match-pill ${passwordsMatch ? "valid" : "invalid"}`}>
                  {passwordsMatch ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                  <span>{passwordsMatch ? "Passwords match" : "Passwords do not match"}</span>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="change-pwd-footer">
              <button
                type="button"
                className="change-pwd-btn change-pwd-btn-secondary"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="change-pwd-btn change-pwd-btn-primary"
                disabled={isSubmitting || !currentPassword || !isPwdValid || !passwordsMatch}
              >
                {isSubmitting ? "Updating Password..." : "Update Password"}
              </button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};

export default ChangePasswordModal;
