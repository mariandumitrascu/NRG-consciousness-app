# Development Setup Guide

## Prerequisites

- **Node.js**: Version 18.0 or higher
- **npm**: Version 8.0 or higher
- **macOS**: 10.15 (Catalina) or higher for native RNG access
- **SQLite**: Included with macOS

## Initial Setup

1. **Clone and Install**

   ```bash
   cd rng-consciousness-app
   npm install
   ```

2. **Verify TypeScript Configuration**

   ```bash
   npm run typecheck
   ```

3. **Run Linting**

   ```bash
   npm run lint
   ```

## Development Workflow

### Starting Development Environment

```bash
# Start both renderer and main processes
npm run dev

# Or start individually:
npm run dev:renderer  # React frontend on http://localhost:3000
npm run dev:main      # Electron main process
```

### Project Structure

```
src/
├── main/           # Electron main process (Node.js)
├── renderer/       # React frontend (Browser)
├── shared/         # Shared types and utilities
├── core/          # RNG engine and statistical analysis
├── database/      # SQLite operations and schemas
└── components/    # React UI components
```

### Building for Production

```bash
# Build both renderer and main
npm run build

# Create distribution packages
npm run dist        # All platforms
npm run dist:dir    # Directory only (no installer)
```

## Key Development Guidelines

### TypeScript Standards

- Always use explicit types
- Prefer interfaces over type aliases for objects
- Use strict null checks
- Document complex types with JSDoc

### React Best Practices

- Use functional components with hooks
- Implement proper error boundaries
- Optimize renders with useMemo/useCallback
- Follow component composition patterns

### Statistical Code Requirements

- All mathematical functions must include unit tests
- Document formulas with scientific references
- Validate inputs and handle edge cases
- Use established statistical libraries where possible

### Database Operations

- Always use prepared statements
- Implement proper error handling
- Use transactions for related operations
- Test database operations in isolation

## Testing

### Running Tests

```bash
npm test           # Run all tests
npm run test:watch # Watch mode for development
```

### Test Categories

- **Unit Tests**: Core functions and utilities
- **Integration Tests**: Database operations
- **Component Tests**: React component behavior
- **Statistical Tests**: Validation of mathematical accuracy

### Writing Tests

- Place tests adjacent to source files or in `/tests`
- Use descriptive test names
- Test edge cases and error conditions
- Mock external dependencies

## Debugging

### Electron Main Process

- Use VS Code debugger configuration
- Console logs appear in terminal
- Access Chrome DevTools for main process

### React Renderer Process

- Standard browser DevTools
- React DevTools extension recommended
- Redux DevTools if state management added

### Database Debugging

- Use SQLite browser tools
- Enable query logging in development
- Validate schema changes with migrations

## Code Quality

### Pre-commit Checks

```bash
npm run lint       # ESLint checking
npm run format     # Prettier formatting
npm run typecheck  # TypeScript validation
```

### Continuous Integration

- All PRs must pass linting and tests
- Type checking enforced
- Code coverage monitoring
- Performance regression testing

## Architecture Decisions

### Process Communication

- Use Electron IPC for main/renderer communication
- Define clear interfaces in `/shared`
- Handle IPC errors gracefully

### State Management

- Start with React Context API
- Consider Redux only for complex state
- Keep statistical calculations in main process

### Data Flow

- RNG generation in main process (native access)
- Statistical processing in main process
- UI updates through IPC events
- Database operations isolated in main process

## Performance Considerations

### Real-time Requirements

- Target 200 Hz data generation rate
- Batch database operations
- Optimize chart rendering for smooth updates
- Monitor memory usage during long runs

### Profiling Tools

- Chrome DevTools Performance tab
- Electron's built-in profiler
- Node.js profiler for main process
- SQLite query analysis

## Troubleshooting

### Common Issues

**Build Errors:**

- Clear `node_modules` and reinstall
- Check TypeScript configuration
- Verify all dependencies are installed

**Electron Issues:**

- Check main process console for errors
- Verify IPC message handlers
- Test with fresh user data directory

**Database Problems:**

- Check file permissions
- Verify SQLite version compatibility
- Test database operations in isolation

**Performance Issues:**

- Profile with DevTools
- Check for memory leaks
- Optimize database queries
- Reduce unnecessary re-renders

## Contributing

1. Create feature branch from `main`
2. Follow code style guidelines
3. Add tests for new functionality
4. Update documentation
5. Ensure all checks pass
6. Submit pull request

## Resources

- [Electron Documentation](https://electronjs.org/docs)
- [React Documentation](https://reactjs.org/docs)
- [TypeScript Handbook](https://typescriptlang.org/docs)
- [SQLite Documentation](https://sqlite.org/docs.html)
- [PEAR Laboratory Papers](http://pearlab.icrl.org/)
