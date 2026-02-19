from flask import Flask
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/status', methods=['GET'])
def status():
    return {'status': 'OK'}

if __name__ == '__main__':
    app.run(debug=True, port=5000)