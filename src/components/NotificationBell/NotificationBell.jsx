import { useEffect, useState } from "react";
import { Badge, Popover, Button, Empty, Tooltip } from "antd";
import { BellOutlined, CheckOutlined } from "@ant-design/icons";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  selectNotifications,
  selectUnreadNotificationsCount,
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../../store/slices/notificationsSlice";
import "./NotificationBell.css";

export const NotificationBell = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const notifications = useSelector(selectNotifications);
  const unreadCount = useSelector(selectUnreadNotificationsCount);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchNotifications({ limit: 10 }));
  }, [dispatch]);

  const handleMarkAllRead = () => {
    dispatch(markAllNotificationsRead());
  };

  const handleItemClick = (id) => {
    dispatch(markNotificationRead(id));
  };

  const popoverContent = (
    <div className="notification-popover-content">
      <div className="notification-popover-header">
        <span style={{ fontWeight: 600 }}>Notifications</span>
        {unreadCount > 0 && (
          <Button
            type="link"
            size="small"
            icon={<CheckOutlined />}
            onClick={handleMarkAllRead}
            style={{ padding: 0 }}
          >
            Mark all read
          </Button>
        )}
      </div>

      <div className="notification-popover-list">
        {notifications.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No notifications" />
        ) : (
          notifications.slice(0, 5).map((item) => (
            <div
              key={item.id}
              className={`notification-item ${!item.isRead ? "unread" : ""}`}
              onClick={() => handleItemClick(item.id)}
            >
              <div className="notification-item-title">{item.title}</div>
              <div className="notification-item-desc">{item.message}</div>
              <div className="notification-item-time">
                {item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now"}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="notification-popover-footer">
        <Button
          type="link"
          size="small"
          onClick={() => {
            setOpen(false);
            navigate("/notifications");
          }}
        >
          View all notifications
        </Button>
      </div>
    </div>
  );

  return (
    <Popover
      content={popoverContent}
      trigger="click"
      open={open}
      onOpenChange={setOpen}
      placement="bottomRight"
    >
      <div className="notification-bell-container">
        <Tooltip title="Notifications">
          <Badge count={unreadCount} overflowCount={99} size="small">
            <BellOutlined className="notification-bell-icon" />
          </Badge>
        </Tooltip>
      </div>
    </Popover>
  );
};

export default NotificationBell;
