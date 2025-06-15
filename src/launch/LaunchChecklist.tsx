import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Rocket, Settings, Users, Shield, Database, FileText, Globe } from 'lucide-react';

// Launch Checklist Item Types
interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  category: 'technical' | 'quality' | 'documentation' | 'legal' | 'deployment' | 'support';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in-progress' | 'completed' | 'failed' | 'skipped';
  automated: boolean;
  dependencies: string[];
  estimatedTime: number; // minutes
  validate?: () => Promise<boolean>;
  action?: () => Promise<void>;
}

interface LaunchPhase {
  id: string;
  name: string;
  description: string;
  items: ChecklistItem[];
  canProceed: boolean;
  completed: boolean;
}

// Pre-launch checklist items
const technicalChecklist: ChecklistItem[] = [
  {
    id: 'code-quality-review',
    title: 'Code Quality Review',
    description: 'Complete code review and static analysis',
    category: 'technical',
    priority: 'critical',
    status: 'pending',
    automated: false,
    dependencies: [],
    estimatedTime: 120,
    validate: async () => {
      // Simulate code quality check
      return new Promise(resolve => setTimeout(() => resolve(true), 1000));
    }
  },
  {
    id: 'security-audit',
    title: 'Security Audit',
    description: 'Security vulnerability scan and penetration testing',
    category: 'technical',
    priority: 'critical',
    status: 'pending',
    automated: true,
    dependencies: ['code-quality-review'],
    estimatedTime: 180,
    validate: async () => {
      // Simulate security audit
      return new Promise(resolve => setTimeout(() => resolve(true), 2000));
    }
  },
  {
    id: 'performance-benchmarks',
    title: 'Performance Benchmarks',
    description: 'Validate performance meets all specified requirements',
    category: 'technical',
    priority: 'high',
    status: 'pending',
    automated: true,
    dependencies: [],
    estimatedTime: 60,
    validate: async () => {
      // Simulate performance validation
      const metrics = {
        startupTime: Math.random() * 4000 + 1000, // 1-5 seconds
        rngFrequency: Math.random() * 0.2 + 0.9,    // 0.9-1.1 Hz
        uiResponseTime: Math.random() * 50 + 50,    // 50-100ms
        memoryUsage: Math.random() * 200 + 300      // 300-500MB
      };

      return metrics.startupTime < 3000 &&
             Math.abs(metrics.rngFrequency - 1.0) < 0.01 &&
             metrics.uiResponseTime < 100 &&
             metrics.memoryUsage < 500;
    }
  },
  {
    id: 'cross-platform-testing',
    title: 'Cross-Platform Testing',
    description: 'Test on Windows, macOS, and Linux platforms',
    category: 'quality',
    priority: 'high',
    status: 'pending',
    automated: false,
    dependencies: ['performance-benchmarks'],
    estimatedTime: 240
  },
  {
    id: 'data-migration-test',
    title: 'Data Migration Testing',
    description: 'Validate data migration from previous versions',
    category: 'technical',
    priority: 'medium',
    status: 'pending',
    automated: true,
    dependencies: [],
    estimatedTime: 45,
    validate: async () => {
      // Simulate data migration test
      return new Promise(resolve => setTimeout(() => resolve(true), 1500));
    }
  }
];

const qualityChecklist: ChecklistItem[] = [
  {
    id: 'automated-test-suite',
    title: 'Automated Test Suite',
    description: 'All automated tests pass with >95% coverage',
    category: 'quality',
    priority: 'critical',
    status: 'pending',
    automated: true,
    dependencies: [],
    estimatedTime: 30,
    validate: async () => {
      // Simulate test suite execution
      const testResults = {
        total: 1247,
        passed: 1238,
        failed: 9,
        coverage: 94.2
      };

      return testResults.failed === 0 && testResults.coverage > 95;
    }
  },
  {
    id: 'user-acceptance-testing',
    title: 'User Acceptance Testing',
    description: 'Beta testing with research community feedback',
    category: 'quality',
    priority: 'high',
    status: 'pending',
    automated: false,
    dependencies: ['automated-test-suite'],
    estimatedTime: 480
  },
  {
    id: 'accessibility-compliance',
    title: 'Accessibility Compliance',
    description: 'WCAG 2.1 AA compliance verification',
    category: 'quality',
    priority: 'medium',
    status: 'pending',
    automated: true,
    dependencies: [],
    estimatedTime: 90,
    validate: async () => {
      // Simulate accessibility audit
      return new Promise(resolve => setTimeout(() => resolve(true), 1000));
    }
  },
  {
    id: 'statistical-validation',
    title: 'Statistical Algorithm Validation',
    description: 'Independent validation of statistical calculations',
    category: 'quality',
    priority: 'critical',
    status: 'pending',
    automated: false,
    dependencies: [],
    estimatedTime: 180
  }
];

const documentationChecklist: ChecklistItem[] = [
  {
    id: 'user-manual-complete',
    title: 'User Manual Complete',
    description: 'Comprehensive user documentation ready',
    category: 'documentation',
    priority: 'high',
    status: 'pending',
    automated: false,
    dependencies: [],
    estimatedTime: 120
  },
  {
    id: 'api-documentation',
    title: 'API Documentation',
    description: 'Complete API documentation for developers',
    category: 'documentation',
    priority: 'medium',
    status: 'pending',
    automated: false,
    dependencies: [],
    estimatedTime: 90
  },
  {
    id: 'research-methodology-guide',
    title: 'Research Methodology Guide',
    description: 'Scientific methodology and best practices guide',
    category: 'documentation',
    priority: 'high',
    status: 'pending',
    automated: false,
    dependencies: ['statistical-validation'],
    estimatedTime: 240
  },
  {
    id: 'troubleshooting-guide',
    title: 'Troubleshooting Guide',
    description: 'Common issues and solutions documentation',
    category: 'documentation',
    priority: 'medium',
    status: 'pending',
    automated: false,
    dependencies: ['user-acceptance-testing'],
    estimatedTime: 60
  }
];

const legalChecklist: ChecklistItem[] = [
  {
    id: 'license-compliance',
    title: 'License Compliance',
    description: 'All third-party licenses properly attributed',
    category: 'legal',
    priority: 'critical',
    status: 'pending',
    automated: true,
    dependencies: [],
    estimatedTime: 45,
    validate: async () => {
      // Simulate license audit
      return new Promise(resolve => setTimeout(() => resolve(true), 800));
    }
  },
  {
    id: 'privacy-policy',
    title: 'Privacy Policy',
    description: 'Privacy policy and data handling documentation',
    category: 'legal',
    priority: 'high',
    status: 'pending',
    automated: false,
    dependencies: [],
    estimatedTime: 90
  },
  {
    id: 'terms-of-use',
    title: 'Terms of Use',
    description: 'Terms of use and end-user license agreement',
    category: 'legal',
    priority: 'high',
    status: 'pending',
    automated: false,
    dependencies: [],
    estimatedTime: 60
  },
  {
    id: 'scientific-ethics-review',
    title: 'Scientific Ethics Review',
    description: 'Ethics board review for research applications',
    category: 'legal',
    priority: 'medium',
    status: 'pending',
    automated: false,
    dependencies: ['research-methodology-guide'],
    estimatedTime: 300
  }
];

const deploymentChecklist: ChecklistItem[] = [
  {
    id: 'build-automation',
    title: 'Build Automation',
    description: 'Automated build and deployment pipeline',
    category: 'deployment',
    priority: 'high',
    status: 'pending',
    automated: true,
    dependencies: [],
    estimatedTime: 30,
    validate: async () => {
      // Simulate build validation
      return new Promise(resolve => setTimeout(() => resolve(true), 1200));
    }
  },
  {
    id: 'distribution-packages',
    title: 'Distribution Packages',
    description: 'All platform installers created and tested',
    category: 'deployment',
    priority: 'critical',
    status: 'pending',
    automated: true,
    dependencies: ['build-automation'],
    estimatedTime: 90,
    validate: async () => {
      // Simulate package validation
      const packages = ['windows-installer', 'macos-dmg', 'linux-appimage'];
      return packages.every(() => Math.random() > 0.1); // 90% success rate
    }
  },
  {
    id: 'code-signing',
    title: 'Code Signing',
    description: 'All executables properly signed for security',
    category: 'deployment',
    priority: 'critical',
    status: 'pending',
    automated: true,
    dependencies: ['distribution-packages'],
    estimatedTime: 20,
    validate: async () => {
      return new Promise(resolve => setTimeout(() => resolve(true), 500));
    }
  },
  {
    id: 'release-infrastructure',
    title: 'Release Infrastructure',
    description: 'Download servers and update mechanisms ready',
    category: 'deployment',
    priority: 'high',
    status: 'pending',
    automated: false,
    dependencies: ['code-signing'],
    estimatedTime: 120
  }
];

const supportChecklist: ChecklistItem[] = [
  {
    id: 'support-documentation',
    title: 'Support Documentation',
    description: 'Support team training materials and FAQ',
    category: 'support',
    priority: 'medium',
    status: 'pending',
    automated: false,
    dependencies: ['troubleshooting-guide'],
    estimatedTime: 90
  },
  {
    id: 'community-resources',
    title: 'Community Resources',
    description: 'Forum, wiki, and community platform setup',
    category: 'support',
    priority: 'medium',
    status: 'pending',
    automated: false,
    dependencies: [],
    estimatedTime: 180
  },
  {
    id: 'feedback-system',
    title: 'Feedback System',
    description: 'Bug reporting and feature request system',
    category: 'support',
    priority: 'medium',
    status: 'pending',
    automated: false,
    dependencies: [],
    estimatedTime: 60
  },
  {
    id: 'monitoring-alerts',
    title: 'Monitoring and Alerts',
    description: 'System monitoring and alerting infrastructure',
    category: 'support',
    priority: 'high',
    status: 'pending',
    automated: true,
    dependencies: [],
    estimatedTime: 45,
    validate: async () => {
      return new Promise(resolve => setTimeout(() => resolve(true), 600));
    }
  }
];

// Launch phases
const launchPhases: LaunchPhase[] = [
  {
    id: 'technical-validation',
    name: 'Technical Validation',
    description: 'Core technical requirements and quality assurance',
    items: [...technicalChecklist, ...qualityChecklist],
    canProceed: false,
    completed: false
  },
  {
    id: 'documentation-legal',
    name: 'Documentation & Legal',
    description: 'Documentation completion and legal compliance',
    items: [...documentationChecklist, ...legalChecklist],
    canProceed: false,
    completed: false
  },
  {
    id: 'deployment-support',
    name: 'Deployment & Support',
    description: 'Deployment infrastructure and support systems',
    items: [...deploymentChecklist, ...supportChecklist],
    canProceed: false,
    completed: false
  }
];

// Launch Checklist Component
export const LaunchChecklistComponent: React.FC = () => {
  const [phases, setPhases] = useState<LaunchPhase[]>(launchPhases);
  const [activePhase, setActivePhase] = useState<string>('technical-validation');
  const [isRunningValidation, setIsRunningValidation] = useState(false);
  const [validationProgress, setValidationProgress] = useState(0);

  // Calculate overall progress
  const allItems = phases.flatMap(phase => phase.items);
  const completedItems = allItems.filter(item => item.status === 'completed');
  const overallProgress = (completedItems.length / allItems.length) * 100;

  const updateItemStatus = (phaseId: string, itemId: string, status: ChecklistItem['status']) => {
    setPhases(prevPhases =>
      prevPhases.map(phase => {
        if (phase.id === phaseId) {
          const updatedItems = phase.items.map(item =>
            item.id === itemId ? { ...item, status } : item
          );

          // Check if phase can proceed
          const criticalItems = updatedItems.filter(item => item.priority === 'critical');
          const completedCritical = criticalItems.filter(item => item.status === 'completed');
          const canProceed = criticalItems.length === completedCritical.length;

          const allCompleted = updatedItems.every(item =>
            item.status === 'completed' || item.status === 'skipped'
          );

          return {
            ...phase,
            items: updatedItems,
            canProceed,
            completed: allCompleted
          };
        }
        return phase;
      })
    );
  };

  const runAutomatedValidation = async (phaseId: string) => {
    setIsRunningValidation(true);
    setValidationProgress(0);

    const phase = phases.find(p => p.id === phaseId);
    if (!phase) return;

    const automatedItems = phase.items.filter(item => item.automated && item.validate);

    for (let i = 0; i < automatedItems.length; i++) {
      const item = automatedItems[i];
      updateItemStatus(phaseId, item.id, 'in-progress');

      try {
        if (item.validate) {
          const isValid = await item.validate();
          updateItemStatus(phaseId, item.id, isValid ? 'completed' : 'failed');
        }
      } catch (error) {
        updateItemStatus(phaseId, item.id, 'failed');
      }

      setValidationProgress(((i + 1) / automatedItems.length) * 100);
    }

    setIsRunningValidation(false);
    setValidationProgress(0);
  };

  const getStatusIcon = (status: ChecklistItem['status'], priority: ChecklistItem['priority']) => {
    const baseClass = priority === 'critical' ? 'text-lg' : 'text-base';

    switch (status) {
      case 'completed':
        return <CheckCircle className={`text-green-500 ${baseClass}`} />;
      case 'failed':
        return <XCircle className={`text-red-500 ${baseClass}`} />;
      case 'in-progress':
        return <AlertCircle className={`text-blue-500 ${baseClass} animate-pulse`} />;
      case 'skipped':
        return <AlertCircle className={`text-gray-400 ${baseClass}`} />;
      default:
        return <AlertCircle className={`text-gray-300 ${baseClass}`} />;
    }
  };

  const getPriorityColor = (priority: ChecklistItem['priority']) => {
    switch (priority) {
      case 'critical': return 'border-l-red-500 bg-red-50';
      case 'high': return 'border-l-orange-500 bg-orange-50';
      case 'medium': return 'border-l-yellow-500 bg-yellow-50';
      case 'low': return 'border-l-green-500 bg-green-50';
    }
  };

  const getCategoryIcon = (category: ChecklistItem['category']) => {
    switch (category) {
      case 'technical': return <Settings size={16} />;
      case 'quality': return <CheckCircle size={16} />;
      case 'documentation': return <FileText size={16} />;
      case 'legal': return <Shield size={16} />;
      case 'deployment': return <Globe size={16} />;
      case 'support': return <Users size={16} />;
    }
  };

  const isReadyForLaunch = phases.every(phase => phase.canProceed);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Rocket className="text-blue-500" size={28} />
          <h1 className="text-2xl font-bold">Launch Preparation</h1>
        </div>

        <div className="text-right">
          <div className="text-sm text-gray-600">Overall Progress</div>
          <div className="text-2xl font-bold text-blue-600">{overallProgress.toFixed(1)}%</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span>Launch Readiness</span>
            <span>{completedItems.length} of {allItems.length} items completed</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-blue-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>

        {isReadyForLaunch && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-700 font-semibold">
              <Rocket size={20} />
              Ready for Launch!
            </div>
            <p className="text-green-600 text-sm mt-1">
              All critical requirements have been met. The application is ready for production release.
            </p>
          </div>
        )}
      </div>

      {/* Phase Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {phases.map((phase) => (
          <button
            key={phase.id}
            onClick={() => setActivePhase(phase.id)}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activePhase === phase.id
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              {phase.completed && <CheckCircle size={16} className="text-green-500" />}
              {phase.name}
            </div>
          </button>
        ))}
      </div>

      {/* Phase Content */}
      {phases.map((phase) => (
        activePhase === phase.id && (
          <div key={phase.id} className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold">{phase.name}</h2>
                <p className="text-gray-600">{phase.description}</p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => runAutomatedValidation(phase.id)}
                  disabled={isRunningValidation}
                  className={`px-4 py-2 rounded text-sm ${
                    isRunningValidation
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-500 hover:bg-blue-600'
                  } text-white`}
                >
                  {isRunningValidation ? 'Running...' : 'Run Automated Tests'}
                </button>
              </div>
            </div>

            {isRunningValidation && (
              <div className="mb-6 p-3 bg-blue-50 rounded border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Running automated validation...</span>
                  <span className="text-sm">{validationProgress.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${validationProgress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="space-y-3">
              {phase.items.map((item) => (
                <div
                  key={item.id}
                  className={`p-4 border-l-4 rounded-r-lg ${getPriorityColor(item.priority)}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(item.status, item.priority)}
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(item.category)}
                        <h3 className="font-semibold">{item.title}</h3>
                        {item.priority === 'critical' && (
                          <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded">
                            CRITICAL
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">{item.estimatedTime}min</span>

                      {!item.automated && item.status === 'pending' && (
                        <select
                          value={item.status}
                          onChange={(e) => updateItemStatus(phase.id, item.id, e.target.value as ChecklistItem['status'])}
                          className="text-sm border rounded px-2 py-1"
                        >
                          <option value="pending">Pending</option>
                          <option value="in-progress">In Progress</option>
                          <option value="completed">Completed</option>
                          <option value="failed">Failed</option>
                          <option value="skipped">Skipped</option>
                        </select>
                      )}
                    </div>
                  </div>

                  <p className="text-gray-600 text-sm mt-2">{item.description}</p>

                  {item.dependencies.length > 0 && (
                    <div className="mt-2 text-xs text-gray-500">
                      Dependencies: {item.dependencies.join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Phase Summary */}
            <div className="mt-6 p-4 bg-gray-50 rounded">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-gray-600">Total Items:</div>
                  <div className="font-medium">{phase.items.length}</div>
                </div>
                <div>
                  <div className="text-gray-600">Completed:</div>
                  <div className="font-medium text-green-600">
                    {phase.items.filter(item => item.status === 'completed').length}
                  </div>
                </div>
                <div>
                  <div className="text-gray-600">Critical Items:</div>
                  <div className="font-medium text-red-600">
                    {phase.items.filter(item => item.priority === 'critical').length}
                  </div>
                </div>
                <div>
                  <div className="text-gray-600">Can Proceed:</div>
                  <div className={`font-medium ${phase.canProceed ? 'text-green-600' : 'text-red-600'}`}>
                    {phase.canProceed ? 'Yes' : 'No'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      ))}
    </div>
  );
};

export default LaunchChecklistComponent;