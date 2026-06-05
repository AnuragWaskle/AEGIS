import {
  View, Text, StyleSheet, SafeAreaView, FlatList,
  TouchableOpacity, Modal, ScrollView, RefreshControl
} from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { ShieldAlert, CheckCircle, X } from 'lucide-react-native';

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

const SEV_COLORS = {
  CRITICAL: '#FF4444',
  HIGH: '#FFB800',
  MEDIUM: '#4488FF',
  LOW: '#00FF88',
};

export default function Audit() {
  const [logs, setLogs] = useState([]);
  const [selectedLog, setSelectedLog] = useState(null);
  const [filter, setFilter] = useState('ALL');
  const [refreshing, setRefreshing] = useState(false);

  const fetchLogs = useCallback(async () => {
    try {
      const params = new URLSearchParams({ limit: 50 });
      if (filter === 'CRITICAL') params.set('severity', 'CRITICAL');
      if (filter === 'HIGH') params.set('severity', 'HIGH');
      const res = await axios.get(`${API}/api/audit/events?${params}`);
      setLogs(res.data);
    } catch (e) {
      console.error('Audit fetch error:', e);
    }
  }, [filter]);

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 10000);
    return () => clearInterval(interval);
  }, [fetchLogs]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLogs();
    setRefreshing(false);
  };

  const filters = ['ALL', 'CRITICAL', 'HIGH', 'BLOCKED'];

  const filteredLogs = logs.filter(log => {
    if (filter === 'ALL' || filter === 'CRITICAL' || filter === 'HIGH') return true; // already filtered via API
    if (filter === 'BLOCKED') return log.decision === 'BLOCKED';
    return true;
  });

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.row, { borderLeftColor: SEV_COLORS[item.severity] || COLORS.border }]}
      onPress={() => setSelectedLog(item)}
      activeOpacity={0.7}
    >
      <View style={styles.rowLeft}>
        {item.decision === 'BLOCKED'
          ? <ShieldAlert color={COLORS.red} size={14} />
          : <CheckCircle color={COLORS.green} size={14} />}
        <View style={styles.rowContent}>
          <Text style={styles.agentText}>{item.agent_name}</Text>
          <Text style={styles.summaryText} numberOfLines={1}>{item.input_summary}</Text>
        </View>
      </View>
      <View style={styles.rowRight}>
        <View style={[styles.sevBadge, { borderColor: SEV_COLORS[item.severity] || COLORS.border }]}>
          <Text style={[styles.sevText, { color: SEV_COLORS[item.severity] || COLORS.textMuted }]}>
            {item.severity}
          </Text>
        </View>
        <Text style={styles.timeText}>{format(new Date(item.timestamp + (item.timestamp.endsWith('Z') ? '' : 'Z')), 'HH:mm')}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.pageTitle}>Audit Trail</Text>

      {/* Filter chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>
        {filters.map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={filteredLogs}
        keyExtractor={item => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.green} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <CheckCircle color={COLORS.textMuted} size={40} />
            <Text style={styles.emptyText}>No events yet. Run a simulation.</Text>
          </View>
        }
      />

      {/* Detail Modal */}
      <Modal visible={!!selectedLog} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Event Details</Text>
            <TouchableOpacity onPress={() => setSelectedLog(null)} style={styles.modalCloseBtn}>
              <X color={COLORS.textSecondary} size={22} />
            </TouchableOpacity>
          </View>

          {selectedLog && (
            <ScrollView contentContainerStyle={{ gap: 12, paddingBottom: 40 }}>
              {/* Status banner */}
              <View style={[styles.statusBanner, {
                backgroundColor: selectedLog.decision === 'BLOCKED' ? '#2E0A0A' : '#0A2E1A',
                borderColor: selectedLog.decision === 'BLOCKED' ? COLORS.red : COLORS.green
              }]}>
                {selectedLog.decision === 'BLOCKED'
                  ? <ShieldAlert color={COLORS.red} size={24} />
                  : <CheckCircle color={COLORS.green} size={24} />}
                <Text style={[styles.statusText, { color: selectedLog.decision === 'BLOCKED' ? COLORS.red : COLORS.green }]}>
                  {selectedLog.decision}
                </Text>
                <Text style={[styles.sevChip, { color: SEV_COLORS[selectedLog.severity] || COLORS.textMuted }]}>
                  {selectedLog.severity}
                </Text>
              </View>

              {/* Detail rows */}
              {[
                ['Event Type', selectedLog.event_type],
                ['Agent', selectedLog.agent_name],
                ['Timestamp', format(new Date(selectedLog.timestamp + (selectedLog.timestamp.endsWith('Z') ? '' : 'Z')), 'yyyy-MM-dd HH:mm:ss')],
                ['Event ID', selectedLog.id],
                ['Request ID', selectedLog.request_id || '—'],
                ['Impact Level', selectedLog.blast_radius_score != null
                  ? `${selectedLog.blast_radius_score}/100 (${selectedLog.blast_radius_category})`
                  : '—'],
              ].map(([label, value]) => (
                <View key={label} style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{label}</Text>
                  <Text style={styles.detailValue}>{value}</Text>
                </View>
              ))}

              {/* Input Summary */}
              <View style={styles.detailBox}>
                <Text style={styles.detailLabel}>Input Summary</Text>
                <Text style={styles.detailBoxText}>{selectedLog.input_summary}</Text>
              </View>

              {/* JSON Details */}
              <View style={styles.detailBox}>
                <Text style={styles.detailLabel}>Full Details (JSON)</Text>
                <Text style={styles.jsonText}>
                  {JSON.stringify(JSON.parse(selectedLog.details || '{}'), null, 2)}
                </Text>
              </View>
            </ScrollView>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  pageTitle: {
    color: COLORS.textPrimary, fontSize: 22, fontWeight: 'bold',
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8,
  },
  filterScroll: { marginBottom: 12, maxHeight: 44 },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border,
  },
  filterChipActive: { backgroundColor: 'rgba(0,255,136,0.15)', borderColor: COLORS.green },
  filterText: { color: COLORS.textSecondary, fontSize: 12, fontWeight: 'bold' },
  filterTextActive: { color: COLORS.green },
  list: { paddingHorizontal: 16, paddingBottom: 20, gap: 8 },
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.card, padding: 12, borderRadius: 10,
    borderWidth: 1, borderColor: COLORS.border, borderLeftWidth: 4,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  rowContent: { flex: 1 },
  agentText: { color: COLORS.textPrimary, fontSize: 12, fontWeight: 'bold', fontFamily: 'monospace' },
  summaryText: { color: COLORS.textSecondary, fontSize: 11, marginTop: 2 },
  rowRight: { alignItems: 'flex-end', gap: 4 },
  sevBadge: { borderWidth: 1, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 },
  sevText: { fontSize: 9, fontWeight: 'bold' },
  timeText: { color: COLORS.textMuted, fontSize: 10 },
  emptyState: { flex: 1, alignItems: 'center', padding: 48, gap: 12 },
  emptyText: { color: COLORS.textMuted, fontSize: 14, textAlign: 'center' },
  // Modal
  modalContainer: { flex: 1, backgroundColor: COLORS.bg, padding: 20, paddingTop: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { color: COLORS.textPrimary, fontSize: 18, fontWeight: 'bold' },
  modalCloseBtn: { padding: 8 },
  statusBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16,
    borderRadius: 12, borderWidth: 2, marginBottom: 4,
  },
  statusText: { fontSize: 16, fontWeight: 'bold', flex: 1 },
  sevChip: { fontSize: 12, fontWeight: 'bold' },
  detailRow: {
    flexDirection: 'row', backgroundColor: COLORS.card, padding: 12,
    borderRadius: 10, borderWidth: 1, borderColor: COLORS.border,
  },
  detailLabel: { color: COLORS.textMuted, fontSize: 12, width: 110 },
  detailValue: { color: COLORS.textPrimary, fontSize: 12, flex: 1, fontFamily: 'monospace' },
  detailBox: {
    backgroundColor: COLORS.card, padding: 12,
    borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, gap: 8,
  },
  detailBoxText: { color: COLORS.textSecondary, fontSize: 12, lineHeight: 18 },
  jsonText: {
    color: COLORS.textSecondary, fontSize: 10, fontFamily: 'monospace', lineHeight: 16,
  },
});
