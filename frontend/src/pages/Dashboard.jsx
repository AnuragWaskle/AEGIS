import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LineChart, Line, CartesianGrid } from 'recharts';
import { Shield, ShieldAlert, Activity, Clock, CheckCircle } from 'lucide-react';
import axios from 'axios';
import useAegisStore from '../store/aegisStore';
import MemorySentinelPanel from '../components/dashboard/MemorySentinelPanel';
import MitreAtlasBadge from '../components/shared/MitreAtlasBadge';

// Animated counter hook
function useCountUp(target, duration = 1200) {
  const [value, setValue] = useState(0);
  const prevTarget = useRef(0);
  useEffect(() => {
    if (target === prevTarget.current) return;
    prevTarget.current = target;
    const start = Date.now();
    const from = value;
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(from + (target - from) * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target]);
  return value;
}

const SEVERITY_BORDER = {
  CRITICAL: 'border-l-red-500',
  HIGH: 'border-l-amber-500',
  MEDIUM: 'border-l-blue-500',
  LOW: 'border-l-green-500',
};
const SEVERITY_TEXT = {
  CRITICAL: 'text-red-600',
  HIGH: 'text-amber-600',
  MEDIUM: 'text-blue-600',
  LOW: 'text-emerald-600',
};

function ThreatLevelGauge({ level }) {
  const levels = { LOW: 0, MEDIUM: 1, HIGH: 2, CRITICAL: 3 };
  const colors = { LOW: '#10B981', MEDIUM: '#3B82F6', HIGH: '#F59E0B', CRITICAL: '#EF4444' };
  const current = levels[level] ?? 0;
  const color = colors[level] ?? '#10B981';
  return (
    <div className="flex items-center gap-2">
      {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((l, i) => (
        <div key={l} className="flex flex-col items-center gap-1">
          <div
            className={`w-2 h-2 rounded-full transition-all duration-500 ${i <= current ? 'opacity-100' : 'opacity-20'}`}
            style={{ backgroundColor: colors[l], boxShadow: i === current ? `0 0 8px ${colors[l]}` : 'none' }}
          />
          <span className="text-[9px] font-mono" style={{ color: i === current ? color : '#445566' }}>{l}</span>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const events = useAegisStore((state) => state.events);
  const [stats, setStats] = useState({ blocked: 0, intercepted: 0, avgResponseMs: 45, hourlyAttacks: [] });
  const [threatLevel, setThreatLevel] = useState('LOW');

  const blockedCount = useCountUp(stats.blocked);
  const interceptedCount = useCountUp(stats.intercepted);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get('https://aegis-backend-idbk.onrender.com/api/audit/stats');
        const d = res.data;
        setStats({
          blocked: d.blocked_count ?? 0,
          intercepted: d.total_events ?? 0,
          avgResponseMs: d.avg_response_ms ?? 45,
          hourlyAttacks: d.hourly_attacks ?? [],
        });
        // Set threat level from breakdown
        if (d.threat_breakdown?.CRITICAL > 0) setThreatLevel('CRITICAL');
        else if (d.threat_breakdown?.HIGH > 0) setThreatLevel('HIGH');
        else if (d.threat_breakdown?.MEDIUM > 0) setThreatLevel('MEDIUM');
        else setThreatLevel('LOW');
      } catch (e) {
        console.error(e);
      }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 8000);
    return () => clearInterval(interval);
  }, [events.length]);

  const blastRadiusData = [
    { name: 'MINIMAL', count: events.filter(e => e.blast_radius_category === 'MINIMAL').length },
    { name: 'LOW', count: events.filter(e => e.blast_radius_category === 'LOW').length },
    { name: 'MEDIUM', count: events.filter(e => e.blast_radius_category === 'MEDIUM').length },
    { name: 'HIGH', count: events.filter(e => e.blast_radius_category === 'HIGH').length },
    { name: 'CATASTROPHIC', count: events.filter(e => e.blast_radius_category === 'CATASTROPHIC').length },
  ];

  const blastColors = { MINIMAL: '#10B981', LOW: '#22C55E', MEDIUM: '#3B82F6', HIGH: '#F59E0B', CATASTROPHIC: '#EF4444' };

  const topMetrics = [
    { label: 'Attacks Blocked', value: blockedCount, suffix: '', icon: ShieldAlert, color: 'text-red-600', iconColor: '#EF4444' },
    { label: 'Threats Intercepted', value: interceptedCount, suffix: '', icon: Activity, color: 'text-amber-600', iconColor: '#F59E0B' },
    { label: 'Agent Uptime', value: 99.9, suffix: '%', icon: Shield, color: 'text-emerald-600', iconColor: '#10B981' },
    { label: 'Avg Response Time', value: stats.avgResponseMs, suffix: 'ms', icon: Clock, color: 'text-blue-600', iconColor: '#3B82F6' },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Threat level header bar */}
      <div className="card-border p-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${
            threatLevel === 'CRITICAL' ? 'bg-red-500 shadow-[0_0_10px_#EF4444]' :
            threatLevel === 'HIGH' ? 'bg-amber-500' :
            threatLevel === 'MEDIUM' ? 'bg-blue-500' : 'bg-green-500 shadow-[0_0_10px_#10B981]'
          }`} />
          <span className="text-sm font-mono">CURRENT RISK LEVEL</span>
          <span className={`font-bold text-sm ${SEVERITY_TEXT[threatLevel]}`}>{threatLevel}</span>
        </div>
        <ThreatLevelGauge level={threatLevel} />
      </div>

      {/* Section 1: Top Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {topMetrics.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="card-border p-4 flex flex-col gap-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-aegis-text-secondary text-xs font-mono uppercase tracking-wider">{stat.label}</span>
              <stat.icon className="w-4 h-4" style={{ color: stat.iconColor }} />
            </div>
            <span className={`text-3xl font-mono font-bold ${stat.color}`}>
              {stat.value}{stat.suffix}
            </span>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        {/* Section 2: Live Threat Feed */}
        <div className="lg:col-span-6 card-border p-4 flex flex-col h-[520px]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-display font-bold">Live Threat Feed</h2>
            <div className="flex items-center gap-2 text-xs text-aegis-text-muted">
              <div className="w-2 h-2 rounded-full bg-aegis-green animate-pulse" />
              <span className="font-mono">REAL-TIME</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto pr-1 space-y-2">
            <AnimatePresence initial={false}>
              {events.slice(0, 30).map((event) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: -16, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className={`card-border bg-aegis-surface p-3 flex flex-col border-l-4 ${SEVERITY_BORDER[event.severity] || 'border-l-aegis-border'}`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex gap-2 items-center">
                      {event.decision === 'BLOCKED'
                        ? <ShieldAlert className="w-3 h-3 text-red-600 shrink-0" />
                        : <CheckCircle className="w-3 h-3 text-emerald-600 shrink-0" />
                      }
                      <span className={`text-xs px-1.5 py-0.5 rounded font-bold font-mono ${SEVERITY_TEXT[event.severity] || ''}`}>
                        {event.severity}
                      </span>
                      <span className="text-xs font-mono text-aegis-text-muted">{event.agent_name}</span>
                      <span className={`text-xs font-bold font-mono ${
                        event.decision === 'BLOCKED' ? 'text-red-600' :
                        event.decision === 'APPROVED' ? 'text-emerald-600' : 'text-amber-600'
                      }`}>
                        {event.decision}
                      </span>
                    </div>
                    <span className="text-xs text-aegis-text-muted whitespace-nowrap ml-2">
                      {formatDistanceToNow(new Date(event.timestamp + (event.timestamp.endsWith('Z') ? '' : 'Z')), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-xs text-aegis-text-secondary truncate font-mono">
                    {String(event.input_summary || '').slice(0, 90)}
                  </p>
                  {event.decision === 'BLOCKED' && event.threat_type && (
                    <div className="mt-2">
                      <MitreAtlasBadge attackType={event.threat_type} />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            {events.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-aegis-text-muted">
                <Shield className="w-12 h-12 opacity-20" />
                <p className="text-sm">No threats yet. Run a simulation to see live events.</p>
              </div>
            )}
          </div>
        </div>

        {/* Section 3: Agent Status */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <h2 className="text-lg font-display font-bold">Agent Status</h2>
          {[
            { name: 'SAFETY SCANNER', internal: 'SANITIZER', model: 'Microsoft Phi-3 Mini', desc: 'Input scanner — 3-layer detection', color: '#EF4444' },
            { name: 'RULE ENFORCER', internal: 'GOVERNOR', model: 'Mistral 7B', desc: 'Policy enforcer — Role & Impact checks', color: '#F59E0B' },
            { name: 'ACTIVITY LOGGER', internal: 'AUDITOR', model: 'Python / SQLite', desc: 'Forensic logger — no AI needed', color: '#3B82F6' },
          ].map(agent => {
            const count = agent.internal === 'AUDITOR'
              ? events.length
              : events.filter(e => e.agent_name === agent.internal).length;
            return (
              <div key={agent.name} className="card-border p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: agent.color, boxShadow: `0 0 6px ${agent.color}` }} />
                    <span className="font-bold font-mono text-sm">{agent.name}</span>
                    <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-mono">ONLINE</span>
                  </div>
                  <div className="text-xl font-mono font-bold text-aegis-green">{count}</div>
                </div>
                <div className="text-xs font-mono text-aegis-text-muted">{agent.model}</div>
                <div className="text-xs text-aegis-text-secondary mt-1">{agent.desc}</div>
              </div>
            );
          })}
          
          <div className="mt-2">
            <MemorySentinelPanel />
          </div>
        </div>
      </div>


      {/* Section 4: Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Blast Radius Distribution */}
        <div className="card-border p-4 h-[260px]">
          <h2 className="text-base font-display font-bold mb-3">Impact Level Distribution</h2>
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={blastRadiusData} barSize={28}>
              <XAxis dataKey="name" stroke="#445566" fontSize={10} />
              <YAxis stroke="#445566" fontSize={10} />
              <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', color: '#0F172A', fontSize: 12, borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {blastRadiusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={blastColors[entry.name]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Attack Timeline */}
        <div className="card-border p-4 h-[260px]">
          <h2 className="text-base font-display font-bold mb-3">Attack Timeline (24h)</h2>
          {stats.hourlyAttacks.length > 0 ? (
            <ResponsiveContainer width="100%" height="85%">
              <LineChart data={stats.hourlyAttacks}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="hour" stroke="#445566" fontSize={10} />
                <YAxis stroke="#445566" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', color: '#0F172A', fontSize: 12, borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                <Line type="monotone" dataKey="attacks" stroke="#EF4444" strokeWidth={2} dot={{ fill: '#EF4444', r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-[85%] text-aegis-text-muted">
              <Activity className="w-8 h-8 opacity-20 mb-2" />
              <span className="text-sm">No attack data for the last 24 hours.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
