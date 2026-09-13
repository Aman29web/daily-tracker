import { Router } from "express";
import * as focusController from "../controllers/focusController";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { listFocusQuerySchema, startFocusSchema } from "../validators/focusValidators";
import { idParamSchema } from "../validators/common";

const router = Router();
router.use(requireAuth);

router.get("/sessions", validate(listFocusQuerySchema), focusController.listSessions);
router.post("/sessions", validate(startFocusSchema), focusController.startSession);
router.patch("/sessions/:id/pause", validate(idParamSchema), focusController.pauseSession);
router.patch("/sessions/:id/resume", validate(idParamSchema), focusController.resumeSession);
router.patch("/sessions/:id/complete", validate(idParamSchema), focusController.completeSession);
router.patch("/sessions/:id/cancel", validate(idParamSchema), focusController.cancelSession);

export default router;
