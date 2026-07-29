import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { File } from '../types';

interface FileCardProps {
  file: File;
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-ES');
};

export default function FileCard({ file }: FileCardProps) {
  return (
    <View style={styles.fileCard}>
      <Ionicons name="document" size={24} color="#5B5EA6" />
      <View style={styles.fileInfo}>
        <Text style={styles.fileName} numberOfLines={1}>{file.name}</Text>
        <Text style={styles.fileMeta}>
          {file.uploadedBy?.name || 'Desconocido'} • {formatDate(file.createdAt)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  fileInfo: {
    marginLeft: 12,
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '500',
  },
  fileMeta: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
});
