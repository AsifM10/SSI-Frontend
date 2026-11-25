import { useEffect } from "react";
import { Table, Button, Space, Tag, Popconfirm, Card, message } from "antd";
import { CheckOutlined, DeleteOutlined, ClearOutlined, SyncOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import DashboardLayout from "../../layouts/DashboardLayout/DashboardLayout";
import {
  selectNotifications,
  selectNotificationsLoading,
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  clearAllNotifications,
} from "../../store/slices/notificationsSlice";
import "./NotificationsPage.css";

export const NotificationsPage = () => {
  const dispatch = useDispatch();
  const notifications = useSelector(selectNotifications);
  const loading = useSelector(selectNotificationsLoading);

  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  const handleRefresh = () => {
    dispatch(fetchNotifications());
  };

  const handleMarkRead = (id) => {
    dispatch(markNotificationRead(id));
    message.success("Marked as read");
  };

  const handleMarkAllRead = () => {
    dispatch(markAllNotificationsRead());
    message.success("All notifications marked as read");
  };

  const handleDelete = (id) => {
    dispatch(deleteNotification(id));
    message.success("Notification deleted");
  };

  const handleClearAll = () => {
    dispatch(clearAllNotifications());
    message.success("All notifications cleared");
  };

  const columns = [
    {
      title: "Status",
      dataIndex: "isRead",
      key: "isRead",
      width: 100,
      render: (isRead) =>
        isRead ? (
          <Tag color="default">Read</Tag>
        ) : (
          <Tag color="processing">Unread</Tag>
        ),
    },
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      width: 220,
      render: (text, record) => (
        <span style={{ fontWeight: record.isRead ? 400 : 600 }}>{text || "Notification"}</span>
      ),
    },
    {
      title: "Message",
      dataIndex: "message",
      key: "message",
      render: (msg) => <span style={{ color: "#475569" }}>{msg}</span>,
    },
    {
      title: "Time",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 180,
      render: (time) =>
        time ? new Date(time).toLocaleString() : "Recently",
    },
    {
      title: "Actions",
      key: "actions",
      width: 140,
      render: (_, record) => (
        <Space size="small">
          {!record.isRead && (
            <Button
              type="text"
              icon={<CheckOutlined />}
              title="Mark as read"
              onClick={() => handleMarkRead(record.id)}
            />
          )}
          <Popconfirm
            title="Delete this notification?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="text" danger icon={<DeleteOutlined />} title="Delete" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <div className="notifications-page-container">
        <div className="notifications-page-header">
          <h2>Notifications Center</h2>
          <Space>
            <Button icon={<SyncOutlined />} onClick={handleRefresh}>
              Refresh
            </Button>
            <Button icon={<CheckOutlined />} onClick={handleMarkAllRead}>
              Mark all read
            </Button>
            <Popconfirm
              title="Clear all notifications?"
              onConfirm={handleClearAll}
              okText="Yes"
              cancelText="No"
            >
              <Button danger icon={<ClearOutlined />}>
                Clear all
              </Button>
            </Popconfirm>
          </Space>
        </div>

        <Card className="notifications-table-card">
          <Table
            columns={columns}
            dataSource={notifications}
            rowKey={(item) => item.id || `notif-${Math.random()}`}
            loading={loading}
            pagination={{ pageSize: 10 }}
          />
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default NotificationsPage;
