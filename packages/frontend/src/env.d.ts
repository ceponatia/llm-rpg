/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MEMORY_API?: string;
  readonly VITE_ADMIN_DASHBOARD_ORIGIN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
