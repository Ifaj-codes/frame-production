import { Router, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { prisma } from "../prisma";
import { AuthRequest, requireAuth, requireAdmin, createAuditLog } from "../middleware/auth";

const router = Router();

// Setup Multer storage for screenshots
const uploadDir = path.join(__dirname, "../../uploads/screenshots");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    const filename = `screen_${Date.now()}_${Math.random().toString(36).substring(7)}${ext}`;
    cb(null, filename);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are permitted"));
    }
  }
});

// POST /api/monitoring/activity - Desktop app syncs active application usage
router.post("/activity", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { activities } = req.body; // Array of { appName, windowTitle, startTime, endTime, durationSeconds, isIdle }

    if (!Array.isArray(activities) || activities.length === 0) {
      res.status(400).json({ error: "Activities array is required" });
      return;
    }

    const created = await prisma.applicationActivity.createMany({
      data: activities.map((a: any) => ({
        userId,
        appName: a.appName || "Unknown Application",
        windowTitle: a.windowTitle || "Active Window",
        startTime: a.startTime ? new Date(a.startTime) : new Date(),
        endTime: a.endTime ? new Date(a.endTime) : new Date(),
        durationSeconds: Number(a.durationSeconds) || 0,
        isIdle: Boolean(a.isIdle)
      }))
    });

    res.json({ success: true, count: created.count });
  } catch (error) {
    console.error("Activity logging error:", error);
    res.status(500).json({ error: "Failed to record activity" });
  }
});

// POST /api/monitoring/screenshot - Desktop app uploads workstation screenshot
router.post("/screenshot", requireAuth, upload.single("screenshot"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    if (!req.file) {
      res.status(400).json({ error: "Screenshot image file is required" });
      return;
    }

    const relativePath = `/uploads/screenshots/${req.file.filename}`;

    const screenshot = await prisma.screenshot.create({
      data: {
        userId,
        storagePath: relativePath,
        capturedAt: req.body.capturedAt ? new Date(req.body.capturedAt) : new Date()
      }
    });

    res.json({ success: true, screenshotId: screenshot.id, path: relativePath });
  } catch (error) {
    console.error("Screenshot upload error:", error);
    res.status(500).json({ error: "Failed to upload screenshot" });
  }
});

// GET /api/monitoring/activity/employee/:id - Admin views application activity breakdown
router.get("/activity/employee/:id", requireAuth, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { date } = req.query;

    const whereClause: any = { userId: id };
    if (date) {
      const dStart = new Date(String(date) + "T00:00:00.000Z");
      const dEnd = new Date(String(date) + "T23:59:59.999Z");
      whereClause.startTime = { gte: dStart, lte: dEnd };
    }

    const activities = await prisma.applicationActivity.findMany({
      where: whereClause,
      orderBy: { startTime: "desc" },
      take: 100
    });

    // Aggregate durations per app
    const appDurations: Record<string, { durationSeconds: number; idleSeconds: number }> = {};
    for (const a of activities) {
      if (!appDurations[a.appName]) {
        appDurations[a.appName] = { durationSeconds: 0, idleSeconds: 0 };
      }
      appDurations[a.appName].durationSeconds += a.durationSeconds;
      if (a.isIdle) {
        appDurations[a.appName].idleSeconds += a.durationSeconds;
      }
    }

    res.json({
      totalCount: activities.length,
      appSummary: appDurations,
      timeline: activities
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch employee activity" });
  }
});

// GET /api/monitoring/screenshots/employee/:id - Admin views screenshots
router.get("/screenshots/employee/:id", requireAuth, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;

    const screenshots = await prisma.screenshot.findMany({
      where: { userId: id },
      orderBy: { capturedAt: "desc" },
      take: 30
    });

    // Mark as viewed and log audit access
    await prisma.screenshot.updateMany({
      where: { userId: id, isViewed: false },
      data: { isViewed: true, viewerId: req.user!.id }
    });

    await createAuditLog(req.user!.id, req.user!.username, "VIEW_SCREENSHOTS", "MONITORING", id, { count: screenshots.length }, req.ip as string);

    res.json(screenshots);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch screenshots" });
  }
});

export default router;
