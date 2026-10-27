import { Router, Response } from "express";
import { prisma } from "../prisma";
import { AuthRequest, requireAuth, requireAdmin, createAuditLog } from "../middleware/auth";
import { broadcast } from "../websocket";

const router = Router();

// GET /api/breaks/types
router.get("/types", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const types = await prisma.breakType.findMany({ where: { isActive: true } });
    res.json(types);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch break types" });
  }
});

// POST /api/breaks/request - Employee requests a break
router.post("/request", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { breakTypeId, requestedMinutes, targetAdminId, notes } = req.body;

    if (!breakTypeId || !requestedMinutes) {
      res.status(400).json({ error: "Break type and duration are required" });
      return;
    }

    // Check if user already has an active or pending break
    const active = await prisma.breakRequest.findFirst({
      where: {
        userId,
        status: { in: ["PENDING", "APPROVED"] },
        endTime: null
      }
    });

    if (active) {
      res.status(400).json({ error: "You already have a pending or active break session" });
      return;
    }

    const breakType = await prisma.breakType.findUnique({ where: { id: breakTypeId } });
    if (!breakType) {
      res.status(404).json({ error: "Invalid break type" });
      return;
    }

    const breakReq = await prisma.breakRequest.create({
      data: {
        userId,
        breakTypeId,
        targetAdminId: targetAdminId || null,
        status: breakType.requiresApproval ? "PENDING" : "APPROVED",
        requestedMinutes: Number(requestedMinutes),
        approvedMinutes: breakType.requiresApproval ? null : Number(requestedMinutes),
        startTime: breakType.requiresApproval ? null : new Date(),
        notes: notes || null
      },
      include: {
        user: { select: { id: true, fullName: true, username: true } },
        breakType: true
      }
    });

    broadcast("BREAK_REQUEST", {
      breakRequest: breakReq,
      requiresApproval: breakType.requiresApproval
    }, targetAdminId);

    await createAuditLog(userId, req.user!.username, "BREAK_REQUEST", "BREAK", breakReq.id, { breakType: breakType.name, requestedMinutes }, req.ip);

    res.json({
      success: true,
      message: breakType.requiresApproval ? "Break request submitted to administrator" : "Break started",
      breakRequest: breakReq
    });
  } catch (error) {
    console.error("Break request error:", error);
    res.status(500).json({ error: "Failed to request break" });
  }
});

// GET /api/breaks/my - Employee's own breaks
router.get("/my", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const breaks = await prisma.breakRequest.findMany({
      where: { userId },
      include: { breakType: true },
      orderBy: { createdAt: "desc" },
      take: 50
    });
    res.json(breaks);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch break history" });
  }
});

// GET /api/breaks/pending - Admin list of pending breaks
router.get("/pending", requireAuth, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const pending = await prisma.breakRequest.findMany({
      where: { status: "PENDING" },
      include: {
        user: { select: { id: true, fullName: true, username: true, workstationId: true } },
        breakType: true
      },
      orderBy: { createdAt: "asc" }
    });
    res.json(pending);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch pending breaks" });
  }
});

// PUT /api/breaks/:id/decision - Admin approves or rejects break
router.put("/:id/decision", requireAuth, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { status, approvedMinutes, decisionReason } = req.body; // status: APPROVED or REJECTED

    if (!["APPROVED", "REJECTED"].includes(status)) {
      res.status(400).json({ error: "Status must be APPROVED or REJECTED" });
      return;
    }

    const breakReq = await prisma.breakRequest.findUnique({
      where: { id },
      include: { user: true, breakType: true }
    });

    if (!breakReq) {
      res.status(404).json({ error: "Break request not found" });
      return;
    }

    const updated = await prisma.breakRequest.update({
      where: { id },
      data: {
        status,
        approvedMinutes: status === "APPROVED" ? (Number(approvedMinutes) || breakReq.requestedMinutes) : null,
        startTime: status === "APPROVED" ? new Date() : null,
        decisionReason: decisionReason || null,
        decidedBy: req.user!.username
      },
      include: { breakType: true, user: true }
    });

    broadcast("BREAK_DECIDED", {
      breakId: updated.id,
      userId: updated.userId,
      status: updated.status,
      approvedMinutes: updated.approvedMinutes,
      startTime: updated.startTime,
      decisionReason: updated.decisionReason,
      decidedBy: req.user!.fullName
    }, updated.userId);

    await createAuditLog(req.user!.id, req.user!.username, `BREAK_${status}`, "BREAK", id, { employee: breakReq.user.username, decisionReason }, req.ip as string);

    res.json({ success: true, breakRequest: updated });
  } catch (error) {
    console.error("Break decision error:", error);
    res.status(500).json({ error: "Failed to process break decision" });
  }
});

// POST /api/breaks/:id/end - End active break
router.post("/:id/end", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const breakReq = await prisma.breakRequest.findUnique({ where: { id } });

    if (!breakReq || breakReq.userId !== req.user!.id) {
      res.status(404).json({ error: "Break request not found or unauthorized" });
      return;
    }

    if (!breakReq.startTime || breakReq.endTime) {
      res.status(400).json({ error: "Break is not currently active" });
      return;
    }

    const now = new Date();
    const elapsedMs = now.getTime() - new Date(breakReq.startTime).getTime();
    const actualDurationMins = Math.max(1, Math.round(elapsedMs / (1000 * 60)));
    const isOverdue = breakReq.approvedMinutes ? actualDurationMins > breakReq.approvedMinutes : false;

    const updated = await prisma.breakRequest.update({
      where: { id },
      data: {
        endTime: now,
        actualDurationMins,
        status: isOverdue ? "OVERDUE" : "COMPLETED"
      }
    });

    // Update today's attendance session to deduct break time
    const today = now.toISOString().split("T")[0];
    const session = await prisma.attendanceSession.findFirst({
      where: { userId: req.user!.id, date: today, clockOutTime: null }
    });

    if (session) {
      const newDeducted = session.breakDeductedMins + actualDurationMins;
      const netWork = Math.max(0, session.totalElapsedMinutes - newDeducted);
      await prisma.attendanceSession.update({
        where: { id: session.id },
        data: {
          breakDeductedMins: newDeducted,
          netWorkMinutes: netWork
        }
      });
    }

    broadcast("BREAK_ENDED", {
      breakId: id,
      userId: req.user!.id,
      actualDurationMins,
      isOverdue
    });

    res.json({ success: true, message: "Break ended", breakRequest: updated });
  } catch (error) {
    console.error("End break error:", error);
    res.status(500).json({ error: "Failed to end break" });
  }
});

export default router;
