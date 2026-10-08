import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useKeepAwake } from 'expo-keep-awake';
import { Song } from '../types';
import {
  parseChordPro,
  transposeChord,
  transposeKey,
  type ChordProLine,
} from '@shared/domain/music';
import {
  calculateAutoScrollInterval,
  calculateMetronomeInterval,
  getNextSongIndex,
  getPrevSongIndex,
  DEFAULT_SCROLL_SPEED,
  MIN_SCROLL_SPEED,
  MAX_SCROLL_SPEED,
} from '@shared/domain/stageMode';
import { styles } from './LiveStageScreen.styles';

export interface LiveStageScreenProps {
  route: {
    params: {
      songs: Song[];
      initialIndex?: number;
    };
  };
  navigation: {
    goBack: () => void;
  };
}

/**
 * LiveStageScreen: Optimized for musicians performing live on stage.
 * Features high-contrast OLED dark theme, screen wake-lock, hands-free auto-scrolling,
 * visual metronome, real-time transposition, and setlist navigation.
 */
export default function LiveStageScreen({ route, navigation }: LiveStageScreenProps) {
  // Prevent screen from sleeping while on stage
  useKeepAwake();

  const songs = route.params?.songs || [];
  const [currentIndex, setCurrentIndex] = useState<number>(route.params?.initialIndex || 0);
  const [semitones, setSemitones] = useState<number>(0);
  const [fontSize, setFontSize] = useState<number>(18);
  const [isScrolling, setIsScrolling] = useState<boolean>(false);
  const [scrollSpeed, setScrollSpeed] = useState<number>(DEFAULT_SCROLL_SPEED);
  const [beatActive, setBeatActive] = useState<boolean>(false);

  const scrollRef = useRef<ScrollView>(null);
  const scrollOffsetRef = useRef<number>(0);

  const currentSong: Song | undefined = songs[currentIndex];

  // Reset transposition and scroll position when switching songs
  useEffect(() => {
    setSemitones(0);
    scrollOffsetRef.current = 0;
    scrollRef.current?.scrollTo({ y: 0, animated: false });
    setIsScrolling(false);
  }, [currentIndex]);

  // Visual metronome pulse effect
  useEffect(() => {
    if (!currentSong?.bpm) return;
    const intervalMs = calculateMetronomeInterval(currentSong.bpm);

    const interval = setInterval(() => {
      setBeatActive(true);
      setTimeout(() => setBeatActive(false), 120);
    }, intervalMs);

    return () => clearInterval(interval);
  }, [currentSong?.bpm]);

  // Hands-free auto-scrolling loop
  useEffect(() => {
    if (!isScrolling) return;

    const tickMs = calculateAutoScrollInterval(scrollSpeed);
    const scrollInterval = setInterval(() => {
      scrollOffsetRef.current += 1.5;
      scrollRef.current?.scrollTo({
        y: scrollOffsetRef.current,
        animated: false,
      });
    }, tickMs);

    return () => clearInterval(scrollInterval);
  }, [isScrolling, scrollSpeed]);

  // Parse current song's ChordPro content
  const parsedSong = useMemo(() => {
    const rawContent =
      currentSong?.chordContent ||
      `{title: ${currentSong?.title || 'Sin Título'}}\n{key: ${currentSong?.key || 'C'}}\n{comment: Letra}\nNo hay cifrado cargado para esta canción.`;
    return parseChordPro(rawContent);
  }, [currentSong]);

  const baseKey = currentSong?.key || parsedSong.metadata.key || '';
  const currentKey = baseKey ? transposeKey(baseKey, semitones) : '';

  const handleNextSong = () => {
    setCurrentIndex(getNextSongIndex(currentIndex, songs.length));
  };

  const handlePrevSong = () => {
    setCurrentIndex(getPrevSongIndex(currentIndex, songs.length));
  };

  if (!currentSong) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.emptyText}>No hay canciones en el repertorio</Text>
        <TouchableOpacity style={styles.exitButton} onPress={() => navigation.goBack()}>
          <Text style={styles.exitButtonText}>Salir</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      {/* Top Stage Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.exitIconBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="close-circle" size={28} color="#9E9E9E" />
        </TouchableOpacity>

        <View style={styles.centerSongInfo}>
          <Text style={styles.songTitle} numberOfLines={1}>
            {currentSong.title}
          </Text>
          <View style={styles.metaRow}>
            <Text style={styles.songPagination}>
              {currentIndex + 1} de {songs.length}
            </Text>
            {currentSong.bpm ? (
              <View style={styles.metronomeContainer}>
                <View
                  style={[
                    styles.metronomeDot,
                    beatActive && styles.metronomeDotActive,
                  ]}
                />
                <Text style={styles.bpmText}>{currentSong.bpm} BPM</Text>
              </View>
            ) : null}
            {currentSong.timeSignature ? (
              <Text style={styles.timeSigText}>{currentSong.timeSignature}</Text>
            ) : null}
          </View>
        </View>

        {/* Setlist Navigation */}
        <View style={styles.navButtonGroup}>
          <TouchableOpacity
            style={[styles.navBtn, currentIndex === 0 && styles.navBtnDisabled]}
            onPress={handlePrevSong}
            disabled={currentIndex === 0}
          >
            <Ionicons name="chevron-back" size={22} color={currentIndex === 0 ? '#424242' : '#FFF'} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.navBtn, currentIndex === songs.length - 1 && styles.navBtnDisabled]}
            onPress={handleNextSong}
            disabled={currentIndex === songs.length - 1}
          >
            <Ionicons
              name="chevron-forward"
              size={22}
              color={currentIndex === songs.length - 1 ? '#424242' : '#FFF'}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Secondary Quick Controls (Key & Font Size) */}
      <View style={styles.controlSubBar}>
        <View style={styles.keyControls}>
          <Text style={styles.subBarLabel}>Tono:</Text>
          <TouchableOpacity style={styles.stepperBtn} onPress={() => setSemitones((s) => s - 1)}>
            <Ionicons name="remove" size={16} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.keyBadge}>
            <Text style={styles.keyBadgeText}>
              {currentKey || 'N/A'}
              {semitones !== 0 ? ` (${semitones > 0 ? `+${semitones}` : semitones})` : ''}
            </Text>
          </View>
          <TouchableOpacity style={styles.stepperBtn} onPress={() => setSemitones((s) => s + 1)}>
            <Ionicons name="add" size={16} color="#FFF" />
          </TouchableOpacity>
          {semitones !== 0 && (
            <TouchableOpacity onPress={() => setSemitones(0)} style={styles.resetBtn}>
              <Text style={styles.resetBtnText}>0</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.fontControls}>
          <TouchableOpacity
            style={styles.fontBtn}
            onPress={() => setFontSize((f) => Math.max(f - 2, 14))}
          >
            <Text style={styles.fontBtnText}>A-</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.fontBtn}
            onPress={() => setFontSize((f) => Math.min(f + 2, 32))}
          >
            <Text style={styles.fontBtnText}>A+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Song Lyrics & Chords Scroll View */}
      <ScrollView
        ref={scrollRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        onScroll={(e) => {
          scrollOffsetRef.current = e.nativeEvent.contentOffset.y;
        }}
        scrollEventThrottle={16}
      >
        {parsedSong.lines.map((line: ChordProLine, lineIdx: number) => {
          if (line.type === 'empty') {
            return <View key={lineIdx} style={styles.emptyLine} />;
          }

          if (line.type === 'comment') {
            return (
              <View key={lineIdx} style={styles.sectionBadge}>
                <Text style={styles.sectionBadgeText}>{line.text.toUpperCase()}</Text>
              </View>
            );
          }

          return (
            <View key={lineIdx} style={styles.lyricLine}>
              {line.items.map((item, itemIdx) => {
                const transposed = item.chord ? transposeChord(item.chord, semitones) : '';

                return (
                  <View key={itemIdx} style={styles.chordWordItem}>
                    {transposed ? (
                      <Text style={[styles.chordText, { fontSize: fontSize + 1 }]}>
                        {transposed}
                      </Text>
                    ) : (
                      <Text style={[styles.chordSpacer, { fontSize: fontSize + 1 }]}> </Text>
                    )}
                    <Text style={[styles.lyricText, { fontSize }]}>
                      {item.lyrics || ' '}
                    </Text>
                  </View>
                );
              })}
            </View>
          );
        })}
      </ScrollView>

      {/* Floating Auto-Scroll Controls Dock */}
      <View style={styles.floatingDock}>
        <TouchableOpacity
          style={[styles.dockPlayBtn, isScrolling && styles.dockPlayBtnActive]}
          onPress={() => setIsScrolling(!isScrolling)}
          activeOpacity={0.8}
        >
          <Ionicons
            name={isScrolling ? 'pause' : 'play'}
            size={22}
            color="#FFFFFF"
          />
          <Text style={styles.dockPlayText}>{isScrolling ? 'Pausa' : 'Auto-Scroll'}</Text>
        </TouchableOpacity>

        <View style={styles.speedControl}>
          <TouchableOpacity
            style={styles.speedBtn}
            onPress={() => setScrollSpeed((s) => Math.max(s - 1, MIN_SCROLL_SPEED))}
          >
            <Ionicons name="remove" size={16} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.speedText}>{scrollSpeed}x</Text>
          <TouchableOpacity
            style={styles.speedBtn}
            onPress={() => setScrollSpeed((s) => Math.min(s + 1, MAX_SCROLL_SPEED))}
          >
            <Ionicons name="add" size={16} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

