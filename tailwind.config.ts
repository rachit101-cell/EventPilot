import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        gold: {
          50: "#FAF6EF",
          100: "#F3EBDD",
          200: "#E6D7BD",
          300: "#D7C099",
          400: "#C5A880",
          500: "#B89667",
          600: "#9E7D4E",
          700: "#7E6139",
          800: "#5F4727",
          900: "#412F17",
          950: "#24180A",
        },
        obsidian: {
          900: "#101217",
          950: "#090A0D",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
