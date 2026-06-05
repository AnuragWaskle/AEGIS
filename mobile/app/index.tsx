import { View, Text, FlatList, StyleSheet, SafeAreaView, TouchableOpacity, Animated } from 'react-native';
import { Shield, CheckCircle } from 'lucide-react-native';
import { useAegisStore } from '../store/aegisStore';
import { formatDistanceToNow } from 'date-fns';

export default function AlertFeed() {
  const { events, isConnected, currentThreatLevel } = useAegisStore();

  const getThreatColor = (level) => {
    switch(level) {
      case 'CRITICAL': return '#FEF2F2';
      case 'HIGH': return '#FFFBEB';
      case 'MEDIUM': return '#EFF6FF';
      case 'LOW': return '#ECFDF5';
      default: return '#ECFDF5';
    }
  };

  const getThreatTextColor = (level) => {
    switch(level) {
      case 'CRITICAL': return '#DC2626';
      case 'HIGH': return '#D97706';
      case 'MEDIUM': return '#2563EB';
      case 'LOW': return '#059669';
      default: return '#059669';
    }
  };

  const renderItem = ({ item }) => {
    const isBlocked = item.decision === 'BLOCKED';
    const borderColor = getThreatTextColor(item.severity);
    
    return (
      <View style={[styles.card, { borderLeftColor: borderColor }]}>
        <View style={styles.cardHeader}>
          <View style={styles.cardIconRow}>
            {isBlocked ? <Shield size={16} color="#DC2626" /> : <CheckCircle size={16} color="#059669" />}
            <Text style={styles.cardTitle}>{item.agent_name || 'SYSTEM_EVENT'}</Text>
          </View>
          <View style={styles.cardBadgeRow}>
            <View style={[styles.badge, { backgroundColor: getThreatColor(item.severity) }]}>
              <Text style={[styles.badgeText, { color: getThreatTextColor(item.severity) }]}>{item.severity}</Text>
            </View>
            <Text style={styles.timeText}>{formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}</Text>
          </View>
        </View>
        <Text style={styles.cardSubtitle} numberOfLines={2}>{item.input_summary}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <Shield color="#059669" size={24} />
          <Text style={styles.logoText}>AEGIS</Text>
        </View>
        <View style={[styles.statusDot, { backgroundColor: isConnected ? '#059669' : '#DC2626' }]} />
      </View>

      <View style={[styles.threatBanner, { backgroundColor: getThreatColor(currentThreatLevel) }]}>
        <Text style={styles.threatBannerLabel}>CURRENT THREAT LEVEL</Text>
        <Text style={[styles.threatBannerValue, { color: getThreatTextColor(currentThreatLevel) }]}>
          {currentThreatLevel}
        </Text>
      </View>

      {events.length === 0 ? (
        <View style={styles.emptyState}>
          <Shield size={48} color="#94A3B8" />
          <Text style={styles.emptyStateText}>All Clear — No threats detected</Text>
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoText: { color: '#059669', fontSize: 20, fontWeight: 'bold', letterSpacing: 2 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  threatBanner: { padding: 20, alignItems: 'center', justifyContent: 'center' },
  threatBannerLabel: { color: '#475569', fontSize: 12, fontWeight: 'bold', marginBottom: 4 },
  threatBannerValue: { fontSize: 24, fontWeight: 'bold' },
  listContent: { padding: 16, gap: 12 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', borderLeftWidth: 4, padding: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardIconRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardTitle: { color: '#0F172A', fontWeight: 'bold', fontSize: 14 },
  cardBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  badgeText: { fontSize: 10, fontWeight: 'bold' },
  timeText: { color: '#475569', fontSize: 12 },
  cardSubtitle: { color: '#475569', fontSize: 13, lineHeight: 18 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  emptyStateText: { color: '#475569', fontSize: 16 }
});
