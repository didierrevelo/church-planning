/**
 * Presentation Export Helper.
 *
 * Provides presentation preparation, bundling, and summarization utilities
 * for exporting songs and setlists to projection systems (FreeShow, OpenLP, ProPresenter, text).
 *
 * 100% proprietary clean TypeScript code.
 */

import {
  generatePresentationSlides,
  exportToFreeShowFormat,
  exportToTextSlides,
  type ExportableSong,
  type SlideOptions,
  type FreeShowExport,
} from './setlistExport';

export type ExportFormat = 'freeshow' | 'text';

/**
 * Summary metrics of a presentation setlist.
 */
export interface PresentationSummary {
  totalSongs: number;
  totalSlides: number;
  sections: string[];
}

/**
 * Multi-song FreeShow bundle export format.
 */
export interface FreeShowBundleExport {
  format: 'freeshow-setlist-bundle-v1';
  exportedAt: string;
  songs: FreeShowExport[];
}

/**
 * Prepared export result ready for download, clipboard or sharing.
 */
export interface ExportResult {
  format: ExportFormat;
  mimeType: string;
  filename: string;
  payload: string;
  slideCount: number;
}

/**
 * Sanitizes a title into a safe lowercase filename prefix without special characters.
 *
 * @param title Song or setlist title
 * @returns Safe filename slug
 */
export function sanitizeFilenameSlug(title: string): string {
  const normalized = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Strip diacritics
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  return normalized || 'presentation';
}

/**
 * Calculates a summary of total slides and unique liturgical sections across songs.
 *
 * @param songs List of exportable songs
 * @param options Slide generation options
 * @returns PresentationSummary
 */
export function getPresentationSummary(
  songs: ExportableSong[],
  options?: SlideOptions
): PresentationSummary {
  if (!songs || songs.length === 0) {
    return {
      totalSongs: 0,
      totalSlides: 0,
      sections: [],
    };
  }

  let totalSlides = 0;
  const sectionsSet = new Set<string>();

  for (const song of songs) {
    const slides = generatePresentationSlides(song.chordContent || '', options);
    totalSlides += slides.length;
    for (const slide of slides) {
      // Extract clean section header
      const cleanHeader = slide.header.replace(/\s*\(\d+\/\d+\)$/, '').trim();
      if (cleanHeader) {
        sectionsSet.add(cleanHeader);
      }
    }
  }

  return {
    totalSongs: songs.length,
    totalSlides,
    sections: Array.from(sectionsSet),
  };
}

/**
 * Prepares formatted presentation export payload with metadata, filename, and slide count.
 *
 * @param songs List of songs to export
 * @param format Target export format ('freeshow' | 'text')
 * @param options Slide generation options
 * @returns ExportResult
 */
export function preparePresentationExport(
  songs: ExportableSong[],
  format: ExportFormat,
  options?: SlideOptions
): ExportResult {
  if (!songs || songs.length === 0) {
    const isJson = format === 'freeshow';
    return {
      format,
      mimeType: isJson ? 'application/json' : 'text/plain',
      filename: isJson ? 'empty_presentation.json' : 'empty_presentation.txt',
      payload: isJson ? JSON.stringify({ format: 'empty', slides: [] }) : '',
      slideCount: 0,
    };
  }

  const isSingleSong = songs.length === 1;
  const primaryTitle = isSingleSong ? songs[0].title : 'setlist_presentation';
  const slug = sanitizeFilenameSlug(primaryTitle);

  if (format === 'freeshow') {
    if (isSingleSong) {
      const freeShowDoc = exportToFreeShowFormat(songs[0], options);
      return {
        format: 'freeshow',
        mimeType: 'application/json',
        filename: `${slug}_freeshow.json`,
        payload: JSON.stringify(freeShowDoc, null, 2),
        slideCount: freeShowDoc.slides.length,
      };
    }

    // Multi-song setlist bundle
    const freeShowSongs: FreeShowExport[] = songs.map((s) =>
      exportToFreeShowFormat(s, options)
    );
    const totalSlides = freeShowSongs.reduce(
      (acc, s) => acc + s.slides.length,
      0
    );

    const bundle: FreeShowBundleExport = {
      format: 'freeshow-setlist-bundle-v1',
      exportedAt: new Date().toISOString(),
      songs: freeShowSongs,
    };

    return {
      format: 'freeshow',
      mimeType: 'application/json',
      filename: `${slug}_freeshow.json`,
      payload: JSON.stringify(bundle, null, 2),
      slideCount: totalSlides,
    };
  }

  // Text format
  let totalSlides = 0;
  const textBlocks: string[] = [];

  for (const song of songs) {
    const slides = generatePresentationSlides(song.chordContent || '', options);
    totalSlides += slides.length;
    textBlocks.push(exportToTextSlides(song, options));
  }

  const payload = textBlocks.join('\n\n====================\n\n');

  return {
    format: 'text',
    mimeType: 'text/plain',
    filename: `${slug}_slides.txt`,
    payload,
    slideCount: totalSlides,
  };
}
