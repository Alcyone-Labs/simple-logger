import { addTransport, useLogging, type TLog, type ITransport } from "../src/index";

/**
 * A custom transport that "sends" logs to a mock external service
 */
class RemoteTransport implements ITransport {
  info(data: TLog) {
    this.sendToRemote("INFO", data);
  }
  debug(data: TLog) {
    this.sendToRemote("DEBUG", data);
  }
  warn(data: TLog) {
    this.sendToRemote("WARN", data);
  }
  error(data: TLog) {
    this.sendToRemote("ERROR", data);
  }

  private sendToRemote(level: string, data: TLog) {
    // In a real implementation, this might be an HTTP POST request
    console.log(`[Remote ${level}] Sending log: ${data.message}`, {
      ...data.data,
      timestamp: new Date().toISOString()
    });
  }
}

// Add the custom transport
addTransport(new RemoteTransport());

const logger = useLogging({ component: "AuthModule" });

logger.info({
  message: "User logged in",
  data: {
    metadata: { userId: "user_01" }
  },
});

logger.error({
  message: "Login failed - Invalid credentials",
  data: {
    metadata: { userId: "user_02" }
  },
});
