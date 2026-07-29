import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { reportsAPI } from '../services/api';
import { LoadingScreen } from '../components';

interface DashboardData {
  totalServices: number;
  servicesThisMonth: number;
  servicesThisYear: number;
  totalSongs: number;
  totalMembers: number;
  totalMinistries: number;
}

export default function DashboardScreen({ navigation }: any) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await reportsAPI.getDashboard();
      setData(res.data);
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, []);

  if (loading) return <LoadingScreen />;

  const cards = [
    { icon: 'calendar', label: 'Servicios totales', value: data?.totalServices ?? 0, color: '#5B5EA6' },
    { icon: 'calendar-outline', label: 'Este mes', value: data?.servicesThisMonth ?? 0, color: '#4CAF50' },
    { icon: 'calendar', label: 'Este año', value: data?.servicesThisYear ?? 0, color: '#FF9800' },
    { icon: 'musical-notes', label: 'Canciones', value: data?.totalSongs ?? 0, color: '#E91E63' },
    { icon: 'people', label: 'Miembros', value: data?.totalMembers ?? 0, color: '#2196F3' },
    { icon: 'git-branch', label: 'Ministerios', value: data?.totalMinistries ?? 0, color: '#9C27B0' },
  ];

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}>
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard</Text>
        <Text style={styles.subtitle}>Resumen de la iglesia</Text>
      </View>

      <View style={styles.grid}>
        {cards.map((card) => (
          <View key={card.label} style={[styles.card, { borderLeftColor: card.color }]}>
            <Ionicons name={card.icon as any} size={24} color={card.color} />
            <Text style={styles.cardValue}>{card.value}</Text>
            <Text style={styles.cardLabel}>{card.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Última actualización: {new Date().toLocaleTimeString('es-ES')}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { padding: 20, paddingTop: 30 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#333' },
  subtitle: { fontSize: 14, color: '#999', marginTop: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12 },
  card: {
    width: '44%', backgroundColor: '#fff', borderRadius: 12, padding: 16, margin: '3%',
    borderLeftWidth: 3,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 }, shadowRadius: 4,
  },
  cardValue: { fontSize: 32, fontWeight: 'bold', color: '#333', marginTop: 8 },
  cardLabel: { fontSize: 12, color: '#999', marginTop: 4 },
  footer: { alignItems: 'center', paddingVertical: 20 },
  footerText: { fontSize: 12, color: '#ccc' },
});
