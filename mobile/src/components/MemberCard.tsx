import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ServiceTeamMember } from '../types';

const STATUS_CONFIG: Record<string, { name: string; color: string; label: string }> = {
  confirmed: { name: 'checkmark-circle', color: '#4CAF50', label: 'Confirmado' },
  cannot_attend: { name: 'close-circle', color: '#f44336', label: 'No puede asistir' },
  schedule_conflict: { name: 'warning', color: '#FF9800', label: 'Conflicto de horario' },
  pending: { name: 'help-circle', color: '#9E9E9E', label: 'Pendiente' },
};

interface MemberCardProps {
  member: ServiceTeamMember;
  showActions?: boolean;
  onConfirm?: () => void;
  onDecline?: () => void;
}

export default function MemberCard({ member, showActions, onConfirm, onDecline }: MemberCardProps) {
  const statusConfig = STATUS_CONFIG[member.status] || STATUS_CONFIG.pending;

  return (
    <View style={styles.card}>
      <View style={styles.memberInfo}>
        <Text style={styles.memberName}>{member.user?.name || 'Usuario'}</Text>
        <Text style={styles.memberRole}>{member.ministryRole?.name}</Text>
      </View>

      <View style={styles.memberStatus}>
        <Ionicons name={statusConfig.name as any} size={24} color={statusConfig.color} />
        <Text style={[styles.statusText, { color: statusConfig.color }]}>
          {statusConfig.label}
        </Text>
      </View>

      {showActions && member.status === 'pending' && (
        <View style={styles.actionButtons}>
          <TouchableOpacity style={[styles.actionBtn, styles.confirmBtn]} onPress={onConfirm}>
            <Text style={styles.actionBtnText}>Confirmar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.declineBtn]} onPress={onDecline}>
            <Text style={styles.actionBtnText}>No puede</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '500',
  },
  memberRole: {
    fontSize: 12,
    color: '#666',
  },
  memberStatus: {
    alignItems: 'center',
    marginRight: 12,
  },
  statusText: {
    fontSize: 10,
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
  },
  actionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
    marginLeft: 4,
  },
  confirmBtn: {
    backgroundColor: '#4CAF50',
  },
  declineBtn: {
    backgroundColor: '#f44336',
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
});
