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
    brand: "#266e20",
    text: "#2f343b",
    textMuted: "#4f5863",
    background: "#f2f4f7",
    surface: "#e9edf3",
    surfaceRaised: "#f7f9fc",
    surfaceActive: "#dce3ec",
    border: "#b3bcc8",
    borderSubtle: "#8c97a660",
    overlay: "#11111166",
    accent: {
      primary: "#246d9f",
      success: "#25762a",
      warning: "#965325",
      danger: "#a62b3d",
      transportCar: "#3f6790",
      transportBus: "#965325",
    },
    table: {
      rowOdd: "#edf1f6",
      rowEven: "#e6ebf2",
      rowHover: "#246d9f22",
      heading: "#2f343b",
      index: "#58626d",
      sortActive: "#58626d",
    },
    input: {
      background: "#ffffff",
      foreground: "#2f343b",
      border: "#807869",
      focus: "#7d9530",
    },
    state: {
      disabled: "#707a86",
    },
  },
};
