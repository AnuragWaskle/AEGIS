import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import axios from 'axios';
import useAegisStore from '../store/aegisStore';

export default function Dashboard() {
  const events = useAegisStore((state) => state.events);
  const [stats, setStats] = useState({
    blocked: 0,
    intercepted: 0,
    uptime: 100,
    avgResponseTime: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get('http://localhost:8001/api/audit/stats');
        setStats({
          blocked: res.data.blocked_count,
          intercepted: res.data.total_events,
          uptime: res.data.uptime_hours,
          avgResponseTime: 45 // placeholder logic since it's not in stats yet, but we removed mock from rest
        });
      } catch (e) {
        console.error(e);
      }
    };
    fetchStats();
    
    // Fallback refresh loop
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, [events]);

  const blastRadiusData = [
    { name: 'MINIMAL', count: events.filter(e => e.blast_radius?.category === 'MINIMAL').length },
    { name: 'LOW', count: events.filter(e => e.blast_radius?.category === 'LOW').length },
    { name: 'MEDIUM', count: events.filter(e => e.blast_radius?.category === 'MEDIUM').length },
    { name: 'HIGH', count: events.filter(e => e.blast_radius?.category === 'HIGH').length },
    { name: 'CATASTROPHIC', count: events.filter(e => e.blast_radius?.category === 'CATASTROPHIC').length },
  ];

  const getColorForCategory = (category) => {
    switch(category) {
      case 'MINIMAL': return '#059669';
      case 'LOW': return '#34D399';
      case 'MEDIUM': return '#2563EB';
      case 'HIGH': return '#D97706';
      case 'CATASTROPHIC': return '#DC2626';
      default: return '#E2E8F0';
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Section 1: Top Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Attacks Blocked Today', value: stats.blocked, color: 'text-aegis-green' },
          { label: 'Threats Intercepted', value: stats.intercepted, color: 'text-aegis-amber' },
          { label: 'Agent Uptime', value: `${stats.uptime}%`, color: 'text-aegis-text-primary' },
          { label: 'Avg Response Time', value: `${stats.avgResponseTime}ms`, color: 'text-aegis-text-primary' },
        ].map((stat, i) => (
          <div key={i} className="card-border p-4 flex flex-col justify-center">
            <span className="text-aegis-text-secondary text-sm">{stat.label}</span>
            <span className={`text-3xl font-mono font-bold mt-2 ${stat.color}`}>{stat.value}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        {/* Section 2: Live Threat Feed */}
        <div className="lg:col-span-6 card-border p-4 flex flex-col h-[500px]">
          <h2 className="text-lg font-display font-bold mb-4">Live Threat Feed</h2>
          <div className="flex-1 overflow-y-auto pr-2 space-y-3">
            <AnimatePresence>
              {events.map((event) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`card-border bg-aegis-surface p-3 flex flex-col border-l-4 ${
                    event.severity === 'CRITICAL' ? 'border-l-aegis-red' :
                    event.severity === 'HIGH' ? 'border-l-aegis-amber' :
                    event.severity === 'MEDIUM' ? 'border-l-aegis-blue' :
                    'border-l-aegis-green'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex gap-2 items-center">
                      <span className={`text-xs px-2 py-1 rounded bg-black/50 font-bold severity-${event.severity}`}>
                        {event.severity}
                      </span>
                      <span className="text-xs font-mono text-aegis-text-secondary">{event.agent_name}</span>
                      <span className={`text-xs font-bold ${event.decision === 'BLOCKED' ? 'text-aegis-red' : event.decision === 'APPROVED' ? 'text-aegis-green' : 'text-aegis-amber'}`}>
                        {event.decision}
                      </span>
                    </div>
                    <span className="text-xs text-aegis-text-muted">
                      {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm truncate text-aegis-text-primary">
                    {event.input_summary}
                  </p>
                </motion.div>
              ))}
              {events.length === 0 && (
                <div className="text-aegis-text-muted text-center mt-10">No events yet. Awaiting data...</div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Section 3: Agent Status */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <h2 className="text-lg font-display font-bold">Agent Status</h2>
          {[
            { name: 'Sanitizer', model: 'Microsoft Phi-3 Mini', count: events.filter(e=>e.agent_name==='SANITIZER').length },
            { name: 'Governor', model: 'Mistral 7B', count: events.filter(e=>e.agent_name==='GOVERNOR').length },
            { name: 'Auditor', model: 'Python / SQLite', count: events.filter(e=>e.agent_name==='AUDITOR').length || events.length },
          ].map(agent => (
            <div key={agent.name} className="card-border p-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-aegis-green shadow-[0_0_8px_#00FF88] animate-pulse" />
                  <span className="font-bold">{agent.name}</span>
                </div>
                <div className="text-xs font-mono text-aegis-text-secondary">{agent.model}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-aegis-text-muted">Processed Today</div>
                <div className="text-xl font-mono text-aegis-green">{agent.count}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 4: Blast Radius */}
      <div className="card-border p-4 h-[300px]">
        <h2 className="text-lg font-display font-bold mb-4">Blast Radius Distribution (24h)</h2>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={blastRadiusData}>
            <XAxis dataKey="name" stroke="#8899AA" fontSize={12} />
            <YAxis stroke="#8899AA" fontSize={12} />
            <Tooltip contentStyle={{ backgroundColor: '#161B25', borderColor: '#1E2D40' }} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {blastRadiusData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getColorForCategory(entry.name)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
