import type { KeyValueRow } from '@/types/collection';

const PATH_VAR_REGEX = /:([a-zA-Z0-9_-]+)/g;

function extractKeys(url: string): string[] {
    return Array.from(url.matchAll(PATH_VAR_REGEX)).map((m) => m[1]);
}

function newRow(key: string, value: string): KeyValueRow {
    return {
        id: `pv${Date.now()}${Math.random()}`,
        key,
        value,
        description: '',
        enabled: true,
    };
}

/**
 * Re-derive path variables when the URL changes. Preserves existing values
 * for keys that remain, renames when a placeholder is renamed in-place,
 * removes deleted keys, and appends new keys.
 */
export function syncPathVariablesFromUrl(
    newUrl: string,
    oldUrl: string,
    currentPathVars: KeyValueRow[] = [],
): KeyValueRow[] {
    const oldKeys = extractKeys(oldUrl || '');
    const newKeys = extractKeys(newUrl || '');
    const next: KeyValueRow[] = [...currentPathVars];

    for (let i = 0; i < Math.max(oldKeys.length, newKeys.length); i++) {
        const oldKey = oldKeys[i];
        const newKey = newKeys[i];
        if (oldKey && newKey && oldKey !== newKey) {
            const idx = next.findIndex((p) => p.key === oldKey);
            if (idx >= 0) {
                next[idx] = { ...next[idx], key: newKey };
            } else if (!next.find((p) => p.key === newKey)) {
                next.push(newRow(newKey, ''));
            }
        } else if (oldKey && !newKey) {
            const idx = next.findIndex((p) => p.key === oldKey);
            if (idx >= 0) next.splice(idx, 1);
        } else if (!oldKey && newKey) {
            if (!next.find((p) => p.key === newKey)) {
                next.push(newRow(newKey, ''));
            }
        }
    }
    return next;
}

/**
 * Re-derive query params from a URL, preserving row identity/order for still-enabled
 * rows and appending an empty row at the end. Extracted from RequestPanel.
 */
export function syncParamsFromUrl(newUrl: string, currentParams: KeyValueRow[]): KeyValueRow[] {
    let searchParams: Array<[string, string]> = [];
    try {
        const urlObj = new URL(newUrl.includes('://') ? newUrl : `http://dummy/${newUrl}`);
        searchParams = Array.from(urlObj.searchParams.entries()).filter(([k, v]) => k || v);
    } catch (err) {
        // Malformed URL — expected while the user is still typing. Nothing to log,
        // but leave the annotation so future maintainers see the intent.
        void err;
    }

    const newParams: KeyValueRow[] = [];
    let idx = 0;
    for (let i = 0; i < currentParams.length; i++) {
        const p = currentParams[i];
        if (!p.key && !p.value) continue;
        if (!p.enabled) {
            newParams.push(p);
            continue;
        }
        if (idx < searchParams.length) {
            const [k, v] = searchParams[idx];
            newParams.push({ ...p, key: k, value: v });
            idx++;
        }
    }
    while (idx < searchParams.length) {
        const [k, v] = searchParams[idx];
        newParams.push({
            id: `p${Date.now()}${Math.random()}`,
            key: k,
            value: v,
            description: '',
            enabled: true,
        });
        idx++;
    }
    const last = newParams[newParams.length - 1];
    if (!last || last.key || last.value) {
        newParams.push({
            id: `p${Date.now()}${Math.random()}`,
            key: '',
            value: '',
            description: '',
            enabled: true,
        });
    }
    return newParams;
}
