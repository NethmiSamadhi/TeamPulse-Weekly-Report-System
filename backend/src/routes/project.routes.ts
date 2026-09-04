import { Router } from "express";
import { UserRole } from "@prisma/client";
import {
  addProject,
  editProject,
  getProjects,
  removeProject,
} from "../controllers/project.controller.js";
import {
  allowRoles,
  requireAuthentication,
} from "../middleware/auth.middleware.js";

const router = Router();

router.use(requireAuthentication);

router.get("/", getProjects);

router.post(
  "/",
  allowRoles(UserRole.MANAGER, UserRole.ADMIN),
  addProject,
);

router.patch(
  "/:projectId",
  allowRoles(UserRole.MANAGER, UserRole.ADMIN),
  editProject,
);

router.delete(
  "/:projectId",
  allowRoles(UserRole.MANAGER, UserRole.ADMIN),
  removeProject,
);

export default router;