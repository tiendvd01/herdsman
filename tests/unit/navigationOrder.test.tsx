// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useNavigationOrder } from '@/lib/useNavigationOrder';
import { toast } from '@/components/ui/toast';

vi.mock('@/components/ui/toast', () => ({ toast: vi.fn() }));

function List({ ids, scope = 'test', ready = true }: { ids: string[]; scope?: string; ready?: boolean }) {
  const { order, row, item } = useNavigationOrder(scope, ids, 'horizontal', ready);
  return <div>{order.map((id) => <button key={id} {...row(id)} {...item(id)}>{id}</button>)}</div>;
}

const labels = () => screen.getAllByRole('button').map((button) => button.textContent);
const move = (label: string, key: string) => {
  const button = screen.getByRole('button', { name: label });
  button.focus();
  fireEvent.keyDown(button, { altKey: true, key });
};

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

it('keeps focus and restores the last complete order on a fresh mount', () => {
  const { unmount } = render(<List ids={['session', 'terminal', 'file', 'diff']} />);
  move('file', 'ArrowLeft');
  move('file', 'ArrowLeft');
  expect(labels()).toEqual(['file', 'session', 'terminal', 'diff']);
  expect(document.activeElement?.textContent).toBe('file');
  unmount();

  const restored = render(<List ids={['session', 'diff']} ready={false} />);
  restored.rerender(<List ids={['session', 'terminal', 'file', 'diff', 'new']} />);
  expect(labels()).toEqual(['file', 'session', 'terminal', 'diff', 'new']);
});

it('appends a returning item and isolates different scopes', () => {
  const { rerender } = render(<List ids={['a', 'b', 'c']} />);
  move('b', 'ArrowLeft');
  rerender(<List ids={['a', 'c']} />);
  rerender(<List ids={['a', 'b', 'c']} />);
  expect(labels()).toEqual(['a', 'c', 'b']);

  rerender(<List key="other" scope="other" ids={['a', 'b', 'c']} />);
  expect(labels()).toEqual(['a', 'b', 'c']);
});

it('keeps the saved order when a new write fails and accepts a retry', () => {
  const { unmount } = render(<List ids={['a', 'b', 'c']} />);
  move('c', 'ArrowLeft');
  const fail = vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
    throw new Error('Storage unavailable');
  });
  move('c', 'ArrowLeft');
  expect(labels()).toEqual(['a', 'c', 'b']);
  expect(toast).toHaveBeenCalledWith('Could not save the new order. Try again.', 'error');
  fail.mockRestore();
  unmount();

  render(<List ids={['a', 'b', 'c']} />);
  expect(labels()).toEqual(['a', 'c', 'b']);
  move('c', 'ArrowLeft');
  expect(labels()).toEqual(['c', 'a', 'b']);
});

it('shows an insertion point, ignores other lists, and cancels when the target disappears', () => {
  const { rerender } = render(<>
    <List ids={['a', 'b', 'c']} />
    <List ids={['x', 'y']} scope="other" />
  </>);
  const source = screen.getByRole('button', { name: 'a' });
  const target = screen.getByRole('button', { name: 'b' });
  const other = screen.getByRole('button', { name: 'x' });
  const click = vi.fn();
  source.addEventListener('click', click);
  source.setPointerCapture = vi.fn();
  const hitTest = vi.fn<() => Element | null>();
  Object.defineProperty(document, 'elementFromPoint', { configurable: true, value: hitTest });
  const pointer = { pointerId: 1, button: 0, isPrimary: true };
  const start = () => fireEvent.pointerDown(source, { ...pointer, clientX: 10, clientY: 10 });
  const drag = (to: Element) => {
    hitTest.mockReturnValue(to);
    fireEvent.pointerMove(source, { ...pointer, clientX: 30, clientY: 10 });
  };
  const drop = () => fireEvent.pointerUp(source, { ...pointer, clientX: 30, clientY: 10 });
  try {
    expect(document.body.classList.contains('reordering-navigation')).toBe(false);
    start();
    expect(document.body.classList.contains('reordering-navigation')).toBe(false);
    fireEvent.pointerMove(source, { ...pointer, clientX: 12, clientY: 10 });
    expect(document.body.classList.contains('reordering-navigation')).toBe(false);
    drag(other);
    expect(document.body.classList.contains('reordering-navigation')).toBe(true);
    drop();
    expect(document.body.classList.contains('reordering-navigation')).toBe(false);
    expect(labels()).toEqual(['a', 'b', 'c', 'x', 'y']);

    start();
    drag(target);
    expect(target.dataset.reorderEdge).toBe('after');
    fireEvent.keyDown(source, { key: 'Escape' });
    expect(document.body.classList.contains('reordering-navigation')).toBe(false);
    drop();
    expect(labels()).toEqual(['a', 'b', 'c', 'x', 'y']);

    start();
    drag(target);
    rerender(<><List ids={['a', 'c']} /><List ids={['x', 'y']} scope="other" /></>);
    hitTest.mockReturnValue(screen.getByRole('button', { name: 'c' }));
    drop();
    expect(labels()).toEqual(['a', 'c', 'x', 'y']);

    start();
    drag(screen.getByRole('button', { name: 'c' }));
    drop();
    fireEvent.click(source, { detail: 1 });
    expect(labels()).toEqual(['c', 'a', 'x', 'y']);
    expect(click).not.toHaveBeenCalled();
  } finally {
    Reflect.deleteProperty(document, 'elementFromPoint');
  }
});
