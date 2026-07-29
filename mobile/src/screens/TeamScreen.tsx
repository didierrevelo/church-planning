import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { churchesAPI } from '../services/api';
import { FilterBar, EmptyState } from '../components';

const FILTERS = [
  { key: 'all', label: 'Todos' },
  { key: 'admin', label: 'Admin' },
  { key: 'leader', label: 'Líderes' },
  { key: 'member', label: 'Miembros' },
];

const ROLE_COLORS: Record<string, string> = {
  admin: '#f44336',
  leader: '#FF9800',
  member: '#4CAF50',
};

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  leader: 'Líder',
  member: 'Miembro',
};

export default function TeamScreen() {
  const [members, setMembers] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      const churchId = await AsyncStorage.getItem('churchId');
      if (!churchId) return;
      const response = await churchesAPI.getMembers(churchId);
      setMembers(response.data);
    } catch (error) {
      console.error('Error loading members:', error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadMembers();
    setRefreshing(false);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Miembros</Text>
      </View>

      <FilterBar options={FILTERS} active={filter} onSelect={setFilter} />

      <FlatList
        data={members.filter((m) => filter === 'all' || m.role === filter)}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {item.user?.name?.charAt(0) || '?'}
              </Text>
            </View>
            <View style={styles.info}>
              <Text style={styles.name}>{item.user?.name}</Text>
              <Text style={styles.email}>{item.user?.email}</Text>
            </View>
            <View style={[styles.roleBadge, { backgroundColor: ROLE_COLORS[item.role] || '#999' }]}>
              <Text style={styles.roleText}>{ROLE_LABELS[item.role] || item.role}</Text>
            </View>
          </View>
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <EmptyState icon="people-outline" message="No hay miembros en esta iglesia" />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    backgroundColor: '#5B5EA6',
    padding: 20,
    paddingTop: 50,
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  list: { padding: 16 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#5B5EA6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: '600' },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '600' },
  email: { fontSize: 12, color: '#666', marginTop: 2 },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: { color: '#fff', fontSize: 11, fontWeight: '600' },
});
