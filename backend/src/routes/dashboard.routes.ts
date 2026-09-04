import { Router } from "express";
import { UserRole } from "@prisma/client";
import {
  getDashboard,
} from "../controllers/dashboard.controller.js";
import {
  allowRoles,
  requireAuthentication,
} from "../middleware/auth.middleware.js";

const router = Router();

router.get(
  "/",
  requireAuthentication,
  allowRoles(UserRole.MANAGER, UserRole.ADMIN),
  getDashboard,
);

export default router;