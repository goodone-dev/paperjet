import type { BackendKeyValue, KeyValueRow, AuthConfig, BodyConfig } from '@/types/collection';
import type { BodyRaw, RequestTab } from '@/types/tab';
import type { EnvVariable } from '@/types/environment';
import type { HistoryEntry } from '@/types/history';
import type { WireRequestResponse, WireProxyPayload } from './api';

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
        type: p.type,
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
export function mapBackendRequestToTab(full: WireRequestResponse, meta: OpenRequestMeta): Partial<RequestTab> {
    const body = (full.body || { type: 'none' }) as any;
    return {
        sourceId: full.id,
        colId: meta.colId,
        folderId: meta.folderId,
        name: full.name,
        method: full.method,
        url: full.url || '',
        queryParams: mapBackendKvsToRows(full.query_params, 'p', [
            { id: 'p1', key: '', type: 'text', value: '', description: '', enabled: true },
        ]),
        headers: mapBackendKvsToRows(full.headers, 'h', [
            { id: 'h1', key: 'Accept', type: 'text', value: 'application/json', description: '', enabled: true },
            { id: 'h2', key: '', type: 'text', value: '', description: '', enabled: true },
        ]),
        bodyType: body?.type || 'none',
        bodyRaw: { type: body?.raw?.type || 'json', value: body?.raw?.value } as BodyRaw,
        bodyFormData: mapBackendKvsToRows(body?.form_data, 'f', [
            { id: 'f1', key: '', type: 'text', value: '', description: '', enabled: true },
        ]),
        bodyUrlEncoded: mapBackendKvsToRows(body?.url_encoded, 'u', [
            { id: 'u1', key: '', type: 'text', value: '', description: '', enabled: true },
        ]),
        bodyBinary: body?.binary || null,
        pathVariables: mapBackendKvsToRows(full.path_variables, 'pv', []),
        auth: mapBackendAuth(full.auth),
        isDirty: false,
    };
}

/**
 * History entry (which stores backend-shaped payloads) → in-memory tab.
 * Used to "replay" a historical request in a new tab.
 */
export function mapHistoryEntryToTab(entry: HistoryEntry): Partial<RequestTab> {
    const body = (entry.body || { type: 'none' }) as any;
    return {
        sourceId: null,
        colId: null,
        folderId: null,
        name: entry.name || entry.url,
        method: entry.method,
        url: entry.url,
        queryParams: mapBackendKvsToRows(entry.queryParams, 'p', [
            { id: 'p1', key: '', type: 'text', value: '', description: '', enabled: true },
        ]),
        headers: mapBackendKvsToRows(entry.headers, 'h', [
            { id: 'h1', key: 'Accept', type: 'text', value: 'application/json', description: '', enabled: true },
            { id: 'h2', key: '', type: 'text', value: '', description: '', enabled: true },
        ]),
        bodyType: body?.type || 'none',
        bodyRaw: { type: body?.raw?.type || 'json', value: body?.raw?.value } as BodyRaw,
        bodyFormData: mapBackendKvsToRows(body?.form_data, 'f', [
            { id: 'f1', key: '', type: 'text', value: '', description: '', enabled: true },
        ]),
        bodyUrlEncoded: mapBackendKvsToRows(body?.url_encoded, 'u', [
            { id: 'u1', key: '', type: 'text', value: '', description: '', enabled: true },
        ]),
        bodyBinary: body?.binary || null,
        pathVariables: mapBackendKvsToRows(entry.pathVariables, 'pv', []),
        auth: mapBackendAuth(entry.auth),
        isDirty: false,
    };
}

function rowsToBackendKvs(rows: KeyValueRow[] | undefined): BackendKeyValue[] {
    return (rows || []).filter((p) => p.key).map((p) => ({
        key: p.key,
        type: p.type,
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

function tabBodyToBackend(tab: Pick<RequestTab, 'bodyType' | 'bodyRaw' | 'bodyFormData' | 'bodyUrlEncoded' | 'bodyBinary'>): BodyConfig {
    const body: any = { type: tab.bodyType || 'none' };
    if (tab.bodyType === 'raw') body.raw = { type: tab.bodyRaw?.type, value: tab.bodyRaw?.value };
    if (tab.bodyType === 'form-data') body.form_data = rowsToBackendKvs(tab.bodyFormData);
    if (tab.bodyType === 'x-www-form-urlencoded') body.url_encoded = rowsToBackendKvs(tab.bodyUrlEncoded);
    if (tab.bodyType === 'binary') body.binary = tab.bodyBinary;
    return body;
}

export interface BackendSavePayload {
    name: string;
    method: string;
    url: string;
    query_params: BackendKeyValue[];
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
        query_params: rowsToBackendKvs(tab.queryParams),
        path_variables: rowsToBackendKvs(tab.pathVariables),
        auth: tabAuthToBackend(tab.auth),
        headers: rowsToBackendKvs(tab.headers),
        body: tabBodyToBackend(tab),
    };
}

export function buildRequestPayload(tab: RequestTab, envVars: EnvVariable[]): WireProxyPayload {
    const base = mapTabToSavePayload(tab);
    return { ...base, env_variables: envVars };
}
