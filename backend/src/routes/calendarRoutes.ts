import { Router } from "express";
import * as calendarController from "../controllers/calendarController";
import { requireAuth } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

router.get("/", calendarController.getRange);
router.get("/day/:date", calendarController.getDay);

export default router;
