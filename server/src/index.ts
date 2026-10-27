import express from "express";
import http from "http";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

import { initWebSocketServer } from "./websocket";
import authRoutes from "./routes/auth";
import attendanceRoutes from "./routes/attendance";
import breaksRoutes from "./routes/breaks";
import leavesRoutes from "./routes/leaves";
import exitsRoutes from "./routes/exits";
import employeesRoutes from "./routes/employees";
import monitoringRoutes from "./routes/monitoring";
import reportsRoutes from "./routes/reports";
import settingsRoutes from "./routes/settings";

const app = express();
const server = http.createServer(app);

// Initialize WebSockets
initWebSocketServer(server);

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

// Static uploads directory for screenshots and avatars
const uploadsDir = path.join(__dirname, "../uploads");
app.use("/uploads", express.static(uploadsDir));

// Static public assets (e.g. logos, branding)
const assetsDir = path.join(__dirname, "../public/assets");
app.use("/assets", express.static(assetsDir));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/breaks", breaksRoutes);
app.use("/api/leaves", leavesRoutes);
app.use("/api/exits", exitsRoutes);
app.use("/api/employees", employeesRoutes);
app.use("/api/monitoring", monitoringRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/settings", settingsRoutes);

// Root health ping
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    service: "Frame Production Central API",
    version: "1.0.0",
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🎬 Frame Production Central Server running on http://localhost:${PORT}`);
  console.log(`📡 WebSocket Gateway ready at ws://localhost:${PORT}/ws`);
  console.log(`=======================================================`);
});

export { app, server };
