import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@/index.css";
import App from "@/App";
import { installBrowserRuntimeShim } from "@/lib/preview-shim";

// Install the browser preview shim before any component tries to call the
// Wails bridge. No-op inside the real desktop app.
installBrowserRuntimeShim();

// React Query cache freshness: data is considered fresh for one minute before
// being refetched. Chosen to match PaperJet's average interactive session length.
const QUERY_STALE_TIME_MS = 60_000;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: QUERY_STALE_TIME_MS,
      refetchOnWindowFocus: false,
    },
  },
});

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>,
);
