import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { servicesAPI, templatesAPI } from '../services/api';
import { useToast } from '../contexts/ToastContext';

interface Template {
  id: string;
  name: string;
  _count: { segments: number };
}

export default function CreateServiceScreen({ navigation }: any) {
  const { showToast } = useToast();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('10:00');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await templatesAPI.getAll();
      setTemplates(response.data);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'El título es obligatorio');
      return;
    }
    if (!date) {
      Alert.alert('Error', 'La fecha es obligatoria');
      return;
    }

    setLoading(true);
    try {
      const response = await servicesAPI.create({
        title: title.trim(),
        date: new Date(date + 'T' + time).toISOString(),
        time,
      });

      const serviceId = response.data.id;

      if (selectedTemplate) {
        await templatesAPI.apply(selectedTemplate, serviceId);
      }

      showToast('Servicio creado con éxito', 'success');
      navigation.goBack();
    } catch (error: any) {
      showToast(error.response?.data?.error || 'No se pudo crear', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.field}>
        <Text style={styles.label}>Título del servicio</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Ej: Culto de Domingo"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Fecha</Text>
        <TextInput
          style={styles.input}
          value={date}
          onChangeText={setDate}
          placeholder="YYYY-MM-DD"
        />
        <Text style={styles.hint}>Formato: AAAA-MM-DD (ej: 2026-08-02)</Text>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Hora</Text>
        <TextInput
          style={styles.input}
          value={time}
          onChangeText={setTime}
          placeholder="HH:MM"
        />
      </View>

      {templates.length > 0 && (
        <View style={styles.field}>
          <Text style={styles.label}>Plantilla (opcional)</Text>
          <Text style={styles.hint}>Auto-llenar segmentos desde una plantilla</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.templateRow}>
            {templates.map((t) => (
              <TouchableOpacity
                key={t.id}
                style={[styles.templateChip, selectedTemplate === t.id && styles.templateChipActive]}
                onPress={() => setSelectedTemplate(selectedTemplate === t.id ? null : t.id)}
              >
                <Ionicons
                  name="albums"
                  size={16}
                  color={selectedTemplate === t.id ? '#fff' : '#5B5EA6'}
                />
                <Text style={[styles.templateChipText, selectedTemplate === t.id && styles.templateChipTextActive]}>
                  {t.name}
                </Text>
                <Text style={[styles.templateCount, selectedTemplate === t.id && styles.templateChipTextActive]}>
                  {t._count.segments} seg.
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <TouchableOpacity
        style={[styles.btn, loading && styles.btnDisabled]}
        onPress={handleCreate}
        disabled={loading}
      >
        <Text style={styles.btnText}>{loading ? 'Creando...' : 'Crear servicio'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 20 },
  field: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 6 },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  hint: { fontSize: 12, color: '#999', marginTop: 4 },
  templateRow: { marginTop: 8 },
  templateChip: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 8, backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  templateChipActive: { backgroundColor: '#5B5EA6' },
  templateChipText: { fontSize: 13, color: '#333', marginLeft: 6, fontWeight: '500' },
  templateChipTextActive: { color: '#fff' },
  templateCount: { fontSize: 11, color: '#999', marginLeft: 6 },
  btn: {
    backgroundColor: '#5B5EA6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
