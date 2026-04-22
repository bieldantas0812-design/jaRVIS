import { motion } from "motion/react";
import { Mic, Terminal, Activity, Settings, Power, Volume2, Shield, Search } from "lucide-react";

interface StatusPanelProps {
  systemStats: any;
}

export function StatusPanel({ systemStats }: StatusPanelProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="hud-border p-4 rounded-lg flex flex-col gap-2">
        <div className="flex items-center gap-2 text-jarvis-blue text-xs font-display glow-text">
          <Activity size={14} />
          <span>RECURSOS DO SISTEMA</span>
        </div>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-[10px] mb-1">
              <span>CPU LOAD</span>
              <span>{systemStats.cpuLoad}%</span>
            </div>
            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-jarvis-blue"
                initial={{ width: 0 }}
                animate={{ width: `${systemStats.cpuLoad}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-[10px] mb-1">
              <span>MEMORY UTILIZATION</span>
              <span>{systemStats.memoryUsage}%</span>
            </div>
            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-jarvis-blue"
                initial={{ width: 0 }}
                animate={{ width: `${systemStats.memoryUsage}%` }}
              />
            </div>
          </div>
        </div>
      </div>
      
      <div className="hud-border p-4 rounded-lg flex flex-col gap-2">
        <div className="flex items-center gap-2 text-jarvis-blue text-xs font-display glow-text">
          <Shield size={14} />
          <span>STATUS DE SEGURANÇA</span>
        </div>
        <div className="text-[10px] text-green-400 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          FIREWALL ATIVO
        </div>
        <div className="text-[10px] text-jarvis-blue/60 mt-1">
          NÚCLEO NEURAL: ESTÁVEL
        </div>
      </div>
    </div>
  );
}

export function CommandLog({ logs }: { logs: string[] }) {
  return (
    <div className="hud-border p-4 rounded-lg flex-1 overflow-hidden flex flex-col min-h-[200px]">
      <div className="flex items-center gap-2 text-jarvis-blue text-xs font-display mb-3 glow-text text-center justify-center">
        <Terminal size={14} />
        <span>REGISTRO DE COMANDOS</span>
      </div>
      <div className="flex-1 overflow-y-auto space-y-2 font-mono text-[10px] pr-2 custom-scrollbar">
        {logs.map((log, i) => (
          <div key={i} className="flex gap-2 border-l border-jarvis-blue/20 pl-2">
            <span className="opacity-40">[{new Date().toLocaleTimeString()}]</span>
            <span className={log.startsWith(">") ? "text-jarvis-blue" : "text-white/70"}>
              {log}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function VoiceAvatar({ isSpeaking, isListening, volume = 0 }: { isSpeaking: boolean, isListening: boolean, volume?: number }) {
  const pulseScale = isListening ? 1 + (volume / 255) : 1;
  
  return (
    <div className="relative w-48 h-48 flex items-center justify-center">
      {/* ... rings ... */}
      <motion.div 
        className="absolute inset-0 border-2 border-jarvis-blue/10 rounded-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
      />
      
      <motion.div 
        className="absolute inset-4 border border-dashed border-jarvis-blue/30 rounded-full"
        animate={{ rotate: -360 }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
      />

      {/* Central Core */}
      <motion.div 
        className={`w-24 h-24 rounded-full flex items-center justify-center relative overflow-hidden bg-jarvis-blue/5 border border-jarvis-blue/20`}
        animate={{ 
          scale: isSpeaking ? [1, 1.1, 1] : pulseScale,
          boxShadow: (isSpeaking || (isListening && volume > 20)) ? "0 0 30px var(--color-jarvis-glow)" : "0 0 10px rgba(0,229,255,0.1)"
        }}
        transition={{ duration: 0.1 }}
      >
        {isListening && (
          <motion.div 
            className="absolute inset-0 border-2 border-jarvis-blue/20 rounded-full"
            animate={{ scale: [1, 2], opacity: [0.3, 0] }}
            transition={{ duration: 0.8, repeat: Infinity }}
          />
        )}
        
        {/* Core glow */}
        <div className="w-16 h-16 rounded-full bg-jarvis-blue/20 flex items-center justify-center blur-sm" />
        <div className="absolute w-8 h-8 rounded-full bg-jarvis-blue/40 flex items-center justify-center" />
      </motion.div>
    </div>
  );
}
