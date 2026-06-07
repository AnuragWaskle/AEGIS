import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_BASE = 'https://aegis-backend-idbk.onrender.com';

/**
 * useAuditLog — fetches audit events with filter params and auto-refreshes.
 * Spec: hooks/useAuditLog.js
 */
export function useAuditLog({
  limit = 50,
  severity = '',
  agent = '',
  search = '',
  since = '',
  refreshInterval = 15000,
} = {}) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit });
      if (severity) params.set('severity', severity);
      if (agent) params.set('agent', agent);
      if (search) params.set('search', search);
      if (since) params.set('since', since);

      const res = await axios.get(`${API_BASE}/api/audit/events?${params}`);
      setLogs(res.data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [limit, severity, agent, search, since]);

  useEffect(() => {
    fetchLogs();
    if (refreshInterval > 0) {
      const interval = setInterval(fetchLogs, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchLogs, refreshInterval]);

  return { logs, loading, error, refetch: fetchLogs };
}
