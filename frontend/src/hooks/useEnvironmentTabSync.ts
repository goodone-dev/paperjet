import { useEffect } from 'react';
import type { Tab } from '@/types/tab';
import type { Environment } from '@/types/environment';

interface TabsSyncApi {
    setTabs: (updater: Tab[] | ((prev: Tab[]) => Tab[])) => void;
    setActiveTabId: (updater: string | null | ((prev: string | null) => string | null)) => void;
    closeAll: () => void;
}

/**
 * Keeps open environment tabs in sync with their underlying environments:
 * - renames the tab when the env is renamed
 * - closes the tab when the env is deleted
 *
 * Extracted from AppWorkspace to keep that component's effects focused
 * (its previous inline version had six dependencies).
 */
export function useEnvironmentTabSync(
    tabs: Tab[],
    activeTabId: string | null,
    environments: Environment[],
    api: TabsSyncApi,
): void {
    const { setTabs, setActiveTabId, closeAll } = api;
    useEffect(() => {
        let changed = false;
        const nextTabs: Tab[] = tabs
            .map((t) => {
                if (t.type !== 'environment') return t;
                const env = environments.find((e) => e.id === t.envId);
                if (env && env.name !== t.name) {
                    changed = true;
                    return { ...t, name: env.name } as Tab;
                }
                return t;
            })
            .filter((t) => {
                if (t.type !== 'environment') return true;
                const exists = environments.some((e) => e.id === t.envId);
                if (!exists) {
                    changed = true;
                    return false;
                }
                return true;
            });

        if (!changed) return;
        if (nextTabs.length === 0) {
            closeAll();
            return;
        }
        setTabs(nextTabs);
        if (!nextTabs.find((t) => t.id === activeTabId)) {
            setActiveTabId(nextTabs[0].id);
        }
    }, [environments, tabs, activeTabId, setTabs, setActiveTabId, closeAll]);
}
