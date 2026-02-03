export class Toolbox {
  static async loadSVG(path: string): Promise<string | null> {
    return new Promise((resolve) => {
      fetch(path, {
        method: "GET",
        headers: {
          "Content-Type": "image/svg+xml",
        },
      })
        .then((r) => r.text())
        .then((r) => {
          resolve(r);
        })
        .catch((err) => {
          console.error("getJson Failed", "path:", path, "Err:", err);
          resolve(null);
        });
    });
  }

  static async loadJson<T>(path: string): Promise<T | null> {
    return new Promise((resolve) => {
      fetch(path, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then((r) => r.json())
        .then((r) => {
          resolve(r);
        })
        .catch((err) => {
          console.error("getJson Failed", "path:", path, "Err:", err);
          resolve(null);
        });
    });
  }

  static toggleClass(
    element: HTMLElement,
    classname: string,
    addOrRemove: boolean
  ) {
    if (addOrRemove && !element.classList.contains(classname)) {
      return element.classList.add(classname);
    }

    if (element.classList.contains(classname)) {
      return element.classList.remove(classname);
    }
  }
}

export enum DefaultColors {
  Text_Color = "#f5f4f3", //"whitesmoke",
  OffWhite = "#b6b6b6",
  Background = "#777777", //"#282c34",
  Container = "#1C2127",
  Container_Active = "#313840",
  Shadow = "#000000aa",
  Red = "#962240",
  BrightRed = "#ff0015",
  Purple = "#8a2296",
  BrightPurple = "#c231d3",
  Cyan = "#227b96",
  BrightCyan = "#31acd2",
  Green = "#319622",
  Brown = "#965c22",
  BrightGrey = "#999999",
  Grey = "#666666",
  BrightGreen = "#45d030",
  Yellow = "#839622",
  BrightYellow = "#bbd533",
  Blue = "#224396",
  BrightBlue = "#2f5cd0",
  Orange = "#964b22",
  BrightOrange = "#d76d34",
  Black = "#000000",
  TRANSPARENT = "transparent",
}

export function GenerateId(): string {
  return Math.round(Math.random() * 99999999999).toString(16);
}

export function elementIsChildOf(
  childEl: HTMLElement | null,
  parentEl: HTMLElement | Document | null
): boolean {
  if (!childEl || !parentEl) {
    return false;
  }

  if (childEl === parentEl) {
    return true;
  }

  let curParent = childEl.parentElement;
  while (curParent) {
    if (curParent === parentEl) {
      return true;
    }

    curParent = curParent.parentElement;
  }

  return false;
}

export interface FormatCurrencyOptions {
  padding?: number;
  includeCents?: boolean;
  symbol?: string;
}

export function formatCurrency(
  amount: number,
  options: FormatCurrencyOptions = {}
): string {
  const { padding, includeCents = true, symbol } = options ?? {};
  amount = amount || 0;

  const amountStr: string = `${amount}`;

  const [bigPart, cents] = amountStr.split(".");

  let arr: string[] = [];

  let counter: number = 0;
  for (let i = bigPart.length - 1; i >= 0; i--) {
    counter++;

    if (counter >= 4 && bigPart[i] !== "-") {
      arr.push(" ");
      counter = 0;
    }

    arr.push(bigPart[i]);
  }

  if (padding) {
    while (arr.length < padding) {
      arr.push(" ");
    }
  }

  if (includeCents) {
    arr.unshift(`.${("00" + (cents ?? 0)).slice(-2)}`);
  }

  return `${symbol ?? ""}${arr.reverse().join("")}`;
}

export function currencyToLength(amount: number): number {
  const len = `${amount}`.split(".")[0].length;

  let whitespace = 0;
  while (amount >= 1000) {
    amount /= 1000;
    whitespace++;
  }

  return len + whitespace;
}

export interface EpochToDateOptions {
  includeDate?: boolean;
  includeTime?: boolean;
  includeSeconds?: boolean;
  includeMS?: boolean;
  useUTC?: boolean;
}

function _epochToDate(epoch: number, options: EpochToDateOptions): string {
  if (epoch == null) {
    return "N/A";
  }

  const {
    includeDate = true,
    includeTime,
    includeMS,
    includeSeconds,
    useUTC = false,
  } = options;

  const date: Date = new Date(epoch);

  const year: number = useUTC ? date.getUTCFullYear() : date.getFullYear();
  const month: string = (
    "00" +
    ((useUTC ? date.getUTCMonth() : date.getMonth()) + 1)
  ).slice(-2);
  const day: string = (
    "00" + (useUTC ? date.getUTCDate() : date.getDate())
  ).slice(-2);

  let str: string = includeDate ? `${year}-${month}-${day}` : "";

  if (!includeTime) {
    return str.trim();
  }

  const hour: string = (
    "00" + (useUTC ? date.getUTCHours() : date.getHours())
  ).slice(-2);
  const minute: string = (
    "00" + (useUTC ? date.getUTCMinutes() : date.getMinutes())
  ).slice(-2);

  str += ` ${hour}:${minute}`;

  if (!includeSeconds) {
    return str.trim();
  }

  const seconds =
    `:` + `00${useUTC ? date.getUTCSeconds() : date.getSeconds()}`.slice(-2);

  str += seconds;

  if (!includeMS) {
    return str.trim();
  }

  const ms = `.` + `000${date.getUTCMilliseconds()}`.slice(-3);

  str += ms;

  return str.trim();
}

export function epochToDate(
  epoch: number,
  options?: EpochToDateOptions
): string {
  return _epochToDate(epoch, options ?? {});
}
