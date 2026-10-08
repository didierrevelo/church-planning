import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  parseChordPro,
  transposeChord,
  transposeKey,
  type ChordProSong,
  type ChordProLine,
} from '@shared/domain/music';

export interface ChordViewerProps {
  /**
   * Raw song text in ChordPro format (e.g., "[G]Amazing [C]grace").
   */
  chordContent?: string | null;
  /**
   * Base/original key of the song (e.g., "G", "C", "Am").
   */
  initialKey?: string | null;
  /**
   * Optional callback when user changes transposition.
   */
  onTransposedKeyChange?: (newKey: string, semitones: number) => void;
  /**
   * Enables dark / OLED stage view for stage stands.
   */
  isDarkMode?: boolean;
  /**
   * Base font size for lyrics (default: 16).
   */
  initialFontSize?: number;
  /**
   * Optional song tempo (BPM).
   */
  bpm?: number | null;
  /**
   * Optional time signature (e.g., "4/4").
   */
  timeSignature?: string | null;
}

/**
 * Interactive ChordPro Viewer and Transposition Component.
 * Allows musicians to view lyrics with aligned chords, transpose in real-time by semitones,
 * and adjust font size.
 */
export default function ChordViewer({
  chordContent,
  initialKey,
  onTransposedKeyChange,
  isDarkMode = false,
  initialFontSize = 16,
  bpm,
  timeSignature,
}: ChordViewerProps) {
  const [semitones, setSemitones] = useState<number>(0);
  const [fontSize, setFontSize] = useState<number>(initialFontSize);

  // Parse ChordPro into structured lines & metadata
  const song: ChordProSong = useMemo(() => {
    return parseChordPro(chordContent || '');
  }, [chordContent]);

  // Determine effective original key (from prop or embedded metadata)
  const baseKey = initialKey || song.metadata.key || '';

  // Calculate current transposed key
  const currentKey = useMemo(() => {
    if (!baseKey) return '';
    return transposeKey(baseKey, semitones);
  }, [baseKey, semitones]);

  const handleTranspose = (delta: number) => {
    const nextSemitones = semitones + delta;
    setSemitones(nextSemitones);
    if (baseKey && onTransposedKeyChange) {
      const nextKey = transposeKey(baseKey, nextSemitones);
      onTransposedKeyChange(nextKey, nextSemitones);
    }
  };

  const handleResetTranspose = () => {
    setSemitones(0);
    if (baseKey && onTransposedKeyChange) {
      onTransposedKeyChange(baseKey, 0);
    }
  };

  const colors = isDarkMode
    ? {
        background: '#121212',
        cardBg: '#1E1E1E',
        text: '#F5F5F5',
        chord: '#FF9800',
        commentBg: '#2D3748',
        commentText: '#E2E8F0',
        border: '#333333',
        badgeBg: '#332612',
        badgeText: '#FFB74D',
      }
    : {
        background: '#FAFAFA',
        cardBg: '#FFFFFF',
        text: '#212121',
        chord: '#D84315',
        commentBg: '#E2E8F0',
        commentText: '#334155',
        border: '#E0E0E0',
        badgeBg: '#FFF3E0',
        badgeText: '#E65100',
      };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Control Header Bar */}
      <View style={[styles.controlBar, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
        <View style={styles.transposeGroup}>
          <Text style={[styles.controlLabel, { color: colors.text }]}>Tono:</Text>
          <TouchableOpacity
            style={[styles.stepperButton, { borderColor: colors.border }]}
            onPress={() => handleTranspose(-1)}
            activeOpacity={0.7}
          >
            <Ionicons name="remove" size={18} color={colors.text} />
          </TouchableOpacity>

          <View style={[styles.keyBadge, { backgroundColor: colors.badgeBg }]}>
            <Text style={[styles.keyBadgeText, { color: colors.badgeText }]}>
              {currentKey || 'N/A'}
              {semitones !== 0 && ` (${semitones > 0 ? `+${semitones}` : semitones})`}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.stepperButton, { borderColor: colors.border }]}
            onPress={() => handleTranspose(1)}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={18} color={colors.text} />
          </TouchableOpacity>

          {semitones !== 0 && (
            <TouchableOpacity style={styles.resetButton} onPress={handleResetTranspose}>
              <Text style={styles.resetButtonText}>Reset</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Font Size & Metronome Info */}
        <View style={styles.secondaryGroup}>
          {bpm && (
            <View style={styles.metaBadge}>
              <Ionicons name="speedometer-outline" size={14} color={colors.text} />
              <Text style={[styles.metaText, { color: colors.text }]}>{bpm} BPM</Text>
            </View>
          )}
          {timeSignature && (
            <View style={styles.metaBadge}>
              <Text style={[styles.metaText, { color: colors.text }]}>{timeSignature}</Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.fontButton}
            onPress={() => setFontSize((prev) => Math.max(prev - 2, 12))}
          >
            <Text style={[styles.fontButtonText, { color: colors.text }]}>A-</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.fontButton}
            onPress={() => setFontSize((prev) => Math.min(prev + 2, 28))}
          >
            <Text style={[styles.fontButtonText, { color: colors.text }]}>A+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Chords and Lyrics Content */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={true}>
        {song.lines.map((line: ChordProLine, lineIdx: number) => {
          if (line.type === 'empty') {
            return <View key={lineIdx} style={styles.emptyLine} />;
          }

          if (line.type === 'comment') {
            return (
              <View
                key={lineIdx}
                style={[styles.commentBadge, { backgroundColor: colors.commentBg }]}
              >
                <Text style={[styles.commentText, { color: colors.commentText }]}>
                  {line.text.toUpperCase()}
                </Text>
              </View>
            );
          }

          // Lyric line with items
          return (
            <View key={lineIdx} style={styles.lyricLine}>
              {line.items.map((item, itemIdx) => {
                const transposedChord = item.chord
                  ? transposeChord(item.chord, semitones)
                  : '';

                return (
                  <View key={itemIdx} style={styles.chordWordItem}>
                    {transposedChord ? (
                      <Text
                        style={[
                          styles.chordText,
                          {
                            color: colors.chord,
                            fontSize: fontSize - 1,
                          },
                        ]}
                      >
                        {transposedChord}
                      </Text>
                    ) : (
                      <Text style={[styles.chordSpacer, { fontSize: fontSize - 1 }]}> </Text>
                    )}
                    <Text
                      style={[
                        styles.lyricText,
                        {
                          color: colors.text,
                          fontSize,
                        },
                      ]}
                    >
                      {item.lyrics || ' '}
                    </Text>
                  </View>
                );
              })}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  controlBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  transposeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginRight: 6,
  },
  stepperButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 3,
  },
  keyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    marginHorizontal: 4,
  },
  keyBadgeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  resetButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 4,
  },
  resetButtonText: {
    fontSize: 12,
    color: '#0288D1',
    fontWeight: '600',
  },
  secondaryGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    marginRight: 6,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 3,
  },
  fontButton: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    marginLeft: 2,
  },
  fontButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  emptyLine: {
    height: 16,
  },
  commentBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 12,
    marginBottom: 6,
  },
  commentText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  lyricLine: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  chordWordItem: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  chordText: {
    fontWeight: '700',
    fontFamily: 'monospace',
    marginBottom: 1,
  },
  chordSpacer: {
    lineHeight: 14,
  },
  lyricText: {
    lineHeight: 24,
  },
});
