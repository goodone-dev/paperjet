import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Folder as FolderIcon,
    FolderOpen,
    ChevronRight,
    Plus,
    MoreHorizontal,
    Search,
    Globe,
    Boxes,
    Trash2,
    Pencil,
    FolderPlus,
    FilePlus2,
    CheckCircle2,
    Star,
    Copy,
    ChevronsDownUp,
    ArrowRight,
    Code2,
    FileText,
    GitBranch,
    History,
    StarOff,
    type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
    ContextMenu,
    ContextMenuTrigger,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
} from '@/components/ui/context-menu';
import { MethodLabel } from './MethodBadge';
import { InlineEdit } from './InlineEdit';
import { cn } from '@/lib/utils';
import type { Collection, Folder, RequestSummary } from '@/types/collection';
import type { Environment } from '@/types/environment';
import type { DragSource, DropDest } from '@/types/dnd';
import type { RequestTab } from '@/types/tab';
import type { ConfirmDialogConfig } from './CrudDialogs';

// Typed subset of useWorkspaceData that the Sidebar consumes — fixes Finding #11
// (previously the entire `data` bag was drilled 4 levels deep).
export interface SidebarActions {
    collections: Collection[];
    environments: Environment[];
    history: HistoryEntry[];
    addCollection: (name: string) => void | Promise<void>;
    renameCollection: (id: string, name: string) => void | Promise<void>;
    deleteCollection: (id: string) => void | Promise<void>;
    toggleCollection: (id: string) => void | Promise<void>;
    collapseCollection: (id: string) => void;
    toggleFavorite: (id: string) => void | Promise<void>;
    duplicateCollection: (id: string) => void | Promise<void>;
    addFolder: (colId: string, name: string, parentFolderId?: string) => void | Promise<void>;
    renameFolder: (colId: string, folderId: string, name: string) => void | Promise<void>;
    deleteFolder: (colId: string, folderId: string) => void | Promise<void>;
    toggleFolder: (colId: string, folderId: string) => void;
    collapseFolder: (colId: string, folderId: string) => void;
    duplicateFolder: (colId: string, folderId: string) => void | Promise<void>;
    addRequest: (colId: string, folderId: string | null, req: RequestTab | { name: string } | string) => Promise<{ id: string } | null> | void;
    renameRequest: (colId: string, folderId: string | null, reqId: string, name: string) => void | Promise<void>;
    deleteRequest: (colId: string, folderId: string | null, reqId: string) => void | Promise<void>;
    duplicateRequest: (colId: string, folderId: string | null, reqId: string) => void | Promise<void>;
    moveRequest: (src: DragSource, dest: DropDest) => void;
    moveFolder: (src: DragSource, dest: DropDest) => void;
    createEnvironment: (name: string) => void | Promise<void>;
    renameEnvironment: (id: string, name: string) => void | Promise<void>;
    deleteEnvironment: (id: string) => void | Promise<void>;
    duplicateEnvironment: (id: string) => void | Promise<void>;
    setActiveEnvironment: (id: string | null) => void;
}

interface HistoryEntry {
    id: string;
    method: string;
    url: string;
    time: string;
}

const COLLAPSE_ANIM = {
    initial: { height: 0, opacity: 0 },
    animate: { height: 'auto', opacity: 1 },
    exit: { height: 0, opacity: 0 },
    transition: { duration: 0.18, ease: 'easeOut' },
} as const;

interface NavItem {
    id: string;
    label: string;
    icon: LucideIcon;
    disabled?: boolean;
}

const NAV_ITEMS: NavItem[] = [
    { id: 'collections', label: 'Collections', icon: Boxes },
    { id: 'environments', label: 'Environments', icon: Globe },
    { id: 'history', label: 'History', icon: History },
    { id: 'flows', label: 'Flows', icon: GitBranch, disabled: true },
    { id: 'snippets', label: 'Snippets', icon: Code2, disabled: true },
    { id: 'docs', label: 'APIs', icon: FileText, disabled: true },
];

interface MenuActionItem {
    label: string;
    icon?: LucideIcon;
    testId?: string;
    onClick: () => void;
    danger?: boolean;
    separator?: false;
}
interface MenuSeparator {
    separator: true;
    label?: undefined;
}
type MenuEntry = MenuActionItem | MenuSeparator;

const renderMenu = (items: MenuEntry[], Item: any, Sep: any) =>
    items.filter(Boolean).map((it, i) =>
        'separator' in it && it.separator ? (
            <Sep key={`sep-${i}`} />
        ) : (
            <Item
                key={(it as MenuActionItem).label}
                data-testid={(it as MenuActionItem).testId}
                onSelect={() => (it as MenuActionItem).onClick()}
                className={cn(
                    'text-[13px] gap-2 cursor-pointer',
                    (it as MenuActionItem).danger && 'text-destructive focus:text-destructive',
                )}
            >
                {(it as MenuActionItem).icon && React.createElement((it as MenuActionItem).icon as LucideIcon, { className: 'h-3.5 w-3.5' })}
                {(it as MenuActionItem).label}
            </Item>
        ),
    );

interface RowActionsProps {
    items: MenuEntry[];
    testId: string;
    indicator?: React.ReactNode;
}

const RowActions: React.FC<RowActionsProps> = ({ items, testId, indicator }) => {
    const [open, setOpen] = useState(false);
    return (
        <div className="ml-auto flex items-center h-5 shrink-0 pl-1" onClick={(e) => e.stopPropagation()}>
            {indicator != null && (
                <span className={cn('flex items-center', open ? 'hidden' : 'group-hover:hidden')}>{indicator}</span>
            )}
            <DropdownMenu open={open} onOpenChange={setOpen}>
                <DropdownMenuTrigger asChild>
                    <button
                        data-testid={testId}
                        className={cn(
                            'h-5 w-5 rounded items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground',
                            open ? 'flex' : 'hidden group-hover:flex',
                        )}
                    >
                        <MoreHorizontal className="h-3.5 w-3.5" />
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52" onClick={(e) => e.stopPropagation()}>
                    {renderMenu(items, DropdownMenuItem, DropdownMenuSeparator)}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
};

const ContextWrap: React.FC<{ items: MenuEntry[]; children: React.ReactNode }> = ({ items, children }) => (
    <ContextMenu>
        <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
        <ContextMenuContent className="w-52">{renderMenu(items, ContextMenuItem, ContextMenuSeparator)}</ContextMenuContent>
    </ContextMenu>
);

interface EditState {
    mode: 'create' | 'rename';
    kind: 'collection' | 'folder' | 'subfolder' | 'request' | 'environment';
    id?: string;
    colId?: string;
    folderId?: string;
}

interface EditApi {
    edit: EditState | null;
    startCreate: (kind: EditState['kind'], colId?: string, folderId?: string) => void;
    startRename: (kind: EditState['kind'], id: string, colId?: string, folderId?: string) => void;
    clearEdit: () => void;
    submitCreate: (name: string) => void;
    submitRename: (name: string) => void;
}

interface DndApi {
    start: (payload: DragSource) => (e: React.DragEvent) => void;
    over: (e: React.DragEvent) => void;
    dropOnFolder: (colId: string, folderId: string) => (e: React.DragEvent) => void;
    dropOnRequest: (colId: string, folderId: string | undefined, reqId: string) => (e: React.DragEvent) => void;
    dropOnCollection: (col: Collection) => (e: React.DragEvent) => void;
}

interface SidebarProps {
    actions: SidebarActions;
    onOpenRequest: (req: Partial<RequestTab> & Partial<RequestSummary>) => void;
    onOpenEnvironment: (env: Environment) => void;
    onMove: (col: Collection) => void;
    activeView: string;
    setActiveView: (v: string) => void;
    openConfirm: (config: ConfirmDialogConfig) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
    actions,
    onOpenRequest,
    onOpenEnvironment,
    onMove,
    activeView,
    setActiveView,
    openConfirm,
}) => {
    const [search, setSearch] = useState('');
    const [edit, setEdit] = useState<EditState | null>(null);
    const dragRef = useRef<DragSource | null>(null);

    const startCreate: EditApi['startCreate'] = (kind, colId, folderId) =>
        setEdit({ mode: 'create', kind, colId, folderId });
    const startRename: EditApi['startRename'] = (kind, id, colId, folderId) =>
        setEdit({ mode: 'rename', kind, id, colId, folderId });
    const clearEdit = () => setEdit(null);

    const submitCreate = (name: string) => {
        if (!edit) return;
        const { kind, colId, folderId } = edit;
        if (kind === 'collection') actions.addCollection(name);
        else if (kind === 'environment') actions.createEnvironment(name);
        else if (kind === 'folder' && colId) actions.addFolder(colId, name);
        else if (kind === 'subfolder' && colId) actions.addFolder(colId, name, folderId);
        else if (kind === 'request' && colId) actions.addRequest(colId, folderId ?? null, { name });
        clearEdit();
    };
    const submitRename = (name: string) => {
        if (!edit || !edit.id) return;
        const { kind, id, colId, folderId } = edit;
        if (kind === 'collection') actions.renameCollection(id, name);
        else if (kind === 'folder' && colId) actions.renameFolder(colId, id, name);
        else if (kind === 'request' && colId) actions.renameRequest(colId, folderId ?? null, id, name);
        else if (kind === 'environment') actions.renameEnvironment(id, name);
        clearEdit();
    };

    const editApi: EditApi = { edit, startCreate, startRename, clearEdit, submitCreate, submitRename };
    const dnd = makeDnd(dragRef, actions);

    const handleHeaderAdd = () => {
        if (activeView === 'collections') startCreate('collection');
        else if (activeView === 'environments') startCreate('environment');
    };
    const showAdd = activeView === 'collections' || activeView === 'environments';

    return (
        <div className="h-full flex bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
            <div className="w-14 shrink-0 border-r border-sidebar-border flex flex-col items-center py-3 gap-1 bg-card/40">
                <TooltipProvider delayDuration={200}>
                    {NAV_ITEMS.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeView === item.id;
                        let stateClass: string;
                        if (item.disabled) {
                            stateClass = 'text-muted-foreground/40 cursor-not-allowed';
                        } else if (isActive) {
                            stateClass = 'text-primary bg-primary-soft';
                        } else {
                            stateClass = 'text-muted-foreground hover:bg-sidebar-hover hover:text-foreground';
                        }
                        return (
                            <Tooltip key={item.id}>
                                <TooltipTrigger asChild>
                                    <button
                                        data-testid={`nav-${item.id}`}
                                        disabled={item.disabled}
                                        onClick={() => !item.disabled && setActiveView(item.id)}
                                        className={cn(
                                            'h-10 w-10 rounded-lg flex items-center justify-center transition-colors relative',
                                            stateClass,
                                        )}
                                    >
                                        <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
                                        {isActive && !item.disabled && (
                                            <span className="absolute -left-3 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-primary" />
                                        )}
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent side="right">
                                    {item.label}
                                    {item.disabled ? ' · Soon' : ''}
                                </TooltipContent>
                            </Tooltip>
                        );
                    })}
                </TooltipProvider>
            </div>

            <div className="flex-1 min-w-0 flex flex-col">
                <div className="p-3 border-b border-sidebar-border">
                    <div className="flex items-center justify-between mb-3 h-7">
                        <h2 className="text-sm font-semibold capitalize">{activeView}</h2>
                        {showAdd && (
                            <Button data-testid="sidebar-add-btn" variant="ghost" size="icon" className="h-7 w-7" onClick={handleHeaderAdd}>
                                <Plus className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                            data-testid="sidebar-filter-input"
                            value={search}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                            placeholder="Filter"
                            className="h-8 pl-8 text-xs bg-card border-sidebar-border w-full"
                        />
                    </div>
                </div>

                <ScrollArea className="flex-1">
                    <div className="p-2">
                        {activeView === 'collections' && (
                            <CollectionsView
                                actions={actions}
                                search={search}
                                onOpenRequest={onOpenRequest}
                                onMove={onMove}
                                editApi={editApi}
                                dnd={dnd}
                                openConfirm={openConfirm}
                            />
                        )}
                        {activeView === 'history' && <HistoryView history={actions.history} onOpenRequest={onOpenRequest} />}
                        {activeView === 'environments' && (
                            <EnvironmentsView
                                actions={actions}
                                search={search}
                                editApi={editApi}
                                onOpenEnvironment={onOpenEnvironment}
                                openConfirm={openConfirm}
                            />
                        )}
                    </div>
                </ScrollArea>
            </div>
        </div>
    );
};

function makeDnd(dragRef: React.MutableRefObject<DragSource | null>, actions: SidebarActions): DndApi {
    const start = (payload: DragSource) => (e: React.DragEvent) => {
        dragRef.current = payload;
        if (e.dataTransfer) {
            e.dataTransfer.effectAllowed = 'move';
            try {
                e.dataTransfer.setData('text/plain', payload.kind);
            } catch (err) {
                // Some browsers throw on `setData` when a drag isn't fully initialised.
                // The drag itself continues via `dragRef.current`, so this is safe to log & swallow.
                console.debug('[dnd] setData failed', err);
            }
        }
        e.stopPropagation();
    };
    const over = (e: React.DragEvent) => {
        e.preventDefault();
        if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
    };
    const dropOnFolder = (colId: string, folderId: string) => (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const d = dragRef.current;
        if (!d) return;
        if (d.kind === 'request') actions.moveRequest({ kind: 'request', colId: d.colId, folderId: d.folderId, reqId: d.reqId }, { colId, folderId });
        else if (d.kind === 'folder' && d.folderId !== folderId) actions.moveFolder({ kind: 'folder', colId: d.colId, folderId: d.folderId }, { colId, beforeFolderId: folderId });
        dragRef.current = null;
    };
    const dropOnRequest = (colId: string, folderId: string | undefined, reqId: string) => (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const d = dragRef.current;
        if (!d || d.kind !== 'request' || d.reqId === reqId) return;
        actions.moveRequest(
            { kind: 'request', colId: d.colId, folderId: d.folderId, reqId: d.reqId },
            { colId, folderId, beforeReqId: reqId },
        );
        dragRef.current = null;
    };
    const dropOnCollection = (col: Collection) => (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const d = dragRef.current;
        if (!d) return;
        if (d.kind === 'folder' && d.colId !== col.id)
            actions.moveFolder({ kind: 'folder', colId: d.colId, folderId: d.folderId }, { colId: col.id });
        else if (d.kind === 'request' && col.folders[0])
            actions.moveRequest(
                { kind: 'request', colId: d.colId, folderId: d.folderId, reqId: d.reqId },
                { colId: col.id, folderId: col.folders[0].id },
            );
        dragRef.current = null;
    };
    return { start, over, dropOnFolder, dropOnRequest, dropOnCollection };
}

interface CollectionsViewProps {
    actions: SidebarActions;
    search: string;
    onOpenRequest: SidebarProps['onOpenRequest'];
    onMove: SidebarProps['onMove'];
    editApi: EditApi;
    dnd: DndApi;
    openConfirm: SidebarProps['openConfirm'];
}

const CollectionsView: React.FC<CollectionsViewProps> = ({ actions, search, onOpenRequest, onMove, editApi, dnd, openConfirm }) => {
    const q = search.toLowerCase();
    const filtered = actions.collections
        .map((c) => ({
            ...c,
            folders: (c.folders || []).map((f) => ({
                ...f,
                requests: (f.requests || []).filter((r) => r.name.toLowerCase().includes(q)),
            })),
            requests: (c.requests || []).filter((r) => r.name.toLowerCase().includes(q)),
        }))
        .filter(
            (c) =>
                !search ||
                c.name.toLowerCase().includes(q) ||
                (c.folders || []).some((f) => f.requests.length > 0) ||
                (c.requests || []).length > 0,
        )
        .sort((a, b) => (b.favorite ? 1 : 0) - (a.favorite ? 1 : 0));

    const creatingCollection = editApi.edit?.mode === 'create' && editApi.edit.kind === 'collection';

    if (actions.collections.length === 0 && !creatingCollection) {
        return <EmptyView label="collections" onCreate={() => editApi.startCreate('collection')} />;
    }

    return (
        <div className="space-y-0.5">
            {creatingCollection && (
                <div className="flex items-center gap-1.5 px-2 py-1.5">
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <FolderIcon className="h-4 w-4 text-primary shrink-0" />
                    <InlineEdit
                        placeholder="Collection name"
                        className="text-sm font-medium"
                        onSubmit={editApi.submitCreate}
                        onCancel={editApi.clearEdit}
                    />
                </div>
            )}
            {filtered.map((col) => (
                <CollectionRow
                    key={col.id}
                    col={col}
                    actions={actions}
                    onOpenRequest={onOpenRequest}
                    onMove={onMove}
                    editApi={editApi}
                    dnd={dnd}
                    openConfirm={openConfirm}
                />
            ))}
        </div>
    );
};

interface CollectionRowProps {
    col: Collection;
    actions: SidebarActions;
    onOpenRequest: SidebarProps['onOpenRequest'];
    onMove: SidebarProps['onMove'];
    editApi: EditApi;
    dnd: DndApi;
    openConfirm: SidebarProps['openConfirm'];
}

const CollectionRow: React.FC<CollectionRowProps> = ({ col, actions, onOpenRequest, onMove, editApi, dnd, openConfirm }) => {
    const { edit } = editApi;
    const isRenaming = edit?.mode === 'rename' && edit.kind === 'collection' && edit.id === col.id;

    const items: MenuEntry[] = [
        {
            label: col.favorite ? 'Unfavorite' : 'Favorite',
            icon: col.favorite ? StarOff : Star,
            testId: `collection-favorite-${col.id}`,
            onClick: () => actions.toggleFavorite(col.id),
        },
        {
            label: 'Add Request',
            icon: FilePlus2,
            testId: `collection-add-request-${col.id}`,
            onClick: async () => {
                if (!col.expanded) await actions.toggleCollection(col.id);
                editApi.startCreate('request', col.id);
            },
        },
        {
            label: 'Add Folder',
            icon: FolderPlus,
            testId: `collection-add-folder-${col.id}`,
            onClick: async () => {
                if (!col.expanded) await actions.toggleCollection(col.id);
                editApi.startCreate('folder', col.id);
            },
        },
        { label: 'Collapse Folders', icon: ChevronsDownUp, testId: `collection-collapse-${col.id}`, onClick: () => actions.collapseCollection(col.id) },
        { separator: true },
        { label: 'Rename', icon: Pencil, testId: `collection-rename-${col.id}`, onClick: () => editApi.startRename('collection', col.id) },
        { label: 'Duplicate', icon: Copy, testId: `collection-duplicate-${col.id}`, onClick: () => actions.duplicateCollection(col.id) },
        { label: 'Move', icon: ArrowRight, testId: `collection-move-${col.id}`, onClick: () => onMove(col) },
        { separator: true },
        {
            label: 'Delete',
            icon: Trash2,
            danger: true,
            testId: `collection-delete-${col.id}`,
            onClick: () =>
                openConfirm({
                    title: `Delete "${col.name}"?`,
                    description: 'This collection and all of its requests will be removed.',
                    onConfirm: () => actions.deleteCollection(col.id),
                }),
        },
    ];

    const creatingFolder = edit?.mode === 'create' && edit.kind === 'folder' && edit.colId === col.id;
    const creatingReqHere = edit?.mode === 'create' && edit.kind === 'request' && edit.colId === col.id && !edit.folderId;

    return (
        <div>
            <ContextWrap items={items}>
                <div
                    className="group w-full flex items-center gap-1.5 px-2 py-1.5 rounded-md hover:bg-sidebar-hover transition-colors cursor-pointer"
                    onClick={() => !isRenaming && actions.toggleCollection(col.id)}
                    onDoubleClick={(e) => {
                        e.stopPropagation();
                        editApi.startRename('collection', col.id);
                    }}
                    onDragOver={dnd.over}
                    onDrop={dnd.dropOnCollection(col)}
                    data-testid={`collection-toggle-${col.id}`}
                >
                    <ChevronRight className={cn('h-3.5 w-3.5 text-muted-foreground transition-transform shrink-0', col.expanded && 'rotate-90')} />
                    {col.expanded ? (
                        <FolderOpen className="h-4 w-4 text-primary shrink-0" strokeWidth={2} />
                    ) : (
                        <FolderIcon className="h-4 w-4 text-primary shrink-0" strokeWidth={2} />
                    )}
                    {isRenaming ? (
                        <InlineEdit
                            defaultValue={col.name}
                            className="text-sm font-medium"
                            onSubmit={editApi.submitRename}
                            onCancel={editApi.clearEdit}
                        />
                    ) : (
                        <span className="flex-1 text-sm font-medium truncate">{col.name}</span>
                    )}
                    {!isRenaming && (
                        <RowActions
                            items={items}
                            testId={`collection-menu-${col.id}`}
                            indicator={col.favorite ? <Star className="h-3.5 w-3.5 fill-warning text-warning" /> : null}
                        />
                    )}
                </div>
            </ContextWrap>

            <AnimatePresence initial={false}>
                {col.expanded && (
                    <motion.div {...COLLAPSE_ANIM} className="overflow-hidden">
                        <div className="ml-3 pl-2 border-l border-sidebar-border">
                            {col.folders.length === 0 && (col.requests || []).length === 0 && !creatingFolder && !creatingReqHere && (
                                <div className="px-2 py-1.5 text-[12px] text-muted-foreground italic">Empty collection</div>
                            )}
                            {col.folders.map((folder) => (
                                <FolderRow
                                    key={folder.id}
                                    col={col}
                                    folder={folder}
                                    actions={actions}
                                    onOpenRequest={onOpenRequest}
                                    editApi={editApi}
                                    dnd={dnd}
                                    openConfirm={openConfirm}
                                />
                            ))}
                            {(col.requests || []).map((req) => (
                                <RequestRow
                                    key={req.id}
                                    col={col}
                                    folder={null}
                                    req={req}
                                    actions={actions}
                                    onOpenRequest={onOpenRequest}
                                    editApi={editApi}
                                    dnd={dnd}
                                    openConfirm={openConfirm}
                                />
                            ))}
                            {creatingReqHere && (
                                <div className="flex items-center gap-2 px-2 py-1.5">
                                    <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                    <InlineEdit
                                        placeholder="Request name"
                                        className="text-[13px]"
                                        onSubmit={editApi.submitCreate}
                                        onCancel={editApi.clearEdit}
                                    />
                                </div>
                            )}
                            {creatingFolder && (
                                <div className="flex items-center gap-1.5 px-2 py-1.5">
                                    <FolderIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                    <InlineEdit
                                        placeholder="Folder name"
                                        className="text-[13px]"
                                        onSubmit={editApi.submitCreate}
                                        onCancel={editApi.clearEdit}
                                    />
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

interface FolderRowProps {
    col: Collection;
    folder: Folder;
    actions: SidebarActions;
    onOpenRequest: SidebarProps['onOpenRequest'];
    editApi: EditApi;
    dnd: DndApi;
    openConfirm: SidebarProps['openConfirm'];
}

const FolderRow: React.FC<FolderRowProps> = ({ col, folder, actions, onOpenRequest, editApi, dnd, openConfirm }) => {
    const { edit } = editApi;
    const isRenaming = edit?.mode === 'rename' && edit.kind === 'folder' && edit.id === folder.id;
    const creatingReq = edit?.mode === 'create' && edit.kind === 'request' && edit.folderId === folder.id;
    const creatingSubFolder = edit?.mode === 'create' && edit.kind === 'subfolder' && edit.folderId === folder.id;

    const items: MenuEntry[] = [
        {
            label: 'Add Request',
            icon: FilePlus2,
            testId: `folder-add-request-${folder.id}`,
            onClick: async () => {
                if (!folder.expanded) await actions.toggleFolder(col.id, folder.id);
                editApi.startCreate('request', col.id, folder.id);
            },
        },
        {
            label: 'Add Folder',
            icon: FolderPlus,
            testId: `folder-add-subfolder-${folder.id}`,
            onClick: async () => {
                if (!folder.expanded) await actions.toggleFolder(col.id, folder.id);
                editApi.startCreate('subfolder', col.id, folder.id);
            },
        },
        {
            label: 'Collapse Folders',
            icon: ChevronsDownUp,
            testId: `folder-collapse-${folder.id}`,
            onClick: () => actions.collapseFolder(col.id, folder.id),
        },
        { separator: true },
        {
            label: 'Rename',
            icon: Pencil,
            testId: `folder-rename-${folder.id}`,
            onClick: () => editApi.startRename('folder', folder.id, col.id),
        },
        {
            label: 'Duplicate',
            icon: Copy,
            testId: `folder-duplicate-${folder.id}`,
            onClick: () => actions.duplicateFolder(col.id, folder.id),
        },
        { separator: true },
        {
            label: 'Delete',
            icon: Trash2,
            danger: true,
            testId: `folder-delete-${folder.id}`,
            onClick: () =>
                openConfirm({
                    title: `Delete "${folder.name}"?`,
                    description: 'This folder and its requests will be removed.',
                    onConfirm: () => actions.deleteFolder(col.id, folder.id),
                }),
        },
    ];

    return (
        <div>
            <ContextWrap items={items}>
                <div
                    className="group w-full flex items-center gap-1.5 px-2 py-1.5 rounded-md hover:bg-sidebar-hover transition-colors cursor-pointer"
                    draggable={!isRenaming}
                    onDragStart={dnd.start({ kind: 'folder', colId: col.id, folderId: folder.id })}
                    onDragOver={dnd.over}
                    onDrop={dnd.dropOnFolder(col.id, folder.id)}
                    onClick={() => !isRenaming && actions.toggleFolder(col.id, folder.id)}
                    onDoubleClick={(e) => {
                        e.stopPropagation();
                        editApi.startRename('folder', folder.id, col.id);
                    }}
                    data-testid={`folder-toggle-${folder.id}`}
                >
                    <ChevronRight className={cn('h-3 w-3 text-muted-foreground transition-transform shrink-0', folder.expanded && 'rotate-90')} />
                    {folder.expanded ? (
                        <FolderOpen className="h-3.5 w-3.5 text-muted-foreground shrink-0" strokeWidth={2} />
                    ) : (
                        <FolderIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" strokeWidth={2} />
                    )}
                    {isRenaming ? (
                        <InlineEdit
                            defaultValue={folder.name}
                            className="text-[13px]"
                            onSubmit={editApi.submitRename}
                            onCancel={editApi.clearEdit}
                        />
                    ) : (
                        <span className="flex-1 text-[13px] truncate">{folder.name}</span>
                    )}
                    {!isRenaming && (
                        <RowActions
                            items={items}
                            testId={`folder-menu-${folder.id}`}
                            indicator={<span className="text-[10px] text-muted-foreground px-1">{(folder.requests || []).length}</span>}
                        />
                    )}
                </div>
            </ContextWrap>

            <AnimatePresence initial={false}>
                {folder.expanded && (
                    <motion.div {...COLLAPSE_ANIM} className="overflow-hidden ml-3 pl-2 border-l border-sidebar-border">
                        {(folder.requests || []).length === 0 && (folder.folders || []).length === 0 && !creatingReq && !creatingSubFolder && (
                            <div className="px-2 py-1.5 text-[12px] text-muted-foreground italic">No requests</div>
                        )}
                        {(folder.folders || []).map((subFolder) => (
                            <FolderRow
                                key={subFolder.id}
                                col={col}
                                folder={subFolder}
                                actions={actions}
                                onOpenRequest={onOpenRequest}
                                editApi={editApi}
                                dnd={dnd}
                                openConfirm={openConfirm}
                            />
                        ))}
                        {(folder.requests || []).map((req) => (
                            <RequestRow
                                key={req.id}
                                col={col}
                                folder={folder}
                                req={req}
                                actions={actions}
                                onOpenRequest={onOpenRequest}
                                editApi={editApi}
                                dnd={dnd}
                                openConfirm={openConfirm}
                            />
                        ))}
                        {creatingSubFolder && (
                            <div className="flex items-center gap-1.5 px-2 py-1.5">
                                <FolderIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                <InlineEdit
                                    placeholder="Folder name"
                                    className="text-[13px]"
                                    onSubmit={editApi.submitCreate}
                                    onCancel={editApi.clearEdit}
                                />
                            </div>
                        )}
                        {creatingReq && (
                            <div className="flex items-center gap-2 px-2 py-1.5">
                                <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                <InlineEdit
                                    placeholder="Request name"
                                    onSubmit={editApi.submitCreate}
                                    onCancel={editApi.clearEdit}
                                />
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

interface RequestRowProps {
    col: Collection;
    folder: Folder | null;
    req: RequestSummary;
    actions: SidebarActions;
    onOpenRequest: SidebarProps['onOpenRequest'];
    editApi: EditApi;
    dnd: DndApi;
    openConfirm: SidebarProps['openConfirm'];
}

const RequestRow: React.FC<RequestRowProps> = ({ col, folder, req, actions, onOpenRequest, editApi, dnd, openConfirm }) => {
    const { edit } = editApi;
    const isRenaming = edit?.mode === 'rename' && edit.kind === 'request' && edit.id === req.id;
    const items: MenuEntry[] = [
        {
            label: 'Rename',
            icon: Pencil,
            testId: `request-rename-${req.id}`,
            onClick: () => editApi.startRename('request', req.id, col.id, folder?.id),
        },
        {
            label: 'Duplicate',
            icon: Copy,
            testId: `request-duplicate-${req.id}`,
            onClick: () => actions.duplicateRequest(col.id, folder?.id ?? null, req.id),
        },
        { separator: true },
        {
            label: 'Delete',
            icon: Trash2,
            danger: true,
            testId: `request-delete-${req.id}`,
            onClick: () =>
                openConfirm({
                    title: `Delete "${req.name}"?`,
                    description: 'This request will be removed from the collection.',
                    onConfirm: () => actions.deleteRequest(col.id, folder?.id ?? null, req.id),
                }),
        },
    ];

    return (
        <ContextWrap items={items}>
            <div
                data-testid={`request-item-${req.id}`}
                draggable={!isRenaming}
                onDragStart={dnd.start({ kind: 'request', colId: col.id, folderId: folder?.id, reqId: req.id })}
                onDragOver={dnd.over}
                onDrop={dnd.dropOnRequest(col.id, folder?.id, req.id)}
                onClick={() => !isRenaming && onOpenRequest({ ...req, colId: col.id, folderId: folder?.id ?? null })}
                onDoubleClick={(e) => {
                    e.stopPropagation();
                    editApi.startRename('request', req.id, col.id, folder?.id);
                }}
                className="group w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-sidebar-hover transition-colors text-left cursor-pointer"
            >
                <MethodLabel method={req.method} className="w-11 shrink-0 text-left" />
                {isRenaming ? (
                    <InlineEdit
                        defaultValue={req.name}
                        className="text-[13px] text-foreground/90"
                        onSubmit={editApi.submitRename}
                        onCancel={editApi.clearEdit}
                    />
                ) : (
                    <span className="flex-1 text-[13px] truncate text-foreground/90">{req.name}</span>
                )}
                {!isRenaming && <RowActions items={items} testId={`request-menu-${req.id}`} indicator={null} />}
            </div>
        </ContextWrap>
    );
};

interface HistoryViewProps {
    history: HistoryEntry[];
    onOpenRequest: SidebarProps['onOpenRequest'];
}

const HistoryView: React.FC<HistoryViewProps> = ({ history, onOpenRequest }) => (
    <div className="space-y-0.5">
        <div className="px-2 py-1.5 text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Today</div>
        {history.map((h) => (
            <button
                key={h.id}
                onClick={() => onOpenRequest({ name: h.url.split('/').pop() || h.url, method: h.method, url: h.url })}
                className="w-full flex items-center gap-2 px-2 py-2 rounded-md hover:bg-sidebar-hover transition-colors text-left"
            >
                <MethodLabel method={h.method} className="w-11 shrink-0" />
                <div className="flex-1 min-w-0">
                    <div className="text-[13px] truncate">{h.url}</div>
                    <div className="text-[11px] text-muted-foreground">{h.time}</div>
                </div>
            </button>
        ))}
    </div>
);

interface EnvironmentsViewProps {
    actions: SidebarActions;
    search: string;
    editApi: EditApi;
    onOpenEnvironment: SidebarProps['onOpenEnvironment'];
    openConfirm: SidebarProps['openConfirm'];
}

const EnvironmentsView: React.FC<EnvironmentsViewProps> = ({ actions, search, editApi, onOpenEnvironment, openConfirm }) => {
    const { edit } = editApi;
    const creating = edit?.mode === 'create' && edit.kind === 'environment';

    const q = (search || '').toLowerCase();
    const filtered = actions.environments.filter((e) => e.name.toLowerCase().includes(q));

    if (actions.environments.length === 0 && !creating) {
        return <EmptyView label="environments" onCreate={() => editApi.startCreate('environment')} />;
    }

    return (
        <div className="space-y-1">
            {creating && (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-sidebar-border bg-card">
                    <Globe className="h-4 w-4 text-primary shrink-0" />
                    <InlineEdit
                        placeholder="Environment name"
                        className="text-sm font-medium"
                        onSubmit={editApi.submitCreate}
                        onCancel={editApi.clearEdit}
                    />
                </div>
            )}
            {filtered.map((e) => {
                const isRenaming = edit?.mode === 'rename' && edit.kind === 'environment' && edit.id === e.id;
                const items: MenuEntry[] = [
                    {
                        label: 'Set active',
                        icon: CheckCircle2,
                        testId: `environment-activate-${e.id}`,
                        onClick: () => actions.setActiveEnvironment(e.id),
                    },
                    {
                        label: 'Rename',
                        icon: Pencil,
                        testId: `environment-rename-${e.id}`,
                        onClick: () => editApi.startRename('environment', e.id),
                    },
                    {
                        label: 'Duplicate',
                        icon: Copy,
                        testId: `environment-duplicate-${e.id}`,
                        onClick: () => actions.duplicateEnvironment(e.id),
                    },
                    { separator: true },
                    {
                        label: 'Delete',
                        icon: Trash2,
                        danger: true,
                        testId: `environment-delete-${e.id}`,
                        onClick: () =>
                            openConfirm({
                                title: `Delete "${e.name}"?`,
                                description: 'This environment will be removed.',
                                onConfirm: () => actions.deleteEnvironment(e.id),
                            }),
                    },
                ];
                const varCount = (e.variables || []).filter((v) => v.key).length;
                return (
                    <ContextWrap key={e.id} items={items}>
                        <div
                            data-testid={`environment-item-${e.id}`}
                            onClick={() => !isRenaming && onOpenEnvironment(e)}
                            onDoubleClick={(ev) => {
                                ev.stopPropagation();
                                editApi.startRename('environment', e.id);
                            }}
                            className="group flex items-center gap-2 px-3 py-2.5 rounded-lg border border-sidebar-border bg-card hover:bg-sidebar-hover transition-colors cursor-pointer"
                        >
                            <Globe className="h-4 w-4 text-primary shrink-0" />
                            <div className="flex-1 min-w-0">
                                {isRenaming ? (
                                    <InlineEdit
                                        defaultValue={e.name}
                                        className="text-sm font-medium"
                                        onSubmit={editApi.submitRename}
                                        onCancel={editApi.clearEdit}
                                    />
                                ) : (
                                    <div className="text-sm font-medium truncate">{e.name}</div>
                                )}
                                <div className="text-[11px] text-muted-foreground">
                                    {varCount} variable{varCount === 1 ? '' : 's'}
                                </div>
                            </div>
                            {!isRenaming && (
                                <RowActions
                                    items={items}
                                    testId={`environment-menu-${e.id}`}
                                    indicator={
                                        e.active ? (
                                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-success-soft text-success font-semibold">
                                                Active
                                            </span>
                                        ) : null
                                    }
                                />
                            )}
                        </div>
                    </ContextWrap>
                );
            })}
        </div>
    );
};

const EmptyView: React.FC<{ label: string; onCreate?: () => void }> = ({ label, onCreate }) => (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="h-12 w-12 rounded-xl bg-primary-soft flex items-center justify-center mb-3">
            <Boxes className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-sm font-semibold mb-1">No {label} yet</h3>
        <p className="text-xs text-muted-foreground mb-4">Create one to get started</p>
        {onCreate && (
            <Button size="sm" variant="outline" className="gap-1.5" onClick={onCreate} data-testid="empty-create-btn">
                <Plus className="h-3.5 w-3.5" /> New
            </Button>
        )}
    </div>
);
