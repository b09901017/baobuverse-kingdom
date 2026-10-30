import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      workbox: {
        // /__/ 是 Firebase Hosting 自己的網址（Google 登入的 /__/auth/handler）：不要拿國庫的頁面頂替，
        // 不然 redirect 登入會停在國庫的「載入中」、到不了 Google（2026-10-30 段五在正式網址上遇到）
        navigateFallbackDenylist: [/^\/__\//],
      },
      manifest: {
        name: "國庫",
        short_name: "國庫",
        description: "寶步宇宙王國的記帳",
        lang: "zh-Hant-TW",
        start_url: "/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#2f5d50",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
    }),
  ],
});
