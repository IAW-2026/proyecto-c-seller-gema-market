import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bark: "#582f0e",
        cocoa: "#7f4f24",
        clay: "#936639",
        sand: "#a68a64",
        stone: "#b6ad90",
        mist: "#c2c5aa",
        sage: "#a4ac86",
        moss: "#656d4a",
        olive: "#414833",
        forest: "#333d29",
        paper: "#faf8f3",
        cream: "#f3efe5",
        bone: "#ede7d8",
        ink: "#1c1d18",
        "ink-2": "#3a3c33",
        "ink-3": "#6b6e60",
        line: "#e2dccc",
        "line-2": "#d4ccb6",
        success: "#4a6b3a",
        warn: "#b58025",
        danger: "#9a3a1f",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "Menlo", "monospace"],
      },
      borderRadius: {
        r1: "8px",
        r2: "14px",
        r3: "22px",
        r4: "32px",
      },
      boxShadow: {
        "sh-1": "0 1px 2px rgba(40,30,15,.04), 0 2px 6px rgba(40,30,15,.04)",
        "sh-2": "0 4px 12px rgba(40,30,15,.06), 0 12px 24px rgba(40,30,15,.05)",
        "sh-3": "0 12px 32px rgba(40,30,15,.08), 0 24px 48px rgba(40,30,15,.06)",
      },
      screens: {
        lgx: "1100px",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
        "toast-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        spin360: {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
      },
      animation: {
        shimmer: "shimmer 1.4s infinite linear",
        "toast-in": "toast-in .22s ease",
        spin360: "spin360 1s linear infinite",
      },
      backgroundImage: {
        "card-front":
          "linear-gradient(135deg, #582f0e 0%, #7f4f24 50%, #936639 100%)",
        "card-back":
          "linear-gradient(135deg, #582f0e 0%, #7f4f24 54%, #936639 100%)",
        "card-chip": "linear-gradient(135deg, #d4a373, #fefae0)",
        "ph-base": "linear-gradient(135deg, #c2c5aa 0%, #b6ad90 100%)",
        "ph-stripes":
          "repeating-linear-gradient(45deg, rgba(255,255,255,.08) 0 8px, transparent 8px 16px)",
        "cvc-stripes":
          "repeating-linear-gradient(0deg, rgba(127,79,36,.18) 0 2px, transparent 2px 6px)",
        compass: "radial-gradient(circle, #f3efe5, #faf8f3)",
        "hero-grain":
          "radial-gradient(circle at 20% 10%, rgba(102,109,74,.06), transparent 50%), radial-gradient(circle at 80% 80%, rgba(127,79,36,.05), transparent 60%)",
      },
    },
  },
  plugins: [
    plugin(({ addUtilities }) => {
      addUtilities({
        ".ph-img": {
          background: "linear-gradient(135deg, #c2c5aa 0%, #b6ad90 100%)",
          position: "relative",
          overflow: "hidden",
        },
        ".ph-img::after": {
          content: '""',
          position: "absolute",
          inset: "0",
          backgroundImage:
            "repeating-linear-gradient(45deg, rgba(255,255,255,.08) 0 8px, transparent 8px 16px)",
        },
        ".no-scrollbar::-webkit-scrollbar": { display: "none" },
        ".no-scrollbar": { scrollbarWidth: "none" },
        ".preserve-3d": { transformStyle: "preserve-3d" },
        ".backface-hidden": { backfaceVisibility: "hidden" },
        ".persp-1200": { perspective: "1200px" },
      });
    }),
  ],
};

export default config;
