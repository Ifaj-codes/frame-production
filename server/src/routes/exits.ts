import { Router, Response } from "express";
import { prisma } from "../prisma";
import { AuthRequest, requireAuth, requireAdmin, createAuditLog } from "../middleware/auth";
import { broadcast } from "../websocket";

const router = Router();

// POST /api/exits/request - Employee requests temporary exit
router.post("/request", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { reason, departureTime, expectedReturnTime, notes, targetAdminId } = req.body;

    if (!reason || !departureTime || !expectedReturnTime) {
      res.status(400).json({ error: "Reason, departure time, and expected return time are required" });
      return;
    }

    const exitReq = await prisma.exitRequest.create({
      data: {
        userId,
        reason,
        departureTime: new Date(departureTime),
        expectedReturnTime: new Date(expectedReturnTime),
        notes: notes || null,
        targetAdminId: targetAdminId || null,
        status: "PENDING"
      },
      include: {
        user: { select: { id: true, fullName: true, username: true, workstationId: true } }
      }
    });

    broadcast("EXIT_REQUEST", { exitRequest: exitReq }, targetAdminId);

    await createAuditLog(userId, req.user!.username, "EXIT_REQUEST", "EXIT", exitReq.id, { reason, departureTime }, req.ip);

    res.json({ success: true, message: "Temporary exit request submitted", exitRequest: exitReq });
  } catch (error) {
    console.error("Exit request error:", error);
    res.status(500).json({ error: "Failed to submit exit request" });
  }
});

// GET /api/exits/my - Employee's own exit requests
router.get("/my", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const exits = await prisma.exitRequest.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 30
    });
    res.json(exits);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch exit requests" });
  }
});

// GET /api/exits/pending - Admin pending exits
router.get("/pending", requireAuth, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const pending = await prisma.exitRequest.findMany({
      where: { status: "PENDING" },
      include: {
        user: { select: { id: true, fullName: true, username: true, workstationId: true } }
      },
      orderBy: { createdAt: "desc" }
    });
    res.json(pending);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch pending exit requests" });
  }
});

// PUT /api/exits/:id/decision - Admin approves/rejects exit
router.put("/:id/decision", requireAuth, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { status, decisionReason } = req.body;

    if (!["APPROVED", "REJECTED"].includes(status)) {
      res.status(400).json({ error: "Status must be APPROVED or REJECTED" });
      return;
    }

    const exitReq = await prisma.exitRequest.findUnique({ where: { id }, include: { user: true } });
    if (!exitReq) {
      res.status(404).json({ error: "Exit request not found" });
      return;
    }

    const updated = await prisma.exitRequest.update({
      where: { id },
      data: {
        status,
        decisionReason: decisionReason || null,
        decidedBy: req.user!.username
      },
      include: { user: true }
    });

    broadcast("EXIT_DECIDED", {
      exitId: id,
      userId: exitReq.userId,
      status,
      decisionReason,
      decidedBy: req.user!.fullName
    }, exitReq.userId);

    await createAuditLog(req.user!.id, req.user!.username, `EXIT_${status}`, "EXIT", id, { employee: exitReq.user.username }, req.ip as string);

    res.json({ success: true, exitRequest: updated });
  } catch (error) {
    console.error("Exit decision error:", error);
    res.status(500).json({ error: "Failed to process exit decision" });
  }
});

// POST /api/exits/:id/return - Record actual return time
router.post("/:id/return", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const exitReq = await prisma.exitRequest.findUnique({ where: { id } });

    if (!exitReq || exitReq.userId !== req.user!.id) {
      res.status(404).json({ error: "Exit request not found or unauthorized" });
      return;
    }

    const updated = await prisma.exitRequest.update({
      where: { id },
      data: {
        actualReturnTime: new Date(),
        status: "COMPLETED"
      }
    });

    res.json({ success: true, message: "Returned from exit", exitRequest: updated });
  } catch (error) {
    res.status(500).json({ error: "Failed to record exit return" });
  }
});

export default router;
