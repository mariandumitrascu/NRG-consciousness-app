/**
 * Main Application Component
 * Integrates all UI components with routing and state management
 */

import React, { useEffect } from 'react';
import { AppProvider, useAppContext } from './store/AppContext';
import Header from './components/Layout/Header';
import MainNavigation from './components/Navigation/MainNavigation';
import Dashboard from './views/Dashboard/Dashboard';
import SessionModeView from './views/SessionMode/SessionModeView';
import { ContinuousView } from './views/ContinuousMode/ContinuousView';

// Import styles
import './styles/globals.css';
import './views/Dashboard/Dashboard.css';

const Analysis: React.FC = () => (
  <div className="view-placeholder">
    <h2>Analysis</h2>
    <p>Statistical analysis and visualization coming in Phase 7</p>
  </div>
);

const Calibration: React.FC = () => (
  <div className="view-placeholder">
    <h2>Calibration</h2>
    <p>RNG calibration and testing coming in Phase 8</p>
  </div>
);

const History: React.FC = () => (
  <div className="view-placeholder">
    <h2>History</h2>
    <p>Session history and data export coming in Phase 9</p>
  </div>
);

// Main application content
const AppContent: React.FC = () => {
  const { state, dispatch } = useAppContext();

  // Mock data updates for demonstration
  useEffect(() => {
    const updateMockData = () => {
      dispatch({
        type: 'SET_RNG_ENGINE_STATUS',
        payload: {
          isRunning: true,
          currentRate: 200.0 + (Math.random() - 0.5) * 10,
          targetRate: 200.0,
          memoryUsage: {
            current: 45.2 + Math.random() * 5,
            peak: 52.8 + Math.random() * 2
          },
          timingMetrics: {
            averageError: Math.random() * 0.5,
            maxError: Math.random() * 2,
            missedIntervals: Math.floor(Math.random() * 3)
          }
        }
      });

      dispatch({
        type: 'SET_DATABASE_STATUS',
        payload: {
          connected: true,
          version: '3.0.0',
          size: 125.4 + Math.random() * 0.1,
          lastBackup: new Date()
        }
      });

      dispatch({
        type: 'SET_SYSTEM_HEALTH',
        payload: {
          rngEngine: 'healthy',
          database: 'healthy',
          overall: 'healthy',
          lastCheck: new Date()
        }
      });

      dispatch({
        type: 'INCREMENT_TRIAL_COUNT'
      });
    };

    // Initial update
    updateMockData();

    // Update every 2 seconds for demonstration
    const interval = setInterval(updateMockData, 2000);

    return () => clearInterval(interval);
  }, [dispatch]);

  // Render the appropriate view based on current navigation
  const renderCurrentView = () => {
    switch (state.currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'session-mode':
        return <SessionModeView />;
      case 'continuous-mode':
        return <ContinuousView />;
      case 'analysis':
        return <Analysis />;
      case 'calibration':
        return <Calibration />;
      case 'history':
        return <History />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="app">
      <Header title="RNG Consciousness Experiment" />

      <div className="app__main">
        <MainNavigation />

        <main className="app__content">
          {renderCurrentView()}
        </main>
      </div>
    </div>
  );
};

// Main App component with providers
const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;