// vite.config.ts
import react from "@vitejs/plugin-react";
import process from "process";
import { createRequire } from "module";
import { defineConfig, loadEnv } from "vite";
import path from "path";

const require = createRequire(import.meta.url);
const vitePrerender = require("vite-plugin-prerender");

export default defineConfig(({ mode, command }) => {
  const proxyTarget = loadEnv("prod", process.cwd(), "").VITE_BASE_URL;
  const isBuild = command === "build";
  const prerenderPlugin = isBuild
    ? vitePrerender({
        staticDir: path.resolve("dist"),
        routes: ["/", "/ko", "/en"],
      })
    : null;

  return {
    plugins: [react(), prerenderPlugin].filter(Boolean),
    server: {
      proxy: {
        "/api": {
          target: proxyTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ""),
          configure: (proxy) => {
            proxy.on("proxyReq", (proxyReq) => {
              proxyReq.removeHeader("origin");
            });
          },
        },
      },
    },
  };
});
