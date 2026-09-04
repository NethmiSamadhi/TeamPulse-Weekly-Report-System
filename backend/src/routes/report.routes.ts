import { Router } from "express";
import { UserRole } from "@prisma/client";
import {
  createDraft,
  getReport,
  getReports,
  reviewSubmittedReport,
  submitDraft,
  updateDraft,
} from "../controllers/report.controller.js";
import {
  allowRoles,
  requireAuthentication,
} from "../middleware/auth.middleware.js";

const router = Router();

router.use(requireAuthentication);

router.get("/", getReports);
router.get("/:reportId", getReport);

router.post(
  "/",
  allowRoles(UserRole.TEAM_MEMBER),
  createDraft,
);

router.put(
  "/:reportId",
  allowRoles(UserRole.TEAM_MEMBER),
  updateDraft,
);

router.post(
  "/:reportId/submit",
  allowRoles(UserRole.TEAM_MEMBER),
  submitDraft,
);

router.post(
  "/:reportId/review",
  allowRoles(UserRole.MANAGER, UserRole.ADMIN),
  reviewSubmittedReport,
);

export default router;