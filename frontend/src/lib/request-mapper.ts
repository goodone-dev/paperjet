import type { BackendRequest, BackendKeyValue, KeyValueRow, AuthConfig, BodyConfig } from '@/types/collection';
import type { RequestTab } from '@/types/tab';
import type { EnvVariable } from '@/types/environment';
import { resolveEnvVars } from './env-resolve';

interface OpenRequestMeta {
    colId: string | null;
    folderId: string | null;
}

function mapBackendKvsToRows(
    items: BackendKeyValue[] | undefined,
    idPrefix: string,
    fallback: KeyValueRow[],
): KeyValueRow[] {
    if (!items || items.length === 0) return fallback;
    return items.map((p, i) => ({
        id: `${idPrefix}${i}`,
        key: p.key,
        value: p.value,
        description: p.description || '',
        enabled: p.enabled !== false,
    }));
}

function mapBackendAuth(raw: AuthConfig | undefined): AuthConfig {
    const a = (raw || { type: 'none' }) as any;
    if (a.type === 'bearer') return { type: 'bearer', token: a.bearer?.token || a.token || '' };
    if (a.type === 'basic') return { type: 'basic', username: a.basic?.username || a.username || '', password: a.basic?.password || a.password || '' };
    if (a.type === 'apikey') return { type: 'apikey', key: a.api_key?.key || a.key || '', apiValue: a.api_key?.value || a.apiValue || '' };
    return { type: a.type || 'none' } as AuthConfig;
}

/**
 * Backend request DTO → in-memory tab shape used across the UI.
 * Single source of truth for the mapping (replaces inline logic in AppWorkspace.handleOpenRequest).
 */
export function mapBackendRequestToTab(full: BackendRequest, meta: OpenRequestMeta): Partial<RequestTab> {
    const body = (full.body || { type: 'none' }) as any;
    return {
        sourceId: full.id,
        colId: meta.colId,
        folderId: meta.folderId,
        name: full.name,
        method: full.method,
        url: full.url || '',
        params: mapBackendKvsToRows(full.params, 'p', [
            { id: 'p1', key: '', value: '', description: '', enabled: true },
        ]),
        headers: mapBackendKvsToRows(full.headers, 'h', [
            { id: 'h1', key: 'Accept', value: 'application/json', description: '', enabled: true },
            { id: 'h2', key: '', value: '', description: '', enabled: true },
        ]),
        body: body?.raw?.value || '',
        bodyType: body?.type || 'none',
        bodyFormData: mapBackendKvsToRows(body?.form_data, 'f', [
            { id: 'f1', key: '', value: '', description: '', enabled: true },
        ]),
        bodyUrlEncoded: mapBackendKvsToRows(body?.url_encoded, 'u', [
            { id: 'u1', key: '', value: '', description: '', enabled: true },
        ]),
        pathVariables: mapBackendKvsToRows(full.path_variables, 'pv', []),
        auth: mapBackendAuth(full.auth),
        isDirty: false,
    };
}

function rowsToBackendKvs(rows: KeyValueRow[] | undefined): BackendKeyValue[] {
    return (rows || []).filter((p) => p.key).map((p) => ({
        key: p.key,
        value: p.value,
        description: p.description || '',
        enabled: p.enabled !== false,
    }));
}

function tabAuthToBackend(auth: AuthConfig | undefined): AuthConfig {
    const a: any = auth || { type: 'none' };
    const base: any = { type: a.type };
    if (a.type === 'bearer' && a.token) base.bearer = { token: a.token };
    if (a.type === 'basic') base.basic = { username: a.username || '', password: a.password || '' };
    if (a.type === 'apikey') base.api_key = { key: a.key || '', value: a.apiValue || a.value || '' };
    return base;
}

function tabBodyToBackend(tab: Pick<RequestTab, 'bodyType' | 'body' | 'bodyFormData' | 'bodyUrlEncoded'>): BodyConfig {
    const body: any = { type: tab.bodyType || 'none' };
    if (tab.bodyType === 'raw') body.raw = { type: 'json', value: tab.body || '' };
    if (tab.bodyType === 'form-data') body.form_data = rowsToBackendKvs(tab.bodyFormData);
    if (tab.bodyType === 'x-www-form-urlencoded') body.url_encoded = rowsToBackendKvs(tab.bodyUrlEncoded);
    return body;
}

export interface BackendSavePayload {
    name: string;
    method: string;
    url: string;
    params: BackendKeyValue[];
    path_variables: BackendKeyValue[];
    auth: AuthConfig;
    headers: BackendKeyValue[];
    body: BodyConfig;
}

/**
 * Tab shape → backend save payload. Used by both UpdateRequest and CreateRequest flows,
 * eliminating the duplicated auth/body/params serializer previously in useWorkspaceData.
 */
export function mapTabToSavePayload(tab: RequestTab): BackendSavePayload {
    return {
        name: tab.name,
        method: tab.method,
        url: tab.url || '',
        params: rowsToBackendKvs(tab.params),
        path_variables: rowsToBackendKvs(tab.pathVariables),
        auth: tabAuthToBackend(tab.auth),
        headers: rowsToBackendKvs(tab.headers),
        body: tabBodyToBackend(tab),
    };
}

export interface SendPayload {
    url: string;
    method: string;
    headers: Record<string, string>;
    body: string;
}

/**
 * Compose the exact wire-level request (env vars resolved, path vars substituted,
 * auth headers injected, body encoded). Extracted from AppWorkspace.handleSend.
 */
export function buildRequestPayload(tab: RequestTab, envVars: EnvVariable[]): SendPayload {
    const resolve = (text: string) => resolveEnvVars(text, envVars);

    const headers: Record<string, string> = (tab.headers || [])
        .filter((h) => h.enabled && h.key)
        .reduce<Record<string, string>>((acc, h) => {
            acc[resolve(h.key)] = resolve(h.value);
            return acc;
        }, {});

    let bodyData = tab.bodyType !== 'none' ? resolve(tab.body || '') : '';

    if (tab.bodyType === 'x-www-form-urlencoded') {
        const searchParams = new URLSearchParams();
        (tab.bodyUrlEncoded || [])
            .filter((h) => h.enabled && h.key)
            .forEach((h) => searchParams.append(resolve(h.key), resolve(h.value)));
        bodyData = searchParams.toString();
        headers['Content-Type'] = 'application/x-www-form-urlencoded';
    }

    let finalUrl = resolve(tab.url || '');
    (tab.pathVariables || [])
        .filter((p) => p.enabled && p.key)
        .forEach((p) => {
            finalUrl = finalUrl.replace(new RegExp(`:${p.key}\\b`, 'g'), encodeURIComponent(resolve(p.value)));
        });

    const auth: any = tab.auth || { type: 'none' };
    if (auth.type === 'bearer' && auth.token) {
        headers['Authorization'] = `Bearer ${resolve(auth.token)}`;
    } else if (auth.type === 'basic') {
        const creds = btoa(`${resolve(auth.username || '')}:${resolve(auth.password || '')}`);
        headers['Authorization'] = `Basic ${creds}`;
    } else if (auth.type === 'apikey') {
        headers[resolve(auth.key || 'X-API-Key')] = resolve(auth.apiValue || '');
    }

    return {
        url: finalUrl,
        method: tab.method,
        headers,
        body: bodyData,
    };
}
