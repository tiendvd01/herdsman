// UI selection (open project/workspace/session, panels, theme); remembers the latest choice.
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SessionStatus } from '@/lib/types';
import { clampWidth, COMPOSER, LEFT, RIGHT } from '@/lib/layout';
import { DEFAULT_FONT } from '@/lib/fonts';
import { clampContentStep, clampZoom, CONTENT_STEP, nextZoom, ZOOM_DEFAULT } from '@/lib/uiZoom';

export type Theme = 'system' | 'light' | 'dark';
/** Spec 016: theme ids picked for Light and for Dark (built-in `light`/`paper`/`dark` or a custom theme file name). */
export const isThemeId = (v: unknown): v is string => typeof v === 'string' && v.length > 0 && v.length <= 64;
export type RightTab = 'agents' | 'tasks' | 'files' | 'log';

interface UiState {
  projectId: string | null;
  workspaceId: string | null;
  sessionByWorkspace: Record<string, string>;
  tempTabs: Record<string, string[]>; // finished sessions reopened from history (temporary tabs)
  collapsed: Record<string, boolean>;
  rightTab: RightTab;
  rightOpen: boolean;
  rightWidth: number; // saved width of the right side panel (px), spec 004
  sidebarOpen: boolean;
  sidebarWidth: number; // saved width of the left sidebar (px), spec 004
  composerHeight: number; // saved height of the expanded composer editor (px), spec 013
  theme: Theme;
  lightTheme: string;
  darkTheme: string;
  zoom: number; // whole-UI zoom step, spec 006
  contentStep: number; // content text-size offset (px), spec 006
  /** Last zoom/text-size change, for the on-screen indicator (not persisted). */
  zoomFlash: { kind: 'zoom' | 'text'; at: number } | null;
  uiFont: string; // Settings → Appearance, spec 010
  codeFont: string;
  statuses: Record<string, { state: SessionStatus; kind?: string | null; workspace_id?: string }>;
  // Transient dialogs (not persisted)
  cmdOpen: boolean;
  addProjectOpen: boolean;
  newWorkspaceFor: string | null;
  settingsOpen: boolean;
  selectWorkspace: (projectId: string, workspaceId: string | null) => void;
  selectSession: (workspaceId: string, sessionId: string) => void;
  addTempTab: (workspaceId: string, sessionId: string) => void;
  removeTempTab: (workspaceId: string, sessionId: string) => void;
  toggleCollapsed: (projectId: string) => void;
  setCollapsed: (projectId: string, collapsed: boolean) => void;
  setRightTab: (t: RightTab) => void;
  setRightOpen: (o: boolean) => void;
  setRightWidth: (px: number) => void;
  setSidebarOpen: (o: boolean) => void;
  setSidebarWidth: (px: number) => void;
  setComposerHeight: (px: number) => void;
  setTheme: (t: Theme) => void;
  setLightTheme: (id: string) => void;
  setDarkTheme: (id: string) => void;
  setUiFont: (id: string) => void;
  setCodeFont: (id: string) => void;
  setSettingsOpen: (o: boolean) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  zoomReset: () => void;
  contentBigger: () => void;
  contentSmaller: () => void;
  contentReset: () => void;
  setStatus: (sid: string, s: { state: SessionStatus; kind?: string | null; workspace_id?: string }) => void;
  setCmdOpen: (o: boolean) => void;
  setAddProjectOpen: (o: boolean) => void;
  setNewWorkspaceFor: (projectId: string | null) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      projectId: null,
      workspaceId: null,
      sessionByWorkspace: {},
      tempTabs: {},
      collapsed: {},
      rightTab: 'agents',
      rightOpen: true,
      rightWidth: RIGHT.def,
      sidebarOpen: true,
      sidebarWidth: LEFT.def,
      composerHeight: COMPOSER.def,
      theme: 'system',
      lightTheme: 'light',
      darkTheme: 'dark',
      zoom: ZOOM_DEFAULT,
      contentStep: CONTENT_STEP.def,
      zoomFlash: null,
      uiFont: DEFAULT_FONT.ui,
      codeFont: DEFAULT_FONT.code,
      statuses: {},
      cmdOpen: false,
      addProjectOpen: false,
      newWorkspaceFor: null,
      settingsOpen: false,
      selectWorkspace: (projectId, workspaceId) => set({ projectId, workspaceId }),
      selectSession: (workspaceId, sessionId) =>
        set((s) => ({ workspaceId, sessionByWorkspace: { ...s.sessionByWorkspace, [workspaceId]: sessionId } })),
      addTempTab: (workspaceId, sessionId) =>
        set((s) => {
          const cur = s.tempTabs[workspaceId] ?? [];
          return cur.includes(sessionId) ? s : { tempTabs: { ...s.tempTabs, [workspaceId]: [...cur, sessionId] } };
        }),
      removeTempTab: (workspaceId, sessionId) =>
        set((s) => ({ tempTabs: { ...s.tempTabs, [workspaceId]: (s.tempTabs[workspaceId] ?? []).filter((x) => x !== sessionId) } })),
      toggleCollapsed: (projectId) => set((s) => ({ collapsed: { ...s.collapsed, [projectId]: !s.collapsed[projectId] } })),
      setCollapsed: (projectId, collapsed) => set((s) => ({ collapsed: { ...s.collapsed, [projectId]: collapsed } })),
      setRightTab: (rightTab) => set({ rightTab, rightOpen: true }),
      setRightOpen: (rightOpen) => set({ rightOpen }),
      setRightWidth: (px) => set({ rightWidth: clampWidth(px, RIGHT) }),
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      setSidebarWidth: (px) => set({ sidebarWidth: clampWidth(px, LEFT) }),
      setComposerHeight: (px) => set({ composerHeight: clampWidth(px, COMPOSER) }),
      setTheme: (theme) => set({ theme }),
      setLightTheme: (id) => set({ lightTheme: isThemeId(id) ? id : 'light' }),
      setDarkTheme: (id) => set({ darkTheme: isThemeId(id) ? id : 'dark' }),
      setUiFont: (uiFont) => set({ uiFont }),
      setCodeFont: (codeFont) => set({ codeFont }),
      setSettingsOpen: (settingsOpen) => set({ settingsOpen }),
      zoomIn: () => set((s) => ({ zoom: nextZoom(s.zoom, 1), zoomFlash: { kind: 'zoom', at: Date.now() } })),
      zoomOut: () => set((s) => ({ zoom: nextZoom(s.zoom, -1), zoomFlash: { kind: 'zoom', at: Date.now() } })),
      zoomReset: () => set({ zoom: ZOOM_DEFAULT, zoomFlash: { kind: 'zoom', at: Date.now() } }),
      contentBigger: () => set((s) => ({ contentStep: clampContentStep(s.contentStep + 1), zoomFlash: { kind: 'text', at: Date.now() } })),
      contentSmaller: () => set((s) => ({ contentStep: clampContentStep(s.contentStep - 1), zoomFlash: { kind: 'text', at: Date.now() } })),
      contentReset: () => set({ contentStep: CONTENT_STEP.def, zoomFlash: { kind: 'text', at: Date.now() } }),
      setStatus: (sid, st) => set((s) => ({ statuses: { ...s.statuses, [sid]: st } })),
      setCmdOpen: (cmdOpen) => set({ cmdOpen }),
      setAddProjectOpen: (addProjectOpen) => set({ addProjectOpen }),
      setNewWorkspaceFor: (newWorkspaceFor) => set({ newWorkspaceFor }),
    }),
    {
      name: 'herdsman-ui',
      version: 4,
      migrate: migrateUi,
      // Saved widths may be stale or corrupt: always clamp them back into range.
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<UiState>;
        return { ...current, ...p, sidebarWidth: clampWidth(p.sidebarWidth, LEFT), rightWidth: clampWidth(p.rightWidth, RIGHT), composerHeight: clampWidth(p.composerHeight, COMPOSER), zoom: clampZoom(p.zoom), contentStep: clampContentStep(p.contentStep), lightTheme: isThemeId(p.lightTheme) ? p.lightTheme : 'light', darkTheme: isThemeId(p.darkTheme) ? p.darkTheme : 'dark' };
      },
      partialize: (s) => ({
        projectId: s.projectId,
        workspaceId: s.workspaceId,
        sessionByWorkspace: s.sessionByWorkspace,
        collapsed: s.collapsed,
        rightTab: s.rightTab,
        rightOpen: s.rightOpen,
        rightWidth: s.rightWidth,
        sidebarOpen: s.sidebarOpen,
        sidebarWidth: s.sidebarWidth,
        composerHeight: s.composerHeight,
        theme: s.theme,
        lightTheme: s.lightTheme,
        darkTheme: s.darkTheme,
        zoom: s.zoom,
        contentStep: s.contentStep,
        uiFont: s.uiFont,
        codeFont: s.codeFont,
      }),
    },
  ),
);

/** v0 → v1 (spec 004): the two-step `rightWide` toggle became a pixel `rightWidth`; the left sidebar gained `sidebarWidth`. */
export function migrateUi(persisted: unknown, version: number): Partial<UiState> {
  const p = { ...((persisted ?? {}) as Record<string, unknown>) };
  if (version < 1) {
    p.rightWidth = p.rightWide === true ? RIGHT.wide : RIGHT.def;
    p.sidebarWidth = LEFT.def;
    delete p.rightWide;
  }
  if (version < 2) {
    // spec 006: whole-UI zoom and content text size
    p.zoom = ZOOM_DEFAULT;
    p.contentStep = CONTENT_STEP.def;
  }
  if (version < 3) {
    // spec 010: font choices for Settings → Appearance.
    p.uiFont ??= DEFAULT_FONT.ui;
    p.codeFont ??= DEFAULT_FONT.code;
  }
  if (version < 4) {
    // spec 016: the Light style (spec 015) became a theme id for Light and one for Dark.
    p.lightTheme = p.lightStyle === 'paper' ? 'paper' : 'light';
    p.darkTheme = 'dark';
    delete p.lightStyle;
  }
  return p as Partial<UiState>;
}
