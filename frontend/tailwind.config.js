/** @type {import('tailwindcss').Config} */
export default {
  content: ["index.html", "src/**/*.{js,ts,jsx,tsx,html,css}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Inter",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        mono: ["JetBrains Mono", "Menlo", "Monaco", "Consolas", "monospace"],
      },
      colors: {
        // SprintLane design system colors
        sprint: {
          // Background colors
          bg: {
            primary: "#F8F9FA",
            secondary: "#F1F3F5",
            tertiary: "#E9ECEF",
          },
          // Surface colors (cards, sidebar)
          surface: {
            DEFAULT: "#FFFFFF",
            hover: "#F8F9FA",
            active: "#EFF6FF",
          },
          // Border colors
          border: {
            DEFAULT: "#E5E7EB",
            light: "#F3F4F6",
            dark: "#D1D5DB",
          },
          // Text colors
          text: {
            primary: "#1A1A1A",
            secondary: "#6B7280",
            tertiary: "#9CA3AF",
            inverse: "#FFFFFF",
          },
          // Accent colors (blue)
          accent: {
            50: "#EFF6FF",
            100: "#DBEAFE",
            200: "#BFDBFE",
            300: "#93C5FD",
            400: "#60A5FA",
            500: "#3B82F6",
            600: "#2563EB",
            700: "#1D4ED8",
            800: "#1E40AF",
            900: "#1E3A8A",
          },
          // Status colors for cards
          status: {
            todo: "#6B7280",
            inProgress: "#F59E0B",
            done: "#10B981",
            blocked: "#EF4444",
          },
          // Tag colors palette
          tag: {
            red: { bg: "#FEE2E2", text: "#991B1B", border: "#FECACA" },
            orange: { bg: "#FFEDD5", text: "#9A3412", border: "#FED7AA" },
            amber: { bg: "#FEF3C7", text: "#92400E", border: "#FDE68A" },
            yellow: { bg: "#FEF9C3", text: "#854D0E", border: "#FEF08A" },
            lime: { bg: "#ECFCCB", text: "#3F6212", border: "#D9F99D" },
            green: { bg: "#DCFCE7", text: "#166534", border: "#BBF7D0" },
            emerald: { bg: "#D1FAE5", text: "#065F46", border: "#A7F3D0" },
            teal: { bg: "#CCFBF1", text: "#115E59", border: "#99F6E4" },
            cyan: { bg: "#CFFAFE", text: "#155E75", border: "#A5F3FC" },
            sky: { bg: "#E0F2FE", text: "#075985", border: "#BAE6FD" },
            blue: { bg: "#DBEAFE", text: "#1E40AF", border: "#BFDBFE" },
            indigo: { bg: "#E0E7FF", text: "#3730A3", border: "#C7D2FE" },
            violet: { bg: "#EDE9FE", text: "#5B21B6", border: "#DDD6FE" },
            purple: { bg: "#F3E8FF", text: "#6B21A8", border: "#E9D5FF" },
            fuchsia: { bg: "#FAE8FF", text: "#86198F", border: "#F5D0FE" },
            pink: { bg: "#FCE7F3", text: "#9D174D", border: "#FBCFE8" },
            rose: { bg: "#FFE4E6", text: "#9F1239", border: "#FECDD3" },
            gray: { bg: "#F3F4F6", text: "#374151", border: "#E5E7EB" },
          },
        },
      },
      fontSize: {
        "board-title": ["1.125rem", { lineHeight: "1.5", fontWeight: "600" }],
        "card-title": ["0.875rem", { lineHeight: "1.4", fontWeight: "500" }],
        "card-tag": ["0.75rem", { lineHeight: "1.4", fontWeight: "400" }],
        "column-header": ["0.875rem", { lineHeight: "1.4", fontWeight: "500" }],
      },
      width: {
        sidebar: "240px",
        column: "280px",
      },
      spacing: {
        "card-padding": "12px",
        "card-gap": "8px",
        "column-gap": "16px",
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
        "card-hover":
          "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        modal: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        float:
          "0 10px 40px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
        "slide-in-right": "slideInRight 0.3s ease-out",
        float: "float 6s ease-in-out infinite",
        "float-delayed": "float 6s ease-in-out 2s infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideInRight: {
          "0%": { transform: "translateX(100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
    },
  },
  plugins: [],
};
