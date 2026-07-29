import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { authAPI, churchesAPI, notificationsAPI } from '../services/api';
import { User, Church } from '../types';

export default function ProfileScreen({ navigation }: any) {
  const [user, setUser] = useState<User | null>(null);
  const [currentChurch, setCurrentChurch] = useState<Church | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadData = useCallback(async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) setUser(JSON.parse(userData));

      const churchId = await AsyncStorage.getItem('churchId');
      const churchName = await AsyncStorage.getItem('churchName');

      const churchesResponse = await authAPI.getMe();
      const churches = churchesResponse.data.churches || [];
      const active = churches.find((c: Church) => c.id === churchId);
      if (active) {
        setCurrentChurch(active);
        await AsyncStorage.setItem('churchName', active.name);
      } else if (churchName) {
        setCurrentChurch({ id: churchId || '', name: churchName, slug: '' });
      }

      const unreadResponse = await notificationsAPI.getUnreadCount();
      setUnreadCount(unreadResponse.data.count);
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const switchChurch = async () => {
    try {
      const response = await authAPI.getMe();
      const churches = response.data.churches || [];
      await AsyncStorage.removeItem('churchId');
      await AsyncStorage.removeItem('churchName');
      if (churches.length > 0) {
        navigation.replace('ChurchSelector', { churches });
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar las iglesias');
    }
  };

  const handleLogout = async () => {
    Alert.alert('Cerrar Sesión', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar Sesión',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.multiRemove(['token', 'user', 'churchId', 'churchName']);
          navigation.replace('Login');
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name?.charAt(0) || '?'}</Text>
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        {currentChurch && (
          <TouchableOpacity style={styles.churchBadge} onPress={switchChurch}>
            <Ionicons name="business" size={14} color="#fff" />
            <Text style={styles.churchText}>{currentChurch.name}</Text>
            <Ionicons name="swap-horizontal" size={14} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('EditProfile')}>
          <Ionicons name="person-outline" size={24} color="#5B5EA6" />
          <Text style={styles.menuText}>Editar Perfil</Text>
          <Ionicons name="chevron-forward" size={24} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('ChangePassword')}>
          <Ionicons name="key-outline" size={24} color="#5B5EA6" />
          <Text style={styles.menuText}>Cambiar Contraseña</Text>
          <Ionicons name="chevron-forward" size={24} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Notifications')}>
          <Ionicons name="notifications-outline" size={24} color="#5B5EA6" />
          <Text style={styles.menuText}>Notificaciones</Text>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
          <Ionicons name="chevron-forward" size={24} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Dashboard')}>
          <Ionicons name="stats-chart-outline" size={24} color="#5B5EA6" />
          <Text style={styles.menuText}>Dashboard</Text>
          <Ionicons name="chevron-forward" size={24} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Admin')}>
          <Ionicons name="settings-outline" size={24} color="#5B5EA6" />
          <Text style={styles.menuText}>Administración</Text>
          <Ionicons name="chevron-forward" size={24} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Agent')}>
          <Ionicons name="cog-outline" size={24} color="#5B5EA6" />
          <Text style={styles.menuText}>Agente Inteligente</Text>
          <Ionicons name="chevron-forward" size={24} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('TemplateList')}>
          <Ionicons name="albums-outline" size={24} color="#5B5EA6" />
          <Text style={styles.menuText}>Plantillas</Text>
          <Ionicons name="chevron-forward" size={24} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('CreateService')}>
          <Ionicons name="add-circle-outline" size={24} color="#5B5EA6" />
          <Text style={styles.menuText}>Nuevo Servicio</Text>
          <Ionicons name="chevron-forward" size={24} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('InviteUser')}>
          <Ionicons name="person-add-outline" size={24} color="#5B5EA6" />
          <Text style={styles.menuText}>Invitar Miembro</Text>
          <Ionicons name="chevron-forward" size={24} color="#ccc" />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="help-circle-outline" size={24} color="#5B5EA6" />
          <Text style={styles.menuText}>Ayuda</Text>
          <Ionicons name="chevron-forward" size={24} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="information-circle-outline" size={24} color="#5B5EA6" />
          <Text style={styles.menuText}>Acerca de</Text>
          <Ionicons name="chevron-forward" size={24} color="#ccc" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={24} color="#f44336" />
        <Text style={styles.logoutText}>Cerrar Sesión</Text>
      </TouchableOpacity>

      <Text style={styles.version}>Versión 1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    backgroundColor: '#5B5EA6',
    padding: 20,
    paddingTop: 50,
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: { fontSize: 32, fontWeight: '600', color: '#5B5EA6' },
  name: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  email: { fontSize: 14, color: '#fff', opacity: 0.8, marginTop: 4 },
  churchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 8,
  },
  churchText: { color: '#fff', fontSize: 12, fontWeight: '600', marginHorizontal: 6 },
  section: {
    backgroundColor: '#fff',
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuText: { flex: 1, marginLeft: 12, fontSize: 16 },
  badge: {
    backgroundColor: '#f44336',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginRight: 8,
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    marginTop: 16,
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
  },
  logoutText: { marginLeft: 8, fontSize: 16, color: '#f44336', fontWeight: '600' },
  version: { textAlign: 'center', color: '#999', marginTop: 24, marginBottom: 24 },
});
