from flask import Flask, request, jsonify
from flask_cors import CORS
import random
import time
import serial
import threading
import torch
import torch.nn as nn
import torch.optim as optim
import torch.nn.functional as F
from collections import deque

app = Flask(__name__)
CORS(app)

grid = [0 for _ in range(25)]
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

# --- DQN Setup ---
class DQN(nn.Module):
    def __init__(self, input_size=50, hidden_size=64, num_actions=4):
        super(DQN, self).__init__()
        self.fc1 = nn.Linear(input_size, hidden_size)
        self.fc2 = nn.Linear(hidden_size, hidden_size)
        self.fc3 = nn.Linear(hidden_size, num_actions)
        
    def forward(self, x):
        x = F.relu(self.fc1(x))
        x = F.relu(self.fc2(x))
        return self.fc3(x)

class ReplayBuffer:
    def __init__(self, capacity=2000):
        self.buffer = deque(maxlen=capacity)
    def push(self, state, action, reward, next_state, done):
        self.buffer.append((state, action, reward, next_state, done))
    def sample(self, batch_size):
        return random.sample(self.buffer, batch_size)
    def __len__(self):
        return len(self.buffer)

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
policy_net = DQN(50, 64, 4).to(device)
target_net = DQN(50, 64, 4).to(device)
target_net.load_state_dict(policy_net.state_dict())
target_net.eval()

optimizer = optim.Adam(policy_net.parameters(), lr=0.005)
memory = ReplayBuffer(2000)

training_metrics = {
    "loss_history": [],
    "recent_memory": [],
    "memory_size": 0,
    "architecture": "Input(50) -> FC(64) -> FC(64) -> Output(4)"
}
latest_grid = [0] * 25

def get_state_tensor(client_grid, start_state):
    map_features = torch.zeros(25)
    for i, val in enumerate(client_grid):
        if val == 100: map_features[i] = 1.0
        elif val == -100: map_features[i] = -1.0
    pos_features = torch.zeros(25)
    pos_features[start_state] = 1.0
    
    # Add batch dimension as [1, 50]
    return torch.cat((map_features, pos_features)).unsqueeze(0).to(device)

def update_training_metrics():
    global training_metrics
    training_metrics['memory_size'] = len(memory)
    recent = list(memory.buffer)[-50:] if len(memory) > 0 else []
    def format_t(t):
        s, a, r, _, d = t
        pos_idx = s[0][25:].argmax().item() # s is shape [1, 50]
        row = pos_idx // 5
        col = pos_idx % 5
        return {
            "action": ["N","E","S","W"][a], 
            "reward": float(r), 
            "done": bool(d),
            "coord": f"[{row},{col}]"
        }
    training_metrics['recent_memory'] = [format_t(t) for t in recent]


def optimize_model(batch_size=32, gamma=0.9):
    if len(memory) < batch_size: return 0.0
    transitions = memory.sample(batch_size)
    
    # Unpack and stack states and next_states handling the [1, 50] shape from unsqueeze(0)
    batch_state = torch.cat([t[0] for t in transitions])
    batch_action = torch.tensor([t[1] for t in transitions]).unsqueeze(1).to(device)
    batch_reward = torch.tensor([t[2] for t in transitions], dtype=torch.float32).to(device)
    batch_next_state = torch.cat([t[3] for t in transitions])
    batch_done = torch.tensor([t[4] for t in transitions], dtype=torch.float32).to(device)
    
    state_action_values = policy_net(batch_state).gather(1, batch_action).squeeze(-1)
    
    with torch.no_grad():
        next_state_values = target_net(batch_next_state).max(1)[0]
    expected_state_action_values = batch_reward + (gamma * next_state_values * (1 - batch_done))
    
    loss = F.mse_loss(state_action_values, expected_state_action_values)
    
    optimizer.zero_grad()
    loss.backward()
    optimizer.step()
    
    return loss.item()

class SimulatedBluetooth:
    def __init__(self):
        self.is_open = True
        
    @property
    def in_waiting(self):
        return 1
        
    def write(self, data):
        pass
        
    def readline(self):
        time.sleep(0.5)
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
        time.sleep(2)
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
    current_q_table = [[0.0]*4 for _ in range(25)]
    # Evaluate DQN for every state on the latest grid
    with torch.no_grad():
        for i in range(25):
            st_tensor = get_state_tensor(latest_grid, i)
            q_vals = policy_net(st_tensor).squeeze().tolist()
            current_q_table[i] = q_vals

    heatmap_q = [max(state_q) for state_q in current_q_table]
    return jsonify({
        "q_table": heatmap_q,
        "full_q_table": current_q_table,
        "logs": server_logs,
        "metrics": training_metrics
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
    global robot_grid, latest_grid
    data = request.get_json()
    client_grid = data.get('grid', [])
    if not client_grid or len(client_grid) != 25:
        log_message("Error: Invalid grid received.")
        return jsonify({"status": "error"})

    latest_grid = client_grid

    try:
        start_state = client_grid.index(1)
    except ValueError:
        log_message("Error: No start state.")
        return jsonify({"status": "error"})

    robot_grid = [0] * 25
    robot_grid[start_state] = 1
    
    global robot_pos, is_exploring
    robot_pos = start_state
    is_exploring = True
    
    def execute_exploration():
        global robot_pos, is_exploring, robot_grid
        current_orientation = 0 
        
        def turn_to(target_dir):
            nonlocal current_orientation
            if target_dir == current_orientation: return
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

        log_message("Physical RL Full Mapping starting...")
        
        # Make sure metrics array exists 
        if "loss_history" not in training_metrics:
            training_metrics['loss_history'] = []

        if bt and bt.is_open:
            send_command('U', 'Stand Up')
            time.sleep(1)
            
        current = start_state
        robot_pos = current
        robot_grid[current] = client_grid[current]
        
        steps = 0
        max_steps = 150
        epsilon = 0.8 # High exploration to ensure entire mapping
        mapped_states = set([start_state])
        
        while len(mapped_states) < 25 and steps < max_steps:
            st_ten = get_state_tensor(client_grid, current)
            
            if random.random() < epsilon:
                # Bias action to explicitly seek out unmapped regions so we don't waste time globally
                unmapped_actions = []
                for a in range(4):
                    n_s = get_next_state(current, a)
                    if n_s != current and n_s not in mapped_states:
                        unmapped_actions.append(a)
                if unmapped_actions:
                    action = random.choice(unmapped_actions)
                else:
                    action = random.randint(0, 3)
            else:
                with torch.no_grad():
                    action = policy_net(st_ten).argmax().item()
                    
            next_state = get_next_state(current, action)
            
            if next_state == current:
                # Boundary hit (stays in place)
                memory.push(st_ten, action, -5, st_ten, False)
                update_training_metrics()
                steps += 1
                continue
                
            nst_ten = get_state_tensor(client_grid, next_state)
            is_new = next_state not in mapped_states
            mapped_states.add(next_state)
            
            if client_grid[next_state] == -100:
                robot_grid[next_state] = -100
                if is_new:
                    log_message(f"Obstacle mapped at {next_state}")
                
                # Push Obstacle Memory and train
                memory.push(st_ten, action, -100, nst_ten, True)
                update_training_metrics()
                loss = optimize_model()
                if loss > 0:
                    training_metrics['loss_history'].append(loss)
                steps += 1
                continue # Don't move physically, try another direction
                
            # Physically move
            turn_to(action)
            send_command('F', 'Forward')
            time.sleep(1)
            
            reward = 100 if client_grid[next_state] == 100 else -1
            is_terminal = (client_grid[next_state] == 100)
            
            memory.push(st_ten, action, reward, nst_ten, is_terminal)
            update_training_metrics()
            loss = optimize_model()
            if loss > 0:
                training_metrics['loss_history'].append(loss)
                
            robot_pos = next_state
            robot_grid[next_state] = client_grid[next_state]
            current = next_state
            steps += 1
            
            if len(memory) % 10 == 0:
                target_net.load_state_dict(policy_net.state_dict())
        
        if bt and bt.is_open:
            send_command('T', 'Sit')
            
        log_message(f"Mapping completed or max steps reached ({steps}).")
        is_exploring = False

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
        log_message("Error: No start state.")
        return jsonify({"status": "error"})

    global latest_grid, policy_net, target_net, optimizer, memory, training_metrics
    latest_grid = client_grid
    
    lr = 0.005
    gamma = 0.9
    epsilon = 1.0 
    epsilon_min = 0.05
    epsilon_decay = 0.99
    episodes = 200
    batch_size = 32

    log_message(f"Started DQN for {episodes} episodes.")
    training_metrics['loss_history'] = []

    for ep in range(episodes):
        state_idx = start_state
        state_tensor = get_state_tensor(client_grid, state_idx)
        done = False
        steps = 0
        total_loss = 0
        loss_steps = 0
        
        while not done and steps < 30:
            if random.random() < epsilon:
                action = random.randint(0, 3)
            else:
                with torch.no_grad():
                    action = policy_net(state_tensor).argmax().item()

            next_state_idx = get_next_state(state_idx, action)
            next_state_tensor = get_state_tensor(client_grid, next_state_idx)
            
            if client_grid[next_state_idx] == 100:
                reward = 100
                done = True
            elif client_grid[next_state_idx] == -100:
                reward = -100
                done = True
            elif state_idx == next_state_idx:
                reward = -5
            else:
                reward = -1

            memory.push(state_tensor, action, reward, next_state_tensor, done)
            
            state_idx = next_state_idx
            state_tensor = next_state_tensor
            steps += 1
            
            if len(memory) >= batch_size:
                loss = optimize_model(batch_size, gamma)
                if loss > 0:
                    total_loss += loss
                    loss_steps += 1
                
        if epsilon > epsilon_min:
            epsilon *= epsilon_decay
        
        if ep % 10 == 0:
            target_net.load_state_dict(policy_net.state_dict())
            
        if loss_steps > 0:
            training_metrics['loss_history'].append(total_loss / loss_steps)

    update_training_metrics()

    log_message("Finished DQN Training.")
    return jsonify({"status": "success"})

if __name__ == '__main__':
    app.run(debug=True, port=5000)