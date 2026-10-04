import express from "express";

import {
  getToiletLogs,
  logToiletVisit,
} from "../controllers/toiletController";

const router = express.Router();

router.get("/toilet/:child_id", getToiletLogs);
router.post("/toilet", logToiletVisit);

export default router;
