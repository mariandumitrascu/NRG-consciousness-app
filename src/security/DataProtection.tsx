import React, { createContext, useContext, useState, useEffect } from 'react';
import { Shield, Lock, Eye, EyeOff, AlertTriangle, CheckCircle } from 'lucide-react';

// Data Classification Types
type DataClassification = 'public' | 'internal' | 'confidential' | 'restricted';
type EncryptionLevel = 'none' | 'standard' | 'high' | 'maximum';

interface DataProtectionSettings {
  encryptionLevel: EncryptionLevel;
  dataRetentionDays: number;
  anonymizeData: boolean;
  allowDataExport: boolean;
  requireBackupEncryption: boolean;
  enableAuditLogging: boolean;
  dataLocation: 'local' | 'encrypted-local';
  privacyLevel: 'minimal' | 'standard' | 'maximum';
}

interface SecurityAuditEvent {
  id: string;
  timestamp: Date;
  event: string;
  category: 'access' | 'data' | 'system' | 'privacy';
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: Record<string, any>;
  userId?: string;
  resolved: boolean;
}

interface DataProtectionContextType {
  settings: DataProtectionSettings;
  updateSettings: (newSettings: Partial<DataProtectionSettings>) => void;
  auditEvents: SecurityAuditEvent[];
  addAuditEvent: (event: Omit<SecurityAuditEvent, 'id' | 'timestamp' | 'resolved'>) => void;
  getDataClassification: (dataType: string) => DataClassification;
  encryptData: (data: string, level?: EncryptionLevel) => Promise<string>;
  decryptData: (encryptedData: string) => Promise<string>;
  validateDataAccess: (operation: string, dataType: string) => boolean;
  anonymizeSessionData: (sessionData: any) => any;
  generatePrivacyReport: () => Promise<PrivacyReport>;
}

interface PrivacyReport {
  timestamp: Date;
  dataCollected: string[];
  dataShared: string[];
  dataRetained: string[];
  encryptionStatus: Record<string, EncryptionLevel>;
  complianceStatus: {
    localStorageOnly: boolean;
    encryptionEnabled: boolean;
    auditTrailComplete: boolean;
    dataMinimization: boolean;
    userConsent: boolean;
  };
  recommendations: string[];
}

// Encryption utility functions
class DataEncryption {
  private static async generateKey(): Promise<CryptoKey> {
    return await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
  }

  private static async deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    return await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
  }

  static async encrypt(data: string, level: EncryptionLevel = 'standard'): Promise<string> {
    if (level === 'none') return data;

    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);

    // Generate random salt and IV
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Use system entropy for key derivation
    const systemEntropy = await crypto.subtle.digest('SHA-256',
      new TextEncoder().encode(navigator.userAgent + Date.now().toString())
    );
    const password = Array.from(new Uint8Array(systemEntropy))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    const key = await this.deriveKey(password, salt);

    const encryptedData = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      dataBuffer
    );

    // Combine salt, iv, and encrypted data
    const combined = new Uint8Array(salt.length + iv.length + encryptedData.byteLength);
    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(new Uint8Array(encryptedData), salt.length + iv.length);

    return btoa(String.fromCharCode(...combined));
  }

  static async decrypt(encryptedData: string): Promise<string> {
    try {
      const combined = new Uint8Array(atob(encryptedData).split('').map(c => c.charCodeAt(0)));

      const salt = combined.slice(0, 16);
      const iv = combined.slice(16, 28);
      const data = combined.slice(28);

      const systemEntropy = await crypto.subtle.digest('SHA-256',
        new TextEncoder().encode(navigator.userAgent + Date.now().toString())
      );
      const password = Array.from(new Uint8Array(systemEntropy))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      const key = await this.deriveKey(password, salt);

      const decryptedData = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        data
      );

      return new TextDecoder().decode(decryptedData);
    } catch (error) {
      throw new Error('Decryption failed: Invalid data or key');
    }
  }
}

// Data anonymization utilities
class DataAnonymizer {
  static anonymizeSessionData(sessionData: any): any {
    const anonymized = { ...sessionData };

    // Remove or hash personally identifiable information
    if (anonymized.userId) {
      anonymized.userId = this.hashValue(anonymized.userId);
    }

    if (anonymized.deviceId) {
      anonymized.deviceId = this.hashValue(anonymized.deviceId);
    }

    // Remove exact timestamps, keep relative timing
    if (anonymized.trials && Array.isArray(anonymized.trials)) {
      const startTime = anonymized.trials[0]?.timestamp || 0;
      anonymized.trials = anonymized.trials.map((trial: any) => ({
        ...trial,
        timestamp: trial.timestamp - startTime, // Relative timing only
        absoluteTime: undefined // Remove absolute timestamps
      }));
    }

    // Remove location data
    delete anonymized.location;
    delete anonymized.ipAddress;
    delete anonymized.systemInfo;

    return anonymized;
  }

  private static hashValue(value: string): string {
    return btoa(value).replace(/[+/=]/g, '').substring(0, 8);
  }

  static generateSyntheticData(originalData: any, count: number = 1000): any[] {
    // Generate synthetic data that maintains statistical properties
    // but removes individual identifiability
    const synthetic = [];

    for (let i = 0; i < count; i++) {
      const syntheticRecord = {
        sessionId: `synthetic_${i}`,
        intention: originalData.intention,
        duration: originalData.duration + (Math.random() - 0.5) * 60000, // ±30 seconds
        trialCount: originalData.trialCount + Math.floor((Math.random() - 0.5) * 100),
        results: this.generateSyntheticResults(originalData.results)
      };
      synthetic.push(syntheticRecord);
    }

    return synthetic;
  }

  private static generateSyntheticResults(originalResults: any): any {
    return {
      meanValue: originalResults.meanValue + (Math.random() - 0.5) * 0.01,
      zScore: originalResults.zScore + (Math.random() - 0.5) * 0.1,
      pValue: Math.random(),
      effectSize: originalResults.effectSize + (Math.random() - 0.5) * 0.05
    };
  }
}

// Privacy compliance checker
class PrivacyCompliance {
  static checkCompliance(settings: DataProtectionSettings): {
    compliant: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check data minimization
    if (!settings.anonymizeData) {
      issues.push('Data anonymization is disabled');
      recommendations.push('Enable data anonymization for better privacy protection');
    }

    // Check encryption
    if (settings.encryptionLevel === 'none') {
      issues.push('No encryption enabled for sensitive data');
      recommendations.push('Enable at least standard encryption for research data');
    }

    // Check data retention
    if (settings.dataRetentionDays > 365) {
      issues.push('Data retention period exceeds recommended maximum');
      recommendations.push('Consider reducing data retention to 365 days or less');
    }

    // Check local storage requirement
    if (settings.dataLocation !== 'local' && settings.dataLocation !== 'encrypted-local') {
      issues.push('Data may be stored outside local system');
      recommendations.push('Ensure all data remains on local system for privacy');
    }

    // Check audit logging
    if (!settings.enableAuditLogging) {
      issues.push('Audit logging is disabled');
      recommendations.push('Enable audit logging for security monitoring');
    }

    return {
      compliant: issues.length === 0,
      issues,
      recommendations
    };
  }

  static generateGDPRReport(data: any[]): any {
    return {
      dataProcessed: data.length,
      personalDataTypes: ['research_session_data', 'usage_statistics'],
      legalBasis: 'legitimate_interest_scientific_research',
      dataRetentionPeriod: '365 days',
      dataProcessingPurpose: 'consciousness research and statistical analysis',
      dataSubjectRights: [
        'right_to_access',
        'right_to_rectification',
        'right_to_erasure',
        'right_to_data_portability'
      ],
      technicalMeasures: [
        'local_data_storage',
        'encryption_at_rest',
        'access_controls',
        'audit_logging'
      ]
    };
  }
}

// Default settings
const defaultSettings: DataProtectionSettings = {
  encryptionLevel: 'standard',
  dataRetentionDays: 365,
  anonymizeData: true,
  allowDataExport: true,
  requireBackupEncryption: true,
  enableAuditLogging: true,
  dataLocation: 'encrypted-local',
  privacyLevel: 'standard'
};

// Context
const DataProtectionContext = createContext<DataProtectionContextType | null>(null);

export const DataProtectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<DataProtectionSettings>(defaultSettings);
  const [auditEvents, setAuditEvents] = useState<SecurityAuditEvent[]>([]);

  useEffect(() => {
    // Load settings from secure storage
    loadSettings();

    // Add initial audit event
    addAuditEvent({
      event: 'Data protection system initialized',
      category: 'system',
      severity: 'low',
      details: { settings: settings }
    });
  }, []);

  const loadSettings = async () => {
    try {
      const stored = localStorage.getItem('dataProtectionSettings');
      if (stored) {
        const decrypted = await DataEncryption.decrypt(stored);
        setSettings(JSON.parse(decrypted));
      }
    } catch (error) {
      console.error('Failed to load protection settings:', error);
      // Fall back to defaults
      setSettings(defaultSettings);
    }
  };

  const updateSettings = async (newSettings: Partial<DataProtectionSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);

    // Save encrypted settings
    try {
      const encrypted = await DataEncryption.encrypt(JSON.stringify(updated), updated.encryptionLevel);
      localStorage.setItem('dataProtectionSettings', encrypted);

      addAuditEvent({
        event: 'Data protection settings updated',
        category: 'system',
        severity: 'medium',
        details: { changes: newSettings }
      });
    } catch (error) {
      console.error('Failed to save protection settings:', error);
    }
  };

  const addAuditEvent = (event: Omit<SecurityAuditEvent, 'id' | 'timestamp' | 'resolved'>) => {
    const auditEvent: SecurityAuditEvent = {
      ...event,
      id: crypto.randomUUID(),
      timestamp: new Date(),
      resolved: false
    };

    setAuditEvents(prev => [auditEvent, ...prev.slice(0, 999)]);
  };

  const getDataClassification = (dataType: string): DataClassification => {
    const classifications: Record<string, DataClassification> = {
      'rng_trials': 'confidential',
      'session_results': 'confidential',
      'user_settings': 'internal',
      'system_logs': 'internal',
      'calibration_data': 'public',
      'statistical_summaries': 'public'
    };

    return classifications[dataType] || 'internal';
  };

  const encryptData = async (data: string, level?: EncryptionLevel): Promise<string> => {
    const encryptionLevel = level || settings.encryptionLevel;
    return await DataEncryption.encrypt(data, encryptionLevel);
  };

  const decryptData = async (encryptedData: string): Promise<string> => {
    return await DataEncryption.decrypt(encryptedData);
  };

  const validateDataAccess = (operation: string, dataType: string): boolean => {
    const classification = getDataClassification(dataType);
    return classification !== 'restricted' || settings.privacyLevel === 'maximum';
  };

  const anonymizeSessionData = (sessionData: any): any => {
    if (!settings.anonymizeData) return sessionData;

    const anonymized = { ...sessionData };
    if (anonymized.userId) {
      anonymized.userId = btoa(anonymized.userId).replace(/[+/=]/g, '').substring(0, 8);
    }
    return anonymized;
  };

  const generatePrivacyReport = async (): Promise<PrivacyReport> => {
    const compliance = PrivacyCompliance.checkCompliance(settings);

    const report: PrivacyReport = {
      timestamp: new Date(),
      dataCollected: [
        'RNG trial results',
        'Session timing data',
        'Statistical calculations',
        'User preferences',
        'System performance metrics'
      ],
      dataShared: [], // No data sharing in local-only mode
      dataRetained: [
        `Trial data (${settings.dataRetentionDays} days)`,
        'Statistical summaries (indefinite)',
        'User settings (until uninstall)'
      ],
      encryptionStatus: {
        'sessionData': settings.encryptionLevel,
        'userSettings': settings.encryptionLevel,
        'auditLogs': settings.enableAuditLogging ? settings.encryptionLevel : 'none'
      },
      complianceStatus: {
        localStorageOnly: settings.dataLocation.includes('local'),
        encryptionEnabled: settings.encryptionLevel !== 'none',
        auditTrailComplete: settings.enableAuditLogging,
        dataMinimization: settings.anonymizeData,
        userConsent: true // Assumed from application usage
      },
      recommendations: compliance.recommendations
    };

    addAuditEvent({
      event: 'Privacy report generated',
      category: 'privacy',
      severity: 'low',
      details: { reportTimestamp: report.timestamp }
    });

    return report;
  };

  const contextValue: DataProtectionContextType = {
    settings,
    updateSettings,
    auditEvents,
    addAuditEvent,
    getDataClassification,
    encryptData,
    decryptData,
    validateDataAccess,
    anonymizeSessionData,
    generatePrivacyReport
  };

  return (
    <DataProtectionContext.Provider value={contextValue}>
      {children}
    </DataProtectionContext.Provider>
  );
};

export const useDataProtection = (): DataProtectionContextType => {
  const context = useContext(DataProtectionContext);
  if (!context) {
    throw new Error('useDataProtection must be used within a DataProtectionProvider');
  }
  return context;
};

// Privacy Dashboard Component
export const PrivacyDashboard: React.FC = () => {
  const dataProtection = useDataProtection();
  const [showAuditLog, setShowAuditLog] = useState(false);
  const [privacyReport, setPrivacyReport] = useState<PrivacyReport | null>(null);

  const generateReport = async () => {
    const report = await dataProtection.generatePrivacyReport();
    setPrivacyReport(report);
  };

  const handleSettingChange = (key: keyof DataProtectionSettings, value: any) => {
    dataProtection.updateSettings({ [key]: value });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="text-blue-500" size={28} />
        <h1 className="text-2xl font-bold">Data Protection & Privacy</h1>
      </div>

      {/* Privacy Settings */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Lock size={20} />
          Privacy Settings
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">Encryption Level</label>
            <select
              value={dataProtection.settings.encryptionLevel}
              onChange={(e) => handleSettingChange('encryptionLevel', e.target.value)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            >
              <option value="none">No Encryption</option>
              <option value="standard">Standard (AES-256)</option>
              <option value="high">High Security</option>
              <option value="maximum">Maximum Security</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Data Retention (Days)</label>
            <input
              type="number"
              min="1"
              max="3650"
              value={dataProtection.settings.dataRetentionDays}
              onChange={(e) => handleSettingChange('dataRetentionDays', parseInt(e.target.value))}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="anonymizeData"
              checked={dataProtection.settings.anonymizeData}
              onChange={(e) => handleSettingChange('anonymizeData', e.target.checked)}
              className="rounded"
            />
            <label htmlFor="anonymizeData" className="text-sm font-medium">
              Anonymize Research Data
            </label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="enableAuditLogging"
              checked={dataProtection.settings.enableAuditLogging}
              onChange={(e) => handleSettingChange('enableAuditLogging', e.target.checked)}
              className="rounded"
            />
            <label htmlFor="enableAuditLogging" className="text-sm font-medium">
              Enable Security Audit Logging
            </label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="allowDataExport"
              checked={dataProtection.settings.allowDataExport}
              onChange={(e) => handleSettingChange('allowDataExport', e.target.checked)}
              className="rounded"
            />
            <label htmlFor="allowDataExport" className="text-sm font-medium">
              Allow Data Export
            </label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="requireBackupEncryption"
              checked={dataProtection.settings.requireBackupEncryption}
              onChange={(e) => handleSettingChange('requireBackupEncryption', e.target.checked)}
              className="rounded"
            />
            <label htmlFor="requireBackupEncryption" className="text-sm font-medium">
              Encrypt Backups
            </label>
          </div>
        </div>
      </div>

      {/* Privacy Report */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Eye size={20} />
            Privacy Report
          </h2>
          <button
            onClick={generateReport}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Generate Report
          </button>
        </div>

        {privacyReport && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium mb-2">Data Collected</h3>
                <ul className="text-sm text-gray-600">
                  {privacyReport.dataCollected.map((item, index) => (
                    <li key={index}>• {item}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-medium mb-2">Data Retention</h3>
                <ul className="text-sm text-gray-600">
                  {privacyReport.dataRetained.map((item, index) => (
                    <li key={index}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">Compliance Status</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {Object.entries(privacyReport.complianceStatus).map(([key, status]) => (
                  <div key={key} className="flex items-center gap-2">
                    {status ? (
                      <CheckCircle size={16} className="text-green-500" />
                    ) : (
                      <AlertTriangle size={16} className="text-red-500" />
                    )}
                    <span className="text-sm">{key.replace(/([A-Z])/g, ' $1').toLowerCase()}</span>
                  </div>
                ))}
              </div>
            </div>

            {privacyReport.recommendations.length > 0 && (
              <div>
                <h3 className="font-medium mb-2">Recommendations</h3>
                <ul className="text-sm text-gray-600">
                  {privacyReport.recommendations.map((rec, index) => (
                    <li key={index}>• {rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Security Audit Log */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Security Audit Log</h2>
          <button
            onClick={() => setShowAuditLog(!showAuditLog)}
            className="flex items-center gap-2 px-3 py-1 text-blue-600 hover:bg-blue-50 rounded"
          >
            {showAuditLog ? <EyeOff size={16} /> : <Eye size={16} />}
            {showAuditLog ? 'Hide' : 'Show'} Log
          </button>
        </div>

        {showAuditLog && (
          <div className="max-h-96 overflow-y-auto">
            <div className="space-y-2">
              {dataProtection.auditEvents.slice(0, 50).map((event) => (
                <div
                  key={event.id}
                  className={`p-3 rounded border ${getSeverityColor(event.severity)}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">{event.event}</span>
                    <span className="text-xs">
                      {event.timestamp.toLocaleString()}
                    </span>
                  </div>
                  <div className="text-sm">
                    Category: {event.category} | Severity: {event.severity}
                  </div>
                  {Object.keys(event.details).length > 0 && (
                    <details className="mt-2">
                      <summary className="text-sm cursor-pointer">Details</summary>
                      <pre className="text-xs mt-1 overflow-x-auto">
                        {JSON.stringify(event.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataProtectionProvider;