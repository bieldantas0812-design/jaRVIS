import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Mic, MicOff, Settings, Power, Maximize2, Minimize2, Cpu, Zap, Activity, Terminal } from "lucide-react";
import { StatusPanel, CommandLog, VoiceAvatar } from "./components/JarvisUI";
import { JarvisBrain } from "./services/jarvisBrain";
import { VoiceEngine } from "./services/voiceEngine";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export default function App() {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [logs, setLogs] = useState<string[]>(["SYSTEM MARK VII ONLINE", "NEURAL LINK ESTABLISHED"]);
  const [volume, setVolume] = useState(0);
  const [bridgeStatus, setBridgeStatus] = useState<'online' | 'offline'>('offline');
  const [systemStats, setSystemStats] = useState({ cpuLoad: 0, memoryUsage: 0, uptime: 0, platform: "windows" });
  
  const [showSettings, setShowSettings] = useState(false);
  const [assistantName, setAssistantName] = useState("JARVIS");
  const [userName, setUserName] = useState("Senhor");
  const [localApiKey, setLocalApiKey] = useState(GEMINI_API_KEY || "");
  const [aiMode, setAiMode] = useState<'gemini' | 'ollama'>('gemini');
  const [ollamaModel, setOllamaModel] = useState("gemma3:4b");
  
  const voiceTargetRef = useRef<VoiceEngine | null>(null);
  const brainTargetRef = useRef<JarvisBrain | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  // Initialize Services
  const addLog = useCallback((msg: string) => {
    setLogs(prev => [msg, ...prev].slice(0, 50));
  }, []);

  const initBrain = useCallback((key?: string) => {
    try {
      brainTargetRef.current = new JarvisBrain(key);
      if (key && key.length > 10) {
        addLog("NÚCLEO NEURAL SINCRONIZADO");
      } else {
        addLog("NÚCLEO INICIALIZADO (MODO LOCAL)");
      }
    } catch (e) {
      console.error("Brain initialization failed", e);
      addLog("ERRO NA SINCRONIZAÇÃO NEURAL");
    }
  }, [addLog]);

  useEffect(() => {
    if (!voiceTargetRef.current) voiceTargetRef.current = new VoiceEngine();
    
    // Inicializa o cérebro se ainda não existir
    if (!brainTargetRef.current) {
      initBrain(localApiKey);
    }
  }, [localApiKey, initBrain]);

  // Real-time Audio Visualization
  const startVisualizer = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;
      
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      const updateVolume = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) sum += dataArray[i];
        const average = sum / bufferLength;
        setVolume(average);
        requestAnimationFrame(updateVolume);
      };
      updateVolume();
    } catch (e) {
      console.error("Audio visualizer failed", e);
    }
  };

  useEffect(() => {
    startVisualizer();
  }, []);

  // Heartbeat check for Bridge
  const checkBridge = useCallback(async () => {
    try {
      const res = await fetch("http://localhost:5001/heartbeat");
      if (res.ok) setBridgeStatus('online');
      else setBridgeStatus('offline');
    } catch {
      setBridgeStatus('offline');
    }
  }, []);

  useEffect(() => {
    checkBridge();
    const timer = setInterval(checkBridge, 10000);
    return () => clearInterval(timer);
  }, [checkBridge]);

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

  const handleBrainResponse = async (input: string) => {
    if (!brainTargetRef.current) {
        if (aiMode === 'gemini' && !localApiKey) {
            addLog("ERRO: CHAVE API AUSENTE");
            return;
        }
    }
    
    addLog(`> AUDIO_IN: "${input}"`);
    setIsThinking(true);
    
    try {
      const response = await brainTargetRef.current!.processInput(input, aiMode, ollamaModel);
      setIsThinking(false);
      
      if (response.action) {
        addLog(`[INTENT] AUTOMATION -> ${response.action.action}`);
        if (bridgeStatus === 'offline') {
           addLog("!!! ERRO: BRIDGE NATIVA DESCONECTADA");
        } else {
          try {
            const bridgeRes = await fetch("http://localhost:5001/execute", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(response.action)
            });
            const bridgeData = await bridgeRes.json();
            addLog(`[BRIDGE] ${bridgeData.message}`);
          } catch (e) {
            addLog("!!! FALHA NA COMUNICAÇÃO COM A PONTE");
          }
        }
      }

      // Limpa texto para o TTS
      const cleanText = brainTargetRef.current!.cleanTextForSpeech(response.text);
      addLog(`JARVIS: ${cleanText}`);
      
      const personalizedText = cleanText.replace(/Senhor/g, userName);
      
      setIsSpeaking(true);
      voiceTargetRef.current?.speak(personalizedText, () => {
        setIsSpeaking(false);
      });
    } catch (error: any) {
      setIsThinking(false);
      console.error("Critical Brain Failure:", error);
      const msg = error?.message || "ERRO DESCONHECIDO";
      addLog(`!!! FALHA NO PROCESSADOR: ${msg.toUpperCase()}`);
    }
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
    <div className="relative h-screen w-screen bg-jarvis-slate overflow-hidden flex flex-col font-sans">
      {/* Background Decorative Elements */}
      <div className="noise-overlay" />
      <div className="scanline-overlay" />
      
      {/* HUD Grid Background */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(circle_at_50%_50%,var(--color-jarvis-accent),transparent)]" />
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:100px_100px]" />

      {/* Top Navigation Bar */}
      <header className="z-20 flex justify-between items-center px-8 py-6 border-b border-white/5 bg-jarvis-carbon/30 backdrop-blur-sm">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => setShowSettings(true)}
            className="group relative p-2 rounded-lg border border-white/5 hover:border-jarvis-accent/40 bg-white/[0.02] transition-all"
          >
            <Settings size={18} className="text-white/40 group-hover:text-jarvis-accent transition-colors" />
          </button>
          <div>
            <h1 className="font-display font-semibold tracking-widest text-lg text-white/90 uppercase">{assistantName} <span className="text-jarvis-accent ml-1 font-mono text-[10px] tracking-normal">Core Mk VII</span></h1>
            <div className="flex gap-3 items-center mt-1">
              <span className="technical-label flex items-center gap-1"><div className="w-1 h-1 rounded-full bg-green-500" /> Neural Link: Secure</span>
              <span className="technical-label">Active: {userName}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-8">
          <div className="text-right">
            <div className="technical-label mb-1">Carga do Núcleo</div>
            <div className="font-mono text-sm text-jarvis-accent">{systemStats.cpuLoad}%</div>
          </div>
          <div className="text-right">
            <div className="technical-label mb-1">Horário Local</div>
            <div className="font-mono text-sm text-white/60 tracking-wider font-light">{new Date().toLocaleTimeString()}</div>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 z-10 grid grid-cols-12 gap-8 p-10 overflow-hidden">
        {/* Left Side: Stats & Diagnostics */}
        <section className="col-span-3 h-full">
           <StatusPanel systemStats={systemStats} />
        </section>

        {/* Center: The Neural Core (Avatar) */}
        <section className="col-span-6 flex flex-col items-center justify-center relative">
          <div className="relative mb-12">
            <VoiceAvatar 
              isSpeaking={isSpeaking} 
              isListening={isListening} 
              isThinking={isThinking} 
              volume={volume} 
            />
          </div>

          <div className="w-full max-w-xl flex flex-col items-center">
            <AnimatePresence mode="wait">
              {transcript && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="mb-8 px-6 py-3 premium-card bg-jarvis-accent/5 border-jarvis-accent/20 rounded-2xl"
                >
                   <p className="font-mono text-jarvis-accent text-sm italic tracking-tight">"{transcript}"</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Interaction Controls */}
            <div className="relative group">
              <div className="absolute inset-0 bg-jarvis-accent opacity-0 group-hover:opacity-10 blur-2xl transition-opacity rounded-full" />
              <button 
                onClick={toggleListening}
                disabled={(aiMode === 'gemini' && !localApiKey) || isSpeaking}
                className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500 border relative z-10 overflow-hidden ${
                  isListening 
                    ? "bg-red-500/10 border-red-500/40 text-red-500 shadow-[0_0_40px_rgba(239,68,68,0.2)]" 
                    : (aiMode === 'gemini' && !localApiKey)
                      ? "opacity-10 grayscale border-white/5 cursor-not-allowed"
                      : "bg-jarvis-carbon/50 border-white/10 text-white hover:border-jarvis-accent hover:text-jarvis-accent shadow-xl"
                }`}
              >
                {isListening ? <MicOff size={32} /> : <Mic size={32} />}
                
                {/* Visual pulse for button when listening */}
                {isListening && (
                  <motion.div 
                    className="absolute inset-0 border-2 border-red-500 rounded-full"
                    animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                )}
              </button>
            </div>

            <div className="mt-8 flex flex-col items-center">
              <span className="technical-label tracking-[0.4em] mb-2">{isListening ? "Capturando Ondas Sonoras" : isThinking ? "Decodificando Intent" : isSpeaking ? "Sincronizando Resposta" : "Núcleo em Espera"}</span>
              <div className="flex gap-4 items-center mt-2">
                <div className="flex gap-1">
                  {[...Array(3)].map((_, i) => (
                    <motion.div 
                      key={i}
                      className={`w-1 h-1 rounded-full ${isThinking || isSpeaking || isListening ? 'bg-jarvis-accent' : 'bg-white/10'}`}
                      animate={(isThinking || isSpeaking || isListening) ? { opacity: [0.3, 1, 0.3] } : {}}
                      transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }}
                    />
                  ))}
                </div>
                <div className={`text-[8px] font-mono tracking-widest ${bridgeStatus === 'online' ? 'text-green-500' : 'text-red-500/50'}`}>
                  BRIDGE: {bridgeStatus.toUpperCase()}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Right Side: Command History */}
        <section className="col-span-3 h-full flex flex-col overflow-hidden">
          <CommandLog logs={logs} />
        </section>
      </main>

      {/* Settings Modal (Overlay) */}
      <AnimatePresence>
        {showSettings && (
          <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             className="absolute inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-2xl p-6"
          >
            <motion.div 
               initial={{ scale: 0.95, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.95, opacity: 0 }}
               className="premium-card w-full max-w-xl p-10 relative bg-jarvis-carbon border border-white/10"
            >
               <button 
                 onClick={() => setShowSettings(false)}
                 className="absolute top-6 right-6 text-white/20 hover:text-white transition-colors"
               >
                 <Power size={20} />
               </button>

               <div className="flex items-center gap-4 mb-10">
                 <div className="p-3 bg-jarvis-accent/10 rounded-xl">
                   <Settings className="text-jarvis-accent" size={24} />
                 </div>
                 <div>
                   <h2 className="font-display text-xl tech-glow text-white">Configurações de Protocolo</h2>
                   <p className="text-[10px] text-white/30 uppercase tracking-widest mt-1">Sistemas de Automação Windows v7.0</p>
                 </div>
               </div>
               
               <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <label className="technical-label block mb-2">Cognição IA</label>
                      <div className="grid grid-cols-2 gap-2 bg-black/20 p-1 rounded-lg">
                        <button 
                          onClick={() => setAiMode('gemini')}
                          className={`py-2 text-[8px] rounded transition-all uppercase tracking-tighter ${aiMode === 'gemini' ? 'bg-jarvis-accent text-black font-bold' : 'text-white/40'}`}
                        >Gemini Cloud</button>
                        <button 
                          onClick={() => setAiMode('ollama')}
                          className={`py-2 text-[8px] rounded transition-all uppercase tracking-tighter ${aiMode === 'ollama' ? 'bg-jarvis-accent text-black font-bold' : 'text-white/40'}`}
                        >Ollama Local</button>
                      </div>
                    </div>

                    <div>
                      <label className="technical-label block mb-2">Identidade Assistente</label>
                      <input 
                        type="text" 
                        value={assistantName}
                        onChange={(e) => setAssistantName(e.target.value)}
                        className="w-full bg-black/20 border border-white/5 rounded-lg py-3 px-4 text-sm font-mono text-jarvis-accent focus:border-jarvis-accent/50 outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="technical-label block mb-2">Identidade Usuário</label>
                      <input 
                        type="text" 
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        className="w-full bg-black/20 border border-white/5 rounded-lg py-3 px-4 text-sm font-mono text-jarvis-accent focus:border-jarvis-accent/50 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-6">
                    {aiMode === 'gemini' ? (
                      <div>
                        <label className="technical-label block mb-2 text-white/50">Gemini API Token</label>
                        <input 
                          type="password" 
                          placeholder="AIza..."
                          value={localApiKey}
                          onChange={(e) => setLocalApiKey(e.target.value)}
                          className="w-full bg-black/20 border border-white/5 rounded-lg py-3 px-4 text-xs font-mono text-jarvis-accent outline-none"
                        />
                      </div>
                    ) : (
                      <div>
                        <label className="technical-label block mb-2 text-white/50">Modelo Ollama</label>
                        <input 
                          type="text" 
                          value={ollamaModel}
                          onChange={(e) => setOllamaModel(e.target.value)}
                          className="w-full bg-black/20 border border-white/5 rounded-lg py-3 px-4 text-sm font-mono text-jarvis-accent outline-none"
                        />
                      </div>
                    )}

                    <div className="pt-6 border-t border-white/5">
                      <div className="flex items-center justify-between mb-4">
                        <span className="technical-label">Automação Nativa</span>
                        <div className="text-[10px] text-green-500 font-mono">STANDBY</div>
                      </div>
                      <button 
                        onClick={() => {
                          initBrain(localApiKey);
                          setShowSettings(false);
                          addLog("SISTEMAS REINICIALIZADOS");
                        }}
                        className="w-full py-4 bg-jarvis-accent/10 border border-jarvis-accent/30 text-jarvis-accent font-display text-xs tracking-widest uppercase hover:bg-jarvis-accent hover:text-black transition-all rounded-xl font-semibold"
                      >
                        Sincronizar Protocolos
                      </button>
                    </div>
                  </div>
               </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer System Status */}
      <footer className="z-20 px-8 py-4 border-t border-white/5 bg-jarvis-slate flex justify-between items-center text-[8px] font-mono tracking-widest text-white/20 uppercase">
        <div className="flex gap-8">
          <span className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-jarvis-accent shadow-[0_0_5px_var(--color-jarvis-accent)]" /> Hardware Sync: Stable</span>
          <span>Encrypted Bridge: Active</span>
        </div>
        <div className="flex gap-8">
          <span>Neural Engine: v7.4.2</span>
          <span>Buffer: 0.02ms</span>
        </div>
      </footer>
    </div>
  );
}
