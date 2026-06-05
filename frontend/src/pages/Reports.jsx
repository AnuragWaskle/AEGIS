import React, { useState } from 'react';
import { Download, CheckCircle, ShieldAlert, FileText, AlertTriangle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import useAegisStore from '../store/aegisStore';

export default function Reports() {
  const [period, setPeriod] = useState('Last 24h');
  const [isClearing, setIsClearing] = useState(false);

  const events = useAegisStore((state) => state.events);
  const [stats, setStats] = useState({ blocked: 0, total: 0 });

  React.useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get('http://localhost:8001/api/audit/stats');
        setStats({ blocked: res.data.blocked_count, total: res.data.total_events });
      } catch (e) {
        console.error(e);
      }
    };
    fetchStats();
  }, []);

  // Compute real trend data from events (mocked timeline approach removed)
  const realTrendData = React.useMemo(() => {
    // We'll create buckets for the last 6 hours
    const buckets = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 60 * 60 * 1000);
      buckets.push({ time: d.getHours() + ':00', risk: 0 });
    }
    
    events.forEach(e => {
      const eTime = new Date(e.timestamp);
      const diffHours = Math.floor((now - eTime) / (1000 * 60 * 60));
      if (diffHours >= 0 && diffHours < 6) {
        const riskVal = e.severity === 'CRITICAL' ? 100 : e.severity === 'HIGH' ? 50 : e.severity === 'MEDIUM' ? 20 : 5;
        buckets[5 - diffHours].risk += riskVal;
      }
    });
    return buckets;
  }, [events]);

  const handleDownload = (type) => {
    window.open(`http://localhost:8001/api/audit/export/${type}`, '_blank');
  };

  const clearLogs = async () => {
    if (confirm("Are you sure you want to clear all audit logs? This cannot be undone.")) {
      setIsClearing(true);
      try {
        await axios.delete('http://localhost:8001/api/audit/clear');
        alert("Audit logs cleared successfully.");
        window.location.reload();
      } catch (e) {
        console.error(e);
      } finally {
        setIsClearing(false);
      }
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-2xl font-display font-bold">Compliance & Forensics</h1>
        <select value={period} onChange={(e) => setPeriod(e.target.value)} className="bg-aegis-surface border border-aegis-border rounded p-2 text-sm text-aegis-text-primary focus:outline-none focus:border-aegis-green">
          <option>Last 24h</option>
          <option>Last 7d</option>
          <option>Last 30d</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card-border p-6 flex flex-col justify-center items-center text-center">
          <ShieldAlert className="w-8 h-8 text-aegis-amber mb-2" />
          <div className="text-sm text-aegis-text-secondary">Attacks Blocked</div>
          <div className="text-4xl font-mono font-bold text-aegis-text-primary mt-2">{stats.blocked}</div>
        </div>
        <div className="card-border p-6 flex flex-col justify-center items-center text-center">
          <FileText className="w-8 h-8 text-aegis-blue mb-2" />
          <div className="text-sm text-aegis-text-secondary">Total Events</div>
          <div className="text-4xl font-mono font-bold text-aegis-text-primary mt-2">{stats.total}</div>
        </div>
        <div className="card-border p-6 flex flex-col justify-center items-center text-center border-b-4 border-b-aegis-green">
          <CheckCircle className="w-8 h-8 text-aegis-green mb-2" />
          <div className="text-sm text-aegis-text-secondary">Detection Rate</div>
          <div className="text-4xl font-mono font-bold text-aegis-green mt-2">
            {stats.total === 0 ? '100' : (
              // Detection rate: what % of all events were correctly identified threats
              ((stats.blocked / Math.max(stats.total, 1)) * 100).toFixed(1)
            )}%
          </div>
          <div className="text-xs text-aegis-text-muted mt-1">attacks intercepted</div>
        </div>
      </div>

      <div className="card-border p-6 h-[300px]">
        <h2 className="text-sm font-bold mb-4 text-aegis-text-secondary">Risk Trend</h2>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={realTrendData}>
            <XAxis dataKey="time" stroke="#8899AA" fontSize={12} />
            <YAxis stroke="#8899AA" fontSize={12} />
            <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', color: '#0F172A' }} />
            <Line type="monotone" dataKey="risk" stroke="#DC2626" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <button onClick={() => handleDownload('pdf')} className="flex-1 p-4 card-border hover:bg-aegis-surface transition-colors flex items-center justify-center gap-3 font-bold">
          <Download className="w-5 h-5 text-aegis-green" /> Download PDF Report
        </button>
        <button onClick={() => handleDownload('csv')} className="flex-1 p-4 card-border hover:bg-aegis-surface transition-colors flex items-center justify-center gap-3 font-bold">
          <Download className="w-5 h-5 text-aegis-blue" /> Download CSV Data
        </button>
        <button onClick={clearLogs} disabled={isClearing} className="sm:w-48 p-4 border border-aegis-red/50 bg-aegis-red/10 text-aegis-red rounded hover:bg-aegis-red/20 transition-colors flex items-center justify-center gap-2 font-bold disabled:opacity-50">
          <AlertTriangle className="w-5 h-5" /> Clear Logs
        </button>
      </div>

      <div className="card-border p-6 mt-4">
        <h2 className="text-sm font-bold mb-4 text-aegis-text-secondary uppercase tracking-wider">Compliance Standards Met</h2>
        <div className="flex flex-wrap gap-4">
          {["SOC 2 Type II", "GDPR", "EU AI Act", "NIST AI RMF", "HIPAA"].map((standard, i) => (
            <div key={i} className="flex items-center gap-2 bg-aegis-surface px-4 py-2 rounded-full border border-aegis-border">
              <CheckCircle className="w-4 h-4 text-aegis-green" />
              <span className="text-sm font-medium">{standard}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
