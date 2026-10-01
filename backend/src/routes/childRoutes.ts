import express from "express";

import {
  getChildren,
  addChild,
} from "../controllers/childController";

const router = express.Router();

router.get(
  "/getchildren",
  getChildren
);

router.post(
  "/AddChild",
  addChild
);

export default router;