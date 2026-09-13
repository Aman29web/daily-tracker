import { Router } from "express";
import * as aiController from "../controllers/aiController";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { askAiSchema, journalSummarySchema } from "../validators/aiValidators";

const router = Router();
router.use(requireAuth);

router.get("/daily-analysis", aiController.dailyAnalysis);
router.get("/weekly-review", aiController.weeklyReview);
router.get("/habit-recommendations", aiController.habitRecommendations);
router.get("/goal-recommendations", aiController.goalRecommendations);
router.get("/journal-summary", validate(journalSummarySchema), aiController.journalSummary);
router.post("/ask", validate(askAiSchema), aiController.ask);

export default router;
