from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/ask', methods=['POST'])
def ask_ai():
    user_message = request.json.get('message')
    # هنا يتم ربط GPT-4 أو أي نموذج ذكاء اصطناعي
    ai_response = "أهلاً بك، أنا نسختك الرقمية. كيف يمكنني مساعدك؟"
    return jsonify({"reply": ai_response})

if __name__ == '__main__':
    app.run(port=5000)
