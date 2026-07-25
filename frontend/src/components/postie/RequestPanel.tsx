import React from 'react';
import { Send, Save, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { KeyValueEditor } from './KeyValueEditor';
import { MethodLabel } from './MethodBadge';
import { EnvInput } from './EnvAutocomplete';
import { cn } from '@/lib/utils';
import { HTTP_METHODS, methodColorMap } from '@/types/collection';
import { syncParamsFromUrl, syncPathVariablesFromUrl } from '@/lib/url-sync';
import { AuthEditor, BodyEditor, ScriptsPlaceholder, SettingsPanel, SectionHeader } from './request-panel';
import type { RequestTab } from '@/types/tab';
import type { EnvVariable } from '@/types/environment';

interface RequestPanelProps {
    request: RequestTab;
    onUpdate: (patch: Partial<RequestTab> & { id: string }) => void;
    onSend: () => void;
    onSave: () => void;
    envVariables?: EnvVariable[];
}

export const RequestPanel: React.FC<RequestPanelProps> = ({ request, onUpdate, onSend, onSave, envVariables = [] }) => {
    const update = (patch: Partial<RequestTab>) => onUpdate({ ...request, ...patch, id: request.id });

    const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newUrl = e.target.value;
        const oldUrl = request.url || '';
        const pathVariables = syncPathVariablesFromUrl(newUrl, oldUrl, request.pathVariables || []);
        const params = syncParamsFromUrl(newUrl, request.params);
        update({ url: newUrl, pathVariables, params });
    };

    return (
        <div className="flex flex-col h-full bg-background">
            <div className="px-5 pt-4 pb-3 border-b border-border bg-card/40">
                <div className="flex items-center gap-2 mb-3">
                    <input
                        data-testid="request-name-input"
                        value={request.name}
                        onChange={(e) => update({ name: e.target.value })}
                        className="text-[15px] font-semibold bg-transparent border-0 outline-none focus:bg-secondary/50 px-1.5 py-0.5 rounded-md transition-colors text-foreground min-w-0"
                        style={{ width: `${Math.max(request.name.length, 8)}ch` }}
                    />
                </div>

                <div className="flex items-stretch gap-2">
                    <div className="flex items-stretch flex-1 rounded-lg border border-border bg-card shadow-soft overflow-hidden focus-within:border-primary focus-within:shadow-glow transition-all">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    data-testid="method-select-trigger"
                                    className="flex items-center gap-1.5 px-3 hover:bg-secondary/60 border-r border-border min-w-[110px] justify-between rounded-l-lg"
                                >
                                    <MethodLabel method={request.method} className="text-[13px]" />
                                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-32">
                                {HTTP_METHODS.map((m) => (
                                    <DropdownMenuItem key={m} data-testid={`method-option-${m}`} onClick={() => update({ method: m as string })}>
                                        <span className={cn('mono font-bold text-xs w-14', methodColorMap[m])}>{m}</span>
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <EnvInput
                            data-testid="request-url-input"
                            envVariables={envVariables}
                            value={request.url}
                            onChange={handleUrlChange}
                            placeholder="Enter request URL"
                            className="flex-1 border-0 rounded-none focus-visible:ring-0 mono text-sm h-11 bg-transparent px-3 w-full outline-none focus:outline-none"
                            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && onSend()}
                        />
                    </div>
                    <Button
                        data-testid="send-request-btn"
                        onClick={onSend}
                        disabled={request.isSending}
                        className="h-11 px-6 gap-2 bg-gradient-primary hover:opacity-90 text-primary-foreground shadow-elegant font-semibold"
                    >
                        {request.isSending ? (
                            <>
                                <span className="h-2 w-2 rounded-full bg-primary-foreground animate-pulse-soft" />
                                Sending
                            </>
                        ) : (
                            <>
                                <Send className="h-4 w-4" /> Send
                            </>
                        )}
                    </Button>
                    <Button
                        variant="outline"
                        className={cn(
                            'h-11 px-3 bg-card relative',
                            request.isDirty && request.sourceId && 'border-warning/60 text-warning hover:text-warning',
                        )}
                        onClick={onSave}
                        title={request.sourceId ? (navigator.platform?.toLowerCase().includes('mac') ? '⌘S' : 'Ctrl+S') : 'Not a saved request'}
                        data-testid="save-request-btn"
                    >
                        <Save className="h-4 w-4" />
                        {request.isDirty && request.sourceId && (
                            <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-warning" />
                        )}
                    </Button>
                </div>
            </div>

            <Tabs value={request.activeTab} onValueChange={(v: string) => update({ activeTab: v })} className="flex-1 flex flex-col min-h-0">
                <div className="px-5 border-b border-border bg-card/40">
                    <TabsList className="bg-transparent p-0 h-10 gap-1">
                        {[
                            {
                                id: 'params',
                                label: 'Params',
                                count: request.params.filter((p) => p.key).length + (request.pathVariables || []).filter((p) => p.key).length,
                            },
                            { id: 'auth', label: 'Authorization', count: 0 },
                            { id: 'headers', label: 'Headers', count: request.headers.filter((h) => h.key).length },
                            { id: 'body', label: 'Body', count: 0 },
                            { id: 'scripts', label: 'Scripts', disabled: true, count: 0 },
                            { id: 'tests', label: 'Tests', disabled: true, count: 0 },
                            { id: 'settings', label: 'Settings', count: 0 },
                        ].map((t) => (
                            <TabsTrigger
                                key={t.id}
                                value={t.id}
                                disabled={t.disabled}
                                data-testid={`request-tab-${t.id}`}
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
                </div>

                <div className="flex-1 overflow-auto p-5 scrollbar-thin">
                    <TabsContent value="params" className="mt-0 space-y-6">
                        <div>
                            <SectionHeader title="Query Params" description="Append key-value pairs to the request URL" />
                            <KeyValueEditor
                                rows={request.params}
                                envVariables={envVariables}
                                onChange={(rows) => {
                                    let currentUrl = request.url || '';
                                    const queryStart = currentUrl.indexOf('?');
                                    const baseUrl = queryStart >= 0 ? currentUrl.substring(0, queryStart) : currentUrl;
                                    const qp = new URLSearchParams();
                                    rows.filter((p) => p.enabled && (p.key || p.value)).forEach((p) => qp.append(p.key, p.value));
                                    const qs = qp.toString();
                                    const newUrl = qs ? `${baseUrl}?${qs}` : baseUrl;
                                    update({ params: rows, url: newUrl });
                                }}
                            />
                        </div>
                        {(request.pathVariables || []).length > 0 && (
                            <div>
                                <SectionHeader title="Path Variables" description="Values substituted into the URL path (e.g. :id)" />
                                <KeyValueEditor
                                    rows={request.pathVariables}
                                    envVariables={envVariables}
                                    onChange={(rows) => update({ pathVariables: rows })}
                                    readonlyKey
                                />
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="headers" className="mt-0">
                        <SectionHeader title="Headers" description="Headers are sent along with the request" />
                        <KeyValueEditor rows={request.headers} envVariables={envVariables} onChange={(rows) => update({ headers: rows })} />
                    </TabsContent>

                    <TabsContent value="auth" className="mt-0">
                        <AuthEditor auth={request.auth} onChange={(auth) => update({ auth })} envVariables={envVariables} />
                    </TabsContent>

                    <TabsContent value="body" className="mt-0">
                        <BodyEditor request={request} update={update} envVariables={envVariables} />
                    </TabsContent>

                    <TabsContent value="scripts" className="mt-0">
                        <ScriptsPlaceholder title="Pre-request Script" description="Run JavaScript before sending the request to set variables or modify the request." />
                    </TabsContent>
                    <TabsContent value="tests" className="mt-0">
                        <ScriptsPlaceholder title="Test Scripts" description="Write assertions to validate the response after it returns." />
                    </TabsContent>
                    <TabsContent value="settings" className="mt-0">
                        <SettingsPanel />
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
};
