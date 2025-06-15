/**
 * Data validation functions for RNG consciousness experiments
 * Ensures data integrity and consistency across all experiment operations
 */

import {
    RNGTrial,
    ExperimentSession,
    StatisticalResult,
    ValidationResult,
    IntentionType,
    SessionStatus
} from '../shared/types';
import { getHighPrecisionTimestamp } from './time-manager';

/**
 * Validate a single RNG trial for data integrity
 */
export function validateRNGTrial(trial: RNGTrial): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate trial value range (200-bit sum should be 0-200)
    if (trial.trialValue < 0 || trial.trialValue > 200) {
        errors.push(`Trial value ${trial.trialValue} is outside valid range (0-200)`);
    }

    // Validate trial value is integer
    if (!Number.isInteger(trial.trialValue)) {
        errors.push(`Trial value ${trial.trialValue} must be an integer`);
    }

    // Validate timestamp
    if (!(trial.timestamp instanceof Date) || isNaN(trial.timestamp.getTime())) {
        errors.push('Invalid timestamp');
    } else {
        // Check if timestamp is in the future
        const now = getHighPrecisionTimestamp();
        if (trial.timestamp.getTime() > now.getTime() + 1000) { // Allow 1 second tolerance
            warnings.push('Trial timestamp is in the future');
        }

        // Check if timestamp is too old (more than 1 year)
        const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        if (trial.timestamp.getTime() < oneYearAgo.getTime()) {
            warnings.push('Trial timestamp is more than 1 year old');
        }
    }

    // Validate session ID format (should be UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(trial.sessionId)) {
        errors.push('Session ID is not a valid UUID');
    }

    // Validate experiment mode
    if (!['session', 'continuous'].includes(trial.experimentMode)) {
        errors.push(`Invalid experiment mode: ${trial.experimentMode}`);
    }

    // Validate intention type
    if (trial.intention !== null && !['high', 'low', 'baseline'].includes(trial.intention)) {
        errors.push(`Invalid intention type: ${trial.intention}`);
    }

    // Validate trial number
    if (trial.trialNumber < 1 || !Number.isInteger(trial.trialNumber)) {
        errors.push(`Trial number must be a positive integer, got: ${trial.trialNumber}`);
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings,
        validatedAt: getHighPrecisionTimestamp(),
        validationType: 'trial'
    };
}

/**
 * Validate experiment session data
 */
export function validateExperimentSession(session: ExperimentSession): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate session ID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(session.id)) {
        errors.push('Session ID is not a valid UUID');
    }

    // Validate timestamps
    if (!(session.startTime instanceof Date) || isNaN(session.startTime.getTime())) {
        errors.push('Invalid start time');
    }

    if (session.endTime !== null) {
        if (!(session.endTime instanceof Date) || isNaN(session.endTime.getTime())) {
            errors.push('Invalid end time');
        } else if (session.startTime && session.endTime.getTime() <= session.startTime.getTime()) {
            errors.push('End time must be after start time');
        }
    }

    // Validate intention type
    if (session.intention !== null && !['high', 'low', 'baseline'].includes(session.intention)) {
        errors.push(`Invalid intention type: ${session.intention}`);
    }

    // Validate target trials
    if (session.targetTrials < 1 || !Number.isInteger(session.targetTrials)) {
        errors.push(`Target trials must be a positive integer, got: ${session.targetTrials}`);
    }

    if (session.targetTrials > 86400) { // More than 24 hours at 1 trial/second
        warnings.push('Target trials exceeds 24 hours of continuous operation');
    }

    // Validate session status
    if (!['running', 'completed', 'stopped'].includes(session.status)) {
        errors.push(`Invalid session status: ${session.status}`);
    }

    // Validate duration if provided
    if (session.duration !== undefined) {
        if (session.duration < 0) {
            errors.push('Session duration cannot be negative');
        }

        if (session.duration > 86400000) { // More than 24 hours
            warnings.push('Session duration exceeds 24 hours');
        }
    }

    // Validate participant ID format if provided
    if (session.participantId !== undefined && session.participantId.length === 0) {
        warnings.push('Participant ID is empty');
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings,
        validatedAt: getHighPrecisionTimestamp(),
        validationType: 'session'
    };
}

/**
 * Validate statistical result data
 */
export function validateStatisticalResult(result: StatisticalResult): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate trial count
    if (result.trialCount < 0 || !Number.isInteger(result.trialCount)) {
        errors.push(`Trial count must be a non-negative integer, got: ${result.trialCount}`);
    }

    // Validate mean (should be between 0 and 200 for 200-bit trials)
    if (result.mean < 0 || result.mean > 200) {
        errors.push(`Mean ${result.mean} is outside valid range (0-200)`);
    }

    // Validate expected mean (should be 100 for 200-bit trials)
    if (Math.abs(result.expectedMean - 100) > 0.01) {
        errors.push(`Expected mean should be 100 for 200-bit trials, got: ${result.expectedMean}`);
    }

    // Validate variance (must be non-negative)
    if (result.variance < 0) {
        errors.push(`Variance cannot be negative, got: ${result.variance}`);
    }

    // Validate standard deviation (must be non-negative and should be sqrt of variance)
    if (result.standardDeviation < 0) {
        errors.push(`Standard deviation cannot be negative, got: ${result.standardDeviation}`);
    }

    if (result.variance > 0 && Math.abs(result.standardDeviation - Math.sqrt(result.variance)) > 0.01) {
        errors.push('Standard deviation should equal square root of variance');
    }

    // Validate p-value (should be between 0 and 1)
    if (result.pValue < 0 || result.pValue > 1) {
        errors.push(`P-value must be between 0 and 1, got: ${result.pValue}`);
    }

    // Validate z-score (should be finite)
    if (!isFinite(result.zScore)) {
        errors.push('Z-score must be finite');
    }

    // Validate cumulative deviation array
    if (!Array.isArray(result.cumulativeDeviation)) {
        errors.push('Cumulative deviation must be an array');
    } else if (result.cumulativeDeviation.length !== result.trialCount) {
        errors.push(`Cumulative deviation array length (${result.cumulativeDeviation.length}) does not match trial count (${result.trialCount})`);
    }

    // Validate network variance if provided
    if (result.networkVariance !== undefined) {
        if (result.networkVariance < 0) {
            errors.push('Network variance cannot be negative');
        }
    }

    // Validate Stouffer Z if provided
    if (result.stoufferZ !== undefined && !isFinite(result.stoufferZ)) {
        errors.push('Stouffer Z must be finite');
    }

    // Validate timestamps
    if (!(result.calculatedAt instanceof Date) || isNaN(result.calculatedAt.getTime())) {
        errors.push('Invalid calculation timestamp');
    }

    if (!(result.dataRange.startTime instanceof Date) || isNaN(result.dataRange.startTime.getTime())) {
        errors.push('Invalid data range start time');
    }

    if (!(result.dataRange.endTime instanceof Date) || isNaN(result.dataRange.endTime.getTime())) {
        errors.push('Invalid data range end time');
    }

    if (result.dataRange.endTime.getTime() < result.dataRange.startTime.getTime()) {
        errors.push('Data range end time must be after start time');
    }

    // Statistical sanity checks
    if (result.trialCount > 0) {
        // For large samples, mean should be close to expected mean
        if (result.trialCount > 1000 && Math.abs(result.mean - result.expectedMean) > 5) {
            warnings.push('Large sample mean deviates significantly from expected mean');
        }

        // Z-score should be reasonable for the sample size
        const maxExpectedZ = 3 * Math.sqrt(Math.log(result.trialCount));
        if (Math.abs(result.zScore) > maxExpectedZ) {
            warnings.push('Z-score is unusually large for sample size');
        }
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings,
        validatedAt: getHighPrecisionTimestamp(),
        validationType: 'statistics'
    };
}

/**
 * Validate timing consistency across multiple trials
 */
export function validateTimingConsistency(trials: RNGTrial[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (trials.length < 2) {
        return {
            isValid: true,
            errors: [],
            warnings: ['Need at least 2 trials for timing validation'],
            validatedAt: getHighPrecisionTimestamp(),
            validationType: 'timing'
        };
    }

    // Sort trials by timestamp to ensure chronological order
    const sortedTrials = [...trials].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    const expectedInterval = 1000; // 1 second in milliseconds
    const toleranceMs = 100; // 100ms tolerance
    let significantErrors = 0;
    let totalError = 0;

    for (let i = 1; i < sortedTrials.length; i++) {
        const currentTrial = sortedTrials[i];
        const previousTrial = sortedTrials[i - 1];

        const actualInterval = currentTrial.timestamp.getTime() - previousTrial.timestamp.getTime();
        const error = Math.abs(actualInterval - expectedInterval);

        totalError += error;

        if (error > toleranceMs) {
            significantErrors++;

            if (error > 1000) { // More than 1 second off
                errors.push(`Significant timing error at trial ${currentTrial.trialNumber}: ${error}ms deviation`);
            } else {
                warnings.push(`Timing error at trial ${currentTrial.trialNumber}: ${error}ms deviation`);
            }
        }

        // Check for duplicate timestamps
        if (actualInterval === 0) {
            errors.push(`Duplicate timestamp at trial ${currentTrial.trialNumber}`);
        }

        // Check for negative intervals (out of order)
        if (actualInterval < 0) {
            errors.push(`Trials out of chronological order at trial ${currentTrial.trialNumber}`);
        }
    }

    // Calculate timing statistics
    const averageError = totalError / (sortedTrials.length - 1);
    const errorRate = significantErrors / (sortedTrials.length - 1);

    if (errorRate > 0.1) { // More than 10% of intervals have significant errors
        errors.push(`High timing error rate: ${(errorRate * 100).toFixed(1)}%`);
    } else if (errorRate > 0.05) { // More than 5% of intervals have significant errors
        warnings.push(`Elevated timing error rate: ${(errorRate * 100).toFixed(1)}%`);
    }

    if (averageError > 50) { // Average error > 50ms
        warnings.push(`High average timing error: ${averageError.toFixed(1)}ms`);
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings,
        validatedAt: getHighPrecisionTimestamp(),
        validationType: 'timing'
    };
}

/**
 * Validate session coherence - ensure all trials belong to the session
 */
export function validateSessionCoherence(session: ExperimentSession, trials: RNGTrial[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if all trials belong to the session
    const orphanTrials = trials.filter(trial => trial.sessionId !== session.id);
    if (orphanTrials.length > 0) {
        errors.push(`${orphanTrials.length} trials do not belong to session ${session.id}`);
    }

    // Check trial count consistency
    const sessionTrials = trials.filter(trial => trial.sessionId === session.id);
    if (session.status === 'completed' && sessionTrials.length !== session.targetTrials) {
        warnings.push(`Completed session has ${sessionTrials.length} trials but target was ${session.targetTrials}`);
    }

    // Check trial numbering
    const trialNumbers = sessionTrials.map(trial => trial.trialNumber).sort((a, b) => a - b);
    for (let i = 0; i < trialNumbers.length; i++) {
        if (trialNumbers[i] !== i + 1) {
            errors.push(`Trial numbering gap or duplicate at position ${i + 1}`);
            break;
        }
    }

    // Check time consistency
    if (sessionTrials.length > 0) {
        const trialTimes = sessionTrials.map(trial => trial.timestamp.getTime());
        const minTrialTime = Math.min(...trialTimes);
        const maxTrialTime = Math.max(...trialTimes);

        if (minTrialTime < session.startTime.getTime()) {
            errors.push('Some trials have timestamps before session start time');
        }

        if (session.endTime && maxTrialTime > session.endTime.getTime()) {
            errors.push('Some trials have timestamps after session end time');
        }
    }

    // Check intention consistency
    const inconsistentIntentions = sessionTrials.filter(trial => trial.intention !== session.intention);
    if (inconsistentIntentions.length > 0) {
        warnings.push(`${inconsistentIntentions.length} trials have different intention than session`);
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings,
        validatedAt: getHighPrecisionTimestamp(),
        validationType: 'session'
    };
}

/**
 * Validate data integrity across multiple sessions
 */
export function validateDataIntegrity(trials: RNGTrial[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (trials.length === 0) {
        return {
            isValid: true,
            errors: [],
            warnings: ['No trials to validate'],
            validatedAt: getHighPrecisionTimestamp(),
            validationType: 'trial'
        };
    }

    // Check for duplicate trials
    const trialKeys = new Set<string>();
    const duplicates: RNGTrial[] = [];

    trials.forEach(trial => {
        const key = `${trial.sessionId}-${trial.trialNumber}-${trial.timestamp.getTime()}`;
        if (trialKeys.has(key)) {
            duplicates.push(trial);
        } else {
            trialKeys.add(key);
        }
    });

    if (duplicates.length > 0) {
        errors.push(`Found ${duplicates.length} duplicate trials`);
    }

    // Check for impossible statistical patterns
    const values = trials.map(trial => trial.trialValue);
    const uniqueValues = new Set(values);

    if (uniqueValues.size === 1 && trials.length > 10) {
        errors.push('All trials have identical values - this is statistically impossible');
    }

    // Check for perfect alternating patterns
    if (trials.length > 10) {
        let perfectAlternation = true;
        for (let i = 2; i < Math.min(20, trials.length); i++) {
            if (trials[i].trialValue !== trials[i - 2].trialValue) {
                perfectAlternation = false;
                break;
            }
        }
        if (perfectAlternation) {
            errors.push('Detected perfect alternating pattern - this suggests non-random generation');
        }
    }

    // Check for excessive clustering
    if (trials.length > 100) {
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const withinOneStdDev = values.filter(val => Math.abs(val - mean) <= 7.071).length;
        const expectedRatio = 0.68; // ~68% should be within 1 std dev for normal distribution
        const actualRatio = withinOneStdDev / values.length;

        if (actualRatio > 0.8) {
            warnings.push('Values are clustered more tightly than expected for random data');
        } else if (actualRatio < 0.5) {
            warnings.push('Values are more dispersed than expected for random data');
        }
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings,
        validatedAt: getHighPrecisionTimestamp(),
        validationType: 'trial'
    };
}

/**
 * Comprehensive validation of all data components
 */
export function validateAll(
    sessions: ExperimentSession[],
    trials: RNGTrial[],
    statistics?: StatisticalResult[]
): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate each session
    sessions.forEach((session, index) => {
        const sessionValidation = validateExperimentSession(session);
        if (!sessionValidation.isValid) {
            errors.push(`Session ${index + 1}: ${sessionValidation.errors.join(', ')}`);
        }
        warnings.push(...sessionValidation.warnings.map(w => `Session ${index + 1}: ${w}`));
    });

    // Validate each trial
    trials.forEach((trial, index) => {
        const trialValidation = validateRNGTrial(trial);
        if (!trialValidation.isValid) {
            errors.push(`Trial ${index + 1}: ${trialValidation.errors.join(', ')}`);
        }
        warnings.push(...trialValidation.warnings.map(w => `Trial ${index + 1}: ${w}`));
    });

    // Validate statistics if provided
    if (statistics) {
        statistics.forEach((stat, index) => {
            const statValidation = validateStatisticalResult(stat);
            if (!statValidation.isValid) {
                errors.push(`Statistics ${index + 1}: ${statValidation.errors.join(', ')}`);
            }
            warnings.push(...statValidation.warnings.map(w => `Statistics ${index + 1}: ${w}`));
        });
    }

    // Validate data integrity
    const integrityValidation = validateDataIntegrity(trials);
    if (!integrityValidation.isValid) {
        errors.push(`Data integrity: ${integrityValidation.errors.join(', ')}`);
    }
    warnings.push(...integrityValidation.warnings.map(w => `Data integrity: ${w}`));

    // Validate timing consistency
    const timingValidation = validateTimingConsistency(trials);
    if (!timingValidation.isValid) {
        errors.push(`Timing: ${timingValidation.errors.join(', ')}`);
    }
    warnings.push(...timingValidation.warnings.map(w => `Timing: ${w}`));

    return {
        isValid: errors.length === 0,
        errors,
        warnings,
        validatedAt: getHighPrecisionTimestamp(),
        validationType: 'session'
    };
}