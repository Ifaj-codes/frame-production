import { api } from "../api";

let activityTimer: any = null;
let screenshotTimer: any = null;

// Helper to convert Base64 dataURL to Blob
function dataURLtoBlob(dataurl: string): Blob {
  const arr = dataurl.split(",");
  const mime = arr[0].match(/:(.*?);/)![1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

export function startMonitoring(isClockedIn: boolean) {
  stopMonitoring();
  if (!isClockedIn) return;

  console.log("[Monitoring] Starting workstation activity telemetry & screenshot scheduler...");

  // 1. Application activity check every 30 seconds
  activityTimer = setInterval(async () => {
    if (!window.electronAPI) return;

    try {
      const idleSeconds = await window.electronAPI.getIdleTime();
      const isIdle = idleSeconds > 300; // 5 min idle threshold
      const win = await window.electronAPI.getActiveWindow();

      const activity = {
        appName: win.appName || "Adobe Premiere Pro.exe",
        windowTitle: win.windowTitle || "Active Editing Timeline",
        startTime: new Date(Date.now() - 30000).toISOString(),
        endTime: new Date().toISOString(),
        durationSeconds: 30,
        isIdle
      };

      await api.post("/monitoring/activity", { activities: [activity] });
    } catch (e) {
      // offline or server unreachable - silent
    }
  }, 30000);

  // 2. Screenshot capture every 10 minutes
  screenshotTimer = setInterval(async () => {
    if (!window.electronAPI) return;

    try {
      const dataUrl = await window.electronAPI.captureScreen();
      if (!dataUrl) return;

      const blob = dataURLtoBlob(dataUrl);
      const formData = new FormData();
      formData.append("screenshot", blob, `screen_${Date.now()}.png`);
      formData.append("capturedAt", new Date().toISOString());

      await api.post("/monitoring/screenshot", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
    } catch (e) {
      // silent
    }
  }, 10 * 60 * 1000);
}

export function stopMonitoring() {
  if (activityTimer) clearInterval(activityTimer);
  if (screenshotTimer) clearInterval(screenshotTimer);
  activityTimer = null;
  screenshotTimer = null;
}
