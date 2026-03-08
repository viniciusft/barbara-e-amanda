import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0a0a0a",
        foreground: "#F5F0E8",
        gold: {
          DEFAULT: "#C9A84C",
          light: "#E8C97A",
          dark: "#A07830",
        },
        surface: {
          DEFAULT: "#141414",
          elevated: "#1a1a1a",
        },
      },
      fontFamily: {
        display: ["var(--font-cormorant)", "serif"],
        sans: ["var(--font-dm-sans)", "sans-serif"],
      },
      borderColor: {
        gold: "#C9A84C",
        "gold-dim": "rgba(201,168,76,0.3)",
      },
    },
  },
  plugins: [],
};
export default config;
