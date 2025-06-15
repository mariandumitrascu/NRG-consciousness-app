# Changelog

All notable changes to the Personal RNG Consciousness Experiment App will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2024-06-15 - Phase 0: Project Setup Complete

### Added

- **Project Structure**: Created complete directory structure with proper separation of concerns
  - `src/main/` - Electron main process
  - `src/renderer/` - React frontend
  - `src/shared/` - Shared types and utilities
  - `src/core/` - RNG engine and statistical analysis
  - `src/database/` - SQLite operations
  - `src/components/` - React components
  - `data/` - Local data storage
  - `docs/` - Documentation
  - `tests/` - Test files

- **Configuration Files**:
  - `package.json` - Dependencies for Electron, React, TypeScript, SQLite, Chart.js, statistical libraries
  - `tsconfig.json` - TypeScript configuration for renderer process
  - `tsconfig.main.json` - TypeScript configuration for main process
  - `vite.config.ts` - Vite build system configuration
  - `.eslintrc.js` - ESLint configuration with React and TypeScript rules
  - `.prettierrc` - Code formatting configuration
  - `jest.config.js` - Testing framework configuration
  - `.gitignore` - Git ignore patterns for Electron/React project
  - `.cursorrules` - Development guidelines and coding standards for scientific accuracy

- **Documentation**:
  - `README.md` - Project overview, scientific background, and usage instructions
  - `docs/DEVELOPMENT.md` - Development setup guide and workflow
  - `docs/PHASES.md` - Complete 10-phase development roadmap
  - `CHANGELOG.md` - This changelog for tracking all changes

- **Basic Framework**:
  - `src/main/main.ts` - Minimal Electron main process entry point
  - `src/main/preload.ts` - Security layer for IPC communication
  - `src/renderer/index.html` - HTML template with security headers
  - `src/renderer/main.tsx` - React application entry point
  - `src/renderer/App.tsx` - Basic App component shell
  - `src/renderer/index.css` - Minimal styling framework
  - `tests/setup.ts` - Jest test environment configuration with Electron mocks
  - `data/.gitkeep` - Placeholder to maintain data directory structure

### Development Environment

- **Technology Stack**: TypeScript + React + Electron + SQLite + Chart.js
- **Build System**: Vite for frontend, TypeScript compiler for main process
- **Testing**: Jest with jsdom environment and Electron mocks
- **Code Quality**: ESLint + Prettier with scientific coding standards
- **Architecture**: Modular design with clear separation between processes

### Scientific Requirements Established

- 200-bit trials per second data generation requirement
- PEAR laboratory methodology compliance
- Global Consciousness Project statistical approaches
- Local-only data storage for privacy and integrity
- Comprehensive statistical validation requirements
- Real-time visualization capabilities

### Next Phase

- Ready for Phase 1: Core Infrastructure (Database Layer, Electron Main Process, Shared Types)

---

**Note**: This project maintains scientific rigor and reproducibility standards. All changes affecting statistical calculations or experimental methodology will be clearly documented with mathematical references and validation status.
