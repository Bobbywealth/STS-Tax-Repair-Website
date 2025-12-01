import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";
import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

// Check if we're running on Replit (has required env vars)
export const isReplitEnvironment = !!(process.env.REPL_ID && process.env.REPLIT_DOMAINS);

// Only create OIDC config if we're on Replit
const getOidcConfig = memoize(
  async () => {
    if (!isReplitEnvironment) {
      return null;
    }
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(claims: any) {
  const userId = claims["sub"];
  
  // Check if user already exists to preserve their role
  const existingUser = await storage.getUser(userId);
  
  // Determine role: keep existing role, or check if we need a first admin
  let role = existingUser?.role || 'client';
  
  // If user doesn't exist or is a client, check if they should be an admin
  // Make the first Replit Auth user an admin if no admins exist
  if (!existingUser || existingUser.role === 'client') {
    try {
      const allUsers = await storage.getUsers();
      const hasAdmin = allUsers.some(u => u.role === 'admin');
      if (!hasAdmin) {
        console.log(`No admin found - promoting ${claims["email"]} to admin`);
        role = 'admin';
      }
    } catch (error) {
      console.error("Error checking for admins:", error);
    }
  }
  
  await storage.upsertUser({
    id: userId,
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
    role: role,
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // If not on Replit, skip OIDC setup but keep session middleware
  if (!isReplitEnvironment) {
    console.log("Not running on Replit - Replit Auth disabled, using email/password auth only");
    
    // Setup minimal passport serialization for session-based auth
    passport.serializeUser((user: Express.User, cb) => cb(null, user));
    passport.deserializeUser((user: Express.User, cb) => cb(null, user));
    
    // Redirect staff login to client login when not on Replit
    app.get("/api/login", (req, res) => {
      res.redirect("/client-login?notice=replit-auth-unavailable");
    });
    
    app.get("/api/callback", (req, res) => {
      res.redirect("/client-login");
    });
    
    app.get("/api/logout", (req: any, res) => {
      // Clear session data
      if (req.session) {
        req.session.userId = null;
        req.session.userRole = null;
        req.session.isClientLogin = null;
      }
      req.logout(() => {
        res.redirect("/client-login");
      });
    });
    
    return;
  }

  // Full Replit Auth setup
  const config = await getOidcConfig();
  if (!config) {
    console.error("Failed to get OIDC config");
    return;
  }

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };

  for (const domain of process.env.REPLIT_DOMAINS!.split(",")) {
    const strategy = new Strategy(
      {
        name: `replitauth:${domain}`,
        config,
        scope: "openid email profile offline_access",
        callbackURL: `https://${domain}/api/callback`,
      },
      verify,
    );
    passport.use(strategy);
  }

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", async (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, async (err: any, user: any) => {
      if (err || !user) {
        return res.redirect("/client-login");
      }
      
      req.login(user, async (loginErr: any) => {
        if (loginErr) {
          return res.redirect("/client-login");
        }
        
        // Check user role to determine redirect
        try {
          const userId = user.claims?.sub;
          if (userId) {
            const dbUser = await storage.getUser(userId);
            if (dbUser && dbUser.role !== 'client') {
              // Staff/Admin goes to main dashboard
              return res.redirect("/");
            }
          }
        } catch (error) {
          console.error("Error checking user role:", error);
        }
        
        // Default: clients go to client portal
        return res.redirect("/client-portal");
      });
    })(req, res, next);
  });

  app.get("/api/logout", (req: any, res) => {
    // Clear client session login data
    if (req.session) {
      req.session.userId = null;
      req.session.userRole = null;
      req.session.isClientLogin = null;
    }
    
    // Handle Replit Auth logout
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID!,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}/client-login`,
        }).href
      );
    });
  });
}

// Updated isAuthenticated middleware that works for both auth methods
export const isAuthenticated: RequestHandler = async (req: any, res, next) => {
  // Check for client session login first (email/password auth)
  if (req.session?.userId && req.session?.isClientLogin) {
    try {
      const user = await storage.getUser(req.session.userId);
      if (user) {
        req.userRole = user.role || 'client';
        req.userId = user.id;
        return next();
      }
    } catch (error) {
      console.error("Error validating session user:", error);
    }
  }

  // If not on Replit, only session auth is available
  if (!isReplitEnvironment) {
    return res.status(401).json({ message: "Unauthorized - Please log in" });
  }

  // Check Replit Auth
  const user = req.user as any;

  if (!req.isAuthenticated() || !user?.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  
  if (now > user.expires_at) {
    const refreshToken = user.refresh_token;
    if (!refreshToken) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const config = await getOidcConfig();
      if (!config) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
      updateUserSession(user, tokenResponse);
    } catch (error) {
      return res.status(401).json({ message: "Unauthorized" });
    }
  }

  try {
    const userId = user.claims?.sub;
    if (userId) {
      const dbUser = await storage.getUser(userId);
      if (dbUser) {
        req.userRole = dbUser.role || 'client';
        req.userId = userId;
      }
    }
  } catch (error) {
    console.error("Error fetching user role:", error);
  }

  return next();
};
