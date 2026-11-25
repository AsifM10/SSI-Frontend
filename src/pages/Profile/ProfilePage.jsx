import { useEffect, useState } from "react";
import {
  Card,
  Tabs,
  Form,
  Input,
  Button,
  Avatar,
  Table,
  Upload,
  message,
  Space,
  Tag,
  Popconfirm,
} from "antd";
import {
  UserOutlined,
  LockOutlined,
  UploadOutlined,
  DeleteOutlined,
  SyncOutlined,
  CopyOutlined,
  FileDoneOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { useSelector } from "react-redux";
import DashboardLayout from "../../layouts/DashboardLayout/DashboardLayout";
import { selectUser } from "../../store/slices/authSlice";
import { profileApi } from "../../services/api/index.js";
import "./ProfilePage.css";

export const ProfilePage = () => {
  const user = useSelector(selectUser);

  const [formProfile] = Form.useForm();
  const [formPassword] = Form.useForm();
  const [formApiKey] = Form.useForm();

  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [apiKeys, setApiKeys] = useState([]);
  const [dids, setDids] = useState([]);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPass, setChangingPass] = useState(false);
  const [creatingKey, setCreatingKey] = useState(false);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await profileApi.getMyProfile();
      const p = res?.data?.user || res?.data || user || {};
      setProfileData(p);
      formProfile.setFieldsValue({
        username: p.username || user?.username,
        email: p.email || user?.email,
        organization: p.organization || p.org || user?.organization,
        role: p.role || user?.role,
      });
    } catch (err) {
      console.warn("Failed to load profile:", err);
      setProfileData(user);
    } finally {
      setLoading(false);
    }
  };

  const fetchApiKeys = async () => {
    try {
      const res = await profileApi.getApiKeys();
      const list = res?.data?.results || res?.data?.apiKeys || res?.data || [];
      setApiKeys(Array.isArray(list) ? list : []);
    } catch (err) {
      console.warn("Failed to fetch API keys:", err);
    }
  };

  const fetchDids = async () => {
    try {
      const res = await profileApi.getDids();
      const list = res?.data?.dids || res?.data || [];
      setDids(Array.isArray(list) ? list : []);
    } catch (err) {
      console.warn("Failed to fetch DIDs:", err);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchApiKeys();
    fetchDids();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUpdateProfile = async (values) => {
    setSavingProfile(true);
    try {
      await profileApi.updateMyProfile(values);
      message.success("Profile updated successfully!");
      fetchProfile();
    } catch (err) {
      message.error(err?.message || "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (values) => {
    setChangingPass(true);
    try {
      await profileApi.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      message.success("Password changed successfully!");
      formPassword.resetFields();
    } catch (err) {
      message.error(err?.message || "Failed to change password");
    } finally {
      setChangingPass(false);
    }
  };

  const handleAvatarUpload = async ({ file }) => {
    setUploadingAvatar(true);
    try {
      await profileApi.uploadAvatar(file);
      message.success("Avatar uploaded successfully!");
      fetchProfile();
    } catch (err) {
      message.error(err?.message || "Failed to upload avatar");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleDeleteAvatar = async () => {
    try {
      await profileApi.deleteAvatar();
      message.success("Avatar removed");
      fetchProfile();
    } catch (err) {
      message.error(err?.message || "Failed to remove avatar");
    }
  };

  const handleDocumentUpload = async ({ file }) => {
    setUploadingDoc(true);
    try {
      await profileApi.uploadDocument(file);
      message.success("Document uploaded successfully!");
    } catch (err) {
      message.error(err?.message || "Failed to upload document");
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleCreateApiKey = async (values) => {
    setCreatingKey(true);
    try {
      await profileApi.createApiKey(values.name);
      message.success("API key generated successfully!");
      formApiKey.resetFields();
      fetchApiKeys();
    } catch (err) {
      message.error(err?.message || "Failed to generate API key");
    } finally {
      setCreatingKey(false);
    }
  };

  const handleRevokeApiKey = async (id) => {
    try {
      await profileApi.revokeApiKey(id);
      message.success("API key revoked");
      fetchApiKeys();
    } catch (err) {
      message.error(err?.message || "Failed to revoke API key");
    }
  };

  const handleRotateApiKey = async (id, name) => {
    try {
      await profileApi.rotateApiKey(id, name);
      message.success("API key rotated");
      fetchApiKeys();
    } catch (err) {
      message.error(err?.message || "Failed to rotate API key");
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    message.success("Copied to clipboard!");
  };

  const apiKeyColumns = [
    {
      title: "Key Name",
      dataIndex: "name",
      key: "name",
      render: (name) => <span style={{ fontWeight: 600 }}>{name || "Default Key"}</span>,
    },
    {
      title: "Key / Token",
      dataIndex: "key",
      key: "key",
      render: (key, record) => {
        const displayKey = key || record.token || record.id || "sk_live_...";
        return (
          <Space>
            <code style={{ fontSize: 12 }}>{String(displayKey).slice(0, 16)}...</code>
            <Button
              type="text"
              icon={<CopyOutlined />}
              size="small"
              onClick={() => copyToClipboard(displayKey)}
            />
          </Space>
        );
      },
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date) => (date ? new Date(date).toLocaleDateString() : "Active"),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            icon={<SyncOutlined />}
            onClick={() => handleRotateApiKey(record.id, record.name)}
          >
            Rotate
          </Button>
          <Popconfirm
            title="Revoke this API key?"
            onConfirm={() => handleRevokeApiKey(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button size="small" danger icon={<DeleteOutlined />}>
              Revoke
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const didColumns = [
    {
      title: "Decentralized Identifier (DID)",
      dataIndex: "did",
      key: "did",
      render: (did) => (
        <Space>
          <code>{did}</code>
          <Button
            type="text"
            icon={<CopyOutlined />}
            size="small"
            onClick={() => copyToClipboard(did)}
          />
        </Space>
      ),
    },
    {
      title: "Method",
      dataIndex: "method",
      key: "method",
      render: (m, r) => <Tag color="blue">{m || r.key_type || "indy / ed25519"}</Tag>,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: () => <Tag color="green">Active</Tag>,
    },
  ];

  return (
    <DashboardLayout>
      <div className="profile-page-container">
        <Card className="profile-card" loading={loading}>
          <div className="profile-header-banner">
            <div className="profile-avatar-wrapper">
              <Avatar
                size={72}
                src={profileData?.avatarUrl || profileData?.avatar}
                icon={<UserOutlined />}
                style={{ backgroundColor: "#2563eb" }}
              />
            </div>
            <div className="profile-user-info">
              <h2>{profileData?.username || user?.username || "SSI User"}</h2>
              <p>
                {profileData?.email || user?.email} •{" "}
                <Tag color="cyan">{(profileData?.role || user?.role || "holder").toUpperCase()}</Tag>
              </p>
            </div>
          </div>

          <Tabs
            className="profile-tabs"
            defaultActiveKey="general"
            items={[
              {
                key: "general",
                label: "Account Details",
                children: (
                  <div className="profile-tab-content">
                    <Form
                      form={formProfile}
                      layout="vertical"
                      onFinish={handleUpdateProfile}
                    >
                      <Form.Item name="username" label="Username">
                        <Input disabled prefix={<UserOutlined />} />
                      </Form.Item>
                      <Form.Item name="email" label="Email Address">
                        <Input disabled />
                      </Form.Item>
                      <Form.Item name="organization" label="Organization / Agency">
                        <Input placeholder="Enter organization name" />
                      </Form.Item>
                      <Form.Item name="role" label="SSI Role">
                        <Input disabled />
                      </Form.Item>
                      <Button
                        type="primary"
                        htmlType="submit"
                        loading={savingProfile}
                      >
                        Save Changes
                      </Button>
                    </Form>
                  </div>
                ),
              },
              {
                key: "security",
                label: "Security & Password",
                children: (
                  <div className="profile-tab-content" style={{ maxWidth: 450 }}>
                    <Form
                      form={formPassword}
                      layout="vertical"
                      onFinish={handleChangePassword}
                    >
                      <Form.Item
                        name="currentPassword"
                        label="Current Password"
                        rules={[{ required: true, message: "Enter your current password" }]}
                      >
                        <Input.Password prefix={<LockOutlined />} />
                      </Form.Item>
                      <Form.Item
                        name="newPassword"
                        label="New Password"
                        rules={[
                          { required: true, message: "Enter a new password" },
                          { min: 8, message: "Password must be at least 8 characters" },
                        ]}
                      >
                        <Input.Password prefix={<LockOutlined />} />
                      </Form.Item>
                      <Form.Item
                        name="confirmPassword"
                        label="Confirm New Password"
                        dependencies={["newPassword"]}
                        rules={[
                          { required: true, message: "Confirm your new password" },
                          ({ getFieldValue }) => ({
                            validator(_, value) {
                              if (!value || getFieldValue("newPassword") === value) {
                                return Promise.resolve();
                              }
                              return Promise.reject(new Error("Passwords do not match"));
                            },
                          }),
                        ]}
                      >
                        <Input.Password prefix={<LockOutlined />} />
                      </Form.Item>
                      <Button
                        type="primary"
                        htmlType="submit"
                        loading={changingPass}
                      >
                        Update Password
                      </Button>
                    </Form>
                  </div>
                ),
              },
              {
                key: "avatar-docs",
                label: "Avatar & Documents",
                children: (
                  <div className="profile-tab-content">
                    <h3>Profile Avatar</h3>
                    <Space style={{ marginBottom: 24 }}>
                      <Upload
                        customRequest={handleAvatarUpload}
                        showUploadList={false}
                        accept="image/*"
                      >
                        <Button icon={<UploadOutlined />} loading={uploadingAvatar}>
                          Upload Avatar
                        </Button>
                      </Upload>
                      {profileData?.avatar && (
                        <Button danger onClick={handleDeleteAvatar}>
                          Remove Avatar
                        </Button>
                      )}
                    </Space>

                    <h3>Supporting Verification Documents</h3>
                    <p style={{ color: "#64748b" }}>
                      Upload identity certificates, verification proof PDFs, or agency authorization letters.
                    </p>
                    <Upload
                      customRequest={handleDocumentUpload}
                      showUploadList={false}
                      accept=".pdf,.png,.jpg,.jpeg,.zip"
                    >
                      <Button icon={<FileDoneOutlined />} loading={uploadingDoc}>
                        Upload Document
                      </Button>
                    </Upload>
                  </div>
                ),
              },
              {
                key: "apikeys",
                label: "API Keys & Integrations",
                children: (
                  <div className="profile-tab-content">
                    <Form
                      form={formApiKey}
                      layout="inline"
                      onFinish={handleCreateApiKey}
                      style={{ marginBottom: 16 }}
                    >
                      <Form.Item
                        name="name"
                        rules={[{ required: true, message: "Key label required" }]}
                      >
                        <Input placeholder="Key Label (e.g. M2M Automation)" />
                      </Form.Item>
                      <Button
                        type="primary"
                        htmlType="submit"
                        icon={<PlusOutlined />}
                        loading={creatingKey}
                      >
                        Generate API Key
                      </Button>
                    </Form>

                    <Table
                      className="profile-api-keys-table"
                      columns={apiKeyColumns}
                      dataSource={apiKeys}
                      rowKey={(k) => k.id || k.key || Math.random()}
                      pagination={false}
                    />
                  </div>
                ),
              },
              {
                key: "dids",
                label: "Sovereign DIDs",
                children: (
                  <div className="profile-tab-content">
                    <p style={{ color: "#64748b" }}>
                      Cryptographic Decentralized Identifiers (DIDs) provisioned inside your secure subwallet.
                    </p>
                    <Table
                      columns={didColumns}
                      dataSource={
                        dids.length > 0
                          ? dids
                          : profileData?.did
                          ? [{ did: profileData.did, method: "indy", status: "active" }]
                          : []
                      }
                      rowKey={(d) => d.did || Math.random()}
                      pagination={false}
                    />
                  </div>
                ),
              },
            ]}
          />
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ProfilePage;
