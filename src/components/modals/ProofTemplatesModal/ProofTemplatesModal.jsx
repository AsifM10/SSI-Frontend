import { useEffect, useState } from "react";
import {
  Modal,
  Button,
  Form,
  Input,
  Select,
  Tag,
  Space,
  Popconfirm,
  message,
  Tabs,
  Empty,
  Spin,
  Alert,
} from "antd";
import {
  FileProtectOutlined,
  PlusOutlined,
  DeleteOutlined,
  SendOutlined,
  SyncOutlined,
} from "@ant-design/icons";
import { verifierApi } from "../../../services/api/index.js";
import "./ProofTemplatesModal.css";

const { Option } = Select;

export const ProofTemplatesModal = ({ visible, onClose, connections = [], onRequestSent }) => {
  const [form] = Form.useForm();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [activeTab, setActiveTab] = useState("list");

  // Dispatch modal
  const [dispatchModalVisible, setDispatchModalVisible] = useState(false);
  const [selectedTemplateForDispatch, setSelectedTemplateForDispatch] = useState(null);
  const [selectedConnectionId, setSelectedConnectionId] = useState("");
  const [dispatching, setDispatching] = useState(false);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await verifierApi.getProofTemplates();
      const list = res?.data?.results || res?.data?.templates || res?.data || [];
      setTemplates(Array.isArray(list) ? list : []);
    } catch (err) {
      console.warn("Could not fetch proof templates:", err);
      // Fallback default templates
      setTemplates([
        {
          id: "tpl-age-verification",
          name: "Adult Age Verification (>18)",
          description: "Zero-knowledge proof verifying holder is over 18 without revealing exact DOB.",
          attributes: ["fullName", "nationality"],
          predicates: [{ name: "age", p_type: ">=", p_value: 18 }],
        },
        {
          id: "tpl-employment",
          name: "Employment Credential Verification",
          description: "Verifies active employment, department, and employee designation.",
          attributes: ["employeeId", "organization", "department", "designation"],
        },
        {
          id: "tpl-education",
          name: "Academic Degree Verification",
          description: "Verifies university degree qualification, graduation year, and GPA.",
          attributes: ["studentName", "degree", "university", "graduationYear"],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      fetchTemplates();
    }
  }, [visible]);

  const handleCreate = async (values) => {
    setCreating(true);
    try {
      const attrs = values.attributes
        ? values.attributes.split(",").map((a) => a.trim()).filter(Boolean)
        : [];

      const payload = {
        name: values.name,
        description: values.description || "",
        attributes: attrs,
      };

      await verifierApi.createProofTemplate(payload);
      message.success("Proof template created successfully!");
      form.resetFields();
      setActiveTab("list");
      fetchTemplates();
    } catch (err) {
      message.error(err?.message || "Failed to create proof template");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await verifierApi.deleteProofTemplate(id);
      message.success("Proof template deleted");
      fetchTemplates();
    } catch (err) {
      message.error(err?.message || "Failed to delete proof template");
    }
  };

  const openDispatch = (template) => {
    setSelectedTemplateForDispatch(template);
    setSelectedConnectionId(connections[0]?.connection_id || connections[0]?.id || "");
    setDispatchModalVisible(true);
  };

  const handleDispatch = async () => {
    if (!selectedConnectionId) {
      message.warning("Please select a holder connection");
      return;
    }

    setDispatching(true);
    try {
      await verifierApi.requestProofFromTemplate(selectedTemplateForDispatch.id, {
        connection_id: selectedConnectionId,
      });
      message.success("Proof request dispatched to holder successfully!");
      setDispatchModalVisible(false);
      if (onRequestSent) onRequestSent();
      if (onClose) onClose();
    } catch (err) {
      message.error(err?.message || "Failed to dispatch proof request from template");
    } finally {
      setDispatching(false);
    }
  };

  return (
    <>
      <Modal
        className="proof-templates-modal"
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <FileProtectOutlined style={{ color: "#2563eb" }} />
            <span>Proof Verification Templates (Reusable Blueprint Catalog)</span>
          </div>
        }
        open={visible}
        onCancel={onClose}
        footer={[
          <Button key="close" onClick={onClose}>
            Close
          </Button>,
        ]}
      >
        <Alert
          message="AnonCreds Present-Proof 2.0 Templates"
          description="Create and reuse standard proof requests across multiple holders. Disclosing only required claims and zero-knowledge predicates."
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: "list",
              label: `Saved Templates (${templates.length})`,
              children: (
                <div>
                  <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
                    <Button icon={<SyncOutlined />} size="small" onClick={fetchTemplates}>
                      Refresh
                    </Button>
                  </div>

                  {loading ? (
                    <div style={{ textAlign: "center", padding: 30 }}>
                      <Spin />
                    </div>
                  ) : templates.length === 0 ? (
                    <Empty description="No proof templates saved yet. Create your first blueprint!" />
                  ) : (
                    templates.map((tpl) => (
                      <div key={tpl.id} className="template-card-item">
                        <div className="template-card-header">
                          <div className="template-card-title">{tpl.name}</div>
                          <Space>
                            <Button
                              type="primary"
                              size="small"
                              icon={<SendOutlined />}
                              onClick={() => openDispatch(tpl)}
                            >
                              Request Proof
                            </Button>
                            <Popconfirm
                              title="Delete this template?"
                              onConfirm={() => handleDelete(tpl.id)}
                              okText="Yes"
                              cancelText="No"
                            >
                              <Button type="text" danger size="small" icon={<DeleteOutlined />} />
                            </Popconfirm>
                          </Space>
                        </div>

                        <div className="template-card-desc">{tpl.description}</div>

                        <div className="template-attributes-list">
                          {(tpl.attributes || []).map((attr, idx) => (
                            <Tag key={idx} color="blue">
                              {attr}
                            </Tag>
                          ))}
                          {(tpl.predicates || []).map((pred, idx) => (
                            <Tag key={`pred-${idx}`} color="purple">
                              ZK: {pred.name} {pred.p_type} {pred.p_value}
                            </Tag>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ),
            },
            {
              key: "create",
              label: "Create New Template",
              children: (
                <Form form={form} layout="vertical" onFinish={handleCreate} style={{ marginTop: 12 }}>
                  <Form.Item
                    name="name"
                    label="Template Name"
                    rules={[{ required: true, message: "Template name required" }]}
                  >
                    <Input placeholder="e.g. Identity & Citizenship Verification" />
                  </Form.Item>

                  <Form.Item name="description" label="Description">
                    <Input.TextArea rows={2} placeholder="Explain verification requirements..." />
                  </Form.Item>

                  <Form.Item
                    name="attributes"
                    label="Requested Attributes (comma-separated)"
                    rules={[{ required: true, message: "At least one attribute is required" }]}
                    extra="Enter attribute keys to reveal from holder credential, e.g. fullName, age, nationality"
                  >
                    <Input placeholder="fullName, email, employeeId" />
                  </Form.Item>

                  <Button type="primary" htmlType="submit" icon={<PlusOutlined />} loading={creating}>
                    Save Proof Template
                  </Button>
                </Form>
              ),
            },
          ]}
        />
      </Modal>

      {/* 1-Click Dispatch Modal */}
      <Modal
        title={`Request Proof: ${selectedTemplateForDispatch?.name || "Template"}`}
        open={dispatchModalVisible}
        onCancel={() => setDispatchModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setDispatchModalVisible(false)}>
            Cancel
          </Button>,
          <Button
            key="send"
            type="primary"
            icon={<SendOutlined />}
            loading={dispatching}
            onClick={handleDispatch}
          >
            Send Request to Holder
          </Button>,
        ]}
      >
        <p style={{ color: "#64748b" }}>
          Select the active holder connection to receive this Aries RFC 0454 proof request:
        </p>
        <Select
          style={{ width: "100%", marginTop: 8 }}
          value={selectedConnectionId}
          onChange={setSelectedConnectionId}
          placeholder="Select holder connection..."
        >
          {connections.map((c) => (
            <Option key={c.connection_id || c.id} value={c.connection_id || c.id}>
              {c.their_label || c.alias || `Conn ${String(c.connection_id || c.id).slice(0, 8)}`} (
              {c.state || "active"})
            </Option>
          ))}
        </Select>
      </Modal>
    </>
  );
};

export default ProofTemplatesModal;
