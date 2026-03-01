from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)
grid = [0 for _ in range(25)]
q_table = [0.0 for _ in range(25)]
server_logs = ["[00:00:00] System initialized.","Started"]
@app.route('/status', methods=['GET'])
def status():
    return {'status': 'OK'}

@app.route("/getgrid", methods=['GET'])
def getgrid():
    return {'grid': grid}

@app.route("/metrics", methods=['GET'])
def metrics():
    return jsonify({
        "q_table": q_table,
        "logs": server_logs
    })

@app.route("/explore", methods=['POST'])
def explore():
    data = request.get_json()
    print(data)

    return jsonify({"status":"recived Data"})

if __name__ == '__main__':
    app.run(debug=True, port=5000)