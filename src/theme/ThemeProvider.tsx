import React, { createContext, useContext, useMemo, useState } from "react";
import { themes, darkOLED, ThemeName } from "./tokens";

type ThemeCtx = { theme: typeof darkOLED; name: ThemeName; setName: (n: ThemeName) => void; };
const Ctx = createContext<ThemeCtx>({ theme: darkOLED, name: "dark-oled", setName: () => {} });

export function ThemeProvider({ initial = "dark-oled" as ThemeName, children }: { initial?: ThemeName; children: React.ReactNode }) {
  const [name, setName] = useState<ThemeName>(initial);
  const value = useMemo(() => ({ name, theme: themes[name], setName }), [name]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useTheme = () => useContext(Ctx);