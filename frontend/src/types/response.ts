import type { KeyValueRow } from './collection';

export interface ResponseKeyValue {
    key: string;
    value: string;
}

export interface ResponseData {
    status: number;
    statusText: string;
    time: number;
    size: number;
    headers: ResponseKeyValue[];
    cookies: ResponseKeyValue[];
    body: string;
    error: boolean;
}

// Re-export for callers wanting the row shape used in editors
export type { KeyValueRow };
