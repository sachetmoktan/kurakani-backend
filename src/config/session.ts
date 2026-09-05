import MongoStore from 'connect-mongo';
import dotenv from 'dotenv';
import session from 'express-session';
dotenv.config();

const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET!,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URL!,
    collectionName: 'sessions',
  }),
  cookie: {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
});

export default sessionMiddleware;
