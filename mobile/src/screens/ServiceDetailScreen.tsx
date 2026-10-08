import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { servicesAPI, teamAPI, reorderAPI } from '../services/api';
import { Service, ServiceTeamMember } from '../types';
import { LoadingScreen, SectionHeader, SegmentItem, MemberCard, SongCard, FileCard } from '../components';
import { useToast } from '../contexts/ToastContext';
import {
  calculateSegmentTimes,
  calculateTotalServiceDuration,
} from '@shared/domain/servicePlanning';
import { styles } from './ServiceDetailScreen.styles';

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

  const scheduledSegments = useMemo(() => {
    if (!service?.segments) return [];
    return calculateSegmentTimes(
      service.time || '10:00',
      service.segments.map((s, idx) => ({
        id: s.id,
        order: s.order ?? idx + 1,
        title: s.title,
        durationMin: s.durationMin || 0,
      }))
    );
  }, [service?.segments, service?.time]);

  const totalDurationStr = useMemo(() => {
    if (!service?.segments || service.segments.length === 0) return '';
    const { formatted } = calculateTotalServiceDuration(
      service.segments.map((s, idx) => ({
        id: s.id,
        order: s.order ?? idx + 1,
        title: s.title,
        durationMin: s.durationMin || 0,
      }))
    );
    return formatted;
  }, [service?.segments]);

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
        <SectionHeader
          title={`Orden del Culto${totalDurationStr ? ` (${totalDurationStr})` : ''}`}
        />
        {service.segments?.map((segment, index) => {
          const scheduled = scheduledSegments[index];
          return (
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
                <SegmentItem
                  segment={segment}
                  index={index}
                  startTime={scheduled?.startTime}
                  endTime={scheduled?.endTime}
                />
              </View>
            </View>
          );
        })}
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

