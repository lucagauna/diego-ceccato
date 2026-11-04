// @ts-check
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://diegoceccato.com.ar",
  trailingSlash: "always",
  build: { format: "directory" },
});
