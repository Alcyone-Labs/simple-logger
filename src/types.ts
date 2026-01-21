import { z } from "zod";

export const logMessageSchema = z.object({
  message: z.string(),
  data: z.object({
    metadata: z.record(z.string(), z.any()).optional(),
  }).and(z.record(z.string(), z.any())),
});

export type TLog = z.input<typeof logMessageSchema>;
export type TLogLevel = "debug" | "info" | "warn" | "error";

export interface ITransport {
  level?: TLogLevel;
  info(data: TLog): void;
  debug(data: TLog): void;
  warn(data: TLog): void;
  error(data: TLog): void;
}

export interface ILogger {
  info(data: TLog): void;
  debug(data: TLog): void;
  warn(data: TLog): void;
  error(data: TLog): void;
}
