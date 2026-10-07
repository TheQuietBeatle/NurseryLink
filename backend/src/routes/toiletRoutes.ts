import express from "express";

import {
  getToiletLogs,
  logToiletVisit,
} from "../controllers/toiletController";
import verifyToken from "../middlewares/verifyToken";

const router = express.Router();

router.get("/:child_id", verifyToken, getToiletLogs);
router.post("/", verifyToken, logToiletVisit);

export default router;
