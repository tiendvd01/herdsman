import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './styles/globals.css';

async function boot() {
  // Dev in a browser only (no Tauri): add ?mock to preview the UI with sample data.
  if (import.meta.env.DEV && !('__TAURI_INTERNALS__' in window) && location.search.includes('mock')) {
    const { installDevMock } = await import('./lib/devMock');
    installDevMock();
  }
  const { default: App } = await import('./App');
  // Spec 006: apply the saved zoom and text size before the first render, so the default size never flashes.
  const { useUiStore } = await import('./stores/useUiStore');
  const { applyZoom, applyContentStep } = await import('./lib/uiZoom');
  // Spec 016: paint the chosen theme (cached resolved colours, else built-in) before React renders, so no theme flashes.
  const { bootTheme } = await import('./lib/theme');
  bootTheme();
  const { zoom, contentStep } = useUiStore.getState();
  applyContentStep(contentStep);
  await applyZoom(zoom); // later changes: useZoomEffect in AppShell
  const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 2000, refetchOnWindowFocus: true, retry: 1 } } });
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </React.StrictMode>,
  );
}
boot();
