import { css, Global, Theme, ThemeProvider } from "@emotion/react";
import React, { useCallback } from "react";
import { AppTheme, darkTheme, lightTheme, ThemeMode } from "./theme";

const THEME_STORAGE_KEY = "gla-theme-mode";

export interface AppThemeProviderProps {
  children: React.ReactNode;
}

interface AppThemeContextProps {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
}

const AppThemeContext = React.createContext<AppThemeContextProps | null>(null);

function getInitialThemeMode(): ThemeMode {
  if (typeof window === "undefined") {
    return "dark";
  }

  const stored: string | null = window.localStorage.getItem(THEME_STORAGE_KEY);
  return stored === "light" ? "light" : "dark";
}

function resolveTheme(mode: ThemeMode): AppTheme {
  return mode === "light" ? lightTheme : darkTheme;
}

export const AppThemeProvider: React.FC<AppThemeProviderProps> = ({
  children,
}: AppThemeProviderProps) => {
  const [mode, setMode] = React.useState<ThemeMode>(getInitialThemeMode);

  React.useEffect(() => {
    window.localStorage.setItem(THEME_STORAGE_KEY, mode);
  }, [mode]);

  const toggleMode = React.useCallback(() => {
    setMode((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  const theme = React.useMemo(() => resolveTheme(mode), [mode]);

  const contextValue = React.useMemo(
    () => ({
      mode,
      setMode,
      toggleMode,
    }),
    [mode, toggleMode],
  );

  const getStyles = useCallback((theme: Theme) => {
    return css`
      body {
        background-color: ${theme.colors.background};
        margin: 0px;
        padding: 0;
        display: flex;
        align-items: flex-start;
        justify-content: center;
        overscroll-behavior: none;
        font-family: ${theme.font.body};
        color: ${theme.colors.text};
      }

      * {
        -webkit-tap-highlight-color: transparent;
      }

      div#Container {
        width: 100%;
        height: 100vh;
        overflow: hidden;
      }
    `;
  }, []);

  return (
    <AppThemeContext.Provider value={contextValue}>
      <ThemeProvider theme={theme}>
        <Global styles={getStyles} />
        {children}
      </ThemeProvider>
    </AppThemeContext.Provider>
  );
};

export function useAppTheme(): AppThemeContextProps {
  const ctx = React.useContext(AppThemeContext);
  if (!ctx) {
    throw new Error("useAppTheme must be used within AppThemeProvider");
  }

  return ctx;
}
