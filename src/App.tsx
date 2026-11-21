import { AppShell } from '@/components/layout/AppShell';
import { CommandDialog } from '@/components/command/CommandDialog';
import { SettingsDialog } from '@/components/settings/SettingsDialog';
import { Toaster } from '@/components/ui/toast';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useBackendEvents } from '@/lib/events';
import { useAppearanceEffect } from '@/lib/theme';

export default function App() {
  useAppearanceEffect();
  useBackendEvents();
  return (
    <TooltipProvider>
      <AppShell />
      <CommandDialog />
      <SettingsDialog />
      <Toaster />
    </TooltipProvider>
  );
}
