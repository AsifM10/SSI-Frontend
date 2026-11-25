import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { selectUser } from "../store/slices/authSlice";
import { websocketClient } from "../services/websocket";

export const useWebSocket = () => {
  const user = useSelector(selectUser);
  const [connected, setConnected] = useState(websocketClient.isConnected);

  useEffect(() => {
    if (user?.id || user?.userId) {
      websocketClient.connect(user);
    }

    const unbind = websocketClient.on("status", (status) => {
      setConnected(status.connected);
    });

    return () => {
      unbind();
    };
  }, [user]);

  return {
    connected,
    client: websocketClient,
  };
};

export default useWebSocket;
