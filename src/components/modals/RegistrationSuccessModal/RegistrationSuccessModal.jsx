import {
  CheckCircleOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import "./RegistrationSuccessModal.css";

const RegistrationSuccessModal = ({
  open,
  onClose,
  title,
  text,
  buttonText,
}) => {
  if (!open) return null;

  return (
    <div className="reg-modal-overlay" onClick={onClose}>
      <div className="reg-modal" onClick={(e) => e.stopPropagation()}>
        <button className="reg-modal-close" onClick={onClose}>
          <CloseOutlined />
        </button>

        <div className="reg-modal-icon">
          <CheckCircleOutlined />
        </div>

        <h3 className="reg-modal-title">
          {title || "Registration Successful!"}
        </h3>

        <p className="reg-modal-text">
          {text ||
            "Your account has been created successfully. You can now sign in with your credentials."}
        </p>

        <button className="reg-modal-btn" onClick={onClose}>
          {buttonText || "Go to Sign In"}
        </button>
      </div>
    </div>
  );
};

export default RegistrationSuccessModal;
