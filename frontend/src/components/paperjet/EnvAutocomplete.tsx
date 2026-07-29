import React, { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { EnvVariable } from '@/types/environment';

interface DropdownPos {
    top: number;
    left: number;
    width: number;
}

interface UseEnvAutocompleteResult {
    inputRef: React.RefObject<HTMLInputElement | HTMLTextAreaElement | null>;
    dropdownRef: React.RefObject<HTMLDivElement | null>;
    open: boolean;
    filtered: EnvVariable[];
    activeIndex: number;
    dropdownPos: DropdownPos;
    handleInput: (e: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    commitSelection: (key: string) => void;
    setOpen: (open: boolean) => void;
}

export function useEnvAutocomplete(
    envVariables: EnvVariable[] = [],
    onSelect?: (key: string) => void,
): UseEnvAutocompleteResult {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [activeIndex, setActiveIndex] = useState(0);
    const [dropdownPos, setDropdownPos] = useState<DropdownPos>({ top: 0, left: 0, width: 0 });
    const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
    const dropdownRef = useRef<HTMLDivElement | null>(null);

    const filtered = (envVariables || []).filter(
        (v) => v.key && (!query || v.key.toLowerCase().includes(query.toLowerCase())),
    );

    const getQueryAtCaret = useCallback((el: HTMLInputElement | HTMLTextAreaElement): string | null => {
        const val = el.value;
        const caret = el.selectionStart ?? val.length;
        const before = val.slice(0, caret);
        const matchIdx = before.lastIndexOf('{{');
        if (matchIdx === -1) return null;
        const between = before.slice(matchIdx + 2);
        if (between.includes('}}')) return null;
        return between;
    }, []);

    const updatePosition = useCallback(() => {
        const el = inputRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        setDropdownPos({
            top: rect.bottom + window.scrollY + 4,
            left: rect.left + window.scrollX,
            width: Math.max(rect.width, 240),
        });
    }, []);

    const handleInput = useCallback(
        (e: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>) => {
            const target = e.target as HTMLInputElement | HTMLTextAreaElement;
            const q = getQueryAtCaret(target);
            if (q !== null) {
                setQuery(q);
                setActiveIndex(0);
                updatePosition();
                setOpen(true);
            } else {
                setOpen(false);
            }
        },
        [getQueryAtCaret, updatePosition],
    );

    const commitSelection = useCallback(
        (key: string) => {
            const el = inputRef.current;
            if (!el) return;
            const val = el.value;
            const caret = el.selectionStart ?? val.length;
            const before = val.slice(0, caret);
            const matchIdx = before.lastIndexOf('{{');
            const after = val.slice(caret);
            const newVal = before.slice(0, matchIdx) + `{{${key}}}` + after;
            const proto =
                el.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
            nativeInputValueSetter?.call(el, newVal);
            el.dispatchEvent(new Event('input', { bubbles: true }));
            const newCaret = matchIdx + key.length + 4;
            requestAnimationFrame(() => {
                el.setSelectionRange(newCaret, newCaret);
                el.focus();
            });
            setOpen(false);
            onSelect?.(key);
        },
        [onSelect],
    );

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
            if (!open) return;
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveIndex((i) => Math.max(i - 1, 0));
            } else if (e.key === 'Enter') {
                if (filtered[activeIndex]) {
                    e.preventDefault();
                    commitSelection(filtered[activeIndex].key);
                }
            } else if (e.key === 'Escape') {
                setOpen(false);
            }
        },
        [open, filtered, activeIndex, commitSelection],
    );

    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            const target = e.target as Node | null;
            if (
                inputRef.current &&
                target &&
                !(inputRef.current as unknown as Node).contains(target) &&
                dropdownRef.current &&
                !dropdownRef.current.contains(target)
            ) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    useEffect(() => {
        if (!open) return;
        const reposition = () => updatePosition();
        window.addEventListener('scroll', reposition, true);
        window.addEventListener('resize', reposition);
        return () => {
            window.removeEventListener('scroll', reposition, true);
            window.removeEventListener('resize', reposition);
        };
    }, [open, updatePosition]);

    useEffect(() => {
        if (!open || !dropdownRef.current) return;
        const active = dropdownRef.current.querySelector('[data-active="true"]');
        active?.scrollIntoView({ block: 'nearest' });
    }, [activeIndex, open]);

    return {
        inputRef,
        dropdownRef,
        open: open && filtered.length > 0,
        filtered,
        activeIndex,
        dropdownPos,
        handleInput,
        handleKeyDown,
        commitSelection,
        setOpen,
    };
}

interface EnvDropdownProps {
    dropdownRef: React.RefObject<HTMLDivElement | null>;
    open: boolean;
    filtered: EnvVariable[];
    activeIndex: number;
    onSelect: (key: string) => void;
    pos: DropdownPos;
}

export const EnvDropdown: React.FC<EnvDropdownProps> = ({ dropdownRef, open, filtered, activeIndex, onSelect, pos }) => {
    if (!open || typeof document === 'undefined') return null;

    return createPortal(
        <div
            ref={dropdownRef}
            className="fixed z-[9999] rounded-lg border border-border bg-card shadow-elegant overflow-hidden"
            style={{ top: pos.top, left: pos.left, width: pos.width, minWidth: 220, maxWidth: 360 }}
        >
            <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground bg-secondary/60 border-b border-border">
                Environment Variables
            </div>
            <div className="max-h-52 overflow-y-auto scrollbar-thin">
                {filtered.map((v, i) => (
                    <button
                        key={v.key}
                        data-active={i === activeIndex ? 'true' : 'false'}
                        onMouseDown={(e) => {
                            e.preventDefault();
                            onSelect(v.key);
                        }}
                        className={`w-full text-left flex items-center gap-3 px-3 py-2 text-sm transition-colors ${
                            i === activeIndex
                                ? 'bg-primary/15 text-foreground'
                                : 'hover:bg-secondary/60 text-foreground'
                        }`}
                    >
                        <span className="mono text-[13px] font-medium text-primary truncate flex-shrink-0 max-w-[40%]">
                            {v.key}
                        </span>
                        <div className="flex flex-col flex-1 min-w-0">
                            <span className="text-[12px] text-muted-foreground truncate min-w-0">
                                {v.value || <span className="italic opacity-50">empty</span>}
                            </span>
                            {v.description && (
                                <span className="text-[10px] text-muted-foreground/70 truncate min-w-0">
                                    {v.description}
                                </span>
                            )}
                        </div>
                    </button>
                ))}
            </div>
        </div>,
        document.body,
    );
};

interface EnvInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
    envVariables?: EnvVariable[];
    onChange?: React.ChangeEventHandler<HTMLInputElement>;
}

export const EnvInput: React.FC<EnvInputProps> = ({ envVariables, onChange, className, ...props }) => {
    const {
        inputRef, dropdownRef, open, filtered, activeIndex,
        dropdownPos, handleInput, handleKeyDown, commitSelection,
    } = useEnvAutocomplete(envVariables);

    return (
        <>
            <input
                ref={inputRef as React.RefObject<HTMLInputElement>}
                {...props}
                className={className}
                onChange={(e) => {
                    handleInput(e);
                    onChange?.(e);
                }}
                onKeyDown={(e) => {
                    handleKeyDown(e);
                    props.onKeyDown?.(e);
                }}
            />
            <EnvDropdown
                dropdownRef={dropdownRef}
                open={open}
                filtered={filtered}
                activeIndex={activeIndex}
                onSelect={commitSelection}
                pos={dropdownPos}
            />
        </>
    );
};

interface EnvTextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
    envVariables?: EnvVariable[];
    onChange?: React.ChangeEventHandler<HTMLTextAreaElement>;
}

export const EnvTextarea: React.FC<EnvTextareaProps> = ({ envVariables, onChange, className, ...props }) => {
    const {
        inputRef, dropdownRef, open, filtered, activeIndex,
        dropdownPos, handleInput, handleKeyDown, commitSelection,
    } = useEnvAutocomplete(envVariables);

    return (
        <>
            <textarea
                ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                {...props}
                className={className}
                onChange={(e) => {
                    handleInput(e);
                    onChange?.(e);
                }}
                onKeyDown={(e) => {
                    handleKeyDown(e);
                    props.onKeyDown?.(e);
                }}
            />
            <EnvDropdown
                dropdownRef={dropdownRef}
                open={open}
                filtered={filtered}
                activeIndex={activeIndex}
                onSelect={commitSelection}
                pos={dropdownPos}
            />
        </>
    );
};
