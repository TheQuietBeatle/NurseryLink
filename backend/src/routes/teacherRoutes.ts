import express from "express";

import {
  getTeacherByAccount,
} from "../controllers/teacherController";
import verifyToken from "../middlewares/verifyToken";

const router = express.Router();

router.get("/account/:account_id", verifyToken, getTeacherByAccount);

export default router;
