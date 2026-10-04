import express from "express";

import {
  createClass,
  getClasses,
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
  checkprivilege(2),
  getClasses
);
// rout

export default router;