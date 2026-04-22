export class VoiceEngine {
  private synth: SpeechSynthesis;
  private recognition: any;
  private voices: SpeechSynthesisVoice[] = [];

  constructor() {
    this.synth = window.speechSynthesis;
    this.setupRecognition();
    this.loadVoices();
  }

  private loadVoices() {
    const loader = () => {
      this.voices = this.synth.getVoices();
    };
    loader();
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = loader;
    }
  }

  private setupRecognition() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Speech Recognition not supported in this browser.");
      return;
    }
    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.recognition.lang = 'pt-BR';
  }

  speak(text: string, onEnd?: () => void) {
    // Interrompe fala anterior para reduzir latência de resposta
    this.synth.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    // Configurações para voz premium e rápida
    utterance.rate = 1.2; 
    utterance.pitch = 0.95;
    
    // Tenta encontrar uma voz masculina/soberba em PT-BK
    const ptVoice = this.voices.find(v => v.lang.includes('pt-BR') && (v.name.includes('Daniel') || v.name.includes('Male')));
    if (ptVoice) utterance.voice = ptVoice;

    utterance.onend = () => {
      if (onEnd) onEnd();
    };
    this.synth.speak(utterance);
  }

  listen(onResult: (text: string, isFinal: boolean) => void, onEnd: () => void) {
    if (!this.recognition) return;

    this.recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      onResult(finalTranscript || interimTranscript, finalTranscript !== '');
    };

    this.recognition.onerror = (event: any) => {
      console.error("Speech Recognition Error:", event.error);
      onEnd();
    };

    this.recognition.onend = onEnd;
    this.recognition.start();
  }

  stopListening() {
    if (this.recognition) {
      this.recognition.stop();
    }
  }
}
