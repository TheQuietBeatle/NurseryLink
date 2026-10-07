import express from "express";

import {
  createClass,
  getClasses,
  getClassRoster,
} from "../controllers/classController";
import { checkprivilege } from "../middlewares/checkPrivilege";
import verifyToken from "../middlewares/verifyToken";
const router = express.Router();

router.post(
  "/CreateClass",
  verifyToken,
  checkprivilege(2),
  createClass
);

router.get(
  "/GetClasses",
  verifyToken,
  getClasses
);

router.get("/:class_id/roster", verifyToken, getClassRoster);
// rout

export default router;
