# Chrome Extension MV3 Service Worker Usage

Target: Chrome MV3 | Scope: service-worker compatibility

The `@alcyone-labs/simple-logger` package is designed to work in Chrome Extension Manifest V3 (MV3) service workers with zero configuration.

## Why This Matters

MV3 service workers have strict execution contexts that break many logging libraries:

- **No `import.meta.env`**: Build-time environment variables don't exist in SW context
- **Strict initialization**: Top-level side effects can fail during SW startup
- **Console quirks**: `console` object may be restricted or unavailable initially
- **Module format**: ESM imports can fail in SW contexts

## Installation

```bash
npm install @alcyone-labs/simple-logger
# or
pnpm add @alcyone-labs/simple-logger
```

## Usage Options

### Option 1: IIFE Bundle (Recommended for MV3)

The IIFE (Immediately Invoked Function Expression) format is most compatible with MV3 service workers. It bundles all dependencies (including Zod validation) into a single file.

**manifest.json:**
```json
{
  "manifest_version": 3,
  "name": "My Extension",
  "version": "1.0.0",
  "background": {
    "service_worker": "background.js"
  }
}
```

**background.js:**
```javascript
importScripts('./node_modules/@alcyone-labs/simple-logger/dist/index.iife.js');

const { logger, useLogging, ConsoleTransport, configureLogger } = SimpleLogger;

// Use immediately
const log = useLogging({ component: 'background' });

log.info({ message: 'Service Worker initialized', data: { version: '1.0.0' } });

// Listen for messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  log.debug({ message: 'Received message', data: { request, sender } });
  // ... handle message
});
```

### Option 2: ES Module (with bundler)

If you're using a bundler (Vite, Rollup, etc.) for your extension:

**background.js:**
```javascript
import { logger, useLogging, ConsoleTransport } from '@alcyone-labs/simple-logger';

const log = useLogging({ component: 'background' });

log.info({ message: 'SW initialized', data: {} });
```

**vite.config.js:**
```javascript
export default {
  build: {
    lib: {
      entry: 'src/background.js',
      formats: ['iife'],
      name: 'Background'
    }
  }
}
```

### Option 3: Dynamic Import (for conditional loading)

```javascript
// background.js
let logger;

async function initLogger() {
  const SimpleLogger = await import('./node_modules/@alcyone-labs/simple-logger/dist/index.mjs');
  logger = SimpleLogger.useLogging({ component: 'background' });
}

initLogger().then(() => {
  logger.info({ message: 'Logger ready', data: {} });
});
```

## MV3-Specific Features

### Safe Console Access

The logger defensively checks for `console` availability before using it. This prevents crashes in strict SW contexts:

```javascript
// This won't crash even if console is temporarily unavailable
logger.info({ message: 'Safe logging', data: {} });
```

### Lazy Initialization

The logger uses lazy initialization - no work happens at module load time:

```javascript
// Safe to import at top of SW - no immediate side effects
import { logger } from '@alcyone-labs/simple-logger';

// Only initializes when first used
logger.info({ message: 'First log', data: {} });
```

### No Build-Time Dependencies

Unlike libraries that rely on `import.meta.env` or `process.env`, this logger works in raw SW contexts:

```javascript
// ❌ Won't work in MV3 SW
const level = import.meta.env.VITE_LOG_LEVEL;

// ✅ Works in MV3 SW
import { ConsoleTransport } from '@alcyone-labs/simple-logger';
const transport = new ConsoleTransport('info');
```

## Best Practices

### 1. Use Scoped Loggers for Different Components

```javascript
const bgLog = useLogging({ component: 'background' });
const apiLog = useLogging({ component: 'api-client' });

bgLog.info({ message: 'Starting up', data: {} });
apiLog.error({ message: 'Request failed', data: { status: 500 } });
```

### 2. Configure Transports Before Use

```javascript
importScripts('./node_modules/@alcyone-labs/simple-logger/dist/index.iife.js');

// Configure first
SimpleLogger.configureLogger({
  transports: [
    new SimpleLogger.ConsoleTransport('debug'),
    // Add custom transport for extension storage
    {
      info: (data) => chrome.storage.local.set({ lastInfo: data }),
      debug: () => {},
      warn: (data) => chrome.storage.local.set({ lastWarn: data }),
      error: (data) => chrome.storage.local.set({ lastError: data }),
    }
  ]
});

// Then use
const log = SimpleLogger.useLogging();
```

### 3. Handle SW Lifecycle

```javascript
const log = useLogging({ component: 'background' });

// Log when SW starts
log.info({ message: 'Service Worker started', data: { timestamp: Date.now() } });

// Log when SW is about to be terminated
self.addEventListener('beforeunload', () => {
  log.debug({ message: 'Service Worker terminating', data: {} });
});
```

### 4. Use with Extension APIs

```javascript
const log = useLogging({ component: 'tabs' });

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  log.debug({
    message: 'Tab updated',
    data: { tabId, status: changeInfo.status, url: tab.url }
  });
});
```

## Troubleshooting

### "Cannot read property 'info' of undefined"

This means the logger isn't loaded. Ensure:
- IIFE path is correct in `importScripts()`
- Module is loaded before use

### "Zod is not defined"

Use the IIFE bundle which includes all dependencies:
```javascript
importScripts('./node_modules/@alcyone-labs/simple-logger/dist/index.iife.js');
```

### Logs not appearing

Check the log level:
```javascript
// Default is 'info'
new ConsoleTransport('debug') // Show all logs
```

## Example: Complete MV3 Extension

**manifest.json:**
```json
{
  "manifest_version": 3,
  "name": "Logger Demo",
  "version": "1.0.0",
  "background": {
    "service_worker": "background.js"
  },
  "action": {
    "default_popup": "popup.html"
  },
  "permissions": ["storage"]
}
```

**background.js:**
```javascript
importScripts('./node_modules/@alcyone-labs/simple-logger/dist/index.iife.js');

const { useLogging } = SimpleLogger;
const log = useLogging({ component: 'background' });

log.info({ message: 'Extension loaded', data: { version: chrome.runtime.getManifest().version } });

chrome.action.onClicked.addListener((tab) => {
  log.info({ message: 'Action clicked', data: { tabId: tab.id } });
});
```

**popup.html:**
```html
<!DOCTYPE html>
<html>
<body>
  <script type="module" src="./node_modules/@alcyone-labs/simple-logger/dist/index.mjs"></script>
  <script type="module" src="./popup.js"></script>
</body>
</html>
```

**popup.js:**
```javascript
import { useLogging } from '@alcyone-labs/simple-logger';

const log = useLogging({ component: 'popup' });
log.info({ message: 'Popup opened', data: {} });
```

## Privacy Considerations

- Logs stay local by default (ConsoleTransport)
- No network requests unless you add RemoteTransport
- No data collection or telemetry
- Works entirely offline
