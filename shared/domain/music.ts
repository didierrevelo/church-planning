/**
 * Music and Chord Transposition Engine.
 *
 * Provides pure mathematical chromatic chord transposition, ChordPro format parsing,
 * key delta calculation, and song manipulation without external licensing restrictions.
 */

/**
 * Standard 12-tone chromatic scale using sharp notations.
 */
export const CHROMATIC_SHARPS: readonly string[] = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B',
] as const;

/**
 * Standard 12-tone chromatic scale using flat notations.
 */
export const CHROMATIC_FLATS: readonly string[] = [
  'C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B',
] as const;

/**
 * Mapping of common flat root notes to their enharmonic sharp representations.
 */
const FLAT_TO_SHARP_MAP: Record<string, string> = {
  Db: 'C#',
  Eb: 'D#',
  Gb: 'F#',
  Ab: 'G#',
  Bb: 'A#',
  Cb: 'B',
  Fb: 'E',
};

/**
 * Mapping of sharp notes to their preferred flat representations when requested.
 */
const SHARP_TO_FLAT_MAP: Record<string, string> = {
  'C#': 'Db',
  'D#': 'Eb',
  'F#': 'Gb',
  'G#': 'Ab',
  'A#': 'Bb',
};

/**
 * Options to configure chord and key transposition.
 */
export interface TransposeOptions {
  /**
   * If true, output chords with flat accidentals (e.g., Bb instead of A#).
   */
  preferFlats?: boolean;
}

/**
 * Options for transposing an entire ChordPro document.
 */
export interface TransposeSongOptions extends TransposeOptions {
  /**
   * Semitones to shift (positive for up, negative for down).
   */
  semitones?: number;
  /**
   * Original key of the song (used to calculate semitones delta if `toKey` is specified).
   */
  fromKey?: string;
  /**
   * Target key to transpose the song into.
   */
  toKey?: string;
}

/**
 * A parsed item within a lyric line consisting of an optional chord and corresponding lyric text.
 */
export interface ChordProItem {
  chord?: string;
  lyrics: string;
}

/**
 * Represents a single line in a parsed ChordPro song.
 */
export type ChordProLine =
  | { type: 'lyric'; items: ChordProItem[] }
  | { type: 'comment'; text: string }
  | { type: 'empty' };

/**
 * Structured representation of a parsed ChordPro song.
 */
export interface ChordProSong {
  metadata: Record<string, string>;
  lines: ChordProLine[];
}

/**
 * Normalizes a musical root note to its standard representation in the sharp scale.
 *
 * @param root Note root, e.g., 'Db', 'C#', 'G'
 * @returns Normalized root note (e.g. 'C#')
 */
export function normalizeChordRoot(root: string): string {
  if (!root) return '';
  return FLAT_TO_SHARP_MAP[root] || root;
}

/**
 * Shifts a single note root by a number of semitones.
 *
 * @param root Single note root name ('C', 'F#', 'Bb')
 * @param semitones Number of semitones to shift
 * @param options Transposition options (e.g., preference for flats)
 * @returns Transposed note root
 */
function shiftRootNote(
  root: string,
  semitones: number,
  options?: TransposeOptions
): string {
  const normalized = normalizeChordRoot(root);
  const currentIndex = CHROMATIC_SHARPS.indexOf(normalized);

  if (currentIndex === -1) {
    return root;
  }

  // Modulo 12 handling negative numbers correctly
  const newIndex = ((currentIndex + semitones) % 12 + 12) % 12;
  const transposedSharp = CHROMATIC_SHARPS[newIndex];

  if (options?.preferFlats) {
    return SHARP_TO_FLAT_MAP[transposedSharp] || transposedSharp;
  }

  return transposedSharp;
}

/**
 * Regular expression parsing a chord into:
 * 1: Root note (A-G with optional accidental)
 * 2: Quality/modifiers (m, maj7, sus4, add9, 7b5, etc.)
 * 4: Optional slash bass note root (A-G with accidental)
 */
const CHORD_REGEX = /^([A-G][b#]?)(.*?)(\/([A-G][b#]?))?$/;

/**
 * Transposes a chord symbol by a given number of semitones.
 * Preserves chord quality, tensions, and properly transposes slash bass notes.
 *
 * @example
 * transposeChord('G/B', 2) // returns 'A/C#'
 * transposeChord('Cmaj7', -2) // returns 'A#maj7' (or 'Bbmaj7' with preferFlats)
 *
 * @param chord Chord string to transpose
 * @param semitones Number of semitones to shift
 * @param options Transposition options
 * @returns Transposed chord symbol
 */
export function transposeChord(
  chord: string,
  semitones: number,
  options?: TransposeOptions
): string {
  if (!chord || typeof chord !== 'string') return chord;
  const trimmed = chord.trim();
  if (!trimmed || trimmed === 'N.C.') return chord;

  const match = trimmed.match(CHORD_REGEX);
  if (!match) {
    return chord;
  }

  const [, root, quality, , bass] = match;
  const transposedRoot = shiftRootNote(root, semitones, options);

  if (bass) {
    const transposedBass = shiftRootNote(bass, semitones, options);
    return `${transposedRoot}${quality}/${transposedBass}`;
  }

  return `${transposedRoot}${quality}`;
}

/**
 * Transposes a key signature by a given number of semitones.
 *
 * @param currentKey Key signature string (e.g., 'G', 'Am', 'F#m')
 * @param semitones Number of semitones to shift
 * @param options Transposition options
 * @returns Transposed key signature
 */
export function transposeKey(
  currentKey: string,
  semitones: number,
  options?: TransposeOptions
): string {
  if (!currentKey) return '';
  const isMinor = currentKey.endsWith('m') && !currentKey.endsWith('dim');
  const baseRoot = isMinor ? currentKey.slice(0, -1) : currentKey;
  const transposedRoot = shiftRootNote(baseRoot, semitones, options);
  return isMinor ? `${transposedRoot}m` : transposedRoot;
}

/**
 * Calculates the shortest distance in positive semitones from one key to another.
 *
 * @param fromKey Starting key signature
 * @param toKey Destination key signature
 * @returns Semitone distance in range [0, 11]
 */
export function getSemitoneDistance(fromKey: string, toKey: string): number {
  const normFrom = normalizeChordRoot(fromKey.replace(/m$/, ''));
  const normTo = normalizeChordRoot(toKey.replace(/m$/, ''));

  const fromIdx = CHROMATIC_SHARPS.indexOf(normFrom);
  const toIdx = CHROMATIC_SHARPS.indexOf(normTo);

  if (fromIdx === -1 || toIdx === -1) {
    return 0;
  }

  return (toIdx - fromIdx + 12) % 12;
}

/**
 * Parses a raw ChordPro formatted string into a structured representation.
 *
 * @param text Raw ChordPro content
 * @returns Structured ChordPro song object
 */
export function parseChordPro(text: string): ChordProSong {
  const metadata: Record<string, string> = {};
  const lines: ChordProLine[] = [];

  if (!text) {
    return { metadata, lines };
  }

  const rawLines = text.split(/\r?\n/);

  for (const rawLine of rawLines) {
    const trimmed = rawLine.trim();

    if (!trimmed) {
      lines.push({ type: 'empty' });
      continue;
    }

    // Check for directive: {directive: value} or {directive}
    const directiveMatch = trimmed.match(/^\{([a-zA-Z0-9_-]+)(?::\s*(.*?))?\}$/);
    if (directiveMatch) {
      const directiveName = directiveMatch[1].toLowerCase();
      const directiveValue = (directiveMatch[2] || '').trim();

      if (['comment', 'c'].includes(directiveName)) {
        lines.push({ type: 'comment', text: directiveValue });
      } else {
        metadata[directiveName] = directiveValue;
      }
      continue;
    }

    // Lyric line with embedded [Chord] tokens
    const items: ChordProItem[] = [];
    const tokenRegex = /\[([^\]]+)\]([^\[]*)/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    // Check if line starts with lyrics before any chord
    const firstBracket = rawLine.indexOf('[');
    if (firstBracket > 0) {
      items.push({
        lyrics: rawLine.substring(0, firstBracket),
      });
      lastIndex = firstBracket;
    } else if (firstBracket === -1) {
      // Line contains no chords
      lines.push({
        type: 'lyric',
        items: [{ lyrics: rawLine }],
      });
      continue;
    }

    tokenRegex.lastIndex = lastIndex;
    while ((match = tokenRegex.exec(rawLine)) !== null) {
      const chord = match[1];
      const lyrics = match[2];
      items.push({ chord, lyrics });
    }

    lines.push({ type: 'lyric', items });
  }

  return { metadata, lines };
}

/**
 * Transposes all chords and key directives in a ChordPro text to a new key.
 *
 * @param chordProText ChordPro song text
 * @param options Transposition options (semitones, or fromKey -> toKey)
 * @returns Transposed ChordPro string
 */
export function transposeChordPro(
  chordProText: string,
  options: TransposeSongOptions
): string {
  if (!chordProText) return '';

  let semitones = options.semitones || 0;
  if (options.fromKey && options.toKey) {
    semitones = getSemitoneDistance(options.fromKey, options.toKey);
  }

  if (semitones === 0) {
    return chordProText;
  }

  // 1. Transpose {key: ...} directive if present
  let result = chordProText.replace(
    /\{(key):\s*([^}]+)\}/gi,
    (_, directive, currentKey) => {
      const newKey = transposeKey(currentKey.trim(), semitones, options);
      return `{${directive}: ${newKey}}`;
    }
  );

  // 2. Transpose all [Chord] occurrences
  result = result.replace(/\[([^\]]+)\]/g, (_, chordContent) => {
    const transposed = transposeChord(chordContent, semitones, options);
    return `[${transposed}]`;
  });

  return result;
}
