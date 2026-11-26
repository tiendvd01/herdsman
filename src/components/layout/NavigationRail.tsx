import { SidebarLayout } from './SidebarLayout';
import { useEffect, useRef, useState } from 'react';
import { Folders, GitPullRequest, Layers, PanelLeftClose, PanelLeftOpen, Plug, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip } from '@/components/ui/tooltip';
import { effectiveShortcut, shortcutLabel, useShortcutBindings } from '@/lib/keyboardShortcuts';
import { cn } from '@/lib/utils';
import { useUiStore, type Screen } from '@/stores/useUiStore';

export function NavigationRail({ unread }: { unread: number }) {
  const screen = useUiStore((s) => s.screen);
  const setScreen = useUiStore((s) => s.setScreen);
  const settingsKey = effectiveShortcut('settings', useShortcutBindings());
  const [expanded, setExpanded] = useState(false);
  const projectsButton = useRef<HTMLButtonElement>(null);
  const previousScreen = useRef(screen);
  useEffect(() => {
    if (previousScreen.current !== 'projects' && screen === 'projects') projectsButton.current?.focus();
    previousScreen.current = screen;
  }, [screen]);

  const label = unread ? `Pull Requests, ${unread} unread` : 'Pull Requests';
  const toggleLabel = expanded ? 'Collapse navigation' : 'Expand navigation';
  const ToggleIcon = expanded ? PanelLeftClose : PanelLeftOpen;
  const itemSize = expanded ? 'sm' : 'icon';
  const itemClass = expanded ? 'justify-start px-2' : undefined;
  const items = [
    { id: 'projects', name: 'Projects', Icon: Folders },
    { id: 'pull-requests', name: 'Pull Requests', Icon: GitPullRequest },
    { id: 'skills', name: 'Skills', Icon: Layers },
    { id: 'mcp', name: 'MCP', Icon: Plug },
    { id: 'settings', name: 'Settings', Icon: Settings },
  ] satisfies { id: Screen; name: string; Icon: typeof Folders }[];
  return (
    <SidebarLayout as="nav" aria-label="Views" className={cn('gap-1', expanded ? 'w-44' : 'w-12')}>
      {items.map(({ id, name, Icon }) => (
        <Tooltip key={id} content={id === 'pull-requests' && unread > 0 ? 'Pull Requests, unread notifications' : name} side="right">
          <Button ref={id === 'projects' ? projectsButton : undefined}
            variant={screen === id ? 'secondary' : 'muted'} size={itemSize} className={itemClass}
            aria-label={id === 'pull-requests' ? label : name} aria-current={screen === id ? 'page' : undefined}
            aria-keyshortcuts={id === 'settings' ? shortcutLabel(settingsKey, true) : undefined}
            onClick={() => setScreen(id)}>
            <span className="relative inline-flex shrink-0">
              <Icon aria-hidden="true" />
              {id === 'pull-requests' && unread > 0 && (
                <span aria-hidden="true" data-slot="unread-dot"
                  className="pointer-events-none absolute -right-1 -top-0.5 size-1.5 rounded-full bg-primary" />
              )}
            </span>
            {expanded && <span className="truncate">{name}</span>}
          </Button>
        </Tooltip>
      ))}
      <Tooltip content={toggleLabel} side="right">
        <Button variant="muted" size="icon" aria-label={toggleLabel} aria-expanded={expanded}
          className={cn('mb-2 mt-auto', expanded && 'self-end')} onClick={() => setExpanded(!expanded)}>
          <ToggleIcon aria-hidden="true" />
        </Button>
      </Tooltip>
    </SidebarLayout>
  );
}
