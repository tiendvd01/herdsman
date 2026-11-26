import { GitHubSettingsSection } from './GitHubSettingsSection';
import { KeyboardShortcutsSection } from './KeyboardShortcutsSection';
import { effectiveShortcut, shortcutLabel, useShortcutBindings } from '@/lib/keyboardShortcuts';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { TruncatedText } from '@/components/ui/truncated-text';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Bell, Check, ChevronDown, GitPullRequest, Keyboard, Minus, Monitor, Moon, Paintbrush, Plus, Search, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { toast } from '@/components/ui/toast';
import { DEFAULT_FONT, fontChoices, fontOption, fontStack, sameFont, type FontKind, type FontOption } from '@/lib/fonts';
import { useFontFamilies } from '@/lib/queries';
import { CODE_FONT_SIZE } from '@/lib/uiZoom';
import { useUiStore, type Theme } from '@/stores/useUiStore';
import { useThemeCatalog } from '@/lib/theme';
import { useThemeFiles } from '@/theme/files';
import { useAppInfo } from '@/lib/queries';
import { pickTheme } from '@/theme/catalog';
import { Tooltip } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const SECTIONS = [
  { id: 'appearance', label: 'Appearance', Icon: Paintbrush, Content: AppearanceSection },
  { id: 'keyboard-shortcuts', label: 'Keyboard Shortcuts', Icon: Keyboard, Content: KeyboardShortcutsSection },
  { id: 'notifications', label: 'Notifications', Icon: Bell, Content: NotificationsSection },
  { id: 'github', label: 'GitHub', Icon: GitPullRequest, Content: GitHubSettingsSection },
] as const;
type SectionId = (typeof SECTIONS)[number]['id'];

export function SettingsView() {
  const [section, setSection] = useState<SectionId>('appearance');
  const { label, Content } = SECTIONS.find((item) => item.id === section) ?? SECTIONS[0];
  return (
    <section aria-labelledby="settings-title" className="flex min-h-0 flex-1 flex-col">
      <header className="flex h-14 shrink-0 items-center border-b border-border px-4">
        <h1 id="settings-title" className="text-sm font-semibold">Settings</h1>
      </header>
      <div className="flex min-h-0 flex-1">
        <nav aria-label="Settings sections" className="flex w-[180px] shrink-0 flex-col gap-0.5 border-r border-border bg-surface p-2">
          {SECTIONS.map(({ id, label, Icon }) => (
            <Button key={id} variant={section === id ? 'secondary' : 'muted'} size="sm"
              aria-current={section === id ? 'page' : undefined} onClick={() => setSection(id)}
              className="justify-start px-2">
              <Icon aria-hidden="true" />
              {label}
            </Button>
          ))}
        </nav>
        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto px-6 py-4">
          <h2 className="text-sm font-semibold">{label}</h2>
          <Content />
        </div>
      </div>
    </section>
  );
}

function Row({ label, hint, children }: { label: string; hint?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-6 border-b border-border py-4 last:border-b-0">
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-[13px] font-medium">{label}</span>
        {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-2">{children}</div>
    </div>
  );
}

function NotificationsSection() {
  const enabled = useUiStore((s) => s.completionNotifications);
  const sound = useUiStore((s) => s.completionSound);
  const setEnabled = useUiStore((s) => s.setCompletionNotifications);
  const setSound = useUiStore((s) => s.setCompletionSound);
  const completionLabel = 'Agent completion notifications';
  const soundLabel = 'Play completion sound';

  function setOption(setValue: (value: boolean) => void, value: boolean) {
    setValue(value);
    if (value) {
      void api.notificationsRequestPermission().catch(() => toast('Could not request notification permission.', 'error'));
    }
  }

  return (
    <>
      <Row label={completionLabel} hint="Send a notification when an agent finishes a turn.">
        <Switch aria-label={completionLabel} checked={enabled} onCheckedChange={(value) => setOption(setEnabled, value)} />
      </Row>
      <Row label={soundLabel} hint="Play a short chime with completion notifications.">
        <Switch aria-label={soundLabel} checked={sound} onCheckedChange={(value) => setOption(setSound, value)} disabled={!enabled} />
      </Row>
    </>
  );
}

function AppearanceSection() {
  const themeKey = effectiveShortcut('theme', useShortcutBindings());
  return (
    <>
      <Row label="Theme" hint={`System follows your macOS appearance. Shortcut ${shortcutLabel(themeKey)}.`}>
        <ThemePicker />
      </Row>
      <div className="@container flex flex-col gap-4 border-b border-border py-4">
        <ThemePreviewGroup dark />
        <ThemePreviewGroup dark={false} />
      </div>
      <CustomThemes />
      <Row label="Interface font" hint="Menus, sidebar and conversation text.">
        <FontPicker kind="ui" />
      </Row>
      <Row label="Code font" hint="Code blocks, diffs, paths, commands, logs and workspace terminals.">
        <FontPicker kind="code" />
      </Row>
      <Row label="Code font size" hint="Code snippets, file editor, diffs, logs and workspace terminals.">
        <CodeFontSizePicker />
      </Row>
    </>
  );
}

function CodeFontSizePicker() {
  const size = useUiStore((s) => s.codeFontSize);
  const contentStep = useUiStore((s) => s.contentStep);
  const setSize = useUiStore((s) => s.setCodeFontSize);
  const displayedSize = size ?? CODE_FONT_SIZE.base + contentStep;
  return (
    <div className="flex items-center gap-1.5">
      {size !== null && (
        <Button variant="ghost" size="sm" onClick={() => setSize(null)} aria-label="Reset code font size">
          Reset
        </Button>
      )}
      <div
        role="group"
        aria-label="Code font size"
        className="grid w-32 shrink-0 grid-cols-[auto_1fr_auto] items-center rounded-lg border border-input bg-muted p-0.5"
      >
        <Button variant="muted" size="icon" aria-label="Decrease code font size" disabled={displayedSize <= CODE_FONT_SIZE.min} onClick={() => setSize(displayedSize - 1)}>
          <Minus />
        </Button>
        <output aria-label="Current code font size" className="text-center text-base font-medium text-foreground tabular-nums">
          {displayedSize}
        </output>
        <Button variant="muted" size="icon" aria-label="Increase code font size" disabled={displayedSize >= CODE_FONT_SIZE.max} onClick={() => setSize(displayedSize + 1)}>
          <Plus />
        </Button>
      </div>
    </div>
  );
}

const THEMES: { value: Theme; label: string; Icon: typeof Sun }[] = [
  { value: 'system', label: 'System', Icon: Monitor },
  { value: 'light', label: 'Light', Icon: Sun },
  { value: 'dark', label: 'Dark', Icon: Moon },
];

const PREVIEW_COLORS = ['working', 'error', 'done', 'blocked', 'primary'] as const;

function ThemePreviewGroup({ dark }: { dark: boolean }) {
  const catalog = useThemeCatalog();
  const stored = useUiStore((s) => (dark ? s.darkTheme : s.lightTheme));
  const setTheme = useUiStore((s) => (dark ? s.setDarkTheme : s.setLightTheme));
  const options = catalog.themes.filter((t) => t.appearance === (dark ? 'dark' : 'light'));
  const value = pickTheme(catalog, stored, dark).id; // a missing or wrong-brightness choice shows the default
  const label = dark ? 'Dark' : 'Light';
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-[13px] font-medium">{label}</h3>
      <RadioGroup
        aria-label={`${label} themes`}
        value={value}
        onValueChange={setTheme}
        className="grid grid-cols-1 gap-3 @[18rem]:grid-cols-2 @[27rem]:grid-cols-3 @[36rem]:grid-cols-4"
      >
        {options.map(({ id, name, colors }) => (
          <Tooltip key={id} content={name} contentClassName="max-w-[min(28rem,90vw)] [overflow-wrap:anywhere]">
            <RadioGroupItem
              value={id}
              aria-label={name}
              className="group flex min-w-0 cursor-pointer flex-col gap-2 rounded-xl border-2 p-2 text-left hover:bg-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background aria-checked:border-primary"
            >
              <span
                aria-hidden="true"
                className="flex h-14 w-full flex-col gap-2 overflow-hidden rounded-lg border border-border p-2"
                style={{ backgroundColor: colors.background }}
              >
                <span className="h-1 w-1/2 rounded-full" style={{ backgroundColor: colors.foreground }} />
                <span className="grid w-full max-w-20 grid-cols-5 gap-1">
                  {PREVIEW_COLORS.map((role) => (
                    <span key={role} className="aspect-square w-full max-w-2.5 rounded-full" style={{ backgroundColor: colors[role] }} />
                  ))}
                </span>
              </span>
              <span className="flex w-full items-center gap-1.5">
                <span className="truncate text-[13px]">{name}</span>
                <Check aria-hidden="true" className="invisible size-3.5 shrink-0 text-primary group-aria-checked:visible" />
              </span>
            </RadioGroupItem>
          </Tooltip>
        ))}
      </RadioGroup>
    </div>
  );
}

/** Where custom theme files go, plus what was wrong with the ones that were skipped (spec 016 FR-006, FR-008, FR-012). */
function CustomThemes() {
  const catalog = useThemeCatalog();
  const load = useThemeFiles((s) => s.load);
  useEffect(() => void load(), [load]); // the section mounts each time Settings opens
  const dir = useAppInfo().data?.data_dir;
  return (
    <Row label="Custom themes" hint={<>Drop a <code className="font-mono">.json</code> file with <code className="font-mono">background</code> and <code className="font-mono">foreground</code> in <code className="font-mono">{dir ? `${dir}/themes` : 'the themes folder'}</code>. Reopen Settings to reload.</>}>
      {catalog.errors.length === 0 && catalog.warnings.length === 0 ? (
        <span className="text-xs text-muted-foreground">No problems found</span>
      ) : (
        <ul className="flex max-w-[360px] flex-col gap-1 text-xs" aria-label="Theme problems">
          {catalog.errors.map((e, i) => (
            <li key={`e${i}`} className="text-st-error">
              {e.file}
              {e.field ? ` · ${e.field}` : ''} · {e.message} (skipped)
            </li>
          ))}
          {catalog.warnings.map((w, i) => (
            <li key={`w${i}`} className="text-warn-fg">
              {w.file}
              {w.field ? ` · ${w.field}` : ''} · {w.message}
            </li>
          ))}
        </ul>
      )}
    </Row>
  );
}

export function ThemePicker() {
  const theme = useUiStore((s) => s.theme);
  const setTheme = useUiStore((s) => s.setTheme);
  return (
    <RadioGroup orientation="horizontal" value={theme} onValueChange={(value) => setTheme(value as typeof theme)} aria-label="Theme" className="inline-flex rounded-md border border-border p-0.5">
      {THEMES.map(({ value, label, Icon }) => {
        const on = theme === value;
        return (
          <RadioGroupItem
            key={value}
            value={value}
            className={cn(
              'flex h-7 items-center gap-1.5 rounded-[4px] px-3 text-[13px] [&_svg]:size-3.5',
              on ? 'bg-accent font-medium text-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon />
            {label}
          </RadioGroupItem>
        );
      })}
    </RadioGroup>
  );
}

export function FontPicker({ kind }: { kind: FontKind }) {
  const id = useUiStore((s) => (kind === 'ui' ? s.uiFont : s.codeFont));
  const set = useUiStore((s) => (kind === 'ui' ? s.setUiFont : s.setCodeFont));
  const { data: families } = useFontFamilies();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  const current = fontOption(kind, id);
  const label = kind === 'ui' ? 'Interface font' : 'Code font';
  const choices = useMemo(() => (open ? fontChoices(kind, families, id) : []), [open, kind, families, id]);
  const needle = query.trim().toLowerCase();
  const shown = needle ? choices.filter((f) => f.label.toLowerCase().includes(needle)) : choices;

  const pick = (f: FontOption) => {
    set(f.id);
    setOpen(false);
  };
  const focusOption = (from: number, step: number) => {
    const items = listRef.current?.querySelectorAll<HTMLButtonElement>('[role="option"]');
    if (!items?.length) return;
    items[Math.max(0, Math.min(items.length - 1, from + step))]?.focus();
  };

  return (
    <div className="flex items-center gap-1.5">
      {current.id !== DEFAULT_FONT[kind] ? (
        <Button variant="ghost" size="sm" onClick={() => set(DEFAULT_FONT[kind])} aria-label={`Reset ${label.toLowerCase()}`}>
          Reset
        </Button>
      ) : null}
      <Popover
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) setQuery('');
        }}
      >
        <PopoverTrigger
          aria-label={label}
          className="inline-flex h-8 w-[220px] items-center justify-between gap-2 rounded-md border border-input bg-background px-3 text-[13px] shadow-xs hover:bg-accent dark:shadow-none"
        >
          <TruncatedText className="truncate" style={{ fontFamily: fontStack(kind, current.id) }}>
            {current.label}
          </TruncatedText>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        </PopoverTrigger>
        <PopoverContent align="end" sideOffset={4} className="flex w-[280px] flex-col gap-1">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search fonts"
              aria-label={`Search ${label.toLowerCase()}`}
              className="h-8 pl-8"
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  focusOption(-1, 1);
                } else if (e.key === 'Enter' && shown[0]) {
                  e.preventDefault();
                  pick(shown[0]);
                }
              }}
            />
          </div>
          <div ref={listRef} role="listbox" aria-label={label} className="max-h-72 overflow-y-auto">
            {shown.length === 0 ? <p className="m-0 px-2 py-3 text-center text-xs text-muted-foreground">No fonts found</p> : null}
            {shown.map((f, i) => {
              const selected = sameFont(f, current);
              return (
                <button
                  key={f.id}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => pick(f)}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                      e.preventDefault();
                      focusOption(i, e.key === 'ArrowDown' ? 1 : -1);
                    }
                  }}
                  className="flex min-h-8 w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] outline-none hover:bg-accent focus-visible:bg-accent"
                >
                  <TruncatedText className="min-w-0 flex-1 truncate" style={{ fontFamily: fontStack(kind, f.id) }}>
                    {f.label}
                  </TruncatedText>
                  {f.id === DEFAULT_FONT[kind] ? <span className="text-xs text-muted-foreground">Default</span> : null}
                  {selected ? <Check className="size-4 shrink-0" /> : <span className="size-4 shrink-0" />}
                </button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
