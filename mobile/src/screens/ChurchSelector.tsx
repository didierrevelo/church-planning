import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { churchesAPI } from '../services/api';
import { Church } from '../types';

const PRIMARY = '#5B5EA6';

export default function ChurchSelector({ route, navigation }: any) {
  const { churches: initialChurches } = route.params;
  const [churches, setChurches] = useState<Church[]>(initialChurches);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');

  const selectChurch = async (church: Church) => {
    await AsyncStorage.setItem('churchId', church.id);
    navigation.replace('Home');
  };

  const createChurch = async () => {
    if (!newName.trim()) return;
    try {
      const response = await churchesAPI.create(newName.trim());
      const created = response.data;
      setChurches([...churches, created]);
      setShowCreate(false);
      setNewName('');
      Alert.alert('Iglesia creada', 'Selecciónala para empezar');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'No se pudo crear');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Selecciona una Iglesia</Text>
        <Text style={styles.subtitle}>
          Elegí con qué iglesia trabajar hoy
        </Text>
      </View>

      <View style={styles.list}>
        {churches.map((church) => (
          <TouchableOpacity
            key={church.id}
            style={styles.card}
            onPress={() => selectChurch(church)}
          >
            <View style={styles.iconContainer}>
              <Ionicons name="business" size={32} color={PRIMARY} />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>{church.name}</Text>
              <Text style={styles.cardRole}>
                {church.role === 'admin' ? 'Administrador' : church.role === 'leader' ? 'Líder' : 'Miembro'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#ccc" />
          </TouchableOpacity>
        ))}

        {showCreate && (
          <View style={styles.createForm}>
            <TextInput
              style={styles.input}
              placeholder="Nombre de la iglesia"
              value={newName}
              onChangeText={setNewName}
            />
            <View style={styles.createActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowCreate(false)}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.createBtn} onPress={createChurch}>
                <Text style={styles.createBtnText}>Crear</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {!showCreate && (
          <TouchableOpacity style={styles.addCard} onPress={() => setShowCreate(true)}>
            <Ionicons name="add-circle-outline" size={32} color={PRIMARY} />
            <Text style={styles.addText}>Crear Nueva Iglesia</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: PRIMARY,
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    marginTop: 8,
  },
  list: {
    padding: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f0ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  cardRole: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  addCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  addText: {
    marginLeft: 8,
    fontSize: 16,
    color: PRIMARY,
    fontWeight: '500',
  },
  createForm: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  createActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  cancelText: {
    color: '#666',
  },
  createBtn: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
});
