import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Song } from '../types';

interface SongCardProps {
  song: Song;
  index: number;
  onYouTubePress?: () => void;
}

export default function SongCard({ song, index, onYouTubePress }: SongCardProps) {
  return (
    <View style={styles.songCard}>
      <View style={styles.songNumber}>
        <Text style={styles.songNumberText}>{index + 1}</Text>
      </View>
      <View style={styles.songInfo}>
        <Text style={styles.songTitle}>{song.title}</Text>
        {song.key && <Text style={styles.songKey}>Tono: {song.key}</Text>}
      </View>
      {song.youtubeLink && (
        <TouchableOpacity style={styles.youtubeBtn} onPress={onYouTubePress}>
          <Ionicons name="logo-youtube" size={24} color="#FF0000" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  songCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  songNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FF9800',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  songNumberText: {
    color: '#fff',
    fontWeight: '600',
  },
  songInfo: {
    flex: 1,
  },
  songTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  songKey: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  youtubeBtn: {
    padding: 8,
  },
});
