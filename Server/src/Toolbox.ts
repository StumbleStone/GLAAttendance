interface JsonError {
  error: {
    message: string;
    timestamp: number;
  };
}

export class Tool {
  static CreateJsonError(message: string): JsonError {
    return {
      error: {
        message,
        timestamp: Date.now(),
      },
    };
  }

  static GenerateId(): string {
    return ("0000000" + (Math.random() * 9999999).toString(16)).slice(-6);
  }

  static epochToTime(epoch: number): string {
    if (epoch == null) {
      return "N/A";
    }

    const date: Date = new Date(epoch);

    const hour: string = ("00" + date.getHours()).slice(-2);
    const minute: string = ("00" + date.getMinutes()).slice(-2);
    const second: string = ("00" + date.getSeconds()).slice(-2);
    const ms: string = ("000" + date.getMilliseconds()).slice(-3);

    return `${hour}:${minute}:${second}.${ms}`;
  }
}
