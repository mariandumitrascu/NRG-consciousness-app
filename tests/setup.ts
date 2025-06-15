// Jest test setup file
import 'jest';

// Setup test environment
global.console = {
    ...console,
    // Mock console methods to reduce noise in tests
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
};

// Setup test database in memory
process.env.NODE_ENV = 'test';
process.env.DB_PATH = ':memory:';

// Mock Electron APIs
jest.mock('electron', () => ({
    app: {
        getPath: jest.fn(() => '/tmp/test'),
        getName: jest.fn(() => 'test-app'),
    },
    ipcMain: {
        on: jest.fn(),
        handle: jest.fn(),
        emit: jest.fn(),
    },
    BrowserWindow: jest.fn(() => ({
        loadFile: jest.fn(),
        on: jest.fn(),
        webContents: {
            send: jest.fn(),
        },
    })),
}));

// Mock native RNG for tests
jest.mock('../src/core/rng', () => ({
    generateRandomBits: jest.fn(() => new Uint8Array(25)), // 200 bits
    initializeRNG: jest.fn(() => Promise.resolve()),
}));