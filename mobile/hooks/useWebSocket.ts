import { useEffect, useRef } from 'react';
import { useAegisStore } from '../store/aegisStore';
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export function useWebSocket() {
  const { setConnected, addEvent } = useAegisStore();
  const wsRef = useRef(null);
  const reconnectAttempts = useRef(0);

  useEffect(() => {
    let pingInterval;

    const connect = () => {
      if (reconnectAttempts.current >= 5) return;
      
      const ws = new WebSocket('ws://localhost:8001/ws');
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        reconnectAttempts.current = 0;
        pingInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send('ping');
          }
        }, 30000);
      };

      ws.onmessage = async (event) => {
        if (event.data === 'pong') return;
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'NEW_EVENT') {
            addEvent(data.data);
            
            if (data.data.severity === 'CRITICAL') {
              await Notifications.scheduleNotificationAsync({
                content: {
                  title: "🚨 AEGIS: Attack Blocked",
                  body: data.data.input_summary?.substring(0, 100) || "Critical event intercepted.",
                },
                trigger: null,
              });
            }
          }
        } catch (e) {
          console.error("Failed to parse websocket message", e);
        }
      };

      ws.onclose = () => {
        setConnected(false);
        clearInterval(pingInterval);
        const timeout = Math.pow(2, reconnectAttempts.current) * 1000;
        reconnectAttempts.current += 1;
        setTimeout(connect, timeout);
      };
    };

    connect();

    return () => {
      clearInterval(pingInterval);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);
}
