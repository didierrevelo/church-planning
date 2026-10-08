import { StyleSheet } from 'react-native';

/**
 * Stylesheet for ChordViewer component.
 * Provides styling for the transpose controls, key badge, font resize buttons,
 * ChordPro rendered tokens, chords and lyric alignments.
 */
export const styles = StyleSheet.create({
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
