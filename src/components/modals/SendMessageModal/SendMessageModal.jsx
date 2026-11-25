import { useState } from "react";
import { Modal, Form, Input, Button, message } from "antd";
import { SendOutlined } from "@ant-design/icons";
import { useDispatch } from "react-redux";
import { sendBasicMessage } from "../../../store/slices/messagingSlice";

export const SendMessageModal = ({ visible, onClose, connectionId, connectionAlias }) => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      await dispatch(
        sendBasicMessage({
          connectionId,
          content: values.content,
        })
      ).unwrap();
      message.success("Message sent successfully!");
      form.resetFields();
      if (onClose) onClose();
    } catch (err) {
      message.error(err?.message || "Failed to send message");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={`Send Message to ${connectionAlias || connectionId || "Connection"}`}
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button
          key="send"
          type="primary"
          icon={<SendOutlined />}
          loading={submitting}
          onClick={handleSubmit}
        >
          Send
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="content"
          label="Message Content"
          rules={[{ required: true, message: "Please enter your message" }]}
        >
          <Input.TextArea rows={4} placeholder="Type your DIDComm message..." />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default SendMessageModal;
