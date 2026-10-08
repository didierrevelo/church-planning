import {
  stripChords,
  parseSongSections,
  generatePresentationSlides,
  exportToFreeShowFormat,
  exportToTextSlides,
  type ExportableSong,
} from '../domain/setlistExport';

describe('Setlist Presentation Exporter (FreeShow / Projection / TDD)', () => {
  const sampleChordPro = `
{title: Sublime Gracia}
{artist: John Newton}
{key: G}
{c: Verso 1}
[G]Sublime gracia del [C]Señor
Que a un [G]infeliz sal[D]vó
[G]Fui ciego mas hoy [C]miro yo
Per[G]dido y [D]Él me ha[G]lló

{comment: Coro}
[C]Gracia que me en[G]señó a temer
Y [Em]gracia mis temo[D]res quitó
[G]Cuán preciosa [C]fue esa gracia
En la [G]hora en que [D]cre[G]í
`;

  describe('stripChords', () => {
    it('removes all chord tags [Chord] while preserving clean lyric text', () => {
      const raw = '[G]Sublime gracia [C]del [D/F#]Señor';
      const clean = stripChords(raw);
      expect(clean).toBe('Sublime gracia del Señor');
    });

    it('strips directive comments like {title: ...} or {c: ...} when requested', () => {
      const clean = stripChords(sampleChordPro);
      expect(clean).not.toContain('{title:');
      expect(clean).not.toContain('[G]');
      expect(clean).toContain('Sublime gracia del Señor');
    });
  });

  describe('parseSongSections', () => {
    it('identifies Verso and Coro sections from ChordPro comment tags', () => {
      const sections = parseSongSections(sampleChordPro);

      expect(sections.length).toBe(2);
      expect(sections[0].type).toBe('verse');
      expect(sections[0].title).toBe('Verso 1');
      expect(sections[0].lines.length).toBe(4);
      expect(sections[0].lines[0]).toBe('Sublime gracia del Señor');

      expect(sections[1].type).toBe('chorus');
      expect(sections[1].title).toBe('Coro');
      expect(sections[1].lines.length).toBe(4);
      expect(sections[1].lines[0]).toBe('Gracia que me enseñó a temer');
    });

    it('handles unlabeled plain text by grouping by empty double newlines', () => {
      const plainText = `Primer verso sin acordes
Segunda linea del verso

Coro glorioso
Segunda linea del coro`;

      const sections = parseSongSections(plainText);
      expect(sections.length).toBe(2);
      expect(sections[0].lines.length).toBe(2);
      expect(sections[1].lines.length).toBe(2);
    });
  });

  describe('generatePresentationSlides', () => {
    it('generates slides respecting max lines per slide', () => {
      const longVerse = `
{c: Verso Largo}
Linea 1
Linea 2
Linea 3
Linea 4
Linea 5
Linea 6
`;
      // With maxLinesPerSlide: 4, a 6-line section should yield 2 slides
      const slides = generatePresentationSlides(longVerse, { maxLinesPerSlide: 4 });

      expect(slides.length).toBe(2);
      expect(slides[0].lines.length).toBe(4);
      expect(slides[0].header).toContain('(1/2)');
      expect(slides[1].lines.length).toBe(2);
      expect(slides[1].header).toContain('(2/2)');
    });
  });

  describe('exportToFreeShowFormat', () => {
    it('exports a full song into FreeShow JSON format with metadata and slides', () => {
      const song: ExportableSong = {
        title: 'Sublime Gracia',
        artist: 'John Newton',
        key: 'G',
        bpm: 72,
        chordContent: sampleChordPro,
      };

      const result = exportToFreeShowFormat(song);

      expect(result.format).toBe('freeshow-export-v1');
      expect(result.metadata.title).toBe('Sublime Gracia');
      expect(result.metadata.artist).toBe('John Newton');
      expect(result.metadata.key).toBe('G');
      expect(result.metadata.bpm).toBe(72);
      expect(result.slides.length).toBe(2);
      expect(result.slides[0].section).toBe('verse');
      expect(result.slides[0].content).toContain('Sublime gracia del Señor');
      expect(result.slides[1].section).toBe('chorus');
    });
  });

  describe('exportToTextSlides', () => {
    it('generates plain formatted text suitable for quick projection copy-paste', () => {
      const song: ExportableSong = {
        title: 'Sublime Gracia',
        chordContent: sampleChordPro,
      };

      const text = exportToTextSlides(song);

      expect(text).toContain('# Verso 1');
      expect(text).toContain('Sublime gracia del Señor');
      expect(text).toContain('---');
      expect(text).toContain('# Coro');
    });
  });
});
