import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);

  // ── Endpoint de diagnóstico temporário: valida Chromium no ambiente publicado ──
  app.get('/api/contracts/diagnostics/chromium', async (_req, res) => {
    const start = Date.now();
    const result: Record<string, unknown> = {
      ok: false,
      runtime: process.env.NODE_ENV || 'unknown',
      timestamp: new Date().toISOString(),
      executablePath: null,
      pathExists: false,
      launchOk: false,
      pdfOk: false,
      pdfBytes: 0,
      durationMs: 0,
      error: null,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let browser: any = null;
    try {
      const chromium = (await import('@sparticuz/chromium')).default;
      const puppeteer = (await import('puppeteer-core')).default;
      const { existsSync } = await import('fs');

      const executablePath = await chromium.executablePath();
      result.executablePath = executablePath;
      result.pathExists = existsSync(executablePath as string);
      console.log('[diagnostics] chromium path:', executablePath, '| exists:', result.pathExists);

      browser = await puppeteer.launch({
        args: chromium.args,
        executablePath: executablePath as string,
        headless: true,
        defaultViewport: { width: 794, height: 1122 },
      });
      result.launchOk = true;
      console.log('[diagnostics] browser launched OK');

      const page = await browser.newPage();
      await page.setContent(
        `<html><body><h1>Diagnostics PDF</h1><p>Ambiente: ${result.runtime}</p><p>${result.timestamp}</p></body></html>`
      );
      const pdf = await page.pdf({ format: 'A4' });
      result.pdfOk = true;
      result.pdfBytes = pdf.length;
      console.log('[diagnostics] PDF generated OK, bytes:', pdf.length);

      result.ok = true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      result.error = msg;
      console.error('[diagnostics] FAILED:', msg);
    } finally {
      if (browser) { try { await browser.close(); } catch {} }
      result.durationMs = Date.now() - start;
    }
    res.json(result);
  });

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
