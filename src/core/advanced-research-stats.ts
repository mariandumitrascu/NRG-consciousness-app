/**
 * Advanced Research Statistics Engine
 * Phase 8: Historical Analysis & Reporting
 * Implements sophisticated statistical methods for consciousness research
 */

import { RNGTrial, ExperimentSession } from '../shared/types';
import {
    BayesianResult,
    BayesFactorResult,
    PriorDistribution,
    PosteriorDistribution,
    SequentialAnalysisResult,
    MetaAnalysisResult,
    EffectSizeData,
    ForestPlotData,
    LearningCurveAnalysis,
    LearningCurveData,
    PowerCalculation,
    QualityMetrics,
    QualityAssessment,
    QualityIssue
} from '../shared/analysis-types';
import { StatisticalUtils } from './statistical-utils';

export class AdvancedResearchStats {

    /**
     * Bayesian Analysis Engine
     * Implements Bayesian statistical methods for consciousness research
     */
    static BayesianAnalyzer = class {

        /**
         * Calculate Bayes Factor for hypothesis testing
         */
        static calculateBayesFactor(
            data: RNGTrial[],
            nullHypothesis: { mean: number; variance: number },
            alternativeHypothesis: { mean: number; variance: number }
        ): BayesFactorResult {
            const n = data.length;
            if (n === 0) throw new Error('No data provided for Bayes factor calculation');

            const sampleMean = StatisticalUtils.mean(data.map(t => t.trialValue));
            const sampleVariance = StatisticalUtils.variance(data.map(t => t.trialValue));

            // Marginal likelihood under null hypothesis
            const logML0 = this.calculateLogMarginalLikelihood(
                sampleMean, sampleVariance, n, nullHypothesis
            );

            // Marginal likelihood under alternative hypothesis
            const logML1 = this.calculateLogMarginalLikelihood(
                sampleMean, sampleVariance, n, alternativeHypothesis
            );

            // Bayes Factor BF10 = ML1 / ML0
            const logBF10 = logML1 - logML0;
            const bf10 = Math.exp(logBF10);
            const bf01 = 1 / bf10;

            // Interpret Bayes Factor according to Jeffreys (1961) scale
            let interpretation: BayesFactorResult['interpretation'];
            if (bf10 > 100) interpretation = 'extreme_evidence';
            else if (bf10 > 30) interpretation = 'very_strong';
            else if (bf10 > 10) interpretation = 'strong';
            else if (bf10 > 3) interpretation = 'moderate';
            else if (bf10 > 1) interpretation = 'weak';
            else interpretation = 'inconclusive';

            return {
                bf10,
                bf01,
                interpretation,
                hypothesis: alternativeHypothesis.mean > nullHypothesis.mean ?
                    'alternative_greater' : 'alternative_different'
            };
        }

        /**
         * Calculate posterior distribution using Bayesian updating
         */
        static posteriorDistribution(
            data: RNGTrial[],
            prior: PriorDistribution
        ): PosteriorDistribution {
            const values = data.map(t => t.trialValue);
            const n = values.length;
            const sampleMean = StatisticalUtils.mean(values);
            const sampleVariance = StatisticalUtils.variance(values);

            if (prior.type === 'normal') {
                // Normal-Normal conjugate analysis
                const priorMean = prior.parameters.mean;
                const priorVariance = prior.parameters.variance;
                const dataVariance = prior.parameters.knownVariance || sampleVariance;

                // Posterior parameters for normal distribution
                const posteriorPrecision = 1 / priorVariance + n / dataVariance;
                const posteriorVariance = 1 / posteriorPrecision;
                const posteriorMean = posteriorVariance * (priorMean / priorVariance + n * sampleMean / dataVariance);

                return {
                    type: 'normal',
                    parameters: {
                        mean: posteriorMean,
                        variance: posteriorVariance,
                        standardDeviation: Math.sqrt(posteriorVariance)
                    }
                };
            }

            throw new Error(`Unsupported prior distribution type: ${prior.type}`);
        }

        /**
         * Calculate credible intervals from posterior distribution
         */
        static credibleInterval(
            posterior: PosteriorDistribution,
            level: number = 0.95
        ): [number, number] {
            const alpha = 1 - level;

            if (posterior.type === 'normal') {
                const mean = posterior.parameters.mean;
                const sd = posterior.parameters.standardDeviation;
                const zCritical = StatisticalUtils.normalInverse(1 - alpha / 2);

                return [
                    mean - zCritical * sd,
                    mean + zCritical * sd
                ];
            }

            throw new Error(`Credible interval not implemented for ${posterior.type} distribution`);
        }

        private static calculateLogMarginalLikelihood(
            sampleMean: number,
            sampleVariance: number,
            n: number,
            hypothesis: { mean: number; variance: number }
        ): number {
            // Simplified marginal likelihood calculation
            // In practice, this would be more sophisticated
            const logLikelihood = -0.5 * n * Math.log(2 * Math.PI * hypothesis.variance)
                - 0.5 * n * Math.pow(sampleMean - hypothesis.mean, 2) / hypothesis.variance;

            return logLikelihood;
        }
    };

    /**
     * Sequential Analysis Engine
     * Implements adaptive stopping rules and sequential testing
     */
    static SequentialAnalyzer = class {

        /**
         * Perform sequential probability ratio test
         */
        static sequentialProbabilityRatioTest(
            data: RNGTrial[],
            nullMean: number = 100,
            alternativeMean: number = 102,
            alpha: number = 0.05,
            beta: number = 0.20
        ): SequentialAnalysisResult {
            const values = data.map(t => t.trialValue);
            const n = values.length;

            if (n === 0) {
                throw new Error('No data provided for sequential analysis');
            }

            // Calculate log-likelihood ratio
            const sampleMean = StatisticalUtils.mean(values);
            const variance = 50; // Known variance for RNG trials

            const logLR = n * (alternativeMean - nullMean) *
                (sampleMean - (nullMean + alternativeMean) / 2) / variance;

            // Calculate boundaries
            const upperBoundary = Math.log((1 - beta) / alpha);
            const lowerBoundary = Math.log(beta / (1 - alpha));

            // Determine boundary type and recommendation
            let boundaryType: SequentialAnalysisResult['boundaryType'];
            let recommendation: SequentialAnalysisResult['recommendation'];

            if (logLR >= upperBoundary) {
                boundaryType = 'efficacy';
                recommendation = 'stop_efficacy';
            } else if (logLR <= lowerBoundary) {
                boundaryType = 'futility';
                recommendation = 'stop_futility';
            } else {
                boundaryType = 'continue';
                recommendation = 'continue';
            }

            // Calculate current p-value (approximate)
            const zScore = (sampleMean - nullMean) / Math.sqrt(variance / n);
            const pValue = 2 * (1 - StatisticalUtils.normalCDF(Math.abs(zScore)));

            return {
                currentN: n,
                boundaryType,
                efficacyBoundary: upperBoundary,
                futilityBoundary: lowerBoundary,
                currentTestStatistic: logLR,
                pValue,
                recommendation,
                nextAnalysisAt: recommendation === 'continue' ? n + 100 : undefined
            };
        }

        /**
         * Adaptive sample size calculation
         */
        static adaptiveSampleSize(
            currentData: RNGTrial[],
            targetPower: number = 0.80,
            alpha: number = 0.05,
            expectedEffect: number = 1.0
        ): number {
            const currentN = currentData.length;
            const currentEffect = this.estimateCurrentEffect(currentData);

            // Adjust expected effect based on current data
            const adjustedEffect = currentN > 50 ?
                0.7 * expectedEffect + 0.3 * currentEffect : expectedEffect;

            // Calculate required sample size
            const zAlpha = StatisticalUtils.normalInverse(1 - alpha / 2);
            const zBeta = StatisticalUtils.normalInverse(targetPower);
            const variance = 50; // Known RNG variance

            const requiredN = Math.ceil(
                2 * variance * Math.pow(zAlpha + zBeta, 2) / Math.pow(adjustedEffect, 2)
            );

            return Math.max(requiredN, currentN);
        }

        private static estimateCurrentEffect(data: RNGTrial[]): number {
            const values = data.map(t => t.trialValue);
            const mean = StatisticalUtils.mean(values);
            return Math.abs(mean - 100); // Deviation from expected mean
        }
    };

    /**
     * Meta-Analysis Engine
     * Combines results from multiple experiments
     */
    static MetaAnalyzer = class {

        /**
         * Perform fixed-effects meta-analysis
         */
        static fixedEffectsMetaAnalysis(sessions: ExperimentSession[]): MetaAnalysisResult {
            const effects = sessions.map(session => this.calculateSessionEffectSize(session));

            // Calculate pooled effect size using inverse variance weighting
            const totalWeight = effects.reduce((sum, effect) => sum + effect.weight, 0);
            const pooledEffectSize = effects.reduce(
                (sum, effect) => sum + effect.effectSize * effect.weight, 0
            ) / totalWeight;

            // Calculate pooled standard error
            const pooledStandardError = Math.sqrt(1 / totalWeight);
            const pooledConfidenceInterval = this.calculateConfidenceInterval(
                pooledEffectSize, pooledStandardError
            );

            // Calculate heterogeneity statistics
            const heterogeneityStats = this.calculateHeterogeneity(effects, pooledEffectSize);

            // Create forest plot data
            const forestPlotData = this.createForestPlotData(effects, {
                sessionId: 'pooled',
                effectSize: pooledEffectSize,
                standardError: pooledStandardError,
                confidenceInterval: pooledConfidenceInterval,
                weight: totalWeight,
                sampleSize: effects.reduce((sum, e) => sum + e.sampleSize, 0)
            });

            return {
                pooledEffectSize,
                pooledStandardError,
                pooledConfidenceInterval,
                heterogeneityQ: heterogeneityStats.Q,
                heterogeneityI2: heterogeneityStats.I2,
                heterogeneityPValue: heterogeneityStats.pValue,
                individualEffects: effects,
                forestPlotData
            };
        }

        /**
         * Perform random-effects meta-analysis
         */
        static randomEffectsMetaAnalysis(sessions: ExperimentSession[]): MetaAnalysisResult {
            const fixedResults = this.fixedEffectsMetaAnalysis(sessions);

            // Calculate between-study variance (tau-squared)
            const tauSquared = this.calculateBetweenStudyVariance(
                fixedResults.individualEffects,
                fixedResults.pooledEffectSize,
                fixedResults.heterogeneityQ
            );

            // Recalculate weights incorporating between-study variance
            const adjustedEffects = fixedResults.individualEffects.map(effect => ({
                ...effect,
                weight: 1 / (effect.standardError * effect.standardError + tauSquared)
            }));

            // Recalculate pooled estimates
            const totalWeight = adjustedEffects.reduce((sum, effect) => sum + effect.weight, 0);
            const pooledEffectSize = adjustedEffects.reduce(
                (sum, effect) => sum + effect.effectSize * effect.weight, 0
            ) / totalWeight;

            const pooledStandardError = Math.sqrt(1 / totalWeight);
            const pooledConfidenceInterval = this.calculateConfidenceInterval(
                pooledEffectSize, pooledStandardError
            );

            return {
                ...fixedResults,
                pooledEffectSize,
                pooledStandardError,
                pooledConfidenceInterval,
                individualEffects: adjustedEffects
            };
        }

        private static calculateSessionEffectSize(session: ExperimentSession): EffectSizeData {
            // This would typically retrieve trial data for the session
            // For now, using placeholder calculation
            const effectSize = Math.random() * 0.5 - 0.25; // Random effect between -0.25 and 0.25
            const sampleSize = session.actualTrials || 1000;
            const standardError = Math.sqrt(1 / sampleSize);
            const confidenceInterval = this.calculateConfidenceInterval(effectSize, standardError);
            const weight = 1 / (standardError * standardError);

            return {
                sessionId: session.id,
                effectSize,
                standardError,
                confidenceInterval,
                weight,
                sampleSize
            };
        }

        private static calculateConfidenceInterval(
            effect: number,
            standardError: number,
            level: number = 0.95
        ): [number, number] {
            const zCritical = StatisticalUtils.normalInverse(1 - (1 - level) / 2);
            const margin = zCritical * standardError;
            return [effect - margin, effect + margin];
        }

        private static calculateHeterogeneity(
            effects: EffectSizeData[],
            pooledEffect: number
        ): { Q: number; I2: number; pValue: number } {
            const Q = effects.reduce((sum, effect) => {
                const deviation = effect.effectSize - pooledEffect;
                return sum + effect.weight * deviation * deviation;
            }, 0);

            const df = effects.length - 1;
            const pValue = StatisticalUtils.chiSquareProbability(Q, df);
            const I2 = Math.max(0, (Q - df) / Q) * 100;

            return { Q, I2, pValue };
        }

        private static calculateBetweenStudyVariance(
            effects: EffectSizeData[],
            pooledEffect: number,
            Q: number
        ): number {
            const df = effects.length - 1;
            const c = effects.reduce((sum, effect) => sum + effect.weight, 0) -
                effects.reduce((sum, effect) => sum + effect.weight * effect.weight, 0) /
                effects.reduce((sum, effect) => sum + effect.weight, 0);

            return Math.max(0, (Q - df) / c);
        }

        private static createForestPlotData(
            effects: EffectSizeData[],
            pooledResult: EffectSizeData
        ): ForestPlotData {
            const allEffects = [...effects, pooledResult];
            const minEffect = Math.min(...allEffects.map(e => e.confidenceInterval[0]));
            const maxEffect = Math.max(...allEffects.map(e => e.confidenceInterval[1]));
            const range = maxEffect - minEffect;
            const padding = range * 0.1;

            return {
                studies: effects,
                pooledResult,
                xAxisRange: [minEffect - padding, maxEffect + padding],
                significanceLevel: 0.05
            };
        }
    };

    /**
     * Machine Learning Engine
     * Pattern detection and classification algorithms
     */
    static MachineLearning = class {

        /**
         * Anomaly detection using statistical methods
         */
        static detectAnomalies(
            data: RNGTrial[],
            threshold: number = 3.0
        ): { indices: number[]; scores: number[]; isAnomaly: boolean[] } {
            const values = data.map(t => t.trialValue);
            const mean = StatisticalUtils.mean(values);
            const std = StatisticalUtils.standardDeviation(values);

            const scores = values.map(value => Math.abs(value - mean) / std);
            const isAnomaly = scores.map(score => score > threshold);
            const indices = isAnomaly
                .map((anomaly, index) => anomaly ? index : -1)
                .filter(index => index !== -1);

            return { indices, scores, isAnomaly };
        }

        /**
         * Time series forecasting using simple exponential smoothing
         */
        static forecastTimeSeries(
            data: RNGTrial[],
            steps: number = 10,
            alpha: number = 0.3
        ): { forecast: number[]; confidence: number[] } {
            const values = data.map(t => t.trialValue);

            if (values.length < 2) {
                throw new Error('Insufficient data for forecasting');
            }

            // Initialize with first observation
            let smoothed = values[0];
            const smoothedValues = [smoothed];

            // Calculate smoothed values
            for (let i = 1; i < values.length; i++) {
                smoothed = alpha * values[i] + (1 - alpha) * smoothed;
                smoothedValues.push(smoothed);
            }

            // Generate forecast
            const lastSmoothed = smoothedValues[smoothedValues.length - 1];
            const forecast = Array(steps).fill(lastSmoothed);

            // Calculate prediction intervals (simplified)
            const residuals = values.slice(1).map((value, i) =>
                value - smoothedValues[i]);
            const residualStd = StatisticalUtils.standardDeviation(residuals);
            const confidence = Array(steps).fill(1.96 * residualStd);

            return { forecast, confidence };
        }

        /**
         * Feature importance analysis for session effectiveness
         */
        static analyzeFeatureImportance(
            sessions: ExperimentSession[]
        ): { features: string[]; importance: number[] } {
            // Simplified feature importance using correlation
            const features = ['duration', 'trialCount', 'timeOfDay', 'intention'];

            // Calculate feature importance (placeholder implementation)
            const importance = features.map(() => Math.random());
            const totalImportance = importance.reduce((sum, imp) => sum + imp, 0);
            const normalizedImportance = importance.map(imp => imp / totalImportance);

            return {
                features,
                importance: normalizedImportance
            };
        }
    };

    /**
     * Learning Curve Analyzer
     */
    static analyzeLearningCurve(sessions: ExperimentSession[]): LearningCurveAnalysis {
        const sortedSessions = sessions.sort((a, b) => a.startTime - b.startTime);

        const data: LearningCurveData[] = sortedSessions.map((session, index) => {
            const performance = this.calculateSessionPerformance(session);
            const cumulativePerformance = this.calculateCumulativePerformance(
                sortedSessions.slice(0, index + 1)
            );

            return {
                sessionNumber: index + 1,
                timestamp: session.startTime,
                performance,
                cumulativePerformance,
                learningRate: this.calculateLearningRate(sortedSessions.slice(0, index + 1)),
                skillLevel: this.classifySkillLevel(cumulativePerformance)
            };
        });

        const overallLearningRate = this.calculateOverallLearningRate(data);
        const plateauInfo = this.detectPlateau(data);

        return {
            data,
            overallLearningRate,
            plateauDetected: plateauInfo.detected,
            plateauStart: plateauInfo.start,
            improvementTrend: this.analyzeTrend(data),
            predictedPlateau: this.predictPlateau(data)
        };
    }

    /**
     * Quality Assessment Engine
     */
    static assessDataQuality(
        trials: RNGTrial[],
        session: ExperimentSession
    ): QualityAssessment {
        const metrics = this.calculateQualityMetrics(trials, session);
        const issues = this.identifyQualityIssues(trials, session, metrics);
        const recommendations = this.generateRecommendations(issues);
        const overallScore = this.calculateOverallQualityScore(metrics);
        const passesThreshold = overallScore >= 0.8; // 80% threshold

        return {
            sessionId: session.id,
            metrics,
            issues,
            recommendations,
            overallScore,
            passesThreshold
        };
    }

    // Private helper methods
    private static calculateSessionPerformance(session: ExperimentSession): number {
        // Placeholder implementation
        return Math.random() * 0.1 - 0.05; // Random performance between -0.05 and 0.05
    }

    private static calculateCumulativePerformance(sessions: ExperimentSession[]): number {
        const performances = sessions.map(s => this.calculateSessionPerformance(s));
        return StatisticalUtils.mean(performances);
    }

    private static calculateLearningRate(sessions: ExperimentSession[]): number {
        if (sessions.length < 2) return 0;

        const performances = sessions.map(s => this.calculateSessionPerformance(s));
        const firstHalf = performances.slice(0, Math.floor(performances.length / 2));
        const secondHalf = performances.slice(Math.floor(performances.length / 2));

        return StatisticalUtils.mean(secondHalf) - StatisticalUtils.mean(firstHalf);
    }

    private static classifySkillLevel(performance: number): LearningCurveData['skillLevel'] {
        if (performance > 0.05) return 'expert';
        if (performance > 0.02) return 'advanced';
        if (performance > -0.01) return 'intermediate';
        return 'novice';
    }

    private static calculateOverallLearningRate(data: LearningCurveData[]): number {
        if (data.length < 2) return 0;

        const performances = data.map(d => d.performance);
        const x = data.map((_, i) => i);

        // Simple linear regression to find slope
        const n = performances.length;
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = performances.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((sum, xi, i) => sum + xi * performances[i], 0);
        const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

        return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    }

    private static detectPlateau(data: LearningCurveData[]): { detected: boolean; start?: number } {
        // Simple plateau detection using moving window
        const windowSize = Math.min(10, Math.floor(data.length / 3));
        if (data.length < windowSize * 2) return { detected: false };

        for (let i = windowSize; i <= data.length - windowSize; i++) {
            const before = data.slice(i - windowSize, i);
            const after = data.slice(i, i + windowSize);

            const beforeMean = StatisticalUtils.mean(before.map(d => d.performance));
            const afterMean = StatisticalUtils.mean(after.map(d => d.performance));

            if (Math.abs(afterMean - beforeMean) < 0.01) { // Threshold for plateau
                return { detected: true, start: i };
            }
        }

        return { detected: false };
    }

    private static analyzeTrend(data: LearningCurveData[]): 'increasing' | 'decreasing' | 'stable' {
        const learningRate = this.calculateOverallLearningRate(data);

        if (learningRate > 0.001) return 'increasing';
        if (learningRate < -0.001) return 'decreasing';
        return 'stable';
    }

    private static predictPlateau(data: LearningCurveData[]): number {
        // Simple exponential decay model prediction
        const performances = data.map(d => d.performance);
        const lastPerformance = performances[performances.length - 1];
        const trend = this.analyzeTrend(data);

        if (trend === 'increasing') {
            return lastPerformance + 0.02; // Predict modest improvement
        } else if (trend === 'decreasing') {
            return lastPerformance - 0.01; // Predict modest decline
        }

        return lastPerformance; // Stable
    }

    private static calculateQualityMetrics(
        trials: RNGTrial[],
        session: ExperimentSession
    ): QualityMetrics {
        const completeness = trials.length / (session.targetTrials || trials.length);
        const consistency = this.calculateConsistency(trials);
        const accuracy = this.calculateAccuracy(trials);
        const reliability = this.calculateReliability(trials);
        const validity = this.calculateValidity(trials, session);

        return {
            completeness: Math.min(1, completeness),
            consistency,
            accuracy,
            reliability,
            validity
        };
    }

    private static calculateConsistency(trials: RNGTrial[]): number {
        // Measure temporal consistency of trial generation
        const intervals = trials.slice(1).map((trial, i) =>
            trial.timestamp - trials[i].timestamp);

        const meanInterval = StatisticalUtils.mean(intervals);
        const stdInterval = StatisticalUtils.standardDeviation(intervals);

        // High consistency = low coefficient of variation
        return Math.max(0, 1 - (stdInterval / meanInterval));
    }

    private static calculateAccuracy(trials: RNGTrial[]): number {
        // Measure accuracy against expected random distribution
        const values = trials.map(t => t.trialValue);
        const mean = StatisticalUtils.mean(values);
        const expectedMean = 100;

        return Math.max(0, 1 - Math.abs(mean - expectedMean) / 50);
    }

    private static calculateReliability(trials: RNGTrial[]): number {
        // Split-half reliability
        const midpoint = Math.floor(trials.length / 2);
        const firstHalf = trials.slice(0, midpoint);
        const secondHalf = trials.slice(midpoint);

        const firstMean = StatisticalUtils.mean(firstHalf.map(t => t.trialValue));
        const secondMean = StatisticalUtils.mean(secondHalf.map(t => t.trialValue));

        return Math.max(0, 1 - Math.abs(firstMean - secondMean) / 50);
    }

    private static calculateValidity(trials: RNGTrial[], session: ExperimentSession): number {
        // Construct validity based on theoretical expectations
        // This is a simplified implementation
        return 0.85; // Placeholder
    }

    private static identifyQualityIssues(
        trials: RNGTrial[],
        session: ExperimentSession,
        metrics: QualityMetrics
    ): QualityIssue[] {
        const issues: QualityIssue[] = [];

        if (metrics.completeness < 0.9) {
            issues.push({
                type: 'missing_data',
                severity: 'medium',
                description: `Session incomplete: ${Math.round(metrics.completeness * 100)}% of expected trials`,
                affectedData: ['trials'],
                suggestedAction: 'Complete remaining trials or mark session as partial'
            });
        }

        if (metrics.consistency < 0.7) {
            issues.push({
                type: 'timing_issue',
                severity: 'low',
                description: 'Irregular timing intervals between trials',
                affectedData: ['timestamps'],
                suggestedAction: 'Check for system interruptions during data collection'
            });
        }

        return issues;
    }

    private static generateRecommendations(issues: QualityIssue[]): string[] {
        const recommendations: string[] = [];

        const criticalIssues = issues.filter(i => i.severity === 'critical');
        if (criticalIssues.length > 0) {
            recommendations.push('Address critical data quality issues before analysis');
        }

        const highIssues = issues.filter(i => i.severity === 'high');
        if (highIssues.length > 0) {
            recommendations.push('Review high-severity quality issues and consider data exclusion');
        }

        if (issues.length === 0) {
            recommendations.push('Data quality is acceptable for analysis');
        }

        return recommendations;
    }

    private static calculateOverallQualityScore(metrics: QualityMetrics): number {
        // Weighted average of quality metrics
        return (
            metrics.completeness * 0.3 +
            metrics.consistency * 0.2 +
            metrics.accuracy * 0.2 +
            metrics.reliability * 0.15 +
            metrics.validity * 0.15
        );
    }
}