import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Mic, MicOff, Search, Settings, Power, Volume2, Maximize2, Minimize2 } from "lucide-react";
import { StatusPanel, CommandLog, VoiceAvatar } from "./components/JarvisUI";
import { JarvisBrain } from "./services/jarvisBrain";
import { VoiceEngine } from "./services/voiceEngine";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export default function App() {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [logs, setLogs] = useState<string[]>(["SISTEMA JARVIS INICIALIZADO", "AGUARDANDO COMANDOS..."]);
  const [systemStats, setSystemStats] = useState({ 
    cpuLoad: 0, 
    memoryUsage: 0, 
    uptime: 0,
    platform: "unknown"
  });
  
  const [showSettings, setShowSettings] = useState(false);
  const [assistantName, setAssistantName] = useState("JARVIS");
  const [userName, setUserName] = useState("Senhor");
  const [localApiKey, setLocalApiKey] = useState(GEMINI_API_KEY || "");
  
  const voiceTargetRef = useRef<VoiceEngine | null>(null);
  const brainTargetRef = useRef<JarvisBrain | null>(null);

  // Initialize Services
  const initBrain = useCallback((key: string) => {
    if (key) {
      brainTargetRef.current = new JarvisBrain(key);
      addLog("NÚCLEO NEURAL SINCRONIZADO");
    }
  }, []);

  useEffect(() => {
    if (!voiceTargetRef.current) voiceTargetRef.current = new VoiceEngine();
    if (localApiKey && !brainTargetRef.current) {
      initBrain(localApiKey);
    }
  }, [localApiKey, initBrain]);

  // Fetch System Stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/system");
      const data = await res.json();
      setSystemStats(data);
    } catch (e) {
      console.error("Failed to fetch system stats");
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  const addLog = (msg: string) => {
    setLogs(prev => [msg, ...prev].slice(0, 50));
  };

  const handleBrainResponse = async (input: string) => {
    if (!brainTargetRef.current) return;
    
    addLog(`> ${input}`);
    const response = await brainTargetRef.current.processInput(input);
    
    if (response.command) {
      addLog(`EXECUTANDO: ${response.command.action}`);
      // Special logic for search
      if (response.command.action === "search_web") {
        window.open(`https://www.google.com/search?q=${encodeURIComponent(response.command.params.query)}`, "_blank");
      }
    }

    addLog(`JARVIS: ${response.text}`);
    // Replace "Senhor" with customized name if present
    const personalizedText = response.text.replace(/Senhor/g, userName);
    
    setIsSpeaking(true);
    voiceTargetRef.current?.speak(personalizedText, () => {
      setIsSpeaking(false);
    });
  };

  const toggleListening = () => {
    if (isListening) {
      voiceTargetRef.current?.stopListening();
      setIsListening(false);
    } else {
      setTranscript("");
      voiceTargetRef.current?.listen(
        (text, isFinal) => {
          setTranscript(text);
          if (isFinal) {
            handleBrainResponse(text);
            setIsListening(false);
          }
        },
        () => setIsListening(false)
      );
      setIsListening(true);
    }
  };

  return (
    <div className="relative h-screen w-screen bg-jarvis-dark overflow-hidden flex flex-col p-6">
      {/* Background Grid & Scanline */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,229,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,229,255,0.1)_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>
      <div className="scanline" />

      {/* Top Header */}
      <div className="flex justify-between items-center mb-8 z-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowSettings(true)}
            className="w-10 h-10 border border-jarvis-blue/30 rounded flex items-center justify-center text-jarvis-blue shadow-[0_0_15px_rgba(0,229,255,0.1)] hover:bg-jarvis-blue/10 transition-colors cursor-pointer"
          >
            <Settings size={20} className="animate-spin-slow" />
          </button>
          <div>
            <h1 className="font-display text-xl tracking-widest text-jarvis-blue glow-text">{assistantName.split('').join('.')}</h1>
            <p className="text-[10px] tracking-[0.3em] opacity-50 uppercase">Neural Network Interface v4.2</p>
          </div>
        </div>
        
        <div className="flex gap-6 font-mono text-[10px]">
          <div className="text-right">
            <div className="opacity-40">USER IDENTITY</div>
            <div className="text-jarvis-blue uppercase">{userName}</div>
          </div>
          <div className="text-right">
            <div className="opacity-40">LOCAL TIME</div>
            <div className="text-jarvis-blue">{new Date().toLocaleTimeString()}</div>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-jarvis-dark/80 backdrop-blur-xl p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="hud-border w-full max-w-md p-8 rounded-2xl relative overflow-hidden"
            >
              <div className="scanline" />
              <button 
                onClick={() => setShowSettings(false)}
                className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
              >
                <Power size={20} />
              </button>

              <h2 className="font-display text-jarvis-blue text-lg mb-6 glow-text tracking-widest uppercase">Protocolo de Configuração</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] text-white/40 uppercase tracking-widest mb-2">Identidade do Assistente</label>
                  <input 
                    type="text" 
                    value={assistantName}
                    onChange={(e) => setAssistantName(e.target.value)}
                    className="w-full bg-white/5 border border-jarvis-blue/20 rounded py-2 px-3 text-sm font-mono text-jarvis-blue focus:border-jarvis-blue outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-white/40 uppercase tracking-widest mb-2">Identidade do Usuário</label>
                  <input 
                    type="text" 
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full bg-white/5 border border-jarvis-blue/20 rounded py-2 px-3 text-sm font-mono text-jarvis-blue focus:border-jarvis-blue outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-white/40 uppercase tracking-widest mb-2">Chave de Acesso Neural (Gemini API)</label>
                  <input 
                    type="password" 
                    placeholder="Cole sua chave aqui..."
                    value={localApiKey}
                    onChange={(e) => setLocalApiKey(e.target.value)}
                    className="w-full bg-white/5 border border-jarvis-blue/20 rounded py-2 px-3 text-sm font-mono text-jarvis-blue focus:border-jarvis-blue outline-none"
                  />
                  <p className="text-[8px] text-white/20 mt-1">A CHAVE É ARMAZENADA APENAS NA SESSÃO ATUAL</p>
                </div>

                <div className="pt-4 border-t border-jarvis-blue/10">
                  <div className="flex items-center justify-between text-[10px] text-white/40 uppercase tracking-widest mb-4">
                    <span>Modo de Bio-Feedback</span>
                    <div className="w-8 h-4 bg-jarvis-blue/20 rounded-full relative">
                      <div className="absolute right-1 top-1 w-2 h-2 bg-jarvis-blue rounded-full shadow-[0_0_10px_var(--color-jarvis-glow)]" />
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      initBrain(localApiKey);
                      setShowSettings(false);
                    }}
                    className="w-full py-3 bg-jarvis-blue/10 border border-jarvis-blue/40 text-jarvis-blue font-display text-xs tracking-widest uppercase hover:bg-jarvis-blue/20 transition-all rounded"
                  >
                    Sincronizar e Reiniciar
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 grid grid-cols-12 gap-6 z-10 h-full overflow-hidden">
        {/* Left Column: Stats */}
        <div className="col-span-3">
          <StatusPanel systemStats={systemStats} />
        </div>

        {/* Center Column: JARVIS Avatar & Feedback */}
        <div className="col-span-6 flex flex-col items-center justify-center">
          <div className="mb-8">
            <VoiceAvatar isSpeaking={isSpeaking} isListening={isListening} />
          </div>
          
          <div className="w-full max-w-md h-24 flex flex-col items-center justify-center text-center">
            <AnimatePresence mode="wait">
              {transcript && (
                <motion.p 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="font-mono text-jarvis-blue italic text-sm mb-2"
                >
                  "{transcript}"
                </motion.p>
              )}
            </AnimatePresence>
            
            <div className="flex items-center gap-4 mt-4">
              {!localApiKey && (
                <div className="absolute top-20 bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-2 rounded text-[10px] font-mono">
                  SISTEMA DESATIVADO: CHAVE API NÃO ENCONTRADA
                </div>
              )}
              <button 
                onClick={toggleListening}
                disabled={!localApiKey || isSpeaking}
                className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 border shadow-[0_0_20px_rgba(0,229,255,0.1)] active:scale-95 ${
                  isListening 
                    ? "bg-red-500/20 border-red-500 text-red-500 shadow-red-500/40" 
                    : !localApiKey 
                      ? "opacity-20 cursor-not-allowed border-white/20"
                      : "bg-jarvis-blue/10 border-jarvis-blue/40 text-jarvis-blue hover:bg-jarvis-blue/20"
                }`}
              >
                {isListening ? <MicOff size={24} /> : <Mic size={24} />}
              </button>
            </div>
            
            <p className="mt-4 text-[10px] text-white/30 tracking-widest uppercase">
              {isListening ? "Escutando..." : isSpeaking ? "Processando Resposta..." : "Esperando ativação"}
            </p>
          </div>
        </div>

        {/* Right Column: Logs */}
        <div className="col-span-3 flex flex-col h-full overflow-hidden">
          <CommandLog logs={logs} />
        </div>
      </div>

      {/* Footer Decoration */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-8 opacity-20 text-[8px] tracking-[0.5em] uppercase font-mono z-10">
        <span>Mark VII System</span>
        <div className="w-24 h-px bg-jarvis-blue" />
        <span>Quantum Process Layer 2</span>
      </div>
    </div>
  );
}
