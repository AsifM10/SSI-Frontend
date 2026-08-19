import { useState } from "react";
import { Modal, message } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import api from "../../../services/api";

import "./DeleteConfirmationModal.css";

const DeleteConfirmationModal = ({
  open,
  title,
  entityName,
  description,
  details,
  deleteApi,
  onSuccess,
  onCancel,
}) => {
  const [loading, setLoading] = useState(false);

  const toastStyle = {
  borderRadius: 14,
  boxShadow: "0 10px 30px rgba(0,0,0,0.15), 0 3px 10px rgba(0,0,0,0.08)",
  border: "1px solid var(--border-color)",
  background: "var(--card-bg)",
};

const handleDelete = async () => {
    try {
      setLoading(true);
      await api.delete(deleteApi);
      message.success({ content: "Deleted successfully", style: toastStyle });
      if (onSuccess) onSuccess();
    } catch (error) {
      message.error({ content: error?.response?.data?.message || "Delete failed", style: toastStyle });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      title={
        <span className="delete-modal-title">
          <DeleteOutlined className="delete-modal-icon" />
          {title}
        </span>
      }
      okText={loading ? "Deleting..." : "Delete"}
      cancelText="Cancel"
      onOk={handleDelete}
      onCancel={onCancel}
      confirmLoading={loading}
      destroyOnClose
      width={460}
      className="delete-confirm-modal"
      okButtonProps={{ danger: true }}
    >
      <p className="delete-modal-description">{description}</p>
      {entityName && (
        <p className="delete-modal-entity">
          <strong>{entityName}</strong>
        </p>
      )}
      {details && details.length > 0 && (
        <div className="delete-modal-details">
          {details.map((d, i) => (
            <div key={i} className="delete-modal-detail-row">
              <span className="detail-label">{d.label}</span>
              <span className="detail-value">{d.value}</span>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
};

export default DeleteConfirmationModal;
