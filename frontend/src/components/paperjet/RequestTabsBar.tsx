import React, { useRef, useEffect } from 'react';
import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    horizontalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    X,
    Plus,
    Globe,
    FilePlus,
    Copy,
    XCircle,
    XSquare,
    Trash2,
    Pin,
    PinOff,
    RotateCcw,
    type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { MethodLabel } from './MethodBadge';
import {
    ContextMenu,
    ContextMenuTrigger,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
} from '@/components/ui/context-menu';
import type { Tab } from '@/types/tab';

export interface RequestTabsBarActions {
    onNew: () => void;
    onDuplicate: (id: string) => void;
    onPin: (id: string) => void;
    onDiscardChanges: (id: string) => void;
    onClose: (id: string) => void;
    onCloseOthers: (id: string) => void;
    onCloseAll: () => void;
    onForceClose: () => void;
    onReorderTabs?: (startIndex: number, endIndex: number) => void;
}

interface RequestTabsBarProps {
    tabs: Tab[];
    activeId: string | null;
    onSelect: (id: string) => void;
    actions: RequestTabsBarActions;
}

interface MenuItem {
    label: string;
    icon: LucideIcon;
    testId: string;
    onClick: () => void;
    danger?: boolean;
    disabled?: boolean;
    separator?: false;
}

interface SeparatorItem {
    separator: true;
}

type CtxMenuEntry = MenuItem | SeparatorItem;

interface SortableTabItemProps {
    tab: Tab;
    isActive: boolean;
    onSelect: (id: string) => void;
    onClose: (id: string) => void;
    menu: CtxMenuEntry[];
    isPinned: boolean;
    isDirty: boolean;
    isEnv: boolean;
}

const SortableTabItem: React.FC<SortableTabItemProps> = ({
    tab,
    isActive,
    onSelect,
    onClose,
    menu,
    isPinned,
    isDirty,
    isEnv,
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: tab.id });

    const style: React.CSSProperties = {
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 20 : undefined,
    };

    return (
        <ContextMenu key={tab.id}>
            <ContextMenuTrigger asChild>
                <div
                    ref={setNodeRef}
                    style={style}
                    {...attributes}
                    {...listeners}
                    data-testid={`open-tab-${tab.id}`}
                    data-pinned={isPinned ? 'true' : undefined}
                    onClick={() => onSelect(tab.id)}
                    className={cn(
                        'group h-10 flex items-center gap-2 px-3 border-r border-border cursor-pointer transition-colors relative shrink-0 select-none',
                        isPinned ? 'min-w-[104px] max-w-[160px]' : 'min-w-[160px] max-w-[240px]',
                        isActive
                            ? 'bg-background text-foreground'
                            : 'bg-card text-muted-foreground hover:bg-secondary/60 hover:text-foreground',
                    )}
                >
                    {isActive && <span className="absolute top-0 left-0 right-0 h-0.5 bg-primary" />}
                    {isEnv ? (
                        <Globe className="h-3.5 w-3.5 text-primary shrink-0" />
                    ) : (
                        <MethodLabel method={(tab as any).method} />
                    )}
                    {isPinned && (
                        <Pin
                            data-testid={`tab-pin-icon-${tab.id}`}
                            className="h-3 w-3 shrink-0 text-primary rotate-45"
                            aria-label="Pinned"
                        />
                    )}
                    <span className="flex-1 text-[13px] truncate">
                        {tab.name || (isEnv ? 'Environment' : 'Untitled')}
                    </span>
                    <button
                        data-testid={`close-tab-${tab.id}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            onClose(tab.id);
                        }}
                        onPointerDown={(e) => e.stopPropagation()}
                        className="relative h-5 w-5 rounded hover:bg-muted flex items-center justify-center opacity-60 hover:opacity-100 transition-opacity shrink-0"
                        title={isDirty ? 'Unsaved changes – click to close' : 'Close tab'}
                    >
                        {isDirty ? (
                            <>
                                <span className="h-2 w-2 rounded-full bg-warning group-hover:hidden" />
                                <X className="h-3.5 w-3.5 hidden group-hover:block absolute" />
                            </>
                        ) : (
                            <X className="h-3.5 w-3.5" />
                        )}
                    </button>
                </div>
            </ContextMenuTrigger>
            <ContextMenuContent className="w-52">
                {menu.map((it, i) =>
                    'separator' in it ? (
                        <ContextMenuSeparator key={`sep-${i}`} />
                    ) : (
                        <ContextMenuItem
                            key={it.label}
                            data-testid={it.testId}
                            disabled={it.disabled}
                            onSelect={() => !it.disabled && it.onClick()}
                            className={cn(
                                'text-[13px] gap-2 cursor-pointer',
                                it.danger && 'text-destructive focus:text-destructive',
                            )}
                        >
                            <it.icon className="h-3.5 w-3.5" />
                            {it.label}
                        </ContextMenuItem>
                    ),
                )}
            </ContextMenuContent>
        </ContextMenu>
    );
};

export const RequestTabsBar: React.FC<RequestTabsBarProps> = ({ tabs, activeId, onSelect, actions }) => {
    const { onNew, onDuplicate, onPin, onDiscardChanges, onClose, onCloseOthers, onCloseAll, onForceClose, onReorderTabs } = actions;
    const scrollRef = useRef<HTMLDivElement>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
    );

    const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
        if (scrollRef.current && Math.abs(e.deltaX) < Math.abs(e.deltaY)) {
            scrollRef.current.scrollLeft += e.deltaY;
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id || !onReorderTabs) return;

        const oldIndex = tabs.findIndex((t) => t.id === active.id);
        const newIndex = tabs.findIndex((t) => t.id === over.id);

        if (oldIndex !== -1 && newIndex !== -1) {
            onReorderTabs(oldIndex, newIndex);
        }
    };

    useEffect(() => {
        if (!activeId || !scrollRef.current) return;
        const el = scrollRef.current.querySelector(`[data-testid="open-tab-${activeId}"]`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    }, [activeId]);

    return (
        <div className="h-10 shrink-0 bg-card border-b border-border flex items-stretch">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={tabs.map((t) => t.id)} strategy={horizontalListSortingStrategy}>
                    <div
                        ref={scrollRef}
                        onWheel={handleWheel}
                        className="flex-1 flex h-10 overflow-x-auto overflow-y-hidden"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                        {tabs.map((tab) => {
                            const isActive = tab.id === activeId;
                            const isEnv = tab.type === 'environment';
                            const isRequest = tab.type === 'request';
                            const isDirty = (isRequest || tab.type === 'example') && (tab as any).isDirty;
                            const isPinned = (isRequest || tab.type === 'example') && !!(tab as any).pinned;

                            const menu: CtxMenuEntry[] = [
                                { label: 'New Request', icon: FilePlus, testId: 'tab-ctx-new', onClick: () => onNew() },
                                { label: 'Duplicate Tab', icon: Copy, testId: 'tab-ctx-duplicate', onClick: () => onDuplicate(tab.id) },
                                {
                                    label: isPinned ? 'Unpin Tab' : 'Pin Tab',
                                    icon: isPinned ? PinOff : Pin,
                                    testId: `tab-ctx-${isPinned ? 'unpin' : 'pin'}`,
                                    onClick: () => onPin(tab.id),
                                    disabled: (!isRequest && tab.type !== 'example'),
                                },
                                {
                                    label: 'Discard Changes',
                                    icon: RotateCcw,
                                    testId: 'tab-ctx-discard-changes',
                                    onClick: () => onDiscardChanges(tab.id),
                                    disabled: !isDirty,
                                },
                                { separator: true },
                                { label: 'Close Tab', icon: X, testId: 'tab-ctx-close', onClick: () => onClose(tab.id) },
                                { label: 'Close Other Tabs', icon: XCircle, testId: 'tab-ctx-close-others', onClick: () => onCloseOthers(tab.id) },
                                { label: 'Close All Tabs', icon: XSquare, testId: 'tab-ctx-close-all', onClick: () => onCloseAll() },
                                { label: 'Force Close Tabs', icon: Trash2, danger: true, testId: 'tab-ctx-force-close', onClick: () => onForceClose() },
                            ];
                            return (
                                <SortableTabItem
                                    key={tab.id}
                                    tab={tab}
                                    isActive={isActive}
                                    onSelect={onSelect}
                                    onClose={onClose}
                                    menu={menu}
                                    isPinned={isPinned}
                                    isDirty={isDirty}
                                    isEnv={isEnv}
                                />
                            );
                        })}
                    </div>
                </SortableContext>
            </DndContext>
            <button
                data-testid="new-tab-btn"
                onClick={onNew}
                className="shrink-0 px-3 hover:bg-secondary/60 border-r border-border text-muted-foreground hover:text-foreground transition-colors"
            >
                <Plus className="h-4 w-4" />
            </button>
        </div>
    );
};
