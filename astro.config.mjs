import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://carpenterveta.es",
  compressHTML: true,
  build: {
    inlineStylesheets: "auto",
  },
});
