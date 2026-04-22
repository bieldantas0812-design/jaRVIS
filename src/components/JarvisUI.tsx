import { motion, AnimatePresence } from "motion/react";
import { Activity, Cpu, Database, Terminal, Shield, Cpu as CpuIcon, Zap } from "lucide-react";

export function StatusPanel({ systemStats }: { systemStats: any }) {
  return (
    <div className="premium-card h-full flex flex-col border border-white/5 bg-jarvis-carbon/80 backdrop-blur-xl">
      <div className="px-4 py-3 border-b border-white/5 flex justify-between items-center bg-white/5">
        <span className="technical-label">Sistemas de Monitoramento</span>
        <Activity size={12} className="text-jarvis-accent animate-pulse" />
      </div>
      
      <div className="p-5 space-y-6 flex-1">
        {/* CPU */}
        <div className="space-y-3">
          <div className="flex justify-between items-end">
            <div className="flex items-center gap-2">
              <CpuIcon size={14} className="text-white/40" />
              <span className="text-[10px] uppercase font-medium tracking-tight text-white/60">Processamento Core</span>
            </div>
            <span className="font-mono text-xs text-jarvis-accent">{systemStats.cpuLoad}%</span>
          </div>
          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-jarvis-accent shadow-[0_0_8px_var(--color-jarvis-accent)]"
              initial={{ width: 0 }}
              animate={{ width: `${systemStats.cpuLoad}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* Memory */}
        <div className="space-y-3">
          <div className="flex justify-between items-end">
            <div className="flex items-center gap-2">
              <Database size={14} className="text-white/40" />
              <span className="text-[10px] uppercase font-medium tracking-tight text-white/60">Memória Neural</span>
            </div>
            <span className="font-mono text-xs text-jarvis-accent">{systemStats.memoryUsage}%</span>
          </div>
          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-jarvis-accent shadow-[0_0_8px_var(--color-jarvis-accent)]"
              initial={{ width: 0 }}
              animate={{ width: `${systemStats.memoryUsage}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* Neural Cache / Misc */}
        <div className="grid grid-cols-2 gap-3 pt-4">
          <div className="bg-white/5 rounded-lg p-3 border border-white/5">
            <div className="technical-label mb-1 uppercase">Link Local</div>
            <div className="text-[10px] font-mono text-green-400">ATIVO</div>
          </div>
          <div className="bg-white/5 rounded-lg p-3 border border-white/5">
            <div className="technical-label mb-1 uppercase">Latência</div>
            <div className="text-[10px] font-mono text-jarvis-accent">24ms</div>
          </div>
        </div>
      </div>

      <div className="p-4 mt-auto border-t border-white/5 bg-black/20">
        <div className="flex items-center gap-2 mb-2">
          <Shield size={12} className="text-jarvis-accent" />
          <span className="technical-label">Status de Segurança</span>
        </div>
        <div className="text-[10px] font-mono text-white/30 italic">Protocolos Mark VII Operacionais</div>
      </div>
    </div>
  );
}

export function VoiceAvatar({ isSpeaking, isListening, isThinking, volume = 0 }: { isSpeaking: boolean, isListening: boolean, isThinking?: boolean, volume?: number }) {
  const pulseScale = isListening ? 1 + (volume / 255) * 0.5 : 1;
  const orbColor = isSpeaking ? "bg-white" : isThinking ? "bg-jarvis-accent" : "bg-jarvis-accent";

  return (
    <div className="relative w-64 h-64 flex items-center justify-center">
      {/* Outer Glow Halo */}
      <AnimatePresence>
        {(isSpeaking || isListening) && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.1, scale: 1.3 }}
            exit={{ opacity: 0, scale: 1.5 }}
            className="absolute inset-0 bg-jarvis-accent rounded-full blur-[60px]"
          />
        )}
      </AnimatePresence>

      {/* Decorative Hardware Rings */}
      <div className="absolute inset-2 border border-white/[0.03] rounded-full" />
      <div className="absolute inset-10 border border-white/[0.05] rounded-full" />
      
      <motion.div 
        className="absolute inset-0 border border-white/[0.08] rounded-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
      />
      
      <motion.div 
        className="absolute inset-6 border border-dashed border-white/10 rounded-full"
        animate={{ rotate: -360 }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
      />

      {/* The Central Orb (The Soul) */}
      <motion.div 
        className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center ${orbColor} shadow-[0_0_50px_var(--color-jarvis-accent-dim)] transition-colors duration-500`}
        animate={{ 
          scale: isThinking ? [1, 1.05, 1] : isSpeaking ? [1, 1.1, 1] : pulseScale,
          boxShadow: isSpeaking ? "0 0 60px rgba(255,255,255,0.3)" : "0 0 40px var(--color-jarvis-accent-dim)"
        }}
        transition={{ duration: isThinking ? 0.8 : 0.1, repeat: isThinking ? Infinity : 0 }}
      >
        {/* Inner Detail */}
        <div className="w-20 h-20 rounded-full border border-black/5 mix-blend-overlay" />
        
        {/* Scanning Light Effect */}
        <motion.div 
          className="absolute inset-0 bg-gradient-to-t from-transparent via-white/10 to-transparent"
          animate={{ top: ["100%", "-100%"] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        />
        
        {/* Core depth glow */}
        <div className="absolute inset-4 rounded-full bg-black/20 blur-[2px]" />
      </motion.div>

      {/* Data Orbitals */}
      {isThinking && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-jarvis-accent rounded-full"
              initial={{ rotate: i * 45 }}
              animate={{ rotate: i * 45 + 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              style={{ transformOrigin: "128px 128px" }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function CommandLog({ logs }: { logs: string[] }) {
  return (
    <div className="premium-card h-full flex flex-col border border-white/5 bg-jarvis-carbon/80 backdrop-blur-xl">
      <div className="px-4 py-3 border-b border-white/5 flex justify-between items-center bg-white/5">
        <span className="technical-label text-white/50">Console Técnico</span>
        <Terminal size={12} className="text-white/20" />
      </div>
      <div className="flex-1 p-4 font-mono text-[10px] overflow-y-auto space-y-2 custom-scrollbar bg-black/10">
        {logs.map((log, i) => (
          <div key={i} className={`flex gap-3 py-0.5 border-l-2 pl-3 transition-colors duration-300 ${
            log.startsWith('JARVIS:') ? 'border-white/20 text-white/80' : 
            log.startsWith('>') ? 'border-jarvis-accent/50 text-jarvis-accent' : 
            'border-transparent text-white/30'
          }`}>
            <span className="opacity-10 text-[8px] flex-shrink-0 mt-0.5">[{new Date().toLocaleTimeString().split(' ')[0]}]</span>
            <span className="leading-relaxed tracking-tight">{log}</span>
          </div>
        ))}
        {logs.length === 0 && (
          <div className="h-full flex items-center justify-center opacity-10">
            <span className="technical-label">Aguardando Input...</span>
          </div>
        )}
      </div>
    </div>
  );
}
