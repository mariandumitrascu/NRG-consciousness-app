export interface NetworkVarianceResult {
    netvar: number;              // The network variance value (sum of Z²)
    degreesOfFreedom: number;    // For chi-square calculation
    chisquare: number;           // Chi-square statistic
    probability: number;         // P-value
    significance: 'none' | 'marginal' | 'significant' | 'highly_significant';
    confidenceInterval: [number, number];
    expectedNetvar: number;      // Expected value under null hypothesis
    standardError: number;       // Standard error of netvar
}

export interface DeviceVarianceResult {
    deviceVariance: number;      // Sum of individual device Z²
    individualZScores: number[]; // Z-scores for each device/trial
    probability: number;         // P-value
    significance: 'none' | 'marginal' | 'significant' | 'highly_significant';
    degreesOfFreedom: number;
}

export interface CumulativeResult {
    points: CumulativePoint[];   // For plotting cumulative deviation
    finalDeviation: number;      // End cumulative deviation
    maxDeviation: number;        // Peak positive deviation
    minDeviation: number;        // Peak negative deviation
    crossings: number;           // Times crossed zero
    excursions: ExcursionPeriod[]; // Periods of sustained deviation
}

export interface CumulativePoint {
    trialIndex: number;
    timestamp: Date;
    cumulativeDeviation: number;
    runningMean: number;
    zScore: number;
    runningVariance: number;
}

export interface ExcursionPeriod {
    startIndex: number;
    endIndex: number;
    startTime: Date;
    endTime: Date;
    maxDeviation: number;
    duration: number; // milliseconds
    significance: number; // p-value for this excursion
}

export interface ZScoreResult {
    zScore: number;
    pValue: number;               // Two-tailed p-value
    pValueOneTailed: number;      // One-tailed p-value
    confidenceInterval: [number, number];
    standardError: number;
    effectSize: number;
    sampleSize: number;
    significance: 'none' | 'marginal' | 'significant' | 'highly_significant';
}

export interface EffectSizeResult {
    cohensD: number;             // Cohen's d effect size
    hedgesG: number;             // Hedges' g (bias-corrected)
    pointBiserial: number;       // Point-biserial correlation
    confidenceInterval: [number, number];
    interpretation: 'negligible' | 'small' | 'medium' | 'large';
    practicalSignificance: boolean;
}

export interface RunningStats {
    count: number;
    sum: number;
    sumOfSquares: number;
    mean: number;
    variance: number;
    standardDeviation: number;
    cumulativeDeviation: number;
    lastUpdated: Date;
    minValue: number;
    maxValue: number;
}

export interface SignificanceResult {
    pValue: number;
    zScore: number;
    effectSize: number;
    confidenceLevel: number;
    interpretation: 'random' | 'marginally_significant' | 'significant' | 'highly_significant';
    sampleSize: number;
    powerAnalysis: PowerAnalysis;
}

export interface PowerAnalysis {
    observedPower: number;       // Power to detect observed effect
    requiredSampleSize: number;  // Sample size needed for 80% power
    minimumDetectableEffect: number; // Minimum effect detectable with current sample
}

export interface TrendResult {
    slope: number;               // Linear trend slope
    slopeSignificance: number;   // P-value for slope
    correlation: number;         // Correlation with time
    trendDirection: 'increasing' | 'decreasing' | 'stable';
    changePoints: ChangePoint[]; // Detected change points
}

export interface ChangePoint {
    index: number;
    timestamp: Date;
    confidence: number;          // Confidence in change point
    magnitudeChange: number;     // Size of change
}

export interface QualityAssessment {
    randomnessScore: number;     // 0-1, higher = more random
    biasDetected: boolean;
    patterns: PatternDetection[];
    dataIntegrity: DataIntegrityCheck;
    recommendations: string[];
}

export interface PatternDetection {
    type: 'runs' | 'cycles' | 'autocorrelation' | 'frequency_bias';
    severity: 'low' | 'medium' | 'high';
    description: string;
    pValue: number;
}

export interface DataIntegrityCheck {
    missingData: number;         // Percentage of missing data
    duplicates: number;          // Number of duplicate trials
    temporalGaps: TemporalGap[]; // Gaps in data collection
    outliers: OutlierDetection;
}

export interface TemporalGap {
    startTime: Date;
    endTime: Date;
    duration: number; // milliseconds
    expectedTrials: number;
    actualTrials: number;
}

export interface OutlierDetection {
    count: number;
    indices: number[];
    method: 'iqr' | 'zscore' | 'modified_zscore';
    threshold: number;
}

export interface RandomnessTestResult {
    tests: RandomnessTest[];
    overallScore: number;        // Combined randomness score 0-1
    isRandomAtLevel: boolean;    // Random at 95% confidence
    recommendations: string[];
}

export interface RandomnessTest {
    name: string;
    statistic: number;
    pValue: number;
    passed: boolean;
    description: string;
}

export interface CalibrationAnalysis {
    baselineMean: number;
    baselineStd: number;
    currentMean: number;
    currentStd: number;
    drift: number;               // Deviation from baseline
    driftSignificance: number;   // P-value for drift
    recalibrationNeeded: boolean;
}

export interface DriftAnalysis {
    driftRate: number;           // Units per day
    driftSignificance: number;   // P-value for drift
    trendDirection: 'positive' | 'negative' | 'stable';
    projectedDrift: number;      // Projected drift in next 30 days
    maintenanceRecommended: boolean;
}

export interface ComparisonResult {
    meanDifference: number;
    standardError: number;
    tStatistic: number;
    pValue: number;
    effectSize: number;
    confidenceInterval: [number, number];
    significantDifference: boolean;
}

export interface SignificantPeriod {
    startTime: Date;
    endTime: Date;
    duration: number; // milliseconds
    significance: number; // p-value
    effect: 'positive' | 'negative';
    magnitude: number; // effect size
    confidence: number; // confidence level
}

export interface CorrelationResult {
    correlation: number;
    pValue: number;
    confidenceInterval: [number, number];
    type: 'pearson' | 'spearman' | 'kendall';
    interpretation: string;
    scatterplotData: CorrelationPoint[];
}

export interface CorrelationPoint {
    x: number;
    y: number;
    timestamp: Date;
    label?: string;
}

export interface TemporalPattern {
    dailyPattern: HourlyStats[];
    weeklyPattern: DailyStats[];
    seasonalTrend: SeasonalTrend;
    significantPatterns: PatternSignificance[];
}

export interface HourlyStats {
    hour: number;
    mean: number;
    stdDev: number;
    count: number;
    significance: number; // vs overall mean
}

export interface DailyStats {
    dayOfWeek: number;
    mean: number;
    stdDev: number;
    count: number;
    significance: number;
}

export interface SeasonalTrend {
    slope: number;
    seasonality: number; // 0-1, higher = more seasonal
    peakMonth: number;
    significance: number;
}

export interface PatternSignificance {
    pattern: string;
    strength: number; // 0-1
    pValue: number;
    description: string;
}

export interface AnomalousEvent {
    startTime: Date;
    endTime: Date;
    duration: number;
    severity: 'low' | 'medium' | 'high' | 'extreme';
    type: 'deviation' | 'pattern' | 'trend_change' | 'data_quality';
    description: string;
    confidence: number; // 0-1
}

export interface ValidationResult {
    valid: boolean;
    warnings: string[];
    recommendations: string[];
    statisticValue: number;
    pValue: number;
    testName: string;
}

export interface CrossValidationResult {
    methods: string[];
    results: { [method: string]: number }; // p-values from different methods
    consistency: number; // 0-1, higher = more consistent
    recommendedMethod: string;
    warnings: string[];
}

export interface ArtifactWarning {
    type: 'computational' | 'statistical' | 'data_quality';
    severity: 'low' | 'medium' | 'high';
    description: string;
    recommendation: string;
}

// Utility types for analysis parameters
export interface AnalysisParameters {
    windowSize?: number;         // For moving window analyses
    confidenceLevel?: number;    // Default 0.95
    multipleComparisons?: 'none' | 'bonferroni' | 'bh' | 'holm';
    trendMethod?: 'linear' | 'polynomial' | 'spline';
    outlierHandling?: 'include' | 'exclude' | 'winsorize';
}

export interface IntentionPeriod {
    id: string;
    startTime: Date;
    endTime: Date;
    type: 'focus' | 'meditation' | 'intention' | 'control';
    description?: string;
    operator?: string;
    expected?: 'high' | 'low' | 'none';
}

// Enums for better type safety
export enum StatisticalSignificance {
    NONE = 'none',
    MARGINAL = 'marginal',        // p < 0.1
    SIGNIFICANT = 'significant',   // p < 0.05
    HIGHLY_SIGNIFICANT = 'highly_significant' // p < 0.01
}

export enum EffectSizeInterpretation {
    NEGLIGIBLE = 'negligible',    // d < 0.2
    SMALL = 'small',             // 0.2 <= d < 0.5
    MEDIUM = 'medium',           // 0.5 <= d < 0.8
    LARGE = 'large'              // d >= 0.8
}