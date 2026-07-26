import { useState, useEffect, useCallback } from 'react';
import { loadState, saveState } from '@/lib/persist';
import { mapTabToSavePayload } from '@/lib/request-mapper';
import type { Workspace } from '@/types/workspace';
import type { Collection, Folder, RequestSummary } from '@/types/collection';
import type { Environment, EnvVariable } from '@/types/environment';
import type { RequestTab } from '@/types/tab';
import type { DragSource, DropDest } from '@/types/dnd';
import type { HistoryEntry } from '@/types/history';
import { prune7Days } from '@/lib/history-format';
import {
    ListWorkspaces,
    CreateWorkspace,
    RenameWorkspace,
    DeleteWorkspace,
    ListEnvironments,
    CreateEnvironment,
    UpdateEnvironment,
    RenameEnvironment,
    DeleteEnvironment,
    DuplicateEnvironment,
    ListCollections,
    GetCollection,
    CreateCollection,
    RenameCollection,
    DeleteCollection,
    DuplicateCollection,
    UpdateCollectionFavorite,
    MoveCollection,
    CreateFolder,
    RenameFolder,
    DeleteFolder,
    DuplicateFolder,
    CreateRequest,
    RenameRequest,
    DeleteRequest,
    DuplicateRequest,
    type CreateRequestPayload,
} from '@/lib/api';

type Updater<T> = T | ((prev: T) => T);

// ---- helpers ----
const mapCol = (
    setCollections: React.Dispatch<React.SetStateAction<Collection[]>>,
    colId: string,
    fn: (c: Collection) => Collection,
) => setCollections((cs) => cs.map((c) => (c.id === colId ? fn(c) : c)));

const mapFolder = (
    setCollections: React.Dispatch<React.SetStateAction<Collection[]>>,
    colId: string,
    folderId: string,
    fn: (f: Folder) => Folder,
) => {
    const updateFolders = (folders: Folder[]): Folder[] =>
        (folders || []).map((f) => {
            if (f.id === folderId) return fn(f);
            if (f.folders) return { ...f, folders: updateFolders(f.folders) };
            return f;
        });
    mapCol(setCollections, colId, (c) => ({ ...c, folders: updateFolders(c.folders) }));
};

const findFolder = (folders: Folder[] | undefined, id: string): Folder | undefined => {
    if (!folders) return undefined;
    for (const f of folders) {
        if (f.id === id) return f;
        const found = findFolder(f.folders, id);
        if (found) return found;
    }
    return undefined;
};

const updateRequestInFolders = (
    folders: Folder[],
    reqId: string,
    patch: Partial<RequestSummary>,
): Folder[] =>
    folders.map((f) => ({
        ...f,
        requests: (f.requests || []).map((r) => (r.id === reqId ? { ...r, ...patch } : r)),
        folders: updateRequestInFolders(f.folders || [], reqId, patch),
    }));

interface WsState {
    workspaceId: string | null;
    history: HistoryEntry[];
    activeEnvironmentId: string | null;
}

function loadWsState(workspaceId: string | null): WsState {
    return {
        workspaceId,
        history: prune7Days(loadState<HistoryEntry[]>(`history_${workspaceId}`, [])),
        activeEnvironmentId: loadState<string | null>(`activeEnvironmentId_${workspaceId}`, null),
    };
}

// Centralised workspace state. All CRUD is `useCallback`-wrapped inside the hook body
// (no more per-render factory closures).
export function useWorkspaceData() {
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [collections, setCollections] = useState<Collection[]>([]);
    const [environments, setEnvironments] = useState<Environment[]>([]);

    const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(() =>
        loadState<string | null>('activeWorkspaceId', null),
    );

    const [wsState, setWsState] = useState<WsState>(() => loadWsState(activeWorkspaceId));

    // Finding #9 fix: sync via useEffect rather than during render.
    useEffect(() => {
        if (wsState.workspaceId !== activeWorkspaceId) {
            setWsState(loadWsState(activeWorkspaceId));
        }
    }, [activeWorkspaceId, wsState.workspaceId]);

    const { history, activeEnvironmentId } = wsState;

    const setHistory = useCallback((updater: Updater<HistoryEntry[]>) => {
        setWsState((prev) => ({
            ...prev,
            history:
                typeof updater === 'function'
                    ? (updater as (h: HistoryEntry[]) => HistoryEntry[])(prev.history)
                    : updater,
        }));
    }, []);

    const setActiveEnvironmentId = useCallback((updater: Updater<string | null>) => {
        setWsState((prev) => ({
            ...prev,
            activeEnvironmentId:
                typeof updater === 'function'
                    ? (updater as (id: string | null) => string | null)(prev.activeEnvironmentId)
                    : updater,
        }));
    }, []);

    // Load workspaces once on mount
    useEffect(() => {
        ListWorkspaces()
            .then((res: any) => {
                if (res && res.length > 0) {
                    setWorkspaces(res);
                    setActiveWorkspaceId((currentId) =>
                        res.some((w: Workspace) => w.id === currentId) ? currentId : res[0].id,
                    );
                }
            })
            .catch((err) => console.error('Failed to list workspaces', err));
    }, []);

    // Load collections & environments whenever the active workspace changes
    useEffect(() => {
        if (!activeWorkspaceId) return;

        ListCollections(activeWorkspaceId)
            .then((res: any) => {
                const colList = res || [];
                setCollections(
                    colList.map((c: any) => ({
                        ...c,
                        favorite: c.is_favorite,
                        folders: c.folders ?? [],
                        requests: c.requests ?? [],
                        expanded: false,
                        loaded: false,
                    })),
                );
            })
            .catch((err) => console.error('Failed to list collections:', err));

        ListEnvironments(activeWorkspaceId)
            .then((res: any) => {
                const savedEnvId = loadState<string | null>(`activeEnvironmentId_${activeWorkspaceId}`, null);
                setEnvironments((res || []).map((e: any) => ({ ...e, active: e.id === savedEnvId })));
            })
            .catch((err) => console.error('Failed to list environments:', err));
    }, [activeWorkspaceId]);

    useEffect(() => saveState('activeWorkspaceId', activeWorkspaceId), [activeWorkspaceId]);
    useEffect(() => {
        if (activeWorkspaceId) saveState(`activeEnvironmentId_${activeWorkspaceId}`, activeEnvironmentId);
    }, [activeEnvironmentId, activeWorkspaceId]);
    useEffect(() => {
        if (activeWorkspaceId) saveState(`history_${activeWorkspaceId}`, history);
    }, [history, activeWorkspaceId]);

    const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0] || ({} as Workspace);

    // ---- Workspace CRUD ----
    const addWorkspace = useCallback(async (name: string) => {
        try {
            const res: any = await CreateWorkspace({ name } as any);
            const newWs: Workspace = { ...res };
            setWorkspaces((prev) => [...prev, newWs]);
            setActiveWorkspaceId(newWs.id);
        } catch (err) {
            console.error('Failed to create workspace:', err);
        }
    }, []);

    const renameWorkspace = useCallback(async (id: string, name: string) => {
        try {
            await RenameWorkspace(id, name);
            setWorkspaces((prev) => prev.map((w) => (w.id === id ? { ...w, name } : w)));
        } catch (err) {
            console.error('Failed to rename workspace:', err);
        }
    }, []);

    const deleteWorkspace = useCallback(
        async (id: string) => {
            if (workspaces.length <= 1) return;
            const w = workspaces.find((ws) => ws.id === id);
            if (!w) return;
            try {
                await DeleteWorkspace(id, w.name);
                const remaining = workspaces.filter((ws) => ws.id !== id);
                setWorkspaces(remaining);
                if (id === activeWorkspaceId) setActiveWorkspaceId(remaining[0].id);
            } catch (err) {
                console.error('Failed to delete workspace:', err);
            }
        },
        [workspaces, activeWorkspaceId],
    );

    const selectWorkspace = useCallback((id: string) => setActiveWorkspaceId(id), []);

    // ---- Collection CRUD ----
    const addCollection = useCallback(
        async (name: string) => {
            try {
                const res: any = await CreateCollection({ workspace_id: activeWorkspaceId, name } as any);
                setCollections((cs) => [
                    ...cs,
                    {
                        ...res,
                        favorite: res.is_favorite ?? false,
                        folders: res.folders ?? [],
                        requests: res.requests ?? [],
                        expanded: false,
                        loaded: false,
                    },
                ]);
            } catch (err) {
                console.error('Failed to create collection:', err);
            }
        },
        [activeWorkspaceId],
    );

    const renameCollection = useCallback(async (id: string, name: string) => {
        try {
            await RenameCollection(id, name);
            mapCol(setCollections, id, (c) => ({ ...c, name }));
        } catch (err) {
            console.error('Failed to rename collection:', err);
        }
    }, []);

    const deleteCollection = useCallback(
        async (id: string) => {
            try {
                const col = collections.find((c) => c.id === id);
                if (!col) return;
                await DeleteCollection(id, col.name);
                setCollections((cs) => cs.filter((c) => c.id !== id));
            } catch (err) {
                console.error('Failed to delete collection:', err);
            }
        },
        [collections],
    );

    const loadCollection = useCallback(
        async (id: string) => {
            const col = collections.find((c) => c.id === id);
            if (!col || col.loaded) return;
            try {
                const c: any = await GetCollection(id);
                setCollections((cs) =>
                    cs.map((oc) =>
                        oc.id === id
                            ? {
                                  ...c,
                                  favorite: c.is_favorite,
                                  folders: c.folders,
                                  requests: c.requests || [],
                                  expanded: oc.expanded,
                                  loaded: true,
                              }
                            : oc,
                    ),
                );
            } catch (err) {
                console.error('Failed to load collection:', err);
            }
        },
        [collections],
    );

    const toggleCollection = useCallback(
        async (id: string) => {
            try {
                const col = collections.find((c) => c.id === id);
                const willExpand = !col?.expanded;
                if (willExpand && !col?.loaded) {
                    const c: any = await GetCollection(id);
                    setCollections((cs) => {
                        const updated: Collection = {
                            ...c,
                            favorite: c.is_favorite,
                            folders: c.folders,
                            requests: c.requests || [],
                            expanded: true,
                            loaded: true,
                        };
                        return cs.map((oc) => (oc.id === id ? updated : oc));
                    });
                } else {
                    mapCol(setCollections, id, (c) => ({ ...c, expanded: willExpand }));
                }
            } catch (err) {
                console.error('Failed to toggle collection:', err);
            }
        },
        [collections],
    );

    const collapseCollection = useCallback((id: string) => {
        const collapseAll = (folders: Folder[]): Folder[] =>
            (folders || []).map((f) => ({ ...f, expanded: false, folders: collapseAll(f.folders) }));
        mapCol(setCollections, id, (c) => ({ ...c, expanded: false, folders: collapseAll(c.folders) }));
    }, []);

    // Expand collection + every nested folder. Requires collection to be loaded
    // — mirrors `toggleCollection` so we still fetch from the backend if needed.
    const expandCollection = useCallback(
        async (id: string) => {
            const expandAll = (folders: Folder[]): Folder[] =>
                (folders || []).map((f) => ({ ...f, expanded: true, folders: expandAll(f.folders || []) }));
            const col = collections.find((c) => c.id === id);
            if (col && !col.loaded) {
                try {
                    const c: any = await GetCollection(id);
                    setCollections((cs) =>
                        cs.map((oc) =>
                            oc.id === id
                                ? {
                                      ...c,
                                      favorite: c.is_favorite,
                                      folders: expandAll(c.folders || []),
                                      requests: c.requests || [],
                                      expanded: true,
                                      loaded: true,
                                  }
                                : oc,
                        ),
                    );
                    return;
                } catch (err) {
                    console.error('Failed to expand collection:', err);
                    return;
                }
            }
            mapCol(setCollections, id, (c) => ({ ...c, expanded: true, folders: expandAll(c.folders) }));
        },
        [collections],
    );

    const toggleFavorite = useCallback(
        async (id: string) => {
            try {
                const col = collections.find((c) => c.id === id);
                if (!col) return;
                const newFav = !col.favorite;
                await UpdateCollectionFavorite(id, newFav);
                mapCol(setCollections, id, (c) => ({ ...c, favorite: newFav }));
            } catch (err) {
                console.error('Failed to toggle favorite:', err);
            }
        },
        [collections],
    );

    const duplicateCollection = useCallback(async (id: string) => {
        try {
            const res: any = await DuplicateCollection(id);
            setCollections((cs) => {
                const idx = cs.findIndex((c) => c.id === id);
                const newCol: Collection = {
                    ...res,
                    favorite: res.is_favorite ?? false,
                    folders: res.folders ?? [],
                    requests: res.requests ?? [],
                    expanded: false,
                    loaded: false,
                };
                if (idx < 0) return [...cs, newCol];
                const next = [...cs];
                next.splice(idx + 1, 0, newCol);
                return next;
            });
        } catch (err) {
            console.error('Failed to duplicate collection:', err);
        }
    }, []);

    const moveCollection = useCallback(async (colId: string, targetWorkspaceId: string) => {
        try {
            await MoveCollection(colId, { target_workspace_id: targetWorkspaceId } as any);
            setCollections((cs) => cs.filter((c) => c.id !== colId));
        } catch (err) {
            console.error('Failed to move collection:', err);
        }
    }, []);

    // ---- Folder CRUD ----
    const addFolder = useCallback(async (colId: string, name: string, parentFolderId?: string) => {
        try {
            const payload: any = { collection_id: colId, name };
            if (parentFolderId) payload.parent_id = parentFolderId;
            const res: any = await CreateFolder(payload);
            const newFolder: Folder = {
                ...res,
                expanded: false,
                folders: res.folders ?? [],
                requests: res.requests ?? [],
            };
            if (parentFolderId) {
                mapFolder(setCollections, colId, parentFolderId, (f) => ({
                    ...f,
                    folders: [...(f.folders || []), newFolder],
                }));
            } else {
                mapCol(setCollections, colId, (c) => ({ ...c, folders: [...(c.folders || []), newFolder] }));
            }
        } catch (err) {
            console.error('Failed to add folder', err);
        }
    }, []);

    const renameFolder = useCallback(async (colId: string, folderId: string, name: string) => {
        try {
            await RenameFolder(folderId, { name } as any);
            mapFolder(setCollections, colId, folderId, (f) => ({ ...f, name }));
        } catch (err) {
            console.error('Failed to rename folder', err);
        }
    }, []);

    const deleteFolder = useCallback(
        async (colId: string, folderId: string) => {
            try {
                const col = collections.find((c) => c.id === colId);
                const folder = findFolder(col?.folders, folderId);
                if (!folder) return;
                await DeleteFolder(folderId, folder.name);
                const removeFolderFromList = (folders: Folder[]): Folder[] =>
                    (folders || [])
                        .filter((f) => f.id !== folderId)
                        .map((f) => ({ ...f, folders: removeFolderFromList(f.folders) }));
                mapCol(setCollections, colId, (c) => ({ ...c, folders: removeFolderFromList(c.folders) }));
            } catch (err) {
                console.error('Failed to delete folder', err);
            }
        },
        [collections],
    );

    const toggleFolder = useCallback((colId: string, folderId: string) => {
        mapFolder(setCollections, colId, folderId, (f) => ({ ...f, expanded: !f.expanded }));
    }, []);

    const collapseFolder = useCallback((colId: string, folderId: string) => {
        const collapseAll = (folders: Folder[]): Folder[] =>
            (folders || []).map((subF) => ({ ...subF, expanded: false, folders: collapseAll(subF.folders) }));
        mapFolder(setCollections, colId, folderId, (f) => ({
            ...f,
            expanded: false,
            folders: collapseAll(f.folders),
        }));
    }, []);

    const expandFolder = useCallback((colId: string, folderId: string) => {
        const expandAll = (folders: Folder[]): Folder[] =>
            (folders || []).map((subF) => ({ ...subF, expanded: true, folders: expandAll(subF.folders) }));
        mapFolder(setCollections, colId, folderId, (f) => ({
            ...f,
            expanded: true,
            folders: expandAll(f.folders),
        }));
    }, []);

    const duplicateFolder = useCallback(async (colId: string, folderId: string) => {
        try {
            await DuplicateFolder(folderId);
            // The backend duplicates the folder + all nested subfolders + requests,
            // but only returns the flat root folder (without its subtree). Refresh
            // the entire collection so the sidebar shows the full duplicated subtree.
            const c: any = await GetCollection(colId);
            setCollections((cs) =>
                cs.map((oc) => {
                    if (oc.id !== colId) return oc;

                    const preserveExpanded = (newFolders: any[], oldFolders: any[]): any[] => {
                        return newFolders.map((newF) => {
                            const oldF = oldFolders.find((f) => f.id === newF.id);
                            return {
                                ...newF,
                                expanded: oldF ? oldF.expanded : false,
                                folders: preserveExpanded(newF.folders || [], oldF ? (oldF.folders || []) : []),
                            };
                        });
                    };

                    return {
                        ...c,
                        favorite: c.is_favorite,
                        folders: preserveExpanded(c.folders || [], oc.folders || []),
                        requests: c.requests || [],
                        expanded: oc.expanded,
                        loaded: true,
                    };
                }),
            );
        } catch (err) {
            console.error('Failed to duplicate folder', err);
        }
    }, []);

    // ---- Request CRUD ----
    const addRequest = useCallback(
        async (colId: string, folderId: string | null, req: RequestTab | { name: string } | string) => {
            try {
                let payload: any;
                if (typeof req === 'string' || !('method' in (req as any))) {
                    // Simple create — no full request body
                    const name = typeof req === 'string' ? req : (req as any).name || 'New Request';
                    payload = {
                        collection_id: colId,
                        folder_id: folderId || null,
                        name,
                        method: 'GET',
                        url: '',
                        params: [],
                        path_variables: [],
                        auth: { type: 'none' },
                        headers: [],
                        body: { type: 'none' },
                    };
                } else {
                    // Full tab → backend payload via the shared mapper
                    const mapped = mapTabToSavePayload(req as RequestTab);
                    payload = {
                        collection_id: colId,
                        folder_id: folderId || null,
                        ...mapped,
                    };
                }
                const res: any = await CreateRequest(payload);
                if (folderId) {
                    mapFolder(setCollections, colId, folderId, (f) => ({
                        ...f,
                        requests: [...(f.requests || []), res],
                    }));
                } else {
                    mapCol(setCollections, colId, (c) => ({ ...c, requests: [...(c.requests || []), res] }));
                }
                return res as { id: string };
            } catch (err) {
                console.error('Failed to add request', err);
                return null;
            }
        },
        [],
    );

    const renameRequest = useCallback(
        async (colId: string, folderId: string | null, reqId: string, name: string) => {
            try {
                await RenameRequest(reqId, { name } as any);
                if (folderId) {
                    mapFolder(setCollections, colId, folderId, (f) => ({
                        ...f,
                        requests: (f.requests || []).map((r) => (r.id === reqId ? { ...r, name } : r)),
                    }));
                } else {
                    mapCol(setCollections, colId, (c) => ({
                        ...c,
                        requests: (c.requests || []).map((r) => (r.id === reqId ? { ...r, name } : r)),
                    }));
                }
            } catch (err) {
                console.error('Failed to rename request', err);
            }
        },
        [],
    );

    const deleteRequest = useCallback(
        async (colId: string, folderId: string | null, reqId: string) => {
            try {
                const col = collections.find((c) => c.id === colId);
                const folder = folderId ? findFolder(col?.folders, folderId) : null;
                const req = (folder?.requests ?? col?.requests ?? []).find((r) => r.id === reqId);
                await DeleteRequest(reqId, req?.method || 'GET', req?.name || 'Request');
                if (folderId) {
                    mapFolder(setCollections, colId, folderId, (f) => ({
                        ...f,
                        requests: (f.requests || []).filter((r) => r.id !== reqId),
                    }));
                } else {
                    mapCol(setCollections, colId, (c) => ({
                        ...c,
                        requests: (c.requests || []).filter((r) => r.id !== reqId),
                    }));
                }
            } catch (err) {
                console.error('Failed to delete request', err);
            }
        },
        [collections],
    );

    const duplicateRequest = useCallback(
        async (colId: string, folderId: string | null, reqId: string) => {
            try {
                const res: any = await DuplicateRequest(reqId);
                if (folderId) {
                    mapFolder(setCollections, colId, folderId, (f) => {
                        const reqs = [...(f.requests || [])];
                        const idx = reqs.findIndex((r) => r.id === reqId);
                        reqs.splice(idx < 0 ? reqs.length : idx + 1, 0, res);
                        return { ...f, requests: reqs };
                    });
                } else {
                    mapCol(setCollections, colId, (c) => {
                        const reqs = [...(c.requests || [])];
                        const idx = reqs.findIndex((r) => r.id === reqId);
                        reqs.splice(idx < 0 ? reqs.length : idx + 1, 0, res);
                        return { ...c, requests: reqs };
                    });
                }
            } catch (err) {
                console.error('Failed to duplicate request', err);
            }
        },
        [],
    );

    const updateRequest = useCallback((reqId: string, patch: Partial<RequestSummary>) => {
        setCollections((cs) =>
            cs.map((c) => ({
                ...c,
                folders: updateRequestInFolders(c.folders || [], reqId, patch),
                requests: (c.requests || []).map((r) => (r.id === reqId ? { ...r, ...patch } : r)),
            })),
        );
    }, []);

    // ---- Drag & drop ----
    const moveRequest = useCallback((src: DragSource, dest: DropDest) => {
        setCollections((cs) => {
            let moved: RequestSummary | null = null;
            const removed = cs.map((c) => ({
                ...c,
                folders: (c.folders || []).map((f) => {
                    if (c.id === src.colId && f.id === src.folderId) {
                        moved = (f.requests || []).find((r) => r.id === src.reqId) || moved;
                        return { ...f, requests: (f.requests || []).filter((r) => r.id !== src.reqId) };
                    }
                    return f;
                }),
            }));
            if (!moved) return cs;
            return removed.map((c) => {
                if (c.id !== dest.colId) return c;
                return {
                    ...c,
                    expanded: true,
                    folders: (c.folders || []).map((f) => {
                        if (f.id !== dest.folderId) return f;
                        const reqs = f.requests || [];
                        if (!dest.beforeReqId) return { ...f, expanded: true, requests: [...reqs, moved!] };
                        const arr = [...reqs];
                        const i = arr.findIndex((r) => r.id === dest.beforeReqId);
                        arr.splice(i < 0 ? arr.length : i, 0, moved!);
                        return { ...f, expanded: true, requests: arr };
                    }),
                };
            });
        });
    }, []);

    const moveFolder = useCallback((src: DragSource, dest: DropDest) => {
        setCollections((cs) => {
            let moved: Folder | null = null;
            const removed = cs.map((c) =>
                c.id === src.colId
                    ? {
                          ...c,
                          folders: (c.folders || []).filter((f) =>
                              f.id === src.folderId ? ((moved = f), false) : true,
                          ),
                      }
                    : c,
            );
            if (!moved) return cs;
            return removed.map((c) => {
                if (c.id !== dest.colId) return c;
                const arr = [...(c.folders || [])];
                if (!dest.beforeFolderId) arr.push(moved!);
                else {
                    const i = arr.findIndex((f) => f.id === dest.beforeFolderId);
                    arr.splice(i < 0 ? arr.length : i, 0, moved!);
                }
                return { ...c, expanded: true, folders: arr };
            });
        });
    }, []);

    // ---- Environment CRUD ----
    const createEnvironment = useCallback(
        async (name: string) => {
            if (!activeWorkspaceId) return;
            const payload = { workspace_id: activeWorkspaceId, name: name || 'New Environment' };
            try {
                const res: any = await CreateEnvironment(payload as any);
                setEnvironments((es) => [...es, res]);
            } catch (err) {
                console.error('CreateEnvironment failed:', err);
            }
        },
        [activeWorkspaceId],
    );

    const updateEnvironment = useCallback(
        async (id: string, patch: Partial<Environment>) => {
            try {
                if (patch.active !== undefined) {
                    setActiveEnvironmentId(patch.active ? id : null);
                    setEnvironments((es) => es.map((e) => ({ ...e, active: e.id === id })));
                } else {
                    const env = environments.find((e) => e.id === id);
                    const res: any = await UpdateEnvironment(id, {
                        name: patch.name,
                        variables: env?.variables || [],
                    } as any);
                    setEnvironments((es) => es.map((e) => (e.id === id ? { ...e, ...res } : e)));
                }
            } catch (err) {
                console.error('UpdateEnvironment failed:', err);
            }
        },
        [environments, setActiveEnvironmentId],
    );

    const renameEnvironment = useCallback(async (id: string, name: string) => {
        try {
            const res: any = await RenameEnvironment(id, { name } as any);
            setEnvironments((es) => es.map((e) => (e.id === id ? { ...e, ...res } : e)));
        } catch (err) {
            console.error('Failed to rename environment:', err);
        }
    }, []);

    const deleteEnvironment = useCallback(
        async (id: string) => {
            try {
                const env = environments.find((e) => e.id === id);
                if (!env) return;
                await DeleteEnvironment(id, env.name);
                setEnvironments((es) => es.filter((e) => e.id !== id));
            } catch (err) {
                console.error('DeleteEnvironment failed:', err);
            }
        },
        [environments],
    );

    const duplicateEnvironment = useCallback(async (id: string) => {
        try {
            const res: any = await DuplicateEnvironment(id);
            setEnvironments((es) => {
                const idx = es.findIndex((e) => e.id === id);
                if (idx < 0) return [...es, res];
                const next = [...es];
                next.splice(idx + 1, 0, res);
                return next;
            });
        } catch (err) {
            console.error('Failed to duplicate environment', err);
        }
    }, []);

    const setActiveEnvironment = useCallback(
        (id: string | null) => {
            setActiveEnvironmentId(id ?? null);
            setEnvironments((es) => es.map((e) => ({ ...e, active: e.id === id })));
        },
        [setActiveEnvironmentId],
    );

    const updateEnvironmentVariables = useCallback(
        async (id: string, variables: EnvVariable[]) => {
            try {
                const env = environments.find((e) => e.id === id);
                if (!env) return;
                const res: any = await UpdateEnvironment(id, { name: env.name, variables } as any);
                setEnvironments((es) => es.map((e) => (e.id === id ? { ...e, variables: res.variables } : e)));
            } catch (err) {
                console.error('Failed to update environment variables', err);
            }
        },
        [environments],
    );

    const clearHistory = useCallback(() => setHistory([]), [setHistory]);

    return {
        workspaces,
        activeWorkspace,
        activeWorkspaceId,
        collections,
        environments,
        history,
        setHistory,
        // Workspace
        addWorkspace,
        renameWorkspace,
        deleteWorkspace,
        selectWorkspace,
        // Collection
        addCollection,
        renameCollection,
        deleteCollection,
        loadCollection,
        toggleCollection,
        collapseCollection,
        expandCollection,
        toggleFavorite,
        duplicateCollection,
        moveCollection,
        // Folder
        addFolder,
        renameFolder,
        deleteFolder,
        toggleFolder,
        collapseFolder,
        expandFolder,
        duplicateFolder,
        // Request
        addRequest,
        renameRequest,
        deleteRequest,
        duplicateRequest,
        updateRequest,
        moveRequest,
        moveFolder,
        // Environment
        createEnvironment,
        updateEnvironment,
        renameEnvironment,
        deleteEnvironment,
        duplicateEnvironment,
        setActiveEnvironment,
        updateEnvironmentVariables,
        clearHistory,
    };
}

export type UseWorkspaceDataApi = ReturnType<typeof useWorkspaceData>;
