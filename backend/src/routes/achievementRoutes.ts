import { Router } from "express";
import * as achievementController from "../controllers/achievementController";
import { requireAuth } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

router.get("/", achievementController.listAchievements);

export default router;
