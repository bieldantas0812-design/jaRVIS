import { GoogleGenAI, ThinkingLevel } from "@google/genai";

const SYSTEM_PROMPT = `
Você é o JARVIS (Just A Rather Very Intelligent System), um assistente virtual elegante, inteligente e refinado.
Sua personalidade é inspirada no assistente de Tony Stark: oficial, prestativo, com um leve toque de sarcasmo britânico ocasional, mas sempre focado na eficiência.

DIRETRIZES:
1. Responda em Português do Brasil de forma natural.
2. Seja direto e informativo.
3. Se o usuário der um comando que você pode executar (identificado por nomes de funções), confirme a execução.
4. Mantenha o contexto da conversa.
5. Quando o usuário perguntar algo que exija ação no sistema, tente identificar a intenção.

FUNÇÕES DISPONÍVEIS (Identifique-as no seu raciocínio):
- open_app(name): Abrir um aplicativo.
- close_app(name): Fechar um aplicativo.
- control_volume(level): Ajustar volume (0-100).
- show_system_stats(): Mostrar status do sistema.
- search_web(query): Pesquisar na internet.
- create_note(text): Salvar uma nota.
- take_screenshot(): Capturar tela.

Se você detectar uma intenção de comando, responda confirmando a ação de forma elegante (ex: "Certamente, senhor. Iniciando o protocolo de pesquisa.").
`;

export interface JarvisResponse {
  text: string;
  command?: {
    action: string;
    params: any;
  };
}

export class JarvisBrain {
  private ai: GoogleGenAI;
  private chat: any;

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
    this.chat = this.ai.chats.create({
      model: "gemini-3-flash-preview",
      config: {
        systemInstruction: SYSTEM_PROMPT,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      }
    });
  }

  async processInput(input: string, mode: 'gemini' | 'ollama' = 'gemini', model?: string): Promise<JarvisResponse> {
    if (mode === 'ollama') {
      try {
        const response = await fetch("/api/ollama", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: `Responda como o assistente JARVIS: ${input}`, model: model || 'llama3' })
        });
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        return { text: data.text };
      } catch (error) {
        return { text: "Senhor, não consegui conexão com o servidor Ollama local. Certifique-se de que ele está ativo." };
      }
    }

    try {
      const result = await this.chat.sendMessage(input);
      const text = result.text;
      
      let command = undefined;
      const lowerInput = input.toLowerCase();
      if (lowerInput.includes("status do sistema") || lowerInput.includes("como está o pc")) {
        command = { action: "show_system_stats", params: {} };
      } else if (lowerInput.includes("pesquise") || lowerInput.includes("procure por")) {
        const query = input.replace(/pesquise|procure por|jarvis/gi, "").trim();
        command = { action: "search_web", params: { query } };
      }

      return { text: text || "Resposta vazia recebida.", command };
    } catch (error: any) {
      console.error("Jarvis Brain Error:", error);
      const errorMsg = error?.message || "Erro desconhecido";
      return { text: `Senhor, detectei uma falha nos meus sistemas neurais. Identificador: ${errorMsg}` };
    }
  }
}
