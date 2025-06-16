/**
 * RNG Engine Module - Re-export from core rng-engine
 * This module provides the RNGEngine class for the core/rng path structure
 */

// Re-export the RNGEngine and related functionality from the main rng-engine module
export {
    RNGEngine,
    createRNGEngine,
    testRNGQuality,
    verifyCryptoSupport
} from '../rng-engine';

// Re-export types that may be needed
export type {
    RNGTrial,
    CalibrationResult,
    EngineStatus,
    RNGConfig,
    ExperimentMode,
    IntentionType
} from '../../shared/types';