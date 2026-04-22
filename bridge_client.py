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
pyautogui.PAUSE = 0.5

app = Flask(__name__)
CORS(app)  # Permite requisições do frontend web

print("=== JARVIS AUTOMATION BRIDGE v7.0 ===")
print("Status: Inicializando módulos nativos do Windows...")

def execute_action(action, params):
    try:
        if action == "open_app":
            app_name = params.get("query", "")
            print(f"Executando: Abrindo {app_name}")
            # Tenta abrir via comando de sistema ou atalho
            os.system(f"start {app_name}")
            return True, f"Abrindo {app_name}, senhor."

        elif action == "search_web":
            query = params.get("query", "")
            url = f"https://www.google.com/search?q={query}"
            webbrowser.open(url)
            return True, f"Pesquisando '{query}' no navegador."

        elif action == "type_text":
            text = params.get("query", "")
            pyautogui.write(text, interval=0.01)
            return True, "Texto inserido."

        elif action == "click":
            pyautogui.click()
            return True, "Clique executado."

        elif action == "screenshot":
            path = f"screenshot_{int(time.time())}.png"
            pyautogui.screenshot(path)
            return True, f"Captura de tela salva como {path}"

        elif action == "lock_pc":
            os.system("rundll32.exe user32.dll,LockWorkStation")
            return True, "Computador bloqueado."

        elif action == "set_volume":
            # Exemplo simplificado usando CMD (nircmd é recomendado para controle fino)
            # Aqui simulamos teclas de volume
            level = params.get("level", 5)
            for _ in range(level):
                pyautogui.press("volumeup")
            return True, "Volume ajustado."

        return False, "Ação não mapeada no protocolo."
    except Exception as e:
        return False, str(e)

@app.route('/execute', methods=['POST'])
def handle_execute():
    data = request.json
    action = data.get("action")
    params = data.get("params", {})
    
    success, message = execute_action(action, params)
    return jsonify({"success": success, "message": message})

if __name__ == "__main__":
    print("Link Neural: ATIVO")
    print("Aguardando comandos na porta 5001...")
    # Roda em porta diferente do Jarvis Core para evitar conflitos
    app.run(port=5001)
