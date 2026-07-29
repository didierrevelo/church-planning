import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, Alert, TextInput, Modal, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { adminAPI, churchesAPI } from '../services/api';
import { LoadingScreen, EmptyState } from '../components';
import { useToast } from '../contexts/ToastContext';

interface ChurchInfo {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  phone: string | null;
  _count: { members: number; ministries: number; services: number };
}

interface Member {
  id: string;
  userId: string;
  role: string;
  user: { id: string; name: string };
}

export default function AdminScreen({ navigation }: any) {
  const { showToast } = useToast();
  const [church, setChurch] = useState<ChurchInfo | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<'info' | 'members'>('info');
  const [roleModal, setRoleModal] = useState<{ visible: boolean; member: Member | null }>({ visible: false, member: null });
  const [editChurch, setEditChurch] = useState(false);
  const [churchName, setChurchName] = useState('');
  const [churchAddress, setChurchAddress] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [churchRes, membersRes] = await Promise.all([
        adminAPI.getChurch(),
        adminAPI.getMembers(),
      ]);
      setChurch(churchRes.data);
      setMembers(membersRes.data);
      setChurchName(churchRes.data.name);
      setChurchAddress(churchRes.data.address || '');
    } catch (err) {
      console.error('Admin load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, []);

  const onRefresh = useCallback(() => { setRefreshing(true); loadData(); }, []);

  const handleRoleChange = async (role: string) => {
    if (!roleModal.member) return;
    try {
      await adminAPI.updateRole(roleModal.member.userId, role);
      showToast('Rol actualizado', 'success');
      setRoleModal({ visible: false, member: null });
      loadData();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Error al actualizar rol', 'error');
    }
  };

  const handleRemove = (member: Member) => {
    Alert.alert('Remover miembro', `¿Remover a ${member.user.name}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover', style: 'destructive',
        onPress: async () => {
          try {
            await adminAPI.removeMember(member.userId);
            showToast('Miembro removido', 'success');
            loadData();
          } catch (err: any) {
            showToast(err.response?.data?.error || 'Error al remover', 'error');
          }
        },
      },
    ]);
  };

  const handleSaveChurch = async () => {
    if (!church) return;
    try {
      await churchesAPI.update(church.id, { name: churchName });
      showToast('Iglesia actualizada', 'success');
      setEditChurch(false);
      loadData();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Error al guardar', 'error');
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, tab === 'info' && styles.tabActive]} onPress={() => setTab('info')}>
          <Ionicons name="information-circle" size={18} color={tab === 'info' ? '#5B5EA6' : '#999'} />
          <Text style={[styles.tabText, tab === 'info' && styles.tabTextActive]}>Iglesia</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'members' && styles.tabActive]} onPress={() => setTab('members')}>
          <Ionicons name="people" size={18} color={tab === 'members' ? '#5B5EA6' : '#999'} />
          <Text style={[styles.tabText, tab === 'members' && styles.tabTextActive]}>Miembros ({members.length})</Text>
        </TouchableOpacity>
      </View>

      {tab === 'info' && church && (
        <View style={styles.section}>
          {editChurch ? (
            <>
              <Text style={styles.label}>Nombre</Text>
              <TextInput style={styles.input} value={churchName} onChangeText={setChurchName} />
              <Text style={styles.label}>Dirección</Text>
              <TextInput style={styles.input} value={churchAddress} onChangeText={setChurchAddress} />
              <View style={styles.editActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditChurch(false)}>
                  <Text style={styles.cancelBtnText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={handleSaveChurch}>
                  <Text style={styles.saveBtnText}>Guardar</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <View style={styles.infoRow}>
                <Ionicons name="business" size={20} color="#5B5EA6" />
                <Text style={styles.infoText}>{church.name}</Text>
              </View>
              {church.address && (
                <View style={styles.infoRow}>
                  <Ionicons name="location" size={20} color="#5B5EA6" />
                  <Text style={styles.infoText}>{church.address}</Text>
                </View>
              )}
              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <Text style={styles.statNum}>{church._count.members}</Text>
                  <Text style={styles.statLabel}>Miembros</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statNum}>{church._count.ministries}</Text>
                  <Text style={styles.statLabel}>Ministerios</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statNum}>{church._count.services}</Text>
                  <Text style={styles.statLabel}>Servicios</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.editBtn} onPress={() => setEditChurch(true)}>
                <Ionicons name="pencil" size={18} color="#5B5EA6" />
                <Text style={styles.editBtnText}>Editar Iglesia</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}

      {tab === 'members' && (
        <>
          {members.length === 0 ? (
            <EmptyState icon="people-outline" message="No hay miembros" />
          ) : (
            members.map((member) => (
              <View key={member.id} style={styles.memberCard}>
                <View style={styles.memberAvatar}>
                  <Text style={styles.memberAvatarText}>{member.user.name.charAt(0)}</Text>
                </View>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>{member.user.name}</Text>
                  <Text style={styles.memberRole}>{member.role}</Text>
                </View>
                <TouchableOpacity style={styles.memberAction} onPress={() => setRoleModal({ visible: true, member })}>
                  <Ionicons name="shield-outline" size={20} color="#5B5EA6" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.memberAction} onPress={() => handleRemove(member)}>
                  <Ionicons name="trash-outline" size={20} color="#f44336" />
                </TouchableOpacity>
              </View>
            ))
          )}
        </>
      )}

      <Modal visible={roleModal.visible} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setRoleModal({ visible: false, member: null })}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Cambiar rol de {roleModal.member?.user.name}</Text>
            {['admin', 'leader', 'member'].map((role) => (
              <TouchableOpacity key={role} style={styles.roleOption} onPress={() => handleRoleChange(role)}>
                <Ionicons
                  name={roleModal.member?.role === role ? 'radio-button-on' : 'radio-button-off'}
                  size={20} color="#5B5EA6"
                />
                <Text style={styles.roleOptionText}>{role === 'admin' ? 'Administrador' : role === 'leader' ? 'Líder' : 'Miembro'}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setRoleModal({ visible: false, member: null })}>
              <Text style={styles.cancelBtnText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  tabs: { flexDirection: 'row', backgroundColor: '#fff', margin: 16, borderRadius: 12, padding: 4 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 8 },
  tabActive: { backgroundColor: '#f0f0ff' },
  tabText: { fontSize: 14, color: '#999', marginLeft: 6, fontWeight: '500' },
  tabTextActive: { color: '#5B5EA6' },
  section: { backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 12, padding: 16 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  infoText: { fontSize: 16, color: '#333', marginLeft: 10 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 16 },
  stat: { alignItems: 'center' },
  statNum: { fontSize: 28, fontWeight: 'bold', color: '#5B5EA6' },
  statLabel: { fontSize: 12, color: '#999', marginTop: 4 },
  editBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#f0f0f0', marginTop: 12 },
  editBtnText: { color: '#5B5EA6', fontSize: 14, fontWeight: '600', marginLeft: 6 },
  label: { fontSize: 13, color: '#666', marginBottom: 4, marginTop: 8 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, fontSize: 15, color: '#333' },
  editActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, marginRight: 8 },
  cancelBtnText: { color: '#999', fontSize: 14, fontWeight: '600' },
  saveBtn: { backgroundColor: '#5B5EA6', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  saveBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  memberCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 6,
    padding: 14, borderRadius: 10,
  },
  memberAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#5B5EA6', justifyContent: 'center', alignItems: 'center' },
  memberAvatarText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  memberInfo: { flex: 1, marginLeft: 12 },
  memberName: { fontSize: 15, fontWeight: '600', color: '#333' },
  memberRole: { fontSize: 12, color: '#999', marginTop: 2, textTransform: 'capitalize' },
  memberAction: { padding: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', borderRadius: 16, padding: 20, width: '80%' },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 16 },
  roleOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  roleOptionText: { marginLeft: 10, fontSize: 15, color: '#333' },
});
