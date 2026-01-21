import { type ITransport, type TLog, type TLogLevel } from "./types";
import { shouldLog } from "./utils";

export class ConsoleTransport implements ITransport {
  constructor(public level: TLogLevel = "info") {}

  info(data: TLog) {
    if (shouldLog(this.level, "info")) console.info(data.message, data);
  }
  debug(data: TLog) {
    if (shouldLog(this.level, "debug")) console.debug(data.message, data);
  }
  warn(data: TLog) {
    if (shouldLog(this.level, "warn")) console.warn(data.message, data);
  }
  error(data: TLog) {
    if (shouldLog(this.level, "error")) console.error(data.message, data);
  }
}

export class RemoteTransport implements ITransport {
  constructor(
    private url: string,
    public level: TLogLevel = "info",
    private headers: Record<string, string> = {},
  ) {}

  private async send(level: string, data: TLog) {
    try {
      await fetch(this.url, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...this.headers },
        body: JSON.stringify({
          level,
          ...data,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch {
      // safe fail
    }
  }

  info(data: TLog) {
    if (shouldLog(this.level, "info")) this.send("info", data);
  }
  debug(data: TLog) {
    if (shouldLog(this.level, "debug")) this.send("debug", data);
  }
  warn(data: TLog) {
    if (shouldLog(this.level, "warn")) this.send("warn", data);
  }
  error(data: TLog) {
    if (shouldLog(this.level, "error")) this.send("error", data);
  }
}

export class PinoBridgeTransport implements ITransport {
  constructor(
    private pinoInstance: any,
    public level: TLogLevel = "info",
  ) {}

  info(data: TLog) {
    if (shouldLog(this.level, "info"))
      this.pinoInstance.info(data, data.message);
  }
  debug(data: TLog) {
    if (shouldLog(this.level, "debug"))
      this.pinoInstance.debug(data, data.message);
  }
  warn(data: TLog) {
    if (shouldLog(this.level, "warn"))
      this.pinoInstance.warn(data, data.message);
  }
  error(data: TLog) {
    if (shouldLog(this.level, "error"))
      this.pinoInstance.error(data, data.message);
  }
}
