import React, { useState } from 'react';
import { IntentionPeriod } from '../../../shared/types';

interface IntentionPeriodControlsProps {
  currentPeriod: IntentionPeriod | null;
  onStartPeriod: (note?: string) => void;
  onStopPeriod: () => void;
  disabled?: boolean;
}

export const IntentionPeriodControls: React.FC<IntentionPeriodControlsProps> = ({
  currentPeriod,
  onStartPeriod,
  onStopPeriod,
  disabled = false
}) => {
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [note, setNote] = useState('');
  const [showStopConfirmation, setShowStopConfirmation] = useState(false);

  const handleStartPeriod = () => {
    if (currentPeriod) return;
    setShowNoteDialog(true);
  };

  const handleConfirmStart = () => {
    onStartPeriod(note.trim() || undefined);
    setNote('');
    setShowNoteDialog(false);
  };

  const handleStopPeriod = () => {
    if (!currentPeriod) return;
    setShowStopConfirmation(true);
  };

  const handleConfirmStop = () => {
    onStopPeriod();
    setShowStopConfirmation(false);
  };

  const formatDuration = (startTime: Date, endTime?: Date) => {
    const end = endTime || new Date();
    const duration = Math.floor((end.getTime() - startTime.getTime()) / 1000);
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="intention-period-controls">
      <div className="controls-header">
        <h3>Intention Period</h3>
        <div className="period-status">
          {currentPeriod ? (
            <div className="status-active">
              <div className="status-indicator active"></div>
              <span>Active</span>
            </div>
          ) : (
            <div className="status-inactive">
              <div className="status-indicator inactive"></div>
              <span>Inactive</span>
            </div>
          )}
        </div>
      </div>

      {currentPeriod ? (
        <div className="active-period">
          <div className="period-info">
            <div className="period-time">
              Started: {currentPeriod.startTime.toLocaleTimeString()}
            </div>
            <div className="period-duration">
              Duration: {formatDuration(currentPeriod.startTime)}
            </div>
            {currentPeriod.note && (
              <div className="period-note">
                Note: {currentPeriod.note}
              </div>
            )}
            <div className="period-trials">
              Trials: {currentPeriod.trials.length}
            </div>
          </div>

          <button
            className="stop-button"
            onClick={handleStopPeriod}
            disabled={disabled}
          >
            Stop Period
          </button>
        </div>
      ) : (
        <div className="inactive-period">
          <p className="period-description">
            Start an intention period to focus consciousness on the RNG output.
            This will mark a specific time window for later analysis.
          </p>

          <button
            className="start-button"
            onClick={handleStartPeriod}
            disabled={disabled}
          >
            Start Intention Period
          </button>
        </div>
      )}

      {/* Note Dialog */}
      {showNoteDialog && (
        <div className="dialog-overlay">
          <div className="dialog">
            <div className="dialog-header">
              <h4>Start Intention Period</h4>
            </div>
            <div className="dialog-body">
              <p>Add an optional note to describe your intention for this period:</p>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g., Focus on increasing randomness, Testing coherence effect..."
                maxLength={200}
                rows={3}
                autoFocus
              />
              <div className="char-count">
                {note.length}/200 characters
              </div>
            </div>
            <div className="dialog-actions">
              <button
                className="dialog-button secondary"
                onClick={() => {
                  setShowNoteDialog(false);
                  setNote('');
                }}
              >
                Cancel
              </button>
              <button
                className="dialog-button primary"
                onClick={handleConfirmStart}
              >
                Start Period
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stop Confirmation Dialog */}
      {showStopConfirmation && (
        <div className="dialog-overlay">
          <div className="dialog">
            <div className="dialog-header">
              <h4>Stop Intention Period</h4>
            </div>
            <div className="dialog-body">
              <p>Are you sure you want to stop the current intention period?</p>
              <div className="confirmation-details">
                <div>Duration: {currentPeriod && formatDuration(currentPeriod.startTime)}</div>
                <div>Trials collected: {currentPeriod?.trials.length || 0}</div>
              </div>
            </div>
            <div className="dialog-actions">
              <button
                className="dialog-button secondary"
                onClick={() => setShowStopConfirmation(false)}
              >
                Cancel
              </button>
              <button
                className="dialog-button danger"
                onClick={handleConfirmStop}
              >
                Stop Period
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .intention-period-controls {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 20px;
        }

        .controls-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .controls-header h3 {
          margin: 0;
          color: #ffffff;
          font-size: 18px;
          font-weight: 600;
        }

        .period-status {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .status-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .status-indicator.active {
          background: #10b981;
          box-shadow: 0 0 8px rgba(16, 185, 129, 0.5);
        }

        .status-indicator.inactive {
          background: #6b7280;
        }

        .status-active span {
          color: #10b981;
          font-weight: 500;
        }

        .status-inactive span {
          color: #9ca3af;
        }

        .active-period {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .period-info {
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.2);
          border-radius: 8px;
          padding: 16px;
        }

        .period-time,
        .period-duration,
        .period-note,
        .period-trials {
          color: #e2e8f0;
          margin-bottom: 8px;
          font-size: 14px;
        }

        .period-time {
          font-family: Monaco, Consolas, 'Courier New', monospace;
          color: #10b981;
        }

        .period-duration {
          font-family: Monaco, Consolas, 'Courier New', monospace;
          font-weight: 600;
        }

        .period-note {
          font-style: italic;
          padding: 8px;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 4px;
        }

        .period-trials {
          font-weight: 500;
        }

        .stop-button {
          background: rgba(239, 68, 68, 0.2);
          border: 1px solid rgba(239, 68, 68, 0.4);
          color: #f87171;
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .stop-button:hover:not(:disabled) {
          background: rgba(239, 68, 68, 0.3);
          border-color: rgba(239, 68, 68, 0.6);
          color: #ef4444;
        }

        .stop-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .inactive-period {
          text-align: center;
        }

        .period-description {
          color: #94a3b8;
          margin-bottom: 20px;
          line-height: 1.5;
        }

        .start-button {
          background: rgba(16, 185, 129, 0.2);
          border: 1px solid rgba(16, 185, 129, 0.4);
          color: #10b981;
          padding: 14px 28px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .start-button:hover:not(:disabled) {
          background: rgba(16, 185, 129, 0.3);
          border-color: rgba(16, 185, 129, 0.6);
          color: #059669;
          transform: translateY(-1px);
        }

        .start-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .dialog-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .dialog {
          background: rgba(30, 41, 59, 0.95);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          width: 90%;
          max-width: 500px;
          max-height: 90vh;
          overflow: auto;
        }

        .dialog-header {
          padding: 20px 24px 0;
        }

        .dialog-header h4 {
          margin: 0;
          color: #ffffff;
          font-size: 18px;
          font-weight: 600;
        }

        .dialog-body {
          padding: 16px 24px;
        }

        .dialog-body p {
          color: #e2e8f0;
          margin-bottom: 16px;
        }

        .dialog-body textarea {
          width: 100%;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 6px;
          padding: 12px;
          color: #ffffff;
          font-family: inherit;
          resize: vertical;
          min-height: 80px;
        }

        .dialog-body textarea:focus {
          outline: none;
          border-color: rgba(59, 130, 246, 0.5);
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
        }

        .char-count {
          text-align: right;
          color: #94a3b8;
          font-size: 12px;
          margin-top: 4px;
        }

        .confirmation-details {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 6px;
          padding: 12px;
          margin-top: 12px;
        }

        .confirmation-details div {
          color: #e2e8f0;
          font-size: 14px;
          margin-bottom: 4px;
        }

        .dialog-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          padding: 16px 24px 24px;
        }

        .dialog-button {
          padding: 10px 20px;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .dialog-button.secondary {
          background: rgba(100, 116, 139, 0.2);
          border: 1px solid rgba(100, 116, 139, 0.4);
          color: #94a3b8;
        }

        .dialog-button.secondary:hover {
          background: rgba(100, 116, 139, 0.3);
          border-color: rgba(100, 116, 139, 0.6);
        }

        .dialog-button.primary {
          background: rgba(59, 130, 246, 0.2);
          border: 1px solid rgba(59, 130, 246, 0.4);
          color: #3b82f6;
        }

        .dialog-button.primary:hover {
          background: rgba(59, 130, 246, 0.3);
          border-color: rgba(59, 130, 246, 0.6);
        }

        .dialog-button.danger {
          background: rgba(239, 68, 68, 0.2);
          border: 1px solid rgba(239, 68, 68, 0.4);
          color: #f87171;
        }

        .dialog-button.danger:hover {
          background: rgba(239, 68, 68, 0.3);
          border-color: rgba(239, 68, 68, 0.6);
        }
      `}</style>
    </div>
  );
};