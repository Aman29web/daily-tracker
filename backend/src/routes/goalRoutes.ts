import { Router } from "express";
import * as goalController from "../controllers/goalController";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { createGoalSchema, listGoalsQuerySchema, updateGoalProgressSchema, updateGoalSchema } from "../validators/goalValidators";
import { idParamSchema } from "../validators/common";

const router = Router();
router.use(requireAuth);

router.get("/", validate(listGoalsQuerySchema), goalController.listGoals);
router.post("/", validate(createGoalSchema), goalController.createGoal);
router.get("/:id", validate(idParamSchema), goalController.getGoal);
router.patch("/:id", validate(updateGoalSchema), goalController.updateGoal);
router.patch("/:id/progress", validate(updateGoalProgressSchema), goalController.setGoalProgress);
router.delete("/:id", validate(idParamSchema), goalController.deleteGoal);

export default router;
