import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/RAG-SaaS-Agent/",
  plugins: [
    react({
      fastRefresh: false, // вимикаємо, щоб уникнути eval і CSP проблем
    }),
  ],
  server: {
    host: "::",
    port: 8080,
  },
  resolve: {
    alias: {
      "@": "/src",
    },
  },
});