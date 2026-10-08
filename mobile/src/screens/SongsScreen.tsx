import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Linking,
  RefreshControl,
  Modal,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { songsAPI } from '../services/api';
import { Song } from '../types';
import { EmptyState, ChordViewer } from '../components';

export default function SongsScreen() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [isStageMode, setIsStageMode] = useState<boolean>(false);
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
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.7}
            onPress={() => setSelectedSong(item)}
          >
            <View style={styles.numberContainer}>
              <Text style={styles.number}>{index + 1}</Text>
            </View>
            <View style={styles.info}>
              <Text style={styles.title}>{item.title}</Text>
              <View style={styles.metaRow}>
                {item.key && <Text style={styles.key}>Tono: {item.key}</Text>}
                {item.bpm && <Text style={styles.bpm}>{item.bpm} BPM</Text>}
                {item.timeSignature && <Text style={styles.timeSig}>{item.timeSignature}</Text>}
              </View>
              <Text style={styles.updated}>
                Actualizado por {item.updatedBy?.name || 'N/A'}
              </Text>
            </View>
            <View style={styles.actions}>
              {item.youtubeLink && (
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={(e) => {
                    e.stopPropagation();
                    openYouTube(item.youtubeLink!);
                  }}
                >
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
          </TouchableOpacity>
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

      {/* Full-screen Chord Viewer Modal */}
      {selectedSong && (
        <Modal
          visible={true}
          animationType="slide"
          onRequestClose={() => setSelectedSong(null)}
        >
          <SafeAreaView
            style={[
              styles.modalContainer,
              { backgroundColor: isStageMode ? '#121212' : '#FFFFFF' },
            ]}
          >
            <View
              style={[
                styles.modalHeader,
                { borderBottomColor: isStageMode ? '#2D3748' : '#E2E8F0' },
              ]}
            >
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setSelectedSong(null)}
              >
                <Ionicons
                  name="chevron-down"
                  size={26}
                  color={isStageMode ? '#FFFFFF' : '#333333'}
                />
              </TouchableOpacity>
              <View style={styles.modalTitleContainer}>
                <Text
                  style={[
                    styles.modalTitle,
                    { color: isStageMode ? '#FFFFFF' : '#1A202C' },
                  ]}
                  numberOfLines={1}
                >
                  {selectedSong.title}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.stageToggleBtn}
                onPress={() => setIsStageMode(!isStageMode)}
              >
                <Ionicons
                  name={isStageMode ? 'sunny' : 'moon'}
                  size={20}
                  color={isStageMode ? '#FFD54F' : '#5B5EA6'}
                />
              </TouchableOpacity>
            </View>

            <ChordViewer
              chordContent={
                selectedSong.chordContent ||
                `{title: ${selectedSong.title}}\n{key: ${selectedSong.key || 'C'}}\n{comment: Letra}\nNo hay cifrado cargado para esta canción.`
              }
              initialKey={selectedSong.key}
              isDarkMode={isStageMode}
              bpm={selectedSong.bpm}
              timeSignature={selectedSong.timeSignature}
            />
          </SafeAreaView>
        </Modal>
      )}
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
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    gap: 8,
  },
  key: {
    fontSize: 12,
    color: '#E65100',
    fontWeight: '600',
  },
  bpm: {
    fontSize: 12,
    color: '#0288D1',
    fontWeight: '600',
  },
  timeSig: {
    fontSize: 12,
    color: '#666',
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
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalTitleContainer: {
    flex: 1,
    marginHorizontal: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  stageToggleBtn: {
    padding: 6,
    borderRadius: 8,
  },
});
