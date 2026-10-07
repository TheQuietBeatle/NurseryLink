import express from "express";

import {
  getAttendance,
  checkIn,
  checkOut,
} from "../controllers/attendanceController";
import verifyToken from "../middlewares/verifyToken";

const router = express.Router();

router.get("/:child_id", verifyToken, getAttendance);
router.post("/checkin", verifyToken, checkIn);
router.put("/:id/checkout", verifyToken, checkOut);

export default router;
