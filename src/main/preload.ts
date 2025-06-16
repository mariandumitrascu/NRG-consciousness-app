import { contextBridge } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    // Placeholder for future IPC methods
    // Will be implemented in Phase 1
});

// Context bridge setup complete
// Note: window object is not available in the preload script context
// DOM-related code should be moved to the renderer process