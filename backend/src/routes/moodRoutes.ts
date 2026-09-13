import { Router } from "express";
import * as journalController from "../controllers/journalController";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { listMoodQuerySchema, upsertMoodSchema } from "../validators/journalValidators";

const router = Router();
router.use(requireAuth);

router.get("/", validate(listMoodQuerySchema), journalController.listMood);
router.post("/", validate(upsertMoodSchema), journalController.upsertMood);

export default router;
