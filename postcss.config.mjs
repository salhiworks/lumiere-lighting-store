/* Tailwind CSS for webpack builds (`next build --webpack`, Hostinger's workaround when the native SWC binary can't load). */
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
