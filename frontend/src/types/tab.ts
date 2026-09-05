import type { KeyValueRow, HttpMethod, AuthConfig } from './collection';
import type { ResponseData } from './response';

export interface RequestTabSnapshot {
    name: string;
    method: HttpMethod | string;
    url: string;
    queryParams: KeyValueRow[];
    pathVariables: KeyValueRow[];
    headers: KeyValueRow[];
    bodyType: 'none' | 'raw' | 'form-data' | 'x-www-form-urlencoded' | 'binary' | 'graphql';
    bodyRaw: BodyRaw | null;
    bodyFormData: KeyValueRow[];
    bodyUrlEncoded: KeyValueRow[];
    bodyBinary: string | null;
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
    queryParams: KeyValueRow[];
    pathVariables: KeyValueRow[];
    headers: KeyValueRow[];
    bodyType: 'none' | 'raw' | 'form-data' | 'x-www-form-urlencoded' | 'binary' | 'graphql';
    bodyRaw: BodyRaw | null;
    bodyFormData: KeyValueRow[];
    bodyUrlEncoded: KeyValueRow[];
    bodyBinary: string | null;
    auth: AuthConfig;
    response: ResponseData | null;
    isSending: boolean;
    isDirty: boolean;
    activeTab: string;
    pinned?: boolean;
    baseline?: RequestTabSnapshot | null;
}

export interface ExampleTab {
    id: string;
    type: 'example';
    sourceId: string | null;
    requestId: string | null;
    colId: string | null;
    folderId: string | null;
    name: string;
    method: HttpMethod | string;
    url: string;
    queryParams: KeyValueRow[];
    pathVariables: KeyValueRow[];
    headers: KeyValueRow[];
    bodyType: 'none' | 'raw' | 'form-data' | 'x-www-form-urlencoded' | 'binary' | 'graphql';
    bodyRaw: BodyRaw | null;
    bodyFormData: KeyValueRow[];
    bodyUrlEncoded: KeyValueRow[];
    bodyBinary: string | null;
    auth: AuthConfig;
    response: ResponseData;
    isDirty: boolean;
    activeTab: string;
}

export interface EnvironmentTab {
    id: string;
    type: 'environment';
    envId: string;
    name: string;
}

export type Tab = RequestTab | EnvironmentTab | ExampleTab;
