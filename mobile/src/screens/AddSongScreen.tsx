import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { songsAPI } from '../services/api';

export default function AddSongScreen({ route, navigation }: any) {
  const { serviceId } = route.params;
  const [title, setTitle] = useState('');
  const [key, setKey] = useState('');
  const [youtubeLink, setYoutubeLink] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'El título es obligatorio');
      return;
    }

    setLoading(true);
    try {
      await songsAPI.create(serviceId, {
        title: title.trim(),
        key: key.trim() || undefined,
        youtubeLink: youtubeLink.trim() || undefined,
      });
      Alert.alert('Listo', 'Canción agregada');
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'No se pudo agregar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.field}>
        <Text style={styles.label}>Título de la canción</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Ej: Grande es tu fidelidad"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Tono</Text>
        <TextInput
          style={styles.input}
          value={key}
          onChangeText={setKey}
          placeholder="Ej: C, Dm, G7"
          autoCapitalize="characters"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Link de YouTube</Text>
        <TextInput
          style={styles.input}
          value={youtubeLink}
          onChangeText={setYoutubeLink}
          placeholder="https://youtube.com/watch?v=..."
          keyboardType="url"
          autoCapitalize="none"
        />
      </View>

      <TouchableOpacity
        style={[styles.btn, loading && styles.btnDisabled]}
        onPress={handleAdd}
        disabled={loading}
      >
        <Text style={styles.btnText}>{loading ? 'Agregando...' : 'Agregar canción'}</Text>
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
