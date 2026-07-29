import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert,
  ScrollView, FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { templatesAPI, ministriesAPI } from '../services/api';
import { Ministry } from '../types';
import { useToast } from '../contexts/ToastContext';

interface SegmentInput {
  key: string;
  title: string;
  durationMin: string;
  ministryId: string;
}

export default function CreateTemplateScreen({ navigation }: any) {
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [segments, setSegments] = useState<SegmentInput[]>([
    { key: '1', title: '', durationMin: '', ministryId: '' },
  ]);
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadMinistries();
  }, []);

  const loadMinistries = async () => {
    try {
      const response = await ministriesAPI.getAll();
      setMinistries(response.data);
    } catch (error) {
      console.error('Error loading ministries:', error);
    }
  };

  const addSegment = () => {
    setSegments((prev) => [
      ...prev,
      { key: Date.now().toString(), title: '', durationMin: '', ministryId: '' },
    ]);
  };

  const removeSegment = (key: string) => {
    if (segments.length <= 1) return;
    setSegments((prev) => prev.filter((s) => s.key !== key));
  };

  const updateSegment = (key: string, field: keyof SegmentInput, value: string) => {
    setSegments((prev) =>
      prev.map((s) => (s.key === key ? { ...s, [field]: value } : s))
    );
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'El nombre de la plantilla es obligatorio');
      return;
    }
    const validSegments = segments.filter((s) => s.title.trim());
    if (validSegments.length === 0) {
      Alert.alert('Error', 'Agrega al menos un segmento');
      return;
    }

    setLoading(true);
    try {
      await templatesAPI.create({
        name: name.trim(),
        description: description.trim() || undefined,
        segments: validSegments.map((s) => ({
          title: s.title.trim(),
          durationMin: s.durationMin ? parseInt(s.durationMin, 10) : undefined,
          ministryId: s.ministryId || undefined,
        })),
      });
      showToast('Plantilla creada', 'success');
      navigation.goBack();
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Error al crear', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.field}>
        <Text style={styles.label}>Nombre de la plantilla</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Ej: Culto Dominical"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Descripción (opcional)</Text>
        <TextInput
          style={styles.input}
          value={description}
          onChangeText={setDescription}
          placeholder="Breve descripción"
          multiline
        />
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Segmentos</Text>
        <TouchableOpacity onPress={addSegment}>
          <Ionicons name="add-circle" size={24} color="#5B5EA6" />
        </TouchableOpacity>
      </View>

      {segments.map((seg, index) => (
        <View key={seg.key} style={styles.segmentCard}>
          <View style={styles.segmentHeader}>
            <Text style={styles.segmentIndex}>{index + 1}</Text>
            {segments.length > 1 && (
              <TouchableOpacity onPress={() => removeSegment(seg.key)}>
                <Ionicons name="close-circle" size={22} color="#f44336" />
              </TouchableOpacity>
            )}
          </View>
          <TextInput
            style={styles.input}
            value={seg.title}
            onChangeText={(v) => updateSegment(seg.key, 'title', v)}
            placeholder="Título del segmento"
          />
          <View style={styles.row}>
            <View style={[styles.field, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.labelSmall}>Duración (min)</Text>
              <TextInput
                style={styles.input}
                value={seg.durationMin}
                onChangeText={(v) => updateSegment(seg.key, 'durationMin', v)}
                placeholder="15"
                keyboardType="number-pad"
              />
            </View>
            <View style={[styles.field, { flex: 2 }]}>
              <Text style={styles.labelSmall}>Ministerio</Text>
              <View style={styles.ministryRow}>
                {ministries.slice(0, 3).map((m) => (
                  <TouchableOpacity
                    key={m.id}
                    style={[
                      styles.ministryChip,
                      seg.ministryId === m.id && styles.ministryChipActive,
                    ]}
                    onPress={() => updateSegment(seg.key, 'ministryId', seg.ministryId === m.id ? '' : m.id)}
                  >
                    <Text style={[
                      styles.ministryChipText,
                      seg.ministryId === m.id && styles.ministryChipTextActive,
                    ]}>{m.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </View>
      ))}

      <TouchableOpacity
        style={[styles.createBtn, loading && styles.btnDisabled]}
        onPress={handleCreate}
        disabled={loading}
      >
        <Text style={styles.createBtnText}>
          {loading ? 'Creando...' : 'Crear plantilla'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 20 },
  field: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 6 },
  labelSmall: { fontSize: 12, fontWeight: '600', color: '#666', marginBottom: 4 },
  input: {
    backgroundColor: '#fff', borderRadius: 10, padding: 12,
    fontSize: 15, borderWidth: 1, borderColor: '#ddd',
  },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 12, marginTop: 8,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#333' },
  segmentCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14,
    marginBottom: 12, borderWidth: 1, borderColor: '#e0e0e0',
  },
  segmentHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 8,
  },
  segmentIndex: {
    fontSize: 14, fontWeight: '700', color: '#5B5EA6',
    backgroundColor: '#f0f0ff', paddingHorizontal: 10,
    paddingVertical: 2, borderRadius: 8, overflow: 'hidden',
  },
  row: { flexDirection: 'row' },
  ministryRow: { flexDirection: 'row', flexWrap: 'wrap' },
  ministryChip: {
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 8, backgroundColor: '#f0f0f0', marginRight: 6, marginBottom: 4,
  },
  ministryChipActive: { backgroundColor: '#5B5EA6' },
  ministryChipText: { fontSize: 12, color: '#666' },
  ministryChipTextActive: { color: '#fff' },
  createBtn: {
    backgroundColor: '#5B5EA6', borderRadius: 12,
    padding: 16, alignItems: 'center', marginTop: 12,
  },
  btnDisabled: { opacity: 0.6 },
  createBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
