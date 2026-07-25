import type { EnvVariable } from '@/types/environment';

/**
 * Replace all {{key}} occurrences in `text` with their env value.
 * Falls back to the original placeholder if the key is not found.
 */
export function resolveEnvVars(text: string, envVariables: EnvVariable[] = []): string {
    if (!text || !envVariables.length) return text;
    return text.replace(/\{\{([^{}]+)\}\}/g, (match, key: string) => {
        const found = envVariables.find((v) => v.key === key.trim());
        return found !== undefined ? found.value : match;
    });
}
