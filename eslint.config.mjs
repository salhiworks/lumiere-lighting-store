import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Paired lamp photos (switched off / on) must render through identical plain <img> boxes so the lit photo lands on exactly the same
    // pixels; the rail also uses them as CSS masks. next/image would resize and re-encode each photo separately. See docs/ASSETS.md.
    files: ["components/ui/pendant-lamp-rail.tsx", "components/product/lamp-image.tsx", "components/admin/photo-pair-field.tsx"],
    rules: { "@next/next/no-img-element": "off" },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Untouched 21st.dev originals, kept for reference only.
    "reference/**",
  ]),
]);

export default eslintConfig;
