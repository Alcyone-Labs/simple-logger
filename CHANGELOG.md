# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2025-02-04

### Added

- **Chrome Extension MV3 Service Worker Support** - Full compatibility with Chrome Extension Manifest V3 service workers
  - Added IIFE bundle format (`dist/index.iife.js`) for maximum compatibility
  - Bundled all dependencies (Zod) into builds to avoid external dependency issues in SW context
  - Added safe console accessor that gracefully handles restricted console in SW contexts
  - Implemented lazy singleton initialization to avoid top-level side effects
  - Added `sideEffects: false` to package.json for better tree-shaking
  - New package export: `@alcyone-labs/simple-logger/iife` for direct IIFE usage

- **Documentation**
  - Added comprehensive MV3 Service Worker usage guide (`docs/MV3_SERVICE_WORKER.md`)
  - Included best practices, troubleshooting, and complete working examples

- **Testing**
  - Added MV3 Service Worker compatibility test suite (`test/mv3-service-worker.test.ts`)
  - Tests verify initialization without console, missing console methods, lazy initialization, and no `import.meta` usage

### Changed

- **Build Configuration**
  - Removed `zod` from external dependencies in `rolldown.config.js` (now bundled)
  - Fixed types export order in `package.json` for proper module resolution
  - Updated `prepublishOnly` script to run tests before building (publishing now fails if tests fail)

### Fixed

- Console transport now defensively checks for console availability before logging
- Singleton logger no longer initializes transports at module load time (prevents SW startup failures)

## [1.0.0] - 2025-01-21

### Added

- Initial release of `@alcyone-labs/simple-logger`
- Singleton Logger class with transport-based architecture
- ConsoleTransport for local development logging
- RemoteTransport for HTTP endpoint logging
- PinoBridgeTransport for integration with Pino logger
- Zod schema validation for log messages
- TypeScript support with full type definitions
- Child logger functionality with metadata binding
- Log level filtering (debug, info, warn, error)
