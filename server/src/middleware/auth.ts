import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../prisma";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
    role: string;
    fullName: string;
  };
}

const JWT_SECRET = process.env.JWT_SECRET || "frame_production_ultra_secure_jwt_secret_key_2026_xyz";

export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Authentication token missing or invalid format" });
    return;
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; username: string; role: string; fullName: string };
    
    // Verify user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, username: true, role: true, fullName: true, isActive: true }
    });

    if (!user || !user.isActive) {
      res.status(401).json({ error: "User account is disabled or no longer exists" });
      return;
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid or expired session token" });
  }
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  if (!req.user || (req.user.role !== "ADMIN" && req.user.role !== "DEVELOPER")) {
    res.status(403).json({ error: "Access denied: Administrator privileges required" });
    return Promise.resolve();
  }
  next();
  return Promise.resolve();
};

export const requireDeveloper = (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  if (!req.user || req.user.role !== "DEVELOPER") {
    res.status(403).json({ error: "Access denied: Highest-privilege Developer role required" });
    return Promise.resolve();
  }
  next();
  return Promise.resolve();
};

export const createAuditLog = async (
  actorId: string,
  actorUsername: string,
  action: string,
  targetResource: string,
  targetId?: string,
  details?: any,
  ipAddress?: string
) => {
  try {
    await prisma.auditLog.create({
      data: {
        actorId,
        actorUsername,
        action,
        targetResource,
        targetId,
        detailsJson: details ? JSON.stringify(details) : null,
        ipAddress: ipAddress || "internal"
      }
    });
  } catch (e) {
    console.error("Failed to write audit log:", e);
  }
};
