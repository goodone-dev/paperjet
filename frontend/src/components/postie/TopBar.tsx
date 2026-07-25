import React, { useState } from 'react';
import { Search, Settings, Bell, HelpCircle, Sparkles, ChevronDown, Boxes, Check, Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { InlineEdit } from './InlineEdit';
import type { Workspace } from '@/types/workspace';
import type { Environment } from '@/types/environment';
import type { ConfirmDialogConfig } from './CrudDialogs';

interface TopBarProps {
    workspaces: Workspace[];
    activeWorkspace: Workspace | undefined;
    environments: Environment[];
    activeEnv: Environment | undefined;
    onEnvChange: (id: string) => void;
    onSelectWorkspace: (id: string) => void;
    openConfirm: (config: ConfirmDialogConfig) => void;
    addWorkspace: (name: string) => void;
    renameWorkspace: (id: string, name: string) => void;
    deleteWorkspace: (id: string) => void;
}

export const TopBar: React.FC<TopBarProps> = ({
    workspaces,
    activeWorkspace,
    environments,
    activeEnv,
    onEnvChange,
    onSelectWorkspace,
    openConfirm,
    addWorkspace,
    renameWorkspace,
    deleteWorkspace,
}) => {
    const [wsOpen, setWsOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [renamingId, setRenamingId] = useState<string | null>(null);

    const select = (id: string) => {
        onSelectWorkspace(id);
        setWsOpen(false);
    };
    const requestDelete = (w: Workspace) =>
        openConfirm({
            title: `Delete "${w.name}"?`,
            description: 'This workspace and all of its collections and environments will be removed.',
            onConfirm: () => deleteWorkspace(w.id),
        });

    return (
        <header className="h-14 shrink-0 border-b border-border bg-card/80 backdrop-blur-xl px-4 flex items-center gap-4 z-30 relative">
            <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="flex items-center gap-2.5 shrink-0">
                    <div className="relative">
                        <div className="h-9 w-9 rounded-xl bg-gradient-primary flex items-center justify-center shadow-elegant">
                            <Boxes className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
                        </div>
                        <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-success border-2 border-card" />
                    </div>
                    <div className="hidden sm:block">
                        <div className="text-[15px] font-semibold leading-tight text-foreground">Postie</div>
                        <div className="text-[10px] text-muted-foreground leading-tight">API Workspace</div>
                    </div>
                </div>

                <Popover open={wsOpen} onOpenChange={setWsOpen}>
                    <PopoverTrigger asChild>
                        <Button data-testid="workspace-switcher-trigger" variant="ghost" size="sm" className="gap-2 text-sm font-medium max-w-[220px]">
                            <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                            <span className="truncate">{activeWorkspace?.name || 'Workspace'}</span>
                            <ChevronDown className="h-3.5 w-3.5 opacity-60 shrink-0" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent align="start" className="w-72 p-2">
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Workspaces</div>
                        <div className="space-y-0.5 max-h-72 overflow-auto">
                            {workspaces.map((w) => {
                                const isRenaming = renamingId === w.id;
                                return (
                                    <div
                                        key={w.id}
                                        data-testid={`workspace-item-${w.id}`}
                                        onClick={() => !isRenaming && select(w.id)}
                                        className="group flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-secondary/60 cursor-pointer"
                                    >
                                        <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                                        {isRenaming ? (
                                            <InlineEdit
                                                defaultValue={w.name}
                                                className="text-[13px]"
                                                onSubmit={(name) => {
                                                    renameWorkspace(w.id, name);
                                                    setRenamingId(null);
                                                }}
                                                onCancel={() => setRenamingId(null)}
                                            />
                                        ) : (
                                            <span className="flex-1 text-[13px] truncate">{w.name}</span>
                                        )}
                                        {!isRenaming && (
                                            <div className="flex items-center gap-0.5 h-5 shrink-0">
                                                {w.id === activeWorkspace?.id && (
                                                    <Check className="h-3.5 w-3.5 text-primary mr-1 group-hover:hidden" />
                                                )}
                                                <button
                                                    data-testid={`workspace-rename-${w.id}`}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setRenamingId(w.id);
                                                    }}
                                                    className="h-5 w-5 rounded items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted hidden group-hover:flex"
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </button>
                                                {workspaces.length > 1 && (
                                                    <button
                                                        data-testid={`workspace-delete-${w.id}`}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            requestDelete(w);
                                                        }}
                                                        className="h-5 w-5 rounded items-center justify-center text-muted-foreground hover:text-destructive hover:bg-muted hidden group-hover:flex"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        <div className="border-t border-border mt-1 pt-1">
                            {creating ? (
                                <div className="flex items-center gap-2 px-2 py-1.5">
                                    <Plus className="h-3.5 w-3.5 text-muted-foreground" />
                                    <InlineEdit
                                        placeholder="Workspace name"
                                        className="text-[13px]"
                                        onSubmit={(name) => {
                                            addWorkspace(name);
                                            setCreating(false);
                                            setWsOpen(false);
                                        }}
                                        onCancel={() => setCreating(false)}
                                    />
                                </div>
                            ) : (
                                <button
                                    data-testid="workspace-create"
                                    onClick={() => setCreating(true)}
                                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-[13px] text-foreground hover:bg-secondary/60"
                                >
                                    <Plus className="h-3.5 w-3.5" /> Create new workspace
                                </button>
                            )}
                        </div>
                    </PopoverContent>
                </Popover>
            </div>

            <div className="flex-1 max-w-md relative min-w-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search collections, requests, environments…"
                    className="pl-9 h-9 bg-secondary/60 border-transparent focus-visible:bg-card focus-visible:border-border text-sm"
                />
                <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground bg-card border border-border rounded px-1.5 py-0.5 mono">⌘K</kbd>
            </div>

            <div className="flex items-center gap-1.5 flex-1 justify-end">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button data-testid="env-selector-trigger" variant="outline" size="sm" className="gap-2 bg-card font-medium">
                            <span className="h-1.5 w-1.5 rounded-full bg-warning" />
                            <span className="hidden md:inline max-w-[120px] truncate">{activeEnv?.name || 'No environment'}</span>
                            <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>Environment</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {environments.map((e) => (
                            <DropdownMenuItem key={e.id} data-testid={`env-option-${e.id}`} onClick={() => onEnvChange(e.id)}>
                                <span className="h-1.5 w-1.5 rounded-full mr-2 bg-primary" />
                                {e.name}
                                {e.active && <Check className="ml-auto h-3.5 w-3.5 text-primary" />}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>

                <Button variant="ghost" size="sm" disabled className="gap-1.5 text-primary hidden md:inline-flex opacity-50 cursor-not-allowed">
                    <Sparkles className="h-4 w-4" />
                    Upgrade
                </Button>
                <Button variant="ghost" size="icon" disabled className="h-9 w-9 opacity-50 cursor-not-allowed">
                    <Bell className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" disabled className="h-9 w-9 opacity-50 cursor-not-allowed">
                    <HelpCircle className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" disabled className="h-9 w-9 opacity-50 cursor-not-allowed">
                    <Settings className="h-4 w-4" />
                </Button>
                <Avatar className="h-8 w-8 ring-2 ring-primary-soft opacity-50 cursor-not-allowed">
                    <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs font-semibold">JD</AvatarFallback>
                </Avatar>
            </div>
        </header>
    );
};
