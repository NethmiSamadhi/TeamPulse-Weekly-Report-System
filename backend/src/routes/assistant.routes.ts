import { Router } from "express";
import { UserRole } from "@prisma/client";
import { askAssistant } from "../controllers/assistant.controller.js";
import { allowRoles, requireAuthentication } from "../middleware/auth.middleware.js";

const router = Router();

router.post(
  "/ask",
  requireAuthentication,
  allowRoles(UserRole.MANAGER, UserRole.ADMIN),
  askAssistant,
);

export default router;
