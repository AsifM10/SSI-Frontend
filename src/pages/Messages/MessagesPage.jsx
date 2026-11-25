import { useEffect, useState, useRef } from "react";
import { Input, Button, Avatar, Tag, Empty, message, Popconfirm } from "antd";
import {
  SendOutlined,
  UserOutlined,
  SyncOutlined,
  DeleteOutlined,
  MessageOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import DashboardLayout from "../../layouts/DashboardLayout/DashboardLayout";
import {
  fetchBasicMessages,
  sendBasicMessage,
  deleteBasicMessage,
  selectMessages,
  selectActiveConnectionId,
  setActiveConnection,
  selectMessagingSending,
} from "../../store/slices/messagingSlice";
import {
  fetchConnectionsList,
  selectConnections,
} from "../../store/slices/connectionsSlice";
import "./MessagesPage.css";

export const MessagesPage = () => {
  const dispatch = useDispatch();
  const connections = useSelector(selectConnections);
  const messages = useSelector(selectMessages);
  const activeConnectionId = useSelector(selectActiveConnectionId);
  const sending = useSelector(selectMessagingSending);

  const [inputContent, setInputContent] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    dispatch(fetchConnectionsList());
    dispatch(fetchBasicMessages());
  }, [dispatch]);

  // Set default active connection if none selected
  useEffect(() => {
    if (!activeConnectionId && connections.length > 0) {
      const firstActive = connections.find((c) => c.state === "active") || connections[0];
      const connId = firstActive.connection_id || firstActive.id;
      if (connId) {
        dispatch(setActiveConnection(connId));
      }
    }
  }, [connections, activeConnectionId, dispatch]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeConnectionId]);

  const activeConnection = connections.find(
    (c) => (c.connection_id || c.id) === activeConnectionId
  );

  const connectionMessages = messages.filter(
    (m) => (m.connection_id || m.connectionId) === activeConnectionId
  );

  const handleSend = async () => {
    if (!inputContent.trim()) return;
    if (!activeConnectionId) {
      message.warning("Select an active connection to message");
      return;
    }

    try {
      await dispatch(
        sendBasicMessage({
          connectionId: activeConnectionId,
          content: inputContent.trim(),
        })
      ).unwrap();
      setInputContent("");
    } catch (err) {
      message.error(err?.message || "Failed to send message");
    }
  };

  const handleDeleteMessage = (msgId) => {
    dispatch(deleteBasicMessage(msgId));
    message.success("Message removed");
  };

  const handleRefresh = () => {
    dispatch(fetchBasicMessages());
    dispatch(fetchConnectionsList());
  };

  return (
    <DashboardLayout>
      <div className="messages-page-layout">
        {/* Left: Connection List */}
        <div className="messages-connections-sidebar">
          <div className="messages-sidebar-header">
            <span>Conversations</span>
            <Button
              type="text"
              icon={<SyncOutlined />}
              size="small"
              onClick={handleRefresh}
              style={{ float: "right" }}
            />
          </div>
          <div className="messages-connections-list">
            {connections.length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No connections found"
                style={{ marginTop: 40 }}
              />
            ) : (
              connections.map((c) => {
                const connId = c.connection_id || c.id;
                const isActive = connId === activeConnectionId;
                const isOnline = c.state === "active" || c.rfc_0023_state === "completed";
                return (
                  <div
                    key={connId}
                    className={`messages-connection-item ${isActive ? "active" : ""}`}
                    onClick={() => dispatch(setActiveConnection(connId))}
                  >
                    <Avatar
                      icon={<UserOutlined />}
                      style={{
                        backgroundColor: isActive ? "#2563eb" : "#94a3b8",
                      }}
                    />
                    <div className="messages-connection-info">
                      <div className="messages-connection-name">
                        {c.their_label || c.alias || `Conn ${String(connId).slice(0, 8)}`}
                      </div>
                      <div className="messages-connection-state">
                        <Tag color={isOnline ? "green" : "orange"}>
                          {c.state || "unknown"}
                        </Tag>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Chat Thread */}
        <div className="messages-chat-area">
          {activeConnection ? (
            <>
              <div className="messages-chat-header">
                <div className="messages-chat-header-title">
                  {activeConnection.their_label ||
                    activeConnection.alias ||
                    `Connection: ${activeConnectionId}`}
                </div>
                <div>
                  <Tag color="blue">{activeConnection.state || "active"}</Tag>
                </div>
              </div>

              <div className="messages-chat-history">
                {connectionMessages.length === 0 ? (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="No messages yet in this conversation. Say hello!"
                    style={{ margin: "auto" }}
                  />
                ) : (
                  connectionMessages.map((msg) => {
                    const isOutgoing =
                      msg.direction === "outgoing" ||
                      msg.state === "sent" ||
                      msg.sender === "me";
                    const msgId = msg.id || msg.message_id;

                    return (
                      <div
                        key={msgId}
                        className={`messages-bubble-container ${
                          isOutgoing ? "outgoing" : "incoming"
                        }`}
                      >
                        <div
                          className={`messages-bubble ${
                            isOutgoing ? "outgoing" : "incoming"
                          }`}
                        >
                          {msg.content || msg.text}
                        </div>
                        <div className="messages-bubble-meta">
                          <span>
                            {msg.sent_time
                              ? new Date(msg.sent_time).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "Just now"}
                          </span>
                          <Popconfirm
                            title="Delete this message?"
                            onConfirm={() => handleDeleteMessage(msgId)}
                            okText="Yes"
                            cancelText="No"
                          >
                            <Button
                              type="text"
                              size="small"
                              danger
                              icon={<DeleteOutlined />}
                              style={{ padding: 0, height: "auto" }}
                            />
                          </Popconfirm>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="messages-chat-input-area">
                <Input.TextArea
                  value={inputContent}
                  onChange={(e) => setInputContent(e.target.value)}
                  placeholder="Type a DIDComm message..."
                  autoSize={{ minRows: 1, maxRows: 3 }}
                  onPressEnter={(e) => {
                    if (!e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                />
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  loading={sending}
                  onClick={handleSend}
                >
                  Send
                </Button>
              </div>
            </>
          ) : (
            <div className="messages-empty-chat">
              <Empty
                icon={<MessageOutlined style={{ fontSize: 48, color: "#94a3b8" }} />}
                description="Select a connection from the left to start messaging"
              />
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MessagesPage;
