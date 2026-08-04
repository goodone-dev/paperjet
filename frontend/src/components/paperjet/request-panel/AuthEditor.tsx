import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { EnvInput } from '../EnvAutocomplete';
import { SectionHeader } from './SectionHeader';
import type { AuthConfig } from '@/types/collection';
import type { EnvVariable } from '@/types/environment';

interface AuthEditorProps {
    auth: AuthConfig;
    onChange: (auth: AuthConfig) => void;
    envVariables?: EnvVariable[];
}

export const AuthEditor: React.FC<AuthEditorProps> = ({ auth, onChange, envVariables = [] }) => {
    const a = auth as any;
    return (
        <div className="max-w-2xl">
            <SectionHeader title="Authorization" description="Configure auth credentials sent with the request" />
            <div className="grid sm:grid-cols-[180px_1fr] gap-6">
                <div>
                    <Label className="text-xs text-muted-foreground mb-2 block">Auth Type</Label>
                    <Select value={a.type} onValueChange={(v: string) => onChange({ ...a, type: v } as AuthConfig)}>
                        <SelectTrigger className="h-9 bg-card">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">No Auth</SelectItem>
                            <SelectItem value="bearer">Bearer Token</SelectItem>
                            <SelectItem value="basic">Basic Auth</SelectItem>
                            <SelectItem value="apikey">API Key</SelectItem>
                            <SelectItem value="oauth2" disabled="true">OAuth 2.0</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="min-w-0">
                    {a.type === 'none' && (
                        <div className="rounded-lg border border-dashed border-border bg-secondary/40 p-6 text-center">
                            <p className="text-sm text-muted-foreground">This request does not use any authorization.</p>
                        </div>
                    )}
                    {a.type === 'bearer' && (
                        <div>
                            <Label className="text-xs text-muted-foreground mb-2 block">Token</Label>
                            <EnvInput
                                envVariables={envVariables}
                                value={a.token || ''}
                                onChange={(e) => onChange({ ...a, token: e.target.value } as AuthConfig)}
                                placeholder="Paste your bearer token"
                                className="mono text-sm bg-card h-9 rounded-md border border-input px-3 w-full outline-none focus:ring-1 focus:ring-ring"
                            />
                        </div>
                    )}
                    {a.type === 'basic' && (
                        <div className="space-y-3">
                            <div>
                                <Label className="text-xs text-muted-foreground mb-2 block">Username</Label>
                                <EnvInput
                                    envVariables={envVariables}
                                    value={a.username || ''}
                                    onChange={(e) => onChange({ ...a, username: e.target.value } as AuthConfig)}
                                    placeholder="username"
                                    className="mono text-sm bg-card h-9 rounded-md border border-input px-3 w-full outline-none focus:ring-1 focus:ring-ring"
                                />
                            </div>
                            <div>
                                <Label className="text-xs text-muted-foreground mb-2 block">Password</Label>
                                <EnvInput
                                    envVariables={envVariables}
                                    value={a.password || ''}
                                    onChange={(e) => onChange({ ...a, password: e.target.value } as AuthConfig)}
                                    placeholder="••••••••"
                                    type="password"
                                    className="mono text-sm bg-card h-9 rounded-md border border-input px-3 w-full outline-none focus:ring-1 focus:ring-ring"
                                />
                            </div>
                        </div>
                    )}
                    {a.type === 'apikey' && (
                        <div className="space-y-3">
                            <div>
                                <Label className="text-xs text-muted-foreground mb-2 block">Key</Label>
                                <EnvInput
                                    envVariables={envVariables}
                                    value={a.key || ''}
                                    onChange={(e) => onChange({ ...a, key: e.target.value } as AuthConfig)}
                                    placeholder="X-API-Key"
                                    className="mono text-sm bg-card h-9 rounded-md border border-input px-3 w-full outline-none focus:ring-1 focus:ring-ring"
                                />
                            </div>
                            <div>
                                <Label className="text-xs text-muted-foreground mb-2 block">Value</Label>
                                <EnvInput
                                    envVariables={envVariables}
                                    value={a.apiValue || ''}
                                    onChange={(e) => onChange({ ...a, apiValue: e.target.value } as AuthConfig)}
                                    placeholder="your_api_key"
                                    className="mono text-sm bg-card h-9 rounded-md border border-input px-3 w-full outline-none focus:ring-1 focus:ring-ring"
                                />
                            </div>
                        </div>
                    )}

                    {a.type === 'oauth2' && (
                        <div className="rounded-lg border border-border bg-card p-5">
                            <p className="text-sm font-medium mb-2">OAuth 2.0</p>
                            <p className="text-xs text-muted-foreground mb-3">Configure tokens via the authorization workflow.</p>
                            <Button size="sm" className="bg-gradient-primary text-primary-foreground">
                                Get New Access Token
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
