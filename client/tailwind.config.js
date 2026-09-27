import { heroui } from "@heroui/react";

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@heroui/react/node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@heroui/**/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        card: "hsl(var(--card))",
      },
    },
  },
  darkMode: "class",
  plugins: [
    heroui({
      themes: {
        light: {
          colors: {
            background: "#F8FAFC",
            foreground: "#0F172A",
            primary: {
              50: "#eff6ff",
              100: "#dbeafe",
              200: "#bfdbfe",
              300: "#93c5fd",
              400: "#60a5fa",
              500: "#2563EB",
              600: "#1D4ED8",
              700: "#1e40af",
              800: "#1e3a8a",
              900: "#172554",
              DEFAULT: "#2563EB",
              foreground: "#FFFFFF",
            },
            success: {
              DEFAULT: "#16A34A",
              foreground: "#FFFFFF",
            },
            warning: {
              DEFAULT: "#D97706",
              foreground: "#FFFFFF",
            },
            danger: {
              DEFAULT: "#DC2626",
              foreground: "#FFFFFF",
            },
            content1: "#FFFFFF",
            content2: "#F1F5F9",
            content3: "#E2E8F0",
            content4: "#CBD5E1",
          },
        },
        dark: {
          colors: {
            background: "#0B0F14",
            foreground: "#F8FAFC",
            primary: {
              50: "#172554",
              100: "#1e3a8a",
              200: "#1e40af",
              300: "#1D4ED8",
              400: "#2563EB",
              500: "#3B82F6",
              600: "#60a5fa",
              700: "#93c5fd",
              800: "#bfdbfe",
              900: "#eff6ff",
              DEFAULT: "#3B82F6",
              foreground: "#FFFFFF",
            },
            content1: "#111827",
            content2: "#172033",
            content3: "#1E293B",
            content4: "#334155",
            success: {
              DEFAULT: "#22C55E",
              foreground: "#FFFFFF",
            },
            warning: {
              DEFAULT: "#F59E0B",
              foreground: "#FFFFFF",
            },
            danger: {
              DEFAULT: "#EF4444",
              foreground: "#FFFFFF",
            },
          },
        },
      },
    }),
  ],
};
