import React, { useState } from "react";
import { Card, Input, Button, Tag, Alert, Typography, Space, Divider, message } from "antd";
import {
  SafetyCertificateOutlined,
  SearchOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  ArrowLeftOutlined,
  KeyOutlined,
  LoginOutlined,
  BankOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { adminService } from "../../services/apiClient";
import "./CheckStatus.css";

const { Title, Text, Paragraph } = Typography;

export default function CheckStatus() {
  const navigate = useNavigate();
  const [reservationId, setReservationId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [searched, setSearched] = useState(false);

  const handleCheck = async (idToCheck) => {
    const targetId = (idToCheck || reservationId).trim();
    if (!targetId) {
      message.warning("Please enter a reservation ID");
      return;
    }

    setLoading(true);
    setSearched(true);
    try {
      const res = await adminService.getReservations();
      if (res?.success) {
        const found = (res.data || []).find(
          (r) =>
            r.reservation_id?.toLowerCase() === targetId.toLowerCase() ||
            r.contact_email?.toLowerCase() === targetId.toLowerCase()
        );
        setResult(found || null);
      }
    } catch {
      message.error("Failed to query reservation status");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPick = (id) => {
    setReservationId(id);
    handleCheck(id);
  };

  return (
    <div className="check-status-container">
      <div className="check-status-card">
        <div style={{ marginBottom: 20 }}>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate("/role-selection")}
            style={{ padding: 0, marginBottom: 12 }}
          >
            Back to Role Selection
          </Button>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: "rgba(79, 70, 229, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#4F46E5",
                fontSize: 24,
              }}
            >
              <BankOutlined />
            </div>
            <div>
              <Title level={3} style={{ margin: 0, fontWeight: 700 }}>
                Check Tenant Reservation Status
              </Title>
              <Text type="secondary" style={{ fontSize: 13 }}>
                Verify the approval status of your organization's SSI ledger onboarding request.
              </Text>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 13 }}>
            Reservation ID or Contact Email:
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            <Input
              size="large"
              placeholder="e.g. res-9081, res-8990 or contact@domain.com"
              prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
              value={reservationId}
              onChange={(e) => setReservationId(e.target.value)}
              onPressEnter={() => handleCheck()}
              style={{ borderRadius: 8 }}
            />
            <Button
              type="primary"
              size="large"
              loading={loading}
              onClick={() => handleCheck()}
              style={{ borderRadius: 8 }}
            >
              Verify
            </Button>
          </div>

          <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <Text type="secondary" style={{ fontSize: 12 }}>Sample test IDs:</Text>
            <Tag
              color="warning"
              style={{ cursor: "pointer" }}
              onClick={() => handleQuickPick("res-9081")}
            >
              res-9081 (Pending)
            </Tag>
            <Tag
              color="success"
              style={{ cursor: "pointer" }}
              onClick={() => handleQuickPick("res-8990")}
            >
              res-8990 (Approved)
            </Tag>
            <Tag
              color="error"
              style={{ cursor: "pointer" }}
              onClick={() => handleQuickPick("res-8812")}
            >
              res-8812 (Denied)
            </Tag>
          </div>
        </div>

        {searched && (
          <div>
            <Divider style={{ margin: "16px 0" }} />
            {result ? (
              <Card
                style={{
                  borderRadius: 12,
                  border: "1px solid var(--border-color, #e2e8f0)",
                  background: "var(--surface-1, #ffffff)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div>
                    <span className="mono-badge">{result.reservation_id}</span>
                    <h3 style={{ margin: "6px 0 0", fontSize: 16 }}>{result.tenant_name}</h3>
                  </div>
                  <div>
                    {result.state === "approved" && (
                      <Tag color="success" icon={<CheckCircleOutlined />} style={{ padding: "4px 10px", fontSize: 13 }}>
                        APPROVED & ACTIVE
                      </Tag>
                    )}
                    {result.state === "pending" && (
                      <Tag color="warning" icon={<ClockCircleOutlined />} style={{ padding: "4px 10px", fontSize: 13 }}>
                        PENDING INNKEEPER REVIEW
                      </Tag>
                    )}
                    {result.state === "denied" && (
                      <Tag color="error" icon={<CloseCircleOutlined />} style={{ padding: "4px 10px", fontSize: 13 }}>
                        RESERVATION DENIED
                      </Tag>
                    )}
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13, marginBottom: 16 }}>
                  <div>
                    <strong>Contact Person:</strong> {result.contact_name} ({result.contact_email})
                  </div>
                  <div>
                    <strong>Submitted On:</strong> {new Date(result.created_at).toLocaleString()}
                  </div>
                  {result.state_notes && (
                    <div style={{ padding: 10, background: "rgba(0,0,0,0.02)", borderRadius: 8 }}>
                      <strong>Governance Notes:</strong> {result.state_notes}
                    </div>
                  )}
                </div>

                {result.state === "approved" && (
                  <div style={{ background: "rgba(16, 185, 129, 0.05)", padding: 14, borderRadius: 8, border: "1px solid rgba(16, 185, 129, 0.2)", marginBottom: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#10B981", fontWeight: 600, marginBottom: 6 }}>
                      <KeyOutlined /> Organization Endorser & API Credentials Provisioned
                    </div>
                    <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 12 }}>
                      Your organization tenant has been granted public DID endorsement on the BCOVRIN Test Ledger. You can now log into your portal.
                    </Text>
                    <Button
                      type="primary"
                      icon={<LoginOutlined />}
                      onClick={() => navigate("/login/issuer")}
                      style={{ background: "#10B981", borderColor: "#10B981" }}
                    >
                      Proceed to Issuer Portal Login
                    </Button>
                  </div>
                )}

                {result.state === "pending" && (
                  <Alert
                    type="info"
                    showIcon
                    message="Review In Progress"
                    description="Your request is in the Innkeeper Governance queue. Approvals typically take 1-2 business hours. You will receive an email confirmation once provisioned."
                  />
                )}
              </Card>
            ) : (
              <Alert
                type="warning"
                showIcon
                message="Reservation Not Found"
                description={`No reservation record matching '${reservationId}' was found. Please verify the ID from your onboarding email or try a sample ID.`}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
