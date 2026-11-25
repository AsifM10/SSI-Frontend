import { useState } from "react";
import { Modal, Form, Select, Button, Input, Space, message, Alert, Divider } from "antd";
import { PlusOutlined, DeleteOutlined, SendOutlined } from "@ant-design/icons";
import { issuerApi } from "../../../services/api/index.js";
import "./BatchIssueModal.css";

const { Option } = Select;

export const BatchIssueModal = ({ visible, onClose, credDefs = [], connections = [], onSuccess }) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [selectedCredDef, setSelectedCredDef] = useState(null);

  const handleCredDefChange = (credDefId) => {
    const found = credDefs.find((cd) => (cd.id || cd.credDefId) === credDefId);
    setSelectedCredDef(found);
  };

  const handleFinish = async (values) => {
    if (!values.items || values.items.length === 0) {
      message.error("Please add at least one credential recipient");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        cred_def_id: values.credDefId,
        items: values.items.map((item) => ({
          connection_id: item.connectionId,
          comment: item.comment || "Batch issued credential",
          attributes: item.attributes || {},
        })),
      };

      await issuerApi.issueCredentialBatch(payload);
      message.success(`Successfully dispatched batch of ${values.items.length} credentials!`);
      form.resetFields();
      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } catch (err) {
      message.error(err?.message || "Failed to process batch credential issuance");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      className="batch-issue-modal"
      title="Batch Credential Issuance (Multi-Holder Dispatch)"
      open={visible}
      onCancel={onClose}
      footer={null}
    >
      <Alert
        message="Aries RFC 0453 Batch Dispatch"
        description="Issue cryptographic credentials simultaneously to multiple verified holder connections using an active Credential Definition."
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={{ items: [{ connectionId: "", comment: "" }] }}
      >
        <Form.Item
          name="credDefId"
          label="Select Credential Definition Blueprint"
          rules={[{ required: true, message: "Credential definition is required" }]}
        >
          <Select
            placeholder="Choose Credential Definition..."
            onChange={handleCredDefChange}
          >
            {credDefs.map((cd) => (
              <Option key={cd.id || cd.credDefId} value={cd.id || cd.credDefId}>
                {cd.schemaName || cd.name || cd.id || cd.credDefId}
              </Option>
            ))}
          </Select>
        </Form.Item>

        {selectedCredDef && (
          <div style={{ marginTop: -8, marginBottom: 12, fontSize: 12, color: "var(--text-muted)" }}>
            Selected: <code>{selectedCredDef.id || selectedCredDef.credDefId}</code>
          </div>
        )}

        <Divider orientation="left">Recipients & Claims Payload</Divider>

        <Form.List name="items">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }, index) => (
                <div key={key} className="batch-row">
                  <span className="batch-row-index">#{index + 1}</span>
                  <Form.Item
                    {...restField}
                    name={[name, "connectionId"]}
                    rules={[{ required: true, message: "Select holder connection" }]}
                    style={{ flex: 1, marginBottom: 0 }}
                  >
                    <Select placeholder="Select Holder Connection">
                      {connections.map((c) => (
                        <Option key={c.connection_id || c.id} value={c.connection_id || c.id}>
                          {c.their_label || c.alias || `Conn ${String(c.connection_id || c.id).slice(0, 8)}`}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>

                  <Form.Item
                    {...restField}
                    name={[name, "comment"]}
                    style={{ flex: 1, marginBottom: 0 }}
                  >
                    <Input placeholder="Note / Reference ID" />
                  </Form.Item>

                  {fields.length > 1 && (
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => remove(name)}
                    />
                  )}
                </div>
              ))}

              <Button
                type="dashed"
                onClick={() => add()}
                block
                icon={<PlusOutlined />}
                style={{ marginTop: 8, marginBottom: 20 }}
              >
                Add Another Holder Recipient
              </Button>
            </>
          )}
        </Form.List>

        <Space style={{ display: "flex", justifyContent: "flex-end" }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            type="primary"
            htmlType="submit"
            icon={<SendOutlined />}
            loading={submitting}
          >
            Dispatch Batch
          </Button>
        </Space>
      </Form>
    </Modal>
  );
};

export default BatchIssueModal;
