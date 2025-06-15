import { contextBridge } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    // Placeholder for future IPC methods
    // Will be implemented in Phase 1
});

// Prevent the renderer process from accessing Node.js APIs
window.addEventListener('DOMContentLoaded', () => {
    // Additional security measures will be added here
});