import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  formatBandRole,
  getBandSessionStatus,
} from '@shared/domain/bandSessionModalHelper';
import type { BandSessionController } from '@shared/domain/bandSessionController';
import type { BandMemberRole } from '@shared/domain/bandSync';
import { styles } from './BandSessionModal.styles';

export interface BandSessionModalProps {
  visible: boolean;
  onClose: () => void;
  controller: BandSessionController | null;
  onStartSession: (role: BandMemberRole, isHost: boolean) => void;
  onLeaveSession: () => void;
}

const AVAILABLE_ROLES: BandMemberRole[] = [
  'director',
  'guitar',
  'bass',
  'piano',
  'drums',
  'vocalist',
  'tech',
];

/**
 * BandSessionModal: Live stage LAN band synchronization control center.
 * Enables musicians to host or join a zero-latency local session,
 * automatically mirroring song choices, transpositions, and auto-scroll.
 */
export const BandSessionModal: React.FC<BandSessionModalProps> = ({
  visible,
  onClose,
  controller,
  onStartSession,
  onLeaveSession,
}) => {
  const [selectedRole, setSelectedRole] = useState<BandMemberRole>('director');

  const sessionState = controller?.getState();
  const currentMember = controller?.getMember();
  const sessionSongs = controller?.getSongs() || [];

  const statusInfo = sessionState && currentMember
    ? getBandSessionStatus(sessionState, currentMember.id, sessionSongs)
    : null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.titleContainer}>
              <Ionicons name="wifi-outline" size={24} color="#00B0FF" />
              <Text style={styles.modalTitle}>Sincronización de Banda</Text>
            </View>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Active Session Status */}
          {statusInfo && sessionState ? (
            <View style={styles.statusCard}>
              <View style={styles.statusHeader}>
                <View
                  style={[
                    styles.statusBadge,
                    styles.statusBadgeOnline,
                  ]}
                >
                  <View
                    style={[
                      styles.statusDot,
                      styles.statusDotOnline,
                    ]}
                  />
                  <Text
                    style={[
                      styles.statusBadgeText,
                      styles.statusBadgeTextOnline,
                    ]}
                  >
                    SESIÓN LAN ACTIVA
                  </Text>
                </View>
                <Text style={styles.activeInfoValue}>
                  {statusInfo.statusLabel}
                </Text>
              </View>

              <View style={styles.activeInfoRow}>
                <Text style={styles.activeInfoLabel}>Canción actual:</Text>
                <Text style={styles.activeInfoValue}>
                  {statusInfo.currentSongTitle || 'Sin canción seleccionada'}
                </Text>
              </View>

              <View style={styles.activeInfoRow}>
                <Text style={styles.activeInfoLabel}>Músicos conectados:</Text>
                <Text style={styles.activeInfoValue}>
                  {sessionState.members.length} en línea
                </Text>
              </View>

              {/* Members List */}
              <Text style={styles.sectionLabel}>Integrantes en el escenario</Text>
              <ScrollView style={styles.membersList} nestedScrollEnabled>
                {sessionState.members.map((m) => (
                  <View key={m.id} style={styles.memberItem}>
                    <View style={styles.memberNameContainer}>
                      <Ionicons
                        name={m.isHost ? 'star' : 'person'}
                        size={16}
                        color={m.isHost ? '#FFD700' : '#BB86FC'}
                      />
                      <Text style={styles.memberName}>{m.name}</Text>
                      <Text style={styles.memberRoleTag}>
                        ({formatBandRole(m.role)})
                      </Text>
                    </View>
                    {m.isHost && (
                      <View style={styles.leaderBadge}>
                        <Text style={styles.leaderBadgeText}>DIRECTOR</Text>
                      </View>
                    )}
                  </View>
                ))}
              </ScrollView>

              <View style={styles.actionButtonsRow}>
                <TouchableOpacity
                  style={styles.leaveBtn}
                  onPress={onLeaveSession}
                  activeOpacity={0.8}
                >
                  <Ionicons name="exit-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.leaveBtnText}>Salir de la Sesión</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            /* Configure and Start / Join Session */
            <View>
              <Text style={styles.sectionLabel}>Selecciona tu Instrumento o Rol</Text>
              <View style={styles.roleGrid}>
                {AVAILABLE_ROLES.map((role) => (
                  <TouchableOpacity
                    key={role}
                    style={[
                      styles.roleChip,
                      selectedRole === role && styles.roleChipActive,
                    ]}
                    onPress={() => setSelectedRole(role)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.roleChipText,
                        selectedRole === role && styles.roleChipTextActive,
                      ]}
                    >
                      {formatBandRole(role)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.actionButtonsRow}>
                <TouchableOpacity
                  style={styles.hostBtn}
                  onPress={() => onStartSession(selectedRole, true)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="radio-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.hostBtnText}>Liderar (Director)</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.joinBtn}
                  onPress={() => onStartSession(selectedRole, false)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="people-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.joinBtnText}>Unirse a Banda</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default BandSessionModal;
