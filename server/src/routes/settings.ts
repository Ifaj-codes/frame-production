import { Router, Response } from "express";
import os from "os";
import { prisma } from "../prisma";
import { AuthRequest, requireAuth, requireAdmin, requireDeveloper, createAuditLog } from "../middleware/auth";
import { broadcast } from "../websocket";

const router = Router();

// GET /api/settings/branding - Public or Auth
router.get("/branding", async (req, res): Promise<void> => {
  try {
    const branding = await prisma.appBranding.findUnique({ where: { id: "singleton" } });
    res.json({
      appName: branding?.appName || "Frame Production",
      logoUrl: branding?.logoUrl || "/assets/logo.png",
      companySubtitle: branding?.companySubtitle || "Video Editing & Production Agency",
      breakRules: branding?.breakRulesJson ? JSON.parse(branding.breakRulesJson) : {},
      monitoringConfig: branding?.monitoringConfig ? JSON.parse(branding.monitoringConfig) : {}
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch branding" });
  }
});

// PUT /api/settings/branding - Developer only
router.put("/branding", requireAuth, requireDeveloper, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { appName, logoUrl, companySubtitle, breakRules, monitoringConfig } = req.body;

    const updated = await prisma.appBranding.upsert({
      where: { id: "singleton" },
      update: {
        appName: appName || undefined,
        logoUrl: logoUrl || undefined,
        companySubtitle: companySubtitle || undefined,
        breakRulesJson: breakRules ? JSON.stringify(breakRules) : undefined,
        monitoringConfig: monitoringConfig ? JSON.stringify(monitoringConfig) : undefined
      },
      create: {
        id: "singleton",
        appName: appName || "Frame Production",
        logoUrl: logoUrl || "/assets/logo.png",
        companySubtitle: companySubtitle || "Video Editing & Production Agency",
        breakRulesJson: breakRules ? JSON.stringify(breakRules) : null,
        monitoringConfig: monitoringConfig ? JSON.stringify(monitoringConfig) : null
      }
    });

    broadcast("BRANDING_UPDATED", {
      appName: updated.appName,
      logoUrl: updated.logoUrl,
      companySubtitle: updated.companySubtitle
    });

    await createAuditLog(req.user!.id, req.user!.username, "UPDATE_BRANDING", "BRANDING", "singleton", { appName, logoUrl }, req.ip as string);

    res.json({ success: true, message: "Application branding updated successfully", branding: updated });
  } catch (error) {
    res.status(500).json({ error: "Failed to update branding" });
  }
});

// GET /api/settings/audit-logs - Admin & Developer audit logs
router.get("/audit-logs", requireAuth, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { action, targetResource, limit } = req.query;

    const whereClause: any = {};
    if (action) whereClause.action = String(action);
    if (targetResource) whereClause.targetResource = String(targetResource);

    const logs = await prisma.auditLog.findMany({
      where: whereClause,
      include: {
        actor: { select: { id: true, username: true, fullName: true, role: true } }
      },
      orderBy: { timestamp: "desc" },
      take: limit ? Number(limit) : 100
    });

    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch audit logs" });
  }
});

// GET /api/settings/system-health - System status & diagnostic stats
router.get("/system-health", requireAuth, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const totalUsers = await prisma.user.count();
    const totalSessions = await prisma.attendanceSession.count();
    const totalAuditLogs = await prisma.auditLog.count();
    const offlineSyncedSessions = await prisma.attendanceSession.count({ where: { isOfflineRecorded: true } });

    res.json({
      status: "HEALTHY",
      uptimeSeconds: Math.round(process.uptime()),
      system: {
        platform: os.platform(),
        release: os.release(),
        totalMemoryMB: Math.round(os.totalmem() / (1024 * 1024)),
        freeMemoryMB: Math.round(os.freemem() / (1024 * 1024)),
        nodeVersion: process.version
      },
      database: {
        engine: "SQLite (dev.db) / PostgreSQL Compatible",
        totalUsers,
        totalAttendanceSessions: totalSessions,
        offlineSyncedSessions,
        totalAuditLogs
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve system health" });
  }
});

export default router;
