import { useEffect, useState } from "react";

import { CloseOutlined, ApartmentOutlined } from "@ant-design/icons";

import "./AddDepartmentModal.css";
import {
  createDepartment,
  updateDepartment,
} from "../../../services/departmentService";

const AddDepartmentModal = ({ open, onClose, onCreate, editing }) => {
  const [departmentName, setDepartmentName] = useState("");

  useEffect(() => {
    if (open) {
      setDepartmentName(editing?.deptName || editing?.title || "");
    }
  }, [open, editing]);

  if (!open) return null;

  const handleSubmit = async () => {
  if (!departmentName.trim()) return;

  try {
    if (editing) {
      await updateDepartment(editing.deptId, departmentName.trim());
    } else {
      await createDepartment(departmentName);
    }

    await onCreate();

    setDepartmentName("");

    onClose();
  } catch (error) {
    console.error("Department Save Error:", error);

    alert("Failed to save department");
  }
};

  return (
    <div className="department-simple-overlay">
      <div className="department-simple-modal">
        {/* HEADER */}

        <div className="department-simple-header">
          <div>
            <h2>{editing ? "Edit Department" : "Add New Department"}</h2>

            <p>
              {editing
                ? "Update the department name"
                : "Create a new department to onboard projects under"}
            </p>
          </div>

          <button className="department-simple-close" onClick={onClose}>
            <CloseOutlined />
          </button>
        </div>

        {/* BODY */}

        <div className="department-simple-body">
          <div className="department-simple-field">
            <label>
              Department Name
              <span>*</span>
            </label>

            <div className="department-simple-input">
              <ApartmentOutlined className="department-simple-icon" />

              <input
                type="text"
                placeholder="e.g. Systems Engineering"
                value={departmentName}
                onChange={(e) => setDepartmentName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
              />
            </div>
          </div>
        </div>

        {/* FOOTER */}

        <div className="department-simple-footer">
          <button className="department-simple-cancel" onClick={onClose}>
            Cancel
          </button>

          <button className="department-simple-submit" onClick={handleSubmit}>
            {editing ? "Save Changes" : "Create Department"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddDepartmentModal;
