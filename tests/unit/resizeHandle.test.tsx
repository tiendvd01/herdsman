// Spec 004: the sidebar resize handle — aria, pointer drag, double-click reset and keyboard.
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { ResizeHandle, type ResizeHandleProps } from '@/components/layout/ResizeHandle';

beforeAll(() => {
  // Run animation frames synchronously so each move is applied at once.
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    cb(0);
    return 1;
  });
  vi.stubGlobal('cancelAnimationFrame', () => {});
  Element.prototype.setPointerCapture ??= () => {};
});

afterEach(() => {
  cleanup();
  document.body.classList.remove('resizing');
});

function setup(over: Partial<ResizeHandleProps> = {}) {
  const props: ResizeHandleProps = { side: 'left', label: 'Resize sidebar', value: 256, min: 200, max: 480, onChange: vi.fn(), onReset: vi.fn(), ...over };
  render(<ResizeHandle {...props} />);
  return { props, el: screen.getByRole('separator', { name: props.label }) };
}

const drag = (el: HTMLElement, from: number, to: number) => {
  fireEvent.pointerDown(el, { button: 0, clientX: from, pointerId: 1 });
  fireEvent.pointerMove(el, { clientX: to, pointerId: 1 });
};

describe('ResizeHandle', () => {
  it('exposes a focusable vertical separator with its current value', () => {
    const { el } = setup();
    expect(el.getAttribute('aria-orientation')).toBe('vertical');
    expect(el.getAttribute('aria-valuenow')).toBe('256');
    expect(el.getAttribute('aria-valuemin')).toBe('200');
    expect(el.getAttribute('aria-valuemax')).toBe('480');
    expect(el.tabIndex).toBe(0);
    expect(el.hasAttribute('data-tauri-drag-region')).toBe(false);
  });

  it('left sidebar: dragging right widens, clamped to max', () => {
    const { el, props } = setup();
    drag(el, 256, 356);
    expect(props.onChange).toHaveBeenLastCalledWith(356);
    fireEvent.pointerMove(el, { clientX: 900, pointerId: 1 });
    expect(props.onChange).toHaveBeenLastCalledWith(480);
  });

  it('right panel: dragging left widens, clamped to min', () => {
    const { el, props } = setup({ side: 'right', value: 340, min: 280, max: 720 });
    drag(el, 1000, 900);
    expect(props.onChange).toHaveBeenLastCalledWith(440);
    fireEvent.pointerMove(el, { clientX: 1500, pointerId: 1 });
    expect(props.onChange).toHaveBeenLastCalledWith(280);
  });

  it('blocks page selection only while dragging', () => {
    const { el, props } = setup();
    drag(el, 256, 300);
    expect(document.body.classList.contains('resizing')).toBe(true);
    fireEvent.pointerUp(el, { pointerId: 1 });
    expect(document.body.classList.contains('resizing')).toBe(false);
    fireEvent.pointerMove(el, { clientX: 400, pointerId: 1 });
    expect(props.onChange).toHaveBeenCalledTimes(1);
  });

  it('ends the drag when pointer capture is lost (released outside the window)', () => {
    const { el } = setup();
    drag(el, 256, 300);
    fireEvent(el, new Event('lostpointercapture', { bubbles: true }));
    expect(document.body.classList.contains('resizing')).toBe(false);
  });

  it('double-click resets to default', () => {
    const { el, props } = setup();
    fireEvent.doubleClick(el);
    expect(props.onReset).toHaveBeenCalledTimes(1);
  });

  it('keyboard: arrows step 16px, Home/End jump to min/max, Enter resets', () => {
    const { el, props } = setup();
    fireEvent.keyDown(el, { key: 'ArrowRight' });
    expect(props.onChange).toHaveBeenLastCalledWith(272);
    fireEvent.keyDown(el, { key: 'ArrowLeft' });
    expect(props.onChange).toHaveBeenLastCalledWith(240);
    fireEvent.keyDown(el, { key: 'Home' });
    expect(props.onChange).toHaveBeenLastCalledWith(200);
    fireEvent.keyDown(el, { key: 'End' });
    expect(props.onChange).toHaveBeenLastCalledWith(480);
    fireEvent.keyDown(el, { key: 'Enter' });
    expect(props.onReset).toHaveBeenCalledTimes(1);
  });

  it('keyboard on the right panel: ArrowLeft widens', () => {
    const { el, props } = setup({ side: 'right', value: 340, min: 280, max: 720 });
    fireEvent.keyDown(el, { key: 'ArrowLeft' });
    expect(props.onChange).toHaveBeenLastCalledWith(356);
  });

  describe('horizontal (spec 013)', () => {
    const dragY = (el: HTMLElement, from: number, to: number) => {
      fireEvent.pointerDown(el, { button: 0, clientY: from, pointerId: 1 });
      fireEvent.pointerMove(el, { clientY: to, pointerId: 1 });
    };
    const hsetup = () => setup({ orientation: 'horizontal', label: 'Resize editor', value: 300, min: 120, max: 800 });

    it('is a horizontal separator', () => {
      const { el } = hsetup();
      expect(el.getAttribute('aria-orientation')).toBe('horizontal');
      expect(el.getAttribute('aria-valuenow')).toBe('300');
    });
    it('dragging up grows, down shrinks, clamped to min/max', () => {
      const { el, props } = hsetup();
      dragY(el, 500, 400);
      expect(props.onChange).toHaveBeenLastCalledWith(400);
      fireEvent.pointerMove(el, { clientY: 600, pointerId: 1 });
      expect(props.onChange).toHaveBeenLastCalledWith(200);
      fireEvent.pointerMove(el, { clientY: 5000, pointerId: 1 });
      expect(props.onChange).toHaveBeenLastCalledWith(120);
      fireEvent.pointerMove(el, { clientY: -5000, pointerId: 1 });
      expect(props.onChange).toHaveBeenLastCalledWith(800);
    });
    it('keyboard: ArrowUp +16, ArrowDown -16, Home/End, Enter resets; horizontal arrows ignored', () => {
      const { el, props } = hsetup();
      fireEvent.keyDown(el, { key: 'ArrowUp' });
      expect(props.onChange).toHaveBeenLastCalledWith(316);
      fireEvent.keyDown(el, { key: 'ArrowDown' });
      expect(props.onChange).toHaveBeenLastCalledWith(284);
      fireEvent.keyDown(el, { key: 'Home' });
      expect(props.onChange).toHaveBeenLastCalledWith(120);
      fireEvent.keyDown(el, { key: 'End' });
      expect(props.onChange).toHaveBeenLastCalledWith(800);
      const n = vi.mocked(props.onChange).mock.calls.length;
      fireEvent.keyDown(el, { key: 'ArrowRight' });
      expect(props.onChange).toHaveBeenCalledTimes(n);
      fireEvent.keyDown(el, { key: 'Enter' });
      expect(props.onReset).toHaveBeenCalledTimes(1);
    });
    it('double-click resets', () => {
      const { el, props } = hsetup();
      fireEvent.doubleClick(el);
      expect(props.onReset).toHaveBeenCalledTimes(1);
    });
  });
});
