import React, { useState, useEffect } from "react";
import { Modal, Input, Button, Alert, message } from "antd";
import {
  MailOutlined,
  SafetyCertificateOutlined,
  CheckCircleFilled,
  ReloadOutlined,
} from "@ant-design/icons";
import { authService } from "../../../services/apiClient";
import "./EmailOtpModal.css";

export default function EmailOtpModal({
  open,
  onClose,
  email = "",
  userId = "",
  onVerified,
  title = "Verify Email OTP",
}) {
  const [otp, setOtp] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setOtp("");
      setErrorMsg("");
      setIsSuccess(false);
      setResendCooldown(0);
    }
  }, [open, email]);

  // Countdown timer for resend button
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const cleanEmail = (email || "").trim();

  const handleVerify = async () => {
    const cleanOtp = otp.trim();
    if (!cleanOtp) {
      setErrorMsg("Please enter the 6-digit OTP code");
      return;
    }

    if (!cleanEmail) {
      setErrorMsg("Missing recipient email address");
      return;
    }

    setErrorMsg("");
    setIsVerifying(true);

    try {
      const payload = {
        email: cleanEmail,
        otp: cleanOtp,
      };
      if (userId) payload.userId = userId;

      const res = await authService.verifyEmail(payload);

      if (res?.success || res?.status === 200 || res?.data) {
        setIsSuccess(true);
        message.success("Email verified successfully!");
        if (onVerified) {
          onVerified({ email: cleanEmail, otp: cleanOtp, res });
        }
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setErrorMsg(res?.message || "Invalid or expired OTP.");
      }
    } catch (err) {
      const serverMsg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to verify OTP";
      setErrorMsg(serverMsg);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || isResending) return;
    if (!cleanEmail) {
      setErrorMsg("Missing recipient email address");
      return;
    }

    setIsResending(true);
    setErrorMsg("");

    try {
      const res = await authService.resendOtp({ email: cleanEmail });
      if (res?.success || res?.status === 200 || res?.data) {
        message.success("New OTP sent to your email!");
        setResendCooldown(30);
      } else {
        setErrorMsg(res?.message || "Failed to resend OTP");
      }
    } catch (err) {
      const serverMsg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to resend OTP. Please try again.";
      setErrorMsg(serverMsg);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={460}
      centered
      destroyOnHidden
      className="email-otp-modal"
    >
      <div className="email-otp-header">
        <div className="email-otp-icon-wrap">
          <MailOutlined />
        </div>
        <div>
          <h3 className="email-otp-title">{title || "Verify Email OTP"}</h3>
        </div>
      </div>

      {errorMsg && (
        <Alert
          message={errorMsg}
          type="error"
          showIcon
          style={{ margin: "14px 0", borderRadius: 8 }}
          closable
          onClose={() => setErrorMsg("")}
        />
      )}

      {isSuccess && (
        <Alert
          message="Email Identity Verified!"
          description="Verification was registered successfully."
          type="success"
          showIcon
          icon={<CheckCircleFilled />}
          style={{ margin: "14px 0", borderRadius: 8 }}
        />
      )}

      {/* OTP Input Field */}
      <div className="otp-input-container">
        <label style={{ fontSize: 13, fontWeight: 600, color: "#1e293b", marginBottom: 12 }}>
          Enter 6-Digit OTP:
        </label>
        <Input
          className="otp-custom-input"
          placeholder="••••••"
          maxLength={6}
          value={otp}
          autoFocus
          disabled={isSuccess || isVerifying}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, "").slice(0, 6);
            setOtp(val);
            if (errorMsg) setErrorMsg("");
          }}
          onPressEnter={handleVerify}
        />
      </div>

      {/* Actions */}
      <div style={{ marginTop: 20 }}>
        <Button
          type="primary"
          block
          size="large"
          loading={isVerifying}
          disabled={isSuccess || otp.trim().length === 0}
          icon={<SafetyCertificateOutlined />}
          onClick={handleVerify}
          style={{
            background: "#2563EB",
            borderColor: "#2563EB",
            fontWeight: 600,
            borderRadius: 8,
            height: 44,
          }}
        >
          {isSuccess ? "Verified" : "Verify Email OTP"}
        </Button>
      </div>

      {/* Resend and Footer actions */}
      <div className="otp-actions-row">
        <div>
          {resendCooldown > 0 ? (
            <span className="resend-countdown">
              Resend OTP in <strong>{resendCooldown}s</strong>
            </span>
          ) : (
            <Button
              type="link"
              className="resend-btn"
              icon={<ReloadOutlined />}
              loading={isResending}
              onClick={handleResend}
            >
              Resend OTP
            </Button>
          )}
        </div>

        <Button type="text" size="small" onClick={onClose} style={{ color: "#64748b" }}>
          Close
        </Button>
      </div>
    </Modal>
  );
}
