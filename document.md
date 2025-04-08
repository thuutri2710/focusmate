# FocusMate Project Documentation

## Project Overview
FocusMate is a Chrome extension for website time management and productivity enhancement. It helps users control their browsing habits by tracking time spent on websites and enforcing custom rules for website access.

## Technical Stack
- **Build Tool**: Vite v5.4.2
- **CSS Framework**: TailwindCSS v3.4.1
- **Testing Framework**: Jest v29.7.0
- **Package Manager**: pnpm
- **Module System**: ES Modules
- **Browser API**: Chrome Extension APIs

## Project Structure

### Core Directories
```
src/
├── background/     # Background service worker
├── popup/         # Extension popup UI
├── services/      # Core business logic
├── constants/     # Global constants
├── utils/         # Utility functions
└── styles/        # Global styles
```

### Key Components

#### 1. Background Service (`src/background/`)
- Main background script handling:
  - Website monitoring
  - Time tracking
  - Rule enforcement
  - Chrome API interactions

#### 2. Popup Interface (`src/popup/`)
- Components:
  - `ruleElement.js`: Individual rule UI component
  - `ruleList.js`: List of blocking rules
  - `eventHandlers.js`: Popup event management
- Styles in `styles/main.css`

#### 3. Core Services (`src/services/`)
- `ruleService.js`: Rule management logic
- `storage.js`: Chrome storage operations
- Tests available in `__tests__/` directory

#### 4. Utility Modules (`src/utils/`)
- `domUtils.js`: DOM manipulation helpers
- `uiUtils.js`: UI-related utilities
- `urlUtils.js`: URL handling functions
- `validation.js`: Input validation

### Build System
- Development: `pnpm watch` - Watch mode with hot reload
- Production: `pnpm build` - Creates production build
- Export: `pnpm export` - Creates distributable zip file
- Testing: `pnpm test` - Runs Jest tests

### Testing
- Jest setup in `jest.setup.js` and `jest.setup.mjs`
- Test environment: jsdom
- Coverage reporting available via `pnpm test:coverage`

### Configuration Files
- `manifest.json`: Chrome extension manifest
- `vite.config.js`: Vite build configuration
- `tailwind.config.js`: TailwindCSS configuration
- `postcss.config.js`: PostCSS configuration
- `babel.config.mjs`: Babel configuration

## Development Workflow
1. Make changes to source files
2. Run tests: `pnpm test`
3. Build extension: `pnpm build`
4. Load unpacked extension from `dist/` directory in Chrome

## Extension Features
1. **Time Tracking**
   - Real-time website usage monitoring
   - Daily usage statistics

2. **Website Blocking**
   - URL-based blocking rules
   - Wildcard domain support
   - Time-based restrictions

3. **Rule Management**
   - Create/Edit/Delete rules
   - Custom time limits
   - Domain-specific settings

## Deployment
1. Build production version: `pnpm build`
2. Create zip file: `pnpm export`
3. Submit to Chrome Web Store

## Future Refactoring Considerations
1. **Potential Improvements**
   - Migrate to TypeScript for better type safety
   - Add E2E tests with Playwright
   - Implement state management (e.g., Redux)
   - Add data persistence layer abstraction

2. **Code Organization**
   - Consider feature-based directory structure
   - Implement dependency injection
   - Add service worker versioning
   - Improve error handling system

3. **Performance Optimizations**
   - Implement caching for storage operations
   - Optimize rule matching algorithm
   - Add request batching for API calls
