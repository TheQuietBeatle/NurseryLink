import express from "express";

import {
  getSupplyRequests,
} from "../controllers/supplyController";

const router = express.Router();

router.get("/supplies/:account_id", getSupplyRequests);

export default router;
