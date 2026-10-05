import express from "express";
import { getParents, assignParentToChild, removeParentLinkage } from "../controllers/parent_childLink";
import verifyToken from "../middlewares/verifyToken";
import { checkprivilege } from "../middlewares/checkPrivilege";
const router = express.Router();
router.get("/getParents", verifyToken, checkprivilege(4), getParents);
router.post("/assignParentToChild", verifyToken, checkprivilege(4), assignParentToChild);
router.delete("/removeParentLinkage", verifyToken, checkprivilege(4), removeParentLinkage);
export default router;