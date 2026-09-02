import MongoStore from 'connect-mongo';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import session from 'express-session';
import connectMongoDB from './config/connect_db.js';
import { handleCreateUser, handleLoginUser, handleLogoutUser } from './controllers/user.controller.js';
import checkAuth, { requiredRoles } from './middlewares/auth.middleware.js';
import { globalErrorHandler } from './middlewares/error.middleware.js';
import { validate } from './middlewares/validate.middleware.js';
import userRouter from './routes/user.route.js';
import { loginSchema, signupSchema } from './schema/user.schema.js';
import { ROLES } from './utils/index.js';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Db Connection
connectMongoDB(process.env.MONGODB_URL!);

app.use(cors({ origin: ['*'] }));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(
  session({
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URL!,
      collectionName: 'sessions',
    }),
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      // maxAge: process.env.SESSION_MAXAGE ? Number(process.env.SESSION_MAXAGE) : 1000 * 60 * 60 * 24 * 7, // 7days
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    },
  }),
);

app.get('/', (req, res) => {
  return res.json({ message: 'Hello world!' });
});

// Public routes
app.post('/signup', validate(signupSchema), handleCreateUser);
app.post('/login', validate(loginSchema), handleLoginUser);
app.post('/logout', handleLogoutUser);

// Protected routes
app.use(checkAuth);
app.use(requiredRoles(ROLES.ADMIN));
app.use('/users', userRouter);

// Global error handler
app.use(globalErrorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port:${PORT}`);
});
