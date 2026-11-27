import { ModuleHeader } from './ModuleHeader';
import { isTauri, invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { useFileClose } from '@/components/files/FileCloseDialog';
import { isDirty, useFileStore } from '@/stores/useFileStore';
import { toast } from '@/components/ui/toast';
import { errMsg } from '@/lib/api';
import { Sidebar } from './Sidebar';
import { WorkspaceView } from './WorkspaceView';
import { useEffect, useState } from 'react';
import { RightPanel } from '@/components/panels/RightPanel';
import lightIconUrl from '@/assets/herdsman_lightmode.png';
import darkIconUrl from '@/assets/herdsman_darkmode.png';
import { IS_MAC, TRAFFIC_LIGHTS_PAD } from '@/lib/platform';
import { useThemeColors } from '@/lib/theme';
import { cn } from '@/lib/utils';
import { useZoomEffect } from '@/lib/zoomShortcuts';
import { ZoomIndicator } from './ZoomIndicator';
import { allProjects, PullRequestsView, usePullRequests } from './PullRequests';
import { readProjectOrder } from '@/lib/useNavigationOrder';
import { ProjectPickerSidebar } from './ProjectPickerSidebar';
import { StatusBar } from './StatusBar';
import { NavigationRail } from './NavigationRail';
import { SettingsView } from '@/components/settings/SettingsView';
import { ProjectMcpSection } from '@/components/settings/ProjectMcpSection';
import { ProjectSkillsSection } from '@/components/settings/ProjectSkillsSection';
import { useUiStore } from '@/stores/useUiStore';

export function AppShell() {
  useZoomEffect();
  const fileClose = useFileClose();
  const { appearance } = useThemeColors();
  const pullRequests = usePullRequests();
  const screen = useUiStore((s) => s.screen);
  const projectsVisible = screen === 'projects';
  const pullRequestsVisible = screen === 'pull-requests';
  const skillsVisible = screen === 'skills';
  const mcpVisible = screen === 'mcp';
  /** Skills and MCP share one project picker selection. */
  const projectSettingsVisible = skillsVisible || mcpVisible;
  const workspaceProjectId = useUiStore((s) => s.projectId);
  const workspaceId = useUiStore((s) => s.workspaceId);
  const [skillsSelection, setSkillsSelection] = useState<string>();
  const projectQuery = pullRequests.projectQuery;
  const projectsById = new Map(projectQuery.data?.map((project) => [project.id, project]));
  const orderedProjects = readProjectOrder([...projectsById.keys()]).map((id) => projectsById.get(id)!);
  const skillsProjectId = projectsById.get(skillsSelection ?? workspaceProjectId ?? '')?.id ?? orderedProjects[0]?.id;

  const terminalProjectId = workspaceId ? workspaceProjectId
    : pullRequestsVisible ? projectsById.get(pullRequests.projectId ?? '')?.id
    : projectSettingsVisible ? skillsProjectId
    : workspaceProjectId;

  useEffect(() => {
    if (projectSettingsVisible && projectQuery.isSuccess) setSkillsSelection(skillsProjectId);
  }, [projectSettingsVisible, projectQuery.isSuccess, skillsProjectId]);

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
    <div className="flex h-full min-h-0 flex-col bg-background text-foreground">
      <div className="relative flex min-h-0 flex-1">
        <div className={cn('pointer-events-none absolute left-0 top-0 z-10 flex h-11 items-center', IS_MAC ? TRAFFIC_LIGHTS_PAD : 'pl-2')}>
          <img src={appearance === 'dark' ? darkIconUrl : lightIconUrl} alt="Herdsman" className="size-6 rounded-sm" />
        </div>
        {fileClose.dialog}
        <NavigationRail unread={pullRequests.unread} />
        <div hidden={!projectsVisible} className={!projectsVisible ? undefined : 'contents'}><Sidebar pullRequestsByProject={pullRequests.worktreePullsByProject} /></div>
        {(pullRequestsVisible || projectSettingsVisible) && (
          <ProjectPickerSidebar
            projects={orderedProjects}
            selectedId={pullRequestsVisible ? pullRequests.projectId : skillsProjectId}
            allProjectsId={pullRequestsVisible ? allProjects : undefined}
            pending={projectQuery.isPending}
            onRetry={projectQuery.isError ? () => void projectQuery.refetch() : undefined}
            onSelect={pullRequestsVisible ? pullRequests.selectProject : setSkillsSelection}
          />
        )}
        <main tabIndex={-1} className="flex min-h-0 min-w-0 flex-1 flex-col outline-none">
          <div data-tauri-drag-region className="h-11 shrink-0 border-b border-border bg-surface" />
          <div hidden={!projectsVisible} className={!projectsVisible ? undefined : 'flex min-h-0 flex-1 flex-col'}>
            <WorkspaceView visible={projectsVisible} />
          </div>
          {screen === 'pull-requests' && <PullRequestsView tracker={pullRequests} />}
          {screen === 'settings' && <SettingsView />}
          {skillsVisible && (
            <section aria-labelledby="skills-title" className="flex min-h-0 flex-1 flex-col">
              <ModuleHeader id="skills-title" title="Skills" />
              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
                {skillsProjectId ? (
                  <ProjectSkillsSection key={skillsProjectId} projectId={skillsProjectId} />
                ) : !projectQuery.isPending && !projectQuery.isError && (
                  <p className="text-sm text-muted-foreground">Add a project in Projects to manage its skills.</p>
                )}
              </div>
            </section>
          )}
          {mcpVisible && (
            <section aria-labelledby="mcp-title" className="flex min-h-0 flex-1 flex-col">
              <ModuleHeader id="mcp-title" title="MCP" />
              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
                {skillsProjectId ? (
                  <ProjectMcpSection key={skillsProjectId} projectId={skillsProjectId} />
                ) : !projectQuery.isPending && !projectQuery.isError && (
                  <p className="text-sm text-muted-foreground">Add a project in Projects to manage its MCP servers.</p>
                )}
              </div>
            </section>
          )}
        </main>
        <div hidden={!projectsVisible} className={!projectsVisible ? undefined : 'contents'}><RightPanel /></div>
        <ZoomIndicator />
      </div>
      <StatusBar workspaceId={workspaceId} projectId={terminalProjectId ?? null} />
    </div>
  );
}
