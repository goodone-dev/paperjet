import React from 'react';
import { cn } from '@/lib/utils';
import { methodColorMap } from '@/types/collection';

const methodBgMap: Record<string, string> = {
    GET: 'bg-success-soft text-method-get',
    POST: 'bg-warning-soft text-method-post',
    PUT: 'bg-primary-soft text-method-put',
    PATCH: 'bg-accent text-method-patch',
    DELETE: 'bg-destructive/10 text-method-delete',
    HEAD: 'bg-info-soft text-info',
    OPTIONS: 'bg-muted text-muted-foreground',
};

const SIZE_CLASS: Record<string, string> = {
    xs: 'text-[10px] px-1.5 py-0.5',
    md: 'text-xs px-2 py-1',
    sm: 'text-[11px] px-2 py-0.5',
};

interface MethodBadgeProps {
    method: string;
    size?: 'xs' | 'sm' | 'md';
    className?: string;
}

export const MethodBadge: React.FC<MethodBadgeProps> = ({ method, size = 'sm', className }) => {
    const sizeClass = SIZE_CLASS[size] || SIZE_CLASS.sm;
    return (
        <span
            className={cn(
                'mono font-semibold rounded-md tracking-wide inline-flex items-center justify-center min-w-[3rem]',
                methodBgMap[method] || 'bg-muted text-muted-foreground',
                sizeClass,
                className,
            )}
        >
            {method}
        </span>
    );
};

interface MethodLabelProps {
    method: string;
    className?: string;
}

export const MethodLabel: React.FC<MethodLabelProps> = ({ method, className }) => (
    <span className={cn('mono font-bold text-xs tracking-wide', methodColorMap[method], className)}>{method}</span>
);
