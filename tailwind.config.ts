import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        obsidian: {
          950: "#080c14",
          900: "#0c121e",
          850: "#111827",
          800: "#161f33",
          700: "#1e293b",
        },
      },
    },
  },
  plugins: [],
};
export default config;

