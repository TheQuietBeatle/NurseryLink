import express from "express";

import {
  getAttendance,
  checkIn,
  checkOut,
} from "../controllers/attendanceController";

const router = express.Router();

router.get("/attendance/:child_id", getAttendance);
router.post("/attendance/checkin", checkIn);
router.put("/attendance/:id/checkout", checkOut);

export default router;
