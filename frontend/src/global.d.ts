// Type shim for shadcn/ui components (kept as .jsx per user preference).
// The individual per-file .d.ts stubs under `src/components/ui/*.d.ts`
// provide the actual component signatures. This declaration is retained
// only as a wildcard fallback if a new shadcn file gets added without
// its accompanying .d.ts.
declare module '@/components/ui/*' {
    import type { ComponentType, PropsWithChildren, HTMLAttributes } from 'react';
    type AnyProps = PropsWithChildren<HTMLAttributes<HTMLElement> & Record<string, any>>;
    const anyComponent: ComponentType<AnyProps>;
    export default anyComponent;
}
