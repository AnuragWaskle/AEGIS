import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Shield, ShieldAlert, Activity, Clock } from 'lucide-react-native';
import axios from 'axios';
import { useState, useEffect } from 'react';

export default function Stats() {
  const [statsData, setStatsData] = useState({ blocked: 0, scanned: 0, uptime: 99.9, avgResponse: 45 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get('http://localhost:8001/api/audit/stats');
        setStatsData({
          blocked: res.data.blocked_count,
          scanned: res.data.total_events,
          uptime: res.data.uptime_hours,
          avgResponse: 45
        });
      } catch (e) {
        console.error(e);
      }
    };
    fetchStats();
  }, []);

  const stats = [
    { label: 'Total Blocked', value: statsData.blocked.toString(), icon: ShieldAlert, color: '#DC2626' },
    { label: 'Total Scanned', value: statsData.scanned.toString(), icon: Activity, color: '#2563EB' },
    { label: 'Detection Rate', value: statsData.scanned === 0 ? '100%' : ((statsData.blocked / statsData.scanned) * 100).toFixed(1) + '%', icon: Shield, color: '#059669' },
    { label: 'Avg Response', value: statsData.avgResponse + 'ms', icon: Clock, color: '#D97706' },
  ];

  const agents = [
    { name: 'SANITIZER', model: 'Microsoft Phi-3 Mini' },
    { name: 'GOVERNOR', model: 'Mistral 7B' },
    { name: 'AUDITOR', model: 'SQLite' },
  ];

  const runSimulation = async () => {
    try {
      await axios.post('http://localhost:8001/api/demo/run-scenario/0');
      Alert.alert('Simulation Sent', 'Attack scenario #0 has been triggered.');
    } catch (e) {
      Alert.alert('Error', 'Could not run simulation.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.pageTitle}>Dashboard Stats</Text>
        
        <View style={styles.grid}>
          {stats.map((stat, i) => (
            <View key={i} style={styles.statCard}>
              <stat.icon color={stat.color} size={24} style={{ marginBottom: 8 }} />
              <Text style={styles.statLabel}>{stat.label}</Text>
              <Text style={styles.statValue}>{stat.value}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Agent Status</Text>
        <View style={styles.agentList}>
          {agents.map((agent, i) => (
            <View key={i} style={styles.agentRow}>
              <View style={styles.dot} />
              <View>
                <Text style={styles.agentName}>{agent.name} — ONLINE</Text>
                <Text style={styles.agentModel}>{agent.model}</Text>
              </View>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.demoButton} onPress={runSimulation}>
          <Text style={styles.demoButtonText}>Run Attack Simulation</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { padding: 16 },
  pageTitle: { color: '#0F172A', fontSize: 24, fontWeight: 'bold', marginBottom: 16, marginTop: 16 },
  sectionTitle: { color: '#0F172A', fontSize: 18, fontWeight: 'bold', marginTop: 24, marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' },
  statCard: { width: '48%', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  statLabel: { color: '#475569', fontSize: 12, marginBottom: 4 },
  statValue: { color: '#0F172A', fontSize: 24, fontWeight: 'bold' },
  agentList: { gap: 12 },
  agentRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#059669', marginRight: 16, shadowColor: '#059669', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 10, elevation: 5 },
  agentName: { color: '#0F172A', fontWeight: 'bold', fontSize: 14 },
  agentModel: { color: '#475569', fontSize: 12, marginTop: 2 },
  demoButton: { backgroundColor: '#059669', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 32 },
  demoButtonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 }
});
