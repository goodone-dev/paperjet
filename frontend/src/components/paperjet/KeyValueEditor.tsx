import React, { useState } from 'react';
import { Trash2, Edit3, AlignLeft, FileInput, TextCursorInput, ChevronDown } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EnvInput } from './EnvAutocomplete';
import type { KeyValueRow } from '@/types/collection';
import type { EnvVariable } from '@/types/environment';
import { SelectFile } from '@/lib/api';

interface KeyValueEditorProps {
    rows: KeyValueRow[];
    onChange: (rows: KeyValueRow[]) => void;
    placeholderKey?: string;
    placeholderValue?: string;
    showDescription?: boolean;
    showKeyType?: boolean;
    readonlyKey?: boolean;
    envVariables?: EnvVariable[];
}

export const KeyValueEditor: React.FC<KeyValueEditorProps> = ({
    rows,
    onChange,
    placeholderKey = 'Key',
    placeholderValue = 'Value',
    showDescription = true,
    showKeyType = false,
    readonlyKey = false,
    envVariables = [],
}) => {
    const [isBulkEdit, setIsBulkEdit] = useState(false);
    const [bulkText, setBulkText] = useState('');

    if (!isBulkEdit && !readonlyKey) {
        if (rows.length === 0 || rows[rows.length - 1].key) {
            rows.push({ id: `kv-${Date.now()}-${Math.floor(Math.random() * 1000)}`, key: '', type: 'text', value: '', description: '', enabled: true });
        }
    }

    const update = (id: string, field: keyof KeyValueRow, value: KeyValueRow[keyof KeyValueRow]) => {
        const next: KeyValueRow[] = rows.map((r) => (r.id === id ? { ...r, [field]: value } : r));
        if (!readonlyKey) {
            const last = next[next.length - 1];
            if (last && (last.key || last.value)) {
                next.push({
                    id: `kv-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                    key: '',
                    type: 'text',
                    value: '',
                    description: '',
                    enabled: true,
                });
            }
        }
        onChange(next);
    };

    const remove = (id: string) => {
        let next = rows.filter((r) => r.id !== id);
        if (next.length === 0) next = [{ id: `kv-${Date.now()}-${Math.floor(Math.random() * 1000)}`, key: '', type: 'text', value: '', description: '', enabled: true }];
        onChange(next);
    };

    const handleBulkToggle = () => {
        if (!isBulkEdit) {
            const text = rows
                .filter((r) => r.key || r.value)
                .map((r) => `${r.enabled ? '' : '// '}${r.key}:${r.value}`)
                .join('\n');
            setBulkText(text);
            setIsBulkEdit(true);
        } else {
            setIsBulkEdit(false);
        }
    };

    const handleBulkChange = (text: string) => {
        setBulkText(text);
        const lines = text.split('\n');
        const newRows: KeyValueRow[] = lines.map((line, i) => {
            let enabled = true;
            let textLine = line.trim();
            if (textLine.startsWith('//')) {
                enabled = false;
                textLine = textLine.slice(2).trim();
            }
            const colonIdx = textLine.indexOf(':');
            if (colonIdx === -1) {
                return { id: `kv-bulk-${i}`, key: textLine, type: 'text', value: '', description: '', enabled };
            }
            const key = textLine.slice(0, colonIdx).trim();
            const value = textLine.slice(colonIdx + 1).trim();
            return { id: `kv-bulk-${i}`, key, type: 'text', value, description: '', enabled };
        });
        if (newRows.length === 0 || newRows[newRows.length - 1].key) {
            newRows.push({ id: `kv-${Date.now()}-${Math.floor(Math.random() * 1000)}`, key: '', type: 'text', value: '', description: '', enabled: true });
        }
        onChange(newRows);
    };

    const inputBase =
        'h-9 border-0 border-l border-border rounded-none text-sm mono bg-transparent focus:outline-none focus-visible:ring-0 focus-visible:bg-primary-soft/50 px-3 w-full';

    const handleSelectFile = async (id: string) => {
        const path = await SelectFile();
        if (path) update(id, 'value', path);
    };

    return (
        <div className="rounded-lg border border-border overflow-hidden bg-card">
            <div className="grid grid-cols-[auto_1fr_1fr_1fr_auto] gap-0 bg-secondary/50 border-b border-border text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
                <div className="px-3 py-2 w-9" />
                <div className="px-3 py-2 border-l border-border">Key</div>
                <div className="px-3 py-2 border-l border-border">Value</div>
                {showDescription && <div className="px-3 py-2 border-l border-border">Description</div>}
                {!readonlyKey && <div className="px-3 py-2 w-10 border-l border-border" />}
            </div>
            {!isBulkEdit && (
                <div className="divide-y divide-border">
                    {rows.map((row) => (
                        <div
                            key={row.id}
                            className="grid grid-cols-[auto_1fr_1fr_1fr_auto] items-stretch group hover:bg-secondary/30 transition-colors"
                        >
                            <div className="px-3 py-2 flex items-center w-9">
                                <Checkbox
                                    checked={row.enabled}
                                    onCheckedChange={(v: boolean) => update(row.id, 'enabled', !!v)}
                                    className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                />
                            </div>

                            {readonlyKey ? (
                                <input
                                    value={row.key}
                                    readOnly
                                    className={`${inputBase} text-muted-foreground cursor-default select-none`}
                                />
                            ) : showKeyType ? (
                                <div className="flex items-stretch border-l border-border">
                                    <EnvInput
                                        envVariables={envVariables}
                                        value={row.key}
                                        onChange={(e) => update(row.id, 'key', e.target.value)}
                                        placeholder={placeholderKey}
                                        className={`${inputBase} border-0 flex-1`}
                                    />
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button
                                                className="flex items-center gap-1 px-2 text-muted-foreground hover:text-primary transition-colors border-l border-border"
                                                title="Change type"
                                            >
                                                {row.type === 'file' ? (
                                                    <FileInput className="h-3.5 w-3.5" />
                                                ) : (
                                                    <TextCursorInput className="h-3.5 w-3.5" />
                                                )}
                                                <ChevronDown className="h-3 w-3" />
                                            </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-32">
                                            <DropdownMenuItem
                                                onClick={() => update(row.id, 'type', 'text')}
                                                className="flex items-center gap-2"
                                            >
                                                <TextCursorInput className="h-3.5 w-3.5" />
                                                <span>Text</span>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => update(row.id, 'type', 'file')}
                                                className="flex items-center gap-2"
                                            >
                                                <FileInput className="h-3.5 w-3.5" />
                                                <span>File</span>
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            ) : (
                                <EnvInput
                                    envVariables={envVariables}
                                    value={row.key}
                                    onChange={(e) => update(row.id, 'key', e.target.value)}
                                    placeholder={placeholderKey}
                                    className={inputBase}
                                />
                            )}

                            {showKeyType && row.type === 'file' ? (
                                <div className="flex items-center border-l border-border min-w-0">
                                    {row.value ? (
                                        <div className="flex items-center w-full px-3 min-w-0">
                                            <span className="text-sm mono truncate" title={row.value}>
                                                {row.value.split(/[/\\]/).pop()}
                                            </span>
                                            <button
                                                onClick={() => handleSelectFile(row.id)}
                                                className="ml-2 text-xs text-primary hover:underline shrink-0"
                                            >
                                                Change
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => handleSelectFile(row.id)}
                                            className="flex items-center w-full h-full px-3 text-sm text-muted-foreground hover:text-primary transition-colors"
                                        >
                                            Select File
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <EnvInput
                                    envVariables={envVariables}
                                    value={row.value}
                                    onChange={(e) => update(row.id, 'value', e.target.value)}
                                    placeholder={placeholderValue}
                                    className={inputBase}
                                />
                            )}

                            {showDescription && (
                                <input
                                    value={row.description || ''}
                                    onChange={(e) => update(row.id, 'description', e.target.value)}
                                    placeholder="Description"
                                    className={`${inputBase} font-sans`}
                                />
                            )}

                            {!readonlyKey && (
                                <button
                                    onClick={() => remove(row.id)}
                                    className="w-10 flex items-center justify-center border-l border-border text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
            {isBulkEdit && (
                <div className="p-0 border-b border-border">
                    <textarea
                        value={bulkText}
                        onChange={(e) => handleBulkChange(e.target.value)}
                        placeholder="key:value"
                        className="w-full h-48 bg-transparent text-sm mono p-4 focus:outline-none resize-y"
                        spellCheck={false}
                    />
                </div>
            )}
            {!readonlyKey && (
                <div className="p-2 bg-secondary/30 flex justify-between items-center">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-primary hover:bg-primary-soft"
                        onClick={handleBulkToggle}
                    >
                        {isBulkEdit ? (
                            <>
                                <AlignLeft className="h-3.5 w-3.5 mr-1" /> Key-Value Edit
                            </>
                        ) : (
                            <>
                                <Edit3 className="h-3.5 w-3.5 mr-1" /> Bulk Edit
                            </>
                        )}
                    </Button>
                    <span className="text-[11px] text-muted-foreground">
                        {rows.filter((r) => r.enabled && r.key).length} active
                    </span>
                </div>
            )}
            {readonlyKey && (
                <div className="p-2 bg-secondary/30 flex justify-end items-center">
                    <span className="text-[11px] text-muted-foreground">
                        {rows.filter((r) => r.enabled).length} variable
                        {rows.filter((r) => r.enabled).length !== 1 ? 's' : ''}
                    </span>
                </div>
            )}
        </div>
    );
};
