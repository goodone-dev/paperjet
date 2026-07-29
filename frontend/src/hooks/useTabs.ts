import { useState, useCallback, useEffect } from 'react';
import { loadState, saveState } from '@/lib/persist';
import type { RequestTab, RequestTabSnapshot, Tab, EnvironmentTab } from '@/types/tab';
import type { KeyValueRow } from '@/types/collection';
import type { Environment } from '@/types/environment';

const newRequestTemplate = (overrides: Partial<RequestTab> = {}): RequestTab => ({
    id: `req-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    type: 'request',
    sourceId: overrides.sourceId ?? null,
    colId: overrides.colId ?? null,
    folderId: overrides.folderId ?? null,
    name: overrides.name || 'Untitled Request',
    method: overrides.method || 'GET',
    url: overrides.url || '',
    params: overrides.params || [{ id: 'p1', key: '', value: '', description: '', enabled: true }],
    pathVariables: overrides.pathVariables || ([] as KeyValueRow[]),
    headers: overrides.headers || [
        { id: 'h1', key: 'Accept', value: 'application/json', description: '', enabled: true },
        { id: 'h2', key: '', value: '', description: '', enabled: true },
    ],
    body: overrides.body || '',
    bodyType: overrides.bodyType || 'none',
    bodyFormData: overrides.bodyFormData || [{ id: 'f1', key: '', value: '', description: '', enabled: true }],
    bodyUrlEncoded: overrides.bodyUrlEncoded || [{ id: 'u1', key: '', value: '', description: '', enabled: true }],
    auth: overrides.auth || { type: 'none' },
    response: null,
    isSending: false,
    isDirty: false,
    activeTab: 'params',
    pinned: overrides.pinned ?? false,
    baseline: overrides.baseline ?? null,
});

const DEFAULT_TAB = (): RequestTab => newRequestTemplate({});

// Capture the editable fields of a request so we can compare / restore later.
function snapshot(t: RequestTab): RequestTabSnapshot {
    return {
        name: t.name,
        method: t.method,
        url: t.url,
        params: JSON.parse(JSON.stringify(t.params || [])),
        pathVariables: JSON.parse(JSON.stringify(t.pathVariables || [])),
        headers: JSON.parse(JSON.stringify(t.headers || [])),
        body: t.body,
        bodyType: t.bodyType,
        bodyFormData: JSON.parse(JSON.stringify(t.bodyFormData || [])),
        bodyUrlEncoded: JSON.parse(JSON.stringify(t.bodyUrlEncoded || [])),
        auth: JSON.parse(JSON.stringify(t.auth || { type: 'none' })),
    };
}

interface TabState {
    workspaceId: string | null;
    tabs: Tab[];
    activeTabId: string | null;
}

type Updater<T> = T | ((prev: T) => T);

// Sort so pinned tabs always come first, preserving their relative order.
function sortByPin(tabs: Tab[]): Tab[] {
    const pinned: Tab[] = [];
    const rest: Tab[] = [];
    for (const t of tabs) {
        if (t.type === 'request' && t.pinned) pinned.push(t);
        else rest.push(t);
    }
    return [...pinned, ...rest];
}

function loadTabState(workspaceId: string | null): TabState {
    const savedTabs = loadState<Tab[] | null>(`tabs_${workspaceId}`, null);
    const savedActive = loadState<string | null>(`activeTabId_${workspaceId}`, null);
    const initialTabs: Tab[] = Array.isArray(savedTabs) && savedTabs.length > 0 ? sortByPin(savedTabs) : [DEFAULT_TAB()];
    return {
        workspaceId,
        tabs: initialTabs,
        activeTabId: initialTabs.some((t) => t.id === savedActive) ? savedActive : initialTabs[0].id,
    };
}

// Manages open tabs (request + environment editor), the active tab, and lifecycle.
export function useTabs(workspaceId: string | null) {
    const [tabState, setTabState] = useState<TabState>(() => loadTabState(workspaceId));

    // Reset tab state when the active workspace changes (Finding #9: no longer sets state during render).
    useEffect(() => {
        if (tabState.workspaceId !== workspaceId) {
            setTabState(loadTabState(workspaceId));
        }
    }, [workspaceId, tabState.workspaceId]);

    const { tabs, activeTabId } = tabState;

    const setTabs = useCallback((updater: Updater<Tab[]>) => {
        setTabState((prev) => ({
            ...prev,
            tabs: typeof updater === 'function' ? (updater as (p: Tab[]) => Tab[])(prev.tabs) : updater,
        }));
    }, []);

    const setActiveTabId = useCallback((updater: Updater<string | null>) => {
        setTabState((prev) => ({
            ...prev,
            activeTabId:
                typeof updater === 'function'
                    ? (updater as (p: string | null) => string | null)(prev.activeTabId)
                    : updater,
        }));
    }, []);

    useEffect(() => {
        if (workspaceId) saveState(`tabs_${workspaceId}`, tabs);
    }, [tabs, workspaceId]);
    useEffect(() => {
        if (workspaceId) saveState(`activeTabId_${workspaceId}`, activeTabId);
    }, [activeTabId, workspaceId]);

    const activeTab = tabs.find((t) => t.id === activeTabId);

    const updateTab = useCallback(
        (patch: Partial<RequestTab> & { id: string }) => {
            setTabs((ts) =>
                ts.map((t) => (t.id === patch.id ? ({ ...t, ...patch, isDirty: true } as Tab) : t)),
            );
        },
        [setTabs],
    );

    const markClean = useCallback(
        (id: string) => {
            setTabs((ts) =>
                ts.map((t) => {
                    if (t.id !== id) return t;
                    if (t.type !== 'request') return t;
                    return { ...t, isDirty: false, baseline: snapshot(t) } as Tab;
                }),
            );
        },
        [setTabs],
    );

    // Restore the tab from its saved baseline (if any) and clear the dirty flag.
    const discardChanges = useCallback(
        (id: string) => {
            setTabs((ts) =>
                ts.map((t) => {
                    if (t.id !== id || t.type !== 'request') return t;
                    const base = t.baseline;
                    if (!base) return { ...t, isDirty: false } as Tab;
                    return { ...t, ...base, isDirty: false } as Tab;
                }),
            );
        },
        [setTabs],
    );

    const togglePin = useCallback(
        (id: string) => {
            setTabs((ts) => {
                const next = ts.map((t) =>
                    t.id === id && t.type === 'request' ? ({ ...t, pinned: !t.pinned } as Tab) : t,
                );
                return sortByPin(next);
            });
        },
        [setTabs],
    );

    const openRequest = useCallback(
        (req: Partial<RequestTab>) => {
            if (req.sourceId) {
                const existing = tabs.find((t) => t.type === 'request' && t.sourceId === req.sourceId);
                if (existing) {
                    setActiveTabId(existing.id);
                    return;
                }
            } else {
                const existing = tabs.find(
                    (t) =>
                        t.type === 'request' &&
                        !t.sourceId &&
                        t.url === req.url &&
                        t.method === req.method &&
                        t.name === req.name,
                );
                if (existing) {
                    setActiveTabId(existing.id);
                    return;
                }
            }
            const newReq = newRequestTemplate(req);
            // Set the baseline snapshot so "Discard changes" works from the moment
            // the tab is opened (before any local edit).
            newReq.baseline = snapshot(newReq);
            setTabs((ts) => [...ts, newReq]);
            setActiveTabId(newReq.id);
        },
        [tabs, setActiveTabId, setTabs],
    );

    const openEnvironmentTab = useCallback(
        (env: Environment) => {
            const id = `envtab-${env.id}`;
            setTabs((ts) => {
                if (ts.some((t) => t.id === id)) return ts;
                const envTab: EnvironmentTab = { id, type: 'environment', envId: env.id, name: env.name };
                return [...ts, envTab];
            });
            setActiveTabId(id);
        },
        [setActiveTabId, setTabs],
    );

    const newTab = useCallback(() => {
        const t = DEFAULT_TAB();
        t.baseline = snapshot(t);
        setTabs((ts) => [...ts, t]);
        setActiveTabId(t.id);
    }, [setActiveTabId, setTabs]);

    const duplicateTab = useCallback(
        (id: string) => {
            const src = tabs.find((t) => t.id === id);
            if (!src || src.type !== 'request') return;
            const copy: RequestTab = {
                ...(src as RequestTab),
                id: `req-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                sourceId: '',
                response: null,
                isSending: false,
                pinned: false,
            };
            copy.baseline = snapshot(copy);
            const idx = tabs.findIndex((t) => t.id === id);
            const next = [...tabs];
            next.splice(idx + 1, 0, copy);
            setTabs(sortByPin(next));
            setActiveTabId(copy.id);
        },
        [tabs, setActiveTabId, setTabs],
    );

    const closeOthers = useCallback(
        (id: string) => {
            setTabs((ts) => ts.filter((t) => t.id === id || (t.type === 'request' && t.pinned)));
            setActiveTabId(id);
        },
        [setActiveTabId, setTabs],
    );

    const closeAll = useCallback(() => {
        setTabState((prev) => {
            const pinnedOnly = prev.tabs.filter((t) => t.type === 'request' && t.pinned);
            if (pinnedOnly.length > 0) {
                return { ...prev, tabs: pinnedOnly, activeTabId: pinnedOnly[0].id };
            }
            const fresh = DEFAULT_TAB();
            fresh.baseline = snapshot(fresh);
            return { ...prev, tabs: [fresh], activeTabId: fresh.id };
        });
    }, []);

    const forceCloseAll = useCallback(() => {
        const fresh = DEFAULT_TAB();
        fresh.baseline = snapshot(fresh);
        setTabs([fresh]);
        setActiveTabId(fresh.id);
    }, [setActiveTabId, setTabs]);

    const closeTab = useCallback(
        (id: string) => {
            const idx = tabs.findIndex((t) => t.id === id);
            const next = tabs.filter((t) => t.id !== id);
            if (next.length === 0) {
                const fresh = DEFAULT_TAB();
                fresh.baseline = snapshot(fresh);
                setTabs([fresh]);
                setActiveTabId(fresh.id);
                return;
            }
            setTabs(next);
            if (id === activeTabId) {
                setActiveTabId(next[Math.max(0, idx - 1)].id);
            }
        },
        [tabs, activeTabId, setActiveTabId, setTabs],
    );

    return {
        tabs,
        activeTabId,
        activeTab,
        setTabs,
        setActiveTabId,
        updateTab,
        markClean,
        discardChanges,
        togglePin,
        openRequest,
        openEnvironmentTab,
        newTab,
        duplicateTab,
        closeTab,
        closeOthers,
        closeAll,
        forceCloseAll,
    };
}

export type UseTabsApi = ReturnType<typeof useTabs>;
