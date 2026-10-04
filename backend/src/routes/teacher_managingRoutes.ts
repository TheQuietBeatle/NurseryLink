import express from 'express';
import {
  getTeachers,
    assignTeacherToClass,
    getteachersinclass,
    moveTeacherToClass
} from '../controllers/teacher_managingController';

import verifyToken from '../middlewares/verifyToken';
import { checkprivilege } from '../middlewares/checkPrivilege';
const router = express.Router();

router.post('/assignTeacherToClass', verifyToken, checkprivilege(3), assignTeacherToClass);
router.get('/getTeachers', verifyToken, checkprivilege(3), getTeachers);
router.get('/getTeachersInClass/:class_id', verifyToken, checkprivilege(3), getteachersinclass);
router.put('/MoveTeacherToClass', verifyToken, checkprivilege(3), moveTeacherToClass);
export default router;
