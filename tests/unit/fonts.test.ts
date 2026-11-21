// Spec 010: font presets — stacks, fallback for unknown ids, applying to <html>, store migration.
import { describe, expect, it } from 'vitest';
import { DEFAULT_FONT, fontChoices, fontOption, fontStack } from '@/lib/fonts';
import { applyFonts } from '@/lib/theme';
import { migrateUi } from '@/stores/useUiStore';

describe('fontStack', () => {
  it('uses the bundled Geist stacks by default', () => {
    expect(fontStack('ui', DEFAULT_FONT.ui)).toBe("'Geist', system-ui, sans-serif");
    expect(fontStack('code', DEFAULT_FONT.code)).toBe("'Geist Mono', ui-monospace, monospace");
  });
  it('puts the chosen font first and keeps the default as fallback', () => {
    expect(fontStack('code', 'menlo')).toBe("'Menlo', 'Geist Mono', ui-monospace, monospace");
    expect(fontStack('ui', 'system')).toBe("-apple-system, system-ui, 'Geist', system-ui, sans-serif");
  });
  it('falls back to the default for unknown or missing ids', () => {
    expect(fontOption('code', 'xxx').id).toBe('geist-mono');
    expect(fontStack('ui', undefined)).toBe(fontStack('ui', 'geist'));
    expect(fontOption('ui', 'menlo').id).toBe('geist'); // code font id is not a UI font
  });
});

describe('installed families', () => {
  it('turns family ids into options and strips characters that could break the CSS value', () => {
    expect(fontOption('ui', 'family:Georgia')).toMatchObject({ label: 'Georgia', family: 'Georgia' });
    expect(fontStack('ui', "family:Evil'; }")).toBe("'Evil', 'Geist', system-ui, sans-serif");
    expect(fontOption('ui', 'family:').id).toBe('geist');
  });
  it('pins the defaults, lists every family for the UI and keeps the current choice', () => {
    const ui = fontChoices('ui', ['Arial', 'Geist', 'Georgia'], 'family:Gone');
    expect(ui.map((f) => f.label)).toEqual(['Geist', 'System (SF Pro)', 'Gone', 'Arial', 'Georgia']);
  });
  it('falls back to presets when the system list is empty', () => {
    expect(fontChoices('code', [], 'geist-mono')[0].id).toBe('geist-mono');
  });
});

describe('applyFonts', () => {
  it('overrides the font tokens on the root element', () => {
    const el = document.createElement('div');
    applyFonts('inter', 'sf-mono', el);
    expect(el.style.getPropertyValue('--font-sans')).toContain("'Inter'");
    expect(el.style.getPropertyValue('--font-mono')).toContain("'SF Mono'");
  });
});

describe('migrateUi v2 → v3', () => {
  it('adds default fonts and keeps existing choices', () => {
    expect(migrateUi({ theme: 'dark', zoom: 1 }, 2)).toMatchObject({ theme: 'dark', uiFont: 'geist', codeFont: 'geist-mono' });
    expect(migrateUi({ uiFont: 'inter', codeFont: 'menlo' }, 2)).toMatchObject({ uiFont: 'inter', codeFont: 'menlo' });
  });
});
