import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  useLogging,
  configureLogger,
  addTransport,
  logger,
  ConsoleTransport,
  RemoteTransport,
  shouldLog
} from "../src/index";
describe("Simple Logger", () => {
  beforeEach(() => {
    // Reset to a clean state before each test
    configureLogger({ transports: [new ConsoleTransport("info")] });
    vi.restoreAllMocks();
  });

  it("shouldLog logic verification", () => {
    // Info(1) > Debug(0) -> False
    expect(shouldLog("info", "debug")).toBe(false);
    // Info(1) <= Info(1) -> True
    expect(shouldLog("info", "info")).toBe(true);
    // Info(1) <= Error(3) -> True
    expect(shouldLog("info", "error")).toBe(true);
    // Debug(0) <= Debug(0) -> True
    expect(shouldLog("debug", "debug")).toBe(true);
  });

  it("should log to console by default", () => {
    const consoleSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    const logger = useLogging();
    
    logger.info({ message: "Hello", data: { some: "data" } });

    expect(consoleSpy).toHaveBeenCalledWith(
      "Hello",
      expect.objectContaining({
        message: "Hello",
        data: expect.objectContaining({ some: "data" }),
      })
    );
  });

  it("should merge metadata from useLogging", () => {
    const consoleSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    const logger = useLogging({ requestId: "123" });

    logger.info({ message: "Test", data: { userId: "456" } });

    expect(consoleSpy).toHaveBeenCalledWith(
      "Test",
      expect.objectContaining({
        data: expect.objectContaining({
          userId: "456",
          metadata: expect.objectContaining({ requestId: "123" }),
        }),
      })
    );
  });

  it("should respect transport log levels (Info vs Debug)", () => {
    // Transport is INFO. Message is DEBUG. Should NOT log.
    const consoleSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
    const logger = useLogging();
    
    logger.debug({ message: "Hidden", data: {} });
    expect(consoleSpy).not.toHaveBeenCalled();
  });

  it("should respect transport log levels (Debug vs Debug)", () => {
    // Transport is DEBUG. Message is DEBUG. Should LOG.
    configureLogger({ transports: [new ConsoleTransport("debug")] });
    
    const consoleSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
    const logger = useLogging();

    logger.debug({ message: "Visible", data: {} });
    expect(consoleSpy).toHaveBeenCalled();
  });

  it("should support multiple transports", () => {
    const customSpy = vi.fn();
    const customTransport = {
      info: customSpy,
      debug: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };

    addTransport(customTransport);
    
    vi.spyOn(console, "info").mockImplementation(() => {}); // silence console

    const logger = useLogging();
    logger.info({ message: "Multi", data: {} });

    expect(customSpy).toHaveBeenCalled();
    expect(console.info).toHaveBeenCalled();
  });

  it("should send logs via RemoteTransport", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchSpy);

    const remote = new RemoteTransport("https://api.logs.com", "info");
    configureLogger({ transports: [remote] });

    const logger = useLogging();
    logger.info({ message: "Net", data: {} });

    expect(fetchSpy).toHaveBeenCalledWith(
      "https://api.logs.com",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining("Net"),
      })
    );
  });

  it("should return singleton instance when no metadata is provided", () => {
    const logger1 = useLogging();
    const logger2 = useLogging();
    const logger3 = useLogging({});

    expect(logger1).toBe(logger2); // Same reference
    expect(logger1).toBe(logger3); // Same reference (empty object check)
    
    const loggerWithMeta = useLogging({ id: 1 });
    expect(logger1).not.toBe(loggerWithMeta); // Different reference
  });
});
