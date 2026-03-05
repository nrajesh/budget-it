import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(() => ({
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  },
  server: {
    host: "::",
    port: 8081,
  },
  preview: {
    port: 62153,
  },
  base: "./",
  plugins: [
    react(),
    {
      name: "html-csp",
      apply: "build",
      transformIndexHtml(html) {
        return html.replace(
          "<head>",
          `<head>
    <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' https://vercel.live; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://api.frankfurter.app wss://ws-us3.pusher.com https://vercel.live https://generativelanguage.googleapis.com https://api.openai.com https://api.perplexity.ai https://api.anthropic.com https://api.mistral.ai http://localhost:* http://127.0.0.1:*; frame-src 'self' https://vercel.live; font-src 'self' data:;">`,
        );
      },
    },
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes("node_modules")) {
            return "vendor";
          }
        },
      },
    },
  },
}));
