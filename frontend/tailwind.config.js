/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        uber: {
          black: "#000000",
          white: "#ffffff",
          dark: "#0a0a0a",
          card: "#ffffff",
          surface: "#f8f8f8",
          border: "#e5e5e5",
          gray: {
            100: "#171717", // previously lightest, now darkest
            200: "#262626",
            300: "#404040",
            400: "#525252",
            500: "#737373",
            600: "#a3a3a3",
            700: "#d4d4d4",
            800: "#e5e5e5",
            900: "#f5f5f5", // previously darkest, now lightest
          },
          blue: {
            DEFAULT: "#276ef1",
            light: "#5b91f5",
            dark: "#1b4db3",
            glow: "rgba(39, 110, 241, 0.2)",
          },
          green: {
            DEFAULT: "#05a357",
            light: "#06c167",
            dark: "#048848",
          },
          red: {
            DEFAULT: "#e11900",
            light: "#ff4d3a",
          },
          amber: {
            DEFAULT: "#ffc043",
            light: "#ffcf70",
          },
        },
      },
      fontFamily: {
        sans: ["Outfit", "Inter", "system-ui", "sans-serif"],
      },
      animation: {
        "spin": "spin 1s linear infinite",
        "pulse": "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "slide-in": "slide-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both",
        "menu-down": "menu-down 0.2s ease both",
        "fade-in": "fade-in 0.5s ease-out both",
        "slide-up": "slide-up 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both",
        "slide-down": "slide-down 0.3s ease-out both",
        "bounce-in": "bounce-in 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)",
        "shimmer": "shimmer 1.5s infinite",
        "float": "float 3s ease-in-out infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
        "route-draw": "route-draw 1.5s ease-out forwards",
        "map-pulse": "map-pulse 2s ease-in-out infinite",
        "counter": "counter 0.6s ease-out",
        "scale-in": "scale-in 0.3s ease-out both",
        "stagger-1": "fade-in 0.5s ease-out 0.1s both",
        "stagger-2": "fade-in 0.5s ease-out 0.2s both",
        "stagger-3": "fade-in 0.5s ease-out 0.3s both",
        "stagger-4": "fade-in 0.5s ease-out 0.4s both",
      },
      keyframes: {
        "slide-in": {
          from: { transform: "translateX(calc(100% + 1rem))", opacity: "0" },
          to: { transform: "translateX(0)", opacity: "1" },
        },
        "menu-down": {
          from: { opacity: "0", transform: "translateY(-8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-up": {
          from: { transform: "translateY(30px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        "slide-down": {
          from: { transform: "translateY(-20px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        "bounce-in": {
          "0%": { opacity: "0", transform: "scale(0.3)" },
          "50%": { opacity: "1", transform: "scale(1.05)" },
          "70%": { transform: "scale(0.9)" },
          "100%": { transform: "scale(1)" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-1000px 0" },
          "100%": { backgroundPosition: "1000px 0" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "glow": {
          from: { boxShadow: "0 0 5px rgba(39, 110, 241, 0.1), 0 0 10px rgba(39, 110, 241, 0.05)" },
          to: { boxShadow: "0 0 10px rgba(39, 110, 241, 0.2), 0 0 20px rgba(39, 110, 241, 0.1)" },
        },
        "route-draw": {
          from: { strokeDashoffset: "1000" },
          to: { strokeDashoffset: "0" },
        },
        "map-pulse": {
          "0%, 100%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(1.5)", opacity: "0.5" },
        },
        "counter": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.9)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
      },
      boxShadow: {
        "card": "0 2px 8px 0 rgba(0,0,0,.04), 0 1px 2px -1px rgba(0,0,0,.04)",
        "card-hover": "0 12px 30px rgba(0,0,0,.08), 0 0 1px rgba(0,0,0,.05)",
        "uber": "0 4px 14px 0 rgba(0,0,0,.08)",
        "glow-blue": "0 0 20px rgba(39, 110, 241, 0.15)",
        "glow-green": "0 0 20px rgba(5, 163, 87, 0.15)",
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};
