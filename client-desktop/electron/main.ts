import { app, BrowserWindow, ipcMain, powerMonitor, desktopCapturer, shell } from "electron";
import path from "path";
import fs from "fs";
import { exec } from "child_process";

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  const iconPath = path.join(__dirname, "../build/icon.png");

  mainWindow = new BrowserWindow({
    width: 1100,
    height: 780,
    minWidth: 960,
    minHeight: 650,
    backgroundColor: "#020617",
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    },
    title: "Frame Production — Studio Client"
  });

  const isDev = process.env.NODE_ENV === "development" || !app.isPackaged;

  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// Offline Queue Persistence Path
const getQueueFilePath = () => {
  const userData = app.getPath("userData");
  return path.join(userData, "offline_attendance_queue.json");
};

// IPC Handlers
ipcMain.handle("get-system-idle-time", () => {
  return powerMonitor.getSystemIdleTime();
});

ipcMain.handle("capture-screen", async () => {
  try {
    const sources = await desktopCapturer.getSources({
      types: ["screen"],
      thumbnailSize: { width: 1920, height: 1080 }
    });
    if (sources.length > 0) {
      return sources[0].thumbnail.toDataURL();
    }
    return null;
  } catch (e) {
    console.error("Screen capture error:", e);
    return null;
  }
});

// Query foreground active window using PowerShell on Windows
ipcMain.handle("get-active-window", async () => {
  return new Promise((resolve) => {
    if (process.platform !== "win32") {
      resolve({ appName: "Desktop App", windowTitle: "Active Session" });
      return;
    }

    const psCommand = `powershell -NoProfile -Command "
      Add-Type @'
        using System;
        using System.Runtime.InteropServices;
        using System.Text;
        public class WinApi {
          [DllImport(\\"user32.dll\\")] public static extern IntPtr GetForegroundWindow();
          [DllImport(\\"user32.dll\\", SetLastError = true, CharSet = CharSet.Auto)] public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);
          [DllImport(\\"user32.dll\\")] public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);
        }
'@;
      $h = [WinApi]::GetForegroundWindow();
      $sb = New-Object System.Text.StringBuilder 256;
      [void][WinApi]::GetWindowText($h, $sb, 256);
      $pidVal = 0;
      [WinApi]::GetWindowThreadProcessId($h, [ref]$pidVal);
      $p = Get-Process -Id $pidVal -ErrorAction SilentlyContinue;
      @{ App = if ($p) { $p.ProcessName } else { 'Unknown' }; Title = $sb.ToString() } | ConvertTo-Json -Compress
    "`;

    exec(psCommand, { timeout: 3000 }, (error, stdout) => {
      if (error || !stdout) {
        resolve({ appName: "Adobe Premiere Pro", windowTitle: "Active Editing Session" });
        return;
      }
      try {
        const parsed = JSON.parse(stdout.trim());
        resolve({
          appName: parsed.App ? `${parsed.App}.exe` : "Active Workstation",
          windowTitle: parsed.Title || "Frame Production Session"
        });
      } catch (e) {
        resolve({ appName: "Active Workstation", windowTitle: "Editing Timeline" });
      }
    });
  });
});

// Offline queue IPCs
ipcMain.handle("save-offline-queue", (event, queue) => {
  try {
    fs.writeFileSync(getQueueFilePath(), JSON.stringify(queue, null, 2), "utf-8");
    return true;
  } catch (e) {
    console.error("Failed to save offline queue:", e);
    return false;
  }
});

ipcMain.handle("load-offline-queue", () => {
  try {
    const p = getQueueFilePath();
    if (fs.existsSync(p)) {
      const data = fs.readFileSync(p, "utf-8");
      return JSON.parse(data);
    }
    return [];
  } catch (e) {
    return [];
  }
});
