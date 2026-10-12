import { defineConfig } from "vite";
import { offlinePlugin } from "./scripts/offline-plugin";
export default defineConfig({
  plugins: [offlinePlugin()],
  base: "./",
  build: {
    target: "es2022",
    rollupOptions: { output: { manualChunks: { phaser: ["phaser"] } } },
  },
  server: { port: 5173, strictPort: true },
});
