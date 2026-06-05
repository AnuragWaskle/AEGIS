import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, Modal } from 'react-native';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';

export default function Audit() {
  const [logs, setLogs] = useState([]);
  const [selectedLog, setSelectedLog] = useState(null);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await axios.get('http://localhost:8001/api/audit/events?limit=50');
        setLogs(res.data);
      } catch (e) {
        console.error(e);
      }
    };
    fetchLogs();
  }, []);

  const filters = ['ALL', 'CRITICAL', 'HIGH', 'BLOCKED'];

  const filteredLogs = logs.filter(log => {
    if (filter === 'ALL') return true;
    if (filter === 'BLOCKED') return log.decision === 'BLOCKED';
    return log.severity === filter;
  });

  const getThreatColor = (level) => {
    switch(level) {
      case 'CRITICAL': return '#DC2626';
      case 'HIGH': return '#D97706';
      case 'MEDIUM': return '#2563EB';
      case 'LOW': return '#059669';
      default: return '#059669';
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.row} onPress={() => setSelectedLog(item)}>
      <Text style={styles.timeText}>{format(new Date(item.timestamp), 'HH:mm')}</Text>
      <View style={[styles.dot, { backgroundColor: getThreatColor(item.severity) }]} />
      <Text style={styles.agentText}>{item.agent_name}</Text>
      <Text style={[styles.decisionText, { color: item.decision === 'BLOCKED' ? '#DC2626' : '#059669' }]}>{item.decision}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.pageTitle}>Audit Trail</Text>
      
      <View style={styles.filterRow}>
        {filters.map(f => (
          <TouchableOpacity key={f} style={[styles.filterChip, filter === f && styles.filterChipActive]} onPress={() => setFilter(f)}>
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredLogs}
        keyExtractor={item => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
      />

      <Modal visible={!!selectedLog} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          {selectedLog && (
            <>
              <Text style={styles.modalTitle}>Event Details</Text>
              <View style={styles.detailRow}><Text style={styles.detailLabel}>Timestamp:</Text><Text style={styles.detailValue}>{format(new Date(selectedLog.timestamp), 'yyyy-MM-dd HH:mm:ss')}</Text></View>
              <View style={styles.detailRow}><Text style={styles.detailLabel}>Severity:</Text><Text style={[styles.detailValue, { color: getThreatColor(selectedLog.severity) }]}>{selectedLog.severity}</Text></View>
              <View style={styles.detailRow}><Text style={styles.detailLabel}>Agent:</Text><Text style={styles.detailValue}>{selectedLog.agent_name}</Text></View>
              <View style={styles.detailRow}><Text style={styles.detailLabel}>Decision:</Text><Text style={[styles.detailValue, { color: selectedLog.decision === 'BLOCKED' ? '#DC2626' : '#059669' }]}>{selectedLog.decision}</Text></View>
              <Text style={styles.detailLabel}>Summary:</Text>
              <Text style={styles.summaryText}>{selectedLog.input_summary}</Text>
              
              <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedLog(null)}>
                <Text style={styles.closeBtnText}>Close</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', padding: 16 },
  pageTitle: { color: '#0F172A', fontSize: 24, fontWeight: 'bold', marginBottom: 16, marginTop: 16 },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0' },
  filterChipActive: { backgroundColor: '#059669', borderColor: '#059669' },
  filterText: { color: '#475569', fontSize: 12, fontWeight: 'bold' },
  filterTextActive: { color: '#FFFFFF' },
  list: { paddingBottom: 20 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  timeText: { color: '#475569', fontSize: 12, width: 45 },
  dot: { width: 8, height: 8, borderRadius: 4, marginHorizontal: 8 },
  agentText: { color: '#0F172A', fontSize: 13, flex: 1, fontFamily: 'monospace' },
  decisionText: { fontSize: 13, fontWeight: 'bold' },
  modalContainer: { flex: 1, backgroundColor: '#FFFFFF', padding: 24 },
  modalTitle: { color: '#0F172A', fontSize: 20, fontWeight: 'bold', marginBottom: 24 },
  detailRow: { flexDirection: 'row', marginBottom: 12 },
  detailLabel: { color: '#475569', width: 100, fontSize: 14 },
  detailValue: { color: '#0F172A', fontSize: 14, fontWeight: 'bold', flex: 1 },
  summaryText: { color: '#0F172A', fontSize: 14, marginTop: 8, backgroundColor: '#F8FAFC', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  closeBtn: { backgroundColor: '#059669', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 'auto' },
  closeBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 }
});
