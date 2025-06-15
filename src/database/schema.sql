-- SQLite Database Schema for RNG Consciousness Experiment App
-- Following PEAR laboratory and Global Consciousness Project methodology

-- Enable foreign key constraints
PRAGMA foreign_keys = ON;

-- Core trials table - Primary data storage for all RNG trials
CREATE TABLE IF NOT EXISTS trials (
    id TEXT PRIMARY KEY,
    timestamp INTEGER NOT NULL,  -- Unix timestamp with milliseconds
    trial_value INTEGER NOT NULL CHECK(trial_value >= 0 AND trial_value <= 200),
    session_id TEXT,
    experiment_mode TEXT NOT NULL CHECK(experiment_mode IN ('session', 'continuous')),
    intention TEXT CHECK(intention IN ('high', 'low', 'baseline') OR intention IS NULL),
    trial_number INTEGER,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

-- Critical indexes for performance
CREATE INDEX IF NOT EXISTS idx_trials_timestamp ON trials(timestamp);
CREATE INDEX IF NOT EXISTS idx_trials_session ON trials(session_id);
CREATE INDEX IF NOT EXISTS idx_trials_mode_intention ON trials(experiment_mode, intention);
CREATE INDEX IF NOT EXISTS idx_trials_composite ON trials(experiment_mode, intention, timestamp);

-- Sessions table - Session-based experiments
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    start_time INTEGER NOT NULL,
    end_time INTEGER,
    intention TEXT NOT NULL CHECK(intention IN ('high', 'low', 'baseline')),
    target_trials INTEGER NOT NULL,
    actual_trials INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'running' CHECK(status IN ('running', 'completed', 'stopped')),
    notes TEXT,
    participant_id TEXT,
    duration INTEGER, -- Duration in milliseconds
    created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_sessions_start_time ON sessions(start_time);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_intention ON sessions(intention);

-- Intention periods table - Continuous mode intention tracking
CREATE TABLE IF NOT EXISTS intention_periods (
    id TEXT PRIMARY KEY,
    start_time INTEGER NOT NULL,
    end_time INTEGER,
    intention TEXT NOT NULL CHECK(intention IN ('high', 'low')),
    notes TEXT,
    session_id TEXT,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_intention_periods_time ON intention_periods(start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_intention_periods_intention ON intention_periods(intention);

-- Calibration runs table - Baseline calibration data
CREATE TABLE IF NOT EXISTS calibration_runs (
    id TEXT PRIMARY KEY,
    start_time INTEGER NOT NULL,
    end_time INTEGER NOT NULL,
    trial_count INTEGER NOT NULL,
    mean_value REAL NOT NULL,
    variance REAL NOT NULL,
    standard_deviation REAL NOT NULL,
    z_score REAL NOT NULL,
    p_value REAL,
    chi_square REAL,
    runs_test REAL,
    autocorrelation REAL,
    passed_randomness_test BOOLEAN NOT NULL,
    notes TEXT,
    created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_calibration_runs_time ON calibration_runs(start_time);
CREATE INDEX IF NOT EXISTS idx_calibration_runs_passed ON calibration_runs(passed_randomness_test);

-- Statistical results cache - For performance optimization
CREATE TABLE IF NOT EXISTS statistical_cache (
    id TEXT PRIMARY KEY,
    session_id TEXT,
    data_hash TEXT NOT NULL, -- Hash of the data used for calculation
    calculation_type TEXT NOT NULL CHECK(calculation_type IN ('session', 'period', 'continuous')),
    trial_count INTEGER NOT NULL,
    mean_value REAL NOT NULL,
    expected_mean REAL NOT NULL,
    variance REAL NOT NULL,
    standard_deviation REAL NOT NULL,
    z_score REAL NOT NULL,
    p_value REAL NOT NULL,
    network_variance REAL,
    stouffer_z REAL,
    cumulative_deviation TEXT, -- JSON array of cumulative deviations
    data_range_start INTEGER NOT NULL,
    data_range_end INTEGER NOT NULL,
    calculated_at INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_statistical_cache_session ON statistical_cache(session_id);
CREATE INDEX IF NOT EXISTS idx_statistical_cache_hash ON statistical_cache(data_hash);
CREATE INDEX IF NOT EXISTS idx_statistical_cache_type ON statistical_cache(calculation_type);

-- Data export log - Track exports for reproducibility
CREATE TABLE IF NOT EXISTS export_log (
    id TEXT PRIMARY KEY,
    export_type TEXT NOT NULL CHECK(export_type IN ('csv', 'json', 'excel')),
    data_range_start INTEGER NOT NULL,
    data_range_end INTEGER NOT NULL,
    trial_count INTEGER NOT NULL,
    session_count INTEGER NOT NULL,
    file_path TEXT NOT NULL,
    checksum TEXT NOT NULL,
    exported_at INTEGER DEFAULT (strftime('%s', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_export_log_time ON export_log(exported_at);
CREATE INDEX IF NOT EXISTS idx_export_log_type ON export_log(export_type);

-- Database metadata and versioning
CREATE TABLE IF NOT EXISTS database_metadata (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- Insert initial metadata
INSERT OR IGNORE INTO database_metadata (key, value) VALUES
    ('schema_version', '1.0.0'),
    ('created_at', strftime('%s', 'now')),
    ('app_version', '1.0.0');

-- Performance optimization settings
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA cache_size = 10000;
PRAGMA temp_store = MEMORY;
PRAGMA mmap_size = 268435456; -- 256MB