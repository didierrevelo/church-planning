/**
 * Unit tests for the Music and Chord Transposition Engine.
 * Following Test-Driven Development (TDD).
 */

import {
  transposeChord,
  transposeKey,
  getSemitoneDistance,
  normalizeChordRoot,
  parseChordPro,
  transposeChordPro,
  type ChordProLine,
  type ChordProSong,
} from '../domain/music';

describe('Music & Chord Transposition Engine', () => {
  describe('normalizeChordRoot', () => {
    it('should keep standard sharp notes intact', () => {
      expect(normalizeChordRoot('C#')).toBe('C#');
      expect(normalizeChordRoot('F#')).toBe('F#');
    });

    it('should normalize flat notes to their standard enharmonic sharp equivalents', () => {
      expect(normalizeChordRoot('Db')).toBe('C#');
      expect(normalizeChordRoot('Eb')).toBe('D#');
      expect(normalizeChordRoot('Gb')).toBe('F#');
      expect(normalizeChordRoot('Ab')).toBe('G#');
      expect(normalizeChordRoot('Bb')).toBe('A#');
    });

    it('should normalize natural notes correctly', () => {
      expect(normalizeChordRoot('C')).toBe('C');
      expect(normalizeChordRoot('G')).toBe('G');
    });
  });

  describe('transposeChord', () => {
    it('should transpose basic major chords upwards and downwards', () => {
      expect(transposeChord('C', 2)).toBe('D');
      expect(transposeChord('G', 2)).toBe('A');
      expect(transposeChord('A', 2)).toBe('B');
      expect(transposeChord('B', 1)).toBe('C');
      expect(transposeChord('D', -2)).toBe('C');
    });

    it('should preserve chord qualities (minor, 7th, maj7, sus4, dim, aug)', () => {
      expect(transposeChord('Am', 2)).toBe('Bm');
      expect(transposeChord('Em7', 2)).toBe('F#m7');
      expect(transposeChord('Cmaj7', 2)).toBe('Dmaj7');
      expect(transposeChord('Dsus4', 2)).toBe('Esus4');
      expect(transposeChord('F#dim', 1)).toBe('Gdim');
      expect(transposeChord('Gaug', 2)).toBe('Aaug');
      expect(transposeChord('Bm7b5', 2)).toBe('C#m7b5');
    });

    it('should transpose slash chords (both root and bass note)', () => {
      expect(transposeChord('G/B', 2)).toBe('A/C#');
      expect(transposeChord('C/E', 2)).toBe('D/F#');
      expect(transposeChord('D/F#', 2)).toBe('E/G#');
      expect(transposeChord('Am/G', -2)).toBe('Gm/F');
    });

    it('should handle circular semitone wrap-around (mod 12)', () => {
      expect(transposeChord('G', 14)).toBe('A'); // 14 semitones = 2 semitones
      expect(transposeChord('C', -14)).toBe('A#');
      expect(transposeChord('C', 0)).toBe('C');
    });

    it('should return non-chord text untouched if not a valid chord pattern', () => {
      expect(transposeChord('', 2)).toBe('');
      expect(transposeChord('N.C.', 2)).toBe('N.C.');
    });
  });

  describe('transposeKey', () => {
    it('should calculate new key given semitones offset', () => {
      expect(transposeKey('G', 2)).toBe('A');
      expect(transposeKey('C', 5)).toBe('F');
      expect(transposeKey('E', -1)).toBe('D#');
    });

    it('should support preferFlats option when needed', () => {
      expect(transposeKey('C', 5, { preferFlats: true })).toBe('F');
      expect(transposeKey('C', 10, { preferFlats: true })).toBe('Bb');
      expect(transposeKey('G', 3, { preferFlats: true })).toBe('Bb');
    });
  });

  describe('getSemitoneDistance', () => {
    it('should calculate semitone delta between two keys', () => {
      expect(getSemitoneDistance('C', 'D')).toBe(2);
      expect(getSemitoneDistance('C', 'G')).toBe(7);
      expect(getSemitoneDistance('G', 'C')).toBe(5);
      expect(getSemitoneDistance('A', 'A')).toBe(0);
    });
  });

  describe('parseChordPro', () => {
    it('should parse directive lines like {title: ...} and {key: ...}', () => {
      const input = `{title: Amazing Grace}\n{key: G}\n{tempo: 72}`;
      const song: ChordProSong = parseChordPro(input);

      expect(song.metadata.title).toBe('Amazing Grace');
      expect(song.metadata.key).toBe('G');
      expect(song.metadata.tempo).toBe('72');
    });

    it('should parse lines with embedded [Chord] tokens into segments', () => {
      const input = `[G]Amazing [C]grace how [G]sweet the sound`;
      const song: ChordProSong = parseChordPro(input);

      expect(song.lines).toHaveLength(1);
      const line = song.lines[0];
      expect(line.type).toBe('lyric');
      if (line.type === 'lyric') {
        expect(line.items).toEqual([
          { chord: 'G', lyrics: 'Amazing ' },
          { chord: 'C', lyrics: 'grace how ' },
          { chord: 'G', lyrics: 'sweet the sound' },
        ]);
      }
    });

    it('should preserve comment directives like {c: Chorus}', () => {
      const input = `{comment: Chorus}\n[C]Praise the [G]Lord`;
      const song: ChordProSong = parseChordPro(input);

      const firstLine = song.lines[0];
      expect(firstLine.type).toBe('comment');
      if (firstLine.type === 'comment') {
        expect(firstLine.text).toBe('Chorus');
      }
      expect(song.lines[1].type).toBe('lyric');
    });
  });

  describe('transposeChordPro', () => {
    it('should transpose all chords in a ChordPro text to a new key', () => {
      const input = `{title: Way Maker}\n{key: C}\n[C]You are here, [G]moving in our [F]midst`;
      const transposed = transposeChordPro(input, { fromKey: 'C', toKey: 'D' });

      expect(transposed).toContain('{key: D}');
      expect(transposed).toContain('[D]You are here, [A]moving in our [G]midst');
    });

    it('should transpose chords when only semitones delta is specified', () => {
      const input = `[G]Sublime [C]gracia [D]del Señor`;
      const transposed = transposeChordPro(input, { semitones: 2 });

      expect(transposed).toBe('[A]Sublime [D]gracia [E]del Señor');
    });
  });
});
