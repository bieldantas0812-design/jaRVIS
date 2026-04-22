import { GoogleGenAI } from "@google/genai";

export interface JarvisAction {
  action: string;
  params: any;
  confidence: number;
}

export interface JarvisResponse {
  text: string;
  action?: JarvisAction;
  intent: 'chat' | 'automation' | 'search' | 'system';
}

export class JarvisBrain {
  private genAI: any;
  private model: any;
  private chat: any;

  constructor(apiKey?: string) {
    try {
      if (apiKey && apiKey.length > 10) {
        // Tenta os dois formatos comuns do SDK Gemini
        try {
          this.genAI = new GoogleGenAI(apiKey);
        } catch (e) {
          this.genAI = new (GoogleGenAI as any)({ apiKey });
        }

        this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        this.chat = this.model.startChat({
          history: [],
          generationConfig: { temperature: 0.4, maxOutputTokens: 250 }
        });
        console.log("[JARVIS_BRAIN] Core Neural sincronizado.");
      } else {
        console.log("[JARVIS_BRAIN] Modo Local Ativo.");
      }
    } catch (err) {
      console.error("[JARVIS_BRAIN] Erro crítico construtor:", err);
    }
  }

  // Limpa o texto para o TTS (remove marcações, comandos e lixo de texto)
  public cleanTextForSpeech(text: string): string {
    return text
      .replace(/\[EXECUTE:.*?\]/g, '') // Remove comandos
      .replace(/[*_#`]/g, '')           // Remove formatação markdown
      .replace(/\(.*?\)/g, '')          // Remove textos entre parênteses (notas técnicas)
      .replace(/https?:\/\/\S+/g, 'link externo') // Simplifica URLs
      .trim();
  }

  async processInput(input: string, mode: 'gemini' | 'ollama' = 'gemini', modelName?: string): Promise<JarvisResponse> {
    const startTime = Date.now();
    console.log(`[INTENT_ROUTER] Initing process for: ${input}`);

    if (mode === 'ollama') {
      return this.processLocal(input, modelName);
    }

    try {
      const prompt = `Classifique e responda à solicitação: "${input}". 
      Se for um comando para o PC, inclua [EXECUTE: acao(params)]. 
      Responda de forma curta e elegante em PT-BR.`;
      
      const result = await this.chat.sendMessage(prompt);
      const text = result.response.text();
      const action = this.extractAction(text);
      
      console.log(`[INTENT_ROUTER] Success in ${Date.now() - startTime}ms. Intent: ${action ? 'automation' : 'chat'}`);

      return {
        text: text,
        action: action,
        intent: action ? 'automation' : 'chat'
      };
    } catch (error: any) {
      console.error("[INTENT_ROUTER] Fault:", error);
      return { text: "Senhor, houve um erro no processador logístico.", intent: 'system' };
    }
  }

  private async processLocal(input: string, model: string = 'gemma3:4b'): Promise<JarvisResponse> {
    try {
      const res = await fetch("/api/ollama", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: input, model })
      });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || `HTTP ${res.status}`);
      }
      
      const data = await res.json();
      const action = this.extractAction(data.text);
      
      return {
        text: data.text,
        action: action,
        intent: action ? 'automation' : 'chat'
      };
    } catch (error: any) {
      console.error("[LOCAL_PROCESS] Fault:", error);
      throw new Error(`Conexão Ollama: ${error.message}`);
    }
  }

  private extractAction(text: string): JarvisAction | undefined {
    const match = text.match(/\[EXECUTE:\s*(\w+)\((.*)\)\]/);
    if (!match) return undefined;

    return {
      action: match[1],
      params: match[2].replace(/['"]/g, '').split(',').map(s => s.trim()),
      confidence: 1.0
    };
  }
}
