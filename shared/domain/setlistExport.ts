/**
 * Setlist Presentation & Church Projection Exporter.
 *
 * Transforms songs and setlists from ChordPro chord charts into structured
 * lyric slides compatible with church projection software (FreeShow / OpenLP / ProPresenter).
 *
 * Automatically removes chord annotations, detects song sections (Verses, Choruses, Bridges),
 * breaks verses into line-limited projection slides, and exports JSON and slide text.
 *
 * 100% proprietary clean TypeScript code (Free of copyleft restrictions).
 */

/**
 * Section classifications for church lyric slides.
 */
export type SongSectionType =
  | 'verse'
  | 'chorus'
  | 'bridge'
  | 'pre-chorus'
  | 'tag'
  | 'other';

/**
 * Parsed song section containing clean lyric lines.
 */
export interface SongSection {
  type: SongSectionType;
  title: string;
  lines: string[];
}

/**
 * Individual projection slide.
 */
export interface PresentationSlide {
  id: string;
  section: SongSectionType;
  header: string;
  content: string;
  lines: string[];
}

/**
 * Configuration options for generating slides.
 */
export interface SlideOptions {
  /**
   * Maximum number of lyric lines displayed per slide (default 4).
   */
  maxLinesPerSlide?: number;
}

/**
 * Song representation for presentation export.
 */
export interface ExportableSong {
  title: string;
  artist?: string | null;
  key?: string | null;
  bpm?: number | null;
  chordContent?: string | null;
}

/**
 * FreeShow compatible presentation export schema.
 */
export interface FreeShowExport {
  format: 'freeshow-export-v1';
  metadata: {
    title: string;
    artist?: string;
    key?: string;
    bpm?: number;
    exportedAt: string;
  };
  slides: PresentationSlide[];
}

/**
 * Strips all embedded chord notation (e.g. `[G]`, `[Am7]`, `[D/F#]`) and ChordPro directives.
 *
 * @param chordProText Song text containing ChordPro syntax
 * @returns Clean, plain lyric text
 */
export function stripChords(chordProText: string): string {
  if (!chordProText) return '';

  return chordProText
    .split('\n')
    // Remove directives like {title:...}, {artist:...}, {c:...}, {comment:...}
    .filter((line) => !line.trim().startsWith('{'))
    // Remove embedded chords [Chord]
    .map((line) => line.replace(/\[[^\]]+\]/g, '').trim())
    .join('\n')
    .trim();
}

/**
 * Determines the section type based on section title text.
 *
 * @param title Section title (e.g. "Verso 1", "Coro", "Chorus", "Bridge")
 * @returns SongSectionType
 */
function classifySectionTitle(title: string): SongSectionType {
  const lower = title.toLowerCase();
  if (/verso|verse/i.test(lower)) return 'verse';
  if (/coro|chorus/i.test(lower)) return 'chorus';
  if (/puente|bridge/i.test(lower)) return 'bridge';
  if (/pre-?coro|pre-?chorus/i.test(lower)) return 'pre-chorus';
  if (/tag|estrofa/i.test(lower)) return 'tag';
  return 'other';
}

/**
 * Parses a song's text into structured liturgical sections (Verses, Choruses, etc.).
 *
 * @param chordProText Song text with or without ChordPro directives
 * @returns Array of SongSection objects
 */
export function parseSongSections(chordProText: string): SongSection[] {
  if (!chordProText) return [];

  const rawLines = chordProText.split('\n');
  const sections: SongSection[] = [];

  let currentTitle: string | null = null;
  let currentLines: string[] = [];

  const flushSection = () => {
    if (currentLines.length > 0) {
      const title = currentTitle || `Sección ${sections.length + 1}`;
      sections.push({
        type: classifySectionTitle(title),
        title,
        lines: currentLines,
      });
      currentLines = [];
    }
  };

  let hasExplicitCommentTags = false;

  for (const rawLine of rawLines) {
    const trimmed = rawLine.trim();

    // Check for comment directive {c: ...} or {comment: ...}
    const commentMatch = trimmed.match(/^\{(?:c|comment)\s*:\s*([^}]+)\}/i);
    if (commentMatch) {
      hasExplicitCommentTags = true;
      flushSection();
      currentTitle = commentMatch[1].trim();
      continue;
    }

    // Skip non-section directives like {title:...}, {artist:...}, {key:...}
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      continue;
    }

    // Clean chords from line
    const cleanLine = trimmed.replace(/\[[^\]]+\]/g, '').trim();

    if (cleanLine.length > 0) {
      currentLines.push(cleanLine);
    } else if (!hasExplicitCommentTags && currentLines.length > 0) {
      // Empty line without explicit comment tags indicates a section break
      flushSection();
      currentTitle = null;
    }
  }

  flushSection();
  return sections;
}

/**
 * Generates presentation slides from song content, respecting slide line constraints.
 *
 * @param chordProText Song text
 * @param options Slide generation options (such as maximum lines per slide)
 * @returns Array of PresentationSlide objects
 */
export function generatePresentationSlides(
  chordProText: string,
  options: SlideOptions = {}
): PresentationSlide[] {
  const maxLines = options.maxLinesPerSlide ?? 4;
  const sections = parseSongSections(chordProText);
  const slides: PresentationSlide[] = [];

  let slideIndex = 1;

  for (const sec of sections) {
    if (sec.lines.length <= maxLines) {
      slides.push({
        id: `slide-${slideIndex++}`,
        section: sec.type,
        header: sec.title,
        content: sec.lines.join('\n'),
        lines: sec.lines,
      });
    } else {
      // Split section into chunks of maxLines
      const totalChunks = Math.ceil(sec.lines.length / maxLines);
      for (let i = 0; i < totalChunks; i++) {
        const chunk = sec.lines.slice(i * maxLines, (i + 1) * maxLines);
        slides.push({
          id: `slide-${slideIndex++}`,
          section: sec.type,
          header: `${sec.title} (${i + 1}/${totalChunks})`,
          content: chunk.join('\n'),
          lines: chunk,
        });
      }
    }
  }

  return slides;
}

/**
 * Exports a song into FreeShow JSON format for projection systems.
 *
 * @param song Song to export
 * @param options Slide generation options
 * @returns FreeShowExport document
 */
export function exportToFreeShowFormat(
  song: ExportableSong,
  options?: SlideOptions
): FreeShowExport {
  const slides = generatePresentationSlides(song.chordContent || '', options);

  return {
    format: 'freeshow-export-v1',
    metadata: {
      title: song.title,
      artist: song.artist || undefined,
      key: song.key || undefined,
      bpm: song.bpm ?? undefined,
      exportedAt: new Date().toISOString(),
    },
    slides,
  };
}

/**
 * Exports a song to clean plain text format with slide separators (---).
 *
 * @param song Song to export
 * @param options Slide generation options
 * @returns Plain text representation of slides
 */
export function exportToTextSlides(
  song: ExportableSong,
  options?: SlideOptions
): string {
  const slides = generatePresentationSlides(song.chordContent || '', options);

  return slides
    .map((slide) => `# ${slide.header}\n${slide.content}`)
    .join('\n\n---\n\n');
}
