import express from "express";
import{
  login,
  createAccount,
  getAccountsByRole,
  getAccountById,
  deleteAccount
} from "../controllers/accountController";

const router = express.Router();
import verifyToken from "../middlewares/verifyToken";
router.post("/Login", login);
router.post("/CreateAccount",verifyToken, createAccount);
router.get("/account/role/:role", getAccountsByRole);
router.get("/account/id/:id", getAccountById);
router.delete("/account/:id", deleteAccount);

export default router;