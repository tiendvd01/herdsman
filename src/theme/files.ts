// Spec 016: custom theme files as read from <data_dir>/themes/. A tiny store (not react-query), so renderers that
// sit outside a QueryClientProvider (Mermaid, Chart) can still follow the theme.
import { create } from 'zustand';
import { api } from '@/lib/api';
import type { ThemeFile } from '@/lib/types';

interface ThemeFileState {
  files: ThemeFile[];
  /** Re-read the folder (app start, and every time Settings opens). Failures keep the previous list. */
  load: () => Promise<void>;
}

export const useThemeFiles = create<ThemeFileState>((set) => ({
  files: [],
  load: async () => {
    try {
      set({ files: (await api.themeFiles()) ?? [] });
    } catch {
      /* no themes folder access: built-in themes only */
    }
  },
}));
