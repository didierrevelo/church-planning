import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { templatesAPI } from '../services/api';
import { EmptyState } from '../components';

interface Template {
  id: string;
  name: string;
  description?: string;
  _count: { segments: number; services: number };
}

export default function TemplateListScreen({ navigation }: any) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await templatesAPI.getAll();
      setTemplates(response.data);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadTemplates();
  }, []);

  const handleDelete = (id: string, name: string) => {
    Alert.alert('Eliminar plantilla', `¿Eliminar "${name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive',
        onPress: async () => {
          try {
            await templatesAPI.delete(id);
            setTemplates((prev) => prev.filter((t) => t.id !== id));
          } catch (error) {
            console.error('Error deleting template:', error);
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={templates}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="albums" size={24} color="#5B5EA6" />
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                {item.description && (
                  <Text style={styles.cardDesc} numberOfLines={1}>{item.description}</Text>
                )}
              </View>
              <TouchableOpacity onPress={() => handleDelete(item.id, item.name)}>
                <Ionicons name="trash-outline" size={20} color="#f44336" />
              </TouchableOpacity>
            </View>
            <View style={styles.cardFooter}>
              <Text style={styles.footerText}>{item._count?.segments || 0} segmentos</Text>
              <Text style={styles.footerText}>{item._count?.services || 0} servicios</Text>
            </View>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          <TouchableOpacity
            style={styles.createBtn}
            onPress={() => navigation.navigate('CreateTemplate')}
          >
            <Ionicons name="add-circle" size={20} color="#fff" />
            <Text style={styles.createBtnText}>Nueva plantilla</Text>
          </TouchableOpacity>
        }
        ListEmptyComponent={
          <EmptyState icon="albums-outline" message="Sin plantillas. Crea una para agilizar tus servicios" />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  list: { padding: 16 },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#5B5EA6',
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  createBtnText: { color: '#fff', fontSize: 16, fontWeight: '600', marginLeft: 8 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  cardInfo: { flex: 1, marginLeft: 12 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#333' },
  cardDesc: { fontSize: 13, color: '#666', marginTop: 2 },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  footerText: { fontSize: 12, color: '#999' },
});
