import React, { useState, useEffect, useRef } from 'react';
import { IntentionType } from '../../../shared/types';
import Button from '../Common/Button';
import Badge from '../Common/Badge';

interface MeditationTimerProps {
    duration: number; // in minutes
    onComplete: () => void;
    intention: IntentionType;
    onSkip?: () => void;
}

/**
 * Meditation Timer Component
 * Provides guided meditation before session starts
 */
export const MeditationTimer: React.FC<MeditationTimerProps> = ({
    duration,
    onComplete,
    intention,
    onSkip
}) => {
    const [remainingTime, setRemainingTime] = useState(duration * 60); // convert to seconds
    const [isActive, setIsActive] = useState(false);
    const [isCompleted, setIsCompleted] = useState(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (isActive && remainingTime > 0) {
            intervalRef.current = setInterval(() => {
                setRemainingTime((prev) => {
                    if (prev <= 1) {
                        setIsCompleted(true);
                        setIsActive(false);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [isActive, remainingTime]);

    useEffect(() => {
        if (isCompleted) {
            // Auto-complete after a brief delay
            const timeout = setTimeout(() => {
                onComplete();
            }, 2000);
            return () => clearTimeout(timeout);
        }
    }, [isCompleted, onComplete]);

    const handleStart = () => {
        setIsActive(true);
    };

    const handlePause = () => {
        setIsActive(false);
    };

    const handleResume = () => {
        setIsActive(true);
    };

    const handleSkip = () => {
        if (onSkip) {
            onSkip();
        } else {
            onComplete();
        }
    };

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getProgress = (): number => {
        const totalSeconds = duration * 60;
        return ((totalSeconds - remainingTime) / totalSeconds) * 100;
    };

    const getIntentionColor = (): string => {
        switch (intention) {
            case 'high': return '#2563eb';
            case 'low': return '#dc2626';
            case 'baseline': return '#6b7280';
            default: return '#6b7280';
        }
    };

    const getIntentionGuidance = (): string => {
        switch (intention) {
            case 'high':
                return 'Focus on positive, uplifting thoughts. Visualize the random numbers increasing. Feel confident and optimistic about your intention to influence the system positively.';
            case 'low':
                return 'Focus on calming, grounding thoughts. Visualize the random numbers decreasing. Feel centered and purposeful about your intention to influence the system downward.';
            case 'baseline':
                return 'Clear your mind and remain neutral. Do not try to influence the system in any direction. Simply observe and remain present without intention.';
            default:
                return 'Focus on your breathing and center your mind.';
        }
    };

    if (isCompleted) {
        return (
            <div className="meditation-timer completed">
                <div className="completion-message">
                    <h2>Meditation Complete</h2>
                    <p>You are now ready to begin your session.</p>
                    <div className="completion-icon">🧘‍♂️</div>
                </div>
                <style jsx>{`
                    .meditation-timer {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        min-height: 60vh;
                        text-align: center;
                        padding: 40px;
                    }

                    .completion-message h2 {
                        color: #4CAF50;
                        font-size: 2.5rem;
                        margin-bottom: 20px;
                    }

                    .completion-message p {
                        color: rgba(255, 255, 255, 0.9);
                        font-size: 1.2rem;
                        margin-bottom: 30px;
                    }

                    .completion-icon {
                        font-size: 4rem;
                        margin-top: 20px;
                        animation: pulse 2s infinite;
                    }

                    @keyframes pulse {
                        0%, 100% { transform: scale(1); }
                        50% { transform: scale(1.1); }
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div className="meditation-timer">
            <div className="timer-header">
                <h1>Meditation Preparation</h1>
                <Badge variant={intention === 'high' ? 'primary' : intention === 'low' ? 'error' : 'neutral'}>
                    {intention.toUpperCase()} Intention
                </Badge>
            </div>

            <div className="timer-display">
                <div className="time-circle">
                    <svg width="240" height="240" className="progress-ring">
                        <circle
                            cx="120"
                            cy="120"
                            r="100"
                            fill="none"
                            stroke="rgba(255, 255, 255, 0.1)"
                            strokeWidth="8"
                        />
                        <circle
                            cx="120"
                            cy="120"
                            r="100"
                            fill="none"
                            stroke={getIntentionColor()}
                            strokeWidth="8"
                            strokeLinecap="round"
                            strokeDasharray="628"
                            strokeDashoffset={628 - (628 * getProgress()) / 100}
                            className="progress-circle"
                        />
                    </svg>
                    <div className="time-text">
                        <span className="time-display">{formatTime(remainingTime)}</span>
                        <span className="time-label">remaining</span>
                    </div>
                </div>
            </div>

            <div className="guidance-text">
                <h3>Meditation Guidance</h3>
                <p>{getIntentionGuidance()}</p>
            </div>

            <div className="timer-controls">
                {!isActive && remainingTime === duration * 60 && (
                    <Button variant="primary" size="large" onClick={handleStart}>
                        Begin Meditation
                    </Button>
                )}

                {isActive && (
                    <Button variant="secondary" size="large" onClick={handlePause}>
                        Pause
                    </Button>
                )}

                {!isActive && remainingTime < duration * 60 && remainingTime > 0 && (
                    <Button variant="primary" size="large" onClick={handleResume}>
                        Resume
                    </Button>
                )}

                <Button variant="ghost" onClick={handleSkip}>
                    Skip Meditation
                </Button>
            </div>

            <style jsx>{`
                .meditation-timer {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    min-height: 80vh;
                    text-align: center;
                    padding: 40px;
                    background: linear-gradient(135deg,
                        rgba(30, 60, 114, 0.8) 0%,
                        rgba(42, 82, 152, 0.8) 100%);
                    backdrop-filter: blur(10px);
                }

                .timer-header {
                    margin-bottom: 40px;
                }

                .timer-header h1 {
                    color: white;
                    font-size: 2.5rem;
                    margin-bottom: 15px;
                    font-weight: 300;
                }

                .timer-display {
                    margin-bottom: 40px;
                    position: relative;
                }

                .time-circle {
                    position: relative;
                    display: inline-block;
                }

                .progress-ring {
                    transform: rotate(-90deg);
                }

                .progress-circle {
                    transition: stroke-dashoffset 1s ease-in-out;
                }

                .time-text {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    color: white;
                }

                .time-display {
                    font-size: 3rem;
                    font-weight: 300;
                    font-family: Monaco, Consolas, 'Courier New', monospace;
                    display: block;
                }

                .time-label {
                    font-size: 1rem;
                    color: rgba(255, 255, 255, 0.7);
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }

                .guidance-text {
                    max-width: 600px;
                    margin-bottom: 40px;
                    padding: 30px;
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 15px;
                    backdrop-filter: blur(5px);
                }

                .guidance-text h3 {
                    color: #4CAF50;
                    margin-bottom: 20px;
                    font-size: 1.5rem;
                }

                .guidance-text p {
                    color: rgba(255, 255, 255, 0.9);
                    font-size: 1.1rem;
                    line-height: 1.6;
                    margin: 0;
                }

                .timer-controls {
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                    align-items: center;
                }

                /* Responsive design */
                @media (max-width: 768px) {
                    .meditation-timer {
                        padding: 20px;
                        min-height: 100vh;
                    }

                    .timer-header h1 {
                        font-size: 2rem;
                    }

                    .time-circle svg {
                        width: 200px;
                        height: 200px;
                    }

                    .time-display {
                        font-size: 2.5rem;
                    }

                    .guidance-text {
                        padding: 20px;
                        margin-bottom: 30px;
                    }

                    .timer-controls {
                        width: 100%;
                    }
                }
            `}</style>
        </div>
    );
};

export default MeditationTimer;