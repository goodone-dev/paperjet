/**
 * Type-safe boundary for Wails-generated bindings.
 *
 * The auto-generated `wailsjs/go/models.ts` describes Go UUIDs as `number[]`
 * (because Go serialises `[16]byte`), but at runtime every ID is a string.
 * This module re-exports the raw bindings with hand-written signatures that
 * reflect the actual JSON payloads received in the browser.
 *
 * All application code MUST import backend calls from `@/lib/api` — never
 * directly from `@/wailsjs/go/main/App`.
 */
import * as raw from '@/wailsjs/go/main/App';
import type { Workspace } from '@/types/workspace';
import type { BackendKeyValue, AuthConfig, BodyConfig } from '@/types/collection';
import type { EnvVariable } from '@/types/environment';

// ─── Wire shapes (what the backend actually sends over the JSON bridge) ───

export interface WireRequestNode {
    id: string;
    name: string;
    method: string;
    sort_order?: string;
}

export interface WireFolderNode {
    id: string;
    name: string;
    sort_order?: string;
    folders: WireFolderNode[];
    requests: WireRequestNode[];
}

export interface WireCollectionResponse {
    id: string;
    name: string;
    slug: string;
    is_favorite: boolean;
    sort_order: string;
    folders: WireFolderNode[];
    requests: WireRequestNode[];
}

export interface WireRequestResponse {
    id: string;
    collection_id: string;
    folder_id?: string;
    name: string;
    slug: string;
    method: string;
    url: string;
    params: BackendKeyValue[];
    path_variables: BackendKeyValue[];
    auth: AuthConfig;
    headers: BackendKeyValue[];
    body: BodyConfig;
}

export interface WireFolderResponse {
    id: string;
    collection_id: string;
    parent_id?: string;
    name: string;
    slug: string;
    sort_order: string;
    idx: number;
}

export interface WireEnvironmentResponse {
    id: string;
    workspace_id: string;
    name: string;
    slug: string;
    variables: EnvVariable[];
}

export interface WireWorkspaceResponse {
    id: string;
    name: string;
    slug: string;
}

export interface WireProxyPayload {
    url: string;
    method: string;
    headers: Record<string, string>;
    body: string;
}

export interface WireProxyResponse {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    body: string;
}

// ─── Payload shapes for outgoing requests ────────────────────────────────

export interface CreateCollectionPayload {
    workspace_id: string;
    name: string;
}

export interface CreateFolderPayload {
    collection_id: string;
    parent_id?: string;
    name: string;
}

export interface CreateRequestPayload {
    collection_id: string;
    folder_id: string | null;
    name: string;
    method: string;
    url: string;
    params: BackendKeyValue[];
    path_variables: BackendKeyValue[];
    auth: AuthConfig;
    headers: BackendKeyValue[];
    body: BodyConfig;
}

export interface UpdateRequestPayload {
    name: string;
    method: string;
    url: string;
    params: BackendKeyValue[];
    path_variables: BackendKeyValue[];
    auth: AuthConfig;
    headers: BackendKeyValue[];
    body: BodyConfig;
}

export interface RenameFolderPayload {
    name: string;
}
export interface RenameRequestPayload {
    name: string;
}
export interface CreateEnvironmentPayload {
    workspace_id: string;
    name: string;
    variables?: EnvVariable[];
}
export interface UpdateEnvironmentPayload {
    name?: string;
    variables: EnvVariable[];
}
export interface RenameEnvironmentPayload {
    name: string;
}
export interface CreateWorkspacePayload {
    name: string;
}
export interface MoveCollectionPayload {
    target_workspace_id: string;
}

// ─── Typed bindings ──────────────────────────────────────────────────────

// The raw `wailsjs` module is generated JavaScript; we cast it once here so
// every call site downstream sees the accurate signature.
type Raw = Record<string, (...args: any[]) => Promise<any>>;
const api = raw as unknown as Raw;

// Workspaces
export const ListWorkspaces = (): Promise<WireWorkspaceResponse[]> => api.ListWorkspaces();
export const CreateWorkspace = (payload: CreateWorkspacePayload): Promise<WireWorkspaceResponse> =>
    api.CreateWorkspace(payload);
export const RenameWorkspace = (id: string, name: string): Promise<WireWorkspaceResponse> =>
    api.RenameWorkspace(id, name);
export const DeleteWorkspace = (id: string, name: string): Promise<void> => api.DeleteWorkspace(id, name);
export const GetWorkspace = (id: string): Promise<WireWorkspaceResponse> => api.GetWorkspace(id);

// Environments
export const ListEnvironments = (workspaceId: string): Promise<WireEnvironmentResponse[]> =>
    api.ListEnvironments(workspaceId);
export const CreateEnvironment = (payload: CreateEnvironmentPayload): Promise<WireEnvironmentResponse> =>
    api.CreateEnvironment(payload);
export const UpdateEnvironment = (id: string, payload: UpdateEnvironmentPayload): Promise<WireEnvironmentResponse> =>
    api.UpdateEnvironment(id, payload);
export const RenameEnvironment = (id: string, payload: RenameEnvironmentPayload): Promise<WireEnvironmentResponse> =>
    api.RenameEnvironment(id, payload);
export const DeleteEnvironment = (id: string, name: string): Promise<void> => api.DeleteEnvironment(id, name);
export const DuplicateEnvironment = (id: string): Promise<WireEnvironmentResponse> => api.DuplicateEnvironment(id);

// Collections
export const ListCollections = (workspaceId: string): Promise<WireCollectionResponse[]> =>
    api.ListCollections(workspaceId);
export const GetCollection = (id: string): Promise<WireCollectionResponse> => api.GetCollection(id);
export const CreateCollection = (payload: CreateCollectionPayload): Promise<WireCollectionResponse> =>
    api.CreateCollection(payload);
export const RenameCollection = (id: string, name: string): Promise<WireCollectionResponse> =>
    api.RenameCollection(id, name);
export const DeleteCollection = (id: string, name: string): Promise<void> => api.DeleteCollection(id, name);
export const DuplicateCollection = (id: string): Promise<WireCollectionResponse> => api.DuplicateCollection(id);
export const UpdateCollectionFavorite = (id: string, favorite: boolean): Promise<WireCollectionResponse> =>
    api.UpdateCollectionFavorite(id, favorite);
export const MoveCollection = (id: string, payload: MoveCollectionPayload): Promise<WireCollectionResponse> =>
    api.MoveCollection(id, payload);

// Folders
export const CreateFolder = (payload: CreateFolderPayload): Promise<WireFolderResponse> => api.CreateFolder(payload);
export const RenameFolder = (id: string, payload: RenameFolderPayload): Promise<WireFolderResponse> =>
    api.RenameFolder(id, payload);
export const DeleteFolder = (id: string, name: string): Promise<void> => api.DeleteFolder(id, name);
export const DuplicateFolder = (id: string): Promise<WireFolderResponse> => api.DuplicateFolder(id);

// Requests
export const GetRequest = (id: string): Promise<WireRequestResponse> => api.GetRequest(id);
export const CreateRequest = (payload: CreateRequestPayload): Promise<WireRequestResponse> => api.CreateRequest(payload);
export const UpdateRequest = (id: string, payload: UpdateRequestPayload): Promise<WireRequestResponse> =>
    api.UpdateRequest(id, payload);
export const RenameRequest = (id: string, payload: RenameRequestPayload): Promise<WireRequestResponse> =>
    api.RenameRequest(id, payload);
export const DeleteRequest = (id: string, method: string, name: string): Promise<void> =>
    api.DeleteRequest(id, method, name);
export const DuplicateRequest = (id: string): Promise<WireRequestResponse> => api.DuplicateRequest(id);

// Proxy (Send)
export const SendRequest = (payload: WireProxyPayload): Promise<WireProxyResponse> => api.SendRequest(payload);

// Re-export the runtime Workspace type for convenience — the wire shape
// carries a `slug` that the UI doesn't need, so callers usually widen to Workspace.
export type { Workspace };
