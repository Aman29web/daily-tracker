import { Router } from "express";
import * as planController from "../controllers/planController";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { createPlanSchema, listPlansQuerySchema, updatePlanSchema } from "../validators/planValidators";
import { idParamSchema } from "../validators/common";

const router = Router();
router.use(requireAuth);

router.get("/", validate(listPlansQuerySchema), planController.listPlans);
router.post("/", validate(createPlanSchema), planController.createPlan);
router.patch("/:id", validate(updatePlanSchema), planController.updatePlan);

router.post("/:id/activate", validate(idParamSchema), planController.activatePlan);
router.post("/:id/deactivate", validate(idParamSchema), planController.deactivatePlan);
router.post("/:id/archive", validate(idParamSchema), planController.archivePlan);
router.post("/:id/unarchive", validate(idParamSchema), planController.unarchivePlan);
router.post("/:id/duplicate", validate(idParamSchema), planController.duplicatePlan);
router.post("/:id/use-template", validate(idParamSchema), planController.useTemplate);

export default router;
