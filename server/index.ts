import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import hpp from "hpp";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage";
import type { Office, OfficeBranding } from "@shared/mysql-schema";

// Extend Express Request to include office context
declare global {
  namespace Express {
    interface Request {
      officeSlug?: string;
      officeId?: string;
      officeBranding?: Partial<OfficeBranding>;
    }
  }
}

// Prevent crashes from unhandled promise rejections (e.g., MySQL connection errors)
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit - keep the server running for public pages
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Don't exit - keep the server running for public pages
});

// Environment variable validation
const requiredEnvVars = ['SESSION_SECRET', 'DATABASE_URL'];
const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
  const missing = requiredEnvVars.filter(v => !process.env[v]);
  if (missing.length > 0) {
    console.error(`CRITICAL: Missing required environment variables in production: ${missing.join(', ')}`);
    process.exit(1);
  }
  
  if ((process.env.SESSION_SECRET?.length || 0) < 32) {
    console.warn('WARNING: SESSION_SECRET is too short (should be at least 32 characters)');
  }
}

const app = express();

// Set security HTTP headers using Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Needed for Vite and Replit environment
      "img-src": ["'self'", "data:", "https:", "http:"],
      "connect-src": ["'self'", "wss:", "https:", "http:"],
    },
  },
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Global Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each IP to 500 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests from this IP, please try again after 15 minutes" },
  skip: (req) => {
    // Skip rate limiting for static assets in development
    return process.env.NODE_ENV !== 'production' && !req.path.startsWith('/api');
  }
});
app.use(limiter);

// Trust proxy for Render deployment (required for secure cookies behind reverse proxy)
app.set('trust proxy', 1);

// CORS configuration with credentials support for cross-origin session cookies
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://sts-tax-repair-website.onrender.com', 'https://ststaxrepair.org', 'https://www.ststaxrepair.org']
    : true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}
app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));

// Protect against HTTP Parameter Pollution
app.use(hpp());

// Raw body parser for binary file uploads (agent photos via FTP)
app.use(express.raw({ 
  type: 'application/octet-stream',
  limit: '10mb',
  verify: (req: any, _res, buf) => {
    req.rawBody = buf;
  }
}));

// Default STS branding for fallback
const DEFAULT_BRANDING: Partial<OfficeBranding> = {
  companyName: 'STS TaxRepair',
  logoUrl: null,
  primaryColor: '#1a4d2e',
  secondaryColor: '#4CAF50',
  accentColor: '#22c55e',
  defaultTheme: 'light',
  replyToEmail: 'support@ststaxrepair.org',
  replyToName: 'STS TaxRepair Support'
};

// Subdomain detection middleware
// Detects office from subdomain: acmetax.ststaxrepair.org -> "acmetax"
app.use(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hostname = req.hostname || req.headers.host?.split(':')[0] || '';
    
    // Main domains that should use default STS branding
    const mainDomains = [
      'ststaxrepair.org',
      'www.ststaxrepair.org',
      'sts-tax-repair-website.onrender.com',
      'localhost',
      '0.0.0.0'
    ];
    
    // Check if this is a Replit dev domain (ends with .replit.dev or .worf.replit.dev)
    const isReplitDomain = hostname.includes('.replit.dev');
    
    // Extract subdomain slug
    let slug: string | undefined;
    
    if (!isReplitDomain && !mainDomains.includes(hostname)) {
      // For production: subdomain.ststaxrepair.org -> subdomain
      const domainParts = hostname.split('.');
      if (domainParts.length >= 3 && domainParts[domainParts.length - 2] === 'ststaxrepair') {
        slug = domainParts[0];
      }
    }
    
    // Also check for slug in query param (useful for testing and development)
    if (!slug && req.query._office) {
      slug = req.query._office as string;
    }
    
    if (slug && slug !== 'www') {
      // Look up office by slug
      const office = await storage.getOfficeBySlug(slug);
      if (office) {
        req.officeSlug = slug;
        req.officeId = office.id;
        
        // Load office branding
        const branding = await storage.getOfficeBranding(office.id);
        req.officeBranding = {
          ...DEFAULT_BRANDING,
          ...(branding || {})
        };
      }
    }
    
    // If no office detected, use default branding
    if (!req.officeBranding) {
      req.officeBranding = DEFAULT_BRANDING;
    }
    
    next();
  } catch (error) {
    console.error('Subdomain detection error:', error);
    req.officeBranding = DEFAULT_BRANDING;
    next();
  }
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    // Log the error detail
    console.error(`[Error] ${status}: ${message}`);
    if (err.stack) {
      console.error(err.stack);
    }

    res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  // Avoid reusePort to prevent ENOTSUP on platforms that don't support it (e.g., Render/macOS)
  server.listen(
    {
      port,
      host: "0.0.0.0",
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
