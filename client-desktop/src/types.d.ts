export interface ElectronAPI {
  getIdleTime: () => Promise<number>;
  captureScreen: () => Promise<string | null>;
  getActiveWindow: () => Promise<{ appName: string; windowTitle: string }>;
  saveOfflineQueue: (queue: any[]) => Promise<boolean>;
  loadOfflineQueue: () => Promise<any[]>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
