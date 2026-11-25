import { useEffect, useState } from "react";
import { Modal, Form, Input, Button, Tag, Alert, Spin, Descriptions } from "antd";
import { EyeOutlined } from "@ant-design/icons";
import { issuerApi } from "../../../services/api/index.js";

export const IntakePreviewModal = ({ visible, onClose, schema }) => {
  const [loading, setLoading] = useState(false);
  const [intakeConfig, setIntakeConfig] = useState(null);

  useEffect(() => {
    if (visible && schema) {
      const fetchIntake = async () => {
        setLoading(true);
        const schemaId = schema.id || schema.schema_id || schema.schemaId;
        try {
          const res = await issuerApi.getSchemaIntakeForm(schemaId);
          setIntakeConfig(res?.data || res);
        } catch (err) {
          console.warn("Could not load backend intake config, using schema attrs:", err);
          setIntakeConfig({
            schemaId,
            schemaName: schema.name || schema.schemaName || "Credential Application",
            fields: (schema.attrNames || schema.attributes || []).map((attr) => ({
              name: attr,
              label: attr.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
              type: "string",
              required: true,
            })),
          });
        } finally {
          setLoading(false);
        }
      };
      fetchIntake();
    }
  }, [visible, schema]);

  const fields = intakeConfig?.fields || intakeConfig?.required_holder_attributes || [];

  return (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <EyeOutlined style={{ color: "#2563eb" }} />
          <span>Intake Form Preview: {schema?.name || "Schema"}</span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={600}
      footer={[
        <Button key="close" type="primary" onClick={onClose}>
          Done
        </Button>,
      ]}
    >
      <Alert
        message="Dynamic Holder Application Preview"
        description="This is the intake form automatically generated and presented to holders in the mobile wallet/portal when applying for this credential."
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      {loading ? (
        <div style={{ textAlign: "center", padding: 30 }}>
          <Spin />
        </div>
      ) : (
        <div>
          <Descriptions column={2} size="small" style={{ marginBottom: 16 }}>
            <Descriptions.Item label="Schema Name">{schema?.name || "Unknown"}</Descriptions.Item>
            <Descriptions.Item label="Version">{schema?.version || "1.0"}</Descriptions.Item>
          </Descriptions>

          <h4>Expected Attributes from Applicant:</h4>
          <Form layout="vertical" disabled>
            {fields.map((f, idx) => {
              const fieldName = typeof f === "string" ? f : f.name || f.key || `field_${idx}`;
              const fieldLabel = typeof f === "string" ? f : f.label || fieldName;
              return (
                <Form.Item
                  key={idx}
                  label={
                    <span>
                      {fieldLabel}{" "}
                      <Tag color="blue" style={{ fontSize: 10, marginLeft: 4 }}>
                        {f.type || "string"}
                      </Tag>
                    </span>
                  }
                  required={f.required !== false}
                >
                  <Input placeholder={`Applicant enters ${fieldLabel}...`} />
                </Form.Item>
              );
            })}
          </Form>
        </div>
      )}
    </Modal>
  );
};

export default IntakePreviewModal;
