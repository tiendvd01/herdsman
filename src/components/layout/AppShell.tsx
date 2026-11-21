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
  return (
    <div className="flex h-full bg-background text-foreground">
      <Sidebar />
      <main tabIndex={-1} className="flex min-h-0 min-w-0 flex-1 flex-col outline-none">
        <WorkspaceView />
      </main>
      <RightPanel />
      <ZoomIndicator />
    </div>
  );
}
