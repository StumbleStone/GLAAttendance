export const appTheme = {
  colors: {
    brand: "#45d030",
    text: "#f5f4f3",
    textMuted: "#b6b6b6",
    background: "#2b3038",
    surface: "#1c2127",
    surfaceRaised: "#252c33",
    surfaceActive: "#313840",
    border: "#7a8593",
    borderSubtle: "#000000aa",
    overlay: "#000000bb",
    accent: {
      primary: "#31acd2",
      success: "#45d030",
      warning: "#d76d34",
      danger: "#ff0015",
      transportCar: "#d300ff",
      transportBus: "#d76d34",
    },
    table: {
      rowOdd: "#00000022",
      rowEven: "#3f3f3f",
      rowHover: "#31acd233",
      heading: "#f5f4f3",
      index: "#999999",
      sortActive: "#999999",
    },
    input: {
      background: "#b6b6b6",
      foreground: "#1c2127",
      border: "#000000",
      focus: "#bbd533",
    },
    state: {
      disabled: "#666666",
    },
  },
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
    tile: "0px 5px 10px 5px #1c2127",
    accentGlow: "0px 0px 5px 0px",
  },
} as const;

export type AppTheme = typeof appTheme;
