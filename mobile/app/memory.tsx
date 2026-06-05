import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Modal, ActivityIndicator, FlatList
} from 'react-native';
import { Shield, Lock, Activity, Clock, CheckCircle, X, ShieldAlert, FileText, Search } from 'lucide-react-native';
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
  purple: '#A855F7',
  orange: '#F97316',
  emeraldDeep: '#065F46',
  textPrimary: '#E8EEF8',
  textSecondary: '#8899AA',
  textMuted: '#445566',
};

export default function MemorySentinel() {
  const [stats, setStats] = useState({ total_memories: 0, quarantined_memories: 0, provenance_breakdown: { high: 0, medium: 0, low: 0 } });
  const [quarantineFeed, setQuarantineFeed] = useState([]);
  const [auditRunning, setAuditRunning] = useState(false);
  const [auditResult, setAuditResult] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  
  const [reviewModal, setReviewModal] = useState(false);
  const [selectedMem, setSelectedMem] = useState(null);

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${API}/api/audit/memory/stats`);
      setStats(res.data);
    } catch (e) {
      console.error('Failed to fetch memory stats', e);
    }
  };

  const fetchQuarantine = async () => {
    try {
      const res = await axios.get(`${API}/api/audit/memory/quarantine`);
      setQuarantineFeed(res.data);
    } catch (e) {
      console.error('Failed to fetch quarantine feed', e);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchQuarantine();
    const interval = setInterval(() => {
      fetchStats();
      fetchQuarantine();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const runAudit = async () => {
    setAuditRunning(true);
    setModalVisible(true);
    try {
      const res = await axios.post(`${API}/api/audit/memory/audit`);
      setAuditResult(res.data);
    } catch (e) {
      console.error('Failed to run audit', e);
    } finally {
      setAuditRunning(false);
    }
  };

  const handleRelease = async (id) => {
    try {
      await axios.post(`${API}/api/audit/memory/restore/${id}`);
      setReviewModal(false);
      fetchStats();
      fetchQuarantine();
    } catch (e) {
      console.error('Failed to release', e);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API}/api/audit/memory/quarantine/${id}`);
      setReviewModal(false);
      fetchStats();
      fetchQuarantine();
    } catch (e) {
      console.error('Failed to delete', e);
    }
  };

  const openReview = (mem) => {
    setSelectedMem(mem);
    setReviewModal(true);
  };

  const renderQuarantineItem = ({ item }) => (
    <View style={styles.quarantineCard}>
      <View style={styles.quarantineHeader}>
        <View style={styles.flexRow}>
          <Lock color={COLORS.red} size={14} />
          <View style={styles.poisonBadge}>
            <Text style={styles.poisonBadgeText}>
              {item.quarantine_reason.split('-')[1]?.trim() || 'POISON_ATTEMPT'}
            </Text>
          </View>
        </View>
        <Text style={styles.provScoreText}>Score: {item.provenance_score.toFixed(2)}</Text>
      </View>
      <Text style={styles.contentPreview}>
        {item.content.length > 40 ? item.content.substring(0, 40) + '...' : item.content}
      </Text>
      <TouchableOpacity style={styles.reviewBtn} onPress={() => openReview(item)}>
        <Text style={styles.reviewBtnText}>Review Payload</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Lock color={COLORS.green} size={28} />
        <Text style={styles.pageTitle}>Memory Sentinel</Text>
        <View style={styles.onlineBadge}>
          <Text style={styles.onlineText}>ONLINE</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Stats Grid */}
        <View style={styles.grid}>
          <View style={styles.statCard}>
            <Text style={styles.statValueBlue}>{stats.total_memories}</Text>
            <Text style={styles.statLabel}>Total Memories</Text>
          </View>
          <View style={[styles.statCard, stats.quarantined_memories > 0 && styles.statCardAlert]}>
            <Text style={styles.statValueRed}>{stats.quarantined_memories}</Text>
            <Text style={styles.statLabel}>Quarantined</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValueAmber}>
              {stats.total_memories > 0 ? ((stats.provenance_breakdown.high / stats.total_memories) * 100).toFixed(0) + '%' : '0%'}
            </Text>
            <Text style={styles.statLabel}>Avg Trust Score</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValuePurple}>{auditResult ? auditResult.campaigns_detected?.length || 0 : 0}</Text>
            <Text style={styles.statLabel}>Campaigns Detected</Text>
          </View>
        </View>

        {/* Provenance Scale Visual */}
        <View style={styles.scaleContainer}>
          <Text style={styles.scaleTitle}>Memory Trust Scale</Text>
          <View style={styles.scaleBar}>
            <View style={[styles.scaleSegment, { backgroundColor: COLORS.red, borderTopLeftRadius: 4, borderBottomLeftRadius: 4 }]} />
            <View style={[styles.scaleSegment, { backgroundColor: COLORS.orange }]} />
            <View style={[styles.scaleSegment, { backgroundColor: COLORS.amber }]} />
            <View style={[styles.scaleSegment, { backgroundColor: COLORS.green }]} />
            <View style={[styles.scaleSegment, { backgroundColor: COLORS.emeraldDeep, borderTopRightRadius: 4, borderBottomRightRadius: 4 }]} />
          </View>
          <View style={styles.scaleLabels}>
            <Text style={styles.scaleLabelText}>Ext. URL</Text>
            <Text style={styles.scaleLabelText}>Doc Upload</Text>
            <Text style={styles.scaleLabelText}>Customer</Text>
            <Text style={styles.scaleLabelText}>Agent</Text>
            <Text style={styles.scaleLabelText}>System</Text>
          </View>
        </View>

        {/* Quarantine List */}
        <Text style={styles.sectionTitle}>Quarantine Hold</Text>
        {quarantineFeed.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Shield color={COLORS.textMuted} size={48} />
            <Text style={styles.emptyText}>No quarantined memories.</Text>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {quarantineFeed.map(item => <View key={item.id}>{renderQuarantineItem({item})}</View>)}
          </View>
        )}
      </ScrollView>

      {/* Audit Button (Bottom) */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.auditBtn} onPress={runAudit} disabled={auditRunning}>
          {auditRunning ? <ActivityIndicator color="#000" size="small" /> : <Search color="#000" size={20} />}
          <Text style={styles.auditBtnText}>Run Full Memory Audit</Text>
        </TouchableOpacity>
      </View>

      {/* Audit Modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.closeBtn} onPress={() => setModalVisible(false)}>
            <X color={COLORS.textSecondary} size={24} />
          </TouchableOpacity>
          <View style={styles.modalContent}>
            <Shield color={COLORS.green} size={48} style={{ marginBottom: 16 }} />
            <Text style={styles.modalTitle}>Memory Audit Report</Text>
            
            {auditRunning ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color={COLORS.green} size="large" />
                <Text style={styles.loadingText}>Scanning Vector Memory...</Text>
              </View>
            ) : auditResult ? (
              <View style={{ width: '100%', marginTop: 24 }}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Total Scanned</Text>
                  <Text style={styles.detailValue}>{auditResult.total}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Quarantined</Text>
                  <Text style={[styles.detailValue, { color: COLORS.red }]}>{auditResult.quarantined}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Campaigns</Text>
                  <Text style={[styles.detailValue, { color: COLORS.amber }]}>{auditResult.campaigns_detected.length}</Text>
                </View>
                
                {auditResult.campaigns_detected.length > 0 && (
                  <View style={{ marginTop: 24 }}>
                    <Text style={styles.detailSectionTitle}>PERSISTENT CAMPAIGNS</Text>
                    {auditResult.campaigns_detected.map((camp, i) => (
                      <View key={i} style={styles.campaignCard}>
                        <Text style={styles.campaignText}>"{camp.phrase}"</Text>
                        <Text style={styles.campaignSub}>Found across {camp.occurrences} memories</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ) : null}
          </View>
        </View>
      </Modal>

      {/* Review Modal */}
      <Modal visible={reviewModal} animationType="slide" presentationStyle="formSheet">
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.closeBtn} onPress={() => setReviewModal(false)}>
            <X color={COLORS.textSecondary} size={24} />
          </TouchableOpacity>
          {selectedMem && (
            <ScrollView contentContainerStyle={styles.reviewContent}>
              <View style={styles.flexRowCenter}>
                <Lock color={COLORS.red} size={24} />
                <Text style={styles.modalTitle}>Payload Review</Text>
              </View>
              
              <View style={styles.reviewDetailBox}>
                <Text style={styles.reviewLabel}>ID</Text>
                <Text style={styles.reviewValue}>{selectedMem.id}</Text>
                
                <Text style={[styles.reviewLabel, { marginTop: 12 }]}>SOURCE</Text>
                <Text style={styles.reviewValue}>{selectedMem.source}</Text>
                
                <Text style={[styles.reviewLabel, { marginTop: 12 }]}>SCORE</Text>
                <Text style={[styles.reviewValue, { color: selectedMem.provenance_score < 0.5 ? COLORS.red : COLORS.green }]}>
                  {selectedMem.provenance_score.toFixed(2)}
                </Text>
              </View>
              
              <Text style={[styles.reviewLabel, { marginTop: 16, marginBottom: 8 }]}>RAW CONTENT</Text>
              <View style={styles.codeBox}>
                <Text style={styles.codeText}>{selectedMem.content}</Text>
              </View>
              
              <View style={styles.actionButtons}>
                <TouchableOpacity style={styles.releaseBtn} onPress={() => handleRelease(selectedMem.id)}>
                  <Text style={styles.releaseBtnText}>Release</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(selectedMem.id)}>
                  <Text style={styles.deleteBtnText}>Delete</Text>
                </TouchableOpacity>
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
  scrollContent: { padding: 16, paddingBottom: 100 },
  header: {
    flexDirection: 'row', alignItems: 'center', padding: 16,
    borderBottomWidth: 1, borderBottomColor: COLORS.border, gap: 12
  },
  pageTitle: { color: COLORS.textPrimary, fontSize: 20, fontWeight: 'bold' },
  onlineBadge: {
    backgroundColor: 'rgba(0,255,136,0.15)',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginLeft: 'auto'
  },
  onlineText: { color: COLORS.green, fontSize: 10, fontWeight: 'bold' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  statCard: {
    width: '48%', backgroundColor: COLORS.card, borderRadius: 12,
    padding: 16, borderWidth: 1, borderColor: COLORS.border,
    alignItems: 'flex-start', justifyContent: 'center'
  },
  statCardAlert: { borderColor: COLORS.red, backgroundColor: '#2E0A0A' },
  statValueBlue: { color: COLORS.blue, fontSize: 28, fontWeight: 'bold', fontFamily: 'monospace' },
  statValueRed: { color: COLORS.red, fontSize: 28, fontWeight: 'bold', fontFamily: 'monospace' },
  statValueAmber: { color: COLORS.amber, fontSize: 28, fontWeight: 'bold', fontFamily: 'monospace' },
  statValuePurple: { color: COLORS.purple, fontSize: 28, fontWeight: 'bold', fontFamily: 'monospace' },
  statLabel: { color: COLORS.textSecondary, fontSize: 11, marginTop: 4 },
  
  scaleContainer: {
    backgroundColor: COLORS.card, padding: 16, borderRadius: 12,
    borderWidth: 1, borderColor: COLORS.border, marginBottom: 24
  },
  scaleTitle: { color: COLORS.textPrimary, fontSize: 14, fontWeight: 'bold', marginBottom: 12 },
  scaleBar: { flexDirection: 'row', height: 8, width: '100%', marginBottom: 8 },
  scaleSegment: { flex: 1, height: '100%' },
  scaleLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  scaleLabelText: { color: COLORS.textMuted, fontSize: 9, fontFamily: 'monospace', width: '20%', textAlign: 'center' },
  
  sectionTitle: { color: COLORS.textPrimary, fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyText: { color: COLORS.textMuted, fontSize: 14, marginTop: 12 },
  
  quarantineCard: {
    backgroundColor: COLORS.card, borderRadius: 8, padding: 12,
    borderWidth: 1, borderColor: COLORS.border, borderLeftWidth: 3, borderLeftColor: COLORS.red,
    marginBottom: 10
  },
  quarantineHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  flexRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  flexRowCenter: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24, justifyContent: 'center' },
  poisonBadge: { backgroundColor: '#2E0A0A', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: COLORS.red },
  poisonBadgeText: { color: COLORS.red, fontSize: 9, fontWeight: 'bold', fontFamily: 'monospace' },
  provScoreText: { color: COLORS.textMuted, fontSize: 10, fontFamily: 'monospace' },
  contentPreview: { color: COLORS.textSecondary, fontSize: 12, fontFamily: 'monospace', marginBottom: 12 },
  reviewBtn: { backgroundColor: COLORS.surface, padding: 8, borderRadius: 6, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  reviewBtnText: { color: COLORS.textPrimary, fontSize: 12, fontWeight: 'bold' },
  
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.bg, padding: 16, borderTopWidth: 1, borderTopColor: COLORS.border
  },
  auditBtn: {
    backgroundColor: COLORS.green, padding: 16, borderRadius: 10,
    alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 10
  },
  auditBtnText: { color: '#000', fontWeight: 'bold', fontSize: 16 },
  
  modalContainer: { flex: 1, backgroundColor: COLORS.bg, padding: 24, paddingTop: 48 },
  closeBtn: { position: 'absolute', top: 16, right: 16, padding: 8, zIndex: 10 },
  modalContent: { alignItems: 'center', paddingTop: 20 },
  modalTitle: { color: COLORS.textPrimary, fontSize: 22, fontWeight: 'bold' },
  loadingContainer: { alignItems: 'center', marginTop: 40 },
  loadingText: { color: COLORS.textSecondary, fontSize: 14, marginTop: 16, fontFamily: 'monospace' },
  
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  detailLabel: { color: COLORS.textSecondary, fontSize: 14 },
  detailValue: { color: COLORS.textPrimary, fontSize: 16, fontWeight: 'bold', fontFamily: 'monospace' },
  detailSectionTitle: { color: COLORS.textMuted, fontSize: 11, fontWeight: 'bold', marginBottom: 12, letterSpacing: 1 },
  campaignCard: { backgroundColor: '#2A1A00', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: COLORS.amber, marginBottom: 8 },
  campaignText: { color: COLORS.amber, fontSize: 13, fontWeight: 'bold', fontFamily: 'monospace', marginBottom: 4 },
  campaignSub: { color: '#B45309', fontSize: 10 },
  
  reviewContent: { paddingBottom: 40 },
  reviewDetailBox: { backgroundColor: COLORS.card, padding: 16, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border },
  reviewLabel: { color: COLORS.textMuted, fontSize: 10, fontWeight: 'bold', fontFamily: 'monospace', letterSpacing: 1 },
  reviewValue: { color: COLORS.textPrimary, fontSize: 14, fontFamily: 'monospace', marginTop: 2 },
  codeBox: { backgroundColor: '#000', padding: 16, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border },
  codeText: { color: COLORS.textSecondary, fontSize: 12, fontFamily: 'monospace', lineHeight: 20 },
  
  actionButtons: { flexDirection: 'row', gap: 12, marginTop: 24 },
  releaseBtn: { flex: 1, backgroundColor: COLORS.green, padding: 14, borderRadius: 8, alignItems: 'center' },
  releaseBtnText: { color: '#000', fontWeight: 'bold', fontSize: 14 },
  deleteBtn: { flex: 1, backgroundColor: 'transparent', padding: 14, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: COLORS.red },
  deleteBtnText: { color: COLORS.red, fontWeight: 'bold', fontSize: 14 },
});
