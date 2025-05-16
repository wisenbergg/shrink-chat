/* postcss.config.mjs — ESM, but plugin names as strings */
export default {
  plugins: {
    '@tailwindcss/postcss': {},   // Tailwind v4 PostCSS engine
    autoprefixer: {},             // Vendor prefixing
  },
};
