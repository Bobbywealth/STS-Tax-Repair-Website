import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        // Don't exit on every error, just log it clearly
        console.error(`[Vite Error] ${msg}`);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  // Express v5 (path-to-regexp) does not accept "*" as a string route; use a regex catch-all.
  app.use(/.*/, async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(import.meta.dirname, "public");
  const assetsPath = path.resolve(distPath, "assets");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  // Serve built assets explicitly. Missing assets should 404 (NOT fall back to index.html),
  // otherwise browsers/service-workers can cache HTML under a JS URL causing infinite
  // "Failed to fetch dynamically imported module" errors after deploys.
  if (fs.existsSync(assetsPath)) {
    app.use(
      "/assets",
      express.static(assetsPath, {
        fallthrough: false,
        immutable: true,
        maxAge: "365d",
      }),
    );
  }

  // Serve other static files (manifest, icons, etc). Avoid caching HTML so users always
  // receive the newest index.html that references the latest hashed chunks.
  app.use(
    express.static(distPath, {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith(".html")) {
          res.setHeader("Cache-Control", "no-store");
        }
      },
    }),
  );

  // fall through to index.html if the file doesn't exist
  // Express v5 (path-to-regexp) does not accept "*" as a string route; use a regex catch-all.
  app.use(/.*/, (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
