import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { servicesAPI, teamAPI, reorderAPI } from '../services/api';
import { Service, ServiceTeamMember } from '../types';
import { LoadingScreen, SectionHeader, SegmentItem, MemberCard, SongCard, FileCard } from '../components';
import { useToast } from '../contexts/ToastContext';

export default function ServiceDetailScreen({ route, navigation }: any) {
  const { serviceId } = route.params;
  const { showToast } = useToast();
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadService();
  }, []);

  const loadService = async () => {
    try {
      const response = await servicesAPI.getById(serviceId);
      setService(response.data);
    } catch (error) {
      console.error('Error loading service:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (memberId: string, status: string) => {
    try {
      await teamAPI.updateStatus(memberId, { status });
      loadService();
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar el estado');
    }
  };

  const handleMoveSegment = async (index: number, direction: 'up' | 'down') => {
    if (!service?.segments) return;
    const segments = [...service.segments];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= segments.length) return;

    [segments[index], segments[newIndex]] = [segments[newIndex], segments[index]];
    const newOrder = segments.map((s) => s.id);

    try {
      await reorderAPI.segments(serviceId, newOrder);
      showToast('Segmento reordenado', 'success');
      loadService();
    } catch (error: any) {
      showToast('Error al reordenar', 'error');
    }
  };

  if (loading || !service) {
    return <LoadingScreen />;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{service.title}</Text>
        <Text style={styles.date}>
          {new Date(service.date).toLocaleDateString('es-ES')}
        </Text>
        <Text style={styles.time}>{service.time}</Text>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Orden del Culto" />
        {service.segments?.map((segment, index) => (
          <View key={segment.id} style={styles.segmentRow}>
            <View style={styles.segmentMove}>
              <TouchableOpacity
                onPress={() => handleMoveSegment(index, 'up')}
                disabled={index === 0}
              >
                <Ionicons
                  name="chevron-up"
                  size={20}
                  color={index === 0 ? '#ccc' : '#5B5EA6'}
                />
              </TouchableOpacity>
              <Text style={styles.segmentOrder}>{index + 1}</Text>
              <TouchableOpacity
                onPress={() => handleMoveSegment(index, 'down')}
                disabled={index === (service.segments?.length || 1) - 1}
              >
                <Ionicons
                  name="chevron-down"
                  size={20}
                  color={index === (service.segments?.length || 1) - 1 ? '#ccc' : '#5B5EA6'}
                />
              </TouchableOpacity>
            </View>
            <View style={styles.segmentContent}>
              <SegmentItem segment={segment} index={index} />
            </View>
          </View>
        ))}
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => showToast('Usa una plantilla desde Perfil > Nuevo Servicio', 'info')}
        >
          <Ionicons name="albums" size={20} color="#5B5EA6" />
          <Text style={styles.addBtnText}>Aplicar plantilla</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Equipo" />
        {Object.entries(service.teamByMinistry || {}).map(([ministryName, data]) => (
          <View key={ministryName} style={styles.ministryGroup}>
            <Text style={styles.ministryName}>{ministryName}</Text>
            {(data as any).members?.map((member: ServiceTeamMember) => (
              <MemberCard
                key={member.id}
                member={member}
                showActions={member.status === 'pending'}
                onConfirm={() => handleStatusUpdate(member.id, 'confirmed')}
                onDecline={() => handleStatusUpdate(member.id, 'cannot_attend')}
              />
            ))}
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <SectionHeader title="Set List" />
        {service.songs?.map((song, index) => (
          <SongCard key={song.id} song={song} index={index} />
        ))}
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('AddSong', { serviceId: service.id })}
        >
          <Ionicons name="add-circle" size={20} color="#5B5EA6" />
          <Text style={styles.addBtnText}>Agregar canción</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Archivos" />
        {service.files?.map((file) => (
          <FileCard key={file.id} file={file} />
        ))}
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => Alert.alert('Próximamente', 'Subir archivos desde el dispositivo')}
        >
          <Ionicons name="cloud-upload-outline" size={20} color="#5B5EA6" />
          <Text style={styles.addBtnText}>Subir archivo</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    backgroundColor: '#5B5EA6',
    padding: 20,
  },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  date: { fontSize: 16, color: '#fff', opacity: 0.9, marginTop: 8 },
  time: { fontSize: 14, color: '#fff', opacity: 0.8, marginTop: 4 },
  section: { padding: 16 },
  segmentRow: { flexDirection: 'row', marginBottom: 8 },
  segmentMove: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    width: 30,
  },
  segmentOrder: {
    fontSize: 12, fontWeight: '700', color: '#5B5EA6',
    marginVertical: 2,
  },
  segmentContent: { flex: 1 },
  ministryGroup: { marginBottom: 16 },
  ministryName: { fontSize: 16, fontWeight: '600', color: '#5B5EA6', marginBottom: 8 },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', padding: 12,
    borderWidth: 1, borderColor: '#5B5EA6', borderRadius: 8,
    borderStyle: 'dashed', marginTop: 8,
  },
  addBtnText: { marginLeft: 8, fontSize: 14, color: '#5B5EA6', fontWeight: '600' },
});
