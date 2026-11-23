import { isTauri, invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { useFileClose } from '@/components/files/FileCloseDialog';
import { isDirty, useFileStore } from '@/stores/useFileStore';
import { toast } from '@/components/ui/toast';
import { errMsg } from '@/lib/api';
import { Sidebar } from './Sidebar';
import { WorkspaceView } from './WorkspaceView';
import { useEffect } from 'react';
import { RightPanel } from '@/components/panels/RightPanel';
import { installSidebarShortcuts } from '@/lib/sidebarShortcuts';
import { installZoomShortcuts, useZoomEffect } from '@/lib/zoomShortcuts';
import { ZoomIndicator } from './ZoomIndicator';

export function AppShell() {
  useEffect(() => installSidebarShortcuts(), []);
  useEffect(() => installZoomShortcuts(), []);
  useZoomEffect();
  const fileClose = useFileClose();
  useEffect(() => {
    if (!isTauri()) return;
    const nativeWindow = getCurrentWindow();
    function finish() {
      void invoke('exit_after_file_review').catch((error) => toast(errMsg(error), 'error'));
    }
    function review() {
      const { tabs } = useFileStore.getState();
      if (tabs.some((file) => file.saving)) {
        toast('Wait for the file to finish saving before quitting.', 'error');
        return;
      }
      const dirty = tabs.find(isDirty);
      if (dirty) fileClose.close(dirty, review);
      else finish();
    }
    const stop = [
      listen('review-files-before-quit', review),
      nativeWindow.onCloseRequested((event) => {
        event.preventDefault();
        review();
      }),
    ];
    return () => {
      for (const listener of stop) void listener.then((unlisten) => unlisten()).catch(() => {});
    };
  }, []);
  return (
    <div className="flex h-full bg-background text-foreground">
      {fileClose.dialog}
      <Sidebar />
      <main tabIndex={-1} className="flex min-h-0 min-w-0 flex-1 flex-col outline-none">
        <WorkspaceView />
      </main>
      <RightPanel />
      <ZoomIndicator />
    </div>
  );
}
