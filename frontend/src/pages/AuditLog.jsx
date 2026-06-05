import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { Download, ChevronDown, ChevronUp } from 'lucide-react';
import useAegisStore from '../store/aegisStore';

export default function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [expanded, setExpanded] = useState({});
  
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await axios.get('http://localhost:8001/api/audit/events?limit=50');
        setLogs(res.data);
      } catch (e) {
        console.error(e);
      }
    };
    fetchLogs();
  }, []);

  const toggleRow = (id) => {
    setExpanded(prev => ({...prev, [id]: !prev[id]}));
  };

  const downloadFile = (url) => {
    window.open(url, '_blank');
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 card-border p-4">
        <div className="flex gap-4 w-full md:w-auto">
          <input type="text" placeholder="Search events..." className="bg-aegis-surface border border-aegis-border rounded p-2 text-sm text-aegis-text-primary focus:outline-none focus:border-aegis-green w-full md:w-64" />
          <select className="bg-aegis-surface border border-aegis-border rounded p-2 text-sm text-aegis-text-primary">
            <option value="">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
        <div className="flex gap-4">
          <button onClick={() => downloadFile('http://localhost:8001/api/audit/export/csv')} className="flex items-center gap-2 px-3 py-2 rounded text-sm font-medium border border-aegis-border hover:bg-aegis-surface transition-colors">
            <Download className="w-4 h-4" /> CSV
          </button>
          <button onClick={() => downloadFile('http://localhost:8001/api/audit/export/pdf')} className="flex items-center gap-2 px-3 py-2 rounded text-sm font-medium bg-aegis-green text-black hover:bg-aegis-green-dim transition-colors">
            <Download className="w-4 h-4" /> PDF Report
          </button>
        </div>
      </div>

      <div className="card-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-aegis-surface border-b border-aegis-border text-xs text-aegis-text-secondary uppercase">
                <th className="p-3">Time</th>
                <th className="p-3">Severity</th>
                <th className="p-3">Agent</th>
                <th className="p-3">Decision</th>
                <th className="p-3">Summary</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-aegis-text-muted">No events recorded yet. Run a simulation to see results.</td>
                </tr>
              ) : (
                logs.map((log) => (
                  <React.Fragment key={log.id}>
                    <tr onClick={() => toggleRow(log.id)} className="border-b border-aegis-border hover:bg-aegis-surface cursor-pointer transition-colors">
                      <td className="p-3 text-aegis-text-secondary whitespace-nowrap">{format(new Date(log.timestamp), 'HH:mm:ss')}</td>
                      <td className="p-3"><span className={`severity-${log.severity} font-bold text-xs`}>{log.severity}</span></td>
                      <td className="p-3 font-mono text-xs">{log.agent_name}</td>
                      <td className={`p-3 font-bold text-xs ${log.decision === 'BLOCKED' ? 'text-aegis-red' : log.decision === 'APPROVED' ? 'text-aegis-green' : 'text-aegis-amber'}`}>{log.decision}</td>
                      <td className="p-3 truncate max-w-xs">{log.input_summary}</td>
                      <td className="p-3 text-aegis-text-secondary">{expanded[log.id] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}</td>
                    </tr>
                    {expanded[log.id] && (
                      <tr className="bg-[#0a0d14]">
                        <td colSpan="6" className="p-4 border-b border-aegis-border">
                          <pre className="text-xs text-aegis-text-secondary overflow-x-auto whitespace-pre-wrap">{JSON.stringify(JSON.parse(log.details || '{}'), null, 2)}</pre>
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
    </div>
  );
}
