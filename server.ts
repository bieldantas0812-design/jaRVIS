import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import os from "os";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Mock System API
  app.get("/api/system", (req, res) => {
    res.json({
      cpuLoad: Math.round(os.loadavg()[0] * 10),
      memoryUsage: Math.round((1 - os.freemem() / os.totalmem()) * 100),
      uptime: Math.round(os.uptime()),
      platform: os.platform(),
      arch: os.arch(),
      hostname: os.hostname(),
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`JARVIS Server running on http://localhost:${PORT}`);
  });
}

startServer();
