/**
 * useDragAndDrop.ts
 *
 * Encapsulates all dnd-kit state and event handler logic for the Sidebar
 * collections view. The hook returns only what the UI layer needs.
 */

import { useState } from 'react';
import { PointerSensor, useSensor, useSensors, type DragEndEvent, type DragOverEvent, type DragStartEvent } from '@dnd-kit/core';
import { ReorderCollectionItems } from '@/lib/api';
import {
    buildDragId,
    buildReorderPayload,
    normaliseDropData,
    resolveMoveArgs,
    type DragData,
} from '@/lib/dnd-helpers';
import type { Collection } from '@/types/collection';
import type { SidebarActions } from '@/components/postie/Sidebar';

interface UseDragAndDropReturn {
    sensors: ReturnType<typeof useSensors>;
    /** dnd-kit id of the item being dragged, or null. */
    activeDragId: string | null;
    /** dnd-kit id of the drop zone the cursor is currently over, or null. */
    overDropId: string | null;
    /** Payload of the item being dragged, for rendering the DragOverlay ghost. */
    activeDrag: DragData | null;
    onDragStart: (e: DragStartEvent) => void;
    onDragOver: (e: DragOverEvent) => void;
    onDragEnd: (e: DragEndEvent) => void;
}

export const useDragAndDrop = (
    collections: Collection[],
    actions: Pick<SidebarActions, 'moveRequest' | 'moveFolder'>,
): UseDragAndDropReturn => {
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    );

    const [activeDrag, setActiveDrag] = useState<DragData | null>(null);
    const [overDropId, setOverDropId] = useState<string | null>(null);

    const onDragStart = (e: DragStartEvent) => {
        setActiveDrag((e.active?.data?.current as DragData) ?? null);
    };

    const onDragOver = (e: DragOverEvent) => {
        setOverDropId(e.over ? String(e.over.id) : null);
    };

    const onDragEnd = (e: DragEndEvent) => {
        const src = e.active?.data?.current as DragData | undefined;
        const rawDst = e.over?.data?.current;

        // Always clear drag state regardless of whether the drop is valid.
        setActiveDrag(null);
        setOverDropId(null);

        if (!src || !rawDst) return;

        const dst = normaliseDropData(rawDst as Parameters<typeof normaliseDropData>[0]);

        // 1. Apply the move to workspace state.
        const moveArgs = resolveMoveArgs(src, dst);
        if (!moveArgs) return;

        if (src.kind === 'request') {
            actions.moveRequest(moveArgs.src, moveArgs.dest);
        } else {
            actions.moveFolder(moveArgs.src, moveArgs.dest);
        }

        // 2. Persist the new order via the API.
        //    NOTE: `collections` still reflects the PRE-move state here because
        //    React batches the setCollections call from moveRequest/moveFolder.
        //    buildReorderPayload therefore computes the expected post-move order itself.
        const col = collections.find((c) => c.id === src.colId);
        if (!col) return;

        const payload = buildReorderPayload(col, src, dst);
        if (!payload) return;

        ReorderCollectionItems(col.id, col.name, payload).catch((err) =>
            console.error('ReorderCollectionItems failed:', err),
        );
    };

    return {
        sensors,
        activeDragId: activeDrag ? buildDragId(activeDrag) : null,
        overDropId,
        activeDrag,
        onDragStart,
        onDragOver,
        onDragEnd,
    };
};
