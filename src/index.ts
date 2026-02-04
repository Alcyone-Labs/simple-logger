import { type ITransport, type TLog, type TLogLevel, type ILogger } from "./types";
import { ConsoleTransport } from "./transports";

// Re-export types
export { logMessageSchema, type TLog, type TLogLevel, type ITransport, type ILogger } from "./types";

// Re-export utils
export { shouldLog } from "./utils";

// Re-export transports
export { ConsoleTransport, RemoteTransport, PinoBridgeTransport } from "./transports";

/**
 * Singleton Logger Class.
 * Manages active transports and handles message dispatch.
 * 
 * NOTE: This class is designed to be safe for Chrome Extension MV3 service workers.
 * - Uses lazy initialization for transports
 * - Defensive against missing console in strict contexts
 */
class LoggerSingleton implements ILogger {
  private transports: ITransport[] | null = null;

  private getTransports(): ITransport[] {
    if (!this.transports) {
      this.transports = [new ConsoleTransport("info")];
    }
    return this.transports;
  }

  /**
   * Replace all active transports.
   */
  public setTransports(transports: ITransport[]) {
    this.transports = [...transports];
  }

  /**
   * Add a new transport to the active list.
   */
  public addTransport(transport: ITransport) {
    this.getTransports().push(transport);
  }

  /**
   * Internal dispatch method.
   * Merges metadata if provided and broadcasts to all transports.
   */
  private dispatch(level: TLogLevel, data: TLog, metadata?: any) {
    const finalData = metadata ? this.mergeMetadata(data, metadata) : data;

    for (const t of this.getTransports()) {
      switch (level) {
        case "info": t.info(finalData); break;
        case "debug": t.debug(finalData); break;
        case "warn": t.warn(finalData); break;
        case "error": t.error(finalData); break;
      }
    }
  }

  private mergeMetadata(data: TLog, metadata: any): TLog {
    return {
      ...data,
      data: {
        ...data.data,
        metadata: {
          ...(data.data?.metadata || {}),
          ...metadata,
        },
      },
    };
  }

  // ILogger Implementation
  info(data: TLog) { this.dispatch("info", data); }
  debug(data: TLog) { this.dispatch("debug", data); }
  warn(data: TLog) { this.dispatch("warn", data); }
  error(data: TLog) { this.dispatch("error", data); }

  /**
   * Creates a lightweight child logger with bound metadata.
   */
  child(metadata: any): ILogger {
    return {
      info: (data: TLog) => this.dispatch("info", data, metadata),
      debug: (data: TLog) => this.dispatch("debug", data, metadata),
      warn: (data: TLog) => this.dispatch("warn", data, metadata),
      error: (data: TLog) => this.dispatch("error", data, metadata),
    };
  }
}

// Global Singleton Instance
export const logger = new LoggerSingleton();

// --- Configuration Helper Exports ---

export const configureLogger = (options: { transports?: ITransport[] }) => {
  if (options.transports) {
    logger.setTransports(options.transports);
  }
};

export const addTransport = (transport: ITransport) => {
  logger.addTransport(transport);
};

// --- Hook Export ---

/**
 * Returns a logger instance.
 * If metadata is provided, returns a new scoped logger.
 * If no metadata is provided, returns the global singleton to save resources.
 */
export const useLogging = (metadata?: Record<string, any>) => {
  if (!metadata || Object.keys(metadata).length === 0) {
    return logger;
  }
  return logger.child(metadata);
};