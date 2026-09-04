import {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import {
  type UserRole,
} from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { verifyAccessToken } from "../utils/token.js";

function extractToken(request: Request): string | null {
  const cookieToken = request.cookies?.accessToken;

  if (
    typeof cookieToken === "string" &&
    cookieToken.length > 0
  ) {
    return cookieToken;
  }

  const authorizationHeader = request.headers.authorization;

  if (
    authorizationHeader?.startsWith("Bearer ")
  ) {
    return authorizationHeader.slice(7);
  }

  return null;
}

export async function requireAuthentication(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const token = extractToken(request);

    if (!token) {
      response.status(401).json({
        success: false,
        message: "Authentication is required",
      });

      return;
    }

    const payload = verifyAccessToken(token);

    const user = await prisma.user.findUnique({
      where: {
        id: payload.userId,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      response.status(401).json({
        success: false,
        message: "User account is unavailable",
      });

      return;
    }

    request.user = {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    };

    next();
  } catch {
    response.status(401).json({
      success: false,
      message: "Invalid or expired authentication token",
    });
  }
}

export function allowRoles(
  ...allowedRoles: UserRole[]
) {
  return (
    request: Request,
    response: Response,
    next: NextFunction,
  ) => {
    if (!request.user) {
      response.status(401).json({
        success: false,
        message: "Authentication is required",
      });

      return;
    }

    if (!allowedRoles.includes(request.user.role)) {
      response.status(403).json({
        success: false,
        message:
          "You do not have permission to perform this action",
      });

      return;
    }

    next();
  };
}