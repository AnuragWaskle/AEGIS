export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        aegis: {
          black: "#F8FAFC",
          surface: "#FFFFFF",
          card: "#FFFFFF",
          border: "#E2E8F0",
          green: "#059669",
          "green-dim": "#34D399",
          amber: "#D97706",
          red: "#DC2626",
          blue: "#2563EB",
          text: {
            primary: "#0F172A",
            secondary: "#475569",
            muted: "#94A3B8"
          }
        }
      },
      fontFamily: {
        mono: ["'JetBrains Mono'", "monospace"],
        sans: ["'IBM Plex Sans'", "sans-serif"],
        display: ["'Syne'", "sans-serif"]
      },
      animation: {
        "pulse-green": "pulseGreen 2s ease-in-out infinite",
        "scan-line": "scanLine 3s linear infinite",
        "fade-in-up": "fadeInUp 0.5s ease forwards"
      },
      keyframes: {
        pulseGreen: {
          "0%, 100%": { boxShadow: "0 0 0px #00FF88" },
          "50%": { boxShadow: "0 0 20px #00FF88" }
        },
        scanLine: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" }
        },
        fadeInUp: {
          "0%": { opacity: 0, transform: "translateY(12px)" },
          "100%": { opacity: 1, transform: "translateY(0)" }
        }
      }
    }
  },
  plugins: [],
}
