import { useCallback } from 'react';
import { UpdateRequest } from '@/lib/api';
import { mapTabToSavePayload } from '@/lib/request-mapper';
import type { RequestTab, Tab } from '@/types/tab';

export interface SaveDialogConfig {
    defaultName: string;
    onSave: (colId: string, folderId: string | null, name: string) => Promise<void>;
}

interface TabsApi {
    updateTab: (patch: Partial<RequestTab> & { id: string }) => void;
    markClean: (id: string) => void;
}

interface WorkspaceDataApi {
    addRequest: (colId: string, folderId: string | null, req: RequestTab) => Promise<{ id: string } | null>;
    updateRequest: (reqId: string, patch: Partial<{ name: string; method: string }>) => void;
}

type OpenSaveDialog = (cfg: { open: true; config: SaveDialogConfig }) => void;

/**
 * Owns the save-request logic: opens the "Save As" dialog for unsaved tabs,
 * otherwise calls UpdateRequest on the backend, keeps sidebar & tab state in sync.
 * Extracted from AppWorkspace.handleSaveRequest.
 */
export function useRequestSave(
    activeTab: Tab | undefined,
    tabsApi: TabsApi,
    data: WorkspaceDataApi,
    openSaveDialog: OpenSaveDialog,
): () => Promise<void> {
    return useCallback(async () => {
        if (!activeTab || activeTab.type !== 'request') return;
        const reqTab = activeTab as RequestTab;

        if (!reqTab.sourceId) {
            openSaveDialog({
                open: true,
                config: {
                    defaultName: reqTab.name,
                    onSave: async (colId, folderId, name) => {
                        const payload = { ...reqTab, name };
                        const res = await data.addRequest(colId, folderId, payload);
                        if (res) {
                            tabsApi.updateTab({ id: reqTab.id, sourceId: res.id, name, colId, folderId });
                            tabsApi.markClean(reqTab.id);
                        }
                    },
                },
            });
            return;
        }

        try {
            const payload = mapTabToSavePayload(reqTab);
            await UpdateRequest(reqTab.sourceId, payload as any);
            tabsApi.markClean(reqTab.id);
            data.updateRequest(reqTab.sourceId, { name: reqTab.name, method: reqTab.method });
        } catch (err) {
            console.error('Failed to save request:', err);
        }
    }, [activeTab, tabsApi, data, openSaveDialog]);
}
