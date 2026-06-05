import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Alert, Modal, ActivityIndicator
} from 'react-native';
import { Shield, ShieldAlert, Activity, Clock, Zap, CheckCircle, X } from 'lucide-react-native';
import axios from 'axios';
import { useState, useEffect } from 'react';

const API = 'http://localhost:8001';

const COLORS = {
  bg: '#080B12',
  surface: '#0D1117',
  card: '#161B25',
  border: '#1E2D40',
  green: '#00FF88',
  amber: '#FFB800',
  red: '#FF4444',
  blue: '#4488FF',
  textPrimary: '#E8EEF8',
  textSecondary: '#8899AA',
  textMuted: '#445566',
};

export default function Stats() {
  const [statsData, setStatsData] = useState({
    blocked: 0, scanned: 0, avgResponse: 45, uptime_hours: 0
  });
  const [running, setRunning] = useState(false);
  const [resultModal, setResultModal] = useState(false);
  const [simResult, setSimResult] = useState(null);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${API}/api/audit/stats`);
      setStatsData({
        blocked: res.data.blocked_count,
        scanned: res.data.total_events,
        avgResponse: res.data.avg_response_ms ?? 45,
        uptime_hours: res.data.uptime_hours ?? 0,
      });
    } catch (e) {
      console.error(e);
    }
  };

  const runSimulation = async () => {
    setRunning(true);
    try {
      // Run classic instruction override attack (scenario 0)
      const res = await axios.post(`${API}/api/demo/run-scenario/0`);
      setSimResult(res.data);
      setResultModal(true);
      fetchStats(); // refresh stats after sim
    } catch (e) {
      Alert.alert('Error', 'Could not connect to the Aegis backend. Is it running?');
    } finally {
      setRunning(false);
    }
  };

  const detectionRate = statsData.scanned === 0
    ? 100
    : Math.round((statsData.blocked / statsData.scanned) * 100);

  const stats = [
    { label: 'Total Blocked', value: statsData.blocked.toString(), icon: ShieldAlert, color: COLORS.red },
    { label: 'Total Scanned', value: statsData.scanned.toString(), icon: Activity, color: COLORS.blue },
    { label: 'Detection Rate', value: `${detectionRate}%`, icon: Shield, color: COLORS.green },
    { label: 'Avg Response', value: `${statsData.avgResponse}ms`, icon: Clock, color: COLORS.amber },
  ];

  const agents = [
    { name: 'SAFETY SCANNER', model: 'Microsoft Phi-3 Mini', color: COLORS.red },
    { name: 'RULE ENFORCER', model: 'Mistral 7B', color: COLORS.amber },
    { name: 'ACTIVITY LOGGER', model: 'Python / SQLite', color: COLORS.blue },
  ];

  const isBlocked = simResult?.final_status === 'BLOCKED';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.pageTitle}>Live Stats</Text>

        {/* Stat cards */}
        <View style={styles.grid}>
          {stats.map((stat, i) => (
            <View key={i} style={styles.statCard}>
              <stat.icon color={stat.color} size={22} />
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Agent Status */}
        <Text style={styles.sectionTitle}>Agent Status</Text>
        <View style={styles.agentList}>
          {agents.map((agent, i) => (
            <View key={i} style={styles.agentRow}>
              <View style={[styles.dot, { backgroundColor: agent.color, shadowColor: agent.color }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.agentName}>{agent.name}</Text>
                <Text style={styles.agentModel}>{agent.model}</Text>
              </View>
              <View style={styles.onlineBadge}>
                <Text style={styles.onlineText}>ONLINE</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Uptime */}
        <View style={styles.uptimeCard}>
          <CheckCircle color={COLORS.green} size={16} />
          <Text style={styles.uptimeText}>
            Server uptime: {statsData.uptime_hours.toFixed(1)}h
          </Text>
        </View>

        {/* Run Simulation Button */}
        <TouchableOpacity
          style={[styles.demoButton, running && styles.demoButtonDisabled]}
          onPress={runSimulation}
          disabled={running}
        >
          {running ? (
            <ActivityIndicator color="#000" size="small" />
          ) : (
            <Zap color="#000" size={20} />
          )}
          <Text style={styles.demoButtonText}>
            {running ? 'Running...' : 'Run Attack Simulation'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Result Modal */}
      <Modal visible={resultModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.closeBtn} onPress={() => setResultModal(false)}>
            <X color={COLORS.textSecondary} size={24} />
          </TouchableOpacity>

          {simResult && (
            <>
              <View style={[styles.resultBadge, { backgroundColor: isBlocked ? '#2E0A0A' : '#0A2E1A', borderColor: isBlocked ? COLORS.red : COLORS.green }]}>
                {isBlocked
                  ? <ShieldAlert color={COLORS.red} size={32} />
                  : <CheckCircle color={COLORS.green} size={32} />}
                <Text style={[styles.resultTitle, { color: isBlocked ? COLORS.red : COLORS.green }]}>
                  {isBlocked ? '✗ ATTACK NEUTRALIZED' : '✓ EXECUTED SAFELY'}
                </Text>
                <Text style={styles.resultSubtitle}>
                  {simResult.sanitizer_decision?.reason || ''}
                </Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Safety Scanner</Text>
                <Text style={[styles.detailValue, { color: simResult.sanitizer_decision?.decision === 'BLOCKED' ? COLORS.red : COLORS.green }]}>
                  {simResult.sanitizer_decision?.decision} — {(simResult.sanitizer_decision?.confidence * 100).toFixed(0)}% confidence
                </Text>
              </View>

              {simResult.governor_decision && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Rule Enforcer</Text>
                  <Text style={[styles.detailValue, { color: simResult.governor_decision?.decision === 'BLOCKED' ? COLORS.red : COLORS.green }]}>
                    {simResult.governor_decision?.decision}
                  </Text>
                  <Text style={styles.detailNote}>{simResult.governor_decision?.reason}</Text>
                </View>
              )}

              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Processing Time</Text>
                <Text style={styles.detailValue}>{simResult.total_processing_time_ms}ms</Text>
              </View>

              <TouchableOpacity style={styles.closeMainBtn} onPress={() => setResultModal(false)}>
                <Text style={styles.closeMainBtnText}>Close</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scrollContent: { padding: 16, paddingBottom: 40 },
  pageTitle: {
    color: COLORS.textPrimary, fontSize: 22, fontWeight: 'bold',
    marginBottom: 16, marginTop: 8,
  },
  sectionTitle: {
    color: COLORS.textPrimary, fontSize: 16, fontWeight: 'bold',
    marginTop: 24, marginBottom: 12,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: {
    width: '47%', backgroundColor: COLORS.card, borderRadius: 12,
    padding: 16, borderWidth: 1, borderColor: COLORS.border,
    alignItems: 'center', gap: 6,
  },
  statValue: { color: COLORS.textPrimary, fontSize: 26, fontWeight: 'bold' },
  statLabel: { color: COLORS.textSecondary, fontSize: 11, textAlign: 'center' },
  agentList: { gap: 10 },
  agentRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.card, padding: 14, borderRadius: 12,
    borderWidth: 1, borderColor: COLORS.border,
  },
  dot: {
    width: 10, height: 10, borderRadius: 5, marginRight: 12,
    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.9, shadowRadius: 6, elevation: 5,
  },
  agentName: { color: COLORS.textPrimary, fontWeight: 'bold', fontSize: 13 },
  agentModel: { color: COLORS.textSecondary, fontSize: 11, marginTop: 2 },
  onlineBadge: {
    backgroundColor: 'rgba(0,255,136,0.15)',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
  },
  onlineText: { color: COLORS.green, fontSize: 10, fontWeight: 'bold' },
  uptimeCard: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.surface, padding: 12, borderRadius: 8,
    borderWidth: 1, borderColor: COLORS.border, marginTop: 16,
  },
  uptimeText: { color: COLORS.textSecondary, fontSize: 12 },
  demoButton: {
    backgroundColor: COLORS.green, padding: 16, borderRadius: 10,
    alignItems: 'center', marginTop: 28, flexDirection: 'row',
    justifyContent: 'center', gap: 10,
  },
  demoButtonDisabled: { opacity: 0.6 },
  demoButtonText: { color: '#000', fontWeight: 'bold', fontSize: 16 },
  // Modal
  modalContainer: {
    flex: 1, backgroundColor: COLORS.bg, padding: 24, paddingTop: 48,
  },
  closeBtn: { position: 'absolute', top: 16, right: 16, padding: 8, zIndex: 10 },
  resultBadge: {
    alignItems: 'center', padding: 24, borderRadius: 16,
    borderWidth: 2, marginBottom: 24, gap: 8,
  },
  resultTitle: { fontSize: 20, fontWeight: 'bold', textAlign: 'center' },
  resultSubtitle: { color: COLORS.textSecondary, fontSize: 12, textAlign: 'center' },
  detailSection: {
    backgroundColor: COLORS.card, padding: 16, borderRadius: 12,
    borderWidth: 1, borderColor: COLORS.border, marginBottom: 10,
  },
  detailSectionTitle: { color: COLORS.textMuted, fontSize: 11, fontWeight: 'bold', marginBottom: 6, letterSpacing: 1 },
  detailValue: { color: COLORS.textPrimary, fontSize: 15, fontWeight: 'bold' },
  detailNote: { color: COLORS.textSecondary, fontSize: 12, marginTop: 4 },
  closeMainBtn: {
    backgroundColor: COLORS.surface, padding: 16, borderRadius: 10,
    alignItems: 'center', marginTop: 'auto',
    borderWidth: 1, borderColor: COLORS.border,
  },
  closeMainBtnText: { color: COLORS.textPrimary, fontWeight: 'bold', fontSize: 16 },
});
