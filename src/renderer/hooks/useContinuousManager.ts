import { useEffect, useState, useCallback } from 'react';
import { ContinuousStatus, IntentionPeriod, HealthStatus } from '../../shared/types';

interface ContinuousManagerState {
    status: ContinuousStatus;
    isActive: boolean;
    currentPeriod: IntentionPeriod | null;
    health: HealthStatus;
    error: string | null;
}

export interface ContinuousManagerHook {
    // State
    status: ContinuousStatus;
    isActive: boolean;
    currentPeriod: IntentionPeriod | null;
    health: HealthStatus;
    error: string | null;

    // Actions
    startContinuous: () => Promise<void>;
    stopContinuous: () => Promise<void>;
    startIntentionPeriod: (note?: string) => Promise<void>;
    stopIntentionPeriod: () => Promise<void>;
    refreshStatus: () => Promise<void>;
}

export const useContinuousManager = (): ContinuousManagerHook => {
    const [state, setState] = useState<ContinuousManagerState>({
        status: {
            isActive: false,
            totalTrials: 0,
            dailyTrials: 0,
            currentRate: 0,
            uptime: 0,
            lastTrialTime: null,
            errors: 0,
            restarts: 0
        },
        isActive: false,
        currentPeriod: null,
        health: {
            overall: 'healthy',
            components: {
                collector: 'healthy',
                analyzer: 'healthy',
                database: 'healthy'
            },
            lastCheck: new Date(),
            uptime: 0,
            memoryUsage: 0,
            cpuUsage: 0
        },
        error: null
    });

    const refreshStatus = useCallback(async () => {
        try {
            // In a real implementation, this would call the main process
            // For now, we'll simulate the status
            const mockStatus: ContinuousStatus = {
                isActive: state.isActive,
                totalTrials: state.status.totalTrials + (state.isActive ? Math.floor(Math.random() * 5) : 0),
                dailyTrials: Math.floor(Math.random() * 86400), // Simulate daily trials
                currentRate: state.isActive ? 1.0 + (Math.random() - 0.5) * 0.1 : 0,
                uptime: state.isActive ? state.status.uptime + 30 : 0,
                lastTrialTime: state.isActive ? new Date() : null,
                errors: state.status.errors,
                restarts: state.status.restarts
            };

            const mockHealth: HealthStatus = {
                overall: 'healthy',
                components: {
                    collector: state.isActive ? 'healthy' : 'inactive',
                    analyzer: state.isActive ? 'healthy' : 'inactive',
                    database: 'healthy'
                },
                lastCheck: new Date(),
                uptime: mockStatus.uptime,
                memoryUsage: 45 + Math.random() * 10,
                cpuUsage: 5 + Math.random() * 15
            };

            setState(prev => ({
                ...prev,
                status: mockStatus,
                health: mockHealth,
                error: null
            }));
        } catch (error) {
            setState(prev => ({
                ...prev,
                error: error instanceof Error ? error.message : 'Unknown error'
            }));
        }
    }, [state.isActive, state.status.totalTrials, state.status.uptime, state.status.errors, state.status.restarts]);

    const startContinuous = useCallback(async () => {
        try {
            setState(prev => ({ ...prev, isActive: true, error: null }));
            // In real implementation: await window.electronAPI.startContinuous();
        } catch (error) {
            setState(prev => ({
                ...prev,
                error: error instanceof Error ? error.message : 'Failed to start continuous monitoring'
            }));
        }
    }, []);

    const stopContinuous = useCallback(async () => {
        try {
            setState(prev => ({
                ...prev,
                isActive: false,
                currentPeriod: null,
                error: null
            }));
            // In real implementation: await window.electronAPI.stopContinuous();
        } catch (error) {
            setState(prev => ({
                ...prev,
                error: error instanceof Error ? error.message : 'Failed to stop continuous monitoring'
            }));
        }
    }, []);

    const startIntentionPeriod = useCallback(async (note?: string) => {
        try {
            const period: IntentionPeriod = {
                id: Date.now().toString(),
                startTime: new Date(),
                endTime: null,
                note: note || '',
                trials: [],
                analysis: null
            };

            setState(prev => ({
                ...prev,
                currentPeriod: period,
                error: null
            }));
            // In real implementation: await window.electronAPI.startIntentionPeriod(period);
        } catch (error) {
            setState(prev => ({
                ...prev,
                error: error instanceof Error ? error.message : 'Failed to start intention period'
            }));
        }
    }, []);

    const stopIntentionPeriod = useCallback(async () => {
        try {
            if (state.currentPeriod) {
                const endedPeriod = {
                    ...state.currentPeriod,
                    endTime: new Date()
                };

                setState(prev => ({
                    ...prev,
                    currentPeriod: null,
                    error: null
                }));
                // In real implementation: await window.electronAPI.stopIntentionPeriod(endedPeriod);
            }
        } catch (error) {
            setState(prev => ({
                ...prev,
                error: error instanceof Error ? error.message : 'Failed to stop intention period'
            }));
        }
    }, [state.currentPeriod]);

    // Auto-refresh status every 30 seconds
    useEffect(() => {
        const interval = setInterval(refreshStatus, 30000);
        return () => clearInterval(interval);
    }, [refreshStatus]);

    // Initial status load
    useEffect(() => {
        refreshStatus();
    }, [refreshStatus]);

    return {
        status: state.status,
        isActive: state.isActive,
        currentPeriod: state.currentPeriod,
        health: state.health,
        error: state.error,
        startContinuous,
        stopContinuous,
        startIntentionPeriod,
        stopIntentionPeriod,
        refreshStatus
    };
};