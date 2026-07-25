import React from 'react';

interface SectionHeaderProps {
    title: string;
    description: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, description }) => (
    <div className="mb-3 flex items-end justify-between">
        <div>
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
    </div>
);
