import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface InlineEditProps {
    defaultValue?: string;
    placeholder?: string;
    onSubmit: (value: string) => void;
    onCancel: () => void;
    className?: string;
}

// Inline text editor for create/rename. Seamless (no row size change).
// Enter submits, Esc cancels, blur submits.
export const InlineEdit: React.FC<InlineEditProps> = ({
    defaultValue = '',
    placeholder,
    onSubmit,
    onCancel,
    className,
}) => {
    const [value, setValue] = useState(defaultValue);
    const ref = useRef<HTMLInputElement>(null);
    const done = useRef(false);

    useEffect(() => {
        const el = ref.current;
        if (el) {
            setTimeout(() => {
                el.focus();
                el.select();
            }, 10);
        }
    }, []);

    const finish = (commit: boolean) => {
        if (done.current) return;
        done.current = true;
        const trimmed = value.trim();
        if (commit && trimmed) onSubmit(trimmed);
        else onCancel();
    };

    return (
        <input
            ref={ref}
            autoFocus
            data-testid="inline-edit-input"
            size={1}
            value={value}
            placeholder={placeholder}
            onChange={(e) => setValue(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            onDoubleClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === 'Enter') {
                    e.preventDefault();
                    finish(true);
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    finish(false);
                }
            }}
            onBlur={() => finish(true)}
            className={cn(
                'block w-full flex-1 min-w-0 h-5 leading-5 px-1 -mx-1 bg-transparent text-[13px] rounded-sm outline-none border-0 ring-0 focus:ring-0 focus-visible:ring-0',
                className,
            )}
        />
    );
};
