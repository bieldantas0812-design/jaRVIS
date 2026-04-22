# 🤖 J.A.R.V.I.S. - Tutorial Completo de Instalação

Bem-vindo ao protocolo de inicialização do sistema JARVIS. Siga as instruções abaixo para configurar o assistente no seu ambiente.

---

## 1. Configuração no Google AI Studio (Nuvem)

Se você está usando este applet diretamente pelo navegador:

1. **Ativação da API Key**:
   - Vá no menu de **Secrets** (ícone de chave 🔑 no canto inferior esquerdo ou nas configurações).
   - Adicione um novo segredo com o nome: `GEMINI_API_KEY`.
   - No valor, cole a chave que você gerou: `.
2. **Permissões de Microfone**:
   - Ao clicar no botão de microfone (Ciano), o navegador pedirá permissão. Clique em **Permitir**.
3. **Reinicialização**:
   - Se o sistema indicar "Chave não encontrada", recarregue a página após salvar o Secret.

---

## 2. Instalação Local (Node.js/Web HUD)

Para rodar a interface HUD no seu PC igual está aqui:

### Pré-requisitos
- [Node.js](https://nodejs.org/) instalado (Versão 18 ou superior).

### Passo a Passo
1. **Baixe o Código**: Faça o download do ZIP do projeto ou clone o repositório.
2. **Instale as Dependências**:
   No terminal da pasta do projeto, digite:
   ```bash
   npm install
   ```
3. **Configure o Ambiente**:
   Crie um arquivo chamado `.env` na raiz e adicione sua chave:
   ```env
   GEMINI_API_KEY
   ```
4. **Inicie o Sistema**:
   ```bash
   npm run dev
   ```
5. **Acesse**: Abra `http://localhost:3000` no seu navegador (Chrome recomendado para Speech API).

---

## 3. Guia de Implementação Python (Controle Total do Windows)

Como solicitado, aqui está o tutorial para criar a ponte que controla o Windows de verdade (arquivos, mouse, teclado), usando o código fornecido como cérebro:

### Passo 1: Instale o Python no seu PC
[Download Python 3.10+](https://www.python.org/)

### Passo 2: Instale as bibliotecas necessárias
Abra o CMD/PowerShell e digite:
```bash
pip install google-generativeai SpeechRecognition pyttsx3 pyautogui flask flask-cors
```

### Passo 3: O Script de Automação (JarvisBridge.py)
Você pode usar o código abaixo para criar um backend Python que executa os comandos que o Jarvis envia:

```python
import pyautogui
import os
import pyttsx3
import speech_recognition as sr
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)
engine = pyttsx3.init()

@app.route('/execute', methods=['POST'])
def execute():
    data = request.json
    command = data.get('action')
    params = data.get('params', {})

    if command == 'open_app':
        os.system(f"start {params.get('name')}")
    elif command == 'search_web':
        os.system(f"start https://www.google.com/search?q={params.get('query')}")
    elif command == 'control_volume':
        # Exemplo simplificado usando atalhos de teclado
        for _ in range(5): pyautogui.press('volumeup')
        
    return jsonify({"status": "executed"})

if __name__ == '__main__':
    app.run(port=5000)
```

---

## 4. Comandos Prontos para Testar

Tente falar estas frases logo após ativar o microfone:

- **"Jarvis, você está aí?"** -> (Teste de conversa e personalidade)
- **"Como está o uso de memória do meu computador?"** -> (Teste de leitura de sensores)
- **"Jarvis, pesquise no Google sobre a velocidade da luz."** -> (Teste de automação web)
- **"Me conte uma piada inteligente, senhor Stark."** -> (Teste de contexto)

---

## 5. Dicas de Melhoria

- **Voz Premium**: No Windows Local, instale as vozes da Microsoft em Português (Ex: Maria ou Daniel) para uma fala mais fluida.
- **Microfone**: Use um microfone dedicado e evite ruídos no ambiente para que o reconhecimento de voz seja 100% preciso.
- **Modo Sempre Ouvindo**: No código `App.tsx`, você pode alterar a função `onEnd` do serviço de voz para reiniciar a escuta automaticamente, criando o modo contínuo.
