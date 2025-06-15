import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// Onboarding Interfaces
export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  component: React.ComponentType<OnboardingStepProps>;
  validation?: () => boolean;
  canSkip?: boolean;
  estimatedTime?: number; // minutes
}

export interface OnboardingStepProps {
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
  isFirst: boolean;
  isLast: boolean;
  stepNumber: number;
  totalSteps: number;
}

export interface OnboardingProgress {
  currentStep: number;
  completedSteps: string[];
  skippedSteps: string[];
  startTime: Date;
  estimatedTimeRemaining: number;
}

export interface OnboardingFlow {
  welcome: OnboardingStep;
  conceptExplanation: OnboardingStep;
  firstSession: OnboardingStep;
  dataInterpretation: OnboardingStep;
  bestPractices: OnboardingStep;
}

// Welcome Screen Component
const WelcomeScreen: React.FC<OnboardingStepProps> = ({ onNext, stepNumber, totalSteps }) => {
  return (
    <div className="onboarding-step welcome-screen">
      <div className="welcome-content">
        <div className="logo-section">
          <img src="/assets/logo.png" alt="RNG Consciousness App" className="app-logo" />
          <h1>Welcome to RNG Consciousness Experiment</h1>
        </div>

        <div className="welcome-description">
          <p>
            This application is a research-grade tool for conducting consciousness experiments
            using random number generation, based on methodologies from the Princeton Engineering
            Anomalies Research (PEAR) laboratory and the Global Consciousness Project.
          </p>

          <div className="key-features">
            <h3>Key Features:</h3>
            <ul>
              <li>Session-based consciousness influence experiments</li>
              <li>Continuous monitoring for ongoing research</li>
              <li>Real-time statistical analysis</li>
              <li>Scientific-grade data export</li>
              <li>Comprehensive data visualization</li>
            </ul>
          </div>

          <div className="time-estimate">
            <p>This guided setup will take approximately 10-15 minutes to complete.</p>
          </div>
        </div>

        <div className="welcome-actions">
          <div className="progress-indicator">
            Step {stepNumber} of {totalSteps}
          </div>
          <button className="primary-btn" onClick={onNext}>
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
};

// Concept Explanation Component
const ConceptTutorial: React.FC<OnboardingStepProps> = ({ onNext, onPrevious, stepNumber, totalSteps }) => {
  const [currentConcept, setCurrentConcept] = useState(0);

  const concepts = [
    {
      title: "Random Number Generation",
      content: (
        <div className="concept-content">
          <p>
            The application generates truly random 200-bit sequences at precisely 1-second intervals.
            Each trial produces exactly 200 random bits (ones and zeros).
          </p>
          <div className="visual-example">
            <div className="bit-sequence">
              {Array(20).fill(0).map((_, i) => (
                <span key={i} className={Math.random() > 0.5 ? 'bit-one' : 'bit-zero'}>
                  {Math.random() > 0.5 ? '1' : '0'}
                </span>
              ))}
              <span className="truncation">...</span>
            </div>
            <p className="example-caption">Example: First 20 bits of a 200-bit trial</p>
          </div>
        </div>
      )
    },
    {
      title: "Consciousness Influence Hypothesis",
      content: (
        <div className="concept-content">
          <p>
            Research suggests that focused human intention may subtly influence random number generators,
            causing small but statistically significant deviations from expected randomness.
          </p>
          <div className="hypothesis-diagram">
            <div className="influence-flow">
              <div className="step">👤 Human Intention</div>
              <div className="arrow">→</div>
              <div className="step">🎲 RNG Process</div>
              <div className="arrow">→</div>
              <div className="step">📊 Statistical Deviation</div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Statistical Analysis",
      content: (
        <div className="concept-content">
          <p>
            The application calculates several key statistical measures to detect potential consciousness effects:
          </p>
          <div className="statistical-measures">
            <div className="measure">
              <strong>Network Variance:</strong> Measures deviation from expected randomness
            </div>
            <div className="measure">
              <strong>Z-Score:</strong> Standardized measure of statistical significance
            </div>
            <div className="measure">
              <strong>Chi-Square:</strong> Tests for independence and randomness quality
            </div>
            <div className="measure">
              <strong>Cumulative Deviation:</strong> Running sum of deviations over time
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Research Methodology",
      content: (
        <div className="concept-content">
          <p>
            This application implements established methodologies from peer-reviewed consciousness research:
          </p>
          <div className="methodology-sources">
            <div className="source">
              <strong>PEAR Laboratory (Princeton University)</strong>
              <p>Foundational research on human-machine interactions and consciousness effects</p>
            </div>
            <div className="source">
              <strong>Global Consciousness Project</strong>
              <p>Worldwide network monitoring for collective consciousness effects</p>
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="onboarding-step concept-tutorial">
      <div className="tutorial-header">
        <h2>Understanding the Science</h2>
        <div className="concept-navigation">
          <button
            className="nav-btn"
            onClick={() => setCurrentConcept(Math.max(0, currentConcept - 1))}
            disabled={currentConcept === 0}
          >
            ← Previous
          </button>
          <span className="concept-indicator">
            {currentConcept + 1} of {concepts.length}
          </span>
          <button
            className="nav-btn"
            onClick={() => setCurrentConcept(Math.min(concepts.length - 1, currentConcept + 1))}
            disabled={currentConcept === concepts.length - 1}
          >
            Next →
          </button>
        </div>
      </div>

      <div className="concept-display">
        <h3>{concepts[currentConcept].title}</h3>
        {concepts[currentConcept].content}
      </div>

      <div className="tutorial-actions">
        <div className="progress-indicator">
          Step {stepNumber} of {totalSteps}
        </div>
        <div className="action-buttons">
          <button className="secondary-btn" onClick={onPrevious}>
            Back
          </button>
          <button className="primary-btn" onClick={onNext}>
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

// Guided Session Component
const GuidedSession: React.FC<OnboardingStepProps> = ({ onNext, onPrevious, stepNumber, totalSteps }) => {
  const [sessionStep, setSessionStep] = useState(0);
  const [sessionName, setSessionName] = useState('My First Session');
  const [targetTrials, setTargetTrials] = useState(10);
  const [intention, setIntention] = useState('');
  const [isSessionRunning, setIsSessionRunning] = useState(false);
  const [trialCount, setTrialCount] = useState(0);

  const sessionSteps = [
    'Configure Session',
    'Set Intention',
    'Run Session',
    'Review Results'
  ];

  const handleStartSession = () => {
    if (!intention.trim()) {
      alert('Please set your intention before starting the session.');
      return;
    }

    setIsSessionRunning(true);

    // Simulate session progression
    const interval = setInterval(() => {
      setTrialCount(prev => {
        const newCount = prev + 1;
        if (newCount >= targetTrials) {
          clearInterval(interval);
          setIsSessionRunning(false);
          setSessionStep(3); // Move to results
        }
        return newCount;
      });
    }, 1000);
  };

  const renderSessionStep = () => {
    switch (sessionStep) {
      case 0: // Configure
        return (
          <div className="session-config">
            <h3>Configure Your First Session</h3>
            <div className="config-form">
              <div className="form-group">
                <label htmlFor="session-name">Session Name:</label>
                <input
                  id="session-name"
                  type="text"
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  placeholder="Enter a descriptive name"
                />
              </div>
              <div className="form-group">
                <label htmlFor="target-trials">Number of Trials:</label>
                <select
                  id="target-trials"
                  value={targetTrials}
                  onChange={(e) => setTargetTrials(parseInt(e.target.value))}
                >
                  <option value={5}>5 trials (5 minutes)</option>
                  <option value={10}>10 trials (10 minutes)</option>
                  <option value={20}>20 trials (20 minutes)</option>
                </select>
              </div>
              <div className="recommendation">
                <p>💡 For your first session, we recommend starting with 10 trials to get familiar with the process.</p>
              </div>
            </div>
            <button className="primary-btn" onClick={() => setSessionStep(1)}>
              Next: Set Intention
            </button>
          </div>
        );

      case 1: // Set Intention
        return (
          <div className="intention-setting">
            <h3>Set Your Intention</h3>
            <div className="intention-explanation">
              <p>
                Before starting, clearly define your intention. This could be influencing the random
                numbers toward more 1s, more 0s, or creating specific patterns. Be specific and focused.
              </p>
            </div>
            <div className="intention-examples">
              <h4>Example Intentions:</h4>
              <ul>
                <li>"I intend to increase the number of 1s in each trial"</li>
                <li>"I want the trials to show more 0s than expected"</li>
                <li>"I aim to create alternating patterns of high and low counts"</li>
              </ul>
            </div>
            <div className="form-group">
              <label htmlFor="intention-input">Your Intention:</label>
              <textarea
                id="intention-input"
                value={intention}
                onChange={(e) => setIntention(e.target.value)}
                placeholder="Describe your specific intention for this session..."
                rows={3}
              />
            </div>
            <div className="intention-actions">
              <button className="secondary-btn" onClick={() => setSessionStep(0)}>
                Back
              </button>
              <button className="primary-btn" onClick={() => setSessionStep(2)}>
                Start Session
              </button>
            </div>
          </div>
        );

      case 2: // Run Session
        return (
          <div className="session-running">
            <h3>Session in Progress</h3>
            <div className="session-status">
              <div className="session-info">
                <strong>{sessionName}</strong>
                <p>Intention: {intention}</p>
              </div>
              <div className="progress-display">
                <div className="trial-counter">
                  <span className="current-trial">{trialCount}</span>
                  <span className="separator">/</span>
                  <span className="total-trials">{targetTrials}</span>
                  <p>Trials Completed</p>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${(trialCount / targetTrials) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {!isSessionRunning && trialCount === 0 && (
              <div className="session-controls">
                <div className="pre-session-guidance">
                  <h4>Before You Begin:</h4>
                  <ol>
                    <li>Find a quiet, comfortable space</li>
                    <li>Take a few deep breaths to center yourself</li>
                    <li>Focus clearly on your intention</li>
                    <li>Maintain concentration throughout the session</li>
                  </ol>
                </div>
                <button className="primary-btn large" onClick={handleStartSession}>
                  Begin Session
                </button>
              </div>
            )}

            {isSessionRunning && (
              <div className="session-active">
                <div className="focus-reminder">
                  <p>🎯 Stay focused on your intention</p>
                  <p>Next trial in progress...</p>
                </div>
              </div>
            )}
          </div>
        );

      case 3: // Results
        return (
          <div className="session-results">
            <h3>Session Complete!</h3>
            <div className="results-summary">
              <div className="completion-message">
                <p>🎉 Congratulations! You've completed your first consciousness experiment session.</p>
              </div>

              <div className="mock-results">
                <h4>Results Summary:</h4>
                <div className="result-stats">
                  <div className="stat">
                    <label>Total Trials:</label>
                    <span>{targetTrials}</span>
                  </div>
                  <div className="stat">
                    <label>Average Ones per Trial:</label>
                    <span>{(100 + Math.random() * 10 - 5).toFixed(1)}</span>
                  </div>
                  <div className="stat">
                    <label>Network Variance:</label>
                    <span>{(Math.random() * 20 + 45).toFixed(2)}</span>
                  </div>
                  <div className="stat">
                    <label>Z-Score:</label>
                    <span>{(Math.random() * 2 - 1).toFixed(3)}</span>
                  </div>
                </div>

                <div className="result-interpretation">
                  <h4>Interpretation:</h4>
                  <p>
                    These results show the statistical measures we discussed earlier.
                    Remember that consciousness effects are typically subtle and require
                    many sessions to establish clear patterns.
                  </p>
                </div>
              </div>

              <div className="next-steps">
                <h4>What's Next?</h4>
                <ul>
                  <li>Review your complete results in the Analysis section</li>
                  <li>Try different types of intentions in future sessions</li>
                  <li>Experiment with longer sessions as you gain experience</li>
                  <li>Keep a research journal to track your progress</li>
                </ul>
              </div>
            </div>

            <button className="primary-btn" onClick={() => setSessionStep(4)}>
              Continue to Final Steps
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  if (sessionStep === 4) {
    return (
      <div className="guided-completion">
        <h3>Guided Session Complete</h3>
        <p>You've successfully completed your first consciousness experiment session!</p>
        <div className="completion-actions">
          <div className="progress-indicator">
            Step {stepNumber} of {totalSteps}
          </div>
          <div className="action-buttons">
            <button className="secondary-btn" onClick={onPrevious}>
              Back
            </button>
            <button className="primary-btn" onClick={onNext}>
              Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="onboarding-step guided-session">
      <div className="session-header">
        <h2>Your First Session</h2>
        <div className="session-steps">
          {sessionSteps.map((step, index) => (
            <div
              key={index}
              className={`step-indicator ${index === sessionStep ? 'active' : ''} ${index < sessionStep ? 'completed' : ''}`}
            >
              {step}
            </div>
          ))}
        </div>
      </div>

      <div className="session-content">
        {renderSessionStep()}
      </div>

      <div className="step-footer">
        <div className="progress-indicator">
          Step {stepNumber} of {totalSteps}
        </div>
      </div>
    </div>
  );
};

// Data Interpretation Education Component
const ResultsEducation: React.FC<OnboardingStepProps> = ({ onNext, onPrevious, stepNumber, totalSteps }) => {
  const [selectedExample, setSelectedExample] = useState(0);

  const examples = [
    {
      title: "Strong Positive Effect",
      data: { networkVariance: 65.2, zScore: 2.34, pValue: 0.019 },
      interpretation: "This shows a statistically significant positive effect. The Z-score above 2.0 suggests your intention may have influenced the random numbers.",
      significance: "high"
    },
    {
      title: "Null Result",
      data: { networkVariance: 49.8, zScore: -0.12, pValue: 0.904 },
      interpretation: "This represents normal random behavior with no detectable consciousness effect. This is common and expected in most sessions.",
      significance: "none"
    },
    {
      title: "Weak Negative Effect",
      data: { networkVariance: 43.1, zScore: -1.67, pValue: 0.095 },
      interpretation: "A modest negative deviation. While not statistically significant, it might indicate an unconscious opposing intention.",
      significance: "low"
    }
  ];

  return (
    <div className="onboarding-step results-education">
      <div className="education-header">
        <h2>Understanding Your Results</h2>
        <p>Learn how to interpret the statistical measures and what they mean for your research.</p>
      </div>

      <div className="interpretation-guide">
        <div className="statistical-concepts">
          <h3>Key Statistical Concepts</h3>
          <div className="concept-grid">
            <div className="concept-card">
              <h4>Network Variance</h4>
              <p>Expected value: ~50 for 200-bit trials</p>
              <p>Higher values suggest more 1s than expected, lower values suggest more 0s.</p>
            </div>
            <div className="concept-card">
              <h4>Z-Score</h4>
              <p>Measures statistical significance</p>
              <p>±1.96 = 95% confidence, ±2.58 = 99% confidence</p>
            </div>
            <div className="concept-card">
              <h4>P-Value</h4>
              <p>Probability the result occurred by chance</p>
              <p>p &lt; 0.05 is considered statistically significant</p>
            </div>
          </div>
        </div>

        <div className="example-results">
          <h3>Example Interpretations</h3>
          <div className="example-selector">
            {examples.map((example, index) => (
              <button
                key={index}
                className={`example-tab ${selectedExample === index ? 'active' : ''}`}
                onClick={() => setSelectedExample(index)}
              >
                {example.title}
              </button>
            ))}
          </div>

          <div className="example-display">
            <div className={`example-data significance-${examples[selectedExample].significance}`}>
              <div className="data-values">
                <div className="value">
                  <label>Network Variance:</label>
                  <span>{examples[selectedExample].data.networkVariance}</span>
                </div>
                <div className="value">
                  <label>Z-Score:</label>
                  <span>{examples[selectedExample].data.zScore}</span>
                </div>
                <div className="value">
                  <label>P-Value:</label>
                  <span>{examples[selectedExample].data.pValue}</span>
                </div>
              </div>

              <div className="interpretation">
                <h4>Interpretation:</h4>
                <p>{examples[selectedExample].interpretation}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="research-guidelines">
          <h3>Research Best Practices</h3>
          <div className="guidelines-list">
            <div className="guideline">
              <strong>Single sessions are exploratory:</strong> Don't draw conclusions from one session alone.
            </div>
            <div className="guideline">
              <strong>Look for patterns:</strong> Analyze trends across multiple sessions over time.
            </div>
            <div className="guideline">
              <strong>Document everything:</strong> Keep detailed notes about your mental state, environment, and intentions.
            </div>
            <div className="guideline">
              <strong>Stay objective:</strong> Avoid confirmation bias when interpreting results.
            </div>
          </div>
        </div>
      </div>

      <div className="education-actions">
        <div className="progress-indicator">
          Step {stepNumber} of {totalSteps}
        </div>
        <div className="action-buttons">
          <button className="secondary-btn" onClick={onPrevious}>
            Back
          </button>
          <button className="primary-btn" onClick={onNext}>
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

// Best Practices Component
const UsageGuidance: React.FC<OnboardingStepProps> = ({ onNext, onPrevious, stepNumber, totalSteps }) => {
  const navigate = useNavigate();

  const handleComplete = () => {
    // Mark onboarding as complete
    localStorage.setItem('onboarding_completed', 'true');
    localStorage.setItem('onboarding_completed_date', new Date().toISOString());

    onNext();

    // Navigate to main application
    setTimeout(() => {
      navigate('/dashboard');
    }, 1000);
  };

  return (
    <div className="onboarding-step usage-guidance">
      <div className="guidance-header">
        <h2>Best Practices & Guidelines</h2>
        <p>Essential recommendations for effective consciousness research</p>
      </div>

      <div className="best-practices">
        <div className="practice-section">
          <h3>🧘 Mental Preparation</h3>
          <ul>
            <li>Choose a quiet, distraction-free environment</li>
            <li>Ensure you're alert and focused before starting</li>
            <li>Take time to clearly formulate your intention</li>
            <li>Maintain consistent mental state throughout sessions</li>
            <li>Avoid sessions when tired, stressed, or distracted</li>
          </ul>
        </div>

        <div className="practice-section">
          <h3>📊 Research Methodology</h3>
          <ul>
            <li>Run sessions at consistent times when possible</li>
            <li>Keep detailed notes about each session</li>
            <li>Document environmental factors (noise, lighting, etc.)</li>
            <li>Record your mental/emotional state before sessions</li>
            <li>Maintain objectivity when analyzing results</li>
          </ul>
        </div>

        <div className="practice-section">
          <h3>🎯 Intention Setting</h3>
          <ul>
            <li>Be specific and clear about your intended outcome</li>
            <li>Focus on one type of intention per session</li>
            <li>Avoid conflicting or overly complex intentions</li>
            <li>Maintain the same intention throughout the entire session</li>
            <li>Experiment with different intention types over time</li>
          </ul>
        </div>

        <div className="practice-section">
          <h3>📈 Data Analysis</h3>
          <ul>
            <li>Analyze trends across multiple sessions, not single results</li>
            <li>Use the built-in statistical tools for proper analysis</li>
            <li>Export data for external analysis if needed</li>
            <li>Look for patterns in different types of intentions</li>
            <li>Consider seasonal or temporal patterns in your data</li>
          </ul>
        </div>

        <div className="practice-section">
          <h3>⚠️ Important Considerations</h3>
          <div className="considerations">
            <div className="consideration">
              <strong>Scientific Rigor:</strong> This is research-grade software, but results should be interpreted carefully and within proper statistical context.
            </div>
            <div className="consideration">
              <strong>Expectations:</strong> Consciousness effects, if they exist, are typically small and subtle. Don't expect dramatic results.
            </div>
            <div className="consideration">
              <strong>Reproducibility:</strong> Good research practices include attempting to reproduce significant findings.
            </div>
          </div>
        </div>
      </div>

      <div className="completion-section">
        <div className="completion-message">
          <h3>🎉 Setup Complete!</h3>
          <p>
            You're now ready to begin your consciousness research journey. The application includes
            comprehensive help documentation accessible at any time through the help menu.
          </p>
        </div>

        <div className="next-steps-preview">
          <h4>Ready to explore:</h4>
          <div className="feature-preview">
            <div className="feature">✨ Session Mode - Run focused experiments</div>
            <div className="feature">📡 Continuous Mode - Long-term monitoring</div>
            <div className="feature">📊 Analysis Tools - Review your data</div>
            <div className="feature">⚙️ Calibration - Optimize your setup</div>
          </div>
        </div>
      </div>

      <div className="completion-actions">
        <div className="progress-indicator">
          Step {stepNumber} of {totalSteps} - Complete!
        </div>
        <div className="action-buttons">
          <button className="secondary-btn" onClick={onPrevious}>
            Back
          </button>
          <button className="primary-btn large" onClick={handleComplete}>
            Start Researching
          </button>
        </div>
      </div>
    </div>
  );
};

// Main Onboarding System Component
export const OnboardingSystem: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState<OnboardingProgress>({
    currentStep: 0,
    completedSteps: [],
    skippedSteps: [],
    startTime: new Date(),
    estimatedTimeRemaining: 15
  });

  const onboardingSteps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome',
      description: 'Introduction to the application',
      component: WelcomeScreen,
      estimatedTime: 2
    },
    {
      id: 'concepts',
      title: 'Scientific Concepts',
      description: 'Understanding consciousness research',
      component: ConceptTutorial,
      estimatedTime: 5
    },
    {
      id: 'guided-session',
      title: 'First Session',
      description: 'Guided experience walkthrough',
      component: GuidedSession,
      estimatedTime: 6
    },
    {
      id: 'results-education',
      title: 'Data Interpretation',
      description: 'Understanding your results',
      component: ResultsEducation,
      estimatedTime: 3
    },
    {
      id: 'best-practices',
      title: 'Best Practices',
      description: 'Guidelines for effective research',
      component: UsageGuidance,
      estimatedTime: 2
    }
  ];

  const handleNext = useCallback(() => {
    if (currentStep < onboardingSteps.length - 1) {
      setProgress(prev => ({
        ...prev,
        currentStep: currentStep + 1,
        completedSteps: [...prev.completedSteps, onboardingSteps[currentStep].id],
        estimatedTimeRemaining: prev.estimatedTimeRemaining - (onboardingSteps[currentStep].estimatedTime || 0)
      }));
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep, onboardingSteps]);

  const handlePrevious = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      setProgress(prev => ({
        ...prev,
        currentStep: currentStep - 1,
        completedSteps: prev.completedSteps.filter(id => id !== onboardingSteps[currentStep - 1].id),
        estimatedTimeRemaining: prev.estimatedTimeRemaining + (onboardingSteps[currentStep - 1].estimatedTime || 0)
      }));
    }
  }, [currentStep, onboardingSteps]);

  const handleSkip = useCallback(() => {
    setProgress(prev => ({
      ...prev,
      skippedSteps: [...prev.skippedSteps, onboardingSteps[currentStep].id]
    }));
    handleNext();
  }, [currentStep, handleNext, onboardingSteps]);

  const CurrentStepComponent = onboardingSteps[currentStep].component;

  return (
    <div className="onboarding-system">
      <div className="onboarding-container">
        <div className="onboarding-header">
          <div className="progress-bar-container">
            <div
              className="progress-bar-fill"
              style={{ width: `${((currentStep + 1) / onboardingSteps.length) * 100}%` }}
            />
          </div>
          <div className="step-info">
            <span className="step-title">{onboardingSteps[currentStep].title}</span>
            <span className="time-remaining">
              {progress.estimatedTimeRemaining} min remaining
            </span>
          </div>
        </div>

        <div className="onboarding-content">
          <CurrentStepComponent
            onNext={handleNext}
            onPrevious={handlePrevious}
            onSkip={handleSkip}
            isFirst={currentStep === 0}
            isLast={currentStep === onboardingSteps.length - 1}
            stepNumber={currentStep + 1}
            totalSteps={onboardingSteps.length}
          />
        </div>
      </div>
    </div>
  );
};

// Hook to check onboarding status
export const useOnboardingStatus = () => {
  const [isCompleted, setIsCompleted] = useState<boolean>(() => {
    return localStorage.getItem('onboarding_completed') === 'true';
  });

  const markAsCompleted = useCallback(() => {
    localStorage.setItem('onboarding_completed', 'true');
    localStorage.setItem('onboarding_completed_date', new Date().toISOString());
    setIsCompleted(true);
  }, []);

  const resetOnboarding = useCallback(() => {
    localStorage.removeItem('onboarding_completed');
    localStorage.removeItem('onboarding_completed_date');
    setIsCompleted(false);
  }, []);

  return {
    isCompleted,
    markAsCompleted,
    resetOnboarding
  };
};