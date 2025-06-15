import React, { useState, useEffect } from 'react';
import { SessionConfig, IntentionType } from '../../../shared/types';
import { useSessionManager } from '../../hooks/useSessionManager';
import { SessionSetup } from './SessionSetup';
import { RunningSession } from './RunningSession';
import { SessionResults } from './SessionResults';
import { MeditationTimer } from '../../components/Session/MeditationTimer';
import { SessionAlerts } from '../../components/Session/SessionAlerts';

/**
 * Main session mode view component
 * Orchestrates the complete intention-based session workflow
 */
export const SessionModeView: React.FC = () => {
    const {
        sessionState,
        alerts,
        startSession,
        pauseSession,
        resumeSession,
        stopSession,
        emergencyStop,
        dismissAlert,
        isSessionActive,
        canPause,
        canResume,
        canStop
    } = useSessionManager();

    const [setupComplete, setSetupComplete] = useState(false);

    /**
     * Handle session configuration and start
     */
    const handleStartSession = async (config: SessionConfig) => {
        try {
            await startSession(config);
            setSetupComplete(true);
        } catch (error) {
            console.error('Failed to start session:', error);
        }
    };

    /**
     * Handle session reset to setup
     */
    const handleResetToSetup = () => {
        setSetupComplete(false);
    };

    /**
     * Render appropriate view based on session status
     */
    const renderCurrentView = () => {
        if (!setupComplete || sessionState.sessionStatus === 'setup') {
            return (
                <SessionSetup
                    onStartSession={handleStartSession}
                    isLoading={false}
                />
            );
        }

        switch (sessionState.sessionStatus) {
            case 'meditation':
                return (
                    <MeditationTimer
                        duration={sessionState.currentSession?.config?.meditationDuration || 2}
                        onComplete={() => {}} // Handled automatically by useSessionManager
                        intention={sessionState.currentSession?.intention || 'baseline'}
                    />
                );

            case 'running':
            case 'paused':
                return (
                    <RunningSession
                        sessionState={sessionState}
                        onPause={pauseSession}
                        onResume={resumeSession}
                        onStop={stopSession}
                        onEmergencyStop={emergencyStop}
                        canPause={canPause}
                        canResume={canResume}
                        canStop={canStop}
                    />
                );

            case 'completed':
            case 'stopped':
                return (
                    <SessionResults
                        session={sessionState.currentSession!}
                        trials={sessionState.realTimeData}
                        statistics={sessionState.statisticalResults!}
                        cumulativeData={sessionState.cumulativeData}
                        onNewSession={handleResetToSetup}
                        onViewHistory={() => {}} // TODO: Implement history view
                    />
                );

            default:
                return (
                    <div className="session-error">
                        <h2>Unknown Session State</h2>
                        <p>Current status: {sessionState.sessionStatus}</p>
                        <button onClick={handleResetToSetup} className="btn-primary">
                            Return to Setup
                        </button>
                    </div>
                );
        }
    };

    return (
        <div className="session-mode-view">
            {/* Session Alerts */}
            <SessionAlerts
                alerts={alerts}
                onDismiss={dismissAlert}
            />

            {/* Main Content */}
            <div className="session-content">
                {renderCurrentView()}
            </div>

            {/* Full-screen session mode styling */}
            <style jsx>{`
                .session-mode-view {
                    min-height: 100vh;
                    background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
                    color: white;
                    display: flex;
                    flex-direction: column;
                }

                .session-content {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                }

                .session-error {
                    text-align: center;
                    padding: 40px;
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 12px;
                    backdrop-filter: blur(10px);
                }

                .session-error h2 {
                    color: #ff6b6b;
                    margin-bottom: 20px;
                }

                .session-error p {
                    margin-bottom: 30px;
                    color: rgba(255, 255, 255, 0.8);
                }

                .btn-primary {
                    background: #4CAF50;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 8px;
                    font-size: 16px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .btn-primary:hover {
                    background: #45a049;
                    transform: translateY(-2px);
                }

                /* Responsive design */
                @media (max-width: 768px) {
                    .session-content {
                        padding: 10px;
                    }
                }
            `}</style>
        </div>
    );
};

export default SessionModeView;