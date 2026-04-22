import os
import sys
import time
import json
import subprocess
import webbrowser
import pyautogui
import psutil
import pygetwindow as gw
import threading
from flask import Flask, request, jsonify
from flask_cors import CORS

# Configurações de Segurança do PyAutoGUI
pyautogui.FAILSAFE = True
pyautogui.PAUSE = 0.3

# Tenta importar motores de voz de alta qualidade
try:
    import pyttsx3
    engine = pyttsx3.init()
    # Ajuste para voz masculina/JARVIS no Windows
    voices = engine.getProperty('voices')
    for voice in voices:
        if "Portuguese" in voice.name or "Brazil" in voice.name:
            engine.setProperty('voice', voice.id)
            break
    engine.setProperty('rate', 170)
    engine.setProperty('volume', 1.0)
    VOICE_SUPPORT = True
except Exception as e:
    print(f"[ERROR] Falha ao iniciar voz nativa: {e}")
    VOICE_SUPPORT = False

app = Flask(__name__)
CORS(app)

print("=== JARVIS AUTOMATION BRIDGE v8.0 ===")
if VOICE_SUPPORT:
    print("[SYSTEM] Motor de Voz Nativa: ATIVO (Qualidade Premium)")
else:
    print("[SYSTEM] Motor de Voz: MODO FALLBACK (Instale 'pip install pyttsx3' para áudio nativo)")

def speak_native(text):
    if not VOICE_SUPPORT:
        return
    def run_speech():
        try:
            # Limpa o texto de caracteres estranhos para Prosódia estável
            clean_msg = text.replace("*", "").replace("_", "").replace("#", "").strip()
            print(f"[VOICE_CMD] Narrando: {clean_msg}")
            # Recria a instância se necessário para evitar bugs de thread
            local_engine = pyttsx3.init()
            local_engine.setProperty('rate', 170)
            local_engine.say(clean_msg)
            local_engine.runAndWait()
        except Exception as e:
            print(f"[VOICE_ERROR] Falha na síntese: {e}")
    
    # Roda em thread separada para não travar a API de comando
    threading.Thread(target=run_speech).start()

def execute_action(action, params):
    try:
        if action == "open_app":
            app_query = params[0] if params else ""
            print(f"[BRIDGE] Opening: {app_query}")
            subprocess.Popen(["start", "", app_query], shell=True)
            return True, f"Iniciando {app_query}."

        elif action == "search_web":
            query = params[0] if params else ""
            webbrowser.open(f"https://www.google.com/search?q={query}")
            return True, f"Pesquisando {query}."

        elif action == "type_text":
            text = params[0] if params else ""
            pyautogui.write(text, interval=0.01)
            return True, "Transcrição concluída."

        elif action == "press_key":
            key = params[0] if params else "enter"
            pyautogui.press(key)
            return True, f"Tecla {key} enviada."

        elif action == "screenshot":
            pyautogui.screenshot(f"capture_{int(time.time())}.png")
            return True, "Registro visual capturado."

        elif action == "ollama_proxy":
            prompt, model = params[0], params[1]
            print(f"[BRIDGE_AI] Processando via Ollama: {model}")
            try:
                # Chama o Ollama local
                res = subprocess.check_output([
                    "curl", "-s", "-X", "POST", "http://localhost:11434/api/generate",
                    "-d", json.dumps({"model": model, "prompt": prompt, "stream": False})
                ], shell=True)
                ollama_data = json.loads(res)
                return True, ollama_data.get("response", "Sem resposta.")
            except Exception as e:
                return False, f"Ollama Local Indisponível: {str(e)}"

        return False, "Protocolo desconhecido."
    except Exception as e:
        print(f"[ERROR] {str(e)}")
        return False, f"Falha operacional: {str(e)}"

@app.route('/', methods=['GET'])
def index():
    return f"JARVIS BRIDGE v8.1 ONLINE - MONITORANDO SISTEMA: {sys.platform.upper()}"

@app.route('/heartbeat', methods=['GET'])
def heartbeat():
    return jsonify({
        "status": "online", 
        "version": "8.1", 
        "voice": VOICE_SUPPORT, 
        "os": sys.platform,
        "monitor_active": True
    })

@app.route('/speak', methods=['POST'])
def handle_speak():
    data = request.json
    text = data.get("text", "")
    if text:
        print(f"\n[VIGILÂNCIA_VOZ] TRANSMITINDO ÁUDIO: {text}")
        speak_native(text)
        return jsonify({"success": True})
    return jsonify({"success": False, "error": "Texto vazio"})

@app.route('/execute', methods=['POST'])
def handle_execute():
    data = request.json
    action = data.get("action")
    params = data.get("params", [])
    
    print(f"\n[BRIDGE_CMD] REQUISIÇÃO RECEBIDA: {action}")
    try:
        success, message = execute_action(action, params)
        # Se for proxy do ollama, o 'message' contém o texto da IA
        if action == "ollama_proxy":
            return jsonify({"success": success, "response": message if success else None, "message": "AI Processada" if success else message})

        return jsonify({"success": success, "message": message})
    except Exception as e:
        return jsonify({"success": False, "message": f"Erro interno: {str(e)}"})

if __name__ == "__main__":
    app.run(port=5001)
