import type { HistoryEntry } from '@/types/history';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const ONE_MINUTE_MS = 60 * 1000;

function pad(n: number): string {
    return n < 10 ? `0${n}` : `${n}`;
}

function ymd(d: Date): string {
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Group label: Today / Yesterday / YYYY-MM-DD (local time).
export function historyDateLabel(ts: number, now: Date = new Date()): string {
    const d = new Date(ts);
    const today = ymd(now);
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const dLabel = ymd(d);
    if (dLabel === today) return 'Today';
    if (dLabel === ymd(yesterday)) return 'Yesterday';
    return dLabel;
}

// Time label: "Just now" (<1min ago) else HH:mm (local, 24-hour).
export function historyTimeLabel(ts: number, now: Date = new Date()): string {
    const diff = now.getTime() - ts;
    if (diff >= 0 && diff < ONE_MINUTE_MS) return 'Just now';
    const d = new Date(ts);
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Drop anything older than 7 days. Keeps caller code trivial.
export function prune7Days(entries: HistoryEntry[], now: Date = new Date()): HistoryEntry[] {
    const cutoff = now.getTime() - SEVEN_DAYS_MS;
    return entries.filter((e) => (e.timestamp ?? 0) >= cutoff);
}

export interface HistoryGroup {
    label: string;
    entries: HistoryEntry[];
}

export function groupHistoryByDate(entries: HistoryEntry[], now: Date = new Date()): HistoryGroup[] {
    const groups = new Map<string, HistoryEntry[]>();
    // Preserve most-recent-first ordering within each group by sorting once here.
    const sorted = [...entries].sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0));
    for (const e of sorted) {
        const label = historyDateLabel(e.timestamp ?? 0, now);
        const list = groups.get(label) ?? [];
        list.push(e);
        groups.set(label, list);
    }
    // Preserve insertion order (Today, Yesterday, then older dates in descending order — natural
    // because entries are already sorted most-recent-first).
    return Array.from(groups.entries()).map(([label, es]) => ({ label, entries: es }));
}
