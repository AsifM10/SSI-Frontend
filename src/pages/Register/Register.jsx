import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/Auth.css";

import {
  UserOutlined,
  SafetyCertificateOutlined,
  MailOutlined,
  PhoneOutlined,
  TeamOutlined,
  IdcardOutlined,
} from "@ant-design/icons";
import "../../styles/Auth.css";
import { sendOtp } from "../../services/api";

function Register() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1 = details, 2 = otp verification
  const [form, setForm] = useState({
    fullName: "",
    designation: "",
    email: "",
    phone: "",
    department: "",
  });

  const [errors, setErrors] = useState({});
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const validateStep1 = () => {
    let newErrors = {};

    if (!form.fullName.trim()) {
      newErrors.fullName = "Full Name is required";
    }

    if (!form.designation.trim()) {
      newErrors.designation = "Designation is required";
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@cdac\.in$/;

    if (!form.email) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(form.email)) {
      newErrors.email = "Email must be like name@cdac.in";
    }

    const phoneRegex = /^[6-9]\d{9}$/;

    if (!form.phone) {
      newErrors.phone = "Phone number is required";
    } else if (!phoneRegex.test(form.phone)) {
      newErrors.phone = "Enter valid 10-digit mobile number";
    }

    if (!form.department) {
      newErrors.department = "Please select department";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleStep1Submit = async (e) => {
    e.preventDefault();

    if (!validateStep1()) {
      return;
    }

    try {
      // Send OTP for verification
      const result = await sendOtp({ email: form.email, purpose: "REGISTRATION" });
      if (result.success) {
        setStep(2);
      } else {
        setOtpError(result.message || "Failed to send OTP. Please try again.");
      }
    } catch (error) {
      console.error("OTP send error:", error);
      setOtpError("Unable to send OTP. Please try again.");
    }
  };

  const verifyOtp = async () => {
    if (!otp.trim()) {
      setOtpError("Please enter the OTP");
      return;
    }
    try {
      // In a real app, verify OTP with server
      // For now, proceed as if OTP is verified
      setShowSuccess(true);
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch {
      setOtpError("Invalid or expired OTP. Please try again.");
    }
  };

  return (
    <div className="auth-container">
      <div className="left-section">
        <div className="dashboard-image">
          <img src="/logo.jpeg" alt="dashboard" />
        </div>

        <div className="welcome-text">
          <span>Welcome to</span>

          <h1>Monitoring Dashboard</h1>

          <div className="line"></div>

          <h4>Monitor. Analyze. Optimize.</h4>

          <p>
            Real-time monitoring and intelligent insights to keep your systems
            running at their best.
          </p>

          <div className="footer-text">
            <SafetyCertificateOutlined /> Secure. Reliable. Always On.
          </div>
        </div>
      </div>

      <div className="right-section">
        <div className="register-card">
          {step === 1 && (
            <div className="stepper">
              <div className="stepper-header">
                <span className="stepper-step active">Details</span>
                <span className="stepper-line" />
                <span className="stepper-step">OTP Verification</span>
              </div>
              <form onSubmit={handleStep1Submit} className="register-form">
                <div className="input-group">
                  <span className="input-icon">
                    <UserOutlined />
                  </span>

                  <input
                    type="text"
                    placeholder="Full Name *"
                    value={form.fullName}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        fullName: e.target.value,
                      })
                    }
                  />
                </div>

                {errors.fullName && <p className="error-text">{errors.fullName}</p>}

                <div className="input-group">
                  <span className="input-icon">
                    <IdcardOutlined />
                  </span>

                  <input
                    type="text"
                    placeholder="Designation *"
                    value={form.designation}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        designation: e.target.value,
                      })
                    }
                  />
                </div>

                {errors.designation && <p className="error-text">{errors.designation}</p>}

                <div className="double-input">
                  <div>
                    <div className="input-group">
                      <span className="input-icon">
                        <MailOutlined />
                      </span>

                      <input
                        type="email"
                        placeholder="Email *"
                        value={form.email}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            email: e.target.value,
                          })
                        }
                      />
                    </div>

                    {errors.email && <p className="error-text">{errors.email}</p>}
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
                        value={form.phone}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            phone: e.target.value.replace(/\D/g, ""),
                          })
                        }
                      />
                    </div>
                    {errors.phone && <p className="error-text">{errors.phone}</p>}
                  </div>
                </div>

                <div className="input-group">
                  <span className="input-icon">
                    <TeamOutlined />
                  </span>

                  <select
                    value={form.department}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        department: e.target.value,
                      })
                    }
                  >
                    <option value="">Select Department *</option>

                    <option>SENG</option>
                    <option>ITSS</option>
                    <option>AI</option>
                    <option>FOSS</option>
                  </select>
                </div>

                {errors.department && <p className="error-text">{errors.department}</p>}

                <button type="submit" className="register-btn">
                  Continue to OTP Verification
                </button>
              </form>
            </div>
          )}

          {step === 2 && (
            <div className="otp-verification">
              <h3>Verify OTP</h3>
              <p>We've sent an OTP to {form.email}. Enter the 6-digit code you received.</p>
              <div className="input-wrapper">
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

          {step === 2 && otpError && <p className="error-text">{otpError}</p>}

          {showSuccess && (
            <div className="otp-success">
              <SafetyCertificateOutlined />
              <h3>Registration Successful!</h3>
              <p>Your account has been verified and created successfully.</p>
              <button onClick={() => navigate("/login")}>Sign In</button>
            </div>
          )}

          <div className="security-text">
            <SafetyCertificateOutlined /> Your information is encrypted and
            stored securely
          </div>

          {showSuccess || step === 1 ? null : (
            <p className="signin-link">
              Already have an account?
              <span onClick={() => navigate("/login")}> Sign in</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Register;