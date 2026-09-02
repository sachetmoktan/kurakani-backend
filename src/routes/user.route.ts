import { Router } from 'express';
import { handleCreateUser, handleGetAllUsers } from '../controllers/user.controller.js';

const userRouter = Router();

userRouter.get('/', handleGetAllUsers);
userRouter.post('/', handleCreateUser);

export default userRouter;
