import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { selectUser } from "../../store/slices/authSlice";
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  LockOutlined,
  SafetyCertificateOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  EditOutlined,
  DeleteOutlined,
  TeamOutlined,
} from "@ant-design/icons";

import { Modal, message } from "antd";

import api from "../../services/api";
import DeleteConfirmationModal from "../../components/modals/DeleteConfirmationModal/DeleteConfirmationModal";
import RegistrationSuccessModal from "../../components/modals/RegistrationSuccessModal/RegistrationSuccessModal";

import "./DepartmentViewer.css";

const initialCreateForm = {
  personName: "",
  email: "",
  phoneNo: "",
  designation: "",
  password: "",
  role: "DEPT_VIEWER",
};

const DepartmentViewerList = () => {

  const user = useSelector(selectUser) || {};
  const canManage = user.role === "DEPT_ADMIN" || user.role === "CENTRAL_ADMIN";

  const [viewers, setViewers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Delete state
  const [deleteModal, setDeleteModal] = useState({ open: false, viewer: null });

  // View modal state
  const [viewModal, setViewModal] = useState({ open: false, viewer: null });

  // Edit state
  const [editOpen, setEditOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ personName: "", designation: "", phoneNo: "" });
  const [editErrors, setEditErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Create state
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState(initialCreateForm);
  const [createErrors, setCreateErrors] = useState({});
  const [creating, setCreating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [createdModalOpen, setCreatedModalOpen] = useState(false);

  // Generic success notification modal
  const [notification, setNotification] = useState({ open: false, title: "", text: "" });

  useEffect(() => {
    getDepartmentViewers();
  }, []);

  const getDepartmentViewers = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/users/department/${user.deptId}`);
      if (response.data.success) {
        setViewers(response.data.data);
      }
    } catch (err) {
      message.error({ content: "Unable to fetch Department Viewers", className: "toast-error" });
    } finally {
      setLoading(false);
    }
  };

  const viewViewer = (viewer) => {
    setViewModal({ open: true, viewer });
  };

  const closeViewModal = () => {
    setViewModal({ open: false, viewer: null });
  };

  // ---- Create ----

  const openCreate = () => {
    setCreateForm({ ...initialCreateForm, deptId: user.deptId });
    setCreateErrors({});
    setCreateOpen(true);
  };

  const closeCreate = () => {
    setCreateOpen(false);
    setCreateForm(initialCreateForm);
    setCreateErrors({});
  };

  const validateCreate = () => {
    const errs = {};
    const name = createForm.personName.trim();
    const email = createForm.email.trim();
    const phone = createForm.phoneNo.trim();
    const designation = createForm.designation.trim();

    if (!name) {
      errs.personName = "Full name is required";
    } else if (name.length < 2) {
      errs.personName = "Name must be at least 2 characters";
    } else if (!/^[A-Za-z][A-Za-z .'-]*$/.test(name)) {
      errs.personName = "Name can only contain letters and spaces";
    }

    if (!email) {
      errs.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = "Enter a valid email address";
    }

    if (phone && !/^(\+91)?[6-9][0-9]{9}$/.test(phone)) {
      errs.phoneNo = "Enter a valid 10-digit Indian phone number";
    }

    if (designation && designation.length < 2) {
      errs.designation = "Designation must be at least 2 characters";
    }

    const pwd = createForm.password;
    if (!pwd) {
      errs.password = "Password is required";
    } else if (pwd.length < 8) {
      errs.password = "Password must be at least 8 characters";
    } else if (!/[A-Za-z]/.test(pwd) || !/[0-9]/.test(pwd)) {
      errs.password = "Password must contain at least one letter and one number";
    }

    setCreateErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCreateChange = (field, value) => {
    setCreateForm((prev) => ({ ...prev, [field]: value }));
    setCreateErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleCreate = async () => {
    if (!validateCreate()) return;
    try {
      setCreating(true);
      const payload = {
        ...createForm,
        personName: createForm.personName.trim(),
        email: createForm.email.trim(),
        phoneNo: createForm.phoneNo.trim() || undefined,
        deptId: user.deptId,
      };
      await api.post("/api/users", payload);
      setCreating(false);
      closeCreate();
      setCreatedModalOpen(true);
      getDepartmentViewers();
    } catch (err) {
      message.error({ content: err.response?.data?.message || "Registration Failed", className: "toast-error" });
      setCreating(false);
    }
  };

  // ---- Edit ----

  const openEdit = (viewer) => {
    setEditingUser(viewer);
    setEditForm({
      personName: viewer.personName || "",
      designation: viewer.designation || "",
      phoneNo: viewer.phoneNo || "",
    });
    setEditErrors({});
    setEditOpen(true);
  };

  const closeEdit = () => {
    setEditOpen(false);
    setEditingUser(null);
    setEditForm({ personName: "", designation: "", phoneNo: "" });
    setEditErrors({});
  };

  const validateEdit = () => {
    const errors = {};
    if (!editForm.personName || editForm.personName.trim().length < 2) {
      errors.personName = "Name must be at least 2 characters";
    }
    if (editForm.phoneNo && !/^[0-9+\-\s()]{7,20}$/.test(editForm.phoneNo)) {
      errors.phoneNo = "Enter a valid phone number (7-20 digits)";
    }
    setEditErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const saveEdit = async () => {
    if (!validateEdit()) return;
    try {
      setSaving(true);
      const payload = {
        personName: editForm.personName.trim(),
        designation: editForm.designation.trim(),
        phoneNo: editForm.phoneNo.trim(),
      };
      await api.put(`/api/users/${editingUser.userId}`, payload);
      setSaving(false);
      closeEdit();
      setNotification({
        open: true,
        title: "Viewer Updated Successfully!",
        text: `${editForm.personName.trim()}'s details have been updated successfully.`,
      });
      getDepartmentViewers();
    } catch {
      message.error({ content: "Failed to update viewer", className: "toast-error" });
      setSaving(false);
    }
  };

  return (

    <div className="viewer-page">

      <div className="viewer-header">

        <div>
          <h2>Department Viewers</h2>
          <p>
            List of all Department Viewers.
            <strong> {user.departmentName}</strong>
          </p>
        </div>

        <div className="viewer-header-actions">
          <input
            className="search-input"
            placeholder="Search name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {canManage && (
            <button className="create-viewer-btn" onClick={openCreate}>
              + Create Viewer
            </button>
          )}
        </div>

      </div>

      <div className="viewer-table">

        <div className="viewer-heading">
          <div>Name</div>
          <div>Email</div>
          <div>Designation</div>
          <div>Phone</div>
          <div>Role</div>
          <div>Actions</div>
        </div>

        {loading ? (
          <div className="loading">Loading...</div>
        ) : (
          (() => {
            const filtered = viewers
              .filter((viewer) => viewer.role === "DEPT_VIEWER")
              .filter((v) => {
                if (!searchQuery) return true;
                const q = searchQuery.toLowerCase();
                return (
                  v.personName?.toLowerCase().includes(q) ||
                  v.email?.toLowerCase().includes(q)
                );
              });

            if (filtered.length === 0) {
              return (
                <div className="viewer-empty">
                  <div className="viewer-empty-icon"><TeamOutlined /></div>
                  <h3 className="viewer-empty-title">No Users Registered</h3>
                  <p className="viewer-empty-desc">This department doesn't have any users yet. Create a viewer to get started.</p>
                </div>
              );
            }

            return filtered.map((viewer, i) => (
              <div className="viewer-row animate-in" key={viewer.userId} style={{ animationDelay: `${i * 0.04}s` }}>
                <div className="viewer-name">
                  <span className="viewer-icon"><UserOutlined /></span>
                  {viewer.personName}
                </div>
                <div>{viewer.email}</div>
                <div>{viewer.designation || "\u2014"}</div>
                <div>{viewer.phoneNo || "\u2014"}</div>
                <div><span className="viewer-role-badge">{viewer.role}</span></div>
                <div className="viewer-actions">
                  <button className="view-btn" title="View" onClick={() => viewViewer(viewer)}>
                    <EyeOutlined />
                  </button>
                  {canManage && (
                    <button className="edit-btn" title="Edit" onClick={() => openEdit(viewer)}>
                      <EditOutlined />
                    </button>
                  )}
                  {canManage && (
                    <button
                      className="delete-btn"
                      title="Delete"
                      onClick={() => setDeleteModal({ open: true, viewer })}
                    >
                      <DeleteOutlined />
                    </button>
                  )}
                </div>
              </div>
            ));
          })()
        )}

      </div>

      {/* ---- Create Modal ---- */}

      <Modal
        title="Create Department Viewer"
        open={createOpen}
        onOk={handleCreate}
        onCancel={closeCreate}
        okText={creating ? "Creating..." : "Create"}
        cancelText="Cancel"
        confirmLoading={creating}
        destroyOnClose
        width={640}
        className="create-viewer-modal"
      >
        <div className="create-form-body">
          <div className={`create-field ${createErrors.personName ? "has-error" : ""}`}>
            <label>Full Name <span className="required">*</span></label>
            <div className="create-input-wrap">
              <UserOutlined className="create-input-icon" />
              <input
                placeholder="John Doe"
                value={createForm.personName}
                onChange={(e) => handleCreateChange("personName", e.target.value)}
              />
            </div>
            {createErrors.personName && <span className="create-field-error">{createErrors.personName}</span>}
          </div>

          <div className={`create-field ${createErrors.email ? "has-error" : ""}`}>
            <label>Email <span className="required">*</span></label>
            <div className="create-input-wrap">
              <MailOutlined className="create-input-icon" />
              <input
                type="email"
                placeholder="john@example.com"
                value={createForm.email}
                onChange={(e) => handleCreateChange("email", e.target.value)}
              />
            </div>
            {createErrors.email && <span className="create-field-error">{createErrors.email}</span>}
          </div>

          <div className={`create-field ${createErrors.phoneNo ? "has-error" : ""}`}>
            <label>Phone <span className="optional">(optional)</span></label>
            <div className="create-input-wrap">
              <PhoneOutlined className="create-input-icon" />
              <input
                placeholder="9876543210"
                value={createForm.phoneNo}
                maxLength={10}
                onChange={(e) => handleCreateChange("phoneNo", e.target.value.replace(/\D/g, "").slice(0, 10))}
              />
            </div>
            {createErrors.phoneNo && <span className="create-field-error">{createErrors.phoneNo}</span>}
          </div>

          <div className={`create-field ${createErrors.designation ? "has-error" : ""}`}>
            <label>Designation <span className="optional">(optional)</span></label>
            <div className="create-input-wrap">
              <UserOutlined className="create-input-icon" />
              <input
                placeholder="Software Engineer"
                value={createForm.designation}
                onChange={(e) => handleCreateChange("designation", e.target.value)}
              />
            </div>
            {createErrors.designation && <span className="create-field-error">{createErrors.designation}</span>}
          </div>

          <div className={`create-field ${createErrors.password ? "has-error" : ""}`}>
            <label>Password <span className="required">*</span></label>
            <div className="create-input-wrap">
              <LockOutlined className="create-input-icon" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Min 8 characters, letters & numbers"
                value={createForm.password}
                onChange={(e) => handleCreateChange("password", e.target.value)}
              />
              <span
                className="create-input-eye"
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />}
              </span>
            </div>
            {createErrors.password && <span className="create-field-error">{createErrors.password}</span>}
          </div>

          <div className="create-field">
            <label>Role</label>
            <div className="create-input-wrap">
              <SafetyCertificateOutlined className="create-input-icon" />
              <input value="DEPT_VIEWER" disabled />
            </div>
          </div>
        </div>
      </Modal>

      {/* ---- Edit Modal ---- */}

      <Modal
        title="Edit Department Viewer"
        open={editOpen}
        onOk={saveEdit}
        onCancel={closeEdit}
        okText={saving ? "Saving..." : "Save"}
        cancelText="Cancel"
        confirmLoading={saving}
        destroyOnClose
        width={640}
        className="create-viewer-modal"
      >
        <div className="create-form-body">
          <div className={`create-field ${editErrors.personName ? "has-error" : ""}`}>
            <label>Person Name <span className="required">*</span></label>
            <div className="create-input-wrap">
              <UserOutlined className="create-input-icon" />
              <input
                value={editForm.personName}
                onChange={(e) => setEditForm({ ...editForm, personName: e.target.value })}
              />
            </div>
            {editErrors.personName && <span className="create-field-error">{editErrors.personName}</span>}
          </div>

          <div className="create-field">
            <label>Designation</label>
            <div className="create-input-wrap">
              <UserOutlined className="create-input-icon" />
              <input
                value={editForm.designation}
                onChange={(e) => setEditForm({ ...editForm, designation: e.target.value })}
              />
            </div>
          </div>

          <div className={`create-field ${editErrors.phoneNo ? "has-error" : ""}`}>
            <label>Phone</label>
            <div className="create-input-wrap">
              <PhoneOutlined className="create-input-icon" />
              <input
                value={editForm.phoneNo}
                onChange={(e) => setEditForm({ ...editForm, phoneNo: e.target.value })}
              />
            </div>
            {editErrors.phoneNo && <span className="create-field-error">{editErrors.phoneNo}</span>}
          </div>
        </div>
      </Modal>

      {/* ---- View Details Modal ---- */}

      <Modal
        open={viewModal.open}
        onCancel={closeViewModal}
        footer={null}
        width={560}
        centered
        destroyOnClose
        className="admin-view-modal"
      >
        <div className="detail-card admin-view-card">

          <h2>Department Viewer Details</h2>

          <div className="detail-body">

            <div className="detail-row">
              <div className="detail-icon"><UserOutlined /></div>
              <div className="detail-content">
                <div className="detail-label">Name</div>
                <div className="detail-value">{viewModal.viewer?.personName || ""}</div>
              </div>
            </div>

            <div className="detail-row">
              <div className="detail-icon"><MailOutlined /></div>
              <div className="detail-content">
                <div className="detail-label">Email</div>
                <div className="detail-value">{viewModal.viewer?.email || ""}</div>
              </div>
            </div>

            <div className="detail-row">
              <div className="detail-icon"><PhoneOutlined /></div>
              <div className="detail-content">
                <div className="detail-label">Phone</div>
                <div className="detail-value">{viewModal.viewer?.phoneNo || "\u2014"}</div>
              </div>
            </div>

            <div className="detail-row">
              <div className="detail-icon"><UserOutlined /></div>
              <div className="detail-content">
                <div className="detail-label">Designation</div>
                <div className="detail-value">{viewModal.viewer?.designation || "\u2014"}</div>
              </div>
            </div>

            <div className="detail-row">
              <div className="detail-icon"><SafetyCertificateOutlined /></div>
              <div className="detail-content">
                <div className="detail-label">Role</div>
                <div className="detail-value"><span className="viewer-role-badge">{viewModal.viewer?.role || ""}</span></div>
              </div>
            </div>

          </div>

        </div>
      </Modal>

      {/* ---- Delete Modal ---- */}

      <DeleteConfirmationModal
        open={deleteModal.open}
        title="Delete Viewer?"
        entityName={deleteModal.viewer?.personName}
        description="This action cannot be undone. This will permanently delete the viewer and remove all associated data."
        details={
          deleteModal.viewer
            ? [
                { label: "Email", value: deleteModal.viewer.email },
                { label: "Designation", value: deleteModal.viewer.designation || "\u2014" },
              ]
            : []
        }
        deleteApi={`/api/users/${deleteModal.viewer?.userId}`}
        onSuccess={() => {
          setDeleteModal({ open: false, viewer: null });
          setNotification({
            open: true,
            title: "Viewer Deleted Successfully!",
            text: `${deleteModal.viewer?.personName || "The viewer"} has been deleted successfully.`,
          });
          getDepartmentViewers();
        }}
        onCancel={() => setDeleteModal({ open: false, viewer: null })}
      />

      {/* ---- Created Success Modal ---- */}

      <RegistrationSuccessModal
        open={createdModalOpen}
        onClose={() => setCreatedModalOpen(false)}
        title="Viewer Created Successfully!"
        text="The department viewer has been created successfully. The viewer can now sign in with the provided credentials."
        buttonText="Done"
      />

      {/* ---- Generic Success Notification Modal ---- */}

      <RegistrationSuccessModal
        open={notification.open}
        onClose={() => setNotification({ open: false, title: "", text: "" })}
        title={notification.title}
        text={notification.text}
        buttonText="Done"
      />

    </div>

  );

};

export default DepartmentViewerList;
