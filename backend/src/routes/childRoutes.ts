import express from "express";

import {
  getChildren,
  addChild,
  searchforchild,
  transferChildToClass,
  getChildrenByAccount,
} from "../controllers/childController";
import { checkprivilege } from "../middlewares/checkPrivilege";
import verifyToken from "../middlewares/verifyToken";

const router = express.Router();

router.get(
  "/getchildren",
  verifyToken,
  getChildren
);

router.post(
  "/addChild",
  verifyToken,
  checkprivilege(2),
  addChild
);
router.post(
  "/searchforchild",
  verifyToken,
  checkprivilege(2),
  searchforchild
);
router.put(
  "/transferChildToClass",
  verifyToken,
  checkprivilege(2),
  transferChildToClass
);

router.get("/children/account/:account_id", getChildrenByAccount);

export default router;