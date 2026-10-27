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

// GET /api/leaves/presets
router.get("/presets", requireAuth, (req: AuthRequest, res: Response) => {
  res.json(PRESET_LEAVE_REASONS);
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

    await createAuditLog(userId, req.user!.username, "LEAVE_APPLY", "LEAVE", application.id, { reason: leaveReason, startDate, endDate }, req.ip);

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
        user: { select: { id: true, fullName: true, username: true, jobTitle: true, workstationId: true } }
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

export default router;
