import React, { useState } from "react";
import { Modal, Descriptions, Tag, Button, Space, Typography, Table, Switch, Card } from "antd";
import { SafetyCertificateOutlined, CopyOutlined, CloseCircleOutlined, CheckCircleOutlined } from "@ant-design/icons";

const { Text } = Typography;

export default function CredentialDetailsModal({ visible, onClose, credential }) {
  const [showJson, setShowJson] = useState(false);

  if (!credential) return null;

  const rawJson = JSON.stringify(credential, null, 2);
  const isRevoked = credential.revocationStatus === "revoked" || credential.status === "revoked";

  const claims = credential.attributes || credential.claims || {};
  const claimsArray = Object.entries(claims).map(([key, value]) => ({
    key,
    attribute: key,
    value: String(value),
  }));

  const columns = [
    {
      title: "Claim / Attribute",
      dataIndex: "attribute",
      key: "attribute",
      render: (attr) => <Text strong style={{ textTransform: "capitalize" }}>{attr}</Text>,
    },
    {
      title: "Value",
      dataIndex: "value",
      key: "value",
      render: (val) => <Text code style={{ fontSize: 13 }}>{val}</Text>,
    },
  ];

  return (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <SafetyCertificateOutlined style={{ color: isRevoked ? "#ef4444" : "#10B981" }} />
          <span>Verifiable Credential Claims & Inspection</span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={720}
      footer={[
        <Button key="close" onClick={onClose} style={{ borderRadius: 8 }}>
          Close
        </Button>,
      ]}
      destroyOnClose
    >
      <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <Text strong style={{ fontSize: 16, display: "block" }}>
            {credential.schema || credential.type || "Verifiable Credential"}
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Issued by {credential.issuer || credential.issuerDid || "Trusted Authority"}
          </Text>
        </div>
        <Space>
          <Tag color={isRevoked ? "error" : "success"} icon={isRevoked ? <CloseCircleOutlined /> : <CheckCircleOutlined />}>
            {isRevoked ? "Revoked" : "Cryptographically Valid"}
          </Tag>
          <Switch
            checkedChildren="JSON"
            unCheckedChildren="Form"
            checked={showJson}
            onChange={setShowJson}
          />
        </Space>
      </div>

      {showJson ? (
        <Card
          size="small"
          style={{ background: "#0f172a", borderRadius: 8, border: "1px solid #1e293b" }}
          extra={
            <Button
              size="small"
              type="text"
              icon={<CopyOutlined />}
              onClick={() => navigator.clipboard.writeText(rawJson)}
              style={{ color: "#94a3b8" }}
            >
              Copy JSON
            </Button>
          }
        >
          <pre style={{ color: "#38bdf8", fontSize: 12, margin: 0, maxHeight: 380, overflow: "auto" }}>
            {rawJson}
          </pre>
        </Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Descriptions bordered column={1} size="small" style={{ borderRadius: 8 }}>
            <Descriptions.Item label="Credential ID">
              <Text code copyable style={{ fontSize: 12 }}>
                {credential.id || credential.credential_id || "N/A"}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Credential Definition ID">
              <Text code copyable style={{ fontSize: 12 }}>
                {credential.credentialDefinitionId || credential.cred_def_id || "N/A"}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Issuance Date">
              <Text type="secondary">
                {credential.issuedAt || credential.created_at ? new Date(credential.issuedAt || credential.created_at).toLocaleString() : "N/A"}
              </Text>
            </Descriptions.Item>
            {credential.revocationReason && (
              <Descriptions.Item label="Revocation Reason">
                <Text type="danger">{credential.revocationReason}</Text>
              </Descriptions.Item>
            )}
          </Descriptions>

          <div>
            <Text strong style={{ fontSize: 14, marginBottom: 8, display: "block" }}>
              Revealed Claims:
            </Text>
            <Table
              dataSource={claimsArray}
              columns={columns}
              pagination={false}
              size="small"
              bordered
              style={{ borderRadius: 8, overflow: "hidden" }}
            />
          </div>
        </div>
      )}
    </Modal>
  );
}
