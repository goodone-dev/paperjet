import type { BackendKeyValue, AuthConfig, BodyConfig } from './collection';

// A history entry captures the full request payload so it can be replayed
// exactly, plus a snapshot of the returned response for quick inspection.
export interface HistoryEntry {
    id: string;
    // Wall-clock timestamp (ms since epoch) — used for grouping & sorting.
    timestamp: number;
    // Display label (formatted at read time; stored for backwards-compat with older entries).
    time?: string;
    method: string;
    url: string;
    name?: string;
    // Full request payload — enables one-click replay.
    params?: BackendKeyValue[];
    pathVariables?: BackendKeyValue[];
    headers?: BackendKeyValue[];
    auth?: AuthConfig;
    body?: BodyConfig;
    // Optional captured response
    status?: number;
    statusText?: string;
    responseTimeMs?: number;
    responseSize?: number;
    responseBody?: string;
}
