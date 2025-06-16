/**
 * Database Manager Module
 * Re-exports the DatabaseManager class for compatibility with existing imports
 */

// Re-export DatabaseManager and related functionality from connection module
export {
    DatabaseManager,
    getDatabaseManager,
    type DatabaseConfig
} from './connection';

// Also re-export the DatabaseConnection wrapper if needed
export { DatabaseConnection, createDatabaseConnection } from './DatabaseConnection';