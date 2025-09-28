export type Theme = typeof darkOLED;

const base = {
  radius: { sm: 10, md: 16, lg: 24, xl: 32 },
  spacing: (n: number) => n * 4,
  z: { card: 2, modal: 10, toast: 20 },
  duration: { fast: 120, normal: 180, slow: 240 },
  font: { h1: 28, h2: 22, body: 16, small: 13 },
};

export const darkOLED = {
  ...base,
  name: "dark-oled",
  colors: {
    bg: "#000000",
    surface: "#0B0B0B",
    surface2: "#141414",
    text: "#EDEDED",
    textMuted: "#B4B4B4",
    border: "#242424",
    accent: "#29E3D7",
    warn: "#FFB020",
    success: "#5CF279",
    heat0: "#161616",
    heat1: "#11322E",
    heat2: "#0D5E57",
    heat3: "#0A7F76",
    heat4: "#08A99E",
    overlay: "rgba(255,255,255,0.06)",
    glow: "rgba(41,227,215,0.35)"
  }
};

export const darkGlass = {
  ...base,
  name: "dark-glass",
  colors: {
    bg: "#0B0F1A",
    surface: "rgba(255,255,255,0.06)",
    surface2: "rgba(255,255,255,0.10)",
    text: "#EDEFF7",
    textMuted: "#A9B2C8",
    border: "rgba(255,255,255,0.12)",
    accent: "#9AB4FF",
    warn: "#FFC46B",
    success: "#78F0C8",
    heat0: "rgba(255,255,255,0.05)",
    heat1: "#1E3357",
    heat2: "#28447A",
    heat3: "#32559C",
    heat4: "#3D67BF",
    overlay: "rgba(255,255,255,0.08)",
    glow: "rgba(154,180,255,0.35)",
  }
};

export const neoBrutal = {
  ...base,
  name: "neo-brutal",
  colors: {
    bg: "#111111",
    surface: "#1B1B1B",
    surface2: "#232323",
    text: "#F3F3F3",
    textMuted: "#C8C8C8",
    border: "#2A2A2A",
    accent: "#B4FF39",
    warn: "#FF4DD8",
    success: "#3CF2FF",
    heat0: "#181818",
    heat1: "#2A2A2A",
    heat2: "#3A3A3A",
    heat3: "#4A4A4A",
    heat4: "#5A5A5A",
    overlay: "rgba(255,255,255,0.04)",
    glow: "rgba(180,255,57,0.35)",
  }
};

export type ThemeName = "dark-oled" | "dark-glass" | "neo-brutal";
export const themes: Record<ThemeName, Theme> = {
  "dark-oled": darkOLED,
  "dark-glass": darkGlass,
  "neo-brutal": neoBrutal
};

