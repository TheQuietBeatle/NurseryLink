import express from "express";

import {
  getNotifications,
  markNotificationSeen,
  createNotification,
  emailNotification,
} from "../controllers/notificationController";

const router = express.Router();

router.get("/notifications/:account_id", getNotifications);
router.put("/notifications/:id/seen", markNotificationSeen);
router.post("/notifications", createNotification);
router.post("/notifications/:id/email", emailNotification);

export default router;
