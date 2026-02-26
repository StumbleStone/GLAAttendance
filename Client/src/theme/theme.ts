export type ThemeMode = "dark" | "light";

export interface AppTheme {
  colors: {
    brand: string;
    text: string;
    textMuted: string;
    background: string;
    surface: string;
    surfaceRaised: string;
    surfaceActive: string;
    border: string;
    borderSubtle: string;
    overlay: string;
    accent: {
      primary: string;
      success: string;
      warning: string;
      danger: string;
      transportCar: string;
      transportBus: string;
    };
    table: {
      rowOdd: string;
      rowEven: string;
      rowHover: string;
      heading: string;
      index: string;
      sortActive: string;
    };
    input: {
      background: string;
      foreground: string;
      border: string;
      focus: string;
    };
    state: {
      disabled: string;
    };
  };
  font: {
    body: string;
  };
  radius: {
    sm: string;
    md: string;
    lg: string;
    pill: string;
  };
  shadow: {
    tile: string;
    accentGlow: string;
  };
}

const baseTheme: Pick<AppTheme, "font" | "radius" | "shadow"> = {
  font: {
    body: "monospace",
  },
  radius: {
    sm: "12px",
    md: "15px",
    lg: "20px",
    pill: "999px",
  },
  shadow: {
    tile: "0px 5px 10px 5px #050608",
    accentGlow: "0px 0px 5px 0px",
  },
};

export const darkTheme: AppTheme = {
  ...baseTheme,
  colors: {
    brand: "#2c981f",
    text: "#e8ebf0",
    textMuted: "#8b93a0",
    background: "#050608",
    surface: "#0a0c10",
    surfaceRaised: "#101319",
    surfaceActive: "#171b23",
    border: "#3a414d",
    borderSubtle: "#000000aa",
    overlay: "#000000c6",
    accent: {
      primary: "#3a86c6",
      success: "#2c981f",
      warning: "#a95a32",
      danger: "#c6122f",
      transportCar: "#4f88b4",
      transportBus: "#a95a32",
    },
    table: {
      rowOdd: "#0b0d12",
      rowEven: "#10141b",
      rowHover: "#3a86c622",
      heading: "#e8ebf0",
      index: "#808999",
      sortActive: "#808999",
    },
    input: {
      background: "#8a93a1",
      foreground: "#0a0c10",
      border: "#000000",
      focus: "#7e9530",
    },
    state: {
      disabled: "#5a616d",
    },
  },
};

export const lightTheme: AppTheme = {
  ...baseTheme,
  shadow: {
    ...baseTheme.shadow,
    tile: "0px 4px 10px 1px #b8b3a844",
  },
  colors: {
    brand: "#2f7f28",
    text: "#2f343b",
    textMuted: "#5f6874",
    background: "#f6f3ee",
    surface: "#efebe4",
    surfaceRaised: "#f9f7f2",
    surfaceActive: "#e3dfd6",
    border: "#c4bcae",
    borderSubtle: "#a79f9255",
    overlay: "#11111166",
    accent: {
      primary: "#2c77ad",
      success: "#2f7f28",
      warning: "#a06036",
      danger: "#b73243",
      transportCar: "#4d7296",
      transportBus: "#a06036",
    },
    table: {
      rowOdd: "#f2eee6",
      rowEven: "#ebe6dc",
      rowHover: "#2c77ad14",
      heading: "#2f343b",
      index: "#6a747f",
      sortActive: "#6a747f",
    },
    input: {
      background: "#ffffff",
      foreground: "#2f343b",
      border: "#807869",
      focus: "#7d9530",
    },
    state: {
      disabled: "#98a0a9",
    },
  },
};
