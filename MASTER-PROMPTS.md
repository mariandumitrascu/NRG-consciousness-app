# **PHASES 0-4 PROMPTS FOR DOCUMENTATION**

---

## **PHASE 0: PROJECT SETUP & ENVIRONMENT**

**PROMPT FOR CURSOR - PHASE 0: PROJECT SETUP & ENVIRONMENT**

You are building a **Personal RNG Consciousness Experiment App** - a research-grade application that replicates PEAR laboratory and Global Consciousness Project methodology for personal use. This will be a macOS desktop application.

**IMPORTANT: DO NOT START CODING YET. This phase is ONLY for setup.**

Your tasks for Phase 0:

1. **Create `.cursorrules` file** with these development guidelines:
   - TypeScript/React for frontend
   - Electron for desktop app
   - SQLite for local data storage
   - Chart.js or similar for data visualization
   - Modular architecture with clear separation of concerns
   - Scientific accuracy in statistical calculations
   - Clean, minimal UI following research app conventions
   - Comprehensive error handling and data validation
   - Code should be well-documented for scientific reproducibility

2. **Create project structure**:

   ```
   rng-consciousness-app/
   ├── src/
   │   ├── main/           # Electron main process
   │   ├── renderer/       # React frontend
   │   ├── shared/         # Shared types and utilities
   │   ├── core/          # RNG engine and statistical analysis
   │   ├── database/      # SQLite operations
   │   └── components/    # React components
   ├── data/              # Local data storage
   ├── docs/              # Documentation
   └── tests/             # Test files
   ```

3. **Create `package.json`** with necessary dependencies:
   - Electron
   - React + TypeScript
   - SQLite3 or better-sqlite3
   - Chart.js or recharts
   - Statistical libraries (simple-statistics or similar)
   - Date/time handling (date-fns)
   - UUID generation
   - Testing framework (Jest)

4. **Create development configuration files**:
   - `tsconfig.json` for TypeScript
   - `.gitignore` appropriate for Electron/React project
   - `electron-builder` configuration for packaging
   - ESLint and Prettier configurations

5. **Create initial documentation**:
   - `README.md` explaining the project and scientific background
   - `DEVELOPMENT.md` with setup instructions
   - `PHASES.md` outlining all development phases

6. **Set up the basic Electron + React boilerplate** (empty, just the framework)

**Core Requirements Summary:**

- **Mode 1**: Intention-based sessions (set intention → run experiment → see real-time cumulative deviation)
- **Mode 2**: Continuous 24/7 monitoring with manual intention timeframe entry
- **Data**: 200-bit trials per second, stored locally in SQLite
- **Analysis**: Cumulative deviation, variance analysis, z-scores
- **RNG**: Use macOS built-in random number generation
- **UI**: Clean, scientific, minimal distractions

Create all setup files and structure, but DO NOT implement any actual functionality yet. Reply with "Phase 0 Complete" when done and show me the created project structure.

---

## **PHASE 1: CORE RNG ENGINE & DATA MODELS**

**PROMPT FOR CURSOR - PHASE 1: CORE RNG ENGINE & DATA MODELS**

Now you will build the core random number generation engine and data models. This is the scientific heart of the application.

**Your tasks for Phase 1:**

### 1. **Core RNG Engine** (`src/core/rng-engine.ts`)

Create a high-quality RNG engine that:

- **Generates 200-bit trials**: Each trial consists of exactly 200 random bits, summed to create a single integer (0-200)
- **1 trial per second**: Precise timing mechanism for continuous data collection
- **Uses macOS crypto.getRandomValues()**: This provides the best available randomness on macOS
- **Implements proper bit sampling**: Convert random bytes to exactly 200 bits per trial
- **Includes calibration mode**: Can run calibration trials to establish baseline randomness
- **Thread-safe**: Can run continuously without blocking the UI

**Key methods:**

```typescript
class RNGEngine {
  generateTrial(): RNGTrial          // Single 200-bit trial
  startContinuous(): void            // Begin continuous generation
  stopContinuous(): void             // Stop continuous generation
  runCalibration(trials: number): CalibrationResult
}
```

### 2. **Data Models** (`src/shared/types.ts`)

Define TypeScript interfaces for:

**RNGTrial**:

- `timestamp`: precise Date
- `trialValue`: number (0-200, sum of 200 bits)
- `sessionId`: string (UUID)
- `experimentMode`: 'session' | 'continuous'
- `intention`: 'high' | 'low' | 'baseline' | null

**ExperimentSession**:

- `id`: string (UUID)
- `startTime`: Date
- `endTime`: Date | null
- `intention`: 'high' | 'low' | 'baseline'
- `targetTrials`: number
- `status`: 'running' | 'completed' | 'stopped'

**IntentionPeriod** (for continuous mode):

- `id`: string (UUID)
- `startTime`: Date
- `endTime`: Date | null
- `intention`: 'high' | 'low'
- `notes`: string

**StatisticalResult**:

- `trialCount`: number
- `mean`: number
- `expectedMean`: number (should be 100 for 200-bit trials)
- `variance`: number
- `standardDeviation`: number
- `zScore`: number
- `cumulativeDeviation`: number[]

### 3. **Statistical Analysis Core** (`src/core/statistics.ts`)

Implement essential statistical functions:

- **calculateBasicStats(trials: RNGTrial[])**: mean, variance, std dev
- **calculateZScore(trials: RNGTrial[])**: standardized deviation from expected mean
- **calculateCumulativeDeviation(trials: RNGTrial[])**: running cumulative deviation for real-time display
- **calculateNetworkVariance(trials: RNGTrial[])**: implement "Squared Stouffer Z" method used by GCP
- **runBaselineTest(trials: RNGTrial[])**: test if data matches expected random distribution

### 4. **Time Management** (`src/core/time-manager.ts`)

Create precise timing utilities:

- **Interval timer**: Ensures exactly 1 trial per second
- **High-precision timestamps**: Microsecond accuracy for data correlation
- **Session duration tracking**: Track experiment timing
- **Timezone handling**: Consistent time storage and display

### 5. **Data Validation** (`src/core/validation.ts`)

Implement validation for:

- **Trial data integrity**: Ensure each trial has valid 0-200 value
- **Timing consistency**: Detect missed trials or timing irregularities
- **Session coherence**: Validate session start/end logic
- **Statistical bounds**: Flag impossible statistical results

### **Technical Requirements:**

1. **Use proper random source**: `crypto.getRandomValues()` for true randomness
2. **Precise bit handling**: Convert random bytes to exactly 200 bits per trial
3. **No blocking operations**: All RNG operations should be non-blocking
4. **Memory efficient**: Handle continuous 24/7 operation without memory leaks
5. **Error resilient**: Graceful handling of timing irregularities

### **Expected Output:**

When complete, you should be able to:

```typescript
const engine = new RNGEngine();
const trial = engine.generateTrial(); // Returns valid RNGTrial
const stats = calculateBasicStats([trial]); // Returns StatisticalResult
```

**Focus on scientific accuracy and data integrity**. This engine will be the foundation for all experimental modes.

Do NOT implement UI, database operations, or file I/O yet. Focus solely on the core mathematical and timing engine.

Reply with "Phase 1 Complete" and show me a few sample RNGTrial outputs when done.

---

## **PHASE 2: DATABASE SCHEMA & DATA OPERATIONS**

**PROMPT FOR CURSOR - PHASE 2: DATABASE SCHEMA & DATA OPERATIONS**

Now you will create the local SQLite database system to store all experimental data. This database must handle both real-time continuous data collection (24/7) and session-based experiments efficiently.

**Your tasks for Phase 2:**

### 1. **Database Schema Setup** (`src/database/schema.sql`)

Create SQLite tables with proper indexing for performance:

**trials table** - Core data storage:

```sql
CREATE TABLE trials (
    id TEXT PRIMARY KEY,
    timestamp INTEGER NOT NULL,  -- Unix timestamp with milliseconds
    trial_value INTEGER NOT NULL CHECK(trial_value >= 0 AND trial_value <= 200),
    session_id TEXT,
    experiment_mode TEXT NOT NULL CHECK(experiment_mode IN ('session', 'continuous')),
    intention TEXT CHECK(intention IN ('high', 'low', 'baseline')),
    created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- Critical indexes for performance
CREATE INDEX idx_trials_timestamp ON trials(timestamp);
CREATE INDEX idx_trials_session ON trials(session_id);
CREATE INDEX idx_trials_mode_intention ON trials(experiment_mode, intention);
```

**sessions table** - Session-based experiments:

```sql
CREATE TABLE sessions (
    id TEXT PRIMARY KEY,
    start_time INTEGER NOT NULL,
    end_time INTEGER,
    intention TEXT NOT NULL CHECK(intention IN ('high', 'low', 'baseline')),
    target_trials INTEGER NOT NULL,
    actual_trials INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'running' CHECK(status IN ('running', 'completed', 'stopped')),
    notes TEXT,
    created_at INTEGER DEFAULT (strftime('%s', 'now'))
);
```

**intention_periods table** - Continuous mode intention tracking:

```sql
CREATE TABLE intention_periods (
    id TEXT PRIMARY KEY,
    start_time INTEGER NOT NULL,
    end_time INTEGER,
    intention TEXT NOT NULL CHECK(intention IN ('high', 'low')),
    notes TEXT,
    created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

CREATE INDEX idx_intention_periods_time ON intention_periods(start_time, end_time);
```

**calibration_runs table** - Baseline calibration data:

```sql
CREATE TABLE calibration_runs (
    id TEXT PRIMARY KEY,
    start_time INTEGER NOT NULL,
    end_time INTEGER NOT NULL,
    trial_count INTEGER NOT NULL,
    mean_value REAL NOT NULL,
    variance REAL NOT NULL,
    z_score REAL NOT NULL,
    passed_randomness_test BOOLEAN NOT NULL,
    notes TEXT,
    created_at INTEGER DEFAULT (strftime('%s', 'now'))
);
```

### 2. **Database Connection Manager** (`src/database/connection.ts`)

Create a robust database connection system:

- **Initialize database**: Create/migrate schema on first run
- **Connection pooling**: Efficient connection management
- **Transaction support**: Ensure data integrity during bulk operations
- **Backup functionality**: Automatic periodic backups
- **Migration system**: Handle schema updates gracefully

```typescript
class DatabaseManager {
  async initialize(): Promise<void>
  async backup(filename?: string): Promise<string>
  async migrate(): Promise<void>
  getConnection(): Database  // better-sqlite3 connection
}
```

### 3. **Data Access Layer** (`src/database/repositories/`)

Create repository classes for each data type:

**TrialRepository** (`trials-repository.ts`):

```typescript
class TrialRepository {
  async insertTrial(trial: RNGTrial): Promise<void>
  async insertTrialsBatch(trials: RNGTrial[]): Promise<void>  // For performance
  async getTrialsBySession(sessionId: string): Promise<RNGTrial[]>
  async getTrialsByTimeRange(start: Date, end: Date): Promise<RNGTrial[]>
  async getTrialsByIntention(intention: string, limit?: number): Promise<RNGTrial[]>
  async getContinuousTrials(hours: number): Promise<RNGTrial[]>  // Last N hours
  async deleteOldTrials(daysToKeep: number): Promise<number>  // Data cleanup
}
```

**SessionRepository** (`session-repository.ts`):

```typescript
class SessionRepository {
  async createSession(session: ExperimentSession): Promise<string>
  async updateSession(sessionId: string, updates: Partial<ExperimentSession>): Promise<void>
  async getSession(sessionId: string): Promise<ExperimentSession | null>
  async getRecentSessions(limit: number): Promise<ExperimentSession[]>
  async getSessionStats(sessionId: string): Promise<StatisticalResult>
}
```

**IntentionRepository** (`intention-repository.ts`):

```typescript
class IntentionRepository {
  async startIntentionPeriod(intention: 'high' | 'low', notes?: string): Promise<string>
  async endIntentionPeriod(periodId: string): Promise<void>
  async getCurrentIntentionPeriod(): Promise<IntentionPeriod | null>
  async getIntentionPeriods(days: number): Promise<IntentionPeriod[]>
  async getTrialsForPeriod(periodId: string): Promise<RNGTrial[]>
}
```

### 4. **Performance Optimization** (`src/database/optimization.ts`)

Handle continuous 24/7 data collection efficiently:

- **Batch inserts**: Group trials for bulk insertion (every 10-30 seconds)
- **Write-ahead logging**: Enable WAL mode for concurrent read/write
- **Memory management**: Prevent database growth from causing issues
- **Cleanup routines**: Automatically archive/delete old data
- **Query optimization**: Efficient queries for large datasets

### 5. **Data Integrity & Backup** (`src/database/maintenance.ts`)

Implement data protection:

- **Automatic backups**: Daily/weekly backup rotation
- **Data validation**: Check for corrupted trials or missing data
- **Recovery procedures**: Restore from backup functionality
- **Export capabilities**: CSV/JSON export for external analysis

### **Technical Requirements:**

1. **Use better-sqlite3**: Synchronous API, better performance than sqlite3
2. **WAL mode**: Enable concurrent reads during writes
3. **Prepared statements**: All queries must use prepared statements
4. **Transaction wrapping**: Bulk operations in transactions
5. **Error handling**: Comprehensive error catching and logging
6. **Data types**: Proper SQLite data type usage (INTEGER for timestamps)

### **Performance Targets:**

- **Insert rate**: Handle 1 trial/second continuously without lag
- **Query speed**: Historical data queries under 100ms for typical ranges
- **Database size**: Efficient storage (estimate ~50MB per month of continuous data)
- **Memory usage**: Stable memory footprint during continuous operation

### **Integration Points:**

This database layer will integrate with:

- Phase 1 RNG engine for storing trials
- Future UI components for displaying historical data
- Statistical analysis for large dataset calculations

**Test the database with continuous trial insertion** - simulate 1 trial/second for several minutes and verify performance.

Reply with "Phase 2 Complete" and show me the database schema files created and a sample of database operations working.

---

## **PHASE 3: ADVANCED STATISTICAL ANALYSIS ENGINE**

**PROMPT FOR CURSOR - PHASE 3: ADVANCED STATISTICAL ANALYSIS ENGINE**

Now you will implement the sophisticated statistical analysis engine that replicates PEAR laboratory and Global Consciousness Project methodology. This is the scientific core that will detect potential consciousness-related deviations from randomness.

**Your tasks for Phase 3:**

### 1. **Core Statistical Engine** (`src/core/advanced-statistics.ts`)

Implement the key statistical methods used in consciousness research:

**Primary Analysis Methods:**

```typescript
class AdvancedStatistics {
  // GCP Network Variance (Squared Stouffer Z) - primary analysis method
  calculateNetworkVariance(trials: RNGTrial[]): NetworkVarianceResult

  // Device variance (Sum of Z^2) - alternative analysis
  calculateDeviceVariance(trials: RNGTrial[]): DeviceVarianceResult

  // Cumulative deviation tracking for real-time display
  calculateCumulativeDeviation(trials: RNGTrial[]): CumulativeResult

  // Z-score analysis with confidence intervals
  calculateZScore(trials: RNGTrial[], expectedMean?: number): ZScoreResult

  // Effect size calculation (important for comparing studies)
  calculateEffectSize(trials: RNGTrial[]): EffectSizeResult
}
```

**Network Variance Implementation** (GCP standard):

- Calculate individual trial deviations from expected mean (100)
- Convert to Z-scores: `z = (observed - expected) / sqrt(expected * (1-p))` where p=0.5
- Square the Z-scores and sum: `netvar = sum(z²)`
- Calculate probability using chi-square distribution

### 2. **Real-Time Analysis** (`src/core/realtime-analysis.ts`)

For live session monitoring:

```typescript
class RealtimeAnalysis {
  // Running statistics that update with each new trial
  updateRunningStats(newTrial: RNGTrial, currentStats: RunningStats): RunningStats

  // Cumulative deviation graph data (for live plotting)
  getCumulativeDeviationSeries(trials: RNGTrial[]): CumulativePoint[]

  // Real-time significance assessment
  getCurrentSignificance(trials: RNGTrial[]): SignificanceResult

  // Trend detection (is effect increasing/decreasing?)
  detectTrend(trials: RNGTrial[], windowSize: number): TrendResult

  // Live session quality assessment
  assessDataQuality(trials: RNGTrial[]): QualityAssessment
}
```

### 3. **Baseline Analysis** (`src/core/baseline-analysis.ts`)

Critical for validating RNG quality:

```typescript
class BaselineAnalysis {
  // Randomness testing (multiple statistical tests)
  runRandomnessTests(trials: RNGTrial[]): RandomnessTestResult

  // Calibration analysis (compare against known random periods)
  analyzeCalibrationData(calibrationTrials: RNGTrial[]): CalibrationAnalysis

  // Baseline drift detection (RNG hardware changes over time)
  detectBaselineDrift(trials: RNGTrial[], periodDays: number): DriftAnalysis

  // Control period analysis (compare intention vs non-intention periods)
  compareControlPeriods(intentionTrials: RNGTrial[], controlTrials: RNGTrial[]): ComparisonResult
}
```

### 4. **Time Series Analysis** (`src/core/timeseries-analysis.ts`)

For continuous monitoring mode:

```typescript
class TimeSeriesAnalysis {
  // Identify periods of significant deviation
  findSignificantPeriods(trials: RNGTrial[], windowMinutes: number): SignificantPeriod[]

  // Correlate with intention periods
  correlateWithIntentions(trials: RNGTrial[], intentions: IntentionPeriod[]): CorrelationResult[]

  // Daily/weekly patterns analysis
  analyzeTemporalPatterns(trials: RNGTrial[], days: number): TemporalPattern

  // Event detection (unusual statistical periods)
  detectAnomalousEvents(trials: RNGTrial[], threshold: number): AnomalousEvent[]
}
```

### 5. **Data Types for Results** (`src/shared/analysis-types.ts`)

Define comprehensive result types:

```typescript
interface NetworkVarianceResult {
  netvar: number;              // The network variance value
  degreesOfFreedom: number;    // For chi-square calculation
  chisquare: number;           // Chi-square statistic
  probability: number;         // P-value
  significance: 'none' | 'marginal' | 'significant' | 'highly_significant';
  confidenceInterval: [number, number];
}

interface CumulativeResult {
  points: CumulativePoint[];   // For plotting
  finalDeviation: number;      // End cumulative deviation
  maxDeviation: number;        // Peak deviation reached
  minDeviation: number;        // Lowest deviation reached
  crossings: number;           // How many times crossed zero
}

interface CumulativePoint {
  trialIndex: number;
  timestamp: Date;
  cumulativeDeviation: number;
  runningMean: number;
  zScore: number;
}

interface SignificanceResult {
  pValue: number;
  zScore: number;
  effectSize: number;
  confidenceLevel: number;
  interpretation: 'random' | 'marginally_significant' | 'significant' | 'highly_significant';
  sampleSize: number;
}
```

### 6. **Statistical Utilities** (`src/core/statistical-utils.ts`)

Helper functions for calculations:

```typescript
class StatisticalUtils {
  // Probability distributions
  static chiSquareProbability(x: number, df: number): number
  static normalProbability(z: number): number
  static tDistributionProbability(t: number, df: number): number

  // Confidence intervals
  static calculateConfidenceInterval(mean: number, std: number, n: number, confidence: number): [number, number]

  // Effect size calculations
  static cohensD(mean1: number, mean2: number, pooledStd: number): number
  static hedgesG(mean1: number, mean2: number, pooledStd: number, n1: number, n2: number): number

  // Multiple comparisons correction
  static bonferroniCorrection(pValues: number[]): number[]
  static benjaminiHochbergCorrection(pValues: number[]): number[]
}
```

### 7. **Analysis Validation** (`src/core/analysis-validation.ts`)

Ensure statistical accuracy:

```typescript
class AnalysisValidation {
  // Validate statistical assumptions
  validateNormalityAssumption(data: number[]): ValidationResult
  validateIndependence(trials: RNGTrial[]): ValidationResult
  validateSampleSize(trials: RNGTrial[], analysisType: string): ValidationResult

  // Cross-validate different analysis methods
  crossValidateAnalyses(trials: RNGTrial[]): CrossValidationResult

  // Detect analysis artifacts or errors
  detectAnalysisArtifacts(result: any): ArtifactWarning[]
}
```

### **Scientific Requirements:**

1. **Replicate GCP methodology**: Use exact same statistical formulas as Global Consciousness Project
2. **Handle edge cases**: Small sample sizes, missing data, timing irregularities
3. **Multiple analysis approaches**: Implement both primary (netvar) and alternative methods
4. **Real-time capability**: All calculations must be fast enough for live updates
5. **Scientific precision**: Use appropriate precision for all floating-point calculations
6. **Confidence intervals**: Provide error bounds for all statistical estimates

### **Performance Requirements:**

- **Real-time analysis**: Update statistics within 100ms of new trial
- **Large dataset handling**: Analyze months of continuous data efficiently
- **Memory efficient**: Streaming calculations for large datasets
- **Incremental updates**: Avoid recalculating everything for each new trial

### **Integration with Previous Phases:**

- Use `RNGTrial` and other types from Phase 1
- Query data using repositories from Phase 2
- Prepare statistical results for visualization in future phases

### **Expected Validation:**

Test the engine with:

1. **Known random data**: Should show no significant deviations
2. **Artificially biased data**: Should correctly detect deviations
3. **GCP historical data**: Compare results with published GCP analyses

**Focus on scientific accuracy above all else**. These calculations will determine the validity of any consciousness-related effects detected.

Reply with "Phase 3 Complete" and show me sample statistical analysis results from test data.

---

## **PHASE 4: BASIC UI FRAMEWORK & NAVIGATION**

**PROMPT FOR CURSOR - PHASE 4: BASIC UI FRAMEWORK & NAVIGATION**

Now you will create the clean, scientific user interface framework that supports both experimental modes. The UI should be minimal, distraction-free, and professional - suitable for serious consciousness research.

**Your tasks for Phase 4:**

### 1. **Main Application Shell** (`src/renderer/App.tsx`)

Create the primary application structure:

```typescript
// Main app with routing and global state
function App() {
  // Global app state (current mode, session status, etc.)
  // Router setup for different views
  // Global error boundary
  // Theme provider (scientific/minimal theme)
}
```

**Key Features:**

- **Clean header**: App title, current time, system status
- **Navigation sidebar**: Switch between modes and views
- **Main content area**: Dynamic based on current view
- **Status bar**: RNG engine status, database status, trial count
- **Modal system**: For settings, calibration, etc.

### 2. **Navigation System** (`src/renderer/components/Navigation/`)

**MainNavigation.tsx** - Primary navigation:

```typescript
const navigationItems = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { id: 'session-mode', label: 'Session Experiments', icon: 'target' },
  { id: 'continuous-mode', label: 'Continuous Monitoring', icon: 'activity' },
  { id: 'analysis', label: 'Data Analysis', icon: 'chart' },
  { id: 'calibration', label: 'Calibration', icon: 'settings' },
  { id: 'history', label: 'History', icon: 'archive' }
];
```

**NavigationButton.tsx** - Individual nav items with active states
**BreadcrumbNavigation.tsx** - Secondary navigation for sub-views

### 3. **Dashboard View** (`src/renderer/views/Dashboard/`)

**Dashboard.tsx** - Main overview screen:

- **System status**: RNG engine health, database size, uptime
- **Quick stats**: Today's trial count, recent sessions, current intention period
- **Recent activity**: Last few sessions/intention periods
- **Quick actions**: Start session, begin intention period, run calibration
- **Data quality indicators**: Recent randomness test results

**Components:**

- `StatusCard.tsx` - Individual status displays
- `QuickStats.tsx` - Numerical summaries
- `RecentActivity.tsx` - Timeline of recent actions
- `SystemHealth.tsx` - RNG and database health indicators

### 4. **Layout Components** (`src/renderer/components/Layout/`)

**Header.tsx**:

```typescript
interface HeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}
// Display current time, app title, global actions
```

**Sidebar.tsx**:

- Collapsible navigation
- Current mode indicator
- Quick status indicators

**StatusBar.tsx**:

- RNG engine status (running/stopped)
- Trial generation rate
- Database connection status
- Current session/intention period info

**ContentArea.tsx**:

- Main scrollable content region
- Responsive layout
- Loading states

### 5. **Common UI Components** (`src/renderer/components/Common/`)

**Button.tsx** - Consistent button styling:

```typescript
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'danger' | 'ghost';
  size: 'small' | 'medium' | 'large';
  icon?: string;
  loading?: boolean;
  disabled?: boolean;
}
```

**Card.tsx** - Content containers:

```typescript
interface CardProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  variant?: 'default' | 'highlighted' | 'warning';
}
```

**Badge.tsx** - Status indicators:

```typescript
interface BadgeProps {
  variant: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  size: 'small' | 'medium';
  pulse?: boolean; // For live indicators
}
```

**LoadingSpinner.tsx** - Loading states
**Modal.tsx** - Dialog system
**Tooltip.tsx** - Help and information
**ProgressBar.tsx** - For session progress

### 6. **Theme System** (`src/renderer/styles/`)

**theme.ts** - Scientific/minimal design system:

```typescript
export const theme = {
  colors: {
    primary: '#2563eb',      // Professional blue
    secondary: '#64748b',    // Neutral gray
    success: '#059669',      // Green for positive results
    warning: '#d97706',      // Orange for warnings
    error: '#dc2626',        // Red for errors
    background: '#ffffff',   // Clean white
    surface: '#f8fafc',      // Light gray
    text: {
      primary: '#0f172a',    // Dark text
      secondary: '#475569',  // Medium gray
      muted: '#94a3b8'       // Light gray
    },
    chart: {
      baseline: '#94a3b8',   // Gray for zero line
      positive: '#059669',   // Green for positive deviation
      negative: '#dc2626',   // Red for negative deviation
      intention: '#2563eb'   // Blue for intention periods
    }
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem'
  },
  typography: {
    heading: 'system-ui, -apple-system, sans-serif',
    body: 'system-ui, -apple-system, sans-serif',
    monospace: 'Monaco, Consolas, monospace'
  }
};
```

**globals.css** - Base styles and CSS variables
**components.css** - Component-specific styles

### 7. **State Management** (`src/renderer/store/`)

**AppContext.tsx** - Global app state:

```typescript
interface AppState {
  currentView: string;
  rngEngineStatus: 'stopped' | 'running' | 'error';
  databaseStatus: 'connected' | 'disconnected' | 'error';
  currentSession: ExperimentSession | null;
  currentIntentionPeriod: IntentionPeriod | null;
  systemHealth: SystemHealthStatus;
}
```

**hooks/useAppState.ts** - Custom hooks for state access
**hooks/useRealTimeData.ts** - Real-time data subscriptions

### 8. **Electron Integration** (`src/renderer/services/`)

**ElectronAPI.tsx** - Bridge to main process:

```typescript
interface ElectronAPI {
  // RNG engine control
  startRNGEngine(): Promise<void>;
  stopRNGEngine(): Promise<void>;
  getRNGStatus(): Promise<EngineStatus>;

  // Database operations
  getDatabaseStatus(): Promise<DatabaseStatus>;

  // Real-time data
  subscribeToTrials(callback: (trial: RNGTrial) => void): void;
  unsubscribeFromTrials(): void;
}
```

### **Design Principles:**

1. **Minimal and Clean**: No unnecessary visual elements that could distract during experiments
2. **Scientific Aesthetic**: Professional, credible appearance suitable for research
3. **Real-time Capable**: UI can update smoothly with incoming data
4. **Responsive**: Works well at different window sizes
5. **Accessible**: Proper contrast, keyboard navigation, screen reader support
6. **Fast**: Smooth animations, no UI lag during data collection

### **Technical Requirements:**

- **React 18+**: Use modern React patterns (hooks, concurrent features)
- **TypeScript**: Full type safety throughout UI
- **CSS-in-JS or CSS Modules**: Scoped styling
- **Responsive design**: Adapt to different screen sizes
- **Dark mode ready**: Prepare theme system for future dark mode
- **Electron-specific**: Handle window controls, menus, etc.

### **Navigation Flow:**

```
Dashboard (overview)
├── Session Mode (Phase 5)
│   ├── New Session
│   ├── Running Session
│   └── Session Results
├── Continuous Mode (Phase 6)
│   ├── Monitor View
│   ├── Intention Entry
│   └── Timeline View
├── Analysis (Phase 7)
│   ├── Statistical Reports
│   ├── Charts & Graphs
│   └── Export Data
├── Calibration
│   ├── Run Calibration
│   └── Calibration History
└── History
    ├── Past Sessions
    ├── Intention Periods
    └── System Events
```

### **Integration with Previous Phases:**

- **Phase 1 Integration**: Use RNG engine status and trial data types
- **Phase 2 Integration**: Connect to database repositories for data display
- **Phase 3 Integration**: Display statistical analysis results in dashboard
- **Real-time Updates**: Show live trial generation and statistical updates

### **Performance Requirements:**

- **Smooth Rendering**: 60fps UI updates even during continuous data collection
- **Memory Efficient**: Handle real-time data without memory leaks
- **Fast Navigation**: Instant switching between views
- **Responsive Interactions**: Button clicks and form interactions under 100ms

### **Expected Output:**

When Phase 4 is complete, you should have:

- Clean, professional application shell with working navigation
- Responsive layout system with scientific theme
- Basic dashboard showing system status and quick stats
- Common UI components ready for experimental modes
- State management system for real-time data
- Electron integration for main process communication

**Do NOT implement the specific experimental modes yet** - focus on the framework, navigation, and common components that will support the detailed functionality in upcoming phases.

Reply with "Phase 4 Complete" and show me screenshots of the main dashboard and navigation system.

---

**END OF PHASES 0-4**
# **ALL REMAINING PHASE PROMPTS (5-10)**

---

## **PHASE 5: INTENTION-BASED SESSION MODE**

**PROMPT FOR CURSOR - PHASE 5: INTENTION-BASED SESSION MODE**

Now you will implement the core experimental functionality - intention-based sessions where users set an intention (high/low/baseline) and run controlled experiments with real-time statistical feedback.

**Your tasks for Phase 5:**

### 1. **Session Management System** (`src/renderer/views/SessionMode/`)

**SessionModeView.tsx** - Main session mode container:

```typescript
interface SessionModeState {
  currentSession: ExperimentSession | null;
  sessionStatus: 'setup' | 'running' | 'paused' | 'completed';
  realTimeData: RNGTrial[];
  statisticalResults: NetworkVarianceResult;
}
```

**SessionSetup.tsx** - Pre-session configuration:

- Intention selection (High/Low/Baseline with clear descriptions)
- Target trial count (default: 300, range: 100-3000)
- Session notes/description
- Pre-session meditation timer (optional 2-5 minute preparation)
- Hardware calibration check

**RunningSession.tsx** - Active session interface:

- Large real-time cumulative deviation chart
- Current statistics display (mean, z-score, p-value)
- Trial counter and progress bar
- Session timer
- Emergency stop button
- Minimal, distraction-free layout

### 2. **Real-Time Data Display** (`src/renderer/components/Session/`)

**CumulativeChart.tsx** - Live deviation chart:

```typescript
interface CumulativeChartProps {
  trials: RNGTrial[];
  intention: 'high' | 'low' | 'baseline';
  height: number;
  showGrid: boolean;
  highlightSignificance: boolean;
}
```

- Real-time updating line chart
- Zero baseline clearly marked
- Color coding: green for intended direction, red for opposite
- Significance thresholds marked (p=0.05, p=0.01)
- Smooth animation for new data points

**StatisticsPanel.tsx** - Live statistics:

- Current mean (vs expected 100.0)
- Cumulative deviation
- Z-score with confidence interval
- P-value with significance interpretation
- Effect size (Cohen's d)
- Trial count and rate

**ProgressIndicator.tsx** - Session progress:

- Visual progress bar
- Time elapsed / estimated remaining
- Trials completed / target
- Current generation rate (trials/second)

### 3. **Session Controls** (`src/renderer/components/Session/`)

**SessionControls.tsx** - Main control panel:

```typescript
interface SessionControlsProps {
  sessionStatus: SessionStatus;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onEmergencyStop: () => void;
}
```

**IntentionSelector.tsx** - Clear intention setting:

- Radio buttons with clear descriptions
- Visual indicators of intended direction
- Confirmation dialog for intention changes
- Brief instructions for each intention type

**MeditationTimer.tsx** - Pre-session preparation:

- Guided breathing timer (2-5 minutes)
- Soft chime notifications
- Instructions for intention setting
- Optional skip for experienced users

### 4. **Session Results** (`src/renderer/views/SessionMode/SessionResults.tsx`)

**SessionSummary.tsx** - Post-session analysis:

- Final statistical results with interpretation
- Complete cumulative deviation chart
- Session metadata (duration, trial count, etc.)
- Statistical significance assessment
- Comparison with previous sessions
- Notes section for user observations

**ResultsExport.tsx** - Data export options:

- Raw trial data (CSV)
- Statistical summary (PDF)
- Chart images (PNG)
- Session metadata (JSON)

### 5. **Session History** (`src/renderer/views/SessionMode/SessionHistory.tsx`)

**SessionList.tsx** - Historical sessions:

- Searchable/filterable session list
- Quick statistics for each session
- Visual indicators of significant results
- Session comparison tools

**SessionComparison.tsx** - Multi-session analysis:

- Side-by-side statistical comparison
- Combined cumulative charts
- Trend analysis over time
- Meta-analysis across sessions

### 6. **Integration Components** (`src/renderer/hooks/`)

**useSessionManager.ts** - Session lifecycle management:

```typescript
const useSessionManager = () => {
  const [session, setSession] = useState<ExperimentSession | null>(null);
  const [trials, setTrials] = useState<RNGTrial[]>([]);
  const [statistics, setStatistics] = useState<NetworkVarianceResult | null>(null);

  const startSession = async (config: SessionConfig) => Promise<void>;
  const stopSession = async () => Promise<void>;
  const pauseSession = async () => Promise<void>;

  return { session, trials, statistics, startSession, stopSession, pauseSession };
};
```

**useRealTimeStats.ts** - Live statistical updates:

- Subscribe to new trials
- Calculate incremental statistics
- Trigger significance alerts
- Manage chart data efficiently

### 7. **User Experience Features**

**Distraction Prevention:**

- Full-screen session mode option
- Notification blocking during sessions
- Screen dimming controls
- Focus maintenance alerts

**Guidance System:**

- First-time user tutorial
- Intention setting guidance
- Best practices tips
- Common pitfalls warnings

**Accessibility:**

- Screen reader support for statistics
- Keyboard navigation
- High contrast mode
- Customizable text sizes

### **Technical Requirements:**

- **Real-time Performance**: Chart updates at 1fps minimum, statistics update every second
- **Memory Management**: Efficient handling of continuous trial data
- **Data Integrity**: Ensure no trials are lost during sessions
- **Error Recovery**: Handle RNG interruptions gracefully
- **State Persistence**: Save session state across app restarts

### **Integration Requirements:**

- Connect to Phase 1 RNG engine for trial generation
- Use Phase 2 database repositories for session storage
- Apply Phase 3 statistical analysis for real-time calculations
- Use Phase 4 UI components and navigation

**Expected Output:** Complete intention-based session system with real-time feedback, statistical analysis, and professional data collection interface.

Reply with "Phase 5 Complete" and demonstrate a running session with live statistics.

---

## **PHASE 6: CONTINUOUS MONITORING MODE**

**PROMPT FOR CURSOR - PHASE 6: CONTINUOUS MONITORING MODE**

Now you will implement the 24/7 continuous monitoring system where the RNG runs constantly in the background, and users can mark intention periods to later analyze for correlations.

**Your tasks for Phase 6:**

### 1. **Continuous Engine Management** (`src/main/continuous-manager.ts`)

**ContinuousDataCollector** - Background data collection:

```typescript
class ContinuousDataCollector {
  private isRunning: boolean = false;
  private intervalId: NodeJS.Timeout | null = null;

  async start(): Promise<void>  // Start 24/7 collection
  async stop(): Promise<void>   // Stop background collection
  async getStatus(): Promise<ContinuousStatus>
  private async handleTrialGeneration(): Promise<void>
  private async handleErrors(error: Error): Promise<void>
}
```

**Features:**

- Runs independently of UI (background service)
- Automatic restart after system sleep/wake
- Error recovery and logging
- Performance monitoring
- Data batching for efficiency

### 2. **Continuous Mode UI** (`src/renderer/views/ContinuousMode/`)

**ContinuousView.tsx** - Main monitoring interface:

- Real-time activity indicator
- Current intention period (if any)
- Today's trial count and statistics
- System health dashboard
- Quick intention period controls

**MonitorDashboard.tsx** - Live monitoring:

```typescript
interface MonitorDashboardProps {
  isCollecting: boolean;
  currentRate: number;        // Trials per second
  todayCount: number;        // Trials collected today
  currentDeviation: number;  // Running deviation
  systemHealth: HealthStatus;
}
```

**ContinuousTimeline.tsx** - Visual timeline:

- 24-hour timeline view with trial data
- Intention periods highlighted
- Significant deviation periods marked
- Zoom controls (hour/day/week/month views)
- Interactive period selection

### 3. **Intention Period Management** (`src/renderer/components/Continuous/`)

**IntentionPeriodControls.tsx** - Start/stop intention periods:

```typescript
interface IntentionControlsProps {
  currentPeriod: IntentionPeriod | null;
  onStartPeriod: (intention: 'high' | 'low', notes?: string) => void;
  onEndPeriod: () => void;
  onUpdateNotes: (notes: string) => void;
}
```

**QuickIntentionButton.tsx** - One-click intention start:

- Large, easily accessible buttons
- "Start High Intention" / "Start Low Intention"
- Confirmation dialogs for accidental clicks
- Current period status display

**IntentionPeriodForm.tsx** - Detailed period entry:

- Intention type selection
- Optional duration setting
- Notes/description field
- Start time adjustment (for retroactive entry)

### 4. **Background Analysis** (`src/main/background-analyzer.ts`)

**AutomaticAnalysis** - Continuous statistical monitoring:

```typescript
class BackgroundAnalyzer {
  private analysisInterval: NodeJS.Timeout | null = null;

  startPeriodicAnalysis(): void  // Every 5 minutes
  analyzeRecentData(): Promise<AnalysisResult>
  detectSignificantPeriods(): Promise<SignificantPeriod[]>
  correlateWithIntentions(): Promise<CorrelationResult[]>
  generateDailyReport(): Promise<DailyReport>
}
```

**Features:**

- Automatic anomaly detection
- Intention period correlation analysis
- Daily statistical summaries
- Trend identification
- Alert generation for significant events

### 5. **Timeline Visualization** (`src/renderer/components/Continuous/`)

**TimelineChart.tsx** - Interactive data timeline:

```typescript
interface TimelineChartProps {
  timeRange: TimeRange;
  trials: RNGTrial[];
  intentionPeriods: IntentionPeriod[];
  significantEvents: SignificantEvent[];
  onPeriodSelect: (period: IntentionPeriod) => void;
}
```

**Features:**

- Zoomable timeline (1 hour to 1 year)
- Layered data display (trials, intentions, events)
- Brush selection for detailed analysis
- Export selected time ranges
- Overlay multiple data types

**MiniTimeline.tsx** - Compact overview:

- 24-hour rolling window
- Current activity indicator
- Intention period markers
- Quick zoom controls

### 6. **Analysis Tools** (`src/renderer/views/ContinuousMode/Analysis/`)

**PeriodAnalysis.tsx** - Intention period analysis:

- Individual period statistical results
- Before/during/after comparison
- Effect size calculations
- Period-to-period correlation
- Success rate tracking

**TrendAnalysis.tsx** - Long-term pattern detection:

- Daily/weekly/monthly trends
- Seasonal pattern analysis
- Personal effectiveness patterns
- Optimal timing identification

**CorrelationMatrix.tsx** - Multi-factor analysis:

- Time of day correlations
- Duration vs. effect size
- Intention type effectiveness
- Environmental factor correlations

### 7. **System Health Monitoring** (`src/renderer/components/Continuous/`)

**HealthDashboard.tsx** - System status:

```typescript
interface HealthMetrics {
  rngStatus: 'healthy' | 'warning' | 'error';
  dataRate: number;           // Actual vs. expected rate
  missedTrials: number;       // Data collection gaps
  databaseSize: number;       // Storage usage
  uptime: number;            // Continuous operation time
  lastError: Error | null;   // Recent error information
}
```

**AlertSystem.tsx** - Problem notifications:

- Data collection interruptions
- RNG hardware issues
- Database problems
- Statistical anomalies
- System resource alerts

### 8. **Data Management** (`src/main/continuous-data-manager.ts`)

**DataRetentionManager** - Long-term storage:

```typescript
class DataRetentionManager {
  async archiveOldData(retentionDays: number): Promise<void>
  async compactDatabase(): Promise<void>
  async exportTimeRange(start: Date, end: Date): Promise<ExportResult>
  async validateDataIntegrity(): Promise<ValidationResult>
}
```

**Features:**

- Automatic data archiving
- Database optimization
- Integrity checking
- Backup management
- Storage usage monitoring

### **Technical Requirements:**

- **24/7 Operation**: Reliable continuous operation without memory leaks
- **System Integration**: Handle sleep/wake cycles, low power modes
- **Error Recovery**: Automatic restart after failures
- **Performance**: Efficient storage and retrieval of large datasets
- **Real-time UI**: Smooth updates without blocking data collection

### **Background Service Features:**

- **Auto-start**: Begin collection on app launch
- **Persistence**: Continue through app restarts
- **Resource Management**: Minimal CPU/memory usage
- **Error Logging**: Comprehensive error tracking
- **Health Monitoring**: Self-monitoring and recovery

### **User Experience:**

- **Minimal Intervention**: Set and forget operation
- **Quick Access**: Easy intention period start/stop
- **Visual Feedback**: Clear indication of system status
- **Historical Access**: Easy browsing of past data
- **Flexible Analysis**: Multiple ways to examine data

Reply with "Phase 6 Complete" and demonstrate continuous monitoring with intention period tracking.

---

## **PHASE 7: DATA VISUALIZATION & CHARTS**

**PROMPT FOR CURSOR - PHASE 7: DATA VISUALIZATION & CHARTS**

Now you will create comprehensive data visualization tools for both real-time display and historical analysis, implementing scientific-grade charts that match PEAR and GCP standards.

**Your tasks for Phase 7:**

### 1. **Advanced Chart Library** (`src/renderer/components/Charts/`)

**CumulativeDeviationChart.tsx** - Primary analysis chart:

```typescript
interface CumulativeChartProps {
  data: CumulativePoint[];
  intention?: 'high' | 'low' | 'baseline';
  showSignificanceBands: boolean;
  showTrendLine: boolean;
  interactive: boolean;
  height: number;
  timeLabels: boolean;
}
```

**Features:**

- Real-time data streaming capability
- Significance bands (p=0.05, p=0.01, p=0.001)
- Intention period highlighting
- Zoom and pan controls
- Crosshair with precise values
- Export to PNG/SVG

**NetworkVarianceChart.tsx** - GCP-style variance display:

```typescript
interface NetworkVarianceProps {
  networkVariance: number[];
  timestamps: Date[];
  events: MarkedEvent[];
  showExpectedRange: boolean;
  logarithmicScale: boolean;
}
```

**StatisticalDistributionChart.tsx** - Distribution analysis:

- Histogram of trial values (0-200 range)
- Expected vs. observed distribution
- Chi-square goodness of fit visualization
- Normal distribution overlay
- Statistical test results display

### 2. **Multi-Session Analysis** (`src/renderer/components/Charts/`)

**SessionComparisonChart.tsx** - Compare multiple sessions:

```typescript
interface SessionComparisonProps {
  sessions: ExperimentSession[];
  metric: 'cumulative' | 'zScore' | 'effectSize';
  alignBy: 'time' | 'trialCount';
  showIndividual: boolean;
  showAverage: boolean;
}
```

**MetaAnalysisChart.tsx** - Long-term trend analysis:

- Effect size over time
- Success rate trends
- Confidence intervals
- Regression analysis
- Seasonal patterns

**EffectSizeChart.tsx** - Effect magnitude visualization:

- Forest plot style display
- Individual session effect sizes
- Confidence intervals
- Meta-analytic summary
- Statistical significance indicators

### 3. **Time Series Visualizations** (`src/renderer/components/Charts/`)

**TimeSeriesChart.tsx** - Continuous data display:

```typescript
interface TimeSeriesProps {
  timeRange: TimeRange;
  resolution: 'second' | 'minute' | 'hour' | 'day';
  dataType: 'raw' | 'smoothed' | 'deviation';
  overlays: ChartOverlay[];
  annotations: TimeAnnotation[];
}
```

**HeatmapChart.tsx** - Pattern visualization:

- Hour-of-day vs. day-of-week heatmap
- Effectiveness by time patterns
- Seasonal correlation matrix
- Color-coded significance levels

**CorrelationChart.tsx** - Factor analysis:

- Scatter plots with trend lines
- Multi-variable correlation matrix
- Partial correlation analysis
- Interactive factor selection

### 4. **Interactive Analysis Tools** (`src/renderer/components/Charts/`)

**InteractiveExplorer.tsx** - Data exploration interface:

```typescript
interface ExplorerProps {
  dataset: AnalysisDataset;
  filters: DataFilter[];
  groupBy: GroupingOption[];
  chartType: ChartType;
  onSelectionChange: (selection: DataSelection) => void;
}
```

**BrushSelection.tsx** - Time range selection:

- Brush tool for chart selection
- Linked chart interactions
- Selection statistics display
- Zoom to selection capability

**AnnotationTool.tsx** - Chart markup:

- Add notes to specific time points
- Mark significant events
- Personal observation tracking
- Collaborative annotation system

### 5. **Statistical Visualization** (`src/renderer/components/Charts/`)

**SignificanceChart.tsx** - P-value tracking:

```typescript
interface SignificanceProps {
  pValues: number[];
  timestamps: Date[];
  correctionMethod: 'none' | 'bonferroni' | 'fdr';
  significanceThreshold: number;
  showRunningSignificance: boolean;
}
```

**ConfidenceIntervalChart.tsx** - Uncertainty visualization:

- Error bars and confidence bands
- Bootstrapped confidence intervals
- Bayesian credible intervals
- Multiple confidence levels

**PowerAnalysisChart.tsx** - Sample size analysis:

- Statistical power curves
- Sample size recommendations
- Effect size detectability
- Type I/Type II error visualization

### 6. **Export and Reporting** (`src/renderer/components/Charts/`)

**ChartExporter.tsx** - Multi-format export:

```typescript
interface ExportOptions {
  format: 'png' | 'svg' | 'pdf' | 'eps';
  resolution: number;
  includeData: boolean;
  includeStatistics: boolean;
  colorScheme: 'color' | 'grayscale' | 'print';
}
```

**ReportGenerator.tsx** - Automated report creation:

- Scientific report templates
- Automated chart generation
- Statistical summary tables
- Publication-ready formatting
- Custom report builders

### 7. **Real-Time Visualization** (`src/renderer/components/Charts/`)

**LiveChart.tsx** - Streaming data display:

```typescript
interface LiveChartProps {
  updateInterval: number;      // Milliseconds between updates
  bufferSize: number;         // Number of points to keep in memory
  animationSpeed: number;     // Transition animation duration
  pauseOnHover: boolean;      // Pause updates during interaction
}
```

**Features:**

- Smooth real-time updates
- Automatic scaling
- Performance optimization for long runs
- Memory management
- Pause/resume capability

**RealtimeStatistics.tsx** - Live statistical display:

- Running statistics with animations
- Significance alerting
- Trend indicators
- Performance metrics

### 8. **Chart Themes and Styling** (`src/renderer/styles/charts/`)

**ChartThemes.ts** - Professional styling:

```typescript
interface ChartTheme {
  colors: {
    primary: string;
    secondary: string;
    positive: string;
    negative: string;
    neutral: string;
    significance: string[];
  };
  fonts: {
    title: FontConfig;
    axis: FontConfig;
    legend: FontConfig;
    annotation: FontConfig;
  };
  spacing: SpacingConfig;
  animations: AnimationConfig;
}
```

**Themes:**

- Scientific publication theme
- High contrast accessibility theme
- Dark mode theme
- Print-friendly theme
- Presentation theme

### 9. **Performance Optimization** (`src/renderer/utils/chart-optimization.ts`)

**DataOptimization** - Large dataset handling:

```typescript
class ChartOptimizer {
  decimateData(data: DataPoint[], maxPoints: number): DataPoint[]
  aggregateByTime(data: DataPoint[], interval: TimeInterval): AggregatedPoint[]
  virtualizeRendering(data: DataPoint[], viewport: Viewport): DataPoint[]
  cacheCalculations(data: DataPoint[], cacheKey: string): CachedResult
}
```

**Features:**

- Data decimation for large datasets
- Progressive data loading
- Viewport-based rendering
- Calculation caching
- Memory management

### **Technical Requirements:**

- **Chart Library**: Use Chart.js, D3.js, or Recharts for base functionality
- **Performance**: Handle datasets with 100k+ points smoothly
- **Interactivity**: Zoom, pan, select, and annotate capabilities
- **Export Quality**: Publication-ready image exports
- **Responsive**: Adapt to different screen sizes
- **Accessibility**: Screen reader support and keyboard navigation

### **Scientific Accuracy:**

- **Statistical Correctness**: All statistical visualizations must be mathematically accurate
- **Standard Compliance**: Follow scientific visualization best practices
- **Color Usage**: Appropriate use of color for different data types
- **Scale Handling**: Proper axis scaling and labeling
- **Error Representation**: Clear visualization of uncertainty

### **Integration Requirements:**

- Connect to Phase 3 statistical analysis results
- Use Phase 2 database queries for historical data
- Integrate with Phase 4 UI components
- Support Phase 5 session visualization needs
- Enable Phase 6 continuous monitoring displays

Reply with "Phase 7 Complete" and show examples of the cumulative deviation chart and session comparison visualizations.

---

## **PHASE 8: HISTORICAL ANALYSIS & REPORTING**

**PROMPT FOR CURSOR - PHASE 8: HISTORICAL ANALYSIS & REPORTING**

Now you will create comprehensive historical analysis tools and automated reporting systems for long-term data analysis, trend identification, and scientific documentation.

**Your tasks for Phase 8:**

### 1. **Advanced Data Analysis** (`src/renderer/views/Analysis/`)

**HistoricalAnalysis.tsx** - Main analysis interface:

```typescript
interface AnalysisConfig {
  timeRange: TimeRange;
  sessionFilter: SessionFilter;
  intentionFilter: IntentionFilter[];
  statisticalTests: AnalysisTest[];
  groupBy: GroupingCriteria;
  compareWith: ComparisonDataset;
}
```

**DataExplorer.tsx** - Interactive data exploration:

- Multi-dimensional filtering system
- Dynamic grouping and aggregation
- Statistical test selection
- Real-time result updates
- Custom analysis pipeline builder

**TrendAnalyzer.tsx** - Long-term pattern detection:

- Moving averages and trend lines
- Seasonal decomposition
- Regression analysis
- Change point detection
- Forecast modeling

### 2. **Meta-Analysis Tools** (`src/renderer/components/Analysis/`)

**MetaAnalysisPanel.tsx** - Cross-session analysis:

```typescript
interface MetaAnalysisProps {
  sessions: ExperimentSession[];
  analysisType: 'fixedEffect' | 'randomEffect' | 'mixed';
  weightingMethod: 'sampleSize' | 'inverseVariance' | 'quality';
  heterogeneityTest: boolean;
  forestPlot: boolean;
}
```

**EffectSizeAnalysis.tsx** - Effect magnitude tracking:

- Individual session effect sizes
- Pooled effect size calculation
- Confidence intervals
- Heterogeneity assessment
- Publication bias detection

**LearningCurveAnalysis.tsx** - Improvement tracking:

- Performance over time
- Learning rate calculation
- Plateau detection
- Skill development metrics

### 3. **Statistical Reporting** (`src/renderer/components/Reports/`)

**ReportGenerator.tsx** - Automated report creation:

```typescript
interface ReportConfig {
  template: ReportTemplate;
  timeRange: TimeRange;
  includeSections: ReportSection[];
  statisticalLevel: 'basic' | 'intermediate' | 'advanced';
  exportFormat: 'pdf' | 'html' | 'docx';
  includeRawData: boolean;
}
```

**StatisticalSummary.tsx** - Comprehensive statistics:

- Descriptive statistics table
- Inferential test results
- Effect size calculations
- Confidence intervals
- Power analysis results

**MethodologySection.tsx** - Scientific documentation:

- Experimental protocol description
- Statistical methods used
- Data collection procedures
- Quality control measures
- Limitations and assumptions

### 4. **Advanced Filtering** (`src/renderer/components/Analysis/`)

**FilterBuilder.tsx** - Complex filter construction:

```typescript
interface FilterCriteria {
  temporal: TemporalFilter;      // Date ranges, time of day, day of week
  experimental: ExperimentFilter; // Session type, intention, duration
  statistical: StatisticalFilter; // Significance level, effect size
  quality: QualityFilter;        // Data completeness, error rates
  custom: CustomFilter[];        // User-defined criteria
}
```

**AdvancedSearch.tsx** - Sophisticated data queries:

- Boolean logic combinations
- Nested filter groups
- Saved filter presets
- Query performance optimization
- Results preview

### 5. **Comparative Analysis** (`src/renderer/components/Analysis/`)

**SessionComparator.tsx** - Multi-session comparison:

```typescript
interface ComparisonAnalysis {
  sessions: ExperimentSession[];
  comparisonMetrics: ComparisonMetric[];
  statisticalTests: StatisticalTest[];
  adjustForMultiple: boolean;
  visualizationType: 'table' | 'chart' | 'heatmap';
}
```

**BaselineComparison.tsx** - Control vs. experimental:

- Before/during/after analysis
- Matched control periods
- Regression to the mean assessment
- Placebo effect detection

**PeerComparison.tsx** - Anonymous peer comparison:

- Aggregate population statistics
- Percentile rankings
- Anonymous benchmarking
- Research contribution metrics

### 6. **Export and Documentation** (`src/renderer/services/`)

**DataExporter.tsx** - Multi-format export:

```typescript
interface ExportOptions {
  format: 'csv' | 'json' | 'xlsx' | 'matlab' | 'r' | 'spss';
  dataLevel: 'raw' | 'processed' | 'summary';
  includeMetadata: boolean;
  anonymize: boolean;
  compression: boolean;
}
```

**ReportExporter.tsx** - Scientific report generation:

- LaTeX template support
- APA/Nature/Science formatting
- Automated citation generation
- Figure and table numbering
- Bibliography management

**DataPackage.tsx** - Research data packaging:

- Complete experimental datasets
- Metadata documentation
- Analysis scripts
- Replication instructions
- Digital signatures

### 7. **Quality Assessment** (`src/renderer/components/Analysis/`)

**DataQualityAnalyzer.tsx** - Comprehensive quality assessment:

```typescript
interface QualityMetrics {
  completeness: number;          // Percentage of expected data
  consistency: number;           // Internal consistency score
  accuracy: number;             // Calibration accuracy
  reliability: number;          // Test-retest reliability
  validity: number;             // Construct validity score
}
```

**OutlierDetection.tsx** - Anomaly identification:

- Statistical outlier detection
- Time series anomalies
- Pattern deviation analysis
- Data cleaning recommendations

**ReliabilityAnalysis.tsx** - Measurement reliability:

- Internal consistency measures
- Test-retest reliability
- Inter-rater reliability (if applicable)
- Measurement error assessment

### 8. **Research Tools** (`src/renderer/components/Research/`)

**HypothesisGenerator.tsx** - Research hypothesis development:

```typescript
interface ResearchHypothesis {
  question: string;
  prediction: string;
  rationale: string;
  testMethod: StatisticalTest;
  powerAnalysis: PowerCalculation;
  sampleSizeNeeded: number;
}
```

**StudyDesigner.tsx** - Experimental design tools:

- Sample size calculation
- Power analysis
- Randomization schemes
- Blinding protocols
- Control group design

**PublicationPrep.tsx** - Research publication tools:

- Manuscript templates
- Figure preparation
- Statistical reporting standards
- Reproducibility checklists
- Data sharing protocols

### 9. **Advanced Statistics** (`src/core/advanced-research-stats.ts`)

**BayesianAnalysis** - Bayesian statistical methods:

```typescript
class BayesianAnalyzer {
  calculateBayesFactor(data: RNGTrial[], hypothesis: Hypothesis): BayesFactorResult
  posteriorDistribution(data: RNGTrial[], prior: PriorDistribution): PosteriorResult
  credibleIntervals(posterior: PosteriorResult, level: number): CredibleInterval
  modelComparison(models: BayesianModel[]): ModelComparison
}
```

**SequentialAnalysis** - Adaptive data analysis:

- Sequential probability ratio test
- Optional stopping rules
- Error spending functions
- Adaptive sample size

**MachineLearning** - Pattern detection:

- Anomaly detection algorithms
- Time series forecasting
- Classification of effective sessions
- Feature importance analysis

### **Technical Requirements:**

- **Performance**: Handle years of historical data efficiently
- **Memory Management**: Process large datasets without memory issues
- **Export Quality**: Professional-grade output formats
- **Statistical Accuracy**: All calculations must be scientifically valid
- **Reproducibility**: Ensure analysis can be replicated exactly

### **Research Standards:**

- **Scientific Rigor**: Follow established research methodologies
- **Statistical Reporting**: Meet APA/AMA statistical reporting standards
- **Data Integrity**: Maintain audit trails for all analyses
- **Version Control**: Track analysis versions and parameters
- **Documentation**: Comprehensive methodology documentation

### **Integration Requirements:**

- Use all previous phases' data and functionality
- Generate reports suitable for scientific publication
- Export data for external statistical software
- Maintain research audit trails
- Support collaborative research workflows

Reply with "Phase 8 Complete" and demonstrate a comprehensive analysis report with statistical summaries and visualizations.

---

## **PHASE 9: CALIBRATION & VALIDATION TOOLS**

**PROMPT FOR CURSOR - PHASE 9: CALIBRATION & VALIDATION TOOLS**

Now you will implement comprehensive calibration and validation systems to ensure scientific rigor, hardware validation, and research quality control - essential for credible consciousness research.

**Your tasks for Phase 9:**

### 1. **Hardware Calibration System** (`src/main/calibration/`)

**CalibrationManager.tsx** - Main calibration controller:

```typescript
class CalibrationManager {
  async runStandardCalibration(trials: number): Promise<CalibrationResult>
  async runExtendedCalibration(hours: number): Promise<ExtendedCalibrationResult>
  async runRandomnessTests(): Promise<RandomnessTestSuite>
  async schedulePeriodicCalibration(interval: CalibrationInterval): Promise<void>
  async validateHardwareHealth(): Promise<HardwareHealthReport>
}
```

**RandomnessValidator.tsx** - Statistical randomness testing:

```typescript
interface RandomnessTestSuite {
  diehard: DiehardTestResults;           // DIEHARD battery of tests
  nist: NISTTestResults;                 // NIST SP 800-22 tests
  ent: EntTestResults;                   // ENT randomness tests
  autocorrelation: AutocorrelationTest;  // Serial correlation
  runs: RunsTestResults;                 // Runs tests
  frequency: FrequencyTestResults;       // Frequency analysis
}
```

**BaselineEstimator.tsx** - System baseline establishment:

- Long-term baseline drift detection
- Expected mean and variance calculation
- Seasonal baseline adjustments
- Hardware aging compensation
- Environmental factor correlation

### 2. **Validation Protocols** (`src/renderer/views/Calibration/`)

**CalibrationWizard.tsx** - Guided calibration process:

```typescript
interface CalibrationProtocol {
  type: 'initial' | 'periodic' | 'diagnostic' | 'research';
  duration: CalibrationDuration;
  testSuite: RandomnessTest[];
  environmentalControls: EnvironmentalCheck[];
  qualityCriteria: QualityCriteria;
  reportGeneration: boolean;
}
```

**ValidationDashboard.tsx** - Real-time calibration monitoring:

- Current test progress
- Real-time statistical indicators
- Pass/fail status for each test
- Quality metrics visualization
- Test interruption controls

**CalibrationHistory.tsx** - Historical validation tracking:

- Calibration timeline
- Hardware performance trends
- Degradation detection
- Maintenance scheduling
- Compliance tracking

### 3. **Quality Control System** (`src/core/quality-control/`)

**QualityController.tsx** - Automated quality monitoring:

```typescript
class QualityController {
  async monitorDataQuality(): Promise<QualityReport>
  async detectAnomalies(data: RNGTrial[]): Promise<AnomalyReport>
  async validateSessionIntegrity(session: ExperimentSession): Promise<IntegrityReport>
  async assessStatisticalValidity(results: StatisticalResult): Promise<ValidityAssessment>
  async generateQualityAlert(issue: QualityIssue): Promise<void>
}
```

**DataIntegrityChecker.tsx** - Data validation system:

- Missing data detection
- Timestamp consistency verification
- Value range validation
- Duplicate detection
- Corruption assessment

**ExperimentalValidator.tsx** - Protocol compliance:

- Session protocol adherence
- Proper intention setting validation
- Duration requirement compliance
- Statistical power verification
- Control group validation

### 4. **Diagnostic Tools** (`src/renderer/components/Calibration/`)

**HardwareDiagnostics.tsx** - System health assessment:

```typescript
interface DiagnosticSuite {
  rngHealth: RNGHealthCheck;
  timingAccuracy: TimingDiagnostic;
  dataIntegrity: IntegrityDiagnostic;
  systemResources: ResourceDiagnostic;
  environmentalFactors: EnvironmentalDiagnostic;
}
```

**PerformanceMonitor.tsx** - System performance tracking:

- Trial generation rate monitoring
- CPU/memory usage tracking
- Database performance metrics
- UI responsiveness measurement
- Error rate monitoring

**TroubleshootingWizard.tsx** - Problem diagnosis and resolution:

- Automated problem detection
- Step-by-step diagnostic procedures
- Common issue resolution guides
- Expert system recommendations
- Support ticket generation

### 5. **Research Validation** (`src/core/research-validation/`)

**ProtocolValidator.tsx** - Research protocol compliance:

```typescript
interface ResearchProtocol {
  studyDesign: StudyDesignCriteria;
  sampleSize: SampleSizeCriteria;
  randomization: RandomizationCriteria;
  blinding: BlindingCriteria;
  controls: ControlCriteria;
  statistics: StatisticalCriteria;
}
```

**ReplicationValidator.tsx** - Replication verification:

- Exact protocol replication checks
- Statistical method verification
- Data collection consistency
- Results reproducibility assessment
- Inter-laboratory comparison

**EthicsValidator.tsx** - Research ethics compliance:

- Informed consent verification
- Data privacy protection
- Research ethics guidelines
- Publication ethics standards
- Data sharing compliance

### 6. **Automated Testing** (`src/tests/calibration/`)

**CalibrationTestSuite.tsx** - Comprehensive test automation:

```typescript
class AutomatedCalibration {
  async runDailyChecks(): Promise<DailyCheckResult>
  async runWeeklyValidation(): Promise<WeeklyValidationResult>
  async runMonthlyCalibration(): Promise<MonthlyCalibrationResult>
  async runCustomTestSuite(tests: CalibrationTest[]): Promise<CustomTestResult>
}
```

**RegressionTesting.tsx** - System regression detection:

- Performance regression detection
- Statistical output consistency
- UI functionality verification
- Data integrity maintenance
- Backward compatibility testing

**StressTestingSuite.tsx** - System stress validation:

- Long-duration operation testing
- High-volume data processing
- Resource exhaustion testing
- Error recovery validation
- Concurrent operation testing

### 7. **Certification and Compliance** (`src/renderer/views/Certification/`)

**CertificationManager.tsx** - Research certification tracking:

```typescript
interface CertificationStandard {
  standard: 'ISO' | 'NIST' | 'IEEE' | 'FDA' | 'Custom';
  requirements: ComplianceRequirement[];
  validationProcedures: ValidationProcedure[];
  documentationNeeds: DocumentationRequirement[];
  renewalSchedule: RenewalSchedule;
}
```

**ComplianceTracker.tsx** - Regulatory compliance monitoring:

- Standards compliance tracking
- Audit trail maintenance
- Documentation generation
- Renewal scheduling
- Compliance reporting

**AuditTrail.tsx** - Complete activity logging:

- All user actions logged
- System events recorded
- Data modifications tracked
- Analysis parameter logging
- Export activity monitoring

### 8. **Validation Reporting** (`src/renderer/components/Reports/`)

**ValidationReport.tsx** - Comprehensive validation documentation:

```typescript
interface ValidationReport {
  executiveSummary: ValidationSummary;
  methodologySection: MethodologyDescription;
  testResults: TestResultsSummary;
  statisticalAnalysis: StatisticalValidation;
  conclusions: ValidationConclusions;
  recommendations: ValidationRecommendations;
}
```

**CalibrationCertificate.tsx** - Official calibration documentation:

- Formal calibration certificate
- Test parameters and results
- Uncertainty measurements
- Calibration authority information
- Next calibration due date

**QualityAssessmentReport.tsx** - Ongoing quality documentation:

- Quality metrics trending
- Issue identification and resolution
- Improvement recommendations
- Risk assessments
- Mitigation strategies

### 9. **Expert System** (`src/core/expert-system/`)

**DiagnosticExpert.tsx** - AI-assisted problem diagnosis:

```typescript
class DiagnosticExpert {
  async diagnoseProblem(symptoms: SystemSymptom[]): Promise<DiagnosisResult>
  async recommendSolution(diagnosis: DiagnosisResult): Promise<SolutionRecommendation>
  async predictMaintenance(healthMetrics: HealthMetric[]): Promise<MaintenancePrediction>
  async optimizeSettings(performanceData: PerformanceData): Promise<OptimizationSuggestion>
}
```

**KnowledgeBase.tsx** - Expert knowledge system:

- Problem-solution database
- Best practices repository
- Troubleshooting guides
- Performance optimization tips
- Research methodology guidance

### **Technical Requirements:**

- **Automated Execution**: Run calibrations without user intervention
- **Comprehensive Testing**: Cover all aspects of system functionality
- **Statistical Rigor**: Use established statistical testing methods
- **Documentation**: Generate detailed validation reports
- **Integration**: Work seamlessly with all system components

### **Validation Standards:**

- **NIST SP 800-22**: Implement full NIST randomness test suite
- **DIEHARD Tests**: Classic randomness testing battery
- **Research Standards**: Meet consciousness research community standards
- **ISO Compliance**: Follow relevant ISO quality standards
- **Reproducibility**: Ensure all tests can be replicated exactly

### **Quality Assurance:**

- **Continuous Monitoring**: Real-time quality assessment
- **Automated Alerts**: Immediate notification of quality issues
- **Trend Analysis**: Long-term quality trend monitoring
- **Predictive Maintenance**: Anticipate hardware issues
- **Documentation**: Complete quality documentation

### **Integration Requirements:**

- Connect to all previous phases for comprehensive validation
- Generate certification documents for research publication
- Provide quality metrics for ongoing operation
- Support external validation and peer review
- Enable regulatory compliance where required

Reply with "Phase 9 Complete" and demonstrate a calibration run with randomness test results and validation report generation.

---

## **PHASE 10: FINAL POLISH & TESTING**

**PROMPT FOR CURSOR - PHASE 10: FINAL POLISH & TESTING**

This is the final phase where you will complete the application with comprehensive testing, performance optimization, user experience improvements, documentation, and preparation for distribution.

**Your tasks for Phase 10:**

### 1. **Comprehensive Testing Suite** (`tests/`)

**Unit Testing** (`tests/unit/`):

```typescript
// Core functionality tests
describe('RNG Engine', () => {
  test('generates valid 200-bit trials')
  test('maintains precise 1-second timing')
  test('handles continuous operation')
  test('recovers from errors gracefully')
})

describe('Statistical Analysis', () => {
  test('calculates network variance correctly')
  test('produces accurate z-scores')
  test('handles edge cases properly')
  test('matches published GCP results')
})
```

**Integration Testing** (`tests/integration/`):

- Database operations with RNG engine
- Real-time UI updates with data flow
- Session management end-to-end
- Continuous monitoring operation
- Export/import functionality

**End-to-End Testing** (`tests/e2e/`):

- Complete session workflow
- Continuous monitoring setup
- Data analysis and reporting
- Calibration procedures
- Error recovery scenarios

### 2. **Performance Optimization** (`src/performance/`)

**PerformanceProfiler.tsx** - System performance monitoring:

```typescript
class PerformanceProfiler {
  async profileRNGGeneration(): Promise<RNGPerformanceReport>
  async profileDatabaseOperations(): Promise<DatabasePerformanceReport>
  async profileUIRendering(): Promise<UIPerformanceReport>
  async profileStatisticalCalculations(): Promise<StatsPerformanceReport>
  async identifyBottlenecks(): Promise<BottleneckReport>
}
```

**MemoryManager.tsx** - Memory optimization:

- Garbage collection optimization
- Memory leak detection and prevention
- Large dataset streaming
- Buffer management
- Cache optimization

**DatabaseOptimizer.tsx** - Database performance tuning:

- Query optimization
- Index tuning
- Batch operation optimization
- Connection pooling
- Storage efficiency

### 3. **User Experience Enhancements** (`src/renderer/ux/`)

**OnboardingSystem.tsx** - First-time user experience:

```typescript
interface OnboardingFlow {
  welcome: WelcomeScreen;
  conceptExplanation: ConceptTutorial;
  firstSession: GuidedSession;
  dataInterpretation: ResultsEducation;
  bestPractices: UsageGuidance;
}
```

**HelpSystem.tsx** - Comprehensive help and guidance:

- Interactive tutorials
- Context-sensitive help
- Video tutorials
- Troubleshooting guides
- FAQ system

**AccessibilityImprovements.tsx** - Accessibility enhancements:

- Screen reader optimization
- Keyboard navigation improvements
- High contrast themes
- Font size customization
- Color blind accessibility

### 4. **Error Handling and Recovery** (`src/core/error-handling/`)

**ErrorHandler.tsx** - Comprehensive error management:

```typescript
class ErrorHandler {
  async handleRNGError(error: RNGError): Promise<RecoveryAction>
  async handleDatabaseError(error: DatabaseError): Promise<RecoveryAction>
  async handleUIError(error: UIError): Promise<RecoveryAction>
  async handleSystemError(error: SystemError): Promise<RecoveryAction>
  async generateErrorReport(error: Error): Promise<ErrorReport>
}
```

**RecoverySystem.tsx** - Automatic error recovery:

- Graceful degradation strategies
- Automatic retry mechanisms
- Data backup and restoration
- Session recovery procedures
- System state restoration

**ErrorReporting.tsx** - Error reporting and analytics:

- Automated error reporting
- Error categorization and analysis
- Performance impact assessment
- User impact measurement
- Improvement prioritization

### 5. **Documentation System** (`docs/`)

**UserManual.tsx** - Comprehensive user documentation:

```typescript
interface UserDocumentation {
  quickStart: QuickStartGuide;
  userGuide: DetailedUserGuide;
  scientificBackground: ScientificExplanation;
  troubleshooting: TroubleshootingGuide;
  faq: FrequentlyAskedQuestions;
}
```

**DeveloperDocumentation** (`docs/development/`):

- API documentation
- Architecture overview
- Database schema documentation
- Statistical methods documentation
- Contributing guidelines

**ScientificDocumentation** (`docs/scientific/`):

- Methodology explanation
- Statistical procedures
- Validation protocols
- Research guidelines
- Publication standards

### 6. **Security and Privacy** (`src/security/`)

**SecurityManager.tsx** - Data protection and privacy:

```typescript
class SecurityManager {
  async encryptSensitiveData(data: SensitiveData): Promise<EncryptedData>
  async validateDataIntegrity(data: UserData): Promise<IntegrityResult>
  async auditDataAccess(operation: DataOperation): Promise<AuditEntry>
  async anonymizeExportData(data: ExportData): Promise<AnonymizedData>
}
```

**PrivacyController.tsx** - Privacy compliance:

- Data minimization practices
- User consent management
- Data retention policies
- Export anonymization
- GDPR compliance features

### 7. **Configuration and Customization** (`src/config/`)

**SettingsManager.tsx** - Advanced configuration:

```typescript
interface AdvancedSettings {
  experimental: ExperimentalSettings;
  performance: PerformanceSettings;
  ui: UICustomization;
  statistical: StatisticalPreferences;
  export: ExportSettings;
  calibration: CalibrationSettings;
}
```

**ThemeCustomization.tsx** - Theme and appearance:

- Custom color schemes
- Layout preferences
- Chart styling options
- Accessibility themes
- Export styling

**AdvancedPreferences.tsx** - Power user features:

- Custom statistical parameters
- Advanced filtering options
- Experimental features toggle
- Developer mode options
- Debug settings

### 8. **Distribution and Deployment** (`build/`)

**BuildSystem** - Application packaging:

```typescript
interface BuildConfiguration {
  platform: 'mac' | 'windows' | 'linux';
  architecture: 'x64' | 'arm64' | 'universal';
  distribution: 'appstore' | 'standalone' | 'enterprise';
  signing: CodeSigningConfig;
  updater: AutoUpdateConfig;
}
```

**InstallerBuilder.tsx** - Installation package creation:

- Signed application packages
- Installation wizards
- Dependency management
- Uninstall procedures
- Update mechanisms

**UpdateSystem.tsx** - Automatic update functionality:

- Background update checking
- Incremental updates
- Rollback capability
- Update notifications
- Version management

### 9. **Quality Assurance** (`qa/`)

**QualityAssurance.tsx** - Final quality validation:

```typescript
class QualityAssurance {
  async runFullTestSuite(): Promise<TestSuiteResult>
  async validateScientificAccuracy(): Promise<AccuracyReport>
  async performUsabilityTesting(): Promise<UsabilityReport>
  async validatePerformanceTargets(): Promise<PerformanceReport>
  async generateQualityReport(): Promise<QualityReport>
}
```

**BetaTestingSupport.tsx** - Beta testing infrastructure:

- Beta user management
- Feedback collection system
- Bug reporting integration
- Feature request tracking
- Usage analytics

### 10. **Launch Preparation** (`launch/`)

**LaunchChecklist.tsx** - Pre-launch validation:

```typescript
interface LaunchChecklist {
  technicalValidation: TechnicalChecklistItem[];
  scientificValidation: ScientificChecklistItem[];
  userExperience: UXChecklistItem[];
  documentation: DocumentationChecklistItem[];
  legal: LegalChecklistItem[];
  distribution: DistributionChecklistItem[];
}
```

**UserTraining.tsx** - User education materials:

- Interactive tutorials
- Video training series
- Webinar materials
- User community setup
- Support infrastructure

### **Final Quality Targets:**

**Performance Targets:**

- App startup time: < 3 seconds
- RNG generation: Exactly 1 trial/second ±1ms
- UI responsiveness: < 100ms interaction response
- Memory usage: < 500MB during normal operation
- Database queries: < 50ms for typical operations

**Reliability Targets:**

- 99.9% uptime during continuous operation
- Zero data loss during normal operation
- Graceful recovery from all error conditions
- Successful operation for 30+ days continuous
- Accurate statistical calculations (validated against known datasets)

**User Experience Targets:**

- First-time users can complete a session within 10 minutes
- All major functions accessible within 3 clicks
- Clear statistical result interpretation
- Comprehensive help available for all features
- Accessible to users with disabilities

### **Scientific Validation:**

- **Statistical Accuracy**: All calculations validated against published results
- **Methodology Compliance**: Exact replication of PEAR/GCP methods
- **Reproducibility**: All analyses can be exactly replicated
- **Documentation**: Publication-ready methodology documentation
- **Peer Review**: Ready for scientific peer review

### **Distribution Readiness:**

- **Code Signing**: All executables properly signed
- **Installation**: Clean installation and uninstallation
- **Updates**: Reliable automatic update system
- **Support**: Comprehensive user support system
- **Legal**: All legal requirements satisfied

Reply with "Phase 10 Complete - Application Ready for Distribution" and provide a final summary of all implemented features, performance metrics, and validation results.

---

**END OF ALL PHASE PROMPTS**

These comprehensive prompts will guide Cursor through the complete development of your RNG consciousness experiment application, maintaining scientific rigor while creating a professional, user-friendly tool for personal consciousness research.
