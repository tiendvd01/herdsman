// Spec 004: width clamping, layout math for narrow windows, and the v0 → v1 store migration.
import { describe, expect, it } from 'vitest';
import { clampWidth, COMPOSER, effectiveComposerHeight, layoutWidths, LEFT, MAIN_MIN, RIGHT } from '@/lib/layout';
import { migrateUi } from '@/stores/useUiStore';

describe('clampWidth', () => {
  it('falls back to the default for anything that is not a finite number', () => {
    expect(clampWidth(undefined, LEFT)).toBe(LEFT.def);
    expect(clampWidth(Number.NaN, LEFT)).toBe(LEFT.def);
    expect(clampWidth('300', LEFT)).toBe(LEFT.def);
  });
  it('rounds and clamps into range', () => {
    expect(clampWidth(10, LEFT)).toBe(LEFT.min);
    expect(clampWidth(9999, RIGHT)).toBe(RIGHT.max);
    expect(clampWidth(300.6, LEFT)).toBe(301);
  });
});

describe('layoutWidths', () => {
  it('keeps saved widths when the window is wide enough', () => {
    const w = layoutWidths({ left: 300, right: 500, leftOpen: true, rightOpen: true, viewport: 1600 });
    expect(w).toMatchObject({ left: 300, right: 500 });
    expect(w.leftMax).toBe(LEFT.max);
    expect(w.rightMax).toBe(RIGHT.max);
  });

  it('shrinks the right panel first, then the left sidebar, keeping MAIN_MIN for the main column', () => {
    const w = layoutWidths({ left: LEFT.max, right: RIGHT.max, leftOpen: true, rightOpen: true, viewport: 960 });
    expect(w.right).toBe(RIGHT.min);
    expect(w.left).toBe(960 - MAIN_MIN - RIGHT.min);
    expect(960 - w.left - w.right).toBeGreaterThanOrEqual(MAIN_MIN);
  });

  it('only shrinks the right panel when that is enough', () => {
    const w = layoutWidths({ left: 256, right: 720, leftOpen: true, rightOpen: true, viewport: 1200 });
    expect(w).toMatchObject({ left: 256, right: 1200 - MAIN_MIN - 256 });
  });

  it('counts closed sidebars as 0px and gives the open one more room', () => {
    const w = layoutWidths({ left: 300, right: 700, leftOpen: false, rightOpen: true, viewport: 1000 });
    expect(w.left).toBe(0);
    expect(w.right).toBe(600);
    expect(w.rightMax).toBe(600);
  });

  it('never reports a max below the minimum', () => {
    const w = layoutWidths({ left: 480, right: 720, leftOpen: true, rightOpen: true, viewport: 700 });
    expect(w.leftMax).toBeGreaterThanOrEqual(LEFT.min);
    expect(w.rightMax).toBeGreaterThanOrEqual(RIGHT.min);
  });

  it('hides the right panel, then the left sidebar, when even the minimums do not fit (spec 006, high zoom)', () => {
    const a = layoutWidths({ left: 300, right: 400, leftOpen: true, rightOpen: true, viewport: 640 });
    expect(a).toMatchObject({ left: 640 - MAIN_MIN, right: 0 });
    const b = layoutWidths({ left: 300, right: 400, leftOpen: true, rightOpen: true, viewport: 500 });
    expect(b).toMatchObject({ left: 0, right: 0 });
    const c = layoutWidths({ left: 300, right: 400, leftOpen: false, rightOpen: true, viewport: 700 });
    expect(c).toMatchObject({ left: 0, right: 700 - MAIN_MIN });
  });
});

describe('migrateUi v0 → v1', () => {
  it('turns rightWide into a pixel width', () => {
    expect(migrateUi({ rightWide: true, theme: 'dark' }, 0)).toMatchObject({ rightWidth: RIGHT.wide, sidebarWidth: LEFT.def, theme: 'dark' });
    expect(migrateUi({ rightWide: false }, 0)).toMatchObject({ rightWidth: RIGHT.def, sidebarWidth: LEFT.def });
  });
  it('leaves v1 widths alone', () => {
    const m = migrateUi({ rightWidth: 400, sidebarWidth: 300 }, 1);
    expect(m).toMatchObject({ rightWidth: 400, sidebarWidth: 300 });
    expect(m).not.toHaveProperty('rightWide');
  });
});

describe('effectiveComposerHeight (spec 013)', () => {
  it('defaults to 300px for a missing or invalid saved height', () => {
    expect(effectiveComposerHeight(undefined, 1000)).toBe(COMPOSER.def);
    expect(effectiveComposerHeight('x', 1000)).toBe(300);
    expect(effectiveComposerHeight(Number.NaN, 1000)).toBe(300);
  });
  it('clamps into [120, 80% of the window]', () => {
    expect(effectiveComposerHeight(50, 1000)).toBe(120);
    expect(effectiveComposerHeight(450, 1000)).toBe(450);
    expect(effectiveComposerHeight(900, 1000)).toBe(800);
    expect(effectiveComposerHeight(5000, 3000)).toBe(COMPOSER.max);
  });
  it('never goes below the minimum in a very short window', () => {
    expect(effectiveComposerHeight(300, 100)).toBe(COMPOSER.min);
  });
});
