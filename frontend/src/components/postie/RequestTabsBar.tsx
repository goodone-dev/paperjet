import React, { useRef, useEffect } from 'react';
import { X, Plus, Globe, FilePlus, Copy, XCircle, XSquare, Trash2, type LucideIcon } from 'lucide-react';
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
    onClose: (id: string) => void;
    onCloseOthers: (id: string) => void;
    onCloseAll: () => void;
    onForceClose: () => void;
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
    separator?: false;
}

interface SeparatorItem {
    separator: true;
}

type CtxMenuEntry = MenuItem | SeparatorItem;

export const RequestTabsBar: React.FC<RequestTabsBarProps> = ({ tabs, activeId, onSelect, actions }) => {
    const { onNew, onDuplicate, onClose, onCloseOthers, onCloseAll, onForceClose } = actions;
    const scrollRef = useRef<HTMLDivElement>(null);

    const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
        if (scrollRef.current && Math.abs(e.deltaX) < Math.abs(e.deltaY)) {
            scrollRef.current.scrollLeft += e.deltaY;
        }
    };

    useEffect(() => {
        if (!activeId || !scrollRef.current) return;
        const el = scrollRef.current.querySelector(`[data-testid="open-tab-${activeId}"]`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    }, [activeId]);

    return (
        <div className="h-10 shrink-0 bg-card border-b border-border flex items-stretch">
            <div
                ref={scrollRef}
                onWheel={handleWheel}
                className="flex-1 flex h-10 overflow-x-auto overflow-y-hidden"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {tabs.map((tab) => {
                    const isActive = tab.id === activeId;
                    const isEnv = tab.type === 'environment';
                    const isDirty = tab.type === 'request' && tab.isDirty;
                    const menu: CtxMenuEntry[] = [
                        { label: 'New Request', icon: FilePlus, testId: 'tab-ctx-new', onClick: () => onNew() },
                        { label: 'Duplicate Tab', icon: Copy, testId: 'tab-ctx-duplicate', onClick: () => onDuplicate(tab.id) },
                        { separator: true },
                        { label: 'Close Tab', icon: X, testId: 'tab-ctx-close', onClick: () => onClose(tab.id) },
                        { label: 'Close Other Tabs', icon: XCircle, testId: 'tab-ctx-close-others', onClick: () => onCloseOthers(tab.id) },
                        { label: 'Close All Tabs', icon: XSquare, testId: 'tab-ctx-close-all', onClick: () => onCloseAll() },
                        { label: 'Force Close Tabs', icon: Trash2, danger: true, testId: 'tab-ctx-force-close', onClick: () => onForceClose() },
                    ];
                    return (
                        <ContextMenu key={tab.id}>
                            <ContextMenuTrigger asChild>
                                <div
                                    data-testid={`open-tab-${tab.id}`}
                                    onClick={() => onSelect(tab.id)}
                                    className={cn(
                                        'group h-10 min-w-[160px] max-w-[240px] flex items-center gap-2 px-3 border-r border-border cursor-pointer transition-colors relative shrink-0',
                                        isActive ? 'bg-background text-foreground' : 'bg-card text-muted-foreground hover:bg-secondary/60 hover:text-foreground',
                                    )}
                                >
                                    {isActive && <span className="absolute top-0 left-0 right-0 h-0.5 bg-primary" />}
                                    {isEnv ? (
                                        <Globe className="h-3.5 w-3.5 text-primary shrink-0" />
                                    ) : (
                                        <MethodLabel method={tab.method} />
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
                                            onSelect={() => it.onClick()}
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
                })}
            </div>
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
