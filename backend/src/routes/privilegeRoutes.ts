import express from "express";

import {
  checkCurrentPrivilege,
  getPrivileges,
  getPrivilegeById,
  checkPrivilege,
  assignPrivilege,
} from "../controllers/privilegeController";

import verifyToken from "../middlewares/verifyToken";

const router = express.Router();

router.get(
  "/checkCurrentPriviledge/:id",
  verifyToken,
  checkCurrentPrivilege
);

router.get(
  "/GetPriviledges",
  getPrivileges
);

router.get(
  "/GetPriviledge/:id",
  verifyToken,
  getPrivilegeById
);

router.post(
  "/check-privilege",
  verifyToken,
  checkPrivilege
);

router.post(
  "/AssignPrivilege",
  verifyToken,
  assignPrivilege
);

export default router;