import { useLogging } from "../src/index";

// Create a scoped logger with service-level metadata
const serviceLogger = useLogging({
  service: "order-service",
  region: "us-east-1",
});

function processOrder(orderId: string) {
  // Create a more specific scoped logger for this request/transaction
  const logger = useLogging({
    orderId,
    transactionId: Math.random().toString(36).substring(7),
  });

  logger.info({
    message: "Processing order",
    data: {
      metadata: { status: "pending" }
    },
  });

  // Log from the original service logger
  serviceLogger.info({
    message: "Service heartbeat",
    data: {
      metadata: { status: "healthy" }
    },
  });

  logger.info({
    message: "Order processed successfully",
    data: {
      metadata: { status: "completed" }
    },
  });
}

processOrder("ORD-12345");
