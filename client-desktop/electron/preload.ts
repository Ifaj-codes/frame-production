import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  getIdleTime: (): Promise<number> => ipcRenderer.invoke("get-system-idle-time"),
  captureScreen: (): Promise<string | null> => ipcRenderer.invoke("capture-screen"),
  getActiveWindow: (): Promise<{ appName: string; windowTitle: string }> =>
    ipcRenderer.invoke("get-active-window"),
  saveOfflineQueue: (queue: any[]): Promise<boolean> =>
    ipcRenderer.invoke("save-offline-queue", queue),
  loadOfflineQueue: (): Promise<any[]> => ipcRenderer.invoke("load-offline-queue")
});
