import express from "express";

import {
  createClass,
  getClasses,
} from "../controllers/classController";

const router = express.Router();

router.post(
  "/CreateClass",
  createClass
);

router.get(
  "/GetClasses",
  getClasses
);

export default router;