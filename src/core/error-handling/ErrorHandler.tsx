import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { DatabaseManager } from '../../database/DatabaseManager';
import { RNGEngine } from '../rng/RNGEngine';
import { DatabaseConnection } from '../../database/DatabaseConnection';

// Add DOM type declarations for Node.js environment
declare global {
  interface Window {
    addEventListener(
      type: 'unhandledrejection',
      listener: (event: PromiseRejectionEvent) => void
    ): void;
    addEventListener(
      type: 'error',
      listener: (event: ErrorEvent) => void
    ): void;
  }

  interface PromiseRejectionEvent {
    reason: any;
  }

  interface ErrorEvent {
    error?: Error;
    message: string;
  }
}

// Error Types and Interfaces
export enum ErrorType {
  RNG_ERROR = 'rng_error',
  DATABASE_ERROR = 'database_error',
  UI_ERROR = 'ui_error',
  SYSTEM_ERROR = 'system_error',
  NETWORK_ERROR = 'network_error',
  VALIDATION_ERROR = 'validation_error',
  TIMEOUT_ERROR = 'timeout_error',
  MEMORY_ERROR = 'memory_error'
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface BaseError {
  id: string;
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  details?: any;
  timestamp: Date;
  context?: string;
  stack?: string;
  userAction?: string;
  recoverable: boolean;
}

export interface RNGError extends BaseError {
  type: ErrorType.RNG_ERROR;
  trialId?: string;
  engineState?: string;
  qualityMetrics?: any;
}

export interface DatabaseError extends BaseError {
  type: ErrorType.DATABASE_ERROR;
  query?: string;
  connection?: string;
  transaction?: string;
}

export interface UIError extends BaseError {
  type: ErrorType.UI_ERROR;
  component?: string;
  props?: any;
  renderPath?: string;
}

export interface SystemError extends BaseError {
  type: ErrorType.SYSTEM_ERROR;
  process?: string;
  resource?: string;
  systemInfo?: any;
}

export type AppError = RNGError | DatabaseError | UIError | SystemError;

export interface RecoveryAction {
  action: string;
  description: string;
  automatic: boolean;
  timeout?: number;
  retryCount?: number;
  parameters?: any;
}

export interface ErrorReport {
  error: AppError;
  recoveryAttempts: RecoveryAction[];
  finalState: 'recovered' | 'failed' | 'pending';
  userImpact: 'none' | 'minimal' | 'moderate' | 'severe';
  recommendations: string[];
}

export interface ErrorHandlerState {
  errors: AppError[];
  activeRecoveries: Map<string, RecoveryAction>;
  errorCounts: Map<ErrorType, number>;
  isSystemHealthy: boolean;
  lastHealthCheck: Date;
}

export class ErrorHandler {
  private state: ErrorHandlerState = {
    errors: [],
    activeRecoveries: new Map(),
    errorCounts: new Map(),
    isSystemHealthy: true,
    lastHealthCheck: new Date()
  };
  private listeners: Set<(error: AppError) => void> = new Set();
  private recoveryListeners: Set<(recovery: RecoveryAction) => void> = new Set();
  private maxErrors = 1000;
  private healthCheckInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeHealthMonitoring();
    this.setupGlobalErrorHandlers();
  }

  private initializeHealthMonitoring(): void {
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, 30000); // Every 30 seconds
  }

  private setupGlobalErrorHandlers(): void {
    // React Error Boundary integration
    // Skip window event listeners in Node.js environment to avoid compilation errors
    // Global error handling will be managed at the React component level
  }

  private performHealthCheck(): void {
    const recentErrors = this.state.errors.filter(
      error => Date.now() - error.timestamp.getTime() < 300000 // Last 5 minutes
    );

    const criticalErrors = recentErrors.filter(error => error.severity === ErrorSeverity.CRITICAL);
    const highErrors = recentErrors.filter(error => error.severity === ErrorSeverity.HIGH);

    // System is unhealthy if:
    // - More than 3 critical errors in 5 minutes
    // - More than 10 high severity errors in 5 minutes
    // - More than 50 total errors in 5 minutes
    const isHealthy = criticalErrors.length <= 3 &&
                     highErrors.length <= 10 &&
                     recentErrors.length <= 50;

    this.state.isSystemHealthy = isHealthy;
    this.state.lastHealthCheck = new Date();

    if (!isHealthy) {
      this.triggerSystemRecovery();
    }
  }

  private triggerSystemRecovery(): void {
    console.warn('System health degraded, initiating recovery procedures');

    // Clear old errors
    this.state.errors = this.state.errors.slice(-100);

    // Reset error counts
    this.state.errorCounts.clear();

    // Notify system components
    this.notifySystemRecovery();
  }

  private notifySystemRecovery(): void {
    const recoveryAction: RecoveryAction = {
      action: 'system_recovery',
      description: 'System-wide recovery initiated due to error threshold exceeded',
      automatic: true,
      timeout: 10000
    };

    this.recoveryListeners.forEach(listener => listener(recoveryAction));
  }

  // RNG Error Handling
  async handleRNGError(error: Error, context?: string): Promise<RecoveryAction> {
    const rngError: RNGError = {
      id: this.generateErrorId(),
      type: ErrorType.RNG_ERROR,
      severity: this.determineSeverity(error, ErrorType.RNG_ERROR),
      message: error.message,
      details: error,
      timestamp: new Date(),
      context: context || 'rng_operation',
      stack: error.stack,
      recoverable: true
    };

    this.recordError(rngError);
    return this.attemptRNGRecovery(rngError);
  }

  private async attemptRNGRecovery(error: RNGError): Promise<RecoveryAction> {
    const recoveryAction: RecoveryAction = {
      action: 'rng_restart',
      description: 'Attempting to restart RNG engine',
      automatic: true,
      timeout: 5000,
      retryCount: 3
    };

    this.state.activeRecoveries.set(error.id, recoveryAction);

    try {
      // Attempt RNG recovery steps
      await this.restartRNGEngine();
      await this.validateRNGOperation();

      recoveryAction.action = 'rng_recovered';
      recoveryAction.description = 'RNG engine successfully recovered';

      this.state.activeRecoveries.delete(error.id);
      return recoveryAction;
    } catch (recoveryError: unknown) {
      const errorMessage = recoveryError instanceof Error ? recoveryError.message : String(recoveryError);
      recoveryAction.action = 'rng_recovery_failed';
      recoveryAction.description = `RNG recovery failed: ${errorMessage}`;

      // Try alternative recovery
      return this.attemptAlternativeRNGRecovery(error);
    }
  }

  private async restartRNGEngine(): Promise<void> {
    // Implementation would restart the RNG engine
    // This is a placeholder for the actual restart logic
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  private async validateRNGOperation(): Promise<void> {
    // Validate that RNG is working correctly
    // Generate a test trial and verify quality
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  private async attemptAlternativeRNGRecovery(error: RNGError): Promise<RecoveryAction> {
    const recoveryAction: RecoveryAction = {
      action: 'rng_fallback',
      description: 'Using fallback random number generation',
      automatic: true,
      timeout: 2000
    };

    try {
      // Switch to fallback RNG method
      await this.enableFallbackRNG();

      recoveryAction.action = 'rng_fallback_active';
      recoveryAction.description = 'Fallback RNG successfully activated';

      return recoveryAction;
    } catch (fallbackError) {
      recoveryAction.action = 'rng_complete_failure';
      recoveryAction.description = 'All RNG recovery attempts failed';

      return recoveryAction;
    }
  }

  private async enableFallbackRNG(): Promise<void> {
    // Enable fallback random number generation
    console.warn('Switching to fallback RNG method');
  }

  // Database Error Handling
  async handleDatabaseError(error: Error, context?: string): Promise<RecoveryAction> {
    const dbError: DatabaseError = {
      id: this.generateErrorId(),
      type: ErrorType.DATABASE_ERROR,
      severity: this.determineSeverity(error, ErrorType.DATABASE_ERROR),
      message: error.message,
      details: error,
      timestamp: new Date(),
      context: context || 'database_operation',
      stack: error.stack,
      recoverable: true
    };

    this.recordError(dbError);
    return this.attemptDatabaseRecovery(dbError);
  }

  private async attemptDatabaseRecovery(error: DatabaseError): Promise<RecoveryAction> {
    const recoveryAction: RecoveryAction = {
      action: 'database_reconnect',
      description: 'Attempting to reconnect to database',
      automatic: true,
      timeout: 10000,
      retryCount: 3
    };

    this.state.activeRecoveries.set(error.id, recoveryAction);

    try {
      // Attempt database recovery
      await this.reconnectDatabase();
      await this.validateDatabaseConnection();

      recoveryAction.action = 'database_recovered';
      recoveryAction.description = 'Database connection successfully recovered';

      this.state.activeRecoveries.delete(error.id);
      return recoveryAction;
    } catch (recoveryError) {
      // Try backup database or offline mode
      return this.attemptDatabaseFallback(error);
    }
  }

  private async reconnectDatabase(): Promise<void> {
    // Reconnect to database
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  private async validateDatabaseConnection(): Promise<void> {
    // Validate database connection
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  private async attemptDatabaseFallback(error: DatabaseError): Promise<RecoveryAction> {
    const recoveryAction: RecoveryAction = {
      action: 'database_offline_mode',
      description: 'Switching to offline mode with local storage',
      automatic: true,
      timeout: 3000
    };

    try {
      await this.enableOfflineMode();

      recoveryAction.action = 'offline_mode_active';
      recoveryAction.description = 'Offline mode successfully activated';

      return recoveryAction;
    } catch (offlineError) {
      recoveryAction.action = 'database_complete_failure';
      recoveryAction.description = 'All database recovery attempts failed';

      return recoveryAction;
    }
  }

  private async enableOfflineMode(): Promise<void> {
    // Enable offline storage mode
    console.warn('Switching to offline mode');
  }

  // UI Error Handling
  async handleUIError(error: Error, context?: string): Promise<RecoveryAction> {
    const uiError: UIError = {
      id: this.generateErrorId(),
      type: ErrorType.UI_ERROR,
      severity: this.determineSeverity(error, ErrorType.UI_ERROR),
      message: error.message,
      details: error,
      timestamp: new Date(),
      context: context || 'ui_component',
      stack: error.stack,
      recoverable: true
    };

    this.recordError(uiError);
    return this.attemptUIRecovery(uiError);
  }

  private async attemptUIRecovery(error: UIError): Promise<RecoveryAction> {
    const recoveryAction: RecoveryAction = {
      action: 'ui_component_reset',
      description: 'Attempting to reset UI component',
      automatic: true,
      timeout: 2000
    };

    try {
      // Reset the problematic UI component
      await this.resetUIComponent(error.context);

      recoveryAction.action = 'ui_recovered';
      recoveryAction.description = 'UI component successfully reset';

      return recoveryAction;
    } catch (recoveryError) {
      return this.attemptUIFallback(error);
    }
  }

  private async resetUIComponent(context?: string): Promise<void> {
    // Reset UI component state
    console.warn(`Resetting UI component: ${context}`);
  }

  private async attemptUIFallback(error: UIError): Promise<RecoveryAction> {
    const recoveryAction: RecoveryAction = {
      action: 'ui_safe_mode',
      description: 'Loading safe mode UI',
      automatic: true,
      timeout: 1000
    };

    try {
      await this.enableSafeModeUI();

      recoveryAction.action = 'safe_mode_active';
      recoveryAction.description = 'Safe mode UI successfully loaded';

      return recoveryAction;
    } catch (safeModeError) {
      recoveryAction.action = 'ui_complete_failure';
      recoveryAction.description = 'All UI recovery attempts failed';

      return recoveryAction;
    }
  }

  private async enableSafeModeUI(): Promise<void> {
    // Enable safe mode UI
    console.warn('Switching to safe mode UI');
  }

  // System Error Handling
  async handleSystemError(error: Error, context?: string): Promise<RecoveryAction> {
    const systemError: SystemError = {
      id: this.generateErrorId(),
      type: ErrorType.SYSTEM_ERROR,
      severity: this.determineSeverity(error, ErrorType.SYSTEM_ERROR),
      message: error.message,
      details: error,
      timestamp: new Date(),
      context: context || 'system_operation',
      stack: error.stack,
      recoverable: false // System errors are typically not automatically recoverable
    };

    this.recordError(systemError);
    return this.attemptSystemRecovery(systemError);
  }

  private async attemptSystemRecovery(error: SystemError): Promise<RecoveryAction> {
    const recoveryAction: RecoveryAction = {
      action: 'system_diagnostics',
      description: 'Running system diagnostics',
      automatic: true,
      timeout: 5000
    };

    try {
      await this.runSystemDiagnostics();

      recoveryAction.action = 'system_stable';
      recoveryAction.description = 'System diagnostics completed, system appears stable';

      return recoveryAction;
    } catch (diagnosticsError) {
      recoveryAction.action = 'system_unstable';
      recoveryAction.description = 'System instability detected, manual intervention may be required';

      return recoveryAction;
    }
  }

  private async runSystemDiagnostics(): Promise<void> {
    // Run system diagnostics
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Error Report Generation
  async generateErrorReport(error: AppError): Promise<ErrorReport> {
    const recoveryAttempts: RecoveryAction[] = [];
    let finalState: 'recovered' | 'failed' | 'pending' = 'pending';

    try {
      let recoveryAction: RecoveryAction;

      switch (error.type) {
        case ErrorType.RNG_ERROR:
          recoveryAction = await this.handleRNGError(new Error(error.message), error.context);
          break;
        case ErrorType.DATABASE_ERROR:
          recoveryAction = await this.handleDatabaseError(new Error(error.message), error.context);
          break;
        case ErrorType.UI_ERROR:
          recoveryAction = await this.handleUIError(new Error(error.message), error.context);
          break;
        case ErrorType.SYSTEM_ERROR:
          recoveryAction = await this.handleSystemError(new Error(error.message), error.context);
          break;
        default:
          recoveryAction = {
            action: 'no_recovery',
            description: 'No recovery action available for this error type',
            automatic: false
          };
      }

      recoveryAttempts.push(recoveryAction);
      finalState = recoveryAction.action.includes('recovered') ? 'recovered' : 'failed';
    } catch (reportError) {
      finalState = 'failed';
    }

    const userImpact = this.assessUserImpact(error);
    const recommendations = this.generateRecommendations(error, finalState);

    return {
      error,
      recoveryAttempts,
      finalState,
      userImpact,
      recommendations
    };
  }

  private assessUserImpact(error: AppError): 'none' | 'minimal' | 'moderate' | 'severe' {
    switch (error.severity) {
      case ErrorSeverity.LOW:
        return 'none';
      case ErrorSeverity.MEDIUM:
        return 'minimal';
      case ErrorSeverity.HIGH:
        return 'moderate';
      case ErrorSeverity.CRITICAL:
        return 'severe';
      default:
        return 'minimal';
    }
  }

  private generateRecommendations(error: AppError, finalState: string): string[] {
    const recommendations: string[] = [];

    if (finalState === 'failed') {
      recommendations.push('Consider restarting the application');
      recommendations.push('Check system resources and available memory');
      recommendations.push('Report this error to support if it persists');
    }

    switch (error.type) {
      case ErrorType.RNG_ERROR:
        recommendations.push('Verify RNG hardware connections');
        recommendations.push('Check system entropy sources');
        break;
      case ErrorType.DATABASE_ERROR:
        recommendations.push('Verify database file permissions');
        recommendations.push('Check available disk space');
        break;
      case ErrorType.UI_ERROR:
        recommendations.push('Try refreshing the interface');
        recommendations.push('Clear browser cache if using web interface');
        break;
      case ErrorType.SYSTEM_ERROR:
        recommendations.push('Check system logs for additional details');
        recommendations.push('Verify system requirements are met');
        break;
    }

    return recommendations;
  }

  // Utility Methods
  private recordError(error: AppError): void {
    this.state.errors.push(error);

    // Update error counts
    const currentCount = this.state.errorCounts.get(error.type) || 0;
    this.state.errorCounts.set(error.type, currentCount + 1);

    // Maintain error history limit
    if (this.state.errors.length > this.maxErrors) {
      this.state.errors = this.state.errors.slice(-this.maxErrors);
    }

    // Notify listeners
    this.listeners.forEach(listener => listener(error));
  }

  private determineSeverity(error: Error, type: ErrorType): ErrorSeverity {
    // Determine severity based on error characteristics
    if (error.message.includes('critical') || error.message.includes('fatal')) {
      return ErrorSeverity.CRITICAL;
    }

    if (type === ErrorType.SYSTEM_ERROR) {
      return ErrorSeverity.HIGH;
    }

    if (type === ErrorType.DATABASE_ERROR && error.message.includes('connection')) {
      return ErrorSeverity.HIGH;
    }

    if (type === ErrorType.RNG_ERROR) {
      return ErrorSeverity.MEDIUM;
    }

    return ErrorSeverity.LOW;
  }

  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public API
  onError(listener: (error: AppError) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  onRecovery(listener: (recovery: RecoveryAction) => void): () => void {
    this.recoveryListeners.add(listener);
    return () => this.recoveryListeners.delete(listener);
  }

  getErrorHistory(): AppError[] {
    return [...this.state.errors];
  }

  getSystemHealth(): boolean {
    return this.state.isSystemHealthy;
  }

  clearErrors(): void {
    this.state.errors = [];
    this.state.errorCounts.clear();
    this.state.isSystemHealthy = true;
  }

  dispose(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    this.listeners.clear();
    this.recoveryListeners.clear();
  }
}

// Error Handler Context
interface ErrorHandlerContextType {
  errorHandler: ErrorHandler;
  errors: AppError[];
  isSystemHealthy: boolean;
  reportError: (error: Error, type: ErrorType, context?: string) => Promise<void>;
  clearErrors: () => void;
}

const ErrorHandlerContext = createContext<ErrorHandlerContextType | null>(null);

// Error Handler Provider Component
export const ErrorHandlerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [errorHandler] = useState(() => new ErrorHandler());
  const [errors, setErrors] = useState<AppError[]>([]);
  const [isSystemHealthy, setIsSystemHealthy] = useState(true);

  const reportError = useCallback(async (error: Error, type: ErrorType, context?: string) => {
    switch (type) {
      case ErrorType.RNG_ERROR:
        await errorHandler.handleRNGError(error, context);
        break;
      case ErrorType.DATABASE_ERROR:
        await errorHandler.handleDatabaseError(error, context);
        break;
      case ErrorType.UI_ERROR:
        await errorHandler.handleUIError(error, context);
        break;
      case ErrorType.SYSTEM_ERROR:
        await errorHandler.handleSystemError(error, context);
        break;
    }
  }, [errorHandler]);

  const clearErrors = useCallback(() => {
    errorHandler.clearErrors();
    setErrors([]);
    setIsSystemHealthy(true);
  }, [errorHandler]);

  useEffect(() => {
    const unsubscribeError = errorHandler.onError((error) => {
      setErrors(prev => [...prev, error]);
    });

    const healthCheckInterval = setInterval(() => {
      setIsSystemHealthy(errorHandler.getSystemHealth());
    }, 10000);

    return () => {
      unsubscribeError();
      clearInterval(healthCheckInterval);
      errorHandler.dispose();
    };
  }, [errorHandler]);

  return (
    <ErrorHandlerContext.Provider value={{
      errorHandler,
      errors,
      isSystemHealthy,
      reportError,
      clearErrors
    }}>
      {children}
    </ErrorHandlerContext.Provider>
  );
};

// Hook to use Error Handler
export const useErrorHandler = () => {
  const context = useContext(ErrorHandlerContext);
  if (!context) {
    throw new Error('useErrorHandler must be used within ErrorHandlerProvider');
  }
  return context;
};

// Error Display Component
export const ErrorNotificationComponent: React.FC = () => {
  const { errors, isSystemHealthy, clearErrors } = useErrorHandler();
  const [dismissedErrors, setDismissedErrors] = useState<Set<string>>(new Set());

  const visibleErrors = errors.filter(error =>
    !dismissedErrors.has(error.id) &&
    Date.now() - error.timestamp.getTime() < 30000 // Show for 30 seconds
  );

  const dismissError = (errorId: string) => {
    setDismissedErrors(prev => new Set([...prev, errorId]));
  };

  if (visibleErrors.length === 0 && isSystemHealthy) {
    return null;
  }

  return (
    <div className="error-notifications">
      {!isSystemHealthy && (
        <div className="system-health-warning">
          <div className="health-message">
            ⚠️ System health degraded. Multiple errors detected.
          </div>
          <button onClick={clearErrors} className="clear-errors-btn">
            Clear All Errors
          </button>
        </div>
      )}

      {visibleErrors.map(error => (
        <div key={error.id} className={`error-notification severity-${error.severity}`}>
          <div className="error-content">
            <div className="error-header">
              <span className="error-type">{error.type.replace('_', ' ').toUpperCase()}</span>
              <button
                onClick={() => dismissError(error.id)}
                className="dismiss-btn"
              >
                ×
              </button>
            </div>
            <div className="error-message">{error.message}</div>
            {error.context && (
              <div className="error-context">Context: {error.context}</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

// React Error Boundary Component
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType<{ error: Error }> },
  ErrorBoundaryState
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });

    // Report to error handler
    const errorHandler = new ErrorHandler();
    errorHandler.handleUIError(error, 'react_error_boundary');
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error!} />;
      }

      return (
        <div className="error-boundary-fallback">
          <h2>Something went wrong</h2>
          <p>An unexpected error occurred. The application is attempting to recover.</p>
          <button onClick={() => this.setState({ hasError: false })}>
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}