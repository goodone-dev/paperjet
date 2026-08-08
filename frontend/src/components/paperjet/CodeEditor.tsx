import CodeMirror from '@uiw/react-codemirror';
import { useTheme } from 'next-themes';
import { json } from '@codemirror/lang-json';
import { xml } from '@codemirror/lang-xml';
import { html } from '@codemirror/lang-html';
import { search } from '@codemirror/search';
import type { ViewUpdate } from '@codemirror/view';
import type { ReactCodeMirrorRef } from '@uiw/react-codemirror';
import type { BodyRaw } from '@/types/tab';
import { darkEditorTheme, darkSyntax, lightEditorTheme, lightSyntax } from '@/lib/codemirror-theme';
import { EditorView, keymap } from '@codemirror/view';
import { syntaxHighlighting } from '@codemirror/language';
import { Prec } from '@codemirror/state';
import React, { useState, useRef, useCallback, useEffect, useImperativeHandle, forwardRef } from 'react';
import type { EnvVariable } from '@/types/environment';
import { DropdownPos, EnvDropdown } from './EnvAutocomplete';

export interface CodeEditorProps {
    data?: BodyRaw | null;
    onChange?: (value: string) => void;
    envVariables?: EnvVariable[];
    className?: string;
    height?: string;
    readonly?: boolean;
    wrap?: boolean;
}

export const CodeEditor = forwardRef<ReactCodeMirrorRef, CodeEditorProps>(({
    data,
    onChange,
    envVariables = [],
    className,
    height,
    readonly = false,
    wrap = false,
}, ref) => {
    const { theme } = useTheme();
    const editorRef = useRef<ReactCodeMirrorRef>(null);
    useImperativeHandle(ref, () => editorRef.current!);

    const dropdownRef = useRef<HTMLDivElement>(null);

    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [activeIndex, setActiveIndex] = useState(0);
    const [dropdownPos, setDropdownPos] = useState<DropdownPos>({ top: 0, left: 0, width: 0 });

    const filtered = (envVariables || []).filter(
        (v) => v.key && (!query || v.key.toLowerCase().includes(query.toLowerCase())),
    );

    const commitSelection = useCallback((key: string) => {
        const view = editorRef.current?.view;
        if (!view) return;
        const pos = view.state.selection.main.head;
        const line = view.state.doc.lineAt(pos);
        const textBefore = line.text.slice(0, pos - line.from);
        const textAfter = line.text.slice(pos - line.from);

        const matchIdx = textBefore.lastIndexOf('{{');
        if (matchIdx !== -1) {
            const from = line.from + matchIdx;
            let to = pos;

            if (textAfter.startsWith('}}')) {
                to += 2;
            } else if (textAfter.startsWith('}')) {
                to += 1;
            }

            const insertText = `{{${key}}}`;
            view.dispatch({
                changes: { from, to, insert: insertText },
                selection: { anchor: from + insertText.length }
            });
            view.focus();
        }
        setOpen(false);
    }, []);

    const customKeymap = React.useMemo(() => Prec.highest(keymap.of([
        {
            key: 'ArrowDown',
            run: () => {
                if (!open) return false;
                setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
                return true;
            }
        },
        {
            key: 'ArrowUp',
            run: () => {
                if (!open) return false;
                setActiveIndex((i) => Math.max(i - 1, 0));
                return true;
            }
        },
        {
            key: 'Enter',
            run: () => {
                if (!open) return false;
                if (filtered[activeIndex]) {
                    commitSelection(filtered[activeIndex].key);
                }
                return true;
            }
        },
        {
            key: 'Escape',
            run: () => {
                if (!open) return false;
                setOpen(false);
                return true;
            }
        }
    ])), [open, filtered, activeIndex, commitSelection]);

    const getExtensions = () => {
        const type = data?.type || 'text';
        switch (type) {
            case 'json': return [json()];
            case 'xml': return [xml()];
            case 'html': return [html()];
            default: return [];
        }
    };

    const handleUpdate = useCallback((viewUpdate: ViewUpdate) => {
        if (!viewUpdate.docChanged && !viewUpdate.selectionSet) return;

        const view = viewUpdate.view;
        const pos = view.state.selection.main.head;
        const line = view.state.doc.lineAt(pos);
        const textBefore = line.text.slice(0, pos - line.from);

        const matchIdx = textBefore.lastIndexOf('{{');
        if (matchIdx !== -1) {
            const between = textBefore.slice(matchIdx + 2);
            if (!between.includes('}}')) {
                setQuery(between);
                setActiveIndex(0);

                const coords = view.coordsAtPos(pos);
                if (coords) {
                    setDropdownPos({
                        top: coords.bottom + window.scrollY + 4,
                        left: coords.left + window.scrollX,
                        width: 240,
                    });
                }
                setOpen(true);
                return;
            }
        }
        setOpen(false);
    }, []);

    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            const target = e.target as Node | null;
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(target) &&
                !(editorRef.current?.view?.dom.contains(target))
            ) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    useEffect(() => {
        if (!open || !dropdownRef.current) return;
        const active = dropdownRef.current.querySelector('[data-active="true"]');
        active?.scrollIntoView({ block: 'nearest' });
    }, [activeIndex, open]);

    const isDark = theme === 'dark';
    const editorTheme = isDark ? darkEditorTheme : lightEditorTheme;
    const syntaxTheme = isDark ? syntaxHighlighting(darkSyntax) : syntaxHighlighting(lightSyntax);

    const allExtensions = [
        customKeymap,
        search({ top: true }),
        editorTheme,
        syntaxTheme,
        ...getExtensions(),
        ...(wrap ? [EditorView.lineWrapping] : []),
    ];

    return (
        <>
            <CodeMirror
                ref={editorRef}
                value={data?.value}
                height={height}
                extensions={allExtensions}
                theme="none"
                onChange={(val) => onChange?.(val)}
                onUpdate={handleUpdate}
                className={className}
                readOnly={readonly}
            />
            <EnvDropdown
                dropdownRef={dropdownRef}
                open={open && filtered.length > 0}
                filtered={filtered}
                activeIndex={activeIndex}
                onSelect={commitSelection}
                pos={dropdownPos}
            />
        </>
    );
});