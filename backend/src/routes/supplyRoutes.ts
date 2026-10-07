import express from "express";

import {
  getSupplyRequests,
} from "../controllers/supplyController";
import verifyToken from "../middlewares/verifyToken";

const router = express.Router();

router.get("/:account_id", verifyToken, getSupplyRequests);

export default router;
