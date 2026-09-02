import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import connectMongoDB from './config/connect_db.js';
import { handleCreateUser, handleLoginUser } from './controllers/user.controller.js';
import checkAuth from './middlewares/auth.middleware.js';
import userRouter from './routes/user.route.js';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Db Connection
connectMongoDB(process.env.MONGODB_URL!);

app.use(cors({ origin: ['*'] }));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get('/', (req, res) => {
  return res.json({ message: 'Hello world!' });
});

// Public routes
userRouter.post('/signup', handleCreateUser);
userRouter.post('/login', handleLoginUser);
// Protected routes
userRouter.use(checkAuth);
app.use('/users', userRouter);

app.listen(PORT, () => {
  console.log(`Server running on port:${PORT}`);
});
