import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import os from "os";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API: System Stats
  app.get("/api/system", (req, res) => {
    try {
      const cpuLoad = Math.round(os.loadavg()[0] * 10);
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const memoryUsage = Math.round(((totalMem - freeMem) / totalMem) * 100);

      res.json({
        cpuLoad: cpuLoad > 100 ? 99 : cpuLoad,
        memoryUsage,
        uptime: Math.round(os.uptime()),
        platform: os.platform()
      });
    } catch (err) {
      console.error("[CMD_ERROR] Falha ao coletar métricas de hardware:", err);
      res.status(500).json({ error: "Erro interno de telemetria" });
    }
  });

  // Proxy para Ollama Local com Logs de CMD
  app.post("/api/ollama", async (req, res) => {
    const { model, prompt } = req.body;
    console.log(`\n[CMD_LOG] >>> REQUISIÇÃO OLLAMA RECEBIDA`);
    console.log(`[CMD_LOG] Modelo: ${model}`);
    console.log(`[CMD_LOG] Prompt: "${prompt.substring(0, 50)}..."`);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000); // 15s Timeout

      const response = await fetch("http://localhost:11434/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: model || "gemma2",
          prompt: prompt,
          stream: false
        }),
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!response.ok) {
        console.error(`[CMD_ERROR] Ollama respondeu com erro HTTP: ${response.status}`);
        return res.status(response.status).json({ error: `Erro no Ollama: ${response.statusText}` });
      }

      const data = await response.json();
      console.log(`[CMD_LOG] <<< OLLAMA RESPONDEU COM SUCESSO (${data.response.length} chars)`);
      res.json({ text: data.response });
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.error("[CMD_ERROR] Timeout: O Ollama local está demorando demais para responder.");
        res.status(504).json({ error: "Timeout do Ollama" });
      } else {
        console.error("[CMD_ERROR] Falha crítica de conexão com Ollama (localhost:11434). O serviço está rodando?");
        res.status(503).json({ error: "Ollama offline ou inacessível" });
      }
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
