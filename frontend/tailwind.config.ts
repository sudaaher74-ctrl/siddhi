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
        background: "var(--bg)",
        surface: "var(--surface)",
        panel: "var(--panel)",
        border: "var(--border)",
        accent: {
          DEFAULT: "var(--accent)",
          soft: "var(--accent-soft)",
          hover: "rgba(229, 57, 53, 0.14)",
          subtle: "rgba(229, 57, 53, 0.12)",
        },
        target: {
          gold: "var(--target-gold)",
          red: "var(--target-red)",
          blue: "var(--target-blue)",
          black: "var(--target-black)",
          white: "var(--target-white)",
        },
        gold: "var(--gold)",
        green: "#7ee2a8",
        blue: "var(--blue)",
        text: {
          DEFAULT: "var(--text)",
          mid: "var(--text-mid)",
          dim: "var(--text-dim)",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "monospace"],
      },
      boxShadow: {
        'card': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        'card-hover': '0 8px 30px -4px rgba(0, 0, 0, 0.08)',
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
      },
      keyframes: {
        dashin: {
          "0%": { strokeDashoffset: "900" },
          "100%": { strokeDashoffset: "0" },
        },
        fadeup: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "none" },
        },
        pulseCustom: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.35" },
        },
        shootArrow: {
          "0%": { transform: "translate(150px, 150px) scale(2.5)", opacity: "0" },
          "15%": { transform: "translate(120px, 120px) scale(2.5)", opacity: "1" },
          "50%": { transform: "translate(0, 0) scale(1)", opacity: "1" },
          "65%": { transform: "translate(-1.5px, -1.5px) scale(1)", opacity: "1" }, /* Impact wobble */
          "80%": { transform: "translate(1px, 1px) scale(1)", opacity: "1" },
          "100%": { transform: "translate(0, 0) scale(1)", opacity: "1" },
        },
      },
      animation: {
        dashin: "dashin 1.8s ease-out both",
        fadeup: "fadeup 0.5s both",
        pulseCustom: "pulseCustom 1.6s infinite",
        shootArrow: "shootArrow 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.2) forwards",
      },
    },
  },
  plugins: [],
};
export default config;
