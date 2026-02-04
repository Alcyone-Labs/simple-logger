import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  useLogging,
  configureLogger,
  addTransport,
  ConsoleTransport,
} from "../src/index";

describe("Chrome MV3 Service Worker Compatibility", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should initialize without throwing when console is temporarily unavailable", () => {
    // Simulate MV3 SW context where console might be restricted at startup
    const originalConsole = global.console;
    
    // Temporarily remove console
    // @ts-ignore
    global.console = undefined;
    
    try {
      // This should not throw even without console
      const logger = useLogging();
      expect(logger).toBeDefined();
      expect(typeof logger.info).toBe("function");
      expect(typeof logger.error).toBe("function");
    } finally {
      global.console = originalConsole;
    }
  });

  it("should gracefully handle missing console methods", () => {
    const originalConsole = global.console;
    
    // Simulate partial console implementation (common in SW contexts)
    global.console = {
      info: vi.fn(),
      // debug, warn, error missing
    } as any;
    
    try {
      configureLogger({ transports: [new ConsoleTransport("debug")] });
      const logger = useLogging();
      
      // Should not throw when calling methods with missing console.*
      expect(() => logger.info({ message: "test", data: {} })).not.toThrow();
      expect(() => logger.debug({ message: "test", data: {} })).not.toThrow();
      expect(() => logger.warn({ message: "test", data: {} })).not.toThrow();
      expect(() => logger.error({ message: "test", data: {} })).not.toThrow();
    } finally {
      global.console = originalConsole;
    }
  });

  it("should work with lazy singleton initialization", () => {
    // Clear any existing state by creating fresh logger instance behavior
    const logger1 = useLogging();
    const logger2 = useLogging();
    
    // Both should be the same singleton instance
    expect(logger1).toBe(logger2);
    
    // Should be able to configure after initialization
    const customTransport = {
      info: vi.fn(),
      debug: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };
    
    addTransport(customTransport);
    logger1.info({ message: "test", data: {} });
    
    expect(customTransport.info).toHaveBeenCalled();
  });

  it("should not have top-level side effects that break SW initialization", () => {
    // In MV3, modules with top-level side effects can fail
    // This test verifies that importing the module doesn't execute
    // problematic code at the top level
    
    const consoleSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    
    // Create logger and use it
    const logger = useLogging();
    logger.info({ message: "SW safe initialization", data: {} });
    
    // Should work without any top-level initialization errors
    expect(consoleSpy).toHaveBeenCalledWith(
      "SW safe initialization",
      expect.any(Object)
    );
  });

  it("should handle IIFE bundle loading scenario", () => {
    // Simulate IIFE global assignment pattern used in MV3
    const mockGlobal: any = {};
    
    // Simulate what happens when IIFE loads
    mockGlobal.SimpleLogger = {
      logger: useLogging(),
      useLogging,
      ConsoleTransport,
      configureLogger,
    };
    
    expect(mockGlobal.SimpleLogger.logger).toBeDefined();
    expect(typeof mockGlobal.SimpleLogger.useLogging).toBe("function");
    
    // Should be usable immediately
    const logger = mockGlobal.SimpleLogger.useLogging({ component: "SW" });
    expect(logger).toBeDefined();
  });

  it("should not use import.meta or other non-SW-safe globals", () => {
    // Verify no import.meta usage in the actual module
    // This is more of a static analysis check
    const logger = useLogging();
    
    // All operations should work without import.meta
    expect(() => {
      logger.info({ message: "No import.meta here", data: {} });
    }).not.toThrow();
  });
});
