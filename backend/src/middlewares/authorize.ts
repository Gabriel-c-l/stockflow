import type { NextFunction, Request, Response } from "express";
import type { AuthenticatedUser } from "../types/auth";

type UserRole = AuthenticatedUser["role"];

export const authorize = (...allowedRoles: UserRole[]) =>
  (request: Request, response: Response, next: NextFunction): void => {
    if (!request.authUser) {
      response.status(401).json({ error: "Authentication required." });
      return;
    }
    if (!allowedRoles.includes(request.authUser.role)) {
      response.status(403).json({ error: "You do not have permission to perform this action." });
      return;
    }
    next();
  };
