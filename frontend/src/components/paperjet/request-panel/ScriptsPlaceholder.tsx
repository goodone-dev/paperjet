import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { SectionHeader } from './SectionHeader';

interface ScriptsPlaceholderProps {
    title: string;
    description: string;
}

export const ScriptsPlaceholder: React.FC<ScriptsPlaceholderProps> = ({ title, description }) => (
    <div>
        <SectionHeader title={title} description={description} />
        <div className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="flex bg-secondary/50 border-b border-border px-3 py-2 text-[11px] mono text-muted-foreground uppercase tracking-wider font-semibold">
                JavaScript
            </div>
            <Textarea
                defaultValue={'// Examples\n// pm.environment.set("token", pm.response.json().token);\n// pm.test("Status is 200", () => pm.response.to.have.status(200));'}
                className="min-h-[220px] mono text-sm border-0 rounded-none focus-visible:ring-0 bg-card resize-none leading-relaxed"
            />
        </div>
    </div>
);
