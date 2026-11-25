import React, { useState } from "react";
import { Modal, Descriptions, Tag, Button, Space, Typography, Table, Switch, Card, Alert } from "antd";
import {
  SafetyCertificateOutlined,
  CopyOutlined,
  CloseCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";

const { Text } = Typography;

export default function CredentialDetailsModal({ visible, onClose, credential }) {
  const [showJson, setShowJson] = useState(false);

  if (!credential) return null;

  const rawJson = JSON.stringify(credential, null, 2);

  const rawState = String(
    credential.raw?.state ||
    credential.state ||
    credential.raw?.display_status ||
    credential.displayStatus ||
    credential.status ||
    ""
  ).toLowerCase().replace(/_/g, "-");

  const errorMsg =
    credential.errorMsg ||
    credential.error_msg ||
    credential.raw?.error_msg ||
    credential.raw?.cred_ex_record?.error_msg;

  const isRevoked =
    credential.revocationStatus === "revoked" ||
    credential.status === "revoked" ||
    rawState === "deleted" ||
    rawState === "revoked";

  const isRejected =
    credential.status === "rejected" ||
    credential.status === "abandoned" ||
    rawState === "abandoned" ||
    rawState === "rejected" ||
    rawState === "declined" ||
    rawState.includes("abandon") ||
    rawState.includes("reject") ||
    Boolean(errorMsg);

  const isAccepted =
    credential.status === "accepted" ||
    credential.status === "issued" ||
    [
      "credential-acked",
      "credential-issued",
      "credential-received",
      "done",
      "issued",
      "stored",
      "accepted",
    ].includes(rawState);

  const claims =
    credential.attributes ||
    credential.attrs ||
    credential.claims ||
    credential.raw_attributes ||
    credential.raw?.cred_preview?.attributes ||
    credential.raw?.cred_offer?.credential_preview?.attributes ||
    credential.raw?.cred_proposal?.credential_preview?.attributes ||
    credential.raw?.by_format?.cred_offer?.anoncreds?.attributes ||
    credential.raw?.by_format?.cred_issue?.anoncreds?.attributes ||
    credential.raw?.attributes ||
    credential.raw?.attrs ||
    {};
  let claimsArray = [];
  if (Array.isArray(claims)) {
    claimsArray = claims.map((item, idx) => {
      if (item && typeof item === "object") {
        const key = item.name || item.name_tag || item.key || `attr_${idx}`;
        const val = item.value !== undefined ? String(item.value) : "";
        return { key, attribute: key, value: val };
      }
      return { key: String(idx), attribute: String(idx), value: String(item) };
    });
  } else if (claims && typeof claims === "object") {
    claimsArray = Object.entries(claims).map(([key, value]) => ({
      key,
      attribute: key,
      value: String(value ?? ""),
    }));
  }

  const credDefId =
    (credential.credentialDefinitionId && credential.credentialDefinitionId !== "N/A" ? credential.credentialDefinitionId : null) ||
    credential.cred_def_id ||
    credential.credDefId ||
    credential.raw?.by_format?.cred_offer?.anoncreds?.cred_def_id ||
    credential.raw?.by_format?.cred_offer?.indy?.cred_def_id ||
    credential.raw?.by_format?.cred_issue?.anoncreds?.cred_def_id ||
    credential.raw?.by_format?.cred_issue?.indy?.cred_def_id ||
    credential.raw?.cred_def_id ||
    credential.raw?.credential_definition_id ||
    "N/A";

  const issueDateRaw =
    credential.issuedAt ||
    credential.created_at ||
    credential.issuanceDate ||
    credential.issue_date ||
    credential.raw?.created_at ||
    credential.raw?.updated_at;

  const displayDate = issueDateRaw ? new Date(issueDateRaw).toLocaleString() : "N/A";

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
          <SafetyCertificateOutlined
            style={{
              color: isRevoked || isRejected ? "#ef4444" : isAccepted ? "#10B981" : "#f59e0b",
            }}
          />
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
      destroyOnHidden
    >
      <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <Text strong style={{ fontSize: 16, display: "block" }}>
            {credential.credentialDefinition || credential.schema || credential.type || credential.schemaName || "Verifiable Credential"}
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Issued by {credential.issuer || credential.issuerName || credential.issuerDid || "Trusted Authority"}
          </Text>
        </div>
        <Space>
          {isRevoked ? (
            <Tag color="error" icon={<CloseCircleOutlined />}>
              Revoked
            </Tag>
          ) : isRejected ? (
            <Tag color="error" icon={<CloseCircleOutlined />}>
              Rejected by Holder
            </Tag>
          ) : isAccepted ? (
            <Tag color="success" icon={<CheckCircleOutlined />}>
              Accepted by Holder
            </Tag>
          ) : (
            <Tag color="warning" icon={<ClockCircleOutlined />}>
              Pending Acceptance
            </Tag>
          )}
          <Switch
            checkedChildren="JSON"
            unCheckedChildren="Form"
            checked={showJson}
            onChange={setShowJson}
          />
        </Space>
      </div>

      {isRejected && (
        <Alert
          type="error"
          showIcon
          message="Issuance Rejected by Holder"
          description={
            errorMsg
              ? `Reason: ${errorMsg.replace(/^issuance-abandoned:\s*/i, "")}`
              : "The holder declined or abandoned this credential offer."
          }
          style={{ marginBottom: 16, borderRadius: 8 }}
        />
      )}

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
                {credential.id || credential.credential_id || credential.referent || "N/A"}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Credential Definition ID">
              <Text code copyable style={{ fontSize: 12 }}>
                {credDefId}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Issuance Date">
              <Text type="secondary">
                {displayDate}
              </Text>
            </Descriptions.Item>
            {errorMsg && (
              <Descriptions.Item label="Rejection Reason">
                <Text type="danger" style={{ fontWeight: 500 }}>
                  {errorMsg.replace(/^issuance-abandoned:\s*/i, "") || errorMsg}
                </Text>
              </Descriptions.Item>
            )}
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
