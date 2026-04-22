# JARVIS System - Virtual Assistant

Um assistente virtual futurista inspirado no JARVIS do Homem de Ferro, construído com React, Node.js e Gemini AI.

## Funcionalidades
- **Reconhecimento de Voz**: Compreensão de fala em Português (PT-BR) em tempo real.
- **Resposta por Voz**: Respostas narradas com síntese de voz natural.
- **Cérebro IA**: Integrado com Google Gemini 2.0 para uma personalidade elegante e inteligente.
- **Interface HUD**: Design futurista com animações suaves e monitoramento de sistema.
- **Simulação de Controle**: Detecção de intenções para buscas na web, notas e status do sistema.

## Estrutura do Projeto (Web/Node)
- `/src/services/jarvisBrain.ts`: Lógica de IA e processamento de linguagem.
- `/src/services/voiceEngine.ts`: Integração com Browser Speech APIs.
- `/server.ts`: Backend Express para monitoramento de recursos do servidor.
- `/src/components/JarvisUI.tsx`: Componentes visuais da interface HUD.

---

## Sugestão de Arquitetura Desktop (Windows/Python)
Para converter este projeto em um assistente local para Windows com controle total de arquivos e programas, siga esta estrutura modular recomendada em Python:

### Estrutura de Pastas
```
jarvis_desktop/
├── main.py                  # Ponto de entrada
├── speech_to_text/          # Módulo vosc ou whisper
│   └── recognizer.py
├── text_to_speech/          # Módulo pyttsx3 ou gTTS
│   └── speaker.py
├── ai_brain/                # Integração Gemini/Google GenAI
│   └── chat_engine.py
├── command_executor/        # Lógica de automação
│   ├── app_control.py       # Abrir/fechar apps
│   ├── system_control.py    # Volume, brilho, energia
│   └── web_control.py       # Browse, search
├── ui/                      # Interface (CustomTkinter ou PySide6)
│   └── dashboard.py
├── config/                  # Configurações locais (YAML/JSON)
└── utils/                   # Logs e Helpers
```

### Principais Bibliotecas Python Sugetidas:
- `google-generativeai`: Para o cérebro do Jarvis.
- `SpeechRecognition`: Para capturar áudio.
- `pyttsx3`: Para fala offline ou `Edge-TTS` para fala online premium.
- `pyautogui`: Para controle de mouse e teclado.
- `win32gui` / `subprocess`: Para gerenciar janelas e processos do Windows.

## Como usar este projeto
1. Ative o microfone no navegador.
2. Clique no ícone de microfone.
3. Fale comandos como "Como está o sistema?" ou "Jarvis, pesquise sobre buracos negros".
4. Ouça a resposta elegante do JARVIS.
