import React, { useState, useEffect, useRef } from 'react';
import { Globe } from 'lucide-react';
import { KeyValueEditor } from './KeyValueEditor';
import { Badge } from '@/components/ui/badge';
import type { Environment, EnvVariable } from '@/types/environment';
import type { KeyValueRow } from '@/types/collection';

interface EnvironmentEditorProps {
    env: Environment;
    onChange: (vars: EnvVariable[]) => void;
}

// Environment variable editor shown as a main-area tab. Auto-saves when focus is lost.
export const EnvironmentEditor: React.FC<EnvironmentEditorProps> = ({ env, onChange }) => {
    const initialRows = (): KeyValueRow[] =>
        env.variables && env.variables.length > 0
            ? (env.variables as KeyValueRow[])
            : [{ id: 'v-empty', key: '', value: '', enabled: true }];

    const [localVars, setLocalVars] = useState<KeyValueRow[]>(initialRows);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setLocalVars(initialRows());
    }, [env.id, env.variables]);

    const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
        if (containerRef.current && !containerRef.current.contains(e.relatedTarget as Node | null)) {
            onChange(localVars as EnvVariable[]);
        }
    };

    return (
        <div
            ref={containerRef}
            className="flex flex-col h-full bg-background"
            data-testid="environment-editor"
            onBlur={handleBlur}
        >
            <div className="px-5 pt-4 pb-3 border-b border-border bg-card/40">
                <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-primary" />
                    <h2 className="text-[15px] font-semibold text-foreground">{env.name}</h2>
                    {env.active && (
                        <Badge variant="secondary" className="text-[10px] bg-success-soft text-success border-0">
                            Active
                        </Badge>
                    )}
                    <span className="ml-auto text-[11px] text-muted-foreground flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse-soft" />
                        Changes saved when focus is lost
                    </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                    Variables defined here can be referenced as <span className="mono">{'{{variable}}'}</span> in requests.
                </p>
            </div>

            <div className="flex-1 overflow-auto p-5 scrollbar-thin">
                <KeyValueEditor
                    key={env.id}
                    rows={localVars}
                    onChange={setLocalVars}
                    placeholderKey="VARIABLE"
                    placeholderValue="VALUE"
                    showDescription={true}
                />
            </div>
        </div>
    );
};
