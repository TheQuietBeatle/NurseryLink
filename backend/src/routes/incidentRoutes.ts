import express from "express";

import {
  getIncidents,
  fileIncident,
} from "../controllers/incidentController";

const router = express.Router();

router.get("/incidents/:child_id", getIncidents);
router.post("/incidents", fileIncident);

export default router;
