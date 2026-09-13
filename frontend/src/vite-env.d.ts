/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Base URL of the backend API, including the "/api" prefix
   * (e.g. "https://your-backend.onrender.com/api"). Left unset in local
   * dev, where Vite's dev-server proxy forwards the default "/api" to
   * localhost:5000 (see vite.config.ts) - only needed when the frontend
   * and backend are deployed to different origins.
   */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
