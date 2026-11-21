// Spec 008: session tabs mark the engine with an icon instead of its name.
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import claudeUrl from '@/assets/engines/claude.svg';
import codexUrl from '@/assets/engines/codex.svg';
import { TooltipProvider } from '@/components/ui/tooltip';
import { EngineIcon } from '@/components/ui/engine-icon';
import type { Engine } from '@/lib/types';

function renderIcon(engine: Engine) {
  return render(
    <TooltipProvider>
      <EngineIcon engine={engine} />
    </TooltipProvider>,
  ).container;
}

describe('EngineIcon', () => {
  it.each([
    ['claude', claudeUrl, 'Claude'],
    ['codex', codexUrl, 'Codex'],
  ] as const)('%s uses its own icon, labelled with the engine name', (engine, url, label) => {
    const c = renderIcon(engine);
    expect(c.querySelector('[role="img"]')!.getAttribute('aria-label')).toBe(label);
    expect(c.querySelector('img')!.getAttribute('src')).toBe(url);
    expect(c.textContent).not.toContain(label);
  });

  it('falls back to the generic agent icon for other engines', () => {
    const c = renderIcon('echo');
    expect(c.querySelector('[role="img"]')!.getAttribute('aria-label')).toBe('Echo');
    expect(c.querySelector('img')).toBeNull();
    expect(c.querySelector('svg')).not.toBeNull();
  });
});
