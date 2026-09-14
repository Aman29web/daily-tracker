/**
 * Expo inlines EXPO_PUBLIC_-prefixed env vars into the bundle at build time
 * (the mobile equivalent of Vite's VITE_ prefix on the web app). There is no
 * dev-server proxy on mobile, so this must always be the backend's full
 * "http://<lan-ip>:<port>/api" URL - see .env.example.
 */
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:5000/api";
