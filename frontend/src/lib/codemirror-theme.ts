import { EditorView, keymap } from '@codemirror/view';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags } from '@lezer/highlight';

export const lightSyntax = HighlightStyle.define([
    { tag: tags.keyword, color: 'hsl(219 90% 50%)' },
    { tag: [tags.string, tags.special(tags.string)], color: 'hsl(152 64% 38%)' },
    { tag: [tags.number, tags.integer], color: 'hsl(280 70% 55%)' },
    { tag: tags.bool, color: 'hsl(0 78% 55%)' },
    { tag: tags.null, color: 'hsl(0 78% 55%)' },
    { tag: [tags.propertyName, tags.attributeName], color: 'hsl(219 90% 46%)', fontWeight: '500' },
    { tag: tags.comment, color: 'hsl(217 12% 55%)', fontStyle: 'italic' },
    { tag: [tags.punctuation, tags.bracket, tags.separator], color: 'hsl(217 12% 55%)' },
    { tag: tags.tagName, color: 'hsl(219 90% 50%)', fontWeight: '500' },
    { tag: tags.angleBracket, color: 'hsl(217 12% 55%)' },
    { tag: tags.operator, color: 'hsl(222 35% 40%)' },
    { tag: tags.meta, color: 'hsl(217 12% 55%)' },
]);

export const darkSyntax = HighlightStyle.define([
    { tag: tags.keyword, color: 'hsl(219 90% 75%)' },
    { tag: [tags.string, tags.special(tags.string)], color: 'hsl(152 55% 60%)' },
    { tag: [tags.number, tags.integer], color: 'hsl(280 70% 75%)' },
    { tag: tags.bool, color: 'hsl(0 70% 68%)' },
    { tag: tags.null, color: 'hsl(0 70% 68%)' },
    { tag: [tags.propertyName, tags.attributeName], color: 'hsl(219 90% 78%)', fontWeight: '500' },
    { tag: tags.comment, color: 'hsl(215 15% 50%)', fontStyle: 'italic' },
    { tag: [tags.punctuation, tags.bracket, tags.separator], color: 'hsl(215 15% 55%)' },
    { tag: tags.tagName, color: 'hsl(219 90% 75%)', fontWeight: '500' },
    { tag: tags.angleBracket, color: 'hsl(215 15% 55%)' },
    { tag: tags.operator, color: 'hsl(215 25% 70%)' },
    { tag: tags.meta, color: 'hsl(215 15% 50%)' },
]);

export const lightEditorTheme = EditorView.theme({
    '&': { background: 'transparent', color: 'hsl(222 35% 14%)' },
    '.cm-content': { caretColor: 'hsl(219 90% 56%)' },
    '.cm-cursor, .cm-dropCursor': { borderLeftColor: 'hsl(219 90% 56%)', borderLeftWidth: '2px' },
    '&.cm-focused .cm-cursor': { borderLeftColor: 'hsl(219 90% 56%)' },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': { background: 'hsl(219 90% 56% / 0.15)' },
    '.cm-gutters': { background: 'transparent', color: 'hsl(217 12% 60%)', border: 'none', borderRight: '1px solid hsl(215 28% 91%)' },
    '.cm-lineNumbers .cm-gutterElement': { minWidth: '40px', padding: '0 8px 0 4px', color: 'hsl(217 12% 60%)', fontSize: '12px' },
    '.cm-activeLine': { background: 'hsl(214 40% 96% / 0.6)' },
    '.cm-activeLineGutter': { background: 'hsl(214 40% 96% / 0.6)', color: 'hsl(222 35% 14%)' },
    '.cm-matchingBracket, .cm-nonmatchingBracket': { background: 'hsl(219 90% 56% / 0.12)', borderRadius: '2px', outline: '1px solid hsl(219 90% 56% / 0.3)' },
    '.cm-tooltip': { background: 'hsl(0 0% 100%)', border: '1px solid hsl(215 28% 91%)', borderRadius: '0.5rem', boxShadow: '0 4px 16px -2px hsl(219 50% 30% / 0.1)', color: 'hsl(222 35% 14%)' },
    '.cm-tooltip-autocomplete ul li[aria-selected]': { background: 'hsl(219 95% 96%)', color: 'hsl(219 90% 36%)' },
}, { dark: false });

export const darkEditorTheme = EditorView.theme({
    '&': { background: 'transparent', color: 'hsl(215 25% 96%)' },
    '.cm-content': { caretColor: 'hsl(219 90% 62%)' },
    '.cm-cursor, .cm-dropCursor': { borderLeftColor: 'hsl(219 90% 62%)', borderLeftWidth: '2px' },
    '&.cm-focused .cm-cursor': { borderLeftColor: 'hsl(219 90% 62%)' },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': { background: 'hsl(219 90% 62% / 0.2)' },
    '.cm-gutters': { background: 'transparent', color: 'hsl(215 15% 40%)', border: 'none', borderRight: '1px solid hsl(222 25% 18%)' },
    '.cm-lineNumbers .cm-gutterElement': { minWidth: '40px', padding: '0 8px 0 4px', color: 'hsl(215 15% 40%)', fontSize: '12px' },
    '.cm-activeLine': { background: 'hsl(222 25% 14% / 0.6)' },
    '.cm-activeLineGutter': { background: 'hsl(222 25% 14% / 0.6)', color: 'hsl(215 25% 96%)' },
    '.cm-matchingBracket, .cm-nonmatchingBracket': { background: 'hsl(219 90% 62% / 0.15)', borderRadius: '2px', outline: '1px solid hsl(219 90% 62% / 0.35)' },
    '.cm-tooltip': { background: 'hsl(222 32% 10%)', border: '1px solid hsl(222 25% 18%)', borderRadius: '0.5rem', boxShadow: '0 4px 16px -2px hsl(219 80% 20% / 0.2)', color: 'hsl(215 25% 96%)' },
    '.cm-tooltip-autocomplete ul li[aria-selected]': { background: 'hsl(222 25% 16%)', color: 'hsl(219 90% 75%)' },
}, { dark: true });