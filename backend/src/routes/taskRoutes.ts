import { Router } from "express";
import * as taskController from "../controllers/taskController";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import {
  createTaskSchema,
  listTasksQuerySchema,
  reorderTasksSchema,
  setTop3Schema,
  updateTaskSchema,
} from "../validators/taskValidators";
import { idParamSchema } from "../validators/common";

const router = Router();
router.use(requireAuth);

router.get("/", validate(listTasksQuerySchema), taskController.listTasks);
router.post("/", validate(createTaskSchema), taskController.createTask);
router.patch("/reorder", validate(reorderTasksSchema), taskController.reorderTasks);
router.get("/top3", taskController.getTop3);
router.post("/top3", validate(setTop3Schema), taskController.setTop3);
router.patch("/:id", validate(updateTaskSchema), taskController.updateTask);
router.delete("/:id", validate(idParamSchema), taskController.deleteTask);

export default router;
