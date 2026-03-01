from flask import Flask, request, jsonify
from flask_cors import CORS
import random
import time

app = Flask(__name__)
CORS(app)

grid = [0 for _ in range(25)]
q_table = [[0.0 for _ in range(4)] for _ in range(25)]
robot_grid = [0 for _ in range(25)]
server_logs = ["[00:00:00] System initialized.", "Started"]

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
    
    path = []
    visited = set()
    
    def dfs(current):
        visited.add(current)
        path.append(current)
        robot_grid[current] = client_grid[current]
        
        # Don't explore from obstacles or goals
        if client_grid[current] in [-100, 100]:
            return
            
        for action in range(4):
            next_state = get_next_state(current, action)
            if next_state != current and next_state not in visited:
                # Move to the next state
                dfs(next_state)
                # Backtrack to current
                path.append(current)

    log_message("Robot started full continuous exploration map building...")
    dfs(start_state)

    log_message(f"Exploration completed. Mapped {len(visited)} states in {len(path)} steps.")
    return jsonify({"status": "success", "path": path, "robot": robot_grid})

@app.route("/train", methods=['POST'])
def train():
    data = request.get_json()
    client_grid = data.get('grid', [])
    if not client_grid or len(client_grid) != 25:
        log_message("Error: Invalid grid received.")
        return jsonify({"status": "error"})

    try:
        start_state = client_grid.index(1)
    except ValueError:
        log_message("Error: No start state for training.")
        return jsonify({"status": "error"})

    lr = 0.1
    gamma = 0.9
    epsilon = 0.1
    episodes = 1000

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