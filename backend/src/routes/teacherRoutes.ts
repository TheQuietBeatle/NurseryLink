import express from "express";

import {
  getTeacherByAccount,
} from "../controllers/teacherController";

const router = express.Router();

router.get("/teacher/account/:account_id", getTeacherByAccount);

export default router;
