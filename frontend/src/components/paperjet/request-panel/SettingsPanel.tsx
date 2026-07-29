import React from 'react';
import { cn } from '@/lib/utils';

// NOTE: `SettingRow` maintains local toggle state that is intentionally ephemeral (UI-only).
// The settings are not currently persisted — clarified to make the design intent explicit (Finding #16).
interface SettingRowProps {
    title: string;
    description: string;
    defaultChecked?: boolean;
}

const SettingRow: React.FC<SettingRowProps> = ({ title, description, defaultChecked }) => {
    const [on, setOn] = React.useState(!!defaultChecked);
    return (
        <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-card">
            <div>
                <div className="text-sm font-medium">{title}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{description}</div>
            </div>
            <button
                onClick={() => setOn(!on)}
                className={cn('h-5 w-9 rounded-full relative transition-colors', on ? 'bg-primary' : 'bg-muted')}
            >
                <span
                    className={cn(
                        'absolute top-0.5 h-4 w-4 rounded-full bg-card shadow-sm transition-all',
                        on ? 'left-[18px]' : 'left-0.5',
                    )}
                />
            </button>
        </div>
    );
};

export const SettingsPanel: React.FC = () => (
    <div className="max-w-2xl space-y-4">
        <SettingRow title="Follow redirects" description="Follow HTTP 3xx redirects." defaultChecked />
        <SettingRow title="Strict SSL" description="Verify SSL certificates." defaultChecked />
        <SettingRow title="Encode URL automatically" description="Automatically encode URL parameters." defaultChecked />
        <SettingRow title="Disable cookie jar" description="Don't store cookies from this request." />
    </div>
);
