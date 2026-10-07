import express from "express";

import {
  getIncidents,
  fileIncident,
} from "../controllers/incidentController";
import verifyToken from "../middlewares/verifyToken";

const router = express.Router();

router.get("/:child_id", verifyToken, getIncidents);
router.post("/", verifyToken, fileIncident);

export default router;
