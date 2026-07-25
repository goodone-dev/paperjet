import { useEffect } from 'react';
import type { Tab, RequestTab } from '@/types/tab';
import type { Collection, Folder, RequestSummary } from '@/types/collection';

interface TabsSyncApi {
    setTabs: (updater: Tab[] | ((prev: Tab[]) => Tab[])) => void;
}

// Walk a collection tree and collect every request the sidebar knows about,
// keyed by request id. The value carries name + method so tabs can be kept
// in sync with the sidebar's source-of-truth.
type ReqEntry = { name: string; method: string; colId: string; folderId: string | null };
function indexRequests(collections: Collection[]): Map<string, ReqEntry> {
    const out = new Map<string, ReqEntry>();
    const walkFolder = (colId: string, folders: Folder[]) => {
        for (const f of folders || []) {
            for (const r of f.requests || []) {
                out.set(r.id, { name: r.name, method: r.method, colId, folderId: f.id });
            }
            if (f.folders) walkFolder(colId, f.folders);
        }
    };
    for (const c of collections) {
        for (const r of (c.requests || []) as RequestSummary[]) {
            out.set(r.id, { name: r.name, method: r.method, colId: c.id, folderId: null });
        }
        walkFolder(c.id, c.folders || []);
    }
    return out;
}

/**
 * When a collection / folder / request is renamed or deleted from the sidebar,
 * mirror those changes across any open tabs sourced from those items:
 * - Rename → update the tab's `name` (and re-parent `colId` / `folderId`).
 * - Delete → close the tab and clear its `sourceId` so it doesn't dangle.
 */
export function useCollectionTabSync(
    tabs: Tab[],
    collections: Collection[],
    activeTabId: string | null,
    setActiveTabId: (id: string | null) => void,
    api: TabsSyncApi,
): void {
    const { setTabs } = api;
    useEffect(() => {
        if (collections.length === 0) return;
        const index = indexRequests(collections);

        let changed = false;
        const next: Tab[] = [];
        for (const t of tabs) {
            if (t.type !== 'request' || !t.sourceId) {
                next.push(t);
                continue;
            }
            const entry = index.get(t.sourceId);
            if (!entry) {
                // Request was deleted from the sidebar → close the tab.
                changed = true;
                continue;
            }
            // Rename or move → mirror into the tab (keep local body/params dirty edits).
            if (entry.name !== t.name || entry.colId !== t.colId || (entry.folderId ?? null) !== (t.folderId ?? null)) {
                changed = true;
                next.push({ ...(t as RequestTab), name: entry.name, colId: entry.colId, folderId: entry.folderId } as Tab);
                continue;
            }
            next.push(t);
        }

        if (!changed) return;
        setTabs(next);
        if (activeTabId && !next.some((t) => t.id === activeTabId)) {
            setActiveTabId(next[0]?.id ?? null);
        }
    }, [collections, tabs, activeTabId, setActiveTabId, setTabs]);
}
