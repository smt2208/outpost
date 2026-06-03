import { Router } from "express";
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  assignMemberToProject,
  removeMemberFromProject,
  updateMemberRole,
  getProjectMembers
} from "../controllers/project.controllers.js";
import { verifyJWT, verifyProjectRole } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validator.middleware.js";
import { UserRolesEnum } from "../utils/constants.js";
import {
  ProjectCreateValidator,
  ProjectUpdateValidator,
  AssignMemberValidator,
  UpdateMemberRoleValidator
} from "../validators/index.js";
import taskRouter from "./task.routes.js";

const router = Router();

// Secure all routes in this router with JWT verification middleware
router.use(verifyJWT);

// Mount task router
router.use("/:projectId/tasks", taskRouter);

// Project management routes
router
  .route("/")
  .get(getProjects)
  .post(ProjectCreateValidator(), validate, createProject);

router
  .route("/:projectId")
  .get(verifyProjectRole(), getProjectById)
  .put(verifyProjectRole([UserRolesEnum.ADMIN]), ProjectUpdateValidator(), validate, updateProject)
  .delete(verifyProjectRole([UserRolesEnum.ADMIN]), deleteProject);

// Project member management routes
router
  .route("/:projectId/members")
  .get(verifyProjectRole(), getProjectMembers)
  .post(verifyProjectRole([UserRolesEnum.ADMIN]), AssignMemberValidator(), validate, assignMemberToProject);

router
  .route("/:projectId/members/:userId")
  .put(verifyProjectRole([UserRolesEnum.ADMIN]), UpdateMemberRoleValidator(), validate, updateMemberRole)
  .delete(verifyProjectRole([UserRolesEnum.ADMIN]), removeMemberFromProject);

export default router;
