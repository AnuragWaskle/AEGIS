import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Simulator from './pages/Simulator';
import AuditLog from './pages/AuditLog';
import Architecture from './pages/Architecture';
import ThreatIntelligence from './pages/ThreatIntelligence';
import Reports from './pages/Reports';
import { useWebSocket } from './hooks/useWebSocket';

function App() {
  useWebSocket();

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/simulator" element={<Simulator />} />
          <Route path="/audit" element={<AuditLog />} />
          <Route path="/architecture" element={<Architecture />} />
          <Route path="/intelligence" element={<ThreatIntelligence />} />
          <Route path="/reports" element={<Reports />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
