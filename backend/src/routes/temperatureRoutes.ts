import express from "express";

import {
  getTemperatures,
  logTemperature,
} from "../controllers/temperatureController";
import verifyToken from "../middlewares/verifyToken";

const router = express.Router();

router.get("/:child_id", verifyToken, getTemperatures);
router.post("/", verifyToken, logTemperature);

export default router;
