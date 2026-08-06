import React, { useState, useMemo, useRef, useCallback } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Copy, Check, Download, Search, Maximize2, Minimize2, WrapText, Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';
import { tokenizeJSON } from '@/lib/json-format';
import type { ResponseData, ResponseKeyValue } from '@/types/response';
import { EnvCodeMirror } from './EnvAutocomplete';
import { BodyRaw } from '@/types/tab';
import { openSearchPanel } from '@codemirror/search';
import type { ReactCodeMirrorRef } from '@uiw/react-codemirror';

type StatusKind = 'success' | 'warning' | 'error' | 'info';

function getStatusKind(status: number): StatusKind {
    if (status >= 500) return 'error';
    if (status >= 400) return 'warning';
    if (status >= 200 && status < 300) return 'success';
    return 'info';
}

function getResponseContentType(response: ResponseData | null): BodyRaw['type'] {
    if (!response) return 'json';
    const ctHeader = response.headers?.find((h) => h.key.toLowerCase() === 'content-type')?.value?.toLowerCase() || '';

    if (ctHeader.includes('json')) return 'json';
    if (ctHeader.includes('xml')) return 'xml';
    if (ctHeader.includes('html')) return 'html';

    const trimmed = (response.body || '').trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) return 'json';
    if (trimmed.startsWith('<')) return 'xml';

    return 'text';
}

interface ResponsePanelProps {
    response: ResponseData | null;
    isSending: boolean;
    isMaximized?: boolean;
    onToggleMaximize?: () => void;
}

export const ResponsePanel: React.FC<ResponsePanelProps> = ({
    response,
    isSending,
    isMaximized,
    onToggleMaximize,
}) => {
    const [copied, setCopied] = useState(false);
    const [formatMode, setFormatMode] = useState<string>('pretty');
    const [wrapText, setWrapText] = useState(false);
    const editorRef = useRef<ReactCodeMirrorRef>(null);

    const bodyType = useMemo(() => {
        if (formatMode === 'raw') return 'text';
        return getResponseContentType(response);
    }, [formatMode, response]);

    const handleSearch = useCallback(() => {
        const view = editorRef.current?.view;
        if (view) openSearchPanel(view);
    }, []);

    const handleToggleWrap = useCallback(() => {
        setWrapText((prev) => !prev);
    }, []);

    const handleCopy = () => {
        if (!response?.body) return;
        navigator.clipboard.writeText(response.body);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (isSending) {
        return (
            <div className="h-full flex flex-col items-center justify-center bg-card/40">
                <div className="relative">
                    <div className="h-14 w-14 rounded-full border-4 border-primary-soft border-t-primary animate-spin" />
                </div>
                <div className="mt-4 text-sm font-medium text-foreground">Sending request…</div>
                <div className="text-xs text-muted-foreground mt-1">Streaming data over the wire</div>
            </div>
        );
    }

    if (!response) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-center px-6 bg-gradient-subtle">
                <div className="h-16 w-16 rounded-2xl bg-primary-soft flex items-center justify-center mb-4 shadow-soft">
                    <Inbox className="h-8 w-8 text-primary" strokeWidth={1.75} />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-1">Ready when you are</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                    Enter a URL above and hit{' '}
                    <kbd className="mono text-[10px] bg-card border border-border rounded px-1.5 py-0.5">Send</kbd> to
                    inspect the response here.
                </p>
                <div className="mt-6 flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                        <kbd className="mono bg-card border border-border rounded px-1.5 py-0.5">⏎</kbd>
                        Send
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                        <kbd className="mono bg-card border border-border rounded px-1.5 py-0.5">⌘S</kbd>
                        Save
                    </span>
                </div>
            </div>
        );
    }

    const statusKind = getStatusKind(response.status);

    const statusColors: Record<StatusKind, string> = {
        success: 'text-success bg-success-soft',
        warning: 'text-warning bg-warning-soft',
        error: 'text-destructive bg-destructive/10',
        info: 'text-info bg-info-soft',
    };

    return (
        <div className="flex flex-col h-full bg-background">
            <div className="px-5 py-2.5 border-b border-border bg-card/40 flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Status</span>
                    <span
                        className={cn('px-2 py-0.5 rounded-md text-xs font-semibold mono', statusColors[statusKind])}
                        data-testid="response-status"
                    >
                        {response.statusText}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Time</span>
                    <span className="text-xs font-semibold text-success mono">{response.time} ms</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Size</span>
                    <span className="text-xs font-semibold text-primary mono">{formatSize(response.size)}</span>
                </div>
                <div className="ml-auto flex items-center gap-1">
                    <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5" onClick={handleCopy}>
                        {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                        {copied ? 'Copied' : 'Copy'}
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5">
                        <Download className="h-3.5 w-3.5" /> Save
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={onToggleMaximize}
                        title={isMaximized ? 'Restore request panel' : 'Maximize response panel'}
                    >
                        {isMaximized ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="body" className="flex-1 flex flex-col min-h-0">
                <div className="px-5 border-b border-border bg-card/40 flex items-center justify-between">
                    <TabsList className="bg-transparent p-0 h-10 gap-1">
                        {[
                            { id: 'body', label: 'Body', count: 0, disabled: false },
                            { id: 'cookies', label: 'Cookies', count: response.cookies.length, disabled: false },
                            { id: 'headers', label: 'Headers', count: response.headers.length, disabled: false },
                            { id: 'tests', label: 'Test Results', count: 0, disabled: true },
                        ].map((t) => (
                            <TabsTrigger
                                key={t.id}
                                value={t.id}
                                disabled={t.disabled}
                                data-testid={`response-tab-${t.id}`}
                                className="h-10 px-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-[13px] font-medium text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                {t.label}
                                {t.count > 0 && (
                                    <span className="ml-1.5 text-[10px] bg-primary-soft text-primary px-1.5 py-0.5 rounded-full font-semibold">
                                        {t.count}
                                    </span>
                                )}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                    <div className="flex items-center gap-1">
                        <ResponseFormatTabs
                            active={formatMode}
                            onChange={setFormatMode}
                            onSearch={handleSearch}
                            wrapText={wrapText}
                            onToggleWrap={handleToggleWrap}
                        />
                    </div>
                </div>

                <TabsContent value="body" className="flex-1 mt-0 min-h-0 flex flex-col">
                    <EnvCodeMirror
                        ref={editorRef}
                        data={{ value: response.body, type: bodyType }}
                        className="text-sm border-0 bg-card outline-none flex-1 min-h-0"
                        height="100%"
                        readonly={true}
                        wrap={wrapText}
                    />
                </TabsContent>
                <TabsContent value="headers" className="flex-1 mt-0 min-h-0">
                    <KeyValueTable data={response.headers} />
                </TabsContent>
                <TabsContent value="cookies" className="flex-1 mt-0 min-h-0">
                    {response.cookies.length === 0 ? (
                        <div className="m-5 rounded-lg border border-dashed border-border bg-secondary/40 p-12 text-center">
                            <p className="text-sm text-muted-foreground">No cookies were returned.</p>
                        </div>
                    ) : (
                        <KeyValueTable data={response.cookies} />
                    )}
                </TabsContent>
                <TabsContent value="tests" className="flex-1 mt-0 min-h-0 p-5">
                    <TestResults />
                </TabsContent>
            </Tabs>
        </div>
    );
};

interface ResponseFormatTabsProps {
    active: string;
    onChange: (mode: string) => void;
    onSearch?: () => void;
    wrapText?: boolean;
    onToggleWrap?: () => void;
}

const ResponseFormatTabs: React.FC<ResponseFormatTabsProps> = ({
    active,
    onChange,
    onSearch,
    wrapText,
    onToggleWrap,
}) => {
    return (
        <div className="flex items-center gap-0 mr-2">
            {['pretty', 'raw', 'preview', 'visualize'].map((m) => (
                <button
                    key={m}
                    onClick={() => onChange(m)}
                    className={cn(
                        'h-7 px-2 text-[12px] capitalize rounded-md transition-colors',
                        active === m ? 'text-primary bg-primary-soft font-semibold' : 'text-muted-foreground hover:text-foreground',
                    )}
                >
                    {m}
                </button>
            ))}
            <span className="mx-2 h-4 w-px bg-border" />
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onSearch} title="Search (Ctrl/Cmd+F)">
                <Search className="h-3.5 w-3.5" />
            </Button>
            <Button
                variant="ghost"
                size="icon"
                className={cn('h-7 w-7 transition-colors', wrapText && 'text-primary bg-primary-soft')}
                onClick={onToggleWrap}
                title="Toggle line wrapping"
            >
                <WrapText className="h-3.5 w-3.5" />
            </Button>
        </div>
    );
};

// Finding #12: `tokenizeJSON` is a stable module export, so it does not belong in the deps array.
const JSONViewer: React.FC<{ code: string }> = ({ code }) => {
    const tokens = useMemo(() => tokenizeJSON(code), [code]);
    const lineCount = useMemo(() => code.split('\n').length, [code]);
    return (
        <ScrollArea className="h-full">
            <div className="flex min-h-full">
                <div className="shrink-0 select-none text-right pr-3 pl-4 py-4 text-[11px] mono text-muted-foreground/70 bg-secondary/40 border-r border-border">
                    {Array.from({ length: lineCount }, (_, i) => (
                        <div key={`line-${i + 1}`} className="leading-6">
                            {i + 1}
                        </div>
                    ))}
                </div>
                <pre
                    className="flex-1 p-4 mono text-[13px] leading-6 whitespace-pre-wrap break-all"
                    data-testid="response-body"
                >
                    {tokens.map((t, i) => (
                        <span
                            key={`tok-${i}-${t.type}`}
                            className={cn(
                                t.type === 'key' && 'json-key font-semibold',
                                t.type === 'string' && 'json-string',
                                t.type === 'number' && 'json-number',
                                t.type === 'bool' && 'json-bool',
                                t.type === 'punct' && 'json-punct',
                                t.type === 'plain' && 'text-foreground',
                            )}
                        >
                            {t.value}
                        </span>
                    ))}
                </pre>
            </div>
        </ScrollArea>
    );
};

const KeyValueTable: React.FC<{ data: ResponseKeyValue[] }> = ({ data }) => (
    <ScrollArea className="h-full">
        <div className="p-5">
            <div className="rounded-lg border border-border overflow-hidden bg-card">
                <div className="grid grid-cols-2 bg-secondary/50 border-b border-border text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
                    <div className="px-4 py-2.5">Key</div>
                    <div className="px-4 py-2.5 border-l border-border">Value</div>
                </div>
                <div className="divide-y divide-border">
                    {data.map((h, i) => (
                        <div key={`${h.key}-${i}`} className="grid grid-cols-2 hover:bg-secondary/30 transition-colors">
                            <div className="px-4 py-2.5 text-[13px] mono font-medium text-primary">{h.key}</div>
                            <div className="px-4 py-2.5 text-[13px] mono text-foreground/80 border-l border-border break-all">
                                {h.value}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </ScrollArea>
);

const TestResults: React.FC = () => (
    <div className="space-y-2">
        {[
            { ok: true, label: 'Status code is 200' },
            { ok: true, label: 'Response time is less than 500ms' },
            { ok: true, label: 'Content-Type is application/json' },
            { ok: false, label: 'Body contains expected user id' },
        ].map((t) => (
            <div key={t.label} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card">
                <span
                    className={cn(
                        'h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold',
                        t.ok ? 'bg-success-soft text-success' : 'bg-destructive/10 text-destructive',
                    )}
                >
                    {t.ok ? '✓' : '✕'}
                </span>
                <span className="text-sm text-foreground">{t.label}</span>
                <span className="ml-auto text-[11px] mono text-muted-foreground">{t.ok ? 'PASS' : 'FAIL'}</span>
            </div>
        ))}
    </div>
);

function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
