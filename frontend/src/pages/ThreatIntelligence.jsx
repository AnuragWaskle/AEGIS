import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Shield, ShieldAlert, CheckCircle, XCircle, AlertTriangle, Fingerprint } from 'lucide-react';
import MitreAtlasBadge from '../components/shared/MitreAtlasBadge';

export default function ThreatIntelligence() {
  const [summary, setSummary] = useState(null);
  const [owasp, setOwasp] = useState([]);
  const [cves, setCves] = useState([]);
  const [identities, setIdentities] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sumRes, owaspRes, cvesRes, idenRes] = await Promise.all([
          axios.get('https://aegis-backend-idbk.onrender.com/api/intelligence/coverage-summary'),
          axios.get('https://aegis-backend-idbk.onrender.com/api/intelligence/owasp'),
          axios.get('https://aegis-backend-idbk.onrender.com/api/intelligence/cves'),
          axios.get('https://aegis-backend-idbk.onrender.com/api/intelligence/agent-identities')
        ]);
        setSummary(sumRes.data);
        setOwasp(owaspRes.data);
        setCves(cvesRes.data);
        setIdentities(idenRes.data);
      } catch (e) {
        console.error('Failed to fetch intelligence data', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading || !summary) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="w-8 h-8 border-4 border-aegis-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto pb-12">
      
      {/* SECTION 1 - Hero */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-border p-10 flex flex-col items-center justify-center text-center bg-gradient-to-b from-emerald-50/50 to-transparent"
      >
        <Shield className="w-16 h-16 text-emerald-600 mb-4" />
        <h1 className="text-5xl font-display font-black mb-2 tracking-tight">
          {summary.coverage_percentage}% OWASP ASI-10 Coverage
        </h1>
        <p className="text-aegis-text-secondary text-lg mb-8 max-w-2xl">
          Designed against the official 2026 OWASP Agentic Security Standard
        </p>
        
        <div className="flex flex-wrap items-center justify-center gap-4">
          <div className="px-4 py-2 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-800 font-bold flex items-center gap-2 text-sm shadow-sm">
            <CheckCircle className="w-4 h-4" />
            {summary.full_coverage} Full Coverage
          </div>
          <div className="px-4 py-2 rounded-full border border-amber-200 bg-amber-50 text-amber-800 font-bold flex items-center gap-2 text-sm shadow-sm">
            <AlertTriangle className="w-4 h-4" />
            {summary.partial_coverage} Partial
          </div>
          <div className="px-4 py-2 rounded-full border border-blue-200 bg-blue-50 text-blue-800 font-bold flex items-center gap-2 text-sm shadow-sm">
            <Shield className="w-4 h-4" />
            {summary.agents_with_identity} Agents Secured
          </div>
          <div className="px-4 py-2 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-800 font-bold flex items-center gap-2 text-sm shadow-sm">
            <CheckCircle className="w-4 h-4" />
            {summary.not_covered} Unmitigated Critical Risks
          </div>
        </div>
      </motion.div>

      {/* SECTION 2 - OWASP ASI-10 */}
      <div className="flex flex-col gap-4">
        <h2 className="text-2xl font-display font-bold">OWASP ASI-10 Standard Coverage</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {owasp.map((item, i) => (
            <motion.div 
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`card-border p-5 border-l-4 flex flex-col justify-between ${
                item.coverage_level === 'FULL' ? 'border-l-emerald-500' :
                item.coverage_level === 'PARTIAL' ? 'border-l-amber-500' : 'border-l-gray-400'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-sm font-bold px-2 py-0.5 bg-gray-100 rounded text-gray-700">
                    {item.id}
                  </span>
                  <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${
                    item.coverage_level === 'FULL' ? 'bg-emerald-100 text-emerald-800' :
                    item.coverage_level === 'PARTIAL' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {item.coverage_level.replace('_', ' ')}
                  </span>
                </div>
                <h3 className="font-bold text-lg mb-1">{item.name}</h3>
                <p className="text-sm text-aegis-text-secondary mb-4">
                  {item.description}
                </p>
              </div>
              
              {item.covered_by.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap mt-auto">
                  <span className="text-xs text-aegis-text-muted font-mono uppercase">Covered by:</span>
                  {item.covered_by.map(agent => (
                    <span key={agent} className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded font-mono">
                      {agent}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* SECTION 3 - CVEs */}
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold">Real Attacks Aegis Defends Against</h2>
          <p className="text-aegis-text-secondary">These are documented attacks from 2025–2026, not hypothetical scenarios</p>
        </div>
        
        <div className="flex flex-col gap-4">
          {cves.map((cve, i) => (
            <motion.div 
              key={cve.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="card-border p-5 border-t-2 border-t-red-500 flex flex-col gap-3 relative overflow-hidden"
            >
              <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-red-600 font-bold">{cve.id}</span>
                  <span className="text-sm font-bold">{cve.name}</span>
                  <span className="text-xs text-aegis-text-muted bg-gray-100 px-2 py-0.5 rounded">
                    {cve.product}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-aegis-text-muted font-mono">{cve.date}</span>
                  <span className={`font-mono font-bold px-2 py-0.5 rounded ${
                    cve.severity === 'CRITICAL' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {cve.severity}
                  </span>
                </div>
              </div>

              <p className="text-sm text-aegis-text-primary">
                {cve.description}
              </p>

              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded mt-2">
                <div className="text-xs font-bold text-emerald-800 font-mono mb-1 uppercase flex items-center gap-1">
                  <Shield className="w-3 h-3" /> How Aegis Stops This:
                </div>
                <p className="text-sm text-emerald-900">{cve.aegis_defense}</p>
              </div>

              <div className="mt-2">
                <MitreAtlasBadge attackType={cve.attack_type} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* SECTION 4 - Identities */}
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold">Zero-Trust Agent Identities</h2>
          <p className="text-aegis-text-secondary">
            93% of AI frameworks have no per-agent identity. Aegis gives each agent cryptographic scope isolation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(identities).map(([key, agent], i) => (
            <motion.div 
              key={key}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="card-border p-5 flex flex-col hover:shadow-lg hover:border-emerald-300 transition-all group"
            >
              <div className="flex items-center justify-between mb-3">
                <Fingerprint className="w-6 h-6 text-emerald-500 group-hover:text-emerald-600 transition-colors" />
                <span className="text-[10px] font-bold font-mono bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
                  {agent.trust_level} TRUST
                </span>
              </div>
              
              <h3 className="text-xl font-display font-bold capitalize mb-1">{key.replace('_', ' ')}</h3>
              <span className="text-xs font-mono text-emerald-600 font-bold mb-3">{agent.agent_id}</span>
              
              <div className="text-xs text-aegis-text-muted font-mono mb-4">
                Model: <span className="text-aegis-text-primary">{agent.model}</span>
              </div>

              <div className="flex flex-col gap-4 mt-auto">
                <div>
                  <div className="text-[10px] font-mono text-aegis-text-muted uppercase mb-1.5 font-bold">Allowed Scopes:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {agent.scope.map(s => (
                      <span key={s} className="text-[9px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div>
                  <div className="text-[10px] font-mono text-aegis-text-muted uppercase mb-1.5 font-bold">Denied:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {agent.denied.map(s => (
                      <span key={s} className="text-[9px] font-mono bg-red-50 text-red-700 border border-red-200 px-1.5 py-0.5 rounded line-through decoration-red-400">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

    </div>
  );
}
