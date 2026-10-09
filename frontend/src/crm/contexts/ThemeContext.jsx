import { createContext, useContext, useMemo } from "react";

const themeConfig = {
  verde: {
    name: "Verde",
    primary: "#106a37",
    primaryLight: "#16a34a",
    primaryDark: "#0a4f2e",
    accent: "#22c55e",
    text: "#111827",
    textSecondary: "#374151",
    border: "#d1fae5",
    headerBg: "#ffffff",
    sidebarActive: "linear-gradient(135deg, #106a37, #0a4f2e)",
    hoverGlow: "rgba(16, 106, 55, 0.2)",
    ring: "#16a34a",
  },
};

const ThemeContext = createContext({
  theme: "verde",
  language: "pt",
  themeConfig: themeConfig.verde,
  allThemes: themeConfig,
  setTheme: () => {},
  setLanguage: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export const CrmThemeProvider = ({ children }) => {
  const value = useMemo(
    () => ({
      theme: "verde",
      language: "pt",
      themeConfig: themeConfig.verde,
      allThemes: themeConfig,
      setTheme: () => {},
      setLanguage: () => {},
    }),
    []
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
