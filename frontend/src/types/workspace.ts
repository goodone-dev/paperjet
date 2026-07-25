export interface Workspace {
    id: string;
    name: string;
}

export interface WorkspaceState {
    workspaces: Workspace[];
    activeWorkspaceId: string | null;
}
