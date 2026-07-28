/**
 * dnd-helpers.ts
 *
 * Pure utility functions for the Sidebar drag-and-drop feature.
 * All functions here are side-effect-free and independently testable.
 */

import type { Collection, Folder, RequestSummary } from '@/types/collection';
import type { DragSource, DropDest } from '@/types/dnd';
import type { ReorderCollectionItemsPayload } from '@/lib/api';

// ─── ID encoding ─────────────────────────────────────────────────────────────

export type DragData =
    | { kind: 'request'; colId: string; folderId?: string; reqId: string }
    | { kind: 'folder'; colId: string; folderId: string };

export type DropData =
    | { kind: 'folder'; colId: string; folderId: string }
    | { kind: 'folder_before'; colId: string; folderId: string; parentFolderId: string | null }
    | { kind: 'folder_end'; colId: string; folderId: string }
    | { kind: 'request'; colId: string; folderId?: string; reqId: string }
    | { kind: 'collection'; colId: string }
    | { kind: 'collection_end'; colId: string };

export const buildDragId = (d: DragData): string =>
    d.kind === 'request'
        ? `drag:req:${d.colId}:${d.folderId ?? '_'}:${d.reqId}`
        : `drag:folder:${d.colId}:${d.folderId}`;

export const buildDropId = (d: DropData): string => {
    switch (d.kind) {
        case 'collection':     return `drop:col:${d.colId}`;
        case 'collection_end': return `drop:col_end:${d.colId}`;
        case 'folder':         return `drop:folder:${d.colId}:${d.folderId}`;
        case 'folder_before':  return `drop:folder_before:${d.colId}:${d.folderId}`;
        case 'folder_end':     return `drop:folder_end:${d.colId}:${d.folderId}`;
        default: {
            const r = d as DropData & { kind: 'request' };
            return `drop:req:${r.colId}:${r.folderId ?? '_'}:${r.reqId}`;
        }
    }
};

// ─── Drop normalisation ───────────────────────────────────────────────────────

/**
 * Aliases that simplify routing in handleDragEnd:
 *   folder_end     -> folder     (drop at end of folder = drop inside folder)
 *   collection_end -> collection
 */
export const normaliseDropData = (raw: DropData): DropData => {
    if (raw.kind === 'folder_end')
        return { kind: 'folder', colId: raw.colId, folderId: raw.folderId };
    if (raw.kind === 'collection_end')
        return { kind: 'collection', colId: raw.colId };
    return raw;
};

// ─── Drop routing -> DragSource / DropDest ────────────────────────────────────

/** Returns the workspace-level move arguments, or null if the drop is a no-op. */
export const resolveMoveArgs = (
    src: DragData,
    dst: DropData,
): { src: DragSource; dest: DropDest } | null => {
    if (src.kind === 'request') {
        if (dst.kind === 'folder') {
            return {
                src: { kind: 'request', colId: src.colId, folderId: src.folderId, reqId: src.reqId },
                dest: { colId: dst.colId, folderId: dst.folderId },
            };
        }
        if (dst.kind === 'request' && dst.reqId !== src.reqId) {
            return {
                src: { kind: 'request', colId: src.colId, folderId: src.folderId, reqId: src.reqId },
                dest: { colId: dst.colId, folderId: dst.folderId, beforeReqId: dst.reqId },
            };
        }
        if (dst.kind === 'collection') {
            return {
                src: { kind: 'request', colId: src.colId, folderId: src.folderId, reqId: src.reqId },
                dest: { colId: dst.colId, folderId: undefined },
            };
        }
        return null;
    }

    if (src.kind === 'folder') {
        if (dst.kind === 'folder' && dst.folderId !== src.folderId) {
            return {
                src: { kind: 'folder', colId: src.colId, folderId: src.folderId },
                dest: { colId: dst.colId, folderId: dst.folderId },
            };
        }
        if (dst.kind === 'folder_before' && dst.folderId !== src.folderId) {
            return {
                src: { kind: 'folder', colId: src.colId, folderId: src.folderId },
                dest: { colId: dst.colId, folderId: dst.parentFolderId ?? undefined, beforeFolderId: dst.folderId },
            };
        }
        if (dst.kind === 'collection') {
            return {
                src: { kind: 'folder', colId: src.colId, folderId: src.folderId },
                dest: { colId: dst.colId, folderId: undefined },
            };
        }
        return null;
    }

    return null;
};

// ─── Reorder-payload computation ──────────────────────────────────────────────

/** Recursively find a folder by id inside a folder tree. */
export const findFolderById = (
    folders: Folder[],
    id: string,
): Folder | undefined => {
    for (const f of folders ?? []) {
        if (f.id === id) return f;
        const found = findFolderById(f.folders ?? [], id);
        if (found) return found;
    }
    return undefined;
};

const toFolderItem = (f: Folder) => ({ type: 'folder' as const, id: f.id, name: f.name });
const toRequestItem = (r: RequestSummary) => ({
    type: 'request' as const,
    id: r.id,
    name: r.name,
    method: r.method,
});

/**
 * Compute the `ReorderCollectionItemsPayload` that mirrors the optimistic
 * reorder applied by moveRequest / moveFolder.
 *
 * We operate on the PRE-move collection snapshot (React has not yet re-rendered)
 * and manually splice the item into its new position.
 */
export const buildReorderPayload = (
    col: Collection,
    src: DragData,
    dst: DropData,
): ReorderCollectionItemsPayload | null => {
    if (src.kind === 'request') return buildRequestReorderPayload(col, src, dst);
    if (src.kind === 'folder') return buildFolderReorderPayload(col, src, dst);
    return null;
};

// ── Internal helpers ──────────────────────────────────────────────────────────

const spliceAt = <T>(arr: T[], item: T, beforeId: string | undefined, getId: (i: T) => string): T[] => {
    const idx = beforeId ? arr.findIndex((i) => getId(i) === beforeId) : -1;
    const result = [...arr];
    result.splice(idx < 0 ? result.length : idx, 0, item);
    return result;
};

const buildRequestReorderPayload = (
    col: Collection,
    src: DragData & { kind: 'request' },
    dst: DropData,
): ReorderCollectionItemsPayload | null => {
    const destFolderId =
        dst.kind === 'folder' ? dst.folderId
            : dst.kind === 'request' ? dst.folderId
                : undefined;

    const srcParentRequests = src.folderId
        ? (findFolderById(col.folders, src.folderId)?.requests ?? [])
        : (col.requests ?? []);
    const srcReq = srcParentRequests.find((r) => r.id === src.reqId);

    const insertBefore = dst.kind === 'request' ? dst.reqId : undefined;

    if (destFolderId) {
        const destFolder = findFolderById(col.folders, destFolderId);
        if (!destFolder) return null;

        const baseReqs = (destFolder.requests ?? []).filter((r) => r.id !== src.reqId);
        const reqs = srcReq ? spliceAt(baseReqs, srcReq, insertBefore, (r) => r.id) : baseReqs;

        return { parent_folder_id: destFolderId, items: reqs.map(toRequestItem) };
    }

    const baseReqs = (col.requests ?? []).filter((r) => r.id !== src.reqId);
    const reqs = srcReq ? spliceAt(baseReqs, srcReq, insertBefore, (r) => r.id) : baseReqs;

    return {
        items: [...(col.folders ?? []).map(toFolderItem), ...reqs.map(toRequestItem)],
    };
};

const buildFolderReorderPayload = (
    col: Collection,
    src: DragData & { kind: 'folder' },
    dst: DropData,
): ReorderCollectionItemsPayload | null => {
    const srcFolder = findFolderById(col.folders, src.folderId);
    if (!srcFolder) return null;

    const destParentId =
        dst.kind === 'folder' ? dst.folderId
            : dst.kind === 'folder_before' ? (dst.parentFolderId ?? undefined)
                : undefined;

    const destParent: Pick<Collection, 'folders' | 'requests'> =
        destParentId ? (findFolderById(col.folders, destParentId) ?? col) : col;

    const baseFolders = (destParent.folders ?? []).filter((f) => f.id !== src.folderId);
    const newFolders =
        dst.kind === 'folder_before'
            ? spliceAt(baseFolders, srcFolder, dst.folderId, (f) => f.id)
            : [...baseFolders, srcFolder];

    return {
        parent_folder_id: destParentId,
        items: [
            ...newFolders.map(toFolderItem),
            ...(destParent.requests ?? []).map(toRequestItem),
        ],
    };
};
