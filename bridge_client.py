import os
import sys
import time
import json
import subprocess
import webbrowser
import pyautogui
import psutil
import pygetwindow as gw
from flask import Flask, request, jsonify
from flask_cors import CORS

# Configurações de Segurança do PyAutoGUI
pyautogui.FAILSAFE = True
pyautogui.PAUSE = 0.3

app = Flask(__name__)
CORS(app)

print("=== JARVIS AUTOMATION BRIDGE v7.5 ===")

def execute_action(action, params):
    try:
        if action == "open_app":
            app_query = params[0] if params else ""
            print(f"[BRIDGE] Opening: {app_query}")
            # Tenta via shell para maior compatibilidade no Windows
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

        elif action == "move_mouse":
            x, y = int(params[0]), int(params[1])
            pyautogui.moveTo(x, y, duration=0.2)
            return True, "Movimento concluído."

        elif action == "click":
            button = params[0] if params else "left"
            pyautogui.click(button=button)
            return True, "Clique executado."

        elif action == "screenshot":
            pyautogui.screenshot(f"capture_{int(time.time())}.png")
            return True, "Registro visual capturado."

        return False, "Protocolo desconhecido."
    except Exception as e:
        print(f"[ERROR] {str(e)}")
        return False, f"Falha operacional: {str(e)}"

@app.route('/heartbeat', methods=['GET'])
def heartbeat():
    return jsonify({"status": "online", "version": "7.5", "os": sys.platform})

@app.route('/execute', methods=['POST'])
def handle_execute():
    data = request.json
    action = data.get("action")
    params = data.get("params", [])
    
    print(f"[BRIDGE] Action: {action} Params: {params}")
    success, message = execute_action(action, params)
    return jsonify({"success": success, "message": message})

if __name__ == "__main__":
    app.run(port=5001)
