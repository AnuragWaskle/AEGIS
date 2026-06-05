import { NavLink } from 'react-router-dom';
import { Shield, LayoutDashboard, Zap, FileText, Network, Download, ShieldAlert } from 'lucide-react';
import useAegisStore from '../../store/aegisStore';

export default function Sidebar() {
  const isConnected = useAegisStore((state) => state.isConnected);

  const links = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/simulator', icon: Zap, label: 'Simulator' },
    { to: '/audit', icon: FileText, label: 'Audit Log' },
    { to: '/architecture', icon: Network, label: 'Architecture' },
    { to: '/intelligence', icon: ShieldAlert, label: 'Threat Intel' },
    { to: '/reports', icon: Download, label: 'Reports' },
  ];

  return (
    <div className="w-60 h-screen border-r border-aegis-border bg-aegis-surface flex flex-col justify-between hidden md:flex fixed top-0 left-0 z-50">
      <div>
        <div className="flex items-center gap-3 p-6 mb-4">
          <Shield className="text-aegis-green w-8 h-8 animate-pulse-green" />
          <h1 className="text-2xl font-display font-bold tracking-wider text-aegis-text-primary">AEGIS</h1>
        </div>
        
        <nav className="flex flex-col gap-2 px-4">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-aegis-card border-l-4 border-aegis-green text-aegis-green'
                    : 'text-aegis-text-secondary hover:text-aegis-text-primary hover:bg-aegis-card'
                }`
              }
            >
              <link.icon className="w-5 h-5" />
              <span className="font-medium">{link.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="p-6 border-t border-aegis-border flex items-center gap-3">
        <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-aegis-green' : 'bg-aegis-red'} shadow-[0_0_10px_currentColor]`} />
        <span className="text-sm font-mono text-aegis-text-secondary">
          {isConnected ? 'SYSTEM ONLINE' : 'SYSTEM OFFLINE'}
        </span>
      </div>
    </div>
  );
}
