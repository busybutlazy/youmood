import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// nginx 反向代理 /api/* 至後端；本地開發時透過 proxy 轉發。
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
});
