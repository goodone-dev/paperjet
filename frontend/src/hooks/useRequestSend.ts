import { useCallback } from 'react';
import { SendRequest, type WireProxyResponse } from '@/lib/api';
import { buildRequestPayload, mapTabToSavePayload } from '@/lib/request-mapper';
import { prune7Days } from '@/lib/history-format';
import type { RequestTab, Tab } from '@/types/tab';
import type { Environment } from '@/types/environment';
import type { ResponseData } from '@/types/response';
import type { HistoryEntry } from '@/types/history';

type Updater<T> = T | ((prev: T) => T);
type SetTabs = (updater: Updater<Tab[]>) => void;
type SetHistory = (updater: Updater<HistoryEntry[]>) => void;

const MAX_HISTORY = 500; // hard cap even within 7 days to guard localStorage quota

/**
 * Owns the entire send-request lifecycle: env snapshot, URL resolution,
 * auth header injection, backend call, response shaping, history append.
 * Extracted from AppWorkspace.handleSend.
 */
export function useRequestSend(
    activeTab: Tab | undefined,
    environments: Environment[],
    setTabs: SetTabs,
    setHistory: SetHistory,
): () => Promise<void> {
    return useCallback(async () => {
        if (!activeTab || activeTab.type !== 'request') return;
        const reqTab = activeTab as RequestTab;

        setTabs((ts) => ts.map((t) => (t.id === reqTab.id ? { ...t, isSending: true } as Tab : t)));

        const envVars = (environments.find((e) => e.active)?.variables || []).filter(
            (v) => v.enabled !== false && v.key,
        );

        const start = performance.now();
        let responseData: ResponseData;
        try {
            const payload = buildRequestPayload(reqTab, envVars);
            const res: WireProxyResponse = await SendRequest(payload);
            const elapsed = Math.max(0, Math.floor(performance.now() - start));

            responseData = {
                status: res.status,
                statusText: res.statusText,
                time: elapsed,
                size: new Blob([res.body || '']).size,
                headers: Object.entries(res.headers || {}).map(([key, value]) => ({ key, value })),
                cookies: Object.entries(res.cookies || {}).map(([key, value]) => ({ key, value })),
                body: res.body,
                error: false,
            };

            setTabs((ts) =>
                ts.map((t) => (t.id === reqTab.id ? ({ ...t, isSending: false, response: responseData } as Tab) : t)),
            );
        } catch (err: any) {
            responseData = {
                status: 0,
                statusText: 'Error',
                time: 0,
                size: 0,
                headers: [],
                cookies: [],
                body: '{\n  "error": "' + (err?.message || err) + '"\n}',
                error: true,
            };
            setTabs((ts) =>
                ts.map((t) => (t.id === reqTab.id ? ({ ...t, isSending: false, response: responseData } as Tab) : t)),
            );
        }

        if (!reqTab.url) return;
        // Capture the complete request state so this entry can be replayed exactly
        // (headers, params, path variables, auth, body — see HistoryEntry type).
        const saved = mapTabToSavePayload(reqTab);
        const entry: HistoryEntry = {
            id: `h-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            timestamp: Date.now(),
            name: reqTab.name,
            method: reqTab.method,
            url: reqTab.url,
            params: saved.params,
            pathVariables: saved.path_variables,
            headers: saved.headers,
            auth: saved.auth,
            body: saved.body,
            status: responseData.status,
            statusText: responseData.statusText,
            responseTimeMs: responseData.time,
            responseSize: responseData.size,
            responseBody: responseData.body,
        };
        setHistory((h) => prune7Days([entry, ...h]).slice(0, MAX_HISTORY));
    }, [activeTab, environments, setTabs, setHistory]);
}
