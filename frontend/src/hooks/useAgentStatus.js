import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:8001';

/**
 * useAgentStatus — polls /api/agent/status every 10 seconds.
 * Returns live status of Sanitizer, Governor, Auditor including Ollama/Groq health.
 * Spec: hooks/useAgentStatus.js
 */
export function useAgentStatus(pollInterval = 10000) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    const fetchStatus = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/agent/status`, { timeout: 5000 });
        if (mounted) {
          setStatus(res.data);
          setError(null);
        }
      } catch (e) {
        if (mounted) {
          setError(e.message);
          // Keep last known status if available, just mark error
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, pollInterval);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [pollInterval]);

  const isOnline = (agentName) => {
    if (!status) return false;
    return status.agents?.[agentName.toLowerCase()]?.status === 'ONLINE';
  };

  const getModel = (agentName) => {
    return status?.agents?.[agentName.toLowerCase()]?.model || '—';
  };

  const isUsingGroq = (agentName) => {
    return status?.agents?.[agentName.toLowerCase()]?.using_groq_fallback || false;
  };

  return {
    status,
    loading,
    error,
    isOnline,
    getModel,
    isUsingGroq,
    ollamaOnline: status?.ollama?.online ?? false,
    uptimeHuman: status?.uptime_human || '—',
  };
}
