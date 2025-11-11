import path from "node:path";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@/constants": path.resolve(__dirname, "src/constants"),
      "@/schemas": path.resolve(__dirname, "src/schemas"),
      "server-only": path.resolve(__dirname, "server-only.ts"),
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./vitest.setup.ts",
    include: ["**/*.{test,spec}.{ts,tsx}"],
  },
});
