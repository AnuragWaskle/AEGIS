import Sidebar from './Sidebar';
import BottomNav from './BottomNav';

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-aegis-black text-aegis-text-primary grid-bg font-sans">
      <Sidebar />
      <div className="md:ml-60 pb-16 md:pb-0 min-h-screen flex flex-col">
        <header className="h-[60px] border-b border-aegis-border bg-aegis-surface/80 backdrop-blur-sm sticky top-0 z-40 flex items-center px-6">
          <div className="text-sm font-mono text-aegis-text-secondary">
            AEGIS Operations Center / <span className="text-aegis-green">Live Feed</span>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 overflow-x-hidden">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
