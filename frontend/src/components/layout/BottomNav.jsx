import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Zap, FileText, Download } from 'lucide-react';

export default function BottomNav() {
  const links = [
    { to: '/', icon: LayoutDashboard, label: 'Dash' },
    { to: '/simulator', icon: Zap, label: 'Sim' },
    { to: '/audit', icon: FileText, label: 'Audit' },
    { to: '/reports', icon: Download, label: 'Reports' },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 border-t border-aegis-border bg-aegis-surface flex justify-around items-center z-50">
      {links.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center w-full h-full ${
              isActive ? 'text-aegis-green' : 'text-aegis-text-secondary'
            }`
          }
        >
          <link.icon className="w-5 h-5 mb-1" />
          <span className="text-xs font-medium">{link.label}</span>
        </NavLink>
      ))}
    </div>
  );
}
