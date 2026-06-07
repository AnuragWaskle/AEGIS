import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { Download, ChevronDown, ChevronUp, Search, Filter, ChevronLeft, ChevronRight, X } from 'lucide-react';

const SEVERITY_TEXT = {
  CRITICAL: 'text-red-600',
  HIGH: 'text-amber-600',
  MEDIUM: 'text-blue-600',
  LOW: 'text-emerald-600',
};

const DECISION_TEXT = {
  BLOCKED: 'text-red-600',
  APPROVED: 'text-emerald-600',
  FLAGGED: 'text-amber-600',
  EXECUTED: 'text-emerald-600',
};

const BLAST_TEXT = {
  CATASTROPHIC: 'text-red-600 font-bold',
  HIGH: 'text-amber-600',
  MEDIUM: 'text-blue-600',
  LOW: 'text-emerald-600',
  MINIMAL: 'text-emerald-600',
};

const PAGE_SIZE = 25;

export default function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [expanded, setExpanded] = useState({});
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  // ─── Filter state ───────────────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [severity, setSeverity] = useState('');
  const [agentFilter, setAgentFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const buildQuery = useCallback(() => {
    const params = new URLSearchParams();
    params.set('limit', PAGE_SIZE);
    if (severity) params.set('severity', severity);
    if (search) params.set('search', search);
    if (agentFilter) params.set('agent', agentFilter);
    if (dateFrom) params.set('since', new Date(dateFrom).toISOString());
    return params.toString();
  }, [severity, search, agentFilter, dateFrom, page]);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const query = buildQuery();
      const res = await axios.get(`https://aegis-backend-idbk.onrender.com/api/audit/events?${query}`);
      let data = res.data;

      // Client-side date-to filter (since API only has since=)
      if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        data = data.filter(e => new Date(e.timestamp) <= toDate);
      }

      setTotalCount(data.length);
      // Client-side pagination
      const start = (page - 1) * PAGE_SIZE;
      setLogs(data.slice(start, start + PAGE_SIZE));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [buildQuery, dateTo, page]);

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 15000);
    return () => clearInterval(interval);
  }, [fetchLogs]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [severity, agentFilter, search, dateFrom, dateTo]);

  const toggleRow = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  const downloadFile = (type) => window.open(`https://aegis-backend-idbk.onrender.com/api/audit/export/${type}`, '_blank');

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  const clearFilters = () => {
    setSearch('');
    setSearchInput('');
    setSeverity('');
    setAgentFilter('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const hasFilters = search || severity || agentFilter || dateFrom || dateTo;

  return (
    <div className="flex flex-col gap-6">
      {/* ─── Filter Bar ─────────────────────────────────────────────────── */}
      <div className="card-border p-4 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-3 flex-wrap">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-[200px]">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-aegis-text-muted" />
              <input
                type="text"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder="Search events..."
                className="w-full bg-aegis-surface border border-aegis-border rounded pl-8 pr-3 py-2 text-sm text-aegis-text-primary focus:outline-none focus:border-aegis-green transition-colors"
              />
            </div>
            <button type="submit" className="px-3 py-2 rounded bg-aegis-green text-black text-sm font-bold hover:bg-aegis-green-dim transition-colors">
              Search
            </button>
          </form>

          {/* Risk Level */}
          <select
            value={severity}
            onChange={e => setSeverity(e.target.value)}
            className="bg-aegis-surface border border-aegis-border rounded px-3 py-2 text-sm text-aegis-text-primary focus:outline-none focus:border-aegis-green"
          >
            <option value="">All Risk Levels</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          {/* Agent */}
          <select
            value={agentFilter}
            onChange={e => setAgentFilter(e.target.value)}
            className="bg-aegis-surface border border-aegis-border rounded px-3 py-2 text-sm text-aegis-text-primary focus:outline-none focus:border-aegis-green"
          >
            <option value="">All Agents</option>
            <option value="SANITIZER">Safety Scanner (Sanitizer)</option>
            <option value="GOVERNOR">Rule Enforcer (Governor)</option>
            <option value="AUDITOR">Activity Logger (Auditor)</option>
            <option value="MAIN_AGENT">Main Agent</option>
            <option value="SYSTEM">System</option>
          </select>

          {/* Date range */}
          <div className="flex gap-2 items-center">
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="bg-aegis-surface border border-aegis-border rounded px-3 py-2 text-sm text-aegis-text-primary focus:outline-none focus:border-aegis-green"
              title="From date"
            />
            <span className="text-aegis-text-muted text-xs">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="bg-aegis-surface border border-aegis-border rounded px-3 py-2 text-sm text-aegis-text-primary focus:outline-none focus:border-aegis-green"
              title="To date"
            />
          </div>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-3 py-2 text-sm text-aegis-text-muted hover:text-aegis-text-primary border border-aegis-border rounded hover:bg-aegis-surface transition-colors"
            >
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          )}
        </div>

        {/* Download buttons */}
        <div className="flex gap-3 flex-wrap items-center justify-between">
          <div className="text-xs text-aegis-text-muted font-mono">
            {loading ? 'Loading...' : `${totalCount} events`}
            {hasFilters && <span className="text-aegis-amber ml-2">· filters active</span>}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => downloadFile('csv')}
              className="flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium border border-aegis-border hover:bg-aegis-surface transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> CSV
            </button>
            <button
              onClick={() => downloadFile('pdf')}
              className="flex items-center gap-2 px-3 py-1.5 rounded text-sm font-bold bg-aegis-green text-black hover:bg-aegis-green-dim transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> PDF Report
            </button>
          </div>
        </div>
      </div>

      {/* ─── Table ──────────────────────────────────────────────────────── */}
      <div className="card-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-aegis-surface border-b border-aegis-border text-xs text-aegis-text-secondary uppercase tracking-wider">
                <th className="p-3 whitespace-nowrap">Timestamp</th>
                <th className="p-3">Risk Level</th>
                <th className="p-3">Event Type</th>
                <th className="p-3">Agent</th>
                <th className="p-3">Action Check</th>
                <th className="p-3">Impact Level</th>
                <th className="p-3 max-w-xs">Input Summary</th>
                <th className="p-3 w-8"></th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-aegis-border">
              {loading && logs.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-aegis-text-muted">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-aegis-green border-t-transparent rounded-full animate-spin" />
                      Loading events...
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-aegis-text-muted">
                    No events recorded yet. Run a simulation to see results.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <React.Fragment key={log.id}>
                    <tr
                      onClick={() => toggleRow(log.id)}
                      className="hover:bg-aegis-surface/60 cursor-pointer transition-colors"
                    >
                      <td className="p-3 text-aegis-text-secondary whitespace-nowrap font-mono text-xs">
                        {format(new Date(log.timestamp), 'MM-dd HH:mm:ss')}
                      </td>
                      <td className="p-3">
                        <span className={`font-bold text-xs font-mono ${SEVERITY_TEXT[log.severity] || 'text-aegis-text-secondary'}`}>
                          {log.severity}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-xs text-aegis-text-secondary whitespace-nowrap">{log.event_type}</td>
                      <td className="p-3 font-mono text-xs whitespace-nowrap">{log.agent_name}</td>
                      <td className={`p-3 font-bold text-xs font-mono ${DECISION_TEXT[log.decision] || ''}`}>{log.decision}</td>
                      <td className="p-3">
                        {log.blast_radius_score != null ? (
                          <span className={`text-xs font-mono ${BLAST_TEXT[log.blast_radius_category] || ''}`}>
                            {log.blast_radius_score}/100
                            {log.blast_radius_category && (
                              <span className="ml-1 opacity-70">({log.blast_radius_category})</span>
                            )}
                          </span>
                        ) : (
                          <span className="text-aegis-text-muted text-xs">—</span>
                        )}
                      </td>
                      <td className="p-3 truncate max-w-xs text-xs text-aegis-text-secondary">{log.input_summary}</td>
                      <td className="p-3 text-aegis-text-muted">
                        {expanded[log.id] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </td>
                    </tr>
                    {expanded[log.id] && (
                      <tr className="bg-aegis-black">
                        <td colSpan="8" className="p-4 border-b border-aegis-border">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <div className="text-xs text-aegis-text-muted font-mono mb-1">EVENT DETAILS</div>
                              <pre className="text-xs text-aegis-text-secondary overflow-x-auto whitespace-pre-wrap bg-aegis-surface p-3 rounded border border-aegis-border">
                                {JSON.stringify(JSON.parse(log.details || '{}'), null, 2)}
                              </pre>
                            </div>
                            <div className="flex flex-col gap-2 text-xs">
                              <div className="text-aegis-text-muted font-mono mb-1">METADATA</div>
                              {[
                                ['Event ID', log.id],
                                ['Request ID', log.request_id || '—'],
                                ['Full Timestamp', format(new Date(log.timestamp + (log.timestamp.endsWith('Z') ? '' : 'Z')), 'yyyy-MM-dd HH:mm:ss')],
                                ['Impact Score', log.blast_radius_score != null ? `${log.blast_radius_score}/100 (${log.blast_radius_category})` : '—'],
                              ].map(([k, v]) => (
                                <div key={k} className="flex gap-2">
                                  <span className="text-aegis-text-muted w-36 shrink-0">{k}:</span>
                                  <span className="text-aegis-text-primary font-mono break-all">{v}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Pagination ──────────────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between card-border p-3">
          <span className="text-xs text-aegis-text-muted font-mono">
            Page {page} of {totalPages} · {totalCount} total events
          </span>
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="p-1.5 rounded border border-aegis-border hover:bg-aegis-surface disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = Math.max(1, page - 2) + i;
              if (pageNum > totalPages) return null;
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`px-2.5 py-1 rounded text-xs font-mono border transition-colors ${
                    page === pageNum
                      ? 'border-aegis-green text-aegis-green bg-aegis-green/10'
                      : 'border-aegis-border hover:bg-aegis-surface text-aegis-text-muted'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              className="p-1.5 rounded border border-aegis-border hover:bg-aegis-surface disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
