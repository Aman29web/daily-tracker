import { Router } from "express";
import * as notificationController from "../controllers/notificationController";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { idParamSchema } from "../validators/common";

const router = Router();
router.use(requireAuth);

router.get("/", notificationController.listNotifications);
router.patch("/read-all", notificationController.markAllRead);
router.patch("/:id/read", validate(idParamSchema), notificationController.markRead);
router.delete("/:id", validate(idParamSchema), notificationController.deleteNotification);

export default router;
