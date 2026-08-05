import React, { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Code2 } from 'lucide-react';
import { KeyValueEditor } from '../KeyValueEditor';
import { EnvCodeMirror } from '../EnvAutocomplete';
import { beautify } from '@/lib/raw-beautifier';
import type { BodyRaw, RequestTab } from '@/types/tab';
import type { EnvVariable } from '@/types/environment';

interface BodyEditorProps {
    request: RequestTab;
    update: (patch: Partial<RequestTab>) => void;
    envVariables?: EnvVariable[];
}

export const BodyEditor: React.FC<BodyEditorProps> = ({ request, update, envVariables = [] }) => {
    const types = [
        { id: 'none', label: 'none', disabled: false },
        { id: 'form-data', label: 'form-data', disabled: false },
        { id: 'x-www-form-urlencoded', label: 'x-www-form-urlencoded', disabled: false },
        { id: 'raw', label: 'raw', disabled: false },
        { id: 'binary', label: 'binary', disabled: false },
        { id: 'graphql', label: 'GraphQL', disabled: true },
    ] as const;

    const handleBeautify = useCallback(() => {
        if (request.bodyType !== 'raw' || !request.bodyRaw?.value) return;

        const beautified = beautify(request.bodyRaw.type || 'json', request.bodyRaw.value);
        update({ bodyRaw: { ...request.bodyRaw, value: beautified } as BodyRaw });
    }, [request.bodyType, request.bodyRaw, update]);

    return (
        <div>
            <div className="mb-3">
                <RadioGroup
                    value={request.bodyType}
                    onValueChange={(v: string) => update({ bodyType: v as RequestTab['bodyType'] })}
                    className="flex flex-wrap gap-x-5 gap-y-2"
                >
                    {types.map((t) => (
                        <label
                            key={t.id}
                            htmlFor={`bt-${t.id}`}
                            className="flex items-center gap-2 cursor-pointer text-[13px] text-foreground"
                        >
                            <RadioGroupItem value={t.id} id={`bt-${t.id}`} disabled={t.disabled} />
                            {t.label}
                        </label>
                    ))}
                    <div className="ml-auto flex items-center gap-2">
                        {request.bodyType === 'raw' && (
                            <Select
                                defaultValue={request.bodyRaw?.type || 'json'}
                                onValueChange={(value: string) => update({ bodyRaw: { ...request.bodyRaw, type: value as BodyRaw['type'] } as BodyRaw })}
                            >
                                <SelectTrigger className="h-7 text-xs w-28 bg-card">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="json">JSON</SelectItem>
                                    <SelectItem value="xml">XML</SelectItem>
                                    <SelectItem value="html">HTML</SelectItem>
                                    <SelectItem value="text">Text</SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5" onClick={handleBeautify}>
                            <Code2 className="h-3.5 w-3.5" /> Beautify
                        </Button>
                    </div>
                </RadioGroup>
            </div>

            {request.bodyType === 'none' && (
                <div className="rounded-lg border border-dashed border-border bg-secondary/40 p-12 text-center">
                    <p className="text-sm text-muted-foreground">This request does not have a body</p>
                </div>
            )}
            {request.bodyType === 'raw' && (
                <div className="rounded-lg border border-border bg-card overflow-hidden">
                    <div className="flex bg-secondary/50 border-b border-border">
                        <div className="px-3 py-2 text-[11px] text-muted-foreground mono uppercase tracking-wider font-semibold">
                            {request.bodyRaw?.type || 'json'}
                        </div>
                    </div>
                    <EnvCodeMirror
                        raw={request.bodyRaw}
                        height="260px"
                        envVariables={envVariables}
                        onChange={(value) => update({ bodyRaw: { ...request.bodyRaw, value } as BodyRaw })}
                        className="text-sm border-0 bg-card outline-none"
                    />
                </div>
            )}
            {request.bodyType === 'form-data' && (
                <KeyValueEditor
                    rows={request.bodyFormData}
                    envVariables={envVariables}
                    onChange={(rows) => update({ bodyFormData: rows })}
                    placeholderKey="key"
                    placeholderValue="value"
                />
            )}
            {request.bodyType === 'x-www-form-urlencoded' && (
                <KeyValueEditor
                    rows={request.bodyUrlEncoded}
                    envVariables={envVariables}
                    onChange={(rows) => update({ bodyUrlEncoded: rows })}
                    placeholderKey="key"
                    placeholderValue="value"
                />
            )}
            {request.bodyType === 'binary' && (
                <div className="rounded-lg border border-dashed border-border bg-secondary/40 p-12 text-center">
                    <Button variant="outline" size="sm">
                        Select File
                    </Button>
                </div>
            )}
            {request.bodyType === 'graphql' && (
                <div className="rounded-lg border border-border bg-card overflow-hidden">
                    <Textarea
                        defaultValue={'query {\n  user(id: "1") {\n    id\n    name\n    email\n  }\n}'}
                        className="min-h-[220px] mono text-sm border-0 rounded-none focus-visible:ring-0 bg-card resize-none"
                    />
                </div>
            )}
        </div>
    );
};
