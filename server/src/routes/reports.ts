import { Router, Response } from "express";
import { prisma } from "../prisma";
import { AuthRequest, requireAuth, requireAdmin, createAuditLog } from "../middleware/auth";

const router = Router();

// GET /api/reports/overview - Live dashboard overview counters
router.get("/overview", requireAuth, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const today = new Date().toISOString().split("T")[0];

    // Total active employees
    const totalEmployees = await prisma.user.count({
      where: { role: "EMPLOYEE", isActive: true }
    });

    // Today's attendance sessions
    const sessions = await prisma.attendanceSession.findMany({
      where: { date: today }
    });

    const presentCount = sessions.filter((s) => s.status === "PRESENT" || s.status === "LATE").length;
    const lateCount = sessions.filter((s) => s.status === "LATE").length;
    const leaveCount = sessions.filter((s) => s.status === "ON_LEAVE").length;
    const absentCount = Math.max(0, totalEmployees - (presentCount + leaveCount));

    // Active breaks right now
    const activeBreaksCount = await prisma.breakRequest.count({
      where: {
        status: "APPROVED",
        startTime: { not: null },
        endTime: null
      }
    });

    // Pending queues
    const pendingBreaksCount = await prisma.breakRequest.count({ where: { status: "PENDING" } });
    const pendingLeavesCount = await prisma.leaveApplication.count({ where: { status: "PENDING" } });
    const pendingExitsCount = await prisma.exitRequest.count({ where: { status: "PENDING" } });

    // Total hours worked today
    const totalMinsToday = sessions.reduce((acc, s) => acc + s.netWorkMinutes, 0);
    const totalHoursToday = Number((totalMinsToday / 60).toFixed(1));

    // Recent audit events
    const recentEvents = await prisma.auditLog.findMany({
      orderBy: { timestamp: "desc" },
      take: 8
    });

    res.json({
      metrics: {
        totalEmployees,
        presentToday: presentCount,
        lateToday: lateCount,
        absentToday: absentCount,
        onLeaveToday: leaveCount,
        currentlyOnBreak: activeBreaksCount,
        pendingBreakRequests: pendingBreaksCount,
        pendingLeaveApplications: pendingLeavesCount,
        pendingExitRequests: pendingExitsCount,
        todayTotalWorkHours: totalHoursToday
      },
      recentEvents
    });
  } catch (error) {
    console.error("Dashboard overview error:", error);
    res.status(500).json({ error: "Failed to fetch dashboard overview" });
  }
});

// GET /api/reports/monthly - Monthly performance reports and rankings
router.get("/monthly", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { month } = req.query; // Format: "YYYY-MM", defaults to current month
    const targetMonth = month ? String(month) : new Date().toISOString().substring(0, 7);

    // If employee, can view own monthly report
    const isEmployee = req.user!.role === "EMPLOYEE";
    const whereUser: any = { role: "EMPLOYEE", isActive: true };
    if (isEmployee) {
      whereUser.id = req.user!.id;
    }

    const employees = await prisma.user.findMany({
      where: whereUser,
      include: {
        attendances: {
          where: { date: { startsWith: targetMonth } }
        },
        breakRequests: {
          where: { createdAt: { gte: new Date(`${targetMonth}-01T00:00:00.000Z`) } },
          include: { breakType: true }
        },
        leaveApps: {
          where: {
            status: "APPROVED",
            startDate: { startsWith: targetMonth }
          }
        },
        monthlyScores: {
          where: { monthYear: targetMonth }
        }
      }
    });

    // Calculate score metrics for each employee
    const standardWorkDays = 26; // Mon-Sat per month

    const scoredList = employees.map((emp) => {
      const presentDays = emp.attendances.filter((a) => a.status === "PRESENT" || a.status === "LATE").length;
      const lateDays = emp.attendances.filter((a) => a.status === "LATE").length;
      const approvedLeaveDays = emp.leaveApps.length;
      const unexcusedAbsences = Math.max(0, standardWorkDays - (presentDays + approvedLeaveDays));
      const totalWorkMins = emp.attendances.reduce((acc, a) => acc + a.netWorkMinutes, 0);

      // Punctuality rate: (present - late) / present * 100
      const punctualityRate = presentDays > 0 ? Math.max(0, Math.min(100, Math.round(((presentDays - lateDays) / presentDays) * 100))) : 100;

      // Break compliance rate: Overdue breaks deduction
      const totalBreaks = emp.breakRequests.length;
      const overdueBreaks = emp.breakRequests.filter((b) => b.status === "OVERDUE").length;
      const breakComplianceRate = totalBreaks > 0 ? Math.max(0, Math.min(100, Math.round(((totalBreaks - overdueBreaks) / totalBreaks) * 100))) : 100;

      // Attendance reliability: (present + approvedLeave) / standardWorkDays * 100
      const attendanceReliability = Math.min(100, Math.round(((presentDays + approvedLeaveDays) / standardWorkDays) * 100));

      // Transparent overall discipline score: 40% Attendance + 30% Punctuality + 30% Break Compliance
      const disciplineScore = Number((
        (attendanceReliability * 0.4) +
        (punctualityRate * 0.3) +
        (breakComplianceRate * 0.3)
      ).toFixed(1));

      return {
        userId: emp.id,
        fullName: emp.fullName,
        username: emp.username,
        avatarUrl: emp.avatarUrl,
        jobTitle: emp.jobTitle,
        workstationId: emp.workstationId,
        scheduledDays: standardWorkDays,
        presentDays,
        lateDays,
        approvedLeaveDays,
        unexcusedAbsences,
        totalWorkHours: Number((totalWorkMins / 60).toFixed(1)),
        punctualityRate,
        breakComplianceRate,
        attendanceReliability,
        disciplineScore,
        managerNotes: emp.monthlyScores[0]?.managerNotes || null
      };
    });

    // Sort by discipline score descending to establish ranks
    scoredList.sort((a, b) => b.disciplineScore - a.disciplineScore || b.totalWorkHours - a.totalWorkHours);

    const rankedList = scoredList.map((item, index) => ({
      rank: index + 1,
      ...item
    }));

    res.json({
      monthYear: targetMonth,
      totalCount: rankedList.length,
      rankings: rankedList
    });
  } catch (error) {
    console.error("Monthly reports error:", error);
    res.status(500).json({ error: "Failed to generate monthly reports" });
  }
});

// POST /api/reports/notes - Admin sets manager notes for monthly evaluation
router.post("/notes", requireAuth, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId, monthYear, notes, scoreAdjustment } = req.body;

    if (!userId || !monthYear) {
      res.status(400).json({ error: "User ID and month are required" });
      return;
    }

    const existing = await prisma.monthlyPerformance.findUnique({
      where: { userId_monthYear: { userId, monthYear } }
    });

    let record;
    if (existing) {
      record = await prisma.monthlyPerformance.update({
        where: { id: existing.id },
        data: {
          managerNotes: notes,
          disciplineScore: scoreAdjustment ? Number(scoreAdjustment) : existing.disciplineScore
        }
      });
    } else {
      record = await prisma.monthlyPerformance.create({
        data: {
          userId,
          monthYear,
          managerNotes: notes,
          disciplineScore: scoreAdjustment ? Number(scoreAdjustment) : 100
        }
      });
    }

    await createAuditLog(req.user!.id, req.user!.username, "UPDATE_PERFORMANCE_NOTES", "REPORT", record.id, { userId, monthYear }, req.ip as string);

    res.json({ success: true, message: "Performance notes updated", record });
  } catch (error) {
    res.status(500).json({ error: "Failed to update performance notes" });
  }
});

export default router;
