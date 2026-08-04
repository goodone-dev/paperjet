import type { KeyValueRow, HttpMethod, AuthConfig } from './collection';
import type { ResponseData } from './response';

export interface RequestTabSnapshot {
    name: string;
    method: HttpMethod | string;
    url: string;
    params: KeyValueRow[];
    pathVariables: KeyValueRow[];
    headers: KeyValueRow[];
    bodyType: 'none' | 'raw' | 'form-data' | 'x-www-form-urlencoded' | 'binary' | 'graphql';
    bodyRaw: BodyRaw | null;
    bodyFormData: KeyValueRow[];
    bodyUrlEncoded: KeyValueRow[];
    auth: AuthConfig;
}

export interface BodyRaw {
    type: 'json' | 'xml' | 'html' | 'text';
    value: string;
}

export interface RequestTab {
    id: string;
    type: 'request';
    sourceId: string | null;
    colId: string | null;
    folderId: string | null;
    name: string;
    method: HttpMethod | string;
    url: string;
    params: KeyValueRow[];
    pathVariables: KeyValueRow[];
    headers: KeyValueRow[];
    bodyType: 'none' | 'raw' | 'form-data' | 'x-www-form-urlencoded' | 'binary' | 'graphql';
    bodyRaw: BodyRaw | null;
    bodyFormData: KeyValueRow[];
    bodyUrlEncoded: KeyValueRow[];
    auth: AuthConfig;
    response: ResponseData | null;
    isSending: boolean;
    isDirty: boolean;
    activeTab: string;
    pinned?: boolean;
    baseline?: RequestTabSnapshot | null;
}

export interface EnvironmentTab {
    id: string;
    type: 'environment';
    envId: string;
    name: string;
}

export type Tab = RequestTab | EnvironmentTab;
