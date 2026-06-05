import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Modal
} from 'react-native';
import { Shield, ShieldAlert, CheckCircle, X, ChevronDown, ChevronUp } from 'lucide-react-native';
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

export default function ThreatIntelligence() {
  const [summary, setSummary] = useState(null);
  const [owasp, setOwasp] = useState([]);
  const [cves, setCves] = useState([]);
  
  const [expandedOwasp, setExpandedOwasp] = useState({});
  const [selectedCve, setSelectedCve] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sumRes, owaspRes, cvesRes] = await Promise.all([
          axios.get(`${API}/api/intelligence/coverage-summary`),
          axios.get(`${API}/api/intelligence/owasp`),
          axios.get(`${API}/api/intelligence/cves`)
        ]);
        setSummary(sumRes.data);
        setOwasp(owaspRes.data);
        setCves(cvesRes.data);
      } catch (e) {
        console.error('Failed to fetch intelligence data', e);
      }
    };
    fetchData();
  }, []);

  const toggleOwasp = (id) => {
    setExpandedOwasp(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (!summary) return <SafeAreaView style={styles.container}><View style={styles.loader} /></SafeAreaView>;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Coverage Hero */}
        <View style={styles.heroContainer}>
          <Shield color={COLORS.green} size={48} style={{ marginBottom: 16 }} />
          <Text style={styles.heroPercent}>{summary.coverage_percentage}%</Text>
          <Text style={styles.heroLabel}>OWASP ASI-10 Coverage</Text>
          
          <View style={styles.chipRow}>
            <View style={[styles.chip, { borderColor: COLORS.green, backgroundColor: 'rgba(0,255,136,0.1)' }]}>
              <CheckCircle color={COLORS.green} size={12} />
              <Text style={[styles.chipText, { color: COLORS.green }]}>{summary.full_coverage} Full Coverage</Text>
            </View>
            <View style={[styles.chip, { borderColor: COLORS.amber, backgroundColor: 'rgba(255,184,0,0.1)' }]}>
              <Text style={[styles.chipText, { color: COLORS.amber }]}>{summary.partial_coverage} Partial</Text>
            </View>
            <View style={[styles.chip, { borderColor: COLORS.blue, backgroundColor: 'rgba(68,136,255,0.1)' }]}>
              <Text style={[styles.chipText, { color: COLORS.blue }]}>{summary.agents_with_identity} Agents Secured</Text>
            </View>
          </View>
        </View>

        {/* OWASP ASI-10 List */}
        <Text style={styles.sectionTitle}>OWASP Coverage Standard</Text>
        <View style={styles.listContainer}>
          {owasp.map(item => (
            <TouchableOpacity 
              key={item.id} 
              style={[styles.owaspCard, { borderLeftColor: item.coverage_level === 'FULL' ? COLORS.green : item.coverage_level === 'PARTIAL' ? COLORS.amber : COLORS.textMuted }]}
              onPress={() => toggleOwasp(item.id)}
            >
              <View style={styles.owaspHeader}>
                <View style={styles.owaspTitleRow}>
                  <Text style={styles.owaspId}>{item.id}</Text>
                  <Text style={styles.owaspName}>{item.name}</Text>
                </View>
                <View style={styles.owaspCoverageBadge}>
                  <Text style={[styles.owaspCoverageText, { color: item.coverage_level === 'FULL' ? COLORS.green : item.coverage_level === 'PARTIAL' ? COLORS.amber : COLORS.textMuted }]}>
                    {item.coverage_level}
                  </Text>
                </View>
              </View>
              
              {expandedOwasp[item.id] && (
                <View style={styles.owaspDetails}>
                  <Text style={styles.owaspDesc}>{item.description}</Text>
                  {item.covered_by.length > 0 && (
                    <View style={styles.coveredByRow}>
                      <Text style={styles.coveredByLabel}>COVERED BY:</Text>
                      {item.covered_by.map(agent => (
                        <View key={agent} style={styles.agentPill}>
                          <Text style={styles.agentPillText}>{agent}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* CVE Cards */}
        <Text style={styles.sectionTitle}>Real Attacks (2025–2026)</Text>
        <View style={styles.listContainer}>
          {cves.map(cve => (
            <TouchableOpacity 
              key={cve.id} 
              style={styles.cveCard}
              onPress={() => setSelectedCve(cve)}
            >
              <View style={styles.cveHeader}>
                <Text style={styles.cveId}>{cve.id}</Text>
                <View style={styles.cveProductBadge}>
                  <Text style={styles.cveProductText}>{cve.product}</Text>
                </View>
              </View>
              <View style={styles.flexRowCenter}>
                <View style={[styles.severityDot, { backgroundColor: cve.severity === 'CRITICAL' ? COLORS.red : COLORS.amber }]} />
                <Text style={styles.cveDesc} numberOfLines={2}>{cve.description}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
        
      </ScrollView>

      {/* CVE Bottom Sheet Modal */}
      <Modal visible={!!selectedCve} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.bottomSheet}>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedCve(null)}>
              <X color={COLORS.textSecondary} size={24} />
            </TouchableOpacity>
            
            {selectedCve && (
              <ScrollView>
                <View style={styles.sheetHeader}>
                  <Text style={styles.sheetCveId}>{selectedCve.id}</Text>
                  <Text style={styles.sheetCveName}>{selectedCve.name}</Text>
                </View>
                
                <View style={styles.sheetBadges}>
                  <Text style={styles.sheetBadge}>{selectedCve.product}</Text>
                  <Text style={styles.sheetBadge}>{selectedCve.date}</Text>
                  <Text style={[styles.sheetBadge, { color: selectedCve.severity === 'CRITICAL' ? COLORS.red : COLORS.amber }]}>
                    {selectedCve.severity}
                  </Text>
                </View>

                <Text style={styles.sheetSectionTitle}>ATTACK DESCRIPTION</Text>
                <Text style={styles.sheetText}>{selectedCve.description}</Text>
                
                <View style={styles.defenseBox}>
                  <View style={styles.flexRowCenter}>
                    <Shield color={COLORS.green} size={16} />
                    <Text style={styles.defenseTitle}>AEGIS DEFENSE</Text>
                  </View>
                  <Text style={styles.defenseText}>{selectedCve.aegis_defense}</Text>
                </View>
                
                <Text style={styles.sheetSource}>Source: {selectedCve.source}</Text>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  loader: { flex: 1, backgroundColor: COLORS.bg },
  scrollContent: { padding: 16, paddingBottom: 40 },
  
  heroContainer: { 
    alignItems: 'center', backgroundColor: COLORS.card, padding: 32,
    borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, marginBottom: 24
  },
  heroPercent: { color: COLORS.green, fontSize: 56, fontWeight: 'bold', marginBottom: 4 },
  heroLabel: { color: COLORS.textPrimary, fontSize: 16, fontWeight: 'bold', marginBottom: 24 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 11, fontWeight: 'bold' },
  
  sectionTitle: { color: COLORS.textPrimary, fontSize: 18, fontWeight: 'bold', marginBottom: 12, marginTop: 8 },
  listContainer: { gap: 12, marginBottom: 24 },
  
  owaspCard: { backgroundColor: COLORS.card, borderRadius: 8, padding: 16, borderWidth: 1, borderColor: COLORS.border, borderLeftWidth: 4 },
  owaspHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  owaspTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  owaspId: { color: COLORS.textSecondary, fontSize: 12, fontFamily: 'monospace', fontWeight: 'bold', backgroundColor: COLORS.surface, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  owaspName: { color: COLORS.textPrimary, fontSize: 14, fontWeight: 'bold', flexShrink: 1 },
  owaspCoverageBadge: { paddingHorizontal: 8, paddingVertical: 2, backgroundColor: COLORS.surface, borderRadius: 4, marginLeft: 8 },
  owaspCoverageText: { fontSize: 10, fontWeight: 'bold', fontFamily: 'monospace' },
  owaspDetails: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.border },
  owaspDesc: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 20 },
  coveredByRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginTop: 12 },
  coveredByLabel: { color: COLORS.textMuted, fontSize: 10, fontFamily: 'monospace', fontWeight: 'bold' },
  agentPill: { backgroundColor: 'rgba(0,255,136,0.1)', borderColor: 'rgba(0,255,136,0.3)', borderWidth: 1, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  agentPillText: { color: COLORS.green, fontSize: 10, fontFamily: 'monospace' },
  
  cveCard: { backgroundColor: COLORS.card, borderRadius: 8, padding: 16, borderWidth: 1, borderColor: COLORS.border, borderTopWidth: 3, borderTopColor: COLORS.red },
  cveHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  cveId: { color: COLORS.red, fontSize: 14, fontWeight: 'bold', fontFamily: 'monospace' },
  cveProductBadge: { backgroundColor: COLORS.surface, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  cveProductText: { color: COLORS.textSecondary, fontSize: 10 },
  flexRowCenter: { flexDirection: 'row', gap: 8, paddingRight: 8 },
  severityDot: { width: 8, height: 8, borderRadius: 4, marginTop: 4 },
  cveDesc: { color: COLORS.textPrimary, fontSize: 13, lineHeight: 18, flex: 1 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  bottomSheet: { backgroundColor: COLORS.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, maxHeight: '85%' },
  closeBtn: { position: 'absolute', top: 16, right: 16, padding: 8, zIndex: 10 },
  sheetHeader: { marginBottom: 12, paddingRight: 30 },
  sheetCveId: { color: COLORS.red, fontSize: 20, fontWeight: 'bold', fontFamily: 'monospace' },
  sheetCveName: { color: COLORS.textPrimary, fontSize: 18, fontWeight: 'bold', marginTop: 4 },
  sheetBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  sheetBadge: { backgroundColor: COLORS.card, color: COLORS.textSecondary, fontSize: 11, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, borderWidth: 1, borderColor: COLORS.border, fontFamily: 'monospace' },
  sheetSectionTitle: { color: COLORS.textMuted, fontSize: 11, fontWeight: 'bold', fontFamily: 'monospace', letterSpacing: 1, marginBottom: 8 },
  sheetText: { color: COLORS.textPrimary, fontSize: 15, lineHeight: 22, marginBottom: 24 },
  defenseBox: { backgroundColor: 'rgba(0,255,136,0.05)', borderColor: 'rgba(0,255,136,0.2)', borderWidth: 1, padding: 16, borderRadius: 8, marginBottom: 24 },
  defenseTitle: { color: COLORS.green, fontSize: 12, fontWeight: 'bold', fontFamily: 'monospace', letterSpacing: 1, marginLeft: 6 },
  defenseText: { color: COLORS.textPrimary, fontSize: 14, lineHeight: 22, marginTop: 8 },
  sheetSource: { color: COLORS.textMuted, fontSize: 12, fontStyle: 'italic' }
});
