/**
 * WebSocket Client for SSI Backend (/ws)
 * Real-time event streaming for connections, credential offers, proofs, basicmessages & notifications.
 */

import { store } from "../store/store";
import { addNotification } from "../store/slices/notificationsSlice";
import { addIncomingMessage } from "../store/slices/messagingSlice";
import { fetchConnectionsList } from "../store/slices/connectionsSlice";
import { fetchStoredCredentials, fetchCredentialOffers } from "../store/slices/holderSlice";
import { fetchRecordedSchemas, fetchRecordedCredDefs } from "../store/slices/issuerSlice";
import { fetchVerifications } from "../store/slices/verifierSlice";
import { getManualAuthToken } from "./api/client";

class SSIWebSocketClient {
  constructor() {
    this.ws = null;
    this.reconnectTimer = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.baseDelay = 2000;
    this.isConnected = false;
    this.listeners = new Map();
    this.user = null;
  }

  getWebSocketUrl() {
    const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";
    try {
      const parsed = new URL(apiBase);
      const wsProtocol = parsed.protocol === "https:" ? "wss:" : "ws:";
      return `${wsProtocol}//${parsed.host}/ws`;
    } catch {
      const loc = window.location;
      const wsProtocol = loc.protocol === "https:" ? "wss:" : "ws:";
      return `${wsProtocol}//${loc.hostname}:5000/ws`;
    }
  }

  connect(user = null) {
    if (user) {
      this.user = user;
    }

    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const wsUrl = this.getWebSocketUrl();
    const token = getManualAuthToken() || localStorage.getItem("ssi_auth_token") || localStorage.getItem("ssi_api_key");

    try {
      // Pass token as subprotocol if available so backend sec-websocket-protocol parser can authenticate
      if (token) {
        this.ws = new WebSocket(wsUrl, [token]);
      } else {
        this.ws = new WebSocket(wsUrl);
      }

      this.ws.onopen = () => {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        console.log(`[WebSocket] Connected to ${wsUrl}`);
        this.emit("status", { connected: true });
      };

      this.ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          this.handleIncomingEvent(payload);
        } catch (err) {
          console.warn("[WebSocket] Failed to parse message:", event.data, err);
        }
      };

      this.ws.onerror = (err) => {
        console.warn("[WebSocket] Connection error:", err);
      };

      this.ws.onclose = (event) => {
        this.isConnected = false;
        this.emit("status", { connected: false, code: event.code, reason: event.reason });
        console.log(`[WebSocket] Disconnected (code ${event.code}). Attempting reconnect...`);
        this.scheduleReconnect();
      };
    } catch (err) {
      console.warn("[WebSocket] Setup failed:", err);
      this.scheduleReconnect();
    }
  }

  scheduleReconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn("[WebSocket] Maximum reconnect attempts reached. Stopping.");
      return;
    }

    const delay = Math.min(this.baseDelay * Math.pow(1.5, this.reconnectAttempts), 30000);
    this.reconnectAttempts++;
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.reconnectAttempts = 0;
    if (this.ws) {
      try {
        this.ws.close(1000, "Normal closure by user");
      } catch {
        // ignore
      }
      this.ws = null;
    }
    this.isConnected = false;
  }

  handleIncomingEvent(payload) {
    if (!payload) return;

    // Connected handshake
    if (payload.event === "connected") {
      console.log("[WebSocket] Handshake acknowledged by backend:", payload.message);
      this.emit("connected", payload);
      return;
    }

    const topic = payload.topic || payload.event || payload.type;
    const data = payload.data || payload;

    // Dispatches to listeners
    this.emit(topic, payload);
    this.emit("*", payload);

    // Auto-update Redux store based on topic
    switch (topic) {
      case "notifications":
      case "notification":
        store.dispatch(
          addNotification({
            id: data.id || `notif-${Date.now()}`,
            title: data.title || "Notification",
            message: data.message || data.description || "New system notification",
            type: data.type || "info",
            payload: data,
          })
        );
        break;

      case "basicmessages":
      case "basicmessage":
        store.dispatch(
          addIncomingMessage({
            id: data.message_id || data.id || `msg-${Date.now()}`,
            connection_id: data.connection_id,
            content: data.content || data.message || "",
            sent_time: data.sent_time || new Date().toISOString(),
            direction: "incoming",
            state: "received",
          })
        );
        // Also trigger notification
        store.dispatch(
          addNotification({
            title: "New Message",
            message: `Message from connection: ${data.content || "New message received"}`,
            type: "info",
          })
        );
        break;

      case "connections":
      case "connection":
        store.dispatch(fetchConnectionsList());
        store.dispatch(
          addNotification({
            title: "Connection Updated",
            message: `Connection ${data.connection_id || ""} is now ${data.state || "active"}`,
            type: "info",
          })
        );
        break;

      case "issue_credential_v2_0":
      case "credentials":
      case "credential":
        store.dispatch(fetchStoredCredentials());
        store.dispatch(fetchCredentialOffers());
        store.dispatch(fetchRecordedSchemas());
        store.dispatch(fetchRecordedCredDefs());
        store.dispatch(
          addNotification({
            title: "Credential Update",
            message: `Credential exchange state: ${payload.state || data.state || "updated"}`,
            type: "success",
          })
        );
        break;

      case "present_proof_v2_0":
      case "proof":
      case "proofs":
        store.dispatch(fetchVerifications());
        store.dispatch(
          addNotification({
            title: "Proof Presentation Update",
            message: `Proof state changed to: ${payload.state || data.state || "updated"}`,
            type: "info",
          })
        );
        break;

      default:
        break;
    }
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      for (const cb of this.listeners.get(event)) {
        try {
          cb(data);
        } catch (e) {
          console.warn(`[WebSocket] Listener error on event '${event}':`, e);
        }
      }
    }
  }
}

export const websocketClient = new SSIWebSocketClient();
export default websocketClient;
