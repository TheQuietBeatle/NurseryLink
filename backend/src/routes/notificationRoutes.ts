import express from "express";

import {
  getNotifications,
  markNotificationSeen,
  createNotification,
  emailNotification,
} from "../controllers/notificationController";
import verifyToken from "../middlewares/verifyToken";

const router = express.Router();

router.put("/:id/seen", verifyToken, markNotificationSeen);
router.post("/", verifyToken, createNotification);
router.post("/:id/email", verifyToken, emailNotification);
router.get("/:account_id", verifyToken, getNotifications);

export default router;
