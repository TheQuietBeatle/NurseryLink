import express from "express";

import {
  getMeals,
  logMeal,
} from "../controllers/mealController";

const router = express.Router();

router.get("/meals/:child_id", getMeals);
router.post("/meals", logMeal);

export default router;
