import express from "express";

import {
  getTemperatures,
  logTemperature,
} from "../controllers/temperatureController";

const router = express.Router();

router.get("/temperature/:child_id", getTemperatures);
router.post("/temperature", logTemperature);

export default router;
