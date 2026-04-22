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
  
  const voiceTargetRef = useRef<VoiceEngine | null>(null);
  const brainTargetRef = useRef<JarvisBrain | null>(null);

  // Initialize Services
  useEffect(() => {
    if (!voiceTargetRef.current) voiceTargetRef.current = new VoiceEngine();
    if (!brainTargetRef.current && GEMINI_API_KEY) {
      brainTargetRef.current = new JarvisBrain(GEMINI_API_KEY);
    }
  }, []);

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
    setIsSpeaking(true);
    voiceTargetRef.current?.speak(response.text, () => {
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
          <div className="w-10 h-10 border border-jarvis-blue/30 rounded flex items-center justify-center text-jarvis-blue shadow-[0_0_15px_rgba(0,229,255,0.2)]">
            <Settings size={20} className="animate-spin-slow" />
          </div>
          <div>
            <h1 className="font-display text-xl tracking-widest text-jarvis-blue glow-text">J.A.R.V.I.S.</h1>
            <p className="text-[10px] tracking-[0.3em] opacity-50 uppercase">Neural Network Interface v4.2</p>
          </div>
        </div>
        
        <div className="flex gap-6 font-mono text-[10px]">
          <div className="text-right">
            <div className="opacity-40">LOCAL TIME</div>
            <div className="text-jarvis-blue">{new Date().toLocaleTimeString()}</div>
          </div>
          <div className="text-right">
            <div className="opacity-40">UPLINK STATUS</div>
            <div className="text-green-400">ENCRYPTED</div>
          </div>
        </div>
      </div>

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
              {!GEMINI_API_KEY && (
                <div className="absolute top-20 bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-2 rounded text-[10px] font-mono">
                  SISTEMA DESATIVADO: CHAVE API NÃO ENCONTRADA
                </div>
              )}
              <button 
                onClick={toggleListening}
                disabled={!GEMINI_API_KEY || isSpeaking}
                className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 border shadow-[0_0_20px_rgba(0,229,255,0.1)] active:scale-95 ${
                  isListening 
                    ? "bg-red-500/20 border-red-500 text-red-500 shadow-red-500/40" 
                    : !GEMINI_API_KEY 
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
