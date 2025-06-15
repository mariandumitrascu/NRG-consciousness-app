/**
 * Main Application Component
 * Integrates all UI components with routing and state management
 */

import React, { useEffect } from 'react';
import { AppProvider, useAppContext } from './store/AppContext';
import Header from './components/Layout/Header';
import MainNavigation from './components/Navigation/MainNavigation';
import Dashboard from './views/Dashboard/Dashboard';

// Import styles
import './styles/globals.css';
import './views/Dashboard/Dashboard.css';

// Placeholder components for other views
const SessionExperiments: React.FC = () => (
  <div className="view-placeholder">
    <h2>Session Experiments</h2>
    <p>Intention-based RNG experiments coming in Phase 5</p>
  </div>
);

const ContinuousMonitoring: React.FC = () => (
  <div className="view-placeholder">
    <h2>Continuous Monitoring</h2>
    <p>24/7 consciousness monitoring coming in Phase 6</p>
  </div>
);

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
        type: 'UPDATE_RNG_STATUS',
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
        type: 'UPDATE_DATABASE_STATUS',
        payload: {
          connected: true,
          size: 125.4 + Math.random() * 0.1,
          lastBackup: new Date()
        }
      });

      dispatch({
        type: 'UPDATE_SYSTEM_HEALTH',
        payload: {
          overall: 'healthy',
          lastCheck: new Date()
        }
      });

      dispatch({
        type: 'INCREMENT_TRIAL_COUNT',
        payload: Math.floor(Math.random() * 3) + 1
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
      case 'sessions':
        return <SessionExperiments />;
      case 'monitoring':
        return <ContinuousMonitoring />;
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
      <Header />

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