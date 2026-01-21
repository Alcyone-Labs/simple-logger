---
name: simple-logger-usage
description: Best practices for using @alcyone-labs/simple-logger in frontend, backend, or any TypeScript app
references:
  - usage
---

# simple-logger-usage

Best practices for adding structured logging to any TypeScript application using @alcyone-labs/simple-logger.

## When Apply

- Adding logging to new or existing TypeScript project
- Need consistent logging across files (frontend/backend/services)
- Want typed logs with metadata/data separation
- Need scoped loggers per file/module

## Rules

- Create file-scoped logger at top of each file using `useLogging`
- Pass contextual metadata (service, file, component, requestId)
- Separate `message` (human-readable) from `data` (structured)
- Use `data.metadata` for tags/labels, `data.*` for structured fields
- Never pass secrets/passwords in logs
- Child loggers inherit parent metadata via chaining

## Usage Decision Tree

```
Start
↓
Is this a library/shared module?
├─ Yes → Create file logger with module context
│  └─ logger = useLogging({ file: __filename, module: "auth-utils" })
└─ No → Is this a service/backend entry point?
   ├─ Yes → Configure transports first, then create scoped loggers
   │  └─ configureLogger({ transports: [new RemoteTransport(...)] })
   └─ No → Is this a frontend component/page?
      ├─ Yes → Create component-scoped logger
      │  └─ logger = useLogging({ component: "LoginForm", env: import.meta.env.MODE })
      └─ No → Generic file logger with minimal context
         └─ logger = useLogging({ file: "utils.ts" })
↓
Add logging statements throughout with contextual data
```

## Examples

### Backend Service File

```typescript
import { useLogging } from "@alcyone-labs/simple-logger";

const logger = useLogging({ service: "user-api", file: "user.controller.ts" });

export async function createUser(req: Request) {
  const requestLogger = logger.child({ requestId: crypto.randomUUID() });

  requestLogger.info({
    message: "Creating new user",
    data: { email: req.body.email },
  });

  try {
    const user = await db.createUser(req.body);
    requestLogger.info({
      message: "User created successfully",
      data: { userId: user.id },
    });
    return user;
  } catch (error) {
    requestLogger.error({
      message: "Failed to create user",
      data: { error: error.message },
    });
    throw error;
  }
}
```

### Frontend Component

```typescript
import { useLogging } from "@alcyone-labs/simple-logger";

const logger = useLogging({
  component: "CheckoutForm",
  env: import.meta.env.PROD ? "production" : "development",
});

export function CheckoutForm() {
  const formLogger = logger.child({ formId: "checkout" });

  const handleSubmit = async (data: FormData) => {
    formLogger.info({
      message: "Checkout form submitted",
      data: { timestamp: Date.now() },
    });

    try {
      await api.post("/checkout", data);
      formLogger.info({ message: "Checkout successful", data: {} });
    } catch (error) {
      formLogger.error({
        message: "Checkout failed",
        data: { error: error.message },
      });
    }
  };

  return <form onSubmit={handleSubmit}>{/* ... */}</form>;
}
```

### Shared Utility File

```typescript
import { useLogging, addTransport, RemoteTransport } from "@alcyone-labs/simple-logger";

const logger = useLogging({
  file: "validation.utils.ts",
  module: "validation",
});

// Add remote transport for shared utilities
addTransport(new RemoteTransport("https://logs.example.com/api"));

export function validateEmail(email: string): boolean {
  const emailLogger = logger.child({ function: "validateEmail" });

  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  emailLogger.debug({
    message: "Email validation completed",
    data: { emailHash: hash(email), result: isValid },
  });

  return isValid;
}
```

### Multiple Log Levels

```typescript
import { useLogging } from "@alcyone-labs/simple-logger";

const logger = useLogging({ file: "cache.service.ts", service: "cache" });

export class CacheService {
  private cache = new Map();

  async get<T>(key: string): Promise<T | null> {
    const cacheLogger = logger.child({ operation: "get", key });

    if (!this.cache.has(key)) {
      cacheLogger.debug({ message: "Cache miss", data: { key } });
      return null;
    }

    const entry = this.cache.get(key);

    if (Date.now() > entry.expiresAt) {
      cacheLogger.warn({
        message: "Cache entry expired",
        data: { key, expiredAt: entry.expiresAt },
      });
      this.cache.delete(key);
      return null;
    }

    cacheLogger.debug({ message: "Cache hit", data: { key } });
    return entry.value;
  }
}
```
