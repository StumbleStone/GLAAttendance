import {css, Global, ThemeProvider} from "@emotion/react";
import React from "react";
import {appTheme} from "./theme";

export interface AppThemeProviderProps {
  children: React.ReactNode;
}

export const AppThemeProvider: React.FC<AppThemeProviderProps> = ({
  children,
}: AppThemeProviderProps) => {
  return (
    <ThemeProvider theme={appTheme}>
      <Global
        styles={(theme) => css`
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
        `}
      />
      {children}
    </ThemeProvider>
  );
};
