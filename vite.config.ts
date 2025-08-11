import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

const repo = "flipbook";

export default defineConfig({
  base: `/${repo}/`,
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/*", "apple-touch-icon.png", "favicon-16x16.png", "favicon-32x32.png"],
      manifest: {
        name: "Flipbook GIF Maker",
        short_name: "Flipbook",
        start_url: `/${repo}/`,
        scope: `/${repo}/`,
        display: "standalone",
        theme_color: "#1f6feb",
        background_color: "#000000",
        // 先頭にスラッシュを付けない（base配下で解決させる）
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icons/maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
          { src: "icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
        ]
      },
      workbox: {
        navigateFallback: `/${repo}/index.html`,
        globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
      },
    }),
  ],
});
