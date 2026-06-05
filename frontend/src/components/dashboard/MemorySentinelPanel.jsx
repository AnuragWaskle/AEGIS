import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Shield, Lock, Search, AlertCircle, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

export default function MemorySentinelPanel() {
  const [stats, setStats] = useState({
    total_memories: 0,
    quarantined_memories: 0,
    provenance_breakdown: { high: 0, medium: 0, low: 0 }
  });
  const [quarantineFeed, setQuarantineFeed] = useState([]);
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState(null);

  const fetchStats = async () => {
    try {
      const res = await axios.get('http://localhost:8001/api/audit/memory/stats');
      setStats(res.data);
    } catch (e) {
      console.error('Failed to fetch memory stats', e);
    }
  };

  const fetchQuarantine = async () => {
    try {
      const res = await axios.get('http://localhost:8001/api/audit/memory/quarantine');
      setQuarantineFeed(res.data.slice(0, 5));
    } catch (e) {
      console.error('Failed to fetch quarantine feed', e);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchQuarantine();
    const interval = setInterval(() => {
      fetchStats();
      fetchQuarantine();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleRunAudit = async () => {
    setIsAuditing(true);
    try {
      const res = await axios.post('http://localhost:8001/api/audit/memory/audit');
      setAuditResult(res.data);
    } catch (e) {
      console.error('Failed to run audit', e);
    } finally {
      setIsAuditing(false);
    }
  };

  return (
    <div className="card-border flex flex-col h-[520px]">
      {/* Header */}
      <div className="p-4 border-b border-aegis-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Shield className="w-6 h-6 text-emerald-600" />
            <Lock className="w-3 h-3 text-emerald-900 absolute top-1.5 left-1.5" />
          </div>
          <h2 className="text-lg font-display font-bold">Memory Sentinel</h2>
          <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-mono font-bold">
            ONLINE
          </span>
        </div>
        <button 
          onClick={handleRunAudit}
          disabled={isAuditing}
          className="flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold border border-aegis-border hover:bg-aegis-surface transition-colors disabled:opacity-50"
        >
          {isAuditing ? <div className="w-3 h-3 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" /> : <Search className="w-3 h-3" />}
          Run Full Audit
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 divide-x divide-aegis-border border-b border-aegis-border">
        <div className="p-4 flex flex-col">
          <span className="text-xs text-aegis-text-secondary font-mono mb-1">Memories Stored</span>
          <span className="text-2xl font-bold font-mono text-emerald-600">{stats.total_memories}</span>
        </div>
        <div className="p-4 flex flex-col">
          <span className="text-xs text-aegis-text-secondary font-mono mb-1">Quarantined</span>
          <span className={`text-2xl font-bold font-mono ${stats.quarantined_memories > 0 ? 'text-red-600' : 'text-aegis-text-primary'}`}>
            {stats.quarantined_memories}
          </span>
        </div>
        <div className="p-4 flex flex-col">
          <span className="text-xs text-aegis-text-secondary font-mono mb-1">Campaigns Detected</span>
          <span className="text-2xl font-bold font-mono text-amber-600">
            {auditResult ? auditResult.campaigns_detected.length : 0}
          </span>
        </div>
      </div>

      {/* Quarantine Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <h3 className="text-xs font-mono text-aegis-text-muted mb-2 uppercase tracking-wider">Recent Quarantines</h3>
        <AnimatePresence>
          {quarantineFeed.map(mem => (
            <motion.div 
              key={mem.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-aegis-surface border border-aegis-border border-l-2 border-l-red-500 p-3 rounded"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Lock className="w-3 h-3 text-red-500" />
                  <span className="text-[10px] font-mono bg-red-100 text-red-700 px-1 py-0.5 rounded uppercase font-bold">
                    {mem.quarantine_reason.split('-')[1]?.trim() || 'POISON_ATTEMPT'}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-aegis-text-muted font-mono">
                  <Clock className="w-3 h-3" />
                  {formatDistanceToNow(new Date(mem.created_at + (mem.created_at.endsWith('Z') ? '' : 'Z')), { addSuffix: true })}
                </div>
              </div>
              <p className="text-xs text-aegis-text-secondary font-mono truncate">
                {mem.content}
              </p>
              <div className="mt-2 text-[10px] text-aegis-text-muted font-mono">
                Risk: {mem.provenance_score < 0.5 ? 'HIGH' : 'LOW'} | Prov Score: {mem.provenance_score.toFixed(2)}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {quarantineFeed.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-aegis-text-muted mt-8">
            <Shield className="w-8 h-8 mb-2 opacity-20" />
            <span className="text-xs">No quarantined memories.</span>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="p-3 border-t border-aegis-border bg-aegis-surface/50 text-[10px] font-mono flex flex-wrap justify-between items-center text-aegis-text-secondary">
        <span className="font-bold">Provenance:</span>
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-800" /> System (0.95)</div>
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Support (0.75)</div>
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500" /> Customer (0.30)</div>
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-orange-500" /> Document (0.20)</div>
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500" /> URL (0.10)</div>
      </div>

      {/* Audit Result Modal (Overlay) */}
      {auditResult && (
        <div className="absolute inset-0 bg-white/90 backdrop-blur-sm p-6 flex flex-col z-10 border border-aegis-border shadow-2xl rounded">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-display font-bold flex items-center gap-2">
              <Shield className="text-emerald-600" /> Audit Complete
            </h3>
            <button onClick={() => setAuditResult(null)} className="text-xs text-aegis-text-muted hover:text-black">Close</button>
          </div>
          <div className="flex flex-col gap-2 font-mono text-sm mb-4">
            <div>Total Scanned: <span className="font-bold">{auditResult.total}</span></div>
            <div>Quarantined: <span className="font-bold text-red-600">{auditResult.quarantined}</span></div>
            <div>Flagged for Review: <span className="font-bold text-amber-600">{auditResult.flagged}</span></div>
          </div>
          <h4 className="text-xs font-mono text-aegis-text-muted mb-2">CAMPAIGNS DETECTED: {auditResult.campaigns_detected.length}</h4>
          <div className="flex-1 overflow-y-auto space-y-2">
            {auditResult.campaigns_detected.map((camp, i) => (
              <div key={i} className="p-3 border border-amber-200 bg-amber-50 rounded">
                <div className="text-xs font-bold text-amber-800 mb-1">"{camp.phrase}"</div>
                <div className="text-[10px] text-amber-600">Occurrences: {camp.occurrences} across {camp.memory_ids.length} memories</div>
              </div>
            ))}
            {auditResult.campaigns_detected.length === 0 && (
              <div className="text-xs text-aegis-text-muted">No persistent injection campaigns detected.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
