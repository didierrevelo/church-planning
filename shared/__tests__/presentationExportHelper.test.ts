import {
  preparePresentationExport,
  getPresentationSummary,
  type ExportFormat,
} from '../domain/presentationExportHelper';
import type { ExportableSong } from '../domain/setlistExport';

describe('Presentation Export Helper (TDD)', () => {
  const mockSong1: ExportableSong = {
    title: 'Gracia Sublime Es',
    artist: 'Phil Wickham',
    key: 'G',
    bpm: 104,
    chordContent: `{title: Gracia Sublime Es}
{artist: Phil Wickham}
{key: G}
{c: Verso 1}
[G]Quién rompe el poder del pecado
[C]Su amor es fuerte y poderoso
[Em]El Rey de gloria, Rey majestuoso
[D]Sobre la muerte el venció

{c: Coro}
[G]Gracia sublime es
[C]Perfecto es tu amor
[Em]Tomaste mi lugar
[D]Cargaste tú mi cruz`,
  };

  const mockSong2: ExportableSong = {
    title: 'Cuan Grande Es Dios',
    artist: 'Chris Tomlin',
    key: 'C',
    bpm: 78,
    chordContent: `{title: Cuan Grande Es Dios}
{c: Verso 1}
[C]El esplendor de un Rey
[Am]Vestido en majestad
[F]La tierra alegre está
[G]La tierra alegre está

{c: Coro}
[C]Cuán grande es Dios
[Am]Cántale, cuán grande es Dios
[F]Y todos lo verán
[G]Cuán grande es Dios`,
  };

  describe('getPresentationSummary', () => {
    it('returns zero counts for empty song array', () => {
      const summary = getPresentationSummary([]);
      expect(summary.totalSongs).toBe(0);
      expect(summary.totalSlides).toBe(0);
      expect(summary.sections).toEqual([]);
    });

    it('summarizes a setlist with multiple songs and slide counts', () => {
      const summary = getPresentationSummary([mockSong1, mockSong2], { maxLinesPerSlide: 4 });
      expect(summary.totalSongs).toBe(2);
      expect(summary.totalSlides).toBe(4); // 2 sections each with 4 lines -> 2 slides each = 4 slides
      expect(summary.sections).toContain('Verso 1');
      expect(summary.sections).toContain('Coro');
    });

    it('increases slide count when maxLinesPerSlide is smaller', () => {
      const summary = getPresentationSummary([mockSong1], { maxLinesPerSlide: 2 });
      // Each section has 4 lines, with maxLines 2, each section becomes 2 slides = 4 slides total
      expect(summary.totalSlides).toBe(4);
    });
  });

  describe('preparePresentationExport', () => {
    it('prepares single song FreeShow JSON export', () => {
      const result = preparePresentationExport([mockSong1], 'freeshow');
      expect(result.format).toBe('freeshow');
      expect(result.mimeType).toBe('application/json');
      expect(result.filename).toBe('gracia_sublime_es_freeshow.json');
      expect(result.slideCount).toBe(2);

      const parsed = JSON.parse(result.payload);
      expect(parsed.format).toBe('freeshow-export-v1');
      expect(parsed.metadata.title).toBe('Gracia Sublime Es');
      expect(parsed.slides).toHaveLength(2);
    });

    it('prepares multi-song setlist FreeShow bundle export', () => {
      const result = preparePresentationExport([mockSong1, mockSong2], 'freeshow');
      expect(result.format).toBe('freeshow');
      expect(result.mimeType).toBe('application/json');
      expect(result.filename).toBe('setlist_presentation_freeshow.json');
      expect(result.slideCount).toBe(4);

      const parsed = JSON.parse(result.payload);
      expect(parsed.format).toBe('freeshow-setlist-bundle-v1');
      expect(parsed.songs).toHaveLength(2);
      expect(parsed.songs[0].metadata.title).toBe('Gracia Sublime Es');
      expect(parsed.songs[1].metadata.title).toBe('Cuan Grande Es Dios');
    });

    it('prepares text presentation export with slide dividers', () => {
      const result = preparePresentationExport([mockSong1], 'text');
      expect(result.format).toBe('text');
      expect(result.mimeType).toBe('text/plain');
      expect(result.filename).toBe('gracia_sublime_es_slides.txt');
      expect(result.payload).toContain('Quién rompe el poder del pecado');
      expect(result.payload).toContain('---');
      expect(result.slideCount).toBe(2);
    });

    it('handles empty songs gracefully', () => {
      const result = preparePresentationExport([], 'freeshow');
      expect(result.slideCount).toBe(0);
      expect(result.filename).toBe('empty_presentation.json');
    });
  });
});
