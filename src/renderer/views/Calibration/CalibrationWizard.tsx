import React, { useState, useEffect } from 'react';
import { CalibrationManager, CalibrationResult, CalibrationInterval } from '../../../main/calibration/CalibrationManager';
import { RandomnessTestSuite } from '../../../main/calibration/RandomnessValidator';

interface CalibrationProtocol {
  type: 'initial' | 'periodic' | 'diagnostic' | 'research';
  duration: CalibrationDuration;
  testSuite: RandomnessTest[];
  environmentalControls: EnvironmentalCheck[];
  qualityCriteria: QualityCriteria;
  reportGeneration: boolean;
}

interface CalibrationDuration {
  trials?: number;
  hours?: number;
  mode: 'trials' | 'time';
}

interface RandomnessTest {
  name: string;
  enabled: boolean;
  parameters?: any;
}

interface EnvironmentalCheck {
  name: string;
  enabled: boolean;
  threshold?: number;
}

interface QualityCriteria {
  minPassRate: number;
  maxBias: number;
  maxVariance: number;
  requireAllTests: boolean;
}

interface CalibrationProgress {
  phase: string;
  progress: number;
  currentTest?: string;
  elapsed?: number;
  remaining?: number;
  message?: string;
}

interface CalibrationWizardProps {
  onComplete?: (result: CalibrationResult) => void;
  onCancel?: () => void;
  initialProtocol?: Partial<CalibrationProtocol>;
}

export const CalibrationWizard: React.FC<CalibrationWizardProps> = ({
  onComplete,
  onCancel,
  initialProtocol
}) => {
  // State management
  const [currentStep, setCurrentStep] = useState(0);
  const [protocol, setProtocol] = useState<CalibrationProtocol>({
    type: 'initial',
    duration: { trials: 100000, mode: 'trials' },
    testSuite: [
      { name: 'NIST SP 800-22', enabled: true },
      { name: 'DIEHARD', enabled: true },
      { name: 'ENT', enabled: true },
      { name: 'Autocorrelation', enabled: true },
      { name: 'Runs Tests', enabled: true }
    ],
    environmentalControls: [
      { name: 'Temperature', enabled: false, threshold: 25 },
      { name: 'Humidity', enabled: false, threshold: 60 },
      { name: 'EMI', enabled: false, threshold: 2 }
    ],
    qualityCriteria: {
      minPassRate: 80,
      maxBias: 0.05,
      maxVariance: 0.01,
      requireAllTests: false
    },
    reportGeneration: true,
    ...initialProtocol
  });

  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationProgress, setCalibrationProgress] = useState<CalibrationProgress>({
    phase: 'idle',
    progress: 0
  });
  const [calibrationResult, setCalibrationResult] = useState<CalibrationResult | null>(null);
  const [calibrationError, setCalibrationError] = useState<string | null>(null);

  const calibrationManager = new CalibrationManager();

  // Wizard steps
  const steps = [
    'Protocol Selection',
    'Test Configuration',
    'Quality Criteria',
    'Environmental Controls',
    'Review & Confirm',
    'Calibration',
    'Results'
  ];

  useEffect(() => {
    // Set up calibration event listeners
    const handleProgress = (progress: any) => {
      setCalibrationProgress(progress);
    };

    const handleComplete = (result: CalibrationResult) => {
      setCalibrationResult(result);
      setIsCalibrating(false);
      setCurrentStep(steps.length - 1); // Go to results step
    };

    const handleError = (error: any) => {
      setCalibrationError(error.message || 'Unknown calibration error');
      setIsCalibrating(false);
    };

    calibrationManager.on('calibrationProgress', handleProgress);
    calibrationManager.on('calibrationCompleted', handleComplete);
    calibrationManager.on('calibrationError', handleError);

    return () => {
      calibrationManager.off('calibrationProgress', handleProgress);
      calibrationManager.off('calibrationCompleted', handleComplete);
      calibrationManager.off('calibrationError', handleError);
    };
  }, []);

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const previousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const startCalibration = async () => {
    setIsCalibrating(true);
    setCalibrationError(null);
    setCurrentStep(steps.length - 2); // Go to calibration step

    try {
      let result: CalibrationResult;

      if (protocol.duration.mode === 'trials') {
        result = await calibrationManager.runStandardCalibration(protocol.duration.trials);
      } else {
        result = await calibrationManager.runExtendedCalibration(protocol.duration.hours);
      }

      if (onComplete) {
        onComplete(result);
      }
    } catch (error) {
      setCalibrationError(error instanceof Error ? error.message : 'Calibration failed');
      setIsCalibrating(false);
    }
  };

  const renderProtocolSelection = () => (
    <div className="calibration-step">
      <h3>Select Calibration Protocol</h3>
      <div className="protocol-options">
        <div className="protocol-option">
          <input
            type="radio"
            id="initial"
            name="protocol"
            value="initial"
            checked={protocol.type === 'initial'}
            onChange={(e) => setProtocol({ ...protocol, type: e.target.value as any })}
          />
          <label htmlFor="initial">
            <strong>Initial Calibration</strong>
            <p>Complete system setup and baseline establishment</p>
          </label>
        </div>

        <div className="protocol-option">
          <input
            type="radio"
            id="periodic"
            name="protocol"
            value="periodic"
            checked={protocol.type === 'periodic'}
            onChange={(e) => setProtocol({ ...protocol, type: e.target.value as any })}
          />
          <label htmlFor="periodic">
            <strong>Periodic Calibration</strong>
            <p>Regular maintenance and drift detection</p>
          </label>
        </div>

        <div className="protocol-option">
          <input
            type="radio"
            id="diagnostic"
            name="protocol"
            value="diagnostic"
            checked={protocol.type === 'diagnostic'}
            onChange={(e) => setProtocol({ ...protocol, type: e.target.value as any })}
          />
          <label htmlFor="diagnostic">
            <strong>Diagnostic Calibration</strong>
            <p>Troubleshooting and problem diagnosis</p>
          </label>
        </div>

        <div className="protocol-option">
          <input
            type="radio"
            id="research"
            name="protocol"
            value="research"
            checked={protocol.type === 'research'}
            onChange={(e) => setProtocol({ ...protocol, type: e.target.value as any })}
          />
          <label htmlFor="research">
            <strong>Research Calibration</strong>
            <p>Publication-grade validation and certification</p>
          </label>
        </div>
      </div>

      <div className="duration-settings">
        <h4>Duration Settings</h4>
        <div className="duration-option">
          <input
            type="radio"
            id="trials-mode"
            name="duration"
            checked={protocol.duration.mode === 'trials'}
            onChange={() => setProtocol({
              ...protocol,
              duration: { ...protocol.duration, mode: 'trials' }
            })}
          />
          <label htmlFor="trials-mode">Number of Trials:</label>
          <input
            type="number"
            value={protocol.duration.trials || 100000}
            onChange={(e) => setProtocol({
              ...protocol,
              duration: { ...protocol.duration, trials: parseInt(e.target.value) }
            })}
            min="1000"
            max="10000000"
            step="1000"
            disabled={protocol.duration.mode !== 'trials'}
          />
        </div>

        <div className="duration-option">
          <input
            type="radio"
            id="time-mode"
            name="duration"
            checked={protocol.duration.mode === 'time'}
            onChange={() => setProtocol({
              ...protocol,
              duration: { ...protocol.duration, mode: 'time' }
            })}
          />
          <label htmlFor="time-mode">Duration in Hours:</label>
          <input
            type="number"
            value={protocol.duration.hours || 1}
            onChange={(e) => setProtocol({
              ...protocol,
              duration: { ...protocol.duration, hours: parseInt(e.target.value) }
            })}
            min="0.1"
            max="168"
            step="0.1"
            disabled={protocol.duration.mode !== 'time'}
          />
        </div>
      </div>
    </div>
  );

  const renderTestConfiguration = () => (
    <div className="calibration-step">
      <h3>Configure Test Suite</h3>
      <p>Select which randomness tests to include in the calibration:</p>

      <div className="test-suite">
        {protocol.testSuite.map((test, index) => (
          <div key={test.name} className="test-option">
            <input
              type="checkbox"
              id={`test-${index}`}
              checked={test.enabled}
              onChange={(e) => {
                const newTestSuite = [...protocol.testSuite];
                newTestSuite[index].enabled = e.target.checked;
                setProtocol({ ...protocol, testSuite: newTestSuite });
              }}
            />
            <label htmlFor={`test-${index}`}>
              <strong>{test.name}</strong>
              {getTestDescription(test.name)}
            </label>
          </div>
        ))}
      </div>

      <div className="test-recommendations">
        <h4>Test Recommendations</h4>
        <div className="recommendation">
          <strong>Initial Calibration:</strong> Enable all tests for comprehensive validation
        </div>
        <div className="recommendation">
          <strong>Periodic Calibration:</strong> NIST and basic tests are sufficient
        </div>
        <div className="recommendation">
          <strong>Research Calibration:</strong> All tests required for publication
        </div>
      </div>
    </div>
  );

  const renderQualityCriteria = () => (
    <div className="calibration-step">
      <h3>Quality Criteria</h3>
      <p>Set the acceptance criteria for calibration validation:</p>

      <div className="criteria-settings">
        <div className="criteria-item">
          <label htmlFor="pass-rate">Minimum Pass Rate (%):</label>
          <input
            type="number"
            id="pass-rate"
            value={protocol.qualityCriteria.minPassRate}
            onChange={(e) => setProtocol({
              ...protocol,
              qualityCriteria: {
                ...protocol.qualityCriteria,
                minPassRate: parseInt(e.target.value)
              }
            })}
            min="50"
            max="100"
            step="5"
          />
          <span className="criteria-help">Percentage of tests that must pass</span>
        </div>

        <div className="criteria-item">
          <label htmlFor="max-bias">Maximum Bias:</label>
          <input
            type="number"
            id="max-bias"
            value={protocol.qualityCriteria.maxBias}
            onChange={(e) => setProtocol({
              ...protocol,
              qualityCriteria: {
                ...protocol.qualityCriteria,
                maxBias: parseFloat(e.target.value)
              }
            })}
            min="0.01"
            max="0.1"
            step="0.01"
          />
          <span className="criteria-help">Maximum deviation from 0.5 mean</span>
        </div>

        <div className="criteria-item">
          <label htmlFor="max-variance">Maximum Variance Deviation:</label>
          <input
            type="number"
            id="max-variance"
            value={protocol.qualityCriteria.maxVariance}
            onChange={(e) => setProtocol({
              ...protocol,
              qualityCriteria: {
                ...protocol.qualityCriteria,
                maxVariance: parseFloat(e.target.value)
              }
            })}
            min="0.001"
            max="0.05"
            step="0.001"
          />
          <span className="criteria-help">Maximum deviation from 0.25 variance</span>
        </div>

        <div className="criteria-item">
          <input
            type="checkbox"
            id="require-all"
            checked={protocol.qualityCriteria.requireAllTests}
            onChange={(e) => setProtocol({
              ...protocol,
              qualityCriteria: {
                ...protocol.qualityCriteria,
                requireAllTests: e.target.checked
              }
            })}
          />
          <label htmlFor="require-all">Require ALL tests to pass (strict mode)</label>
        </div>
      </div>
    </div>
  );

  const renderEnvironmentalControls = () => (
    <div className="calibration-step">
      <h3>Environmental Controls</h3>
      <p>Configure environmental monitoring during calibration:</p>

      <div className="env-controls">
        {protocol.environmentalControls.map((control, index) => (
          <div key={control.name} className="env-control">
            <input
              type="checkbox"
              id={`env-${index}`}
              checked={control.enabled}
              onChange={(e) => {
                const newControls = [...protocol.environmentalControls];
                newControls[index].enabled = e.target.checked;
                setProtocol({ ...protocol, environmentalControls: newControls });
              }}
            />
            <label htmlFor={`env-${index}`}>{control.name}</label>
            {control.enabled && (
              <input
                type="number"
                value={control.threshold}
                onChange={(e) => {
                  const newControls = [...protocol.environmentalControls];
                  newControls[index].threshold = parseFloat(e.target.value);
                  setProtocol({ ...protocol, environmentalControls: newControls });
                }}
                step="0.1"
              />
            )}
          </div>
        ))}
      </div>

      <div className="env-note">
        <p><strong>Note:</strong> Environmental controls require compatible sensors. Calibration will proceed without monitoring if sensors are unavailable.</p>
      </div>
    </div>
  );

  const renderReviewConfirm = () => (
    <div className="calibration-step">
      <h3>Review & Confirm</h3>
      <p>Please review your calibration settings:</p>

      <div className="review-section">
        <h4>Protocol</h4>
        <p>Type: <strong>{protocol.type.charAt(0).toUpperCase() + protocol.type.slice(1)}</strong></p>
        <p>Duration: <strong>
          {protocol.duration.mode === 'trials'
            ? `${protocol.duration.trials?.toLocaleString()} trials`
            : `${protocol.duration.hours} hours`
          }
        </strong></p>
      </div>

      <div className="review-section">
        <h4>Test Suite</h4>
        <ul>
          {protocol.testSuite.filter(test => test.enabled).map(test => (
            <li key={test.name}>{test.name}</li>
          ))}
        </ul>
      </div>

      <div className="review-section">
        <h4>Quality Criteria</h4>
        <p>Minimum Pass Rate: <strong>{protocol.qualityCriteria.minPassRate}%</strong></p>
        <p>Maximum Bias: <strong>{protocol.qualityCriteria.maxBias}</strong></p>
        <p>Strict Mode: <strong>{protocol.qualityCriteria.requireAllTests ? 'Yes' : 'No'}</strong></p>
      </div>

      <div className="review-section">
        <h4>Environmental Controls</h4>
        {protocol.environmentalControls.filter(control => control.enabled).length > 0 ? (
          <ul>
            {protocol.environmentalControls.filter(control => control.enabled).map(control => (
              <li key={control.name}>{control.name} (threshold: {control.threshold})</li>
            ))}
          </ul>
        ) : (
          <p>No environmental monitoring enabled</p>
        )}
      </div>

      <div className="estimated-time">
        <h4>Estimated Time</h4>
        <p>{getEstimatedTime()}</p>
      </div>
    </div>
  );

  const renderCalibration = () => (
    <div className="calibration-step">
      <h3>Calibration in Progress</h3>

      <div className="calibration-progress">
        <div className="progress-header">
          <h4>Current Phase: {calibrationProgress.phase.replace(/_/g, ' ').toUpperCase()}</h4>
          {calibrationProgress.currentTest && (
            <p>Running: {calibrationProgress.currentTest}</p>
          )}
        </div>

        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${calibrationProgress.progress}%` }}
          />
        </div>
        <div className="progress-text">
          {calibrationProgress.progress.toFixed(1)}% Complete
        </div>

        {calibrationProgress.elapsed && calibrationProgress.remaining && (
          <div className="progress-time">
            <p>Elapsed: {formatTime(calibrationProgress.elapsed)}</p>
            <p>Remaining: {formatTime(calibrationProgress.remaining)}</p>
          </div>
        )}

        {calibrationProgress.message && (
          <div className="progress-message">
            <p>{calibrationProgress.message}</p>
          </div>
        )}
      </div>

      <div className="calibration-status">
        <div className="status-indicator">
          <div className={`status-dot ${isCalibrating ? 'active' : 'idle'}`} />
          <span>{isCalibrating ? 'Calibrating...' : 'Idle'}</span>
        </div>
      </div>

      {calibrationError && (
        <div className="calibration-error">
          <h4>Calibration Error</h4>
          <p>{calibrationError}</p>
          <button onClick={() => setCalibrationError(null)}>Dismiss</button>
        </div>
      )}
    </div>
  );

  const renderResults = () => (
    <div className="calibration-step">
      <h3>Calibration Results</h3>

      {calibrationResult ? (
        <div className="calibration-results">
          <div className="result-summary">
            <h4>Summary</h4>
            <div className={`quality-badge ${calibrationResult.quality}`}>
              {calibrationResult.quality.toUpperCase()}
            </div>
            <p>Overall RNG Health: <strong>{calibrationResult.rngHealth.toFixed(1)}%</strong></p>
            <p>Test Pass Rate: <strong>{calibrationResult.passRate.toFixed(1)}%</strong></p>
            <p>Duration: <strong>{formatTime(calibrationResult.duration)}</strong></p>
          </div>

          <div className="baseline-results">
            <h4>Baseline Statistics</h4>
            <p>Mean: <strong>{calibrationResult.baseline.mean.toFixed(6)}</strong></p>
            <p>Variance: <strong>{calibrationResult.baseline.variance.toFixed(6)}</strong></p>
            <p>Std Dev: <strong>{calibrationResult.baseline.standardDeviation.toFixed(6)}</strong></p>
          </div>

          <div className="recommendations">
            <h4>Recommendations</h4>
            <ul>
              {calibrationResult.recommendations.map((rec, index) => (
                <li key={index}>{rec}</li>
              ))}
            </ul>
          </div>

          <div className="result-actions">
            <button
              className="btn btn-primary"
              onClick={() => onComplete?.(calibrationResult)}
            >
              Accept Calibration
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setCurrentStep(0);
                setCalibrationResult(null);
              }}
            >
              Run New Calibration
            </button>
          </div>
        </div>
      ) : (
        <p>No calibration results available.</p>
      )}
    </div>
  );

  const getTestDescription = (testName: string): JSX.Element => {
    const descriptions: { [key: string]: string } = {
      'NIST SP 800-22': 'Comprehensive statistical test suite from NIST',
      'DIEHARD': 'Classic randomness testing battery',
      'ENT': 'Entropy and compression analysis',
      'Autocorrelation': 'Serial correlation detection',
      'Runs Tests': 'Run length and pattern analysis'
    };

    return <p>{descriptions[testName] || 'Statistical randomness test'}</p>;
  };

  const getEstimatedTime = (): string => {
    if (protocol.duration.mode === 'trials') {
      const trials = protocol.duration.trials || 100000;
      const minutes = Math.ceil(trials / 10000); // Rough estimate
      return `Approximately ${minutes} minutes`;
    } else {
      const hours = protocol.duration.hours || 1;
      return `${hours} hour${hours !== 1 ? 's' : ''}`;
    }
  };

  const formatTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0: return renderProtocolSelection();
      case 1: return renderTestConfiguration();
      case 2: return renderQualityCriteria();
      case 3: return renderEnvironmentalControls();
      case 4: return renderReviewConfirm();
      case 5: return renderCalibration();
      case 6: return renderResults();
      default: return renderProtocolSelection();
    }
  };

  return (
    <div className="calibration-wizard">
      <div className="wizard-header">
        <h2>RNG Calibration Wizard</h2>
        <div className="step-indicator">
          {steps.map((step, index) => (
            <div
              key={step}
              className={`step ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
            >
              <span className="step-number">{index + 1}</span>
              <span className="step-name">{step}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="wizard-content">
        {renderCurrentStep()}
      </div>

      <div className="wizard-footer">
        <div className="wizard-actions">
          {onCancel && (
            <button
              className="btn btn-cancel"
              onClick={onCancel}
              disabled={isCalibrating}
            >
              Cancel
            </button>
          )}

          <div className="navigation-buttons">
            {currentStep > 0 && currentStep < steps.length - 2 && (
              <button
                className="btn btn-secondary"
                onClick={previousStep}
                disabled={isCalibrating}
              >
                Previous
              </button>
            )}

            {currentStep < steps.length - 3 && (
              <button
                className="btn btn-primary"
                onClick={nextStep}
              >
                Next
              </button>
            )}

            {currentStep === steps.length - 3 && (
              <button
                className="btn btn-primary"
                onClick={startCalibration}
                disabled={isCalibrating}
              >
                Start Calibration
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalibrationWizard;