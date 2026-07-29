// Preview-only Wails runtime shim.
//
// PaperJet is a Wails desktop app; when run in the browser preview (or in tests)
// the `window.go` bridge doesn't exist and every backend call throws
// "Cannot read properties of undefined (reading 'main')".
//
// This shim exposes a minimal, in-memory backend that mimics the JSON shapes
// the real Go bindings return, so the UI is fully usable end-to-end in the
// browser preview. In an actual Wails build, `window.go` is provided by the
// runtime long before this module runs and the shim is skipped.
type ID = string;

const uid = (prefix = 'id') => `${prefix}-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;
const slugify = (s: string) => (s || '').toLowerCase().replace(/\s+/g, '-');

interface KV {
    key: string;
    value: string;
    description?: string;
    enabled?: boolean;
}

interface WsRequest {
    id: ID;
    collection_id: ID;
    folder_id: ID | null;
    name: string;
    slug: string;
    method: string;
    url: string;
    params: KV[];
    path_variables: KV[];
    auth: any;
    headers: KV[];
    body: any;
}

interface WsFolder {
    id: ID;
    collection_id: ID;
    parent_id: ID | null;
    name: string;
    slug: string;
    sort_order: string;
    idx: number;
}

interface WsCollection {
    id: ID;
    name: string;
    slug: string;
    workspace_id: ID;
    is_favorite: boolean;
    sort_order: string;
    folders: WsFolder[];
    requests: WsRequest[];
}

interface WsEnvironment {
    id: ID;
    workspace_id: ID;
    name: string;
    slug: string;
    variables: KV[];
}

interface WsWorkspace {
    id: ID;
    name: string;
    slug: string;
}

const STORAGE_KEY = 'paperjet:preview-mock-db';

interface DB {
    workspaces: WsWorkspace[];
    collections: WsCollection[];
    environments: WsEnvironment[];
}

function loadDB(): DB {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw) as DB;
    } catch {
        // Fall through to seed.
    }
    const wsId = uid('ws');
    const colId = uid('col');
    const folderId = uid('folder');
    return {
        workspaces: [{ id: wsId, name: 'Personal Workspace', slug: 'personal-workspace' }],
        collections: [
            {
                id: colId,
                workspace_id: wsId,
                name: 'Sample Collection',
                slug: 'sample-collection',
                is_favorite: false,
                sort_order: 'a',
                folders: [
                    { id: folderId, collection_id: colId, parent_id: null, name: 'Auth', slug: 'auth', sort_order: 'a', idx: 0 },
                ],
                requests: [
                    {
                        id: uid('req'),
                        collection_id: colId,
                        folder_id: folderId,
                        name: 'Sign In',
                        slug: 'sign-in',
                        method: 'POST',
                        url: 'https://example.com/api/signin',
                        params: [],
                        path_variables: [],
                        auth: { type: 'none' },
                        headers: [],
                        body: { type: 'none' },
                    },
                ],
            },
        ],
        environments: [{ id: uid('env'), workspace_id: wsId, name: 'Development', slug: 'development', variables: [] }],
    };
}

let db: DB = loadDB();
function persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

// Build the collection tree returned by ListCollections / GetCollection.
function serializeCollection(c: WsCollection) {
    const rootFolders = c.folders.filter((f) => f.parent_id === null);
    const buildFolder = (f: WsFolder): any => {
        const children = c.folders.filter((sf) => sf.parent_id === f.id).map(buildFolder);
        const reqs = c.requests.filter((r) => r.folder_id === f.id).map((r) => ({
            id: r.id,
            name: r.name,
            method: r.method,
            slug: r.slug,
        }));
        return { id: f.id, name: f.name, slug: f.slug, sort_order: f.sort_order, folders: children, requests: reqs };
    };
    const rootReqs = c.requests.filter((r) => r.folder_id === null).map((r) => ({
        id: r.id,
        name: r.name,
        method: r.method,
        slug: r.slug,
    }));
    return {
        id: c.id,
        name: c.name,
        slug: c.slug,
        is_favorite: c.is_favorite,
        sort_order: c.sort_order,
        folders: rootFolders.map(buildFolder),
        requests: rootReqs,
    };
}

const shim = {
    // Workspaces
    ListWorkspaces: async () => db.workspaces,
    CreateWorkspace: async (p: any) => {
        const w = { id: uid('ws'), name: p.name, slug: slugify(p.name) };
        db.workspaces.push(w);
        persist();
        return w;
    },
    RenameWorkspace: async (id: ID, name: string) => {
        const w = db.workspaces.find((x) => x.id === id);
        if (w) {
            w.name = name;
            w.slug = slugify(name);
        }
        persist();
        return w;
    },
    DeleteWorkspace: async (id: ID) => {
        db.workspaces = db.workspaces.filter((w) => w.id !== id);
        db.collections = db.collections.filter((c) => c.workspace_id !== id);
        db.environments = db.environments.filter((e) => e.workspace_id !== id);
        persist();
    },
    GetWorkspace: async (id: ID) => db.workspaces.find((w) => w.id === id),

    // Environments
    ListEnvironments: async (wsId: ID) => db.environments.filter((e) => e.workspace_id === wsId),
    CreateEnvironment: async (p: any) => {
        const e = { id: uid('env'), workspace_id: p.workspace_id, name: p.name, slug: slugify(p.name), variables: p.variables ?? [] };
        db.environments.push(e);
        persist();
        return e;
    },
    UpdateEnvironment: async (id: ID, p: any) => {
        const e = db.environments.find((x) => x.id === id);
        if (e) {
            if (p.name != null) e.name = p.name;
            if (p.variables != null) e.variables = p.variables;
            e.slug = slugify(e.name);
        }
        persist();
        return e;
    },
    RenameEnvironment: async (id: ID, p: any) => {
        const e = db.environments.find((x) => x.id === id);
        if (e) {
            e.name = p.name;
            e.slug = slugify(p.name);
        }
        persist();
        return e;
    },
    DeleteEnvironment: async (id: ID) => {
        db.environments = db.environments.filter((e) => e.id !== id);
        persist();
    },
    DuplicateEnvironment: async (id: ID) => {
        const e = db.environments.find((x) => x.id === id);
        if (!e) return null;
        const copy = { ...e, id: uid('env'), name: `${e.name} (copy)`, slug: `${e.slug}-copy`, variables: [...e.variables] };
        db.environments.push(copy);
        persist();
        return copy;
    },

    // Collections
    ListCollections: async (wsId: ID) => db.collections.filter((c) => c.workspace_id === wsId).map(serializeCollection),
    GetCollection: async (id: ID) => {
        const c = db.collections.find((x) => x.id === id);
        return c ? serializeCollection(c) : null;
    },
    CreateCollection: async (p: any) => {
        const c: WsCollection = {
            id: uid('col'),
            workspace_id: p.workspace_id,
            name: p.name,
            slug: slugify(p.name),
            is_favorite: false,
            sort_order: 'a',
            folders: [],
            requests: [],
        };
        db.collections.push(c);
        persist();
        return serializeCollection(c);
    },
    RenameCollection: async (id: ID, name: string) => {
        const c = db.collections.find((x) => x.id === id);
        if (c) {
            c.name = name;
            c.slug = slugify(name);
        }
        persist();
        return c ? serializeCollection(c) : null;
    },
    DeleteCollection: async (id: ID) => {
        db.collections = db.collections.filter((c) => c.id !== id);
        persist();
    },
    DuplicateCollection: async (id: ID) => {
        const c = db.collections.find((x) => x.id === id);
        if (!c) return null;
        const newColId = uid('col');
        const folderMap = new Map<ID, ID>();
        const newFolders: WsFolder[] = c.folders.map((f) => {
            const newId = uid('folder');
            folderMap.set(f.id, newId);
            return { ...f, id: newId, collection_id: newColId };
        }).map((f) => ({ ...f, parent_id: f.parent_id ? folderMap.get(f.parent_id) ?? null : null }));
        const newRequests: WsRequest[] = c.requests.map((r) => ({
            ...r,
            id: uid('req'),
            collection_id: newColId,
            folder_id: r.folder_id ? folderMap.get(r.folder_id) ?? null : null,
        }));
        const copy: WsCollection = {
            id: newColId,
            workspace_id: c.workspace_id,
            name: `${c.name} (copy)`,
            slug: `${c.slug}-copy`,
            is_favorite: false,
            sort_order: c.sort_order,
            folders: newFolders,
            requests: newRequests,
        };
        db.collections.push(copy);
        persist();
        return serializeCollection(copy);
    },
    UpdateCollectionFavorite: async (id: ID, fav: boolean) => {
        const c = db.collections.find((x) => x.id === id);
        if (c) c.is_favorite = fav;
        persist();
        return c ? serializeCollection(c) : null;
    },
    MoveCollection: async (id: ID, p: any) => {
        const c = db.collections.find((x) => x.id === id);
        if (c) c.workspace_id = p.target_workspace_id;
        persist();
        return c ? serializeCollection(c) : null;
    },

    // Folders
    CreateFolder: async (p: any) => {
        const c = db.collections.find((x) => x.id === p.collection_id);
        if (!c) return null;
        const f: WsFolder = {
            id: uid('folder'),
            collection_id: c.id,
            parent_id: p.parent_id ?? null,
            name: p.name,
            slug: slugify(p.name),
            sort_order: 'a',
            idx: c.folders.length,
        };
        c.folders.push(f);
        persist();
        return f;
    },
    RenameFolder: async (id: ID, p: any) => {
        for (const c of db.collections) {
            const f = c.folders.find((x) => x.id === id);
            if (f) {
                f.name = p.name;
                f.slug = slugify(p.name);
                persist();
                return f;
            }
        }
        return null;
    },
    DeleteFolder: async (id: ID) => {
        for (const c of db.collections) {
            const before = c.folders.length;
            const toRemove = new Set<ID>([id]);
            // cascade child folders
            let grew = true;
            while (grew) {
                grew = false;
                for (const f of c.folders) {
                    if (f.parent_id && toRemove.has(f.parent_id) && !toRemove.has(f.id)) {
                        toRemove.add(f.id);
                        grew = true;
                    }
                }
            }
            c.folders = c.folders.filter((f) => !toRemove.has(f.id));
            c.requests = c.requests.filter((r) => !r.folder_id || !toRemove.has(r.folder_id));
            if (c.folders.length !== before) break;
        }
        persist();
    },
    DuplicateFolder: async (id: ID) => {
        for (const c of db.collections) {
            const root = c.folders.find((x) => x.id === id);
            if (!root) continue;
            // Gather subtree ids
            const subtree = new Set<ID>([root.id]);
            let grew = true;
            while (grew) {
                grew = false;
                for (const f of c.folders) {
                    if (f.parent_id && subtree.has(f.parent_id) && !subtree.has(f.id)) {
                        subtree.add(f.id);
                        grew = true;
                    }
                }
            }
            const idMap = new Map<ID, ID>();
            const newRoot: WsFolder = { ...root, id: uid('folder'), name: `${root.name} (copy)`, slug: `${root.slug}-copy` };
            idMap.set(root.id, newRoot.id);
            const rest: WsFolder[] = [newRoot];
            // BFS clone children with re-mapped parent ids
            const others = c.folders.filter((f) => subtree.has(f.id) && f.id !== root.id);
            let progressed = true;
            const pending = [...others];
            while (progressed && pending.length > 0) {
                progressed = false;
                for (let i = pending.length - 1; i >= 0; i -= 1) {
                    const f = pending[i];
                    const newParent = f.parent_id ? idMap.get(f.parent_id) : null;
                    if (newParent !== undefined) {
                        const newId = uid('folder');
                        idMap.set(f.id, newId);
                        rest.push({ ...f, id: newId, parent_id: newParent });
                        pending.splice(i, 1);
                        progressed = true;
                    }
                }
            }
            c.folders.push(...rest);
            // Clone requests inside the duplicated subtree
            const reqClones: WsRequest[] = c.requests
                .filter((r) => r.folder_id && subtree.has(r.folder_id))
                .map((r) => ({ ...r, id: uid('req'), folder_id: idMap.get(r.folder_id as ID) ?? null }));
            c.requests.push(...reqClones);
            persist();
            return newRoot;
        }
        return null;
    },

    // Requests
    GetRequest: async (id: ID) => {
        for (const c of db.collections) {
            const r = c.requests.find((x) => x.id === id);
            if (r) return r;
        }
        return null;
    },
    CreateRequest: async (p: any) => {
        const c = db.collections.find((x) => x.id === p.collection_id);
        if (!c) return null;
        const r: WsRequest = {
            id: uid('req'),
            collection_id: c.id,
            folder_id: p.folder_id ?? null,
            name: p.name,
            slug: slugify(p.name),
            method: p.method || 'GET',
            url: p.url || '',
            params: p.params || [],
            path_variables: p.path_variables || [],
            auth: p.auth || { type: 'none' },
            headers: p.headers || [],
            body: p.body || { type: 'none' },
        };
        c.requests.push(r);
        persist();
        return r;
    },
    UpdateRequest: async (id: ID, p: any) => {
        for (const c of db.collections) {
            const r = c.requests.find((x) => x.id === id);
            if (r) {
                Object.assign(r, {
                    name: p.name ?? r.name,
                    method: p.method ?? r.method,
                    url: p.url ?? r.url,
                    params: p.params ?? r.params,
                    path_variables: p.path_variables ?? r.path_variables,
                    auth: p.auth ?? r.auth,
                    headers: p.headers ?? r.headers,
                    body: p.body ?? r.body,
                });
                r.slug = slugify(r.name);
                persist();
                return r;
            }
        }
        return null;
    },
    RenameRequest: async (id: ID, p: any) => {
        for (const c of db.collections) {
            const r = c.requests.find((x) => x.id === id);
            if (r) {
                r.name = p.name;
                r.slug = slugify(p.name);
                persist();
                return r;
            }
        }
        return null;
    },
    DeleteRequest: async (id: ID) => {
        for (const c of db.collections) {
            c.requests = c.requests.filter((r) => r.id !== id);
        }
        persist();
    },
    DuplicateRequest: async (id: ID) => {
        for (const c of db.collections) {
            const r = c.requests.find((x) => x.id === id);
            if (r) {
                const copy: WsRequest = { ...r, id: uid('req'), name: `${r.name} (copy)`, slug: `${r.slug}-copy` };
                c.requests.push(copy);
                persist();
                return copy;
            }
        }
        return null;
    },

    // Send request — best-effort browser fetch. Cross-origin URLs will fail
    // per CORS, which the UI surfaces as an error response.
    SendRequest: async (p: any) => {
        try {
            const res = await fetch(p.url, { method: p.method, headers: p.headers, body: p.method === 'GET' || p.method === 'HEAD' ? undefined : p.body });
            const body = await res.text();
            const headers: Record<string, string> = {};
            res.headers.forEach((v, k) => (headers[k] = v));
            return { status: res.status, statusText: res.statusText || String(res.status), headers, body };
        } catch (err: any) {
            return { status: 0, statusText: 'Error', headers: {}, body: String(err?.message || err) };
        }
    },

    // Sort-order APIs — no-ops in the mock; the UI drives ordering client-side.
    ReorderCollectionItems: async () => null,
    UpdateCollectionSortOrder: async () => null,
    UpdateFolderSortOrder: async () => null,
};

export function installBrowserRuntimeShim(): void {
    // Only install when the real Wails runtime is missing.
    if (typeof window === 'undefined') return;
    const w = window as any;
    if (w.go && w.go.main && w.go.main.App) return;
    w.go = w.go || {};
    w.go.main = w.go.main || {};
    w.go.main.App = shim;
    // eslint-disable-next-line no-console
    console.info('[paperjet] Preview runtime shim installed (Wails bridge not detected).');
}
