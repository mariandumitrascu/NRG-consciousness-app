/**
 * Global Application State Management
 * Provides centralized state management for the RNG Consciousness Research App
 */

import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import {
  ExperimentSession,
  IntentionPeriod,
  EngineStatus,
  RNGTrial
} from '@/shared/types';

// View types for navigation
export type AppView =
  | 'dashboard'
  | 'session-mode'
  | 'continuous-mode'
  | 'analysis'
  | 'calibration'
  | 'history';

// System health status
export interface SystemHealthStatus {
  rngEngine: 'healthy' | 'warning' | 'error';
  database: 'healthy' | 'warning' | 'error';
  overall: 'healthy' | 'warning' | 'error';
  lastCheck: Date;
}

// Database connection status
export interface DatabaseStatus {
  connected: boolean;
  version: string;
  size: number;
  lastBackup: Date | null;
  errorMessage?: string;
}

// Application state interface
export interface AppState {
  // Navigation
  currentView: AppView;
  previousView: AppView | null;

  // Engine status
  rngEngineStatus: EngineStatus | null;

  // Database status
  databaseStatus: DatabaseStatus | null;

  // Active experiments
  currentSession: ExperimentSession | null;
  currentIntentionPeriod: IntentionPeriod | null;

  // System health
  systemHealth: SystemHealthStatus;

  // Real-time data
  latestTrial: RNGTrial | null;
  trialCount: number;

  // UI state
  sidebarCollapsed: boolean;
  modalOpen: string | null;

  // Error handling
  error: string | null;

  // Loading states
  loading: {
    app: boolean;
    engine: boolean;
    database: boolean;
    session: boolean;
  };
}

// Action types
export type AppAction =
  | { type: 'SET_VIEW'; payload: AppView }
  | { type: 'SET_RNG_ENGINE_STATUS'; payload: EngineStatus }
  | { type: 'SET_DATABASE_STATUS'; payload: DatabaseStatus }
  | { type: 'SET_CURRENT_SESSION'; payload: ExperimentSession | null }
  | { type: 'SET_CURRENT_INTENTION_PERIOD'; payload: IntentionPeriod | null }
  | { type: 'SET_SYSTEM_HEALTH'; payload: SystemHealthStatus }
  | { type: 'SET_LATEST_TRIAL'; payload: RNGTrial }
  | { type: 'INCREMENT_TRIAL_COUNT' }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_MODAL'; payload: string | null }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_LOADING'; payload: { key: keyof AppState['loading']; value: boolean } }
  | { type: 'CLEAR_ERROR' }
  | { type: 'RESET_STATE' };

// Initial state
const initialState: AppState = {
  currentView: 'dashboard',
  previousView: null,
  rngEngineStatus: null,
  databaseStatus: null,
  currentSession: null,
  currentIntentionPeriod: null,
  systemHealth: {
    rngEngine: 'healthy',
    database: 'healthy',
    overall: 'healthy',
    lastCheck: new Date()
  },
  latestTrial: null,
  trialCount: 0,
  sidebarCollapsed: false,
  modalOpen: null,
  error: null,
  loading: {
    app: true,
    engine: false,
    database: false,
    session: false
  }
};

// Reducer function
const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_VIEW':
      return {
        ...state,
        previousView: state.currentView,
        currentView: action.payload
      };

    case 'SET_RNG_ENGINE_STATUS':
      return {
        ...state,
        rngEngineStatus: action.payload,
        systemHealth: {
          ...state.systemHealth,
          rngEngine: action.payload.isRunning ? 'healthy' : 'warning',
          overall: calculateOverallHealth(
            action.payload.isRunning ? 'healthy' : 'warning',
            state.systemHealth.database
          ),
          lastCheck: new Date()
        }
      };

    case 'SET_DATABASE_STATUS':
      return {
        ...state,
        databaseStatus: action.payload,
        systemHealth: {
          ...state.systemHealth,
          database: action.payload.connected ? 'healthy' : 'error',
          overall: calculateOverallHealth(
            state.systemHealth.rngEngine,
            action.payload.connected ? 'healthy' : 'error'
          ),
          lastCheck: new Date()
        }
      };

    case 'SET_CURRENT_SESSION':
      return {
        ...state,
        currentSession: action.payload
      };

    case 'SET_CURRENT_INTENTION_PERIOD':
      return {
        ...state,
        currentIntentionPeriod: action.payload
      };

    case 'SET_SYSTEM_HEALTH':
      return {
        ...state,
        systemHealth: action.payload
      };

    case 'SET_LATEST_TRIAL':
      return {
        ...state,
        latestTrial: action.payload
      };

    case 'INCREMENT_TRIAL_COUNT':
      return {
        ...state,
        trialCount: state.trialCount + 1
      };

    case 'TOGGLE_SIDEBAR':
      return {
        ...state,
        sidebarCollapsed: !state.sidebarCollapsed
      };

    case 'SET_MODAL':
      return {
        ...state,
        modalOpen: action.payload
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload
      };

    case 'SET_LOADING':
      return {
        ...state,
        loading: {
          ...state.loading,
          [action.payload.key]: action.payload.value
        }
      };

    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };

    case 'RESET_STATE':
      return {
        ...initialState,
        loading: { ...initialState.loading, app: false }
      };

    default:
      return state;
  }
};

// Helper function to calculate overall system health
const calculateOverallHealth = (
  rngHealth: 'healthy' | 'warning' | 'error',
  dbHealth: 'healthy' | 'warning' | 'error'
): 'healthy' | 'warning' | 'error' => {
  if (rngHealth === 'error' || dbHealth === 'error') return 'error';
  if (rngHealth === 'warning' || dbHealth === 'warning') return 'warning';
  return 'healthy';
};

// Context interface
interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;

  // Navigation helpers
  navigateTo: (view: AppView) => void;
  goBack: () => void;

  // System status helpers
  updateEngineStatus: (status: EngineStatus) => void;
  updateDatabaseStatus: (status: DatabaseStatus) => void;

  // Session management
  startSession: (session: ExperimentSession) => void;
  endSession: () => void;

  // Intention period management
  startIntentionPeriod: (period: IntentionPeriod) => void;
  endIntentionPeriod: () => void;

  // Real-time data
  addTrial: (trial: RNGTrial) => void;

  // Error handling
  setError: (error: string) => void;
  clearError: () => void;

  // Loading states
  setLoading: (key: keyof AppState['loading'], value: boolean) => void;

  // UI helpers
  toggleSidebar: () => void;
  openModal: (modalId: string) => void;
  closeModal: () => void;
}

// Create context
const AppContext = createContext<AppContextType | null>(null);

// Provider component
export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Navigation helpers
  const navigateTo = useCallback((view: AppView) => {
    dispatch({ type: 'SET_VIEW', payload: view });
  }, []);

  const goBack = useCallback(() => {
    if (state.previousView) {
      dispatch({ type: 'SET_VIEW', payload: state.previousView });
    }
  }, [state.previousView]);

  // System status helpers
  const updateEngineStatus = useCallback((status: EngineStatus) => {
    dispatch({ type: 'SET_RNG_ENGINE_STATUS', payload: status });
  }, []);

  const updateDatabaseStatus = useCallback((status: DatabaseStatus) => {
    dispatch({ type: 'SET_DATABASE_STATUS', payload: status });
  }, []);

  // Session management
  const startSession = useCallback((session: ExperimentSession) => {
    dispatch({ type: 'SET_CURRENT_SESSION', payload: session });
  }, []);

  const endSession = useCallback(() => {
    dispatch({ type: 'SET_CURRENT_SESSION', payload: null });
  }, []);

  // Intention period management
  const startIntentionPeriod = useCallback((period: IntentionPeriod) => {
    dispatch({ type: 'SET_CURRENT_INTENTION_PERIOD', payload: period });
  }, []);

  const endIntentionPeriod = useCallback(() => {
    dispatch({ type: 'SET_CURRENT_INTENTION_PERIOD', payload: null });
  }, []);

  // Real-time data
  const addTrial = useCallback((trial: RNGTrial) => {
    dispatch({ type: 'SET_LATEST_TRIAL', payload: trial });
    dispatch({ type: 'INCREMENT_TRIAL_COUNT' });
  }, []);

  // Error handling
  const setError = useCallback((error: string) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  // Loading states
  const setLoading = useCallback((key: keyof AppState['loading'], value: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: { key, value } });
  }, []);

  // UI helpers
  const toggleSidebar = useCallback(() => {
    dispatch({ type: 'TOGGLE_SIDEBAR' });
  }, []);

  const openModal = useCallback((modalId: string) => {
    dispatch({ type: 'SET_MODAL', payload: modalId });
  }, []);

  const closeModal = useCallback(() => {
    dispatch({ type: 'SET_MODAL', payload: null });
  }, []);

  // Auto-clear errors after 5 seconds
  useEffect(() => {
    if (state.error) {
      const timer = setTimeout(() => {
        clearError();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [state.error, clearError]);

  // Initialize app loading state
  useEffect(() => {
    // Simulate initial app loading
    const timer = setTimeout(() => {
      setLoading('app', false);
    }, 1000);
    return () => clearTimeout(timer);
  }, [setLoading]);

  const contextValue: AppContextType = {
    state,
    dispatch,
    navigateTo,
    goBack,
    updateEngineStatus,
    updateDatabaseStatus,
    startSession,
    endSession,
    startIntentionPeriod,
    endIntentionPeriod,
    addTrial,
    setError,
    clearError,
    setLoading,
    toggleSidebar,
    openModal,
    closeModal
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook to use app context
export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

export default AppContext;