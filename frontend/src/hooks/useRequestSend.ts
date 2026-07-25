import { useCallback } from 'react';
import { SendRequest, type WireProxyResponse } from '@/lib/api';
import { buildRequestPayload } from '@/lib/request-mapper';
import type { RequestTab, Tab } from '@/types/tab';
import type { Environment } from '@/types/environment';
import type { ResponseData } from '@/types/response';

interface HistoryEntry {
    id: string;
    method: string;
    url: string;
    time: string;
}

type Updater<T> = T | ((prev: T) => T);
type SetTabs = (updater: Updater<Tab[]>) => void;
type SetHistory = (updater: Updater<HistoryEntry[]>) => void;

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
        try {
            const payload = buildRequestPayload(reqTab, envVars);
            const res: WireProxyResponse = await SendRequest(payload);
            const elapsed = Math.max(0, Math.floor(performance.now() - start));

            const responseData: ResponseData = {
                status: res.status,
                statusText: res.statusText,
                time: elapsed,
                size: new Blob([res.body || '']).size,
                headers: Object.entries(res.headers || {}).map(([key, value]) => ({
                    key,
                    value,
                })),
                body: res.body,
                error: false,
            };

            setTabs((ts) =>
                ts.map((t) => (t.id === reqTab.id ? ({ ...t, isSending: false, response: responseData } as Tab) : t)),
            );
        } catch (err: any) {
            const responseData: ResponseData = {
                status: 0,
                statusText: 'Error',
                time: 0,
                size: 0,
                headers: [],
                body: '{\n  "error": "' + (err?.message || err) + '"\n}',
                error: true,
            };
            setTabs((ts) =>
                ts.map((t) => (t.id === reqTab.id ? ({ ...t, isSending: false, response: responseData } as Tab) : t)),
            );
        }

        if (reqTab.url) {
            setHistory((h) =>
                [
                    { id: `h-${Date.now()}`, method: reqTab.method, url: reqTab.url, time: 'Just now' },
                    ...h,
                ].slice(0, 20),
            );
        }
    }, [activeTab, environments, setTabs, setHistory]);
}
