import React, { useState } from "react";
import { Modal, Descriptions, Tag, Button, Space, Typography, Switch, Card } from "antd";
import { CopyOutlined, FileTextOutlined, CheckCircleOutlined } from "@ant-design/icons";

const { Text, Paragraph } = Typography;

export default function ViewTemplateModal({ visible, onClose, schema }) {
  const [showJson, setShowJson] = useState(false);

  if (!schema) return null;

  const rawJson = JSON.stringify(schema, null, 2);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(rawJson);
  };

  return (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <FileTextOutlined style={{ color: "#2563EB" }} />
          <span>Credential Schema / Template Details</span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={700}
      footer={[
        <Button key="close" onClick={onClose} style={{ borderRadius: 8 }}>
          Close
        </Button>,
      ]}
      destroyOnClose
    >
      <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Text strong style={{ fontSize: 16 }}>
          {schema.name || schema.schema_name}
        </Text>
        <Space>
          <Text type="secondary" style={{ fontSize: 12 }}>View Raw JSON</Text>
          <Switch size="small" checked={showJson} onChange={setShowJson} />
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
              onClick={copyToClipboard}
              style={{ color: "#94a3b8" }}
            >
              Copy JSON
            </Button>
          }
        >
          <pre style={{ color: "#38bdf8", fontSize: 12, margin: 0, maxHeight: 360, overflow: "auto" }}>
            {rawJson}
          </pre>
        </Card>
      ) : (
        <Descriptions bordered column={1} size="small" style={{ borderRadius: 8 }}>
          <Descriptions.Item label="Schema ID">
            <Text code copyable style={{ fontSize: 12 }}>
              {schema.id || schema.schema_id || "N/A"}
            </Text>
          </Descriptions.Item>
          <Descriptions.Item label="Schema Name">
            <Text strong>{schema.name || schema.schema_name}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Version">
            <Tag color="blue">{schema.version || "1.0"}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Issuer DID">
            <Text code copyable style={{ fontSize: 12 }}>
              {schema.issuerDid || schema.issuer_did || "N/A"}
            </Text>
          </Descriptions.Item>
          <Descriptions.Item label="Attributes Specification">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, padding: "4px 0" }}>
              {(schema.attributes || schema.attrNames || []).map((attr, idx) => (
                <Tag key={idx} color="geekblue" style={{ fontSize: 13, padding: "2px 8px" }}>
                  {attr}
                </Tag>
              ))}
            </div>
          </Descriptions.Item>
          {schema.created_at && (
            <Descriptions.Item label="Created At">
              <Text type="secondary">{new Date(schema.created_at).toLocaleString()}</Text>
            </Descriptions.Item>
          )}
        </Descriptions>
      )}
    </Modal>
  );
}
