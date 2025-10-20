import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import cloudflare from "@astrojs/cloudflare";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  output: "server",
  adapter: cloudflare(),
  integrations: [
    tailwind({
      applyBaseStyles: false,
    }),
  ],
  vite: {
    resolve: {
      alias: {
        "@lib": path.resolve(__dirname, "./src/lib"),
        "@content": path.resolve(__dirname, "./src/content"),
        "@components": path.resolve(__dirname, "./src/components"),
        "@layouts": path.resolve(__dirname, "./src/layouts"),
        "@scripts": path.resolve(__dirname, "./src/scripts"),
        "@db": path.resolve(__dirname, "../../packages/db"),
      },
    },
  },
});
