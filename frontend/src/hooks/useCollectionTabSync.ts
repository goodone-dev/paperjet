import { useEffect, useRef } from 'react';
import type { Tab, RequestTab, ExampleTab } from '@/types/tab';
import type { Collection, Folder, RequestSummary } from '@/types/collection';

interface TabsSyncApi {
    setTabs: (updater: Tab[] | ((prev: Tab[]) => Tab[])) => void;
}

// Walk a collection tree and collect every request the sidebar knows about,
// keyed by request id. The value carries name + method so tabs can be kept
// in sync with the sidebar's source-of-truth.
type ReqEntry = { type: 'request'; name: string; method: string; colId: string; folderId: string | null };
type ExEntry = { type: 'example'; name: string; method: string; colId: string; folderId: string | null; reqId: string };
type IndexEntry = ReqEntry | ExEntry;

function indexRequests(collections: Collection[]): Map<string, IndexEntry> {
    const out = new Map<string, IndexEntry>();
    const walkFolder = (colId: string, folders: Folder[]) => {
        for (const f of folders || []) {
            for (const r of f.requests || []) {
                out.set(r.id, { type: 'request', name: r.name, method: r.method, colId, folderId: f.id });
                for (const ex of r.examples || []) {
                    out.set(ex.id, { type: 'example', name: ex.name, method: ex.method, colId, folderId: f.id, reqId: r.id });
                }
            }
            if (f.folders) walkFolder(colId, f.folders);
        }
    };
    for (const c of collections) {
        for (const r of (c.requests || []) as RequestSummary[]) {
            out.set(r.id, { type: 'request', name: r.name, method: r.method, colId: c.id, folderId: null });
            for (const ex of r.examples || []) {
                out.set(ex.id, { type: 'example', name: ex.name, method: ex.method, colId: c.id, folderId: null, reqId: r.id });
            }
        }
        walkFolder(c.id, c.folders || []);
    }
    return out;
}

/**
 * When a collection / folder / request / example is renamed or deleted from the sidebar,
 * mirror those changes across any open tabs sourced from those items:
 * - Rename → update the tab's `name` (and re-parent `colId` / `folderId`).
 * - Delete → close the tab and clear its `sourceId` so it doesn't dangle.
 */
export function useCollectionTabSync(
    tabs: Tab[],
    collections: Collection[],
    collectionsWorkspaceId: string | null,
    workspaceId: string | null,
    activeTabId: string | null,
    setActiveTabId: (id: string | null) => void,
    api: TabsSyncApi,
): void {
    const { setTabs } = api;
    const previousWorkspaceId = useRef(workspaceId);
    useEffect(() => {
        // useTabs restores workspace tabs in an effect; this render still has old tabs.
        if (previousWorkspaceId.current !== workspaceId) {
            previousWorkspaceId.current = workspaceId;
            return;
        }
        // An empty, loaded collection list is authoritative. Ignore data while another
        // workspace is loading so tabs from that workspace cannot be closed early.
        if (!workspaceId || collectionsWorkspaceId !== workspaceId) return;
        const index = indexRequests(collections);

        let changed = false;
        const next: Tab[] = [];
        for (const t of tabs) {
            if ((t.type !== 'request' && t.type !== 'example') || !t.sourceId) {
                next.push(t);
                continue;
            }
            const collection = collections.find((c) => c.id === t.colId);
            if (!collection) {
                changed = true;
                continue;
            }
            if (!collection.loaded) {
                next.push(t);
                continue;
            }
            const entry = index.get(t.sourceId);
            if (!entry || entry.type !== t.type) {
                // Request/Example was deleted from the sidebar → close the tab.
                changed = true;
                continue;
            }
            
            // Mirror sidebar rename/move into tab, but preserve local edits when tab is dirty
            const nameChanged = entry.name !== t.name && (!t.isDirty || t.baseline?.name === t.name);
            const parentChanged = entry.colId !== t.colId || (entry.folderId ?? null) !== (t.folderId ?? null)
                || (t.type === 'example' && entry.type === 'example' && t.requestId !== entry.reqId);

            if (nameChanged || parentChanged) {
                changed = true;
                if (t.type === 'request') {
                    next.push({
                        ...(t as RequestTab),
                        name: nameChanged ? entry.name : t.name,
                        baseline: nameChanged && t.baseline ? { ...t.baseline, name: entry.name } : t.baseline,
                        colId: entry.colId,
                        folderId: entry.folderId,
                    } as Tab);
                } else {
                    next.push({
                        ...(t as ExampleTab),
                        name: nameChanged ? entry.name : t.name,
                        baseline: nameChanged && t.baseline ? { ...t.baseline, name: entry.name } : t.baseline,
                        colId: entry.colId,
                        folderId: entry.folderId,
                        requestId: (entry as ExEntry).reqId,
                    } as Tab);
                }
                continue;
            }
            next.push(t);
        }

        if (!changed) return;
        setTabs(next);
        if (activeTabId && !next.some((t) => t.id === activeTabId)) {
            setActiveTabId(next[0]?.id ?? null);
        }
    }, [collections, collectionsWorkspaceId, workspaceId, tabs, activeTabId, setActiveTabId, setTabs]);
}
