import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import os from "os";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API: System Stats (Uso real de CPU/RAM se possível no Node)
  app.get("/api/system", (req, res) => {
    const cpuLoad = Math.round(os.loadavg()[0] * 10); // Simulado/Simplificado para containers
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const memoryUsage = Math.round(((totalMem - freeMem) / totalMem) * 100);

    res.json({
      cpuLoad: cpuLoad > 100 ? 99 : cpuLoad,
      memoryUsage,
      uptime: Math.round(os.uptime()),
      platform: os.platform(),
      arch: os.arch()
    });
  });

  // Proxy para Ollama Local (Corrigindo latência com timeout e headers)
  app.post("/api/ollama", async (req, res) => {
    try {
      const { model, prompt } = req.body;
      const response = await fetch("http://localhost:11434/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: model || "gemma3:4b",
          prompt: prompt,
          stream: false,
          options: {
            temperature: 0.6,
            num_ctx: 1024, // Reduz contexto para velocidade
            top_k: 20
          }
        }),
      });
      
      if (!response.ok) throw new Error("Ollama connection failed");
      const data = await response.json();
      res.json({ text: data.response });
    } catch (error) {
      res.status(503).json({ error: "Ollama não detectado em localhost:11434" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`JARVIS CORE running on http://localhost:${PORT}`);
  });
}

startServer();
