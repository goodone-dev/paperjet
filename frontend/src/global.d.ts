// Type shim for shadcn/ui components (kept as .jsx per user preference).
// This declares all @/components/ui/* modules as permissive React component modules
// so consuming .tsx files can use children/props freely.

declare module '@/components/ui/*' {
    import type { ComponentType, PropsWithChildren, HTMLAttributes } from 'react';
    type AnyProps = PropsWithChildren<HTMLAttributes<HTMLElement> & Record<string, any>>;
    const anyComponent: ComponentType<AnyProps>;
    export const Button: ComponentType<AnyProps>;
    export const Input: ComponentType<AnyProps>;
    export const Textarea: ComponentType<AnyProps>;
    export const Label: ComponentType<AnyProps>;
    export const Checkbox: ComponentType<AnyProps>;
    export const Badge: ComponentType<AnyProps>;
    export const ScrollArea: ComponentType<AnyProps>;
    export const Avatar: ComponentType<AnyProps>;
    export const AvatarFallback: ComponentType<AnyProps>;
    export const Toaster: ComponentType<AnyProps>;
    export const Tabs: ComponentType<AnyProps>;
    export const TabsList: ComponentType<AnyProps>;
    export const TabsTrigger: ComponentType<AnyProps>;
    export const TabsContent: ComponentType<AnyProps>;
    export const RadioGroup: ComponentType<AnyProps>;
    export const RadioGroupItem: ComponentType<AnyProps>;
    export const Select: ComponentType<AnyProps>;
    export const SelectTrigger: ComponentType<AnyProps>;
    export const SelectValue: ComponentType<AnyProps>;
    export const SelectContent: ComponentType<AnyProps>;
    export const SelectItem: ComponentType<AnyProps>;
    export const Dialog: ComponentType<AnyProps>;
    export const DialogContent: ComponentType<AnyProps>;
    export const DialogHeader: ComponentType<AnyProps>;
    export const DialogTitle: ComponentType<AnyProps>;
    export const DialogDescription: ComponentType<AnyProps>;
    export const AlertDialog: ComponentType<AnyProps>;
    export const AlertDialogContent: ComponentType<AnyProps>;
    export const AlertDialogHeader: ComponentType<AnyProps>;
    export const AlertDialogFooter: ComponentType<AnyProps>;
    export const AlertDialogTitle: ComponentType<AnyProps>;
    export const AlertDialogDescription: ComponentType<AnyProps>;
    export const AlertDialogAction: ComponentType<AnyProps>;
    export const AlertDialogCancel: ComponentType<AnyProps>;
    export const DropdownMenu: ComponentType<AnyProps>;
    export const DropdownMenuTrigger: ComponentType<AnyProps>;
    export const DropdownMenuContent: ComponentType<AnyProps>;
    export const DropdownMenuItem: ComponentType<AnyProps>;
    export const DropdownMenuLabel: ComponentType<AnyProps>;
    export const DropdownMenuSeparator: ComponentType<AnyProps>;
    export const ContextMenu: ComponentType<AnyProps>;
    export const ContextMenuTrigger: ComponentType<AnyProps>;
    export const ContextMenuContent: ComponentType<AnyProps>;
    export const ContextMenuItem: ComponentType<AnyProps>;
    export const ContextMenuSeparator: ComponentType<AnyProps>;
    export const Popover: ComponentType<AnyProps>;
    export const PopoverTrigger: ComponentType<AnyProps>;
    export const PopoverContent: ComponentType<AnyProps>;
    export const Tooltip: ComponentType<AnyProps>;
    export const TooltipContent: ComponentType<AnyProps>;
    export const TooltipProvider: ComponentType<AnyProps>;
    export const TooltipTrigger: ComponentType<AnyProps>;
    export default anyComponent;
}

// Untyped Wails-generated JS bindings (kept as .js per user preference).
declare module '@/wailsjs/go/main/App' {
    const bindings: Record<string, (...args: any[]) => Promise<any>>;
    export = bindings;
    // Named exports (typed loosely — refer to backend for actual signatures)
    export function ListWorkspaces(): Promise<any[]>;
    export function CreateWorkspace(payload: any): Promise<any>;
    export function RenameWorkspace(id: string, name: string): Promise<any>;
    export function DeleteWorkspace(id: string, name: string): Promise<void>;
    export function ListEnvironments(workspaceId: string): Promise<any[]>;
    export function CreateEnvironment(payload: any): Promise<any>;
    export function UpdateEnvironment(id: string, payload: any): Promise<any>;
    export function RenameEnvironment(id: string, payload: any): Promise<any>;
    export function DeleteEnvironment(id: string, name: string): Promise<void>;
    export function DuplicateEnvironment(id: string): Promise<any>;
    export function ListCollections(workspaceId: string): Promise<any[]>;
    export function GetCollection(id: string): Promise<any>;
    export function CreateCollection(payload: any): Promise<any>;
    export function RenameCollection(id: string, name: string): Promise<any>;
    export function DeleteCollection(id: string, name: string): Promise<void>;
    export function DuplicateCollection(id: string): Promise<any>;
    export function UpdateCollectionFavorite(id: string, favorite: boolean): Promise<any>;
    export function MoveCollection(id: string, payload: any): Promise<any>;
    export function CreateFolder(payload: any): Promise<any>;
    export function RenameFolder(id: string, payload: any): Promise<any>;
    export function DeleteFolder(id: string, name: string): Promise<void>;
    export function DuplicateFolder(id: string): Promise<any>;
    export function CreateRequest(payload: any): Promise<any>;
    export function GetRequest(id: string): Promise<any>;
    export function UpdateRequest(id: string, payload: any): Promise<any>;
    export function RenameRequest(id: string, payload: any): Promise<any>;
    export function DeleteRequest(id: string, method: string, name: string): Promise<void>;
    export function DuplicateRequest(id: string): Promise<any>;
    export function SendRequest(payload: any): Promise<any>;
}
