// Tiny localStorage helpers for persisting PaperJet state across reloads.
// PaperJet is a Wails desktop app — localStorage here only stores UI state
// (active workspace id, tab layout, request history). No credentials or
// secrets touch this file; those live in SQLite via the Go backend.
const PREFIX = 'paperjet:';

export function loadState<T>(key: string, fallback: T): T {
    try {
        const raw = localStorage.getItem(PREFIX + key);
        if (raw == null) return fallback;
        return JSON.parse(raw) as T;
    } catch (err) {
        console.warn(`[persist] failed to load "${key}":`, err);
        return fallback;
    }
}

export function saveState<T>(key: string, value: T): void {
    try {
        localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch (err) {
        // Quota-exceeded / serialization failures are best-effort — surface
        // to the console so they're at least discoverable during dev.
        console.warn(`[persist] failed to save "${key}":`, err);
    }
}
