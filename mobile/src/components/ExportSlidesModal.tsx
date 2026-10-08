import React, { useState, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Share,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  preparePresentationExport,
  getPresentationSummary,
  type ExportFormat,
} from '@shared/domain/presentationExportHelper';
import type { ExportableSong } from '@shared/domain/setlistExport';
import { styles } from './ExportSlidesModal.styles';

export interface ExportSlidesModalProps {
  visible: boolean;
  onClose: () => void;
  songs: ExportableSong[];
}

/**
 * ExportSlidesModal: Presentation & Church Projection export sheet.
 * Enables live worship teams and media operators to bundle setlists
 * into FreeShow JSON or plain text slides for projection software.
 */
export const ExportSlidesModal: React.FC<ExportSlidesModalProps> = ({
  visible,
  onClose,
  songs,
}) => {
  const [format, setFormat] = useState<ExportFormat>('freeshow');
  const [maxLines, setMaxLines] = useState<number>(4);

  const summary = useMemo(() => {
    return getPresentationSummary(songs, { maxLinesPerSlide: maxLines });
  }, [songs, maxLines]);

  const exportResult = useMemo(() => {
    return preparePresentationExport(songs, format, { maxLinesPerSlide: maxLines });
  }, [songs, format, maxLines]);

  const handleShare = async () => {
    try {
      await Share.share({
        title: exportResult.filename,
        message: exportResult.payload,
      });
    } catch (error) {
      Alert.alert('Error al exportar', 'No se pudo compartir la presentación.');
    }
  };

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
              <Ionicons name="tv-outline" size={24} color="#BB86FC" />
              <Text style={styles.modalTitle}>Proyección de Culto</Text>
            </View>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Metrics summary */}
          <View style={styles.metricCardsRow}>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>{summary.totalSongs}</Text>
              <Text style={styles.metricLabel}>Canciones</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>{summary.totalSlides}</Text>
              <Text style={styles.metricLabel}>Diapositivas</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>{summary.sections.length}</Text>
              <Text style={styles.metricLabel}>Secciones</Text>
            </View>
          </View>

          {/* Format selection */}
          <Text style={styles.sectionLabel}>Formato de Proyección</Text>
          <View style={styles.segmentRow}>
            <TouchableOpacity
              style={[
                styles.segmentBtn,
                format === 'freeshow' && styles.segmentBtnActive,
              ]}
              onPress={() => setFormat('freeshow')}
            >
              <Text
                style={[
                  styles.segmentText,
                  format === 'freeshow' && styles.segmentTextActive,
                ]}
              >
                FreeShow (JSON)
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.segmentBtn,
                format === 'text' && styles.segmentBtnActive,
              ]}
              onPress={() => setFormat('text')}
            >
              <Text
                style={[
                  styles.segmentText,
                  format === 'text' && styles.segmentTextActive,
                ]}
              >
                OpenLP / Texto (---)
              </Text>
            </TouchableOpacity>
          </View>

          {/* Lines per slide */}
          <Text style={styles.sectionLabel}>Líneas por Diapositiva</Text>
          <View style={styles.segmentRow}>
            {[2, 4, 6].map((linesCount) => (
              <TouchableOpacity
                key={linesCount}
                style={[
                  styles.segmentBtn,
                  maxLines === linesCount && styles.segmentBtnActive,
                ]}
                onPress={() => setMaxLines(linesCount)}
              >
                <Text
                  style={[
                    styles.segmentText,
                    maxLines === linesCount && styles.segmentTextActive,
                  ]}
                >
                  {linesCount} líneas
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Filename preview */}
          <View style={styles.filenameRow}>
            <Ionicons name="document-text-outline" size={16} color="#03DAC6" />
            <Text style={styles.filenameText}>{exportResult.filename}</Text>
          </View>

          {/* Content Preview Box */}
          <View style={styles.previewContainer}>
            <ScrollView style={styles.previewScroll} nestedScrollEnabled>
              <Text style={styles.previewText} numberOfLines={12}>
                {exportResult.payload.slice(0, 500)}
                {exportResult.payload.length > 500 ? '\n... (truncado)' : ''}
              </Text>
            </ScrollView>
          </View>

          {/* Actions */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.shareBtn}
              onPress={handleShare}
              activeOpacity={0.8}
            >
              <Ionicons name="share-outline" size={20} color="#FFFFFF" />
              <Text style={styles.shareBtnText}>Compartir / Exportar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
export default ExportSlidesModal;
