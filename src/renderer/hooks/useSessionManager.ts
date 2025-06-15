import { useState, useEffect, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
    ExperimentSession,
    SessionConfig,
    SessionModeState,
    SessionProgress,
    SessionControlAction,
    SessionAlert,
    RNGTrial,
    StatisticsUpdate,
    IntentionType
} from '../../shared/types';
import { NetworkVarianceResult, CumulativePoint } from '../../shared/analysis-types';

/**
 * Main session management hook for intention-based experiments
 * Handles session lifecycle, real-time data collection, and statistical updates
 */
export const useSessionManager = () => {
    // Core session state
    const [sessionState, setSessionState] = useState<SessionModeState>({
        currentSession: null,
        sessionStatus: 'setup',
        realTimeData: [],
        statisticalResults: null,
        cumulativeData: [],
        engineStatus: {
            isRunning: false,
            currentRate: 0,
            targetRate: 1.0,
            totalTrials: 0,
            lastTrialTime: null,
            startTime: null,
            timingMetrics: {
                averageError: 0,
                maxError: 0,
                missedIntervals: 0
            },
            memoryUsage: {
                current: 0,
                peak: 0
            }
        },
        progress: {
            trialsCompleted: 0,
            targetTrials: 300,
            startTime: new Date(),
            estimatedCompletion: null,
            currentRate: 0,
            percentComplete: 0,
            elapsedTime: 0
        }
    });

    // Alerts and notifications
    const [alerts, setAlerts] = useState<SessionAlert[]>([]);

    // Real-time update intervals
    const statisticsInterval = useRef<NodeJS.Timeout | null>(null);
    const progressInterval = useRef<NodeJS.Timeout | null>(null);
    const trialGenerationInterval = useRef<NodeJS.Timeout | null>(null);

    // Session configuration
    const [currentConfig, setCurrentConfig] = useState<SessionConfig | null>(null);

    /**
     * Create a new experiment session
     */
    const createSession = useCallback(async (config: SessionConfig): Promise<ExperimentSession> => {
        const session: ExperimentSession = {
            id: uuidv4(),
            startTime: new Date(),
            endTime: null,
            intention: config.intention,
            targetTrials: config.targetTrials,
            status: 'running',
            notes: config.notes,
            participantId: config.participantId,
            duration: 0
        };

        setCurrentConfig(config);
        setSessionState(prev => ({
            ...prev,
            currentSession: session,
            sessionStatus: config.meditationDuration > 0 ? 'meditation' : 'running',
            realTimeData: [],
            progress: {
                trialsCompleted: 0,
                targetTrials: config.targetTrials,
                startTime: session.startTime,
                estimatedCompletion: null,
                currentRate: 0,
                percentComplete: 0,
                elapsedTime: 0
            }
        }));

        // Add session start alert
        addAlert({
            type: 'milestone',
            severity: 'info',
            title: 'Session Started',
            message: `Intention-based session started with ${config.intention} intention`,
            requiresAck: false
        });

        return session;
    }, []);

    /**
     * Start meditation period before session
     */
    const startMeditation = useCallback(async (duration: number) => {
        setSessionState(prev => ({
            ...prev,
            sessionStatus: 'meditation'
        }));

        // Meditation timer
        setTimeout(() => {
            setSessionState(prev => ({
                ...prev,
                sessionStatus: 'running'
            }));

            addAlert({
                type: 'milestone',
                severity: 'success',
                title: 'Meditation Complete',
                message: 'Meditation period finished. Session will now begin.',
                requiresAck: false
            });
        }, duration * 60 * 1000);
    }, []);

    /**
     * Start active session data collection
     */
    const startSession = useCallback(async (config: SessionConfig) => {
        try {
            const session = await createSession(config);

            if (config.meditationDuration > 0) {
                await startMeditation(config.meditationDuration);
            } else {
                setSessionState(prev => ({
                    ...prev,
                    sessionStatus: 'running'
                }));
            }

            // Start real-time trial generation simulation
            startTrialGeneration();
            startStatisticsUpdates();
            startProgressTracking();

            return session;
        } catch (error) {
            addAlert({
                type: 'error',
                severity: 'error',
                title: 'Session Start Failed',
                message: `Failed to start session: ${error}`,
                requiresAck: true
            });
            throw error;
        }
    }, [createSession, startMeditation]);

    /**
     * Pause active session
     */
    const pauseSession = useCallback(async () => {
        setSessionState(prev => ({
            ...prev,
            sessionStatus: 'paused'
        }));

        stopIntervals();

        addAlert({
            type: 'milestone',
            severity: 'warning',
            title: 'Session Paused',
            message: 'Data collection has been paused',
            requiresAck: false
        });
    }, []);

    /**
     * Resume paused session
     */
    const resumeSession = useCallback(async () => {
        setSessionState(prev => ({
            ...prev,
            sessionStatus: 'running'
        }));

        startTrialGeneration();
        startStatisticsUpdates();
        startProgressTracking();

        addAlert({
            type: 'milestone',
            severity: 'info',
            title: 'Session Resumed',
            message: 'Data collection has resumed',
            requiresAck: false
        });
    }, []);

    /**
     * Stop session normally
     */
    const stopSession = useCallback(async () => {
        setSessionState(prev => {
            const updatedSession = prev.currentSession ? {
                ...prev.currentSession,
                endTime: new Date(),
                status: 'completed' as const,
                duration: Date.now() - prev.currentSession.startTime.getTime()
            } : null;

            return {
                ...prev,
                currentSession: updatedSession,
                sessionStatus: 'completed'
            };
        });

        stopIntervals();

        addAlert({
            type: 'completion',
            severity: 'success',
            title: 'Session Complete',
            message: 'Session has been completed successfully',
            requiresAck: false
        });
    }, []);

    /**
     * Emergency stop session
     */
    const emergencyStop = useCallback(async () => {
        setSessionState(prev => {
            const updatedSession = prev.currentSession ? {
                ...prev.currentSession,
                endTime: new Date(),
                status: 'stopped' as const,
                duration: Date.now() - prev.currentSession.startTime.getTime()
            } : null;

            return {
                ...prev,
                currentSession: updatedSession,
                sessionStatus: 'stopped'
            };
        });

        stopIntervals();

        addAlert({
            type: 'warning',
            severity: 'warning',
            title: 'Emergency Stop',
            message: 'Session has been stopped immediately',
            requiresAck: true
        });
    }, []);

    /**
     * Start real-time trial generation (simulation)
     */
    const startTrialGeneration = useCallback(() => {
        if (trialGenerationInterval.current) return;

        trialGenerationInterval.current = setInterval(() => {
            setSessionState(prev => {
                if (prev.sessionStatus !== 'running' || !prev.currentSession) return prev;

                // Generate simulated trial data
                const newTrial: RNGTrial = {
                    timestamp: new Date(),
                    trialValue: Math.floor(Math.random() * 201), // 0-200 range
                    sessionId: prev.currentSession.id,
                    experimentMode: 'session',
                    intention: prev.currentSession.intention,
                    trialNumber: prev.realTimeData.length + 1
                };

                const updatedData = [...prev.realTimeData, newTrial];

                // Check if target reached
                if (updatedData.length >= prev.progress.targetTrials) {
                    // Auto-complete session
                    setTimeout(() => stopSession(), 100);
                }

                return {
                    ...prev,
                    realTimeData: updatedData
                };
            });
        }, 1000); // 1 trial per second
    }, [stopSession]);

    /**
     * Start real-time statistics updates
     */
    const startStatisticsUpdates = useCallback(() => {
        if (statisticsInterval.current) return;

        statisticsInterval.current = setInterval(() => {
            setSessionState(prev => {
                if (prev.realTimeData.length === 0) return prev;

                // Calculate current statistics
                const trials = prev.realTimeData;
                const sum = trials.reduce((acc, trial) => acc + trial.trialValue, 0);
                const mean = sum / trials.length;
                const expectedMean = 100;
                const variance = trials.reduce((acc, trial) => acc + Math.pow(trial.trialValue - mean, 2), 0) / trials.length;
                const stdDev = Math.sqrt(variance);
                const zScore = (mean - expectedMean) / (stdDev / Math.sqrt(trials.length));
                const pValue = 2 * (1 - Math.abs(zScore) / Math.sqrt(2 * Math.PI));

                // Create network variance result
                const networkVarianceResult: NetworkVarianceResult = {
                    netvar: zScore * zScore,
                    degreesOfFreedom: 1,
                    chisquare: zScore * zScore,
                    probability: Math.max(0.001, Math.min(0.999, pValue)),
                    significance: pValue < 0.01 ? 'highly_significant' :
                        pValue < 0.05 ? 'significant' :
                            pValue < 0.1 ? 'marginal' : 'none',
                    confidenceInterval: [mean - 1.96 * stdDev, mean + 1.96 * stdDev],
                    expectedNetvar: 1,
                    standardError: stdDev / Math.sqrt(trials.length)
                };

                // Calculate cumulative deviation
                let cumulativeDeviation = 0;
                const cumulativeData: CumulativePoint[] = trials.map((trial, index) => {
                    cumulativeDeviation += (trial.trialValue - expectedMean);
                    const runningSum = trials.slice(0, index + 1).reduce((acc, t) => acc + t.trialValue, 0);
                    const runningMean = runningSum / (index + 1);
                    const runningVariance = trials.slice(0, index + 1)
                        .reduce((acc, t) => acc + Math.pow(t.trialValue - runningMean, 2), 0) / (index + 1);
                    const runningZScore = (runningMean - expectedMean) / (Math.sqrt(runningVariance) / Math.sqrt(index + 1));

                    return {
                        trialIndex: index,
                        timestamp: trial.timestamp,
                        cumulativeDeviation,
                        runningMean,
                        zScore: runningZScore,
                        runningVariance
                    };
                });

                // Check for significance alerts
                if (networkVarianceResult.significance === 'significant' && prev.statisticalResults?.significance !== 'significant') {
                    addAlert({
                        type: 'significance',
                        severity: 'success',
                        title: 'Significant Result!',
                        message: `Statistical significance reached (p = ${networkVarianceResult.probability.toFixed(4)})`,
                        requiresAck: true
                    });
                }

                return {
                    ...prev,
                    statisticalResults: networkVarianceResult,
                    cumulativeData
                };
            });
        }, 1000); // Update every second
    }, []);

    /**
     * Start progress tracking updates
     */
    const startProgressTracking = useCallback(() => {
        if (progressInterval.current) return;

        progressInterval.current = setInterval(() => {
            setSessionState(prev => {
                if (!prev.currentSession) return prev;

                const elapsedTime = Date.now() - prev.currentSession.startTime.getTime();
                const trialsCompleted = prev.realTimeData.length;
                const percentComplete = (trialsCompleted / prev.progress.targetTrials) * 100;
                const currentRate = trialsCompleted / (elapsedTime / 1000); // trials per second

                let estimatedCompletion: Date | null = null;
                if (currentRate > 0) {
                    const remainingTrials = prev.progress.targetTrials - trialsCompleted;
                    const remainingTime = remainingTrials / currentRate * 1000; // milliseconds
                    estimatedCompletion = new Date(Date.now() + remainingTime);
                }

                return {
                    ...prev,
                    progress: {
                        ...prev.progress,
                        trialsCompleted,
                        percentComplete: Math.min(100, percentComplete),
                        currentRate,
                        elapsedTime,
                        estimatedCompletion
                    }
                };
            });
        }, 500); // Update every 0.5 seconds
    }, []);

    /**
     * Stop all intervals
     */
    const stopIntervals = useCallback(() => {
        if (statisticsInterval.current) {
            clearInterval(statisticsInterval.current);
            statisticsInterval.current = null;
        }
        if (progressInterval.current) {
            clearInterval(progressInterval.current);
            progressInterval.current = null;
        }
        if (trialGenerationInterval.current) {
            clearInterval(trialGenerationInterval.current);
            trialGenerationInterval.current = null;
        }
    }, []);

    /**
     * Add an alert to the queue
     */
    const addAlert = useCallback((alert: Omit<SessionAlert, 'id' | 'timestamp'>) => {
        const newAlert: SessionAlert = {
            ...alert,
            id: uuidv4(),
            timestamp: new Date()
        };

        setAlerts(prev => [...prev, newAlert]);
    }, []);

    /**
     * Dismiss an alert
     */
    const dismissAlert = useCallback((alertId: string) => {
        setAlerts(prev => prev.filter(alert => alert.id !== alertId));
    }, []);

    /**
     * Session control handler
     */
    const handleSessionControl = useCallback(async (action: SessionControlAction) => {
        switch (action) {
            case 'start':
                if (currentConfig) {
                    await startSession(currentConfig);
                }
                break;
            case 'pause':
                await pauseSession();
                break;
            case 'resume':
                await resumeSession();
                break;
            case 'stop':
                await stopSession();
                break;
            case 'emergency_stop':
                await emergencyStop();
                break;
        }
    }, [currentConfig, startSession, pauseSession, resumeSession, stopSession, emergencyStop]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopIntervals();
        };
    }, [stopIntervals]);

    return {
        // State
        sessionState,
        alerts,
        currentConfig,

        // Actions
        startSession,
        pauseSession,
        resumeSession,
        stopSession,
        emergencyStop,
        handleSessionControl,
        dismissAlert,

        // Utilities
        isSessionActive: sessionState.sessionStatus === 'running' || sessionState.sessionStatus === 'meditation',
        canPause: sessionState.sessionStatus === 'running',
        canResume: sessionState.sessionStatus === 'paused',
        canStop: sessionState.sessionStatus === 'running' || sessionState.sessionStatus === 'paused'
    };
};