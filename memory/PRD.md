# Postie — Refactoring PRD

## Original problem
Implement the 4-phase refactoring plan for the Postie frontend (Wails desktop HTTP client, React 19 + Tailwind + shadcn/ui). Plan covered 17 findings across type-safety, logic extraction, prop drilling and dead code.

## User preferences (confirmed)
- All 4 phases in one pass
- TypeScript `"strict": true` from day one
- No test runner — verify only via `tsc --noEmit` + `yarn build`
- Leave Wails-generated `wailsjs/` untyped (excluded from tsc)

## Architecture (post-refactor)
```
src/
├── types/              # 6 typed domain files (workspace, collection, environment, tab, response, dnd)
├── lib/                # utils.ts, json-format.ts, persist.ts, env-resolve.ts,
│                       # request-mapper.ts (mapBackendRequestToTab / mapTabToSavePayload / buildRequestPayload),
│                       # url-sync.ts (syncParamsFromUrl, syncPathVariablesFromUrl)
├── hooks/              # useWorkspaceData.ts (useCallback-wrapped, render-phase setState fixed),
│                       # useTabs.ts (same fix), useRequestSend.ts, useRequestSave.ts
├── components/postie/
│   ├── request-panel/  # AuthEditor, BodyEditor, ScriptsPlaceholder, SettingsPanel, SectionHeader + barrel
│   ├── AppWorkspace.tsx (~280 lines, down from 415)
│   └── ...all other components .tsx with explicit prop types
├── components/ui/      # shadcn (.jsx) + auto-generated .d.ts shims per file
└── global.d.ts         # module shims for Wails bindings
```

## What's been implemented (2026-01)
- **Phase 1 – Types**: 6 domain type files; all shared shapes strictly typed.
- **Phase 2 – State/Data**:
  - `mapBackendRequestToTab` / `mapTabToSavePayload` / `buildRequestPayload` — single source of truth for backend↔tab mapping (Findings #1, #2, #3).
  - `syncParamsFromUrl` / `syncPathVariablesFromUrl` — extracted 60-line URL handler (Finding #5).
  - `useWorkspaceData` and `useTabs` converted to TS; factory functions replaced with `useCallback`-wrapped closures inside the hook body (Finding #4); render-phase setState anti-pattern replaced with `useEffect` (Finding #9).
  - New focused hooks `useRequestSend` / `useRequestSave` (Findings #3, #2).
- **Phase 3 – Components**: All 12 components converted to `.tsx` with explicit prop interfaces. `RequestPanel` split into `request-panel/` subdirectory. Sidebar prop-drilling fix: typed `SidebarActions` slice replaces the drilled `data` bag (Finding #11). `ResponsePanel` unnecessary `tokenizeJSON` dep removed (Finding #12). `SettingRow` intent-comment added (Finding #16). Duplicated `HTTP_METHODS` / `methodColorMap` consolidated into `types/collection.ts` (Finding #7). `useConfirmDialog` internal wrapper inlined (Finding #8). `resolveEnvVars` moved out of `RequestPanel` into `lib/env-resolve.ts` (Finding #13).
- **Phase 4 – Cleanup**: `src/data/mockData.js`, `src/hooks/useToast.js`, `src/lib/*.js` deleted (Findings #6, #15, #17). Old `jsconfig.json` removed.

## Verification
- `npx tsc --noEmit` → 0 errors
- `yarn build` → succeeds, main.js gzipped 228 kB, css 11.45 kB

## Backlog
- P2: Wails bindings could get hand-written `.d.ts` shims for real type-safety at the boundary (user chose to leave untyped for now)
- P2: Add a real test runner (Jest/Vitest) and unit tests for `request-mapper` and `url-sync` pure functions
- P2: `SettingsPanel` toggles are ephemeral — persist to backend when a settings backend endpoint exists
- P3: Convert `App.js` / `index.js` to `.tsx` (currently work as-is)
