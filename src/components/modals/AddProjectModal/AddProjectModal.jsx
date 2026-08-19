import { useEffect, useState } from "react";
import { createProject, updateProject } from "../../../services/projectService";
import {
  CloseOutlined,
  AppstoreOutlined,
  DownOutlined,
} from "@ant-design/icons";

import "./AddProjectModal.css";

const AddProjectModal = ({
  open,
  onClose,
  deptId,
  deptName,
  onProjectCreated,
  editing,
}) => {
  const [projectName, setProjectName] = useState("");

  const [description, setDescription] = useState("");

  const [status, setStatus] = useState("ACTIVE");

  const [tags, setTags] = useState("");

  useEffect(() => {
    if (open) {
      setProjectName(editing?.projectName || "");
      setDescription(editing?.projectDescription || "");
      setStatus(editing?.status || "ACTIVE");
      setTags((editing?.tags || []).join(", "));
    }
  }, [open, editing]);

  if (!open) return null;

  const handleSubmit = async () => {
  try {
    const payload = {
      projectName,
      projectDescription: description,
      status,
      tags: tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    };

    if (editing) {
      await updateProject(editing.projectId, payload);
    } else {
      await createProject({ ...payload, deptId });
    }

    if (onProjectCreated) {
      onProjectCreated();
    }

    onClose();
  } catch (err) {
    console.error(err);
    alert(editing ? "Failed to update project" : "Failed to create project");
  }
};

  return (
    <div className="modal-overlay">
      <div className="add-project-modal">
        {/* =========================
            HEADER
        ========================= */}

        <div className="modal-header">
          <div>
            <h2>{editing ? "Edit Project" : "Add New Project"}</h2>

            <p>
              {editing
                ? "Update the project details"
                : "Create a new project and assign it to a department"}
            </p>
          </div>

          <button className="close-btn" onClick={onClose}>
            <CloseOutlined />
          </button>
        </div>

        {/* =========================
            BODY
        ========================= */}

        <div className="modal-body">
          {/* PROJECT NAME */}

          <div className="form-group full-width">
            <label>
              Project Name
              <span>*</span>
            </label>

            <div className="input-wrapper">
              <AppstoreOutlined className="input-icon" />

              <input
                type="text"
                placeholder="e.g. Identity Service"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
              />
            </div>
          </div>

          {/* DESCRIPTION */}

          <div className="form-group full-width">
            <label>Project Description</label>

            <textarea
              placeholder="Brief description of what this project does..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* STATUS */}

          <div className="form-group">
            <label>Status</label>

            <div className="select-wrapper">
              <select
                className="project-status-select"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
              <DownOutlined className="select-caret" />
            </div>
          </div>

          {/* DEPARTMENT */}

          <div className="form-group">
            <label>Department</label>

            <div className="select-wrapper" style={{ opacity: 0.6, cursor: "not-allowed" }}>
              <span>{deptName || `Department #${deptId}`}</span>
            </div>
          </div>

          {/* TAGS */}

          <div className="form-group full-width">
            <label>Tags</label>

            <input
              className="tags-input"
              type="text"
              placeholder="e.g. blockchain, prod, critical"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
          </div>
        </div>

        {/* =========================
            FOOTER
        ========================= */}

        <div className="modal-footer">
          <button className="cancel-btn" onClick={onClose}>
            Cancel
          </button>

          <button className="create-btn" onClick={handleSubmit}>
            {editing ? "Save Changes" : "Create Project"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddProjectModal;
