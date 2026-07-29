import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Linking, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { songsAPI } from '../services/api';
import { Song } from '../types';
import { EmptyState } from '../components';

export default function SongsScreen() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadSongs();
  }, [selectedService]);

  const loadSongs = async () => {
    if (!selectedService) {
      setSongs([]);
      return;
    }
    try {
      const response = await songsAPI.getByService(selectedService);
      setSongs(response.data);
    } catch (error) {
      console.error('Error loading songs:', error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadSongs();
    setRefreshing(false);
  }, [selectedService]);

  const openYouTube = (url: string) => {
    Linking.openURL(url);
  };

  if (!selectedService) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Set List</Text>
        </View>
        <EmptyState icon="musical-notes-outline" message="Selecciona un servicio para ver las canciones" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Set List</Text>
      </View>

      <FlatList
        data={songs}
        renderItem={({ item, index }) => (
          <View style={styles.card}>
            <View style={styles.numberContainer}>
              <Text style={styles.number}>{index + 1}</Text>
            </View>
            <View style={styles.info}>
              <Text style={styles.title}>{item.title}</Text>
              {item.key && <Text style={styles.key}>Tono: {item.key}</Text>}
              <Text style={styles.updated}>
                Actualizado por {item.updatedBy?.name || 'N/A'}
              </Text>
            </View>
            <View style={styles.actions}>
              {item.youtubeLink && (
                <TouchableOpacity style={styles.actionBtn} onPress={() => openYouTube(item.youtubeLink!)}>
                  <Ionicons name="logo-youtube" size={24} color="#FF0000" />
                </TouchableOpacity>
              )}
              {item.lyricsUrl && (
                <TouchableOpacity style={styles.actionBtn}>
                  <Ionicons name="document-text" size={24} color="#5B5EA6" />
                </TouchableOpacity>
              )}
              {item.sheetMusicUrl && (
                <TouchableOpacity style={styles.actionBtn}>
                  <Ionicons name="musical-notes" size={24} color="#4CAF50" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <EmptyState icon="musical-notes-outline" message="No hay canciones en el set list" />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#5B5EA6',
    padding: 20,
    paddingTop: 50,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
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
  },
  numberContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FF9800',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  number: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  key: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  updated: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
  },
  actionBtn: {
    padding: 8,
    marginLeft: 4,
  },
});
