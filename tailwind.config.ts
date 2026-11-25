import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ["var(--font-cormorant)", "Georgia", "serif"],
        sans: ["var(--font-jakarta)", "system-ui", "sans-serif"],
      },
      colors: {
        page: "var(--bg-page)",
        surface: "var(--bg-surface)",
        card: "var(--bg-card)",
        ink: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          muted: "var(--text-muted)",
        },
        brand: {
          DEFAULT: "var(--brand-primary)",
          hover: "var(--brand-primary-hover)",
          on: "var(--brand-on-primary)",
        },
        gold: {
          DEFAULT: "var(--accent-gold)",
          ornament: "var(--accent-ornament)",
        },
        line: {
          subtle: "var(--border-subtle)",
          gold: "var(--border-gold)",
        },
      },
    },
  },
  plugins: [],
};

export default config;
