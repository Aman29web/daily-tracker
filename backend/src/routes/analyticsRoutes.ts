import { Router } from "express";
import * as analyticsController from "../controllers/analyticsController";
import { requireAuth } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

router.get("/daily", analyticsController.getDaily);
router.get("/weekly", analyticsController.getWeekly);
router.get("/monthly", analyticsController.getMonthly);
router.get("/insights", analyticsController.getInsights);
router.get("/profile", analyticsController.getProfile);

export default router;
