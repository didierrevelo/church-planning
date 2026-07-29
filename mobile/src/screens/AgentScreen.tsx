import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, ScrollView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { agentAPI, servicesAPI } from '../services/api';
import { LoadingScreen, EmptyState } from '../components';
import { useToast } from '../contexts/ToastContext';

interface AgentRun {
  id: string;
  type: string;
  status: string;
  input: { serviceId: string } | null;
  output: { assignments: any[]; log: string[] } | null;
  error: string | null;
  createdAt: string;
}

interface Service {
  id: string;
  title: string;
}

export default function AgentScreen({ navigation }: any) {
  const { showToast } = useToast();
  const [runs, setRuns] = useState<AgentRun[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedRun, setExpandedRun] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [servicesRes, historyRes] = await Promise.all([
        servicesAPI.getAll(),
        agentAPI.getHistory(),
      ]);
      setServices(servicesRes.data.data || servicesRes.data);
      setRuns(historyRes.data.data || []);
    } catch (error) {
      console.error('Error loading agent data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
  }, []);

  const handleAssign = async () => {
    if (!selectedService) {
      Alert.alert('Selecciona un servicio', 'Elige un servicio para asignar el equipo');
      return;
    }
    setRunning(true);
    try {
      const res = await agentAPI.assignTeam(selectedService);
      const assignments = res.data.assignments?.length || 0;
      showToast(`Agente asignó ${assignments} miembros`, 'success');
      setSelectedService(null);
      loadData();
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Error del agente', 'error');
    } finally {
      setRunning(false);
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.hero}>
        <Ionicons name="cog" size={48} color="#fff" />
        <Text style={styles.heroTitle}>Agente de Asignación</Text>
        <Text style={styles.heroDesc}>
          Asigna automáticamente miembros al equipo según ministerios y roles
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Asignar equipo</Text>
        <Text style={styles.sectionDesc}>Selecciona un servicio y el agente asignará al equipo ideal</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.serviceRow}>
          {services.map((s) => (
            <TouchableOpacity
              key={s.id}
              style={[styles.serviceChip, selectedService === s.id && styles.serviceChipActive]}
              onPress={() => setSelectedService(selectedService === s.id ? null : s.id)}
            >
              <Ionicons
                name="calendar"
                size={14}
                color={selectedService === s.id ? '#fff' : '#5B5EA6'}
              />
              <Text style={[styles.serviceChipText, selectedService === s.id && styles.serviceChipTextActive]}>
                {s.title}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <TouchableOpacity
          style={[styles.runBtn, running && styles.runBtnDisabled]}
          onPress={handleAssign}
          disabled={running || !selectedService}
        >
          <Ionicons name="flash" size={20} color="#fff" />
          <Text style={styles.runBtnText}>
            {running ? 'Asignando...' : 'Ejecutar agente'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Historial</Text>
        {runs.length === 0 ? (
          <EmptyState icon="time-outline" message="Aún no se ha ejecutado el agente" />
        ) : (
          runs.map((run) => (
            <TouchableOpacity
              key={run.id}
              style={styles.runCard}
              onPress={() => setExpandedRun(expandedRun === run.id ? null : run.id)}
            >
              <View style={styles.runHeader}>
                <View style={[styles.statusDot, {
                  backgroundColor: run.status === 'completed' ? '#4CAF50' : '#FF9800',
                }]} />
                <View style={styles.runInfo}>
                  <Text style={styles.runType}>
                    {run.type === 'assign-team' ? 'Asignación de equipo' : run.type}
                  </Text>
                  <Text style={styles.runDate}>
                    {new Date(run.createdAt).toLocaleDateString('es-ES', {
                      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                    })}
                  </Text>
                </View>
                <Ionicons
                  name={expandedRun === run.id ? 'chevron-up' : 'chevron-down'}
                  size={20} color="#999"
                />
              </View>
              {expandedRun === run.id && run.output?.log && (
                <View style={styles.runLog}>
                  {run.output.log.map((line, i) => (
                    <Text key={i} style={styles.logLine}>{line}</Text>
                  ))}
                </View>
              )}
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  hero: {
    backgroundColor: '#5B5EA6',
    padding: 30, paddingTop: 40,
    alignItems: 'center',
  },
  heroTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginTop: 12 },
  heroDesc: { fontSize: 14, color: '#fff', opacity: 0.8, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  section: { padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#333' },
  sectionDesc: { fontSize: 13, color: '#666', marginTop: 4, marginBottom: 12 },
  serviceRow: { marginBottom: 16 },
  serviceChip: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 10, backgroundColor: '#fff',
    marginRight: 8, borderWidth: 1, borderColor: '#ddd',
  },
  serviceChipActive: { backgroundColor: '#5B5EA6', borderColor: '#5B5EA6' },
  serviceChipText: { fontSize: 13, color: '#333', marginLeft: 6, fontWeight: '500' },
  serviceChipTextActive: { color: '#fff' },
  runBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#4CAF50', padding: 16, borderRadius: 12,
  },
  runBtnDisabled: { opacity: 0.6 },
  runBtnText: { color: '#fff', fontSize: 16, fontWeight: '700', marginLeft: 8 },
  runCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14,
    marginBottom: 8,
  },
  runHeader: { flexDirection: 'row', alignItems: 'center' },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  runInfo: { flex: 1 },
  runType: { fontSize: 14, fontWeight: '600', color: '#333' },
  runDate: { fontSize: 12, color: '#999', marginTop: 2 },
  runLog: {
    marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f0f0f0',
  },
  logLine: { fontSize: 12, color: '#555', lineHeight: 18, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
});
