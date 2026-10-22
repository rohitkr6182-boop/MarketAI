import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Local npm run dev uses localhost; Docker Compose overrides this target.
      "/api": process.env.VITE_API_PROXY_TARGET || "http://localhost:8000",
    },
  },
});
