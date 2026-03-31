from flask import Flask, request, jsonify
from flask_cors import CORS
import random
import time
import serial
import threading

app = Flask(__name__)
CORS(app)

grid = [0 for _ in range(25)]
q_table = [[0.0 for _ in range(4)] for _ in range(25)]
robot_grid = [0 for _ in range(25)]
server_logs = ["[00:00:00] System initialized.", "Started"]

# Bluetooth state
bt = None
bt_status = "offline"
robot_pos = 0 # Current position of the robot
is_exploring = False

# Hardcoded config from user request
PORT = "COM12"
BAUD = 9600

SIMULATE_BT = True

class SimulatedBluetooth:
    def __init__(self):
        self.is_open = True
        
    @property
    def in_waiting(self):
        return 1
        
    def write(self, data):
        pass
        
    def readline(self):
        time.sleep(0.5) # Simulate hardware instruction handling time
        return b"done\n"
        
    def close(self):
        self.is_open = False

def log_message(msg):
    global server_logs
    t = time.strftime("[%H:%M:%S]")
    server_logs.insert(0, f"{t} {msg}")
    if len(server_logs) > 50:
        server_logs.pop()

def get_next_state(state, action):
    row = state // 5
    col = state % 5
    if action == 0 and row > 0: row -= 1
    elif action == 1 and col < 4: col += 1
    elif action == 2 and row < 4: row += 1
    elif action == 3 and col > 0: col -= 1
    return row * 5 + col

def send_command(cmd: str, label: str):
    global bt
    if not bt or not bt.is_open:
        log_message(f"Skipped {label} (No BT)")
        return
        
    try:
        bt.write(cmd.encode())
        log_message(f"Sent: {cmd} ({label})")
        
        # Wait for "done" response (max 3 sec)
        start = time.time()
        while time.time() - start < 3:
            if bt.in_waiting:
                response = bt.readline().decode(errors='ignore').strip()
                if response:
                    log_message(f"Bot: {response}")
                if response.lower() == "done":
                    break
        else:
            log_message("Warning: No 'done' received within 3 seconds")
    except Exception as e:
        log_message(f"BT Error: {e}")

@app.route('/connect', methods=['POST'])
def connect_robot():
    global bt, bt_status
    if SIMULATE_BT:
        log_message("Connecting to Simulated BLUETOOTH bot...")
        if bt and getattr(bt, 'is_open', False):
            bt.close()
        bt = SimulatedBluetooth()
        time.sleep(1)
        bt_status = "online"
        log_message("Connected to Simulated Robot!")
        return jsonify({"status": "success", "bt_status": bt_status})

    log_message(f"Connecting to {PORT} at {BAUD} baud...")
    try:
        if bt and bt.is_open:
            bt.close()
            
        bt = serial.Serial(PORT, BAUD, timeout=1)
        time.sleep(2)  # Wait for Bluetooth handshake
        bt_status = "online"
        log_message("Connected to Robot!")
        return jsonify({"status": "success", "bt_status": bt_status})
    except serial.SerialException as e:
        bt_status = "offline"
        log_message(f"Connection failed: {e}")
        return jsonify({"status": "error", "message": str(e), "bt_status": bt_status})

@app.route('/status', methods=['GET'])
def status():
    return {'status': 'OK'}

@app.route("/getgrid", methods=['GET'])
def getgrid():
    return {'grid': grid}

@app.route("/metrics", methods=['GET'])
def metrics():
    heatmap_q = [max(state_q) for state_q in q_table]
    return jsonify({
        "q_table": heatmap_q,
        "full_q_table": q_table,
        "logs": server_logs
    })

@app.route("/robot_state", methods=['GET'])
def get_robot_state():
    visual_grid = list(robot_grid)
    if is_exploring and visual_grid[robot_pos] != -100:
        visual_grid[robot_pos] = 2
        
    return jsonify({
        "robot": visual_grid,
        "bt_status": bt_status,
        "is_exploring": is_exploring
    })

@app.route("/explore", methods=['POST'])
def explore():
    global robot_grid
    data = request.get_json()
    client_grid = data.get('grid', [])
    if not client_grid or len(client_grid) != 25:
        log_message("Error: Invalid grid received.")
        return jsonify({"status": "error", "message": "Invalid grid"})

    try:
        start_state = client_grid.index(1)
    except ValueError:
        log_message("Error: No start state (1) found.")
        return jsonify({"status": "error", "message": "No start state"})

    robot_grid = [0] * 25
    robot_grid[start_state] = 1
    
    global robot_pos, is_exploring
    robot_pos = start_state
    is_exploring = True
    
    def execute_exploration():
        global robot_pos, is_exploring, robot_grid
        path = []
        visited = set()
        
        # 0: North, 1: East, 2: South, 3: West
        current_orientation = 0 
        
        def turn_to(target_dir):
            nonlocal current_orientation
            if target_dir == current_orientation:
                return
                
            diff = (target_dir - current_orientation) % 4
            if diff == 1:
                send_command('R', 'Turn Right')
            elif diff == 2:
                send_command('R', 'Turn Right')
                time.sleep(0.5)
                send_command('R', 'Turn Right')
            elif diff == 3:
                send_command('L', 'Turn Left')
                
            current_orientation = target_dir
            time.sleep(0.5)

        def dfs(current):
            global robot_pos
            robot_pos = current
            visited.add(current)
            path.append(current)
            robot_grid[current] = client_grid[current]
            
            # Don't explore from obstacles or goals
            if client_grid[current] in [-100, 100]:
                return
                
            for action in range(4):
                next_state = get_next_state(current, action)
                if next_state != current and next_state not in visited:
                    # Peek at next state first
                    if client_grid[next_state] == -100:
                        # It's an obstacle, mark it but don't move there physically
                        visited.add(next_state)
                        robot_grid[next_state] = -100
                        log_message(f"Detected obstacle at {next_state}")
                        continue
                        
                    # Move physically
                    turn_to(action)
                    send_command('F', 'Forward')
                    
                    # Ensure simulation wait time matches physical wait
                    time.sleep(1) # Base delay

                    # Move to the next state
                    dfs(next_state)
                    
                    # Backtrack to current physically
                    # To backtrack, turn 180 and move forward, or move backward if supported
                    # Based on commands, we have 'B' for backward
                    turn_to(action) # Ensure we are facing the way we went
                    send_command('B', 'Backward')
                    time.sleep(1)
                    
                    path.append(current)
                    robot_pos = current

        log_message("Robot started hardware continuous exploration...")
        
        # Initial stand up if connected
        if bt and bt.is_open:
            send_command('U', 'Stand Up')
            time.sleep(1)
            
        dfs(start_state)
        
        # Sit down when done
        if bt and bt.is_open:
            send_command('T', 'Sit')
            
        log_message(f"Exploration completed. Mapped {len(visited)} states in {len(path)} steps.")
        is_exploring = False

    # Start the hardware background execution thread
    thread = threading.Thread(target=execute_exploration)
    thread.daemon = True
    thread.start()

    return jsonify({"status": "started"})

@app.route("/train", methods=['POST'])
def train():
    data = request.get_json()
    client_grid = data.get('grid', [])
    if not client_grid or len(client_grid) != 25:
        log_message("Error: Invalid grid received.")
        return jsonify({"status": "error"})

    try:
        start_state = client_grid.index(1)
    except Exception:
        log_message("Error: No start state for training.")
        return jsonify({"status": "error"})

    lr = 0.1
    gamma = 0.9
    epsilon = 0.1
    episodes = 10000

    log_message(f"Started Q-Learning for {episodes} episodes.")

    for ep in range(episodes):
        state = start_state
        done = False
        steps = 0
        
        while not done and steps < 30:
            if random.random() < epsilon:
                action = random.randint(0, 3)
            else:
                action = q_table[state].index(max(q_table[state]))

            next_state = get_next_state(state, action)
            
            if client_grid[next_state] == 100:
                reward = 100
                done = True
            elif client_grid[next_state] == -100:
                reward = -100
                done = True
            elif state == next_state:
                reward = -5
            else:
                reward = -1

            best_next_q = max(q_table[next_state])
            q_table[state][action] += lr * (reward + gamma * best_next_q - q_table[state][action])

            state = next_state
            steps += 1

    log_message("Finished Q-Learning training.")
    return jsonify({"status": "success"})

if __name__ == '__main__':
    app.run(debug=True, port=5000)