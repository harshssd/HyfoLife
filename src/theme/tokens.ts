export type Theme = typeof darkOLED & {
  ornaments?: {
    tileGlyph?: "bat" | "bolt" | "claw" | "web" | "shield" | "star";
    chipEdge?: "angled" | "rounded";
    confetti?: "bats" | "bolts" | "stars";
    ringStyle?: "thin-neon" | "scan";
  };
};
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
    glow: "rgba(180,255,57,0.25)",
  }
};

export const nightVigilante = {
  ...base,
  name: "night-vigilante",
  colors: {
    bg: "#0A0A0B",
    surface: "#0E0F10",
    surface2: "#151618",
    text: "#EDEDED",
    textMuted: "#A6A8AB",
    border: "#25262A",
    accent: "#F6C90E",
    warn: "#FF5D5D",
    success: "#5CF279",
    heat0: "#111214",
    heat1: "#1A1C1F",
    heat2: "#21242A",
    heat3: "#292D34",
    heat4: "#313742",
    overlay: "rgba(246,201,14,0.10)",
    glow: "rgba(246,201,14,0.32)",
  },
  ornaments: { tileGlyph: "bat", chipEdge: "angled", confetti: "bats", ringStyle: "thin-neon" },
} as const;

export const scarletSpeedster = {
  ...base,
  name: "scarlet-speedster",
  colors: {
    bg: "#0E0A0A",
    surface: "#141011",
    surface2: "#1C1516",
    text: "#F5ECEC",
    textMuted: "#C7A8A8",
    border: "#2A1D1F",
    accent: "#FF2E2E",
    warn: "#FFC046",
    success: "#9BFF2E",
    heat0: "#1A1213",
    heat1: "#2A1618",
    heat2: "#3B1A1D",
    heat3: "#4D1E22",
    heat4: "#5E2428",
    overlay: "rgba(255,46,46,0.10)",
    glow: "rgba(255,46,46,0.30)",
  },
  ornaments: { tileGlyph: "bolt", chipEdge: "angled", confetti: "bolts", ringStyle: "scan" },
} as const;

export const pantherGuardian = {
  ...base,
  name: "panther-guardian",
  colors: {
    bg: "#09080E",
    surface: "#0E0D16",
    surface2: "#151428",
    text: "#ECEAF5",
    textMuted: "#BBB6D3",
    border: "rgba(255,255,255,0.12)",
    accent: "#7F5AF0",
    warn: "#5CF279",
    success: "#78F0C8",
    heat0: "#121027",
    heat1: "#1A1836",
    heat2: "#221F45",
    heat3: "#2A2754",
    heat4: "#332E62",
    overlay: "rgba(127,90,240,0.10)",
    glow: "rgba(127,90,240,0.32)",
  },
  ornaments: { tileGlyph: "claw", chipEdge: "angled", confetti: "stars", ringStyle: "thin-neon" },
} as const;

export const webSlinger = {
  ...base,
  name: "web-slinger",
  colors: {
    bg: "#0B0F20",
    surface: "#11162A",
    surface2: "#19203A",
    text: "#EDEFF7",
    textMuted: "#A9B2C8",
    border: "rgba(255,255,255,0.12)",
    accent: "#E11D48",
    warn: "#F59E0B",
    success: "#34D399",
    heat0: "#12162B",
    heat1: "#1A2143",
    heat2: "#222C5B",
    heat3: "#2A3774",
    heat4: "#33428C",
    overlay: "rgba(225,29,72,0.10)",
    glow: "rgba(225,29,72,0.32)",
  },
  ornaments: { tileGlyph: "web", chipEdge: "angled", confetti: "stars", ringStyle: "scan" },
} as const;

export const manOfSteel = {
  ...base,
  name: "man-of-steel",
  colors: {
    bg: "#0A1022",
    surface: "#0F1530",
    surface2: "#172046",
    text: "#EBF2FF",
    textMuted: "#B7C7E8",
    border: "rgba(255,255,255,0.12)",
    accent: "#2563EB",
    warn: "#EF4444",
    success: "#22C55E",
    heat0: "#121A36",
    heat1: "#1A244B",
    heat2: "#223060",
    heat3: "#2A3B76",
    heat4: "#33478B",
    overlay: "rgba(37,99,235,0.10)",
    glow: "rgba(37,99,235,0.30)",
  },
  ornaments: { tileGlyph: "shield", chipEdge: "rounded", confetti: "stars", ringStyle: "thin-neon" },
} as const;

export const amazonWarrior = {
  ...base,
  name: "amazon-warrior",
  colors: {
    bg: "#0A0F18",
    surface: "#0F1420",
    surface2: "#171E2C",
    text: "#F5F3E8",
    textMuted: "#CFC9B3",
    border: "rgba(255,255,255,0.12)",
    accent: "#D4AF37",
    warn: "#B91C1C",
    success: "#86EFAC",
    heat0: "#171C2B",
    heat1: "#1E2638",
    heat2: "#253045",
    heat3: "#2D3B52",
    heat4: "#34455F",
    overlay: "rgba(212,175,55,0.10)",
    glow: "rgba(212,175,55,0.28)",
  },
  ornaments: { tileGlyph: "star", chipEdge: "angled", confetti: "stars", ringStyle: "thin-neon" },
} as const;

export type ThemeName =
  | "dark-oled" | "dark-glass" | "neo-brutal"
  | "night-vigilante" | "scarlet-speedster"
  | "panther-guardian" | "web-slinger" | "man-of-steel" | "amazon-warrior";

export const themes: Record<ThemeName, Theme> = {
  "dark-oled": darkOLED,
  "dark-glass": darkGlass,
  "neo-brutal": neoBrutal,
  "night-vigilante": nightVigilante,
  "scarlet-speedster": scarletSpeedster,
  "panther-guardian": pantherGuardian,
  "web-slinger": webSlinger,
  "man-of-steel": manOfSteel,
  "amazon-warrior": amazonWarrior,
};

