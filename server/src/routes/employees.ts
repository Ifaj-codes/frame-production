import { Router, Response } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../prisma";
import { AuthRequest, requireAuth, requireAdmin, requireDeveloper, createAuditLog } from "../middleware/auth";

const router = Router();

// GET /api/employees - List all employees with today's status overview
router.get("/", requireAuth, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const today = new Date().toISOString().split("T")[0];

    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        jobTitle: true,
        workstationId: true,
        avatarUrl: true,
        isActive: true,
        createdAt: true,
        attendances: {
          where: { date: today },
          select: {
            id: true,
            status: true,
            clockInTime: true,
            clockOutTime: true,
            totalElapsedMinutes: true,
            netWorkMinutes: true
          }
        },
        breakRequests: {
          where: {
            status: "APPROVED",
            startTime: { not: null },
            endTime: null
          },
          include: { breakType: true }
        }
      },
      orderBy: [{ role: "asc" }, { fullName: "asc" }]
    });

    // Transform into clean UI model
    const employees = users.map((u) => {
      const todaySession = u.attendances[0] || null;
      const activeBreak = u.breakRequests[0] || null;

      let currentStatus = "OFFLINE";
      if (activeBreak) {
        currentStatus = "ON_BREAK";
      } else if (todaySession) {
        if (!todaySession.clockOutTime) {
          currentStatus = todaySession.status === "LATE" ? "LATE" : "PRESENT";
        } else {
          currentStatus = "CLOCKED_OUT";
        }
      }

      return {
        id: u.id,
        username: u.username,
        fullName: u.fullName,
        role: u.role,
        jobTitle: u.jobTitle,
        workstationId: u.workstationId,
        avatarUrl: u.avatarUrl,
        isActive: u.isActive,
        createdAt: u.createdAt,
        currentStatus,
        todaySession,
        activeBreak
      };
    });

    res.json(employees);
  } catch (error) {
    console.error("List employees error:", error);
    res.status(500).json({ error: "Failed to list employees" });
  }
});

// GET /api/employees/:id - Comprehensive 8-tab Employee Profile
router.get("/:id", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const isSelf = req.user!.id === id;
    const isAdmin = req.user!.role === "ADMIN" || req.user!.role === "DEVELOPER";

    // Non-admins can only view their own profile
    if (!isSelf && !isAdmin) {
      res.status(403).json({ error: "Access denied: You can only view your own profile" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        schedules: true,
        attendances: {
          orderBy: { date: "desc" },
          take: 60
        },
        breakRequests: {
          include: { breakType: true },
          orderBy: { createdAt: "desc" },
          take: 50
        },
        leaveApps: {
          orderBy: { createdAt: "desc" },
          take: 30
        },
        exitRequests: {
          orderBy: { createdAt: "desc" },
          take: 30
        },
        monthlyScores: {
          orderBy: { monthYear: "desc" },
          take: 12
        }
      }
    });

    if (!user) {
      res.status(404).json({ error: "Employee profile not found" });
      return;
    }

    let activities: any[] = [];
    let screenshots: any[] = [];
    let auditLogs: any[] = [];

    if (isAdmin) {
      activities = await prisma.applicationActivity.findMany({
        where: { userId: id },
        orderBy: { startTime: "desc" },
        take: 40
      });
      screenshots = await prisma.screenshot.findMany({
        where: { userId: id },
        orderBy: { capturedAt: "desc" },
        take: 20
      });
      auditLogs = await prisma.auditLog.findMany({
        where: { actorId: id },
        orderBy: { timestamp: "desc" },
        take: 20
      });
    }

    // Calculate aggregated attendance statistics
    const totalSessions = user.attendances.length;
    const presentDays = user.attendances.filter((a) => a.status === "PRESENT").length;
    const lateDays = user.attendances.filter((a) => a.status === "LATE").length;
    const leaveDays = user.attendances.filter((a) => a.status === "ON_LEAVE").length;
    const totalWorkMinutes = user.attendances.reduce((acc, a) => acc + a.netWorkMinutes, 0);

    const stats = {
      totalRecordedSessions: totalSessions,
      presentDays,
      lateDays,
      leaveDays,
      totalWorkHours: Number((totalWorkMinutes / 60).toFixed(1)),
      breakRequestsCount: user.breakRequests.length,
      approvedBreaksCount: user.breakRequests.filter((b) => b.status === "APPROVED" || b.status === "COMPLETED").length,
      leaveApplicationsCount: user.leaveApps.length,
      exitRequestsCount: user.exitRequests.length
    };

    res.json({
      profile: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        jobTitle: user.jobTitle,
        workstationId: user.workstationId,
        avatarUrl: user.avatarUrl,
        isActive: user.isActive,
        createdAt: user.createdAt
      },
      stats,
      schedule: user.schedules[0] || null,
      attendanceHistory: user.attendances,
      breakHistory: user.breakRequests,
      leaveHistory: user.leaveApps,
      exitHistory: user.exitRequests,
      monthlyScores: user.monthlyScores,
      workActivity: activities,
      screenshots: screenshots,
      auditHistory: auditLogs
    });
  } catch (error) {
    console.error("Get employee profile error:", error);
    res.status(500).json({ error: "Failed to fetch employee profile" });
  }
});

// POST /api/employees - Create new Employee or Administrator (Admin & Developer)
router.post("/", requireAuth, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { username, password, fullName, role, jobTitle, workstationId, schedule } = req.body;

    if (!username || !password || !fullName) {
      res.status(400).json({ error: "Username, password, and full name are required" });
      return;
    }

    const cleanUsername = username.trim().toLowerCase();

    // Only DEVELOPER can create new ADMINISTRATOR accounts
    if (role === "ADMIN" && req.user!.role !== "DEVELOPER") {
      res.status(403).json({ error: "Only the developer can create administrator accounts" });
      return;
    }

    if (role === "DEVELOPER") {
      res.status(403).json({ error: "Additional developer accounts cannot be created" });
      return;
    }

    const existing = await prisma.user.findUnique({ where: { username: cleanUsername } });
    if (existing) {
      res.status(400).json({ error: `Username '${cleanUsername}' is already taken` });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        username: cleanUsername,
        passwordHash,
        fullName: fullName.trim(),
        role: role === "ADMIN" ? "ADMIN" : "EMPLOYEE",
        jobTitle: jobTitle || "Video Editor",
        workstationId: workstationId || null
      }
    });

    // Create schedule
    await prisma.workSchedule.create({
      data: {
        userId: newUser.id,
        daysOfWeek: schedule?.daysOfWeek || "1,2,3,4,5,6",
        startTime: schedule?.startTime || "09:00",
        endTime: schedule?.endTime || "18:00",
        gracePeriodMinutes: schedule?.gracePeriodMinutes || 15,
        expectedHoursPerDay: schedule?.expectedHoursPerDay || 8.0
      }
    });

    await createAuditLog(req.user!.id, req.user!.username, "USER_CREATE", "USER", newUser.id, { username: cleanUsername, role: newUser.role }, req.ip as string);

    res.status(201).json({
      success: true,
      message: `Account created for ${newUser.fullName} (@${cleanUsername})`,
      user: {
        id: newUser.id,
        username: newUser.username,
        fullName: newUser.fullName,
        role: newUser.role,
        jobTitle: newUser.jobTitle,
        workstationId: newUser.workstationId
      }
    });
  } catch (error) {
    console.error("Create employee error:", error);
    res.status(500).json({ error: "Failed to create account" });
  }
});

// PUT /api/employees/:id/rename - Rename username (Admin & Developer)
router.put("/:id/rename", requireAuth, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { newUsername } = req.body;

    if (!newUsername) {
      res.status(400).json({ error: "New username is required" });
      return;
    }

    const cleanUsername = newUsername.trim().toLowerCase();
    const targetUser = await prisma.user.findUnique({ where: { id } });

    if (!targetUser) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Developer cannot be modified by ordinary admin
    if (targetUser.role === "DEVELOPER" && req.user!.role !== "DEVELOPER") {
      res.status(403).json({ error: "Ordinary administrators cannot modify the developer account" });
      return;
    }

    const existing = await prisma.user.findUnique({ where: { username: cleanUsername } });
    if (existing && existing.id !== id) {
      res.status(400).json({ error: `Username '${cleanUsername}' is already taken` });
      return;
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { username: cleanUsername }
    });

    await createAuditLog(req.user!.id, req.user!.username, "USER_RENAME", "USER", id, { oldUsername: targetUser.username, newUsername: cleanUsername }, req.ip as string);

    res.json({ success: true, message: `Username updated to @${cleanUsername}`, user: updated });
  } catch (error) {
    res.status(500).json({ error: "Failed to rename user" });
  }
});

// PUT /api/employees/:id/reset-password - Reset password (Admin & Developer)
router.put("/:id/reset-password", requireAuth, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      res.status(400).json({ error: "Password must be at least 6 characters long" });
      return;
    }

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Developer password cannot be reset by ordinary admin
    if (targetUser.role === "DEVELOPER" && req.user!.role !== "DEVELOPER") {
      res.status(403).json({ error: "Ordinary administrators cannot reset the developer password" });
      return;
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id },
      data: { passwordHash }
    });

    await createAuditLog(req.user!.id, req.user!.username, "PASSWORD_RESET", "USER", id, { targetUsername: targetUser.username }, req.ip as string);

    res.json({ success: true, message: `Password for @${targetUser.username} has been reset successfully` });
  } catch (error) {
    res.status(500).json({ error: "Failed to reset password" });
  }
});

// PUT /api/employees/:id/role - Promote/Demote (Developer only)
router.put("/:id/role", requireAuth, requireDeveloper, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { role } = req.body; // EMPLOYEE or ADMIN

    if (!["EMPLOYEE", "ADMIN"].includes(role)) {
      res.status(400).json({ error: "Role must be EMPLOYEE or ADMIN" });
      return;
    }

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    if (targetUser.role === "DEVELOPER") {
      res.status(400).json({ error: "Developer account cannot be demoted" });
      return;
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { role }
    });

    await createAuditLog(req.user!.id, req.user!.username, "ROLE_CHANGE", "USER", id, { oldRole: targetUser.role, newRole: role }, req.ip as string);

    res.json({ success: true, message: `User role updated to ${role}`, user: updated });
  } catch (error) {
    res.status(500).json({ error: "Failed to change user role" });
  }
});

// PUT /api/employees/:id/status - Enable/Disable account (Admin & Developer)
router.put("/:id/status", requireAuth, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { isActive } = req.body;

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    if (targetUser.role === "DEVELOPER") {
      res.status(400).json({ error: "Developer account cannot be disabled" });
      return;
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { isActive: Boolean(isActive) }
    });

    await createAuditLog(req.user!.id, req.user!.username, isActive ? "USER_ACTIVATE" : "USER_DEACTIVATE", "USER", id, {}, req.ip as string);

    res.json({ success: true, message: `Account ${isActive ? 'activated' : 'disabled'}`, user: updated });
  } catch (error) {
    res.status(500).json({ error: "Failed to update account status" });
  }
});

export default router;
