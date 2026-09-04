import 'express-session';
import 'http';

declare module 'express-session' {
  interface SessionData {
    userId?: string;
  }
}

declare module 'http' {
  interface IncomingMessage {
    session: import('express-session').Session & import('express-session').SessionData;
  }
}
