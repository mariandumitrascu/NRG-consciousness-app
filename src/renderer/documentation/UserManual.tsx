import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Search, BookOpen, HelpCircle, Play, Pause, Settings } from 'lucide-react';

// User Manual Content Structure
interface ManualSection {
  id: string;
  title: string;
  content: string;
  subsections?: ManualSection[];
  interactive?: boolean;
  component?: React.ComponentType;
}

interface UserManualProps {
  onClose?: () => void;
  initialSection?: string;
}

// Interactive Demo Components
const SessionDemoComponent: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [trials, setTrials] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        setTrials(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  return (
    <div className="bg-blue-50 p-4 rounded-lg border">
      <h4 className="font-semibold mb-2">Interactive Session Demo</h4>
      <div className="flex items-center gap-4 mb-2">
        <button
          onClick={() => setIsRunning(!isRunning)}
          className="flex items-center gap-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          {isRunning ? <Pause size={16} /> : <Play size={16} />}
          {isRunning ? 'Pause' : 'Start'} Demo
        </button>
        <span className="text-sm">Trials: {trials}</span>
      </div>
      <p className="text-sm text-gray-600">
        This demo shows how a real session progresses. Click Start to see trial generation in action.
      </p>
    </div>
  );
};

const StatisticsExplainer: React.FC = () => {
  const [selectedMetric, setSelectedMetric] = useState('z-score');

  const metrics = {
    'z-score': {
      name: 'Z-Score',
      description: 'Measures how many standard deviations your results are from random chance',
      formula: 'Z = (observed - expected) / √(expected × (1-expected) × trials)',
      interpretation: 'Values beyond ±1.96 suggest significant deviation (p < 0.05)'
    },
    'cumulative-deviation': {
      name: 'Cumulative Deviation',
      description: 'Running sum of deviations from expected values',
      formula: 'CD_n = Σ(trial_i - 0.5) for i=1 to n',
      interpretation: 'Persistent trends away from zero may indicate non-random patterns'
    },
    'network-variance': {
      name: 'Network Variance',
      description: 'Measure of spread in the random number distribution',
      formula: 'Var = Σ(x_i - μ)² / (n-1)',
      interpretation: 'Unusual variance patterns may correlate with global consciousness events'
    }
  };

  return (
    <div className="bg-green-50 p-4 rounded-lg border">
      <h4 className="font-semibold mb-2">Statistical Metrics Explainer</h4>
      <div className="mb-3">
        <select
          value={selectedMetric}
          onChange={(e) => setSelectedMetric(e.target.value)}
          className="px-2 py-1 border rounded"
        >
          {Object.entries(metrics).map(([key, metric]) => (
            <option key={key} value={key}>{metric.name}</option>
          ))}
        </select>
      </div>
      <div className="space-y-2 text-sm">
        <p><strong>Description:</strong> {metrics[selectedMetric].description}</p>
        <p><strong>Formula:</strong> <code className="bg-white px-1 py-0.5 rounded">{metrics[selectedMetric].formula}</code></p>
        <p><strong>Interpretation:</strong> {metrics[selectedMetric].interpretation}</p>
      </div>
    </div>
  );
};

// Manual Content
const manualContent: ManualSection[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    content: 'Welcome to the RNG Consciousness Research Application. This tool is designed for serious research into the potential effects of human consciousness on random number generation.',
    subsections: [
      {
        id: 'first-launch',
        title: 'First Launch',
        content: `When you first open the application, you'll see the main dashboard. Here's what each section does:

• **Session Mode**: Run controlled experiments with specific intentions
• **Continuous Mode**: Monitor RNG patterns over extended periods
• **Analysis**: Review historical data and statistical patterns
• **Calibration**: Verify system randomness and timing accuracy

Before starting any research, it's recommended to run a calibration session to establish baseline randomness.`
      },
      {
        id: 'system-requirements',
        title: 'System Requirements',
        content: `For optimal research results, ensure your system meets these requirements:

**Hardware:**
• Multi-core processor (Intel i5/AMD Ryzen 5 or better)
• 8GB RAM minimum, 16GB recommended
• 1GB free disk space for data storage
• Stable internet connection (for time synchronization)

**Environment:**
• Quiet, distraction-free space
• Stable power supply (use UPS if possible)
• Consistent temperature (avoid overheating)
• Minimal electromagnetic interference

**Software:**
• Latest version of the application
• macOS 10.15+ / Windows 10+ / Ubuntu 18.04+
• Administrative privileges for hardware access`
      }
    ]
  },
  {
    id: 'session-mode',
    title: 'Session Mode',
    content: 'Session Mode allows you to run controlled experiments with specific research protocols. This is the primary mode for consciousness research.',
    interactive: true,
    component: SessionDemoComponent,
    subsections: [
      {
        id: 'creating-session',
        title: 'Creating a Session',
        content: `To create a new research session:

1. **Set Intention**: Choose your research intention (PK+, PK-, or Baseline)
2. **Configure Parameters**:
   - Session duration (recommended: 10-30 minutes)
   - Trial frequency (standard: 1 per second)
   - Data collection interval
3. **Prepare Environment**: Ensure quiet, focused conditions
4. **Begin Session**: Click Start and maintain focus on your intention

**Important**: Maintain consistent mental focus throughout the session. Breaks in concentration can affect data quality.`
      },
      {
        id: 'session-protocols',
        title: 'Research Protocols',
        content: `Standard research protocols based on PEAR laboratory methodology:

**PK+ (Positive Intention)**
• Focus on increasing random numbers
• Visualize upward trends in data
• Maintain positive, expansive mental state
• Duration: 15 minutes typical

**PK- (Negative Intention)**
• Focus on decreasing random numbers
• Visualize downward trends in data
• Maintain contractive mental state
• Duration: 15 minutes typical

**Baseline (Control)**
• Maintain neutral, relaxed state
• No specific intention toward outcomes
• Observe without trying to influence
• Duration: 30 minutes typical

**Best Practices:**
• Run sessions at consistent times
• Use similar environmental conditions
• Document external factors (stress, health, etc.)
• Avoid sessions when tired or distracted`
      }
    ]
  },
  {
    id: 'continuous-mode',
    title: 'Continuous Monitoring Mode',
    content: 'Continuous Mode runs ongoing RNG monitoring to detect unusual patterns that may correlate with global events or consciousness states.',
    subsections: [
      {
        id: 'continuous-setup',
        title: 'Setting Up Continuous Monitoring',
        content: `Continuous monitoring is designed for long-term data collection:

**Setup Steps:**
1. Navigate to Continuous Mode
2. Configure monitoring parameters:
   - Data collection frequency
   - Alert thresholds for anomalies
   - Storage duration and archiving
3. Set alert notifications for significant deviations
4. Enable automatic data backup

**Monitoring Parameters:**
• **Normal Threshold**: ±2 sigma (95% confidence)
• **Alert Threshold**: ±3 sigma (99.7% confidence)
• **Critical Threshold**: ±4 sigma (99.99% confidence)

**Data Storage:**
• Raw trial data retained for 30 days
• Statistical summaries retained indefinitely
• Automatic compression after 7 days
• Export options for external analysis`
      },
      {
        id: 'global-consciousness',
        title: 'Global Consciousness Monitoring',
        content: `This mode implements Global Consciousness Project methodology:

**Network Variance Analysis:**
• Monitors coherence across multiple RNG streams
• Detects synchronized deviations from randomness
• Correlates with global events and consciousness states
• Provides real-time coherence metrics

**Event Correlation:**
• Tracks deviations during significant global events
• Maintains database of anomalous periods
• Enables retrospective analysis
• Supports collaborative research efforts

**Scientific Standards:**
• Uses proper statistical controls
• Implements multiple correction methods
• Maintains detailed audit trails
• Provides peer-reviewable data formats`
      }
    ]
  },
  {
    id: 'analysis-tools',
    title: 'Analysis and Statistics',
    content: 'The analysis section provides comprehensive tools for interpreting your research data using scientifically validated statistical methods.',
    interactive: true,
    component: StatisticsExplainer,
    subsections: [
      {
        id: 'statistical-metrics',
        title: 'Understanding Statistical Metrics',
        content: `Key statistical measures used in consciousness research:

**Z-Score Analysis:**
• Measures deviation from random expectation
• Values beyond ±1.96 indicate 95% confidence
• Values beyond ±2.58 indicate 99% confidence
• Cumulative z-scores show overall session effects

**Cumulative Deviation:**
• Running sum of trial deviations
• Shows persistent trends over time
• Random walk should center around zero
• Systematic deviations suggest influence

**Network Variance:**
• Measures spread in random distributions
• Low variance indicates order/coherence
• High variance indicates increased randomness
• Used in Global Consciousness Project analysis

**Autocorrelation Analysis:**
• Measures self-similarity in data sequences
• Random data should show no correlation
• Patterns may indicate non-random influences
• Time-lagged analysis reveals periodic effects`
      },
      {
        id: 'data-visualization',
        title: 'Data Visualization Tools',
        content: `Visual analysis tools for pattern recognition:

**Real-time Charts:**
• Live updating during sessions
• Multiple data streams simultaneously
• Configurable time windows and scales
• Export capabilities for presentations

**Historical Analysis:**
• Compare sessions across time periods
• Overlay multiple data sets
• Statistical trend analysis
• Pattern recognition algorithms

**Correlation Plots:**
• Cross-correlation between variables
• Time-shifted correlation analysis
• Event marker integration
• Statistical significance indicators

**Export Options:**
• Raw data (CSV, JSON formats)
• Statistical summaries (PDF reports)
• Chart images (PNG, SVG formats)
• Peer-review ready datasets`
      }
    ]
  },
  {
    id: 'calibration',
    title: 'System Calibration',
    content: 'Calibration ensures your system produces truly random data and operates within specified timing constraints.',
    subsections: [
      {
        id: 'randomness-testing',
        title: 'Randomness Quality Testing',
        content: `Regular calibration validates system randomness:

**Standard Tests:**
• NIST Statistical Test Suite
• Diehard battery of tests
• ENT entropy analysis
• Custom autocorrelation tests

**Timing Calibration:**
• Precision timing validation (±1ms)
• Jitter analysis and compensation
• System clock synchronization
• Hardware timing verification

**Quality Metrics:**
• Entropy measurements
• Bias detection and correction
• Period length validation
• Statistical randomness scores

**Calibration Schedule:**
• Daily quick tests (5 minutes)
• Weekly comprehensive tests (30 minutes)
• Monthly full validation (2 hours)
• After system updates or changes`
      },
      {
        id: 'troubleshooting',
        title: 'Troubleshooting Common Issues',
        content: `Common calibration problems and solutions:

**Timing Issues:**
• High jitter (>5ms): Check system load
• Systematic delays: Update system clock
• Irregular intervals: Disable power management
• Clock drift: Enable NTP synchronization

**Randomness Problems:**
• Low entropy: Check hardware RNG
• Periodic patterns: Reset RNG state
• Bias detection: Recalibrate algorithms
• Correlation issues: Check for interference

**Performance Problems:**
• High CPU usage: Reduce background processes
• Memory leaks: Restart application
• Database slowdown: Optimize queries
• Display lag: Reduce update frequency

**Hardware Issues:**
• RNG failure: Switch to software backup
• USB disconnection: Check connections
• Driver problems: Update device drivers
• Compatibility issues: Check system requirements`
      }
    ]
  },
  {
    id: 'scientific-methodology',
    title: 'Scientific Methodology',
    content: 'Proper scientific methodology is essential for valid consciousness research. This section covers experimental design and statistical interpretation.',
    subsections: [
      {
        id: 'experimental-design',
        title: 'Experimental Design Principles',
        content: `Guidelines for rigorous consciousness research:

**Study Design:**
• Pre-register hypotheses and methods
• Use appropriate control conditions
• Balance intention types (PK+, PK-, Control)
• Randomize session order
• Maintain consistent protocols

**Sample Size Calculations:**
• Power analysis for effect detection
• Multiple comparison corrections
• Expected effect sizes from literature
• Statistical significance thresholds

**Bias Reduction:**
• Blind data analysis when possible
• Automated data collection
• Standardized protocols
• Independent replication

**Data Integrity:**
• Timestamp all events
• Maintain audit trails
• Secure data storage
• Backup and recovery procedures`
      },
      {
        id: 'statistical-interpretation',
        title: 'Statistical Interpretation',
        content: `Proper interpretation of consciousness research results:

**Significance Testing:**
• Multiple comparison corrections (Bonferroni, FDR)
• Effect size reporting (Cohen's d, eta-squared)
• Confidence intervals for estimates
• Bayesian analysis when appropriate

**Replication Considerations:**
• Internal replication within studies
• Cross-validation of findings
• Meta-analysis of multiple studies
• Publication of null results

**Reporting Standards:**
• Complete methodology documentation
• Raw data availability
• Statistical analysis code
• Transparent result reporting

**Peer Review Process:**
• Independent statistical review
• Methodology validation
• Data verification procedures
• Collaborative analysis projects`
      }
    ]
  }
];

export const UserManual: React.FC<UserManualProps> = ({ onClose, initialSection }) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['getting-started']));
  const [searchTerm, setSearchTerm] = useState('');
  const [currentSection, setCurrentSection] = useState(initialSection || 'getting-started');

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const searchContent = (content: string, term: string): boolean => {
    return content.toLowerCase().includes(term.toLowerCase());
  };

  const filteredContent = manualContent.filter(section =>
    searchTerm === '' ||
    searchContent(section.title + ' ' + section.content, searchTerm) ||
    section.subsections?.some(sub => searchContent(sub.title + ' ' + sub.content, searchTerm))
  );

  const renderSection = (section: ManualSection, level: number = 0) => {
    const isExpanded = expandedSections.has(section.id);
    const hasSubsections = section.subsections && section.subsections.length > 0;

    return (
      <div key={section.id} className={`${level > 0 ? 'ml-4' : ''} mb-4`}>
        <div
          className={`flex items-center gap-2 p-3 cursor-pointer rounded-lg transition-colors ${
            currentSection === section.id ? 'bg-blue-100 border-l-4 border-blue-500' : 'hover:bg-gray-50'
          }`}
          onClick={() => {
            if (hasSubsections) toggleSection(section.id);
            setCurrentSection(section.id);
          }}
        >
          {hasSubsections && (
            isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />
          )}
          <h3 className={`font-semibold ${level === 0 ? 'text-lg' : 'text-base'}`}>
            {section.title}
          </h3>
        </div>

        {currentSection === section.id && (
          <div className="mt-2 p-4 bg-white rounded-lg border">
            <div className="prose max-w-none">
              <div className="whitespace-pre-line text-gray-700 leading-relaxed">
                {section.content}
              </div>

              {section.interactive && section.component && (
                <div className="mt-4">
                  <section.component />
                </div>
              )}
            </div>
          </div>
        )}

        {isExpanded && hasSubsections && (
          <div className="mt-2">
            {section.subsections.map(subsection => renderSection(subsection, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <BookOpen className="text-blue-500" size={24} />
            <h1 className="text-xl font-bold">RNG Consciousness Research - User Manual</h1>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-xl font-bold"
            >
              ×
            </button>
          )}
        </div>

        {/* Search */}
        <div className="p-4 border-b bg-gray-50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search manual content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Navigation */}
          <div className="w-1/3 border-r bg-gray-50 p-4 overflow-y-auto">
            <div className="space-y-2">
              {filteredContent.map(section => (
                <div key={section.id}>
                  <button
                    className={`w-full text-left p-2 rounded hover:bg-gray-100 transition-colors ${
                      currentSection === section.id ? 'bg-blue-100 text-blue-700 font-medium' : ''
                    }`}
                    onClick={() => setCurrentSection(section.id)}
                  >
                    {section.title}
                  </button>
                  {section.subsections && expandedSections.has(section.id) && (
                    <div className="ml-4 mt-1 space-y-1">
                      {section.subsections.map(sub => (
                        <button
                          key={sub.id}
                          className={`w-full text-left p-1 text-sm rounded hover:bg-gray-100 transition-colors ${
                            currentSection === sub.id ? 'bg-blue-50 text-blue-600' : 'text-gray-600'
                          }`}
                          onClick={() => setCurrentSection(sub.id)}
                        >
                          {sub.title}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {filteredContent.map(section => renderSection(section))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 text-center text-sm text-gray-600">
          For technical support or scientific collaboration, contact: research@rng-consciousness.org
        </div>
      </div>
    </div>
  );
};

// Hook for easy manual access
export const useUserManual = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentSection, setCurrentSection] = useState<string>();

  const openManual = (section?: string) => {
    setCurrentSection(section);
    setIsOpen(true);
  };

  const closeManual = () => {
    setIsOpen(false);
    setCurrentSection(undefined);
  };

  return {
    isOpen,
    currentSection,
    openManual,
    closeManual,
    ManualComponent: () => isOpen ? (
      <UserManual onClose={closeManual} initialSection={currentSection} />
    ) : null
  };
};

export default UserManual;