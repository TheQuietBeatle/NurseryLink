import express from "express";

import {
  getTeacherByAccount,
  getTeacherClasses
} from "../controllers/teacherController";
import verifyToken from "../middlewares/verifyToken";

const router = express.Router();

router.get("/account/:account_id", verifyToken, getTeacherByAccount);
router.get("/:teacher_id/classes", verifyToken, getTeacherClasses);
export default router;
