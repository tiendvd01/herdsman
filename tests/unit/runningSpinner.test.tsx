// Spec 017: spinner for working sessions (tab dot) — StatusDot spin prop.
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { StatusDot } from '@/components/ui/status-dot';
import { Spinner } from '@/components/ui/spinner';

describe('running spinner', () => {
  it('working + spin → spinner labelled Working', () => {
    const { container } = render(<StatusDot status="working" spin />);
    const el = container.querySelector('[role="img"]')!;
    expect(el.getAttribute('aria-label')).toBe('Working');
    expect(el.getAttribute('class')).toContain('animate-spin');
    expect(el.getAttribute('class')).toContain('motion-reduce:animate-none');
  });

  it('working without spin keeps the pulsing dot', () => {
    const { container } = render(<StatusDot status="working" />);
    expect(container.querySelector('.hs-pulse')).not.toBeNull();
    expect(container.querySelector('.animate-spin')).toBeNull();
  });

  it.each(['idle', 'blocked', 'done', 'error'] as const)('%s + spin stays a dot', (st) => {
    const { container } = render(<StatusDot status={st} spin />);
    expect(container.querySelector('.animate-spin')).toBeNull();
  });

  it('Spinner accepts a custom label', () => {
    const { container } = render(<Spinner label="Agent running" />);
    expect(container.querySelector('[aria-label="Agent running"]')).not.toBeNull();
  });
});
