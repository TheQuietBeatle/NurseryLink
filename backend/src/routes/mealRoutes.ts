import express from "express";

import {
  getMeals,
  logMeal,
} from "../controllers/mealController";
import verifyToken from "../middlewares/verifyToken";

const router = express.Router();

router.get("/:child_id", verifyToken, getMeals);
router.post("/", verifyToken, logMeal);

export default router;
