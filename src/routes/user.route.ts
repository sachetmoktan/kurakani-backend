import { Router } from 'express';
import { handleCreateUser, handleGetAllUsers, handleLoginUser } from '../controllers/user.controller.js';

const userRouter = Router();

userRouter.get('/', handleGetAllUsers);
userRouter.post('/', handleCreateUser);
userRouter.post('/signup', handleCreateUser);
userRouter.post('/login', handleLoginUser);

export default userRouter;
