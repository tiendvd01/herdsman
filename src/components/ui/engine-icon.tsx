// Spec 008: engine shown as an icon after the session title (icons from herdr-app).
import { Bot } from 'lucide-react';
import claudeUrl from '@/assets/engines/claude.svg';
import codexUrl from '@/assets/engines/codex.svg';
import { Tooltip } from '@/components/ui/tooltip';
import type { Engine } from '@/lib/types';
import { cn } from '@/lib/utils';

export const ENGINE_LABEL: Record<Engine, string> = { claude: 'Claude', codex: 'Codex', echo: 'Echo' };

const ENGINE_ICON: Partial<Record<Engine, string>> = { claude: claudeUrl, codex: codexUrl };

export function EngineIcon({ engine, className, tooltip = true }: { engine: Engine; className?: string; tooltip?: boolean }) {
  const label = ENGINE_LABEL[engine] ?? engine;
  const url = ENGINE_ICON[engine];
  const cls = cn('size-3.5 shrink-0', className);
  const icon = (
    <span role="img" aria-label={label} data-engine={engine} className="inline-flex shrink-0">
      {url ? <img src={url} alt="" aria-hidden="true" draggable={false} className={cls} /> : <Bot aria-hidden="true" className={cls} />}
    </span>
  );
  return tooltip ? <Tooltip content={label}>{icon}</Tooltip> : icon;
}
