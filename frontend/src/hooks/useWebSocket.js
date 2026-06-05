import { useEffect, useState, useRef } from 'react';
import useAegisStore from '../store/aegisStore';

export function useWebSocket() {
  const { setConnected, addEvent } = useAegisStore();
  const [lastEvent, setLastEvent] = useState(null);
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

      ws.onmessage = (event) => {
        if (event.data === 'pong') return;
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'NEW_EVENT') {
            addEvent(data.data);
            setLastEvent(data.data);
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

  return { isConnected: useAegisStore(state => state.isConnected), lastEvent };
}
