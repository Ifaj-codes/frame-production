import { Router, Response } from "express";
import { prisma } from "../prisma";
import { AuthRequest, requireAuth, requireAdmin, createAuditLog } from "../middleware/auth";
import { broadcast } from "../websocket";

const router = Router();

// Helper to format Date to YYYY-MM-DD
function getLocalDateString(d: Date = new Date()): string {
  return d.toISOString().split("T")[0];
}

// GET /api/attendance/today - Get current user's today status
router.get("/today", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const today = getLocalDateString();

    const session = await prisma.attendanceSession.findFirst({
      where: { userId, date: today },
      orderBy: { clockInTime: "desc" }
    });

    const activeBreak = await prisma.breakRequest.findFirst({
      where: {
        userId,
        status: "APPROVED",
        startTime: { not: null },
        endTime: null
      },
      include: { breakType: true }
    });

    res.json({
      date: today,
      isClockedIn: !!(session && !session.clockOutTime),
      session: session || null,
      activeBreak: activeBreak || null
    });
  } catch (error) {
    console.error("Attendance today error:", error);
    res.status(500).json({ error: "Failed to fetch today attendance" });
  }
});

// POST /api/attendance/clock-in
router.post("/clock-in", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const today = getLocalDateString();
    const now = new Date();

    // Check if already clocked in today without clock out
    const existing = await prisma.attendanceSession.findFirst({
      where: { userId, date: today, clockOutTime: null }
    });

    if (existing) {
      res.status(400).json({ error: "You are already clocked in for today", session: existing });
      return;
    }

    // Check user's schedule to determine if late
    const schedule = await prisma.workSchedule.findFirst({ where: { userId } });
    let status = "PRESENT";
    if (schedule && schedule.startTime) {
      const [schedHours, schedMins] = schedule.startTime.split(":").map(Number);
      const grace = schedule.gracePeriodMinutes || 15;
      const scheduledLimit = new Date(now);
      scheduledLimit.setHours(schedHours, schedMins + grace, 0, 0);

      if (now > scheduledLimit) {
        status = "LATE";
      }
    }

    const session = await prisma.attendanceSession.create({
      data: {
        userId,
        date: today,
        clockInTime: now,
        status,
        isOfflineRecorded: false,
        syncedAt: now
      }
    });

    broadcast("ATTENDANCE_PUNCH", {
      type: "CLOCK_IN",
      userId,
      employeeName: req.user!.fullName,
      time: now,
      status
    });

    await createAuditLog(userId, req.user!.username, "ATTENDANCE_CLOCK_IN", "ATTENDANCE", session.id, { status, time: now }, req.ip);

    res.json({ success: true, message: "Clocked in successfully", session });
  } catch (error) {
    console.error("Clock in error:", error);
    res.status(500).json({ error: "Clock in failed" });
  }
});

// POST /api/attendance/clock-out
router.post("/clock-out", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const today = getLocalDateString();
    const now = new Date();

    const session = await prisma.attendanceSession.findFirst({
      where: { userId, date: today, clockOutTime: null },
      orderBy: { clockInTime: "desc" }
    });

    if (!session) {
      res.status(400).json({ error: "No active clock-in session found to clock out from" });
      return;
    }

    const elapsedMs = now.getTime() - new Date(session.clockInTime).getTime();
    const totalElapsedMins = Math.max(0, Math.round(elapsedMs / (1000 * 60)));
    const netWorkMinutes = Math.max(0, totalElapsedMins - session.breakDeductedMins);

    const updated = await prisma.attendanceSession.update({
      where: { id: session.id },
      data: {
        clockOutTime: now,
        totalElapsedMinutes: totalElapsedMins,
        netWorkMinutes: netWorkMinutes
      }
    });

    broadcast("ATTENDANCE_PUNCH", {
      type: "CLOCK_OUT",
      userId,
      employeeName: req.user!.fullName,
      time: now,
      totalElapsedMins,
      netWorkMinutes
    });

    await createAuditLog(userId, req.user!.username, "ATTENDANCE_CLOCK_OUT", "ATTENDANCE", session.id, { totalElapsedMins, netWorkMinutes }, req.ip);

    res.json({ success: true, message: "Clocked out successfully", session: updated });
  } catch (error) {
    console.error("Clock out error:", error);
    res.status(500).json({ error: "Clock out failed" });
  }
});

// POST /api/attendance/sync-offline - Offline batch synchronization
router.post("/sync-offline", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { events } = req.body; // Array of { eventType: 'CLOCK_IN'|'CLOCK_OUT', timestamp: string, date: string, clientEventId: string }

    if (!Array.isArray(events) || events.length === 0) {
      res.status(400).json({ error: "No offline events provided for sync" });
      return;
    }

    const syncedResults = [];

    for (const evt of events) {
      const eventTime = new Date(evt.timestamp);
      const eventDate = evt.date || getLocalDateString(eventTime);

      if (evt.eventType === "CLOCK_IN") {
        // Check if session for this day already exists
        let session = await prisma.attendanceSession.findFirst({
          where: { userId, date: eventDate }
        });

        if (!session) {
          session = await prisma.attendanceSession.create({
            data: {
              userId,
              date: eventDate,
              clockInTime: eventTime,
              status: "PRESENT",
              isOfflineRecorded: true,
              clientRecordedAt: eventTime,
              syncedAt: new Date()
            }
          });
        }
        syncedResults.push({ clientEventId: evt.clientEventId, status: "SYNCED", sessionId: session.id });
      } else if (evt.eventType === "CLOCK_OUT") {
        const session = await prisma.attendanceSession.findFirst({
          where: { userId, date: eventDate },
          orderBy: { clockInTime: "desc" }
        });

        if (session && !session.clockOutTime) {
          const elapsedMs = eventTime.getTime() - new Date(session.clockInTime).getTime();
          const totalElapsedMins = Math.max(0, Math.round(elapsedMs / (1000 * 60)));
          const netWorkMinutes = Math.max(0, totalElapsedMins - session.breakDeductedMins);

          const updated = await prisma.attendanceSession.update({
            where: { id: session.id },
            data: {
              clockOutTime: eventTime,
              totalElapsedMinutes: totalElapsedMins,
              netWorkMinutes,
              isOfflineRecorded: true,
              syncedAt: new Date()
            }
          });
          syncedResults.push({ clientEventId: evt.clientEventId, status: "SYNCED", sessionId: updated.id });
        } else {
          syncedResults.push({ clientEventId: evt.clientEventId, status: "ALREADY_CLOSED_OR_SKIPPED" });
        }
      }
    }

    await createAuditLog(userId, req.user!.username, "OFFLINE_SYNC", "ATTENDANCE", userId, { count: syncedResults.length }, req.ip);

    res.json({
      success: true,
      syncedCount: syncedResults.length,
      syncedResults
    });
  } catch (error) {
    console.error("Offline sync error:", error);
    res.status(500).json({ error: "Offline synchronization failed" });
  }
});

// GET /api/attendance/search - Admin & Developer Attendance Date Search
router.get("/search", requireAuth, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { date, startDate, endDate, employeeId, status, query } = req.query;

    const whereClause: any = {};

    if (date) {
      whereClause.date = String(date);
    } else if (startDate && endDate) {
      whereClause.date = {
        gte: String(startDate),
        lte: String(endDate)
      };
    } else if (startDate) {
      whereClause.date = { gte: String(startDate) };
    } else {
      whereClause.date = getLocalDateString();
    }

    if (employeeId) {
      whereClause.userId = String(employeeId);
    }

    if (status && status !== "ALL") {
      whereClause.status = String(status);
    }

    if (query) {
      whereClause.user = {
        OR: [
          { fullName: { contains: String(query) } },
          { username: { contains: String(query) } }
        ]
      };
    }

    const sessions = await prisma.attendanceSession.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            jobTitle: true,
            avatarUrl: true,
            workstationId: true
          }
        }
      },
      orderBy: [{ date: "desc" }, { clockInTime: "asc" }]
    });

    res.json({
      count: sessions.length,
      sessions
    });
  } catch (error) {
    console.error("Attendance search error:", error);
    res.status(500).json({ error: "Failed to search attendance records" });
  }
});

// POST /api/attendance/:id/correct - Admin Manual Correction
router.post("/:id/correct", requireAuth, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { clockInTime, clockOutTime, status, reason } = req.body;

    if (!reason) {
      res.status(400).json({ error: "Reason is required for manual attendance correction" });
      return;
    }

    const existing = await prisma.attendanceSession.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: "Attendance session not found" });
      return;
    }

    const inTime = clockInTime ? new Date(clockInTime) : existing.clockInTime;
    const outTime = clockOutTime ? new Date(clockOutTime) : existing.clockOutTime;

    let totalElapsedMins = existing.totalElapsedMinutes;
    let netWorkMinutes = existing.netWorkMinutes;

    if (inTime && outTime) {
      const ms = outTime.getTime() - inTime.getTime();
      totalElapsedMins = Math.max(0, Math.round(ms / (1000 * 60)));
      netWorkMinutes = Math.max(0, totalElapsedMins - existing.breakDeductedMins);
    }

    // Append to corrections history
    const existingHistory = existing.correctionsHistory ? JSON.parse(existing.correctionsHistory) : [];
    existingHistory.push({
      correctedBy: req.user!.username,
      correctedAt: new Date().toISOString(),
      reason,
      prev: { clockIn: existing.clockInTime, clockOut: existing.clockOutTime, status: existing.status },
      updated: { clockIn: inTime, clockOut: outTime, status: status || existing.status }
    });

    const updated = await prisma.attendanceSession.update({
      where: { id },
      data: {
        clockInTime: inTime,
        clockOutTime: outTime,
        status: status || existing.status,
        totalElapsedMinutes: totalElapsedMins,
        netWorkMinutes,
        correctionsHistory: JSON.stringify(existingHistory)
      }
    });

    await createAuditLog(req.user!.id, req.user!.username, "ATTENDANCE_CORRECTION", "ATTENDANCE", id, { reason, updated }, req.ip as string);

    res.json({ success: true, message: "Attendance corrected successfully", session: updated });
  } catch (error) {
    console.error("Attendance correction error:", error);
    res.status(500).json({ error: "Failed to correct attendance" });
  }
});

// POST /api/attendance/manual-create - Admin records a missed punch
router.post("/manual-create", requireAuth, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId, date, clockInTime, clockOutTime, status, reason } = req.body;
    if (!userId || !date || !clockInTime) {
      res.status(400).json({ error: "User, date, and clock in time are required" });
      return;
    }
    const inTime = new Date(clockInTime);
    const outTime = clockOutTime ? new Date(clockOutTime) : null;
    let totalElapsedMinutes = 0;
    if (outTime) {
      totalElapsedMinutes = Math.max(0, Math.round((outTime.getTime() - inTime.getTime()) / (1000 * 60)));
    }
    const session = await prisma.attendanceSession.create({
      data: {
        userId,
        date,
        clockInTime: inTime,
        clockOutTime: outTime,
        totalElapsedMinutes,
        netWorkMinutes: totalElapsedMinutes,
        status: status || "PRESENT",
        isOfflineRecorded: false,
        correctionsHistory: JSON.stringify([{
          correctedBy: req.user!.username,
          correctedAt: new Date().toISOString(),
          reason: reason || "Manual punch entered by administrator"
        }])
      },
      include: { user: true }
    });
    await createAuditLog(req.user!.id, req.user!.username, "ATTENDANCE_MANUAL_CREATE", "ATTENDANCE", session.id, { userId, date }, req.ip as string);
    res.json({ success: true, message: "Manual attendance record created", session });
  } catch (error) {
    console.error("Manual attendance create error:", error);
    res.status(500).json({ error: "Failed to create attendance session" });
  }
});

// GET /api/attendance/export - CSV Export
router.get("/export", requireAuth, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, date } = req.query;
    const targetDate = date ? String(date) : getLocalDateString();

    const whereClause: any = {};
    if (startDate && endDate) {
      whereClause.date = { gte: String(startDate), lte: String(endDate) };
    } else {
      whereClause.date = targetDate;
    }

    const sessions = await prisma.attendanceSession.findMany({
      where: whereClause,
      include: { user: true },
      orderBy: [{ date: "desc" }, { clockInTime: "asc" }]
    });

    let csv = "Employee ID,Full Name,Username,Date,Clock In,Clock Out,Elapsed (Mins),Net Work (Mins),Status,Offline Synced\n";
    for (const s of sessions) {
      csv += `"${s.user.id}","${s.user.fullName}","${s.user.username}","${s.date}","${s.clockInTime.toISOString()}","${s.clockOutTime ? s.clockOutTime.toISOString() : ''}",${s.totalElapsedMinutes},${s.netWorkMinutes},"${s.status}",${s.isOfflineRecorded}\n`;
    }

    res.header("Content-Type", "text/csv");
    res.attachment(`attendance_export_${targetDate}.csv`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: "Failed to export attendance" });
  }
});

export default router;
