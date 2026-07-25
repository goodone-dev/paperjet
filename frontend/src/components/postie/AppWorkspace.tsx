import React, { useState, useCallback, useEffect } from 'react';
import { TopBar } from '@/components/postie/TopBar';
import { Sidebar } from '@/components/postie/Sidebar';
import { RequestTabsBar } from '@/components/postie/RequestTabsBar';
import { RequestPanel } from '@/components/postie/RequestPanel';
import { ResponsePanel } from '@/components/postie/ResponsePanel';
import { EnvironmentEditor } from '@/components/postie/EnvironmentEditor';
import {
    ConfirmDialog,
    MoveDialog,
    SaveRequestDialog,
    type ConfirmDialogConfig,
    type SaveRequestDialogConfig,
} from '@/components/postie/CrudDialogs';
import { useWorkspaceData } from '@/hooks/useWorkspaceData';
import { useTabs } from '@/hooks/useTabs';
import { useRequestSend } from '@/hooks/useRequestSend';
import { useRequestSave } from '@/hooks/useRequestSave';
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';
import { cn } from '@/lib/utils';
import { GetRequest } from '@/wailsjs/go/main/App';
import { mapBackendRequestToTab } from '@/lib/request-mapper';
import type { Collection } from '@/types/collection';
import type { RequestTab, Tab } from '@/types/tab';
import type { RequestSummary } from '@/types/collection';

interface ConfirmState {
    open: boolean;
    config: ConfirmDialogConfig | null;
}

interface MoveState {
    open: boolean;
    col: Collection | null;
}

interface SaveRequestState {
    open: boolean;
    config: SaveRequestDialogConfig | null;
}

export default function AppWorkspace() {
    const data = useWorkspaceData();
    const tabsApi = useTabs(data.activeWorkspaceId);

    const [confirm, setConfirm] = useState<ConfirmState>({ open: false, config: null });
    const [move, setMove] = useState<MoveState>({ open: false, col: null });
    const [saveRequest, setSaveRequest] = useState<SaveRequestState>({ open: false, config: null });
    const [activeView, setActiveView] = useState('collections');

    const openConfirm = useCallback((config: ConfirmDialogConfig) => setConfirm({ open: true, config }), []);

    const {
        tabs,
        activeTabId,
        activeTab,
        setTabs,
        setActiveTabId,
        updateTab,
        markClean,
        openRequest,
        openEnvironmentTab,
        newTab,
        duplicateTab,
        closeTab,
        closeOthers,
        closeAll,
    } = tabsApi;

    // Open a collection request: fetch full data from backend then open tab
    const handleOpenRequest = useCallback(
        async (req: Partial<RequestTab> & Partial<RequestSummary>) => {
            if (req.id && !req.id.startsWith('req-')) {
                try {
                    const full: any = await GetRequest(req.id);
                    const mapped = mapBackendRequestToTab(full, {
                        colId: req.colId ?? null,
                        folderId: req.folderId ?? null,
                    });
                    openRequest(mapped);
                    return;
                } catch (err) {
                    console.error('Failed to fetch request:', err);
                }
            }
            openRequest(req);
        },
        [openRequest],
    );

    // Save the active tab to backend — logic lives in useRequestSave.
    const handleSaveRequest = useRequestSave(
        activeTab,
        { updateTab, markClean },
        { addRequest: data.addRequest as any, updateRequest: data.updateRequest },
        (cfg) => setSaveRequest(cfg),
    );

    // Send a request — logic lives in useRequestSend.
    const handleSend = useRequestSend(activeTab, data.environments, setTabs, data.setHistory);

    // Cmd/Ctrl+S saves the active request
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 's') {
                e.preventDefault();
                handleSaveRequest();
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [handleSaveRequest]);

    // Keep environment tabs in sync with rename/delete of underlying env
    useEffect(() => {
        let changed = false;
        const nextTabs: Tab[] = tabs
            .map((t) => {
                if (t.type === 'environment') {
                    const env = data.environments.find((e) => e.id === t.envId);
                    if (env && env.name !== t.name) {
                        changed = true;
                        return { ...t, name: env.name } as Tab;
                    }
                }
                return t;
            })
            .filter((t) => {
                if (t.type === 'environment') {
                    const exists = data.environments.some((e) => e.id === t.envId);
                    if (!exists) {
                        changed = true;
                        return false;
                    }
                }
                return true;
            });

        if (changed) {
            if (nextTabs.length === 0) {
                closeAll();
            } else {
                setTabs(nextTabs);
                if (!nextTabs.find((t) => t.id === activeTabId)) {
                    setActiveTabId(nextTabs[0].id);
                }
            }
        }
    }, [data.environments, tabs, closeAll, setTabs, setActiveTabId, activeTabId]);

    const tabActions = {
        onNew: newTab,
        onDuplicate: duplicateTab,
        onClose: (id: string) => {
            const tab = tabs.find((t) => t.id === id);
            if (tab && tab.type === 'request' && tab.isDirty) {
                openConfirm({
                    title: 'Close unsaved tab?',
                    description: 'You have unsaved changes. Are you sure you want to close this tab?',
                    confirmText: 'Close',
                    onConfirm: () => closeTab(id),
                });
            } else {
                closeTab(id);
            }
        },
        onCloseOthers: (id: string) =>
            openConfirm({
                title: 'Close other tabs?',
                description: 'All tabs except this one will be closed.',
                confirmText: 'Close Others',
                onConfirm: () => closeOthers(id),
            }),
        onCloseAll: () =>
            openConfirm({
                title: 'Close all tabs?',
                description: 'All open tabs will be closed.',
                confirmText: 'Close All',
                onConfirm: () => closeAll(),
            }),
        onForceClose: () => closeAll(),
    };

    const openMove = useCallback((col: Collection) => setMove({ open: true, col }), []);

    const activeEnv = data.environments.find((e) => e.active);
    const activeEnvForTab =
        activeTab?.type === 'environment' ? data.environments.find((e) => e.id === activeTab.envId) : null;
    const activeEnvVars = (activeEnv?.variables || []).filter((v) => v.enabled !== false && v.key);

    // Typed slice for the sidebar (avoids drilling the whole `data` bag through 4 levels).
    const sidebarActions = {
        collections: data.collections,
        environments: data.environments,
        history: data.history,
        addCollection: data.addCollection,
        renameCollection: data.renameCollection,
        deleteCollection: data.deleteCollection,
        toggleCollection: data.toggleCollection,
        collapseCollection: data.collapseCollection,
        toggleFavorite: data.toggleFavorite,
        duplicateCollection: data.duplicateCollection,
        addFolder: data.addFolder,
        renameFolder: data.renameFolder,
        deleteFolder: data.deleteFolder,
        toggleFolder: data.toggleFolder,
        collapseFolder: data.collapseFolder,
        duplicateFolder: data.duplicateFolder,
        addRequest: data.addRequest,
        renameRequest: data.renameRequest,
        deleteRequest: data.deleteRequest,
        duplicateRequest: data.duplicateRequest,
        moveRequest: data.moveRequest,
        moveFolder: data.moveFolder,
        createEnvironment: data.createEnvironment,
        renameEnvironment: data.renameEnvironment,
        deleteEnvironment: data.deleteEnvironment,
        duplicateEnvironment: data.duplicateEnvironment,
        setActiveEnvironment: data.setActiveEnvironment,
    };

    return (
        <div className="h-screen w-screen flex flex-col bg-background overflow-hidden text-foreground">
            <TopBar
                workspaces={data.workspaces}
                activeWorkspace={data.activeWorkspace}
                environments={data.environments}
                activeEnv={activeEnv}
                onEnvChange={data.setActiveEnvironment}
                onSelectWorkspace={data.selectWorkspace}
                openConfirm={openConfirm}
                addWorkspace={data.addWorkspace}
                renameWorkspace={data.renameWorkspace}
                deleteWorkspace={data.deleteWorkspace}
            />

            <PanelGroup direction="horizontal" className="flex-1 min-h-0">
                <Panel defaultSize={26} minSize={18} maxSize={36}>
                    <Sidebar
                        actions={sidebarActions}
                        onOpenRequest={handleOpenRequest}
                        onOpenEnvironment={openEnvironmentTab}
                        onMove={openMove}
                        activeView={activeView}
                        setActiveView={setActiveView}
                        openConfirm={openConfirm}
                    />
                </Panel>

                <ResizeHandle />

                <Panel defaultSize={80} minSize={50}>
                    <div className="h-full flex flex-col bg-background">
                        <RequestTabsBar tabs={tabs} activeId={activeTabId} onSelect={setActiveTabId} actions={tabActions} />

                        {activeTab?.type === 'environment' &&
                            (activeEnvForTab ? (
                                <EnvironmentEditor
                                    env={activeEnvForTab}
                                    onChange={(vars) => data.updateEnvironmentVariables(activeEnvForTab.id, vars)}
                                />
                            ) : (
                                <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
                                    This environment was deleted.
                                </div>
                            ))}

                        {activeTab?.type === 'request' && (
                            <PanelGroup direction="vertical" className="flex-1 min-h-0">
                                <Panel defaultSize={55} minSize={25}>
                                    <RequestPanel
                                        request={activeTab as RequestTab}
                                        onUpdate={updateTab}
                                        onSend={handleSend}
                                        onSave={handleSaveRequest}
                                        envVariables={activeEnvVars}
                                    />
                                </Panel>
                                <ResizeHandle horizontal />
                                <Panel defaultSize={45} minSize={20}>
                                    <ResponsePanel
                                        response={(activeTab as RequestTab).response}
                                        isSending={(activeTab as RequestTab).isSending}
                                    />
                                </Panel>
                            </PanelGroup>
                        )}
                    </div>
                </Panel>
            </PanelGroup>

            <footer className="h-7 shrink-0 border-t border-border bg-card/80 backdrop-blur-xl flex items-center px-4 gap-4 text-[11px] text-muted-foreground">
                <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse-soft" />
                    Online
                </div>
                <span>v3.2.1</span>
                <span className="mx-1">·</span>
                <span>{data.activeWorkspace?.name || 'Workspace'}</span>
                <div className="ml-auto flex items-center gap-3">
                    <span>{tabs.length} open tabs</span>
                    <span className="mono">{activeEnv?.name || 'No env'}</span>
                </div>
            </footer>

            <ConfirmDialog
                open={confirm.open}
                onOpenChange={(o) => setConfirm((c) => ({ ...c, open: o }))}
                config={confirm.config}
            />
            <SaveRequestDialog
                open={saveRequest.open}
                onOpenChange={(o) => setSaveRequest((s) => ({ ...s, open: o }))}
                config={saveRequest.config}
                collections={data.collections}
                loadCollection={data.loadCollection}
            />
            <MoveDialog
                open={move.open}
                onOpenChange={(o) => setMove((m) => ({ ...m, open: o }))}
                config={{
                    collectionName: move.col?.name,
                    workspaces: data.workspaces.filter((w) => w.id !== data.activeWorkspaceId),
                    onPick: (wsId: string) => move.col && data.moveCollection(move.col.id, wsId),
                }}
            />
        </div>
    );
}

const ResizeHandle: React.FC<{ horizontal?: boolean }> = ({ horizontal = false }) => (
    <PanelResizeHandle
        className={cn(
            'group relative bg-border/40 hover:bg-primary/40 transition-colors',
            horizontal ? 'h-px w-full' : 'w-px h-full',
        )}
    >
        <div
            className={cn(
                'absolute opacity-0 group-hover:opacity-100 transition-opacity rounded bg-primary/80',
                horizontal
                    ? 'h-1 w-12 left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2'
                    : 'w-1 h-12 top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2',
            )}
        />
    </PanelResizeHandle>
);
