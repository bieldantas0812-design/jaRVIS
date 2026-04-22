import { GoogleGenAI } from "@google/genai";

export interface JarvisResponse {
  text: string;
  command?: {
    action: string;
    params: any;
  };
  intent: 'chat' | 'automation' | 'search' | 'system';
}

export class JarvisBrain {
  private genAI: GoogleGenAI;
  private model: any;
  private chat: any;

  constructor(apiKey: string) {
    if (!apiKey || apiKey.trim() === "") {
      throw new Error("API Key is required for JarvisBrain");
    }
    
    this.genAI = new GoogleGenAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash",
      systemInstruction: `Você é o JARVIS (Just A Rather Very Intelligent System). 
      Sua personalidade: Altamente sofisticado, eficiente, direto, levemente sarcástico/britânico e focado em produtividade.
      Seu objetivo: Assistir o usuário no Windows.
      
      CLASSIFICAÇÃO DE INTENÇÃO:
      - Se o usuário pedir para abrir algo, clicar, digitar, fechar ou mexer no pc, use INTENT: automation.
      - Se for uma pergunta geral, use INTENT: chat.
      - Se pedir para pesquisar algo na internet, use INTENT: search.
      
      FORMATO DE RESPOSTA (Obrigatório):
      Responda de forma natural, mas internamente identifique se é um comando.
      Ao detectar um comando, use palavras chave como [EXECUTE: action_name(params)].
      Ações disponíveis: 
      - open_app(name)
      - close_app(name)
      - type_text(content)
      - press_key(key)
      - move_mouse(x, y)
      - click(button)
      - search_web(query)
      - screenshot()
      - set_volume(level)
      - shutdown()
      - lock_pc()

      Responda sempre em Português do Brasil de forma elegante.`
    });
    this.chat = this.model.startChat({
      history: [],
      generationConfig: {
        maxOutputTokens: 200,
        temperature: 0.7,
      },
    });
  }

  async processInput(input: string, mode: 'gemini' | 'ollama' = 'gemini', modelName?: string): Promise<JarvisResponse> {
    if (mode === 'ollama') {
      try {
        const response = await fetch("/api/ollama", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            prompt: `### JARVIS CORE SYSTEM
            User Request: ${input}
            Instructions: Identify if this is a system command or chat. Respond briefly and elegantly in PT-BR.
            If command, include [EXECUTE: action(params)].
            Models available tools: open_app, search_web, type_text, click.`, 
            model: modelName || 'gemma3:4b' 
          })
        });
        const data = await response.json();
        if (data.error) throw new Error(data.error);

        const text = data.text;
        const command = this.extractCommand(text);
        return { 
          text: text.replace(/\[EXECUTE:.*\]/g, '').trim(), 
          command,
          intent: command ? 'automation' : 'chat'
        };
      } catch (error) {
        return { text: "Senhor, falha na conexão com o motor Ollama local.", intent: 'system' };
      }
    }

    try {
      const result = await this.chat.sendMessage(input);
      const text = result.response.text();
      const command = this.extractCommand(text);
      
      let intent: 'chat' | 'automation' | 'search' | 'system' = 'chat';
      if (command) {
        intent = command.action === 'search_web' ? 'search' : 'automation';
      }

      return { 
        text: text.replace(/\[EXECUTE:.*\]/g, '').trim(), 
        command,
        intent 
      };
    } catch (error: any) {
      console.error("Jarvis Brain Error:", error);
      return { 
        text: `Senhor, houve um erro no processador neural. Detalhe: ${error.message || 'Desconhecido'}`, 
        intent: 'system' 
      };
    }
  }

  private extractCommand(text: string) {
    const match = text.match(/\[EXECUTE:\s*(\w+)\((.*)\)\]/);
    if (match) {
      const action = match[1];
      const paramsStr = match[2];
      try {
        // Simple attempt to parse common patterns
        const params: any = {};
        if (action === 'open_app' || action === 'search_web' || action === 'type_text') {
           params.query = paramsStr.replace(/['"]/g, '');
        }
        return { action, params };
      } catch (e) {
        return { action, params: { raw: paramsStr } };
      }
    }
    return undefined;
  }
}
