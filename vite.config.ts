import { defineConfig } from "vite";

export default defineConfig({
  // Vite also rewrites CSS font URLs when building for a hosting subpath.
  base: process.env.HANSEN_BASE || "/",
  define: { __RHINE_MODELS__: "{}" },
  server: { host: "127.0.0.1", port: 5175, strictPort: true },
  build: { outDir: "dist", emptyOutDir: true },
});
