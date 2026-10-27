import { Router, Response } from "express";
import { prisma } from "../prisma";
import { AuthRequest, requireAuth, requireAdmin, createAuditLog } from "../middleware/auth";
import { broadcast } from "../websocket";

const router = Router();

export const PRESET_LEAVE_REASONS = [
  "Sickness or medical issue",
  "Medical appointment",
  "Family emergency",
  "Family responsibility",
  "Personal reasons",
  "Religious observance",
  "Education or examination",
  "Bereavement",
  "Government or official work",
  "Transportation difficulty",
  "Annual or planned leave",
  "Other reason"
];

// Default Studio Annual Quotas (Days per Calendar Year)
export const LEAVE_POLICY = {
  ANNUAL: 14,
  MEDICAL: 10,
  CASUAL: 5,
  EMERGENCY: 3,
  TOTAL: 32
};

// GET /api/leaves/presets
router.get("/presets", requireAuth, (req: AuthRequest, res: Response) => {
  res.json({
    reasons: PRESET_LEAVE_REASONS,
    policy: LEAVE_POLICY
  });
});

// GET /api/leaves/all - Admin view all leaves with filters
router.get("/all", requireAuth, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, userId, startDate, endDate, query } = req.query;

    const where: any = {};
    if (status && status !== "ALL") {
      where.status = status as string;
    }
    if (userId) {
      where.userId = userId as string;
    }
    if (startDate && endDate) {
      where.OR = [
        { startDate: { gte: startDate as string, lte: endDate as string } },
        { endDate: { gte: startDate as string, lte: endDate as string } },
        { AND: [{ startDate: { lte: startDate as string } }, { endDate: { gte: endDate as string } }] }
      ];
    }
    if (query) {
      where.user = {
        OR: [
          { fullName: { contains: query as string } },
          { username: { contains: query as string } }
        ]
      };
    }

    const applications = await prisma.leaveApplication.findMany({
      where,
      include: {
        user: { select: { id: true, fullName: true, username: true, jobTitle: true, workstationId: true, avatarUrl: true } }
      },
      orderBy: { createdAt: "desc" }
    });

    res.json(applications);
  } catch (error) {
    console.error("Error fetching all leaves:", error);
    res.status(500).json({ error: "Failed to fetch leaves" });
  }
});

// GET /api/leaves/calendar - Monthly studio availability calendar
router.get("/calendar", requireAuth, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { month } = req.query; // format "YYYY-MM" e.g. "2026-10"
    const targetMonth = (month as string) || new Date().toISOString().substring(0, 7);
    const startOfMonth = `${targetMonth}-01`;
    const endOfMonth = `${targetMonth}-31`;

    const leaves = await prisma.leaveApplication.findMany({
      where: {
        status: "APPROVED",
        startDate: { lte: endOfMonth },
        endDate: { gte: startOfMonth }
      },
      include: {
        user: { select: { id: true, fullName: true, username: true, jobTitle: true, workstationId: true } }
      }
    });

    const totalStaff = await prisma.user.count({ where: { isActive: true, role: "EMPLOYEE" } });

    res.json({
      targetMonth,
      totalStaff,
      leaves
    });
  } catch (error) {
    console.error("Error fetching leave calendar:", error);
    res.status(500).json({ error: "Failed to fetch leave calendar" });
  }
});

// GET /api/leaves/balances - Employee leave quotas and remaining balances
router.get("/balances", requireAuth, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const year = (req.query.year as string) || new Date().getFullYear().toString();
    const users = await prisma.user.findMany({
      where: { isActive: true },
      select: { id: true, username: true, fullName: true, jobTitle: true, workstationId: true },
      orderBy: { fullName: "asc" }
    });

    const approvedLeaves = await prisma.leaveApplication.findMany({
      where: {
        status: "APPROVED",
        startDate: { startsWith: year }
      }
    });

    // Helper to calculate business days between YYYY-MM-DD
    const calcDays = (start: string, end: string) => {
      const d1 = new Date(start);
      const d2 = new Date(end);
      const diffTime = Math.abs(d2.getTime() - d1.getTime());
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    };

    const balances = users.map((user) => {
      const userLeaves = approvedLeaves.filter((l) => l.userId === user.id);
      let usedAnnual = 0;
      let usedMedical = 0;
      let usedCasual = 0;
      let usedEmergency = 0;
      let usedOther = 0;

      userLeaves.forEach((l) => {
        const days = calcDays(l.startDate, l.endDate);
        const reason = l.leaveReason.toLowerCase();
        if (reason.includes("annual") || reason.includes("planned")) {
          usedAnnual += days;
        } else if (reason.includes("medic") || reason.includes("sick")) {
          usedMedical += days;
        } else if (reason.includes("casual") || reason.includes("personal") || reason.includes("religious")) {
          usedCasual += days;
        } else if (reason.includes("emergency") || reason.includes("bereavement")) {
          usedEmergency += days;
        } else {
          usedOther += days;
        }
      });

      const totalUsed = usedAnnual + usedMedical + usedCasual + usedEmergency + usedOther;
      const totalAllowance = LEAVE_POLICY.TOTAL;
      const remaining = Math.max(0, totalAllowance - totalUsed);

      return {
        user,
        year,
        policy: LEAVE_POLICY,
        breakdown: {
          annual: { allowance: LEAVE_POLICY.ANNUAL, used: usedAnnual, remaining: Math.max(0, LEAVE_POLICY.ANNUAL - usedAnnual) },
          medical: { allowance: LEAVE_POLICY.MEDICAL, used: usedMedical, remaining: Math.max(0, LEAVE_POLICY.MEDICAL - usedMedical) },
          casual: { allowance: LEAVE_POLICY.CASUAL, used: usedCasual, remaining: Math.max(0, LEAVE_POLICY.CASUAL - usedCasual) },
          emergency: { allowance: LEAVE_POLICY.EMERGENCY, used: usedEmergency, remaining: Math.max(0, LEAVE_POLICY.EMERGENCY - usedEmergency) },
          other: { used: usedOther }
        },
        totalUsed,
        totalAllowance,
        remaining
      };
    });

    res.json(balances);
  } catch (error) {
    console.error("Error calculating leave balances:", error);
    res.status(500).json({ error: "Failed to calculate leave balances" });
  }
});

// POST /api/leaves/admin-create - Admin records an approved or scheduled leave directly
router.post("/admin-create", requireAuth, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId, leaveReason, customReason, startDate, endDate, description, status, internalNotes } = req.body;

    if (!userId || !leaveReason || !startDate || !endDate) {
      res.status(400).json({ error: "User, reason, start date, and end date are required" });
      return;
    }

    if (startDate > endDate) {
      res.status(400).json({ error: "Start date must be on or before end date" });
      return;
    }

    const application = await prisma.leaveApplication.create({
      data: {
        userId,
        leaveReason,
        customReason: customReason || null,
        startDate,
        endDate,
        description: description || null,
        status: status || "APPROVED",
        decisionReason: "Recorded directly by studio administrator",
        decidedBy: req.user!.username,
        internalNotes: internalNotes || null
      },
      include: {
        user: { select: { id: true, fullName: true, username: true, workstationId: true } }
      }
    });

    // If marked as approved, sync attendance sessions
    if (application.status === "APPROVED") {
      const cur = new Date(startDate);
      const end = new Date(endDate);
      while (cur <= end) {
        const dStr = cur.toISOString().split("T")[0];
        const existingSession = await prisma.attendanceSession.findFirst({
          where: { userId, date: dStr }
        });

        if (existingSession) {
          await prisma.attendanceSession.update({
            where: { id: existingSession.id },
            data: { status: "ON_LEAVE" }
          });
        } else {
          await prisma.attendanceSession.create({
            data: {
              userId,
              date: dStr,
              clockInTime: new Date(cur),
              clockOutTime: new Date(cur),
              status: "ON_LEAVE"
            }
          });
        }
        cur.setDate(cur.getDate() + 1);
      }
    }

    broadcast("NEW_LEAVE_APPLICATION", { application });
    await createAuditLog(req.user!.id, req.user!.username, "ADMIN_RECORD_LEAVE", "LEAVE", application.id, { employeeId: userId, startDate, endDate }, req.ip as string);

    res.json({ success: true, message: "Leave recorded successfully", application });
  } catch (error) {
    console.error("Admin leave record error:", error);
    res.status(500).json({ error: "Failed to record leave" });
  }
});

// POST /api/leaves/apply - Employee submits leave application
router.post("/apply", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { leaveReason, customReason, startDate, endDate, description, assignedAdminId } = req.body;

    if (!leaveReason || !startDate || !endDate) {
      res.status(400).json({ error: "Leave reason, start date, and end date are required" });
      return;
    }

    if (startDate > endDate) {
      res.status(400).json({ error: "Start date must be on or before end date" });
      return;
    }

    if (leaveReason === "Other reason" && !customReason) {
      res.status(400).json({ error: "Please provide details for 'Other reason'" });
      return;
    }

    const application = await prisma.leaveApplication.create({
      data: {
        userId,
        leaveReason,
        customReason: customReason || null,
        startDate,
        endDate,
        description: description || null,
        assignedAdminId: assignedAdminId || null,
        status: "PENDING"
      },
      include: {
        user: { select: { id: true, fullName: true, username: true, workstationId: true } }
      }
    });

    broadcast("NEW_LEAVE_APPLICATION", {
      application
    }, assignedAdminId);

    await createAuditLog(userId, req.user!.username, "LEAVE_APPLY", "LEAVE", application.id, { reason: leaveReason, startDate, endDate }, req.ip as string);

    res.json({ success: true, message: "Leave application submitted successfully", application });
  } catch (error) {
    console.error("Leave application error:", error);
    res.status(500).json({ error: "Failed to submit leave application" });
  }
});

// GET /api/leaves/my - Employee's own applications
router.get("/my", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const applications = await prisma.leaveApplication.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" }
    });
    res.json(applications);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch leave history" });
  }
});

// GET /api/leaves/pending - Admin pending queue
router.get("/pending", requireAuth, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const applications = await prisma.leaveApplication.findMany({
      where: { status: { in: ["PENDING", "MORE_INFO_REQUESTED"] } },
      include: {
        user: { select: { id: true, fullName: true, username: true, jobTitle: true, workstationId: true, avatarUrl: true } }
      },
      orderBy: { createdAt: "desc" }
    });
    res.json(applications);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch pending leave applications" });
  }
});

// PUT /api/leaves/:id/decision - Admin approves/rejects/requests info
router.put("/:id/decision", requireAuth, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { status, decisionReason, internalNotes } = req.body; // status: APPROVED, REJECTED, MORE_INFO_REQUESTED

    if (!["APPROVED", "REJECTED", "MORE_INFO_REQUESTED"].includes(status)) {
      res.status(400).json({ error: "Status must be APPROVED, REJECTED, or MORE_INFO_REQUESTED" });
      return;
    }

    const app = await prisma.leaveApplication.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!app) {
      res.status(404).json({ error: "Leave application not found" });
      return;
    }

    const updated = await prisma.leaveApplication.update({
      where: { id },
      data: {
        status,
        decisionReason: decisionReason || null,
        internalNotes: internalNotes || null,
        decidedBy: req.user!.username
      },
      include: { user: true }
    });

    // If approved, create or update attendance session as ON_LEAVE for the date range
    if (status === "APPROVED") {
      const cur = new Date(app.startDate);
      const end = new Date(app.endDate);
      while (cur <= end) {
        const dStr = cur.toISOString().split("T")[0];
        const existingSession = await prisma.attendanceSession.findFirst({
          where: { userId: app.userId, date: dStr }
        });

        if (existingSession) {
          await prisma.attendanceSession.update({
            where: { id: existingSession.id },
            data: { status: "ON_LEAVE" }
          });
        } else {
          await prisma.attendanceSession.create({
            data: {
              userId: app.userId,
              date: dStr,
              clockInTime: new Date(cur),
              clockOutTime: new Date(cur),
              status: "ON_LEAVE"
            }
          });
        }
        cur.setDate(cur.getDate() + 1);
      }
    }

    broadcast("LEAVE_DECIDED", {
      leaveId: id,
      userId: app.userId,
      status,
      decisionReason,
      decidedBy: req.user!.fullName
    }, app.userId);

    await createAuditLog(req.user!.id, req.user!.username, `LEAVE_${status}`, "LEAVE", id, { employee: app.user.username, decisionReason }, req.ip as string);

    res.json({ success: true, message: `Leave application marked as ${status}`, application: updated });
  } catch (error) {
    console.error("Leave decision error:", error);
    res.status(500).json({ error: "Failed to process leave decision" });
  }
});

// DELETE /api/leaves/:id - Admin cancels or deletes a leave record
router.delete("/:id", requireAuth, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const leave = await prisma.leaveApplication.findUnique({ where: { id } });
    if (!leave) {
      res.status(404).json({ error: "Leave application not found" });
      return;
    }

    await prisma.leaveApplication.delete({ where: { id } });
    await createAuditLog(req.user!.id, req.user!.username, "LEAVE_DELETE", "LEAVE", id, { userId: leave.userId }, req.ip as string);

    res.json({ success: true, message: "Leave record deleted" });
  } catch (error) {
    console.error("Error deleting leave:", error);
    res.status(500).json({ error: "Failed to delete leave" });
  }
});

export default router;
