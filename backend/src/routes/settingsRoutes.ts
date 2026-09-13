import { Router } from "express";
import * as settingsController from "../controllers/settingsController";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { updateSettingsSchema } from "../validators/settingsValidators";

const router = Router();
router.use(requireAuth);

router.get("/", settingsController.getSettings);
router.patch("/", validate(updateSettingsSchema), settingsController.updateSettings);

export default router;
