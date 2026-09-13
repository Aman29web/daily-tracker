import { Router } from "express";
import * as habitController from "../controllers/habitController";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import {
  checkInSchema,
  createHabitSchema,
  habitRangeQuerySchema,
  listHabitsQuerySchema,
  updateHabitScheduleSchema,
  updateHabitSchema,
} from "../validators/habitValidators";
import { idParamSchema } from "../validators/common";

const router = Router();
router.use(requireAuth);

router.get("/", validate(listHabitsQuerySchema), habitController.listHabits);
router.post("/", validate(createHabitSchema), habitController.createHabit);
router.get("/:id", validate(idParamSchema), habitController.getHabit);
router.patch("/:id", validate(updateHabitSchema), habitController.updateHabit);
router.delete("/:id", validate(idParamSchema), habitController.deleteHabit);

router.put("/:id/schedule", validate(updateHabitScheduleSchema), habitController.updateHabitSchedule);
router.post("/:id/check-in", validate(checkInSchema), habitController.checkIn);
router.get("/:id/range", validate(habitRangeQuerySchema), habitController.getHabitRange);
router.get("/:id/stats", validate(idParamSchema), habitController.getHabitStats);

export default router;
