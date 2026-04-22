export class VoiceEngine {
  private recognition: any;
  private synthesis: SpeechSynthesis;
  private voices: SpeechSynthesisVoice[] = [];

  constructor() {
    this.synthesis = window.speechSynthesis;
    this.setupRecognition();
    this.loadVoices();
  }

  private setupRecognition() {
    if ('webkitSpeechRecognition' in window) {
      // @ts-ignore
      this.recognition = new webkitSpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.lang = 'pt-BR';
    } else {
      console.warn("Reconhecimento de voz não suportado neste navegador.");
    }
  }

  private loadVoices() {
    this.voices = this.synthesis.getVoices();
    this.synthesis.onvoiceschanged = () => {
      this.voices = this.synthesis.getVoices();
    };
  }

  public listen(onResult: (text: string, isFinal: boolean) => void, onEnd: () => void) {
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

    this.recognition.onend = onEnd;
    this.recognition.start();
  }

  public stopListening() {
    if (this.recognition) this.recognition.stop();
  }

  public speak(text: string, onEnd?: () => void) {
    // Cancel current speaking
    this.synthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    
    // Attempt to find a "natural" male voice if possible, else default
    const preferredVoice = this.voices.find(v => (v.name.includes('Daniel') || v.name.includes('Google')) && v.lang.startsWith('pt'));
    if (preferredVoice) utterance.voice = preferredVoice;
    
    utterance.rate = 1.05; // Slightly faster for that JARVIS efficiency
    utterance.pitch = 0.95; // Slightly deeper

    if (onEnd) utterance.onend = onEnd;
    
    this.synthesis.speak(utterance);
  }
}
