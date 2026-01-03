from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from gtts import gTTS
import os

app = Flask(__name__)
CORS(app)

@app.route('/chat', methods=['POST'])
def chat():
    msg = request.json.get('message', '')
    reply = f"بصفتي نسختك الرقمية، لقد سمعت أنك تقول: {msg}. أنا أتحرك وأتفاعل معك الآن."
    tts = gTTS(text=reply, lang='ar')
    tts.save("reply.mp3")
    return jsonify({"audioUrl": "http://localhost:5000/get_audio"})

@app.route('/get_audio')
def get_audio():
    return send_file("reply.mp3", mimetype="audio/mp3")

if __name__ == '__main__':
    app.run(port=5000)
