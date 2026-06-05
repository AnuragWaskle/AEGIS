import React, { useState } from 'react';
import { Shield, Server, CheckSquare, Activity, ShieldCheck, Database, Layers } from 'lucide-react';

export default function Architecture() {
  const [activeLayer, setActiveLayer] = useState(null);

  const layers = {
    sanitizer: {
      title: "Agent 1: Sanitizer",
      model: "Microsoft Phi-3 Mini",
      desc: "Intercepts data before the main agent reads it. Detects Unicode tricks, role-play overrides, and hidden commands.",
      example: "Replaces hidden text with [INJECTION DETECTED]",
      icon: Shield
    },
    governor: {
      title: "Agent 2: Governor",
      model: "Mistral 7B + Pure Python Rules",
      desc: "Intercepts tool calls before execution. Evaluates Role-Based Access Control (RBAC) policies and calculates Blast Radius.",
      example: "Blocks issue_refund(50000) because limit is 200",
      icon: ShieldCheck
    },
    auditor: {
      title: "Agent 3: Auditor",
      model: "Python / SQLite",
      desc: "Silently records every prompt, decision, and block into an immutable forensic log.",
      example: "Logs timestamp, severity, and full context of a blocked action",
      icon: Database
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center max-w-2xl mx-auto mb-6">
        <h1 className="text-3xl font-display font-bold mb-2">System Architecture</h1>
        <p className="text-aegis-text-secondary">Aegis acts as a swarm of 3 specialized micro-agents that protect your main AI from indirect prompt injections.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 card-border p-8 flex flex-col items-center justify-center relative min-h-[400px]">
          {/* Main Diagram Area */}
          <div className="flex flex-col gap-8 w-full max-w-md relative z-10">
            {/* Incoming Data */}
            <div className="text-center text-aegis-text-secondary text-sm flex flex-col items-center gap-2">
              <Activity className="w-6 h-6" />
              Untrusted Input
            </div>
            
            <div className="w-0.5 h-6 bg-aegis-border mx-auto"></div>

            {/* Sanitizer */}
            <button 
              onClick={() => setActiveLayer('sanitizer')}
              className={`w-full p-4 card-border border-2 flex items-center justify-center gap-3 transition-all ${activeLayer === 'sanitizer' ? 'border-aegis-green glow-green text-aegis-green' : 'border-aegis-border hover:border-aegis-text-secondary'}`}
            >
              <Shield className="w-5 h-5" /> 1. Sanitizer Agent
            </button>
            
            <div className="w-0.5 h-6 bg-aegis-border mx-auto relative">
              <span className="absolute right-4 top-1 text-xs text-aegis-green">Clean Data</span>
            </div>

            {/* Main Agent */}
            <div className="w-full p-4 bg-aegis-text-primary text-black rounded-lg flex items-center justify-center gap-3 font-bold">
              <Server className="w-5 h-5" /> Main AI Agent
            </div>

            <div className="w-0.5 h-6 bg-aegis-border mx-auto relative">
              <span className="absolute right-4 top-1 text-xs text-aegis-amber">Proposes Tool Call</span>
            </div>

            {/* Governor */}
            <button 
              onClick={() => setActiveLayer('governor')}
              className={`w-full p-4 card-border border-2 flex items-center justify-center gap-3 transition-all ${activeLayer === 'governor' ? 'border-aegis-amber glow-amber text-aegis-amber' : 'border-aegis-border hover:border-aegis-text-secondary'}`}
            >
              <ShieldCheck className="w-5 h-5" /> 2. Governor Agent
            </button>

            <div className="w-0.5 h-6 bg-aegis-border mx-auto"></div>

            {/* Execution */}
            <div className="w-full p-4 border border-aegis-green bg-aegis-green/10 text-aegis-green rounded-lg flex items-center justify-center gap-3 font-bold">
              <CheckSquare className="w-5 h-5" /> Safe Execution
            </div>
          </div>
          
          {/* Auditor running side */}
          <div className="absolute right-8 top-1/2 -translate-y-1/2 flex flex-col items-center">
            <button 
              onClick={() => setActiveLayer('auditor')}
              className={`p-4 card-border border-2 flex flex-col items-center justify-center gap-3 h-64 transition-all ${activeLayer === 'auditor' ? 'border-aegis-blue shadow-[0_0_20px_rgba(68,136,255,0.3)] text-aegis-blue' : 'border-aegis-border hover:border-aegis-text-secondary'}`}
            >
              <Database className="w-6 h-6 mb-2" />
              <div className="rotate-90 origin-center whitespace-nowrap translate-x-3 translate-y-3 font-bold tracking-wider">3. AUDITOR AGENT</div>
            </button>
          </div>
        </div>

        {/* Info Panel */}
        <div className="card-border p-6 flex flex-col justify-center">
          {activeLayer ? (
            <div className="flex flex-col gap-4 animate-fade-in-up">
              {React.createElement(layers[activeLayer].icon, { className: "w-10 h-10 mb-2" })}
              <h2 className="text-2xl font-display font-bold">{layers[activeLayer].title}</h2>
              <div className="text-sm font-mono text-aegis-green">{layers[activeLayer].model}</div>
              <p className="text-aegis-text-primary mt-2 leading-relaxed">{layers[activeLayer].desc}</p>
              <div className="mt-4 p-4 bg-aegis-surface rounded border border-aegis-border text-sm text-aegis-text-secondary">
                <span className="font-bold text-white mb-1 block">Example:</span>
                {layers[activeLayer].example}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-aegis-text-muted text-center gap-4">
              <Layers className="w-12 h-12" />
              <p>Click a layer in the diagram to view its technical details.</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { title: "Zero Trust Input Processing", desc: "No input is trusted by default. Every string, URL, and file is sanitized before the main reasoning model ever sees it." },
          { title: "Policy-Enforced Execution", desc: "The main AI is never allowed to directly execute a tool. Every action proposal is checked against RBAC and Blast Radius algorithms." },
          { title: "Immutable Forensic Trail", desc: "For enterprise compliance, every decision is logged silently in the background, allowing security teams to review incidents with perfect context." }
        ].map((feature, i) => (
          <div key={i} className="card-border p-6">
            <h3 className="font-bold mb-2 text-aegis-text-primary">{feature.title}</h3>
            <p className="text-sm text-aegis-text-secondary">{feature.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
