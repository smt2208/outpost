import { Router } from "express";
import {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  createSubTask,
  updateSubTask,
  deleteSubTask
} from "../controllers/task.controller.js";
import { verifyJWT, verifyProjectRole } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validator.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { UserRolesEnum } from "../utils/constants.js";
import {
  TaskCreateValidator,
  TaskUpdateValidator,
  SubtaskCreateValidator,
  SubtaskUpdateValidator
} from "../validators/index.js";

const router = Router({ mergeParams: true });

// Secure all routes in this router with JWT verification middleware
router.use(verifyJWT);

// We require all task operations to be performed by a project member
router.use(verifyProjectRole());

// Task Routes
router
  .route("/")
  .get(getTasks)
  .post(
    upload.array("attachments", 5), // Allow up to 5 attachments
    TaskCreateValidator(),
    validate,
    createTask
  );

router
  .route("/:taskId")
  .get(getTaskById)
  .put(
    verifyProjectRole([UserRolesEnum.ADMIN, UserRolesEnum.MEMBER]), // Adjust as needed
    TaskUpdateValidator(),
    validate,
    updateTask
  )
  .delete(
    verifyProjectRole([UserRolesEnum.ADMIN]), // Only admins can delete tasks
    deleteTask
  );

// Subtask Routes
router
  .route("/:taskId/subtasks")
  .post(
    SubtaskCreateValidator(),
    validate,
    createSubTask
  );

router
  .route("/:taskId/subtasks/:subtaskId")
  .put(
    SubtaskUpdateValidator(),
    validate,
    updateSubTask
  )
  .delete(
    deleteSubTask
  );

export default router;
