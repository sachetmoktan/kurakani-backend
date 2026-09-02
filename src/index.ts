import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import connectMongoDB from './config/connect_db.js';
import { handleCreateUser, handleLoginUser } from './controllers/user.controller.js';
import checkAuth from './middlewares/auth.middleware.js';
import { globalErrorHandler } from './middlewares/error.middleware.js';
import userRouter from './routes/user.route.js';
import { loginSchema, signupSchema } from './schema/user.schema.js';
import { validate } from './middlewares/validate.middleware.js';
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
app.post('/signup', validate(signupSchema), handleCreateUser);
app.post('/login', validate(loginSchema), handleLoginUser);
// Protected routes
app.use(checkAuth);
app.use('/users', userRouter);

// Global error handler
app.use(globalErrorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port:${PORT}`);
});
