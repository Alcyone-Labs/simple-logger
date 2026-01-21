import { type TLogLevel } from "./types";

const LEVELS: Record<TLogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

export function shouldLog(transportLevel: TLogLevel | undefined, messageLevel: TLogLevel): boolean {
  const tLevel = transportLevel || "info";
  const tVal = LEVELS[tLevel];
  const mVal = LEVELS[messageLevel];
  return mVal >= tVal;
}
