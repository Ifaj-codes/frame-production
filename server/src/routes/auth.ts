import { Router, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../prisma";
import { AuthRequest, requireAuth, createAuditLog } from "../middleware/auth";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "frame_production_ultra_secure_jwt_secret_key_2026_xyz";

// POST /api/auth/login
router.post("/login", async (req, res): Promise<void> => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      res.status(400).json({ error: "Username and password are required" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { username: username.trim().toLowerCase() }
    });

    if (!user || !user.isActive) {
      res.status(401).json({ error: "Invalid username or password" });
      return;
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      res.status(401).json({ error: "Invalid username or password" });
      return;
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
        fullName: user.fullName
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Fetch branding
    const branding = await prisma.appBranding.findUnique({ where: { id: "singleton" } });

    // Log login
    await createAuditLog(user.id, user.username, "USER_LOGIN", "USER", user.id, { role: user.role }, req.ip as string);

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        fullName: user.fullName,
        jobTitle: user.jobTitle,
        avatarUrl: user.avatarUrl,
        workstationId: user.workstationId
      },
      branding: {
        appName: branding?.appName || "Frame Production",
        logoUrl: branding?.logoUrl || "/assets/logo.png",
        companySubtitle: branding?.companySubtitle || "Video Editing & Production Agency"
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error during authentication" });
  }
});

// GET /api/auth/me
router.get("/me", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        username: true,
        role: true,
        fullName: true,
        jobTitle: true,
        avatarUrl: true,
        workstationId: true,
        createdAt: true
      }
    });

    const branding = await prisma.appBranding.findUnique({ where: { id: "singleton" } });

    res.json({
      user,
      branding: {
        appName: branding?.appName || "Frame Production",
        logoUrl: branding?.logoUrl || "/assets/logo.png",
        companySubtitle: branding?.companySubtitle || "Video Editing & Production Agency"
      }
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve profile" });
  }
});

export default router;
