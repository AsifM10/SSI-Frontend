import React, { useState, useEffect } from "react";
import { Modal, Tabs, Table, Tag, Input, Button, message, Space, Card, Typography, Tooltip } from "antd";
import {
  LinkOutlined,
  CopyOutlined,
  QrcodeOutlined,
  PlusOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  SendOutlined,
  UsergroupAddOutlined,
} from "@ant-design/icons";

const { Text, Paragraph } = Typography;

export default function ConnectionModal({
  visible,
  onClose,
  connections = [],
  onCreateInvitation,
  onReceiveInvitation,
  role = "agent",
}) {
  const [activeTab, setActiveTab] = useState("active");
  const [invitationAlias, setInvitationAlias] = useState("");
  const [generatedInvitation, setGeneratedInvitation] = useState(null);
  const [receiveInput, setReceiveInput] = useState("");
  const [receiveAlias, setReceiveAlias] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible) {
      setGeneratedInvitation(null);
      setReceiveInput("");
      setReceiveAlias("");
    }
  }, [visible]);

  const activeConnections = connections.filter((c) => c.state === "active" || c.rfc23_state === "completed");
  const pendingConnections = connections.filter((c) => c.state !== "active" && c.rfc23_state !== "completed");

  const handleCreate = async () => {
    if (!onCreateInvitation) return;
    setLoading(true);
    try {
      const alias = invitationAlias.trim() || `${role.toUpperCase()} Peer Invitation`;
      const res = await onCreateInvitation(alias);
      if (res?.success && res.data) {
        setGeneratedInvitation(res.data);
        message.success("Invitation generated successfully!");
      } else {
        message.error("Failed to create invitation");
      }
    } catch (err) {
      message.error(err.message || "Failed to create invitation");
    } finally {
      setLoading(false);
    }
  };

  const handleReceive = async () => {
    if (!onReceiveInvitation) return;
    if (!receiveInput.trim()) {
      message.warning("Please paste an invitation URL or JSON payload");
      return;
    }
    setLoading(true);
    try {
      const res = await onReceiveInvitation({
        invitation_url: receiveInput.trim(),
        alias: receiveAlias.trim() || "Connected Peer",
      });
      if (res?.success) {
        message.success("Invitation accepted! Connection established.");
        setReceiveInput("");
        setReceiveAlias("");
        setActiveTab("active");
      } else {
        message.error("Failed to accept invitation");
      }
    } catch (err) {
      message.error(err.message || "Failed to accept invitation");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    message.success("Copied to clipboard!");
  };

  const columnsActive = [
    {
      title: "Peer Label",
      dataIndex: "their_label",
      key: "their_label",
      render: (text) => <Text strong style={{ color: "var(--color-primary-text, #0f172a)" }}>{text || "Anonymous Peer"}</Text>,
    },
    {
      title: "Their DID",
      dataIndex: "their_did",
      key: "their_did",
      render: (did) => (
        <Tooltip title={did}>
          <Text code style={{ fontSize: "12px" }}>
            {did ? `${did.slice(0, 16)}...${did.slice(-4)}` : "Pending DID"}
          </Text>
        </Tooltip>
      ),
    },
    {
      title: "Status",
      dataIndex: "state",
      key: "state",
      render: () => (
        <Tag color="success" icon={<CheckCircleOutlined />}>
          Active
        </Tag>
      ),
    },
    {
      title: "Established",
      dataIndex: "created_at",
      key: "created_at",
      render: (date) => (
        <Text type="secondary" style={{ fontSize: "12px" }}>
          {date ? new Date(date).toLocaleDateString() : "Recent"}
        </Text>
      ),
    },
  ];

  const columnsPending = [
    {
      title: "Label / Alias",
      dataIndex: "their_label",
      key: "their_label",
      render: (text) => <Text strong>{text || "Pending Peer"}</Text>,
    },
    {
      title: "Connection ID",
      dataIndex: "connection_id",
      key: "connection_id",
      render: (id) => <Text code>{id}</Text>,
    },
    {
      title: "Status",
      dataIndex: "state",
      key: "state",
      render: (state) => (
        <Tag color="warning" icon={<ClockCircleOutlined />}>
          {state || "Invitation Sent"}
        </Tag>
      ),
    },
  ];

  const tabItems = [
    {
      key: "active",
      label: (
        <span>
          <UsergroupAddOutlined /> Active Connections ({activeConnections.length})
        </span>
      ),
      children: (
        <div style={{ marginTop: 12 }}>
          <Table
            dataSource={activeConnections}
            columns={columnsActive}
            rowKey={(r) => r.connection_id || Math.random()}
            pagination={{ pageSize: 5 }}
            size="small"
            locale={{ emptyText: "No active connections yet. Create or accept an invitation to connect." }}
          />
        </div>
      ),
    },
    {
      key: "pending",
      label: (
        <span>
          <ClockCircleOutlined /> Pending Invitations ({pendingConnections.length})
        </span>
      ),
      children: (
        <div style={{ marginTop: 12 }}>
          <Table
            dataSource={pendingConnections}
            columns={columnsPending}
            rowKey={(r) => r.connection_id || Math.random()}
            pagination={{ pageSize: 5 }}
            size="small"
            locale={{ emptyText: "No pending invitations." }}
          />
        </div>
      ),
    },
    {
      key: "create",
      label: (
        <span>
          <PlusOutlined /> Create Invitation
        </span>
      ),
      children: (
        <div style={{ marginTop: 12, padding: "8px 0" }}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 6, fontWeight: 500, fontSize: "13px" }}>
              Connection Alias / Label:
            </label>
            <Input
              placeholder="e.g. Employee Verification Portal, Alice Wallet"
              value={invitationAlias}
              onChange={(e) => setInvitationAlias(e.target.value)}
              style={{ borderRadius: 8 }}
            />
          </div>

          <Button
            type="primary"
            icon={<SendOutlined />}
            loading={loading}
            onClick={handleCreate}
            style={{ borderRadius: 8, marginBottom: 20 }}
          >
            Generate Peer Invitation
          </Button>

          {generatedInvitation && (
            <Card
              style={{
                background: "rgba(37, 99, 235, 0.04)",
                border: "1px solid rgba(37, 99, 235, 0.2)",
                borderRadius: 12,
              }}
            >
              <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
                <div
                  style={{
                    width: 130,
                    height: 130,
                    background: "#ffffff",
                    borderRadius: 8,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                    padding: 8,
                  }}
                >
                  <QrcodeOutlined style={{ fontSize: 72, color: "#2563EB" }} />
                  <Text type="secondary" style={{ fontSize: 10, marginTop: 4 }}>Scan with Wallet</Text>
                </div>

                <div style={{ flex: 1 }}>
                  <Text strong style={{ fontSize: 14, color: "#1e293b", display: "block", marginBottom: 4 }}>
                    Invitation Ready for Peer: {generatedInvitation.their_label}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 12 }}>
                    Share this URL or have the peer scan the QR code to establish an encrypted DIDComm channel.
                  </Text>

                  <div style={{ display: "flex", gap: 8 }}>
                    <Input
                      readOnly
                      value={generatedInvitation.invitation_url || `https://traction.example.com/invitation?c_i=${generatedInvitation.connection_id}`}
                      style={{ fontSize: 12, fontFamily: "monospace" }}
                    />
                    <Button
                      icon={<CopyOutlined />}
                      onClick={() =>
                        copyToClipboard(
                          generatedInvitation.invitation_url ||
                            `https://traction.example.com/invitation?c_i=${generatedInvitation.connection_id}`
                        )
                      }
                    >
                      Copy
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      ),
    },
    {
      key: "receive",
      label: (
        <span>
          <LinkOutlined /> Receive / Accept Invitation
        </span>
      ),
      children: (
        <div style={{ marginTop: 12, padding: "8px 0" }}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 6, fontWeight: 500, fontSize: "13px" }}>
              Peer Alias (Optional):
            </label>
            <Input
              placeholder="e.g. Acme Corporation, Regional Verifier"
              value={receiveAlias}
              onChange={(e) => setReceiveAlias(e.target.value)}
              style={{ borderRadius: 8 }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 6, fontWeight: 500, fontSize: "13px" }}>
              Invitation URL or JSON Payload:
            </label>
            <Input.TextArea
              rows={4}
              placeholder="Paste the invitation URL or JSON object here (e.g., https://traction.../?c_i=...)"
              value={receiveInput}
              onChange={(e) => setReceiveInput(e.target.value)}
              style={{ borderRadius: 8, fontFamily: "monospace", fontSize: 12 }}
            />
          </div>

          <Button
            type="primary"
            icon={<LinkOutlined />}
            loading={loading}
            onClick={handleReceive}
            style={{ borderRadius: 8 }}
          >
            Accept & Establish Connection
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <LinkOutlined style={{ color: "var(--primary-color, #1B365D)" }} />
          <span>Connection Manager & Peer Invitations</span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose} style={{ borderRadius: 8 }}>
          Close
        </Button>,
      ]}
      width={780}
      destroyOnClose
    >
      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
    </Modal>
  );
}
