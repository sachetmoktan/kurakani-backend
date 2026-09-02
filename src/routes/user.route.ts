import { Router } from 'express';
import { handleGetAllUsers } from '../controllers/user.controller.js';

const userRouter = Router();

userRouter.get('/', handleGetAllUsers);

export default userRouter;
