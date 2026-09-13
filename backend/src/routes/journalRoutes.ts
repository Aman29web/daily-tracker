import { Router } from "express";
import * as journalController from "../controllers/journalController";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { listJournalQuerySchema, upsertJournalSchema } from "../validators/journalValidators";
import { idParamSchema } from "../validators/common";

const router = Router();
router.use(requireAuth);

router.get("/", validate(listJournalQuerySchema), journalController.listJournal);
router.post("/", validate(upsertJournalSchema), journalController.upsertJournal);
router.get("/date/:date", journalController.getJournalByDate);
router.patch("/:id", journalController.updateJournal);
router.delete("/:id", validate(idParamSchema), journalController.deleteJournal);

export default router;
