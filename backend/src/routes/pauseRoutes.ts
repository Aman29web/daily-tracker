import { Router } from "express";
import * as pauseController from "../controllers/pauseController";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { createPauseSchema } from "../validators/pauseValidators";
import { idParamSchema } from "../validators/common";

const router = Router();
router.use(requireAuth);

router.get("/", pauseController.listPauses);
router.post("/", validate(createPauseSchema), pauseController.createPause);
router.delete("/:id", validate(idParamSchema), pauseController.deletePause);
router.post("/:id/end-now", validate(idParamSchema), pauseController.endPauseNow);

export default router;
