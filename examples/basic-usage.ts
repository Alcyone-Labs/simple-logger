import { useLogging } from "../src/index";

// Basic usage with default console transport
const logger = useLogging();

logger.info({
  message: "Application started",
  data: {
    metadata: {
      version: "1.0.0",
      env: "production",
    },
    startupTime: Date.now(),
  },
});

logger.warn({
  message: "Low memory warning",
  data: {
    metadata: {
      component: "MemoryManager",
    },
    usage: "85%",
  },
});

logger.error({
  message: "Failed to connect to database",
  data: {
    metadata: {
      service: "Database",
    },
    error: "Connection timeout",
  },
});
