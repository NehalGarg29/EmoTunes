from camera import show_text, emotion_dict, music_rec, EmotionPredictor
from mood_agent import MoodAgent

app = Flask(__name__)
app.secret_key = 'emotunes-secret-key'

# Persistent singletons
predictor = EmotionPredictor()
mood_agent = MoodAgent()


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/api/predict', methods=['POST'])
def predict():
    data = request.get_json() or {}
    image_data = data.get('image')
    if not image_data:
        return jsonify({'error': 'No image data'}), 400
    
    index = predictor.predict_emotion(image_data)
    if index is not None:
        show_text[0] = index
        return jsonify({
            'index': index,
            'name': emotion_dict[index]
        })
    return jsonify({'error': 'Prediction failed'}), 500


@app.route('/t')
def gen_table():
    return music_rec().to_json(orient='records')


@app.route('/api/emotion')
def get_emotion():
    return jsonify({
        'index': show_text[0],
        'name': emotion_dict[show_text[0]]
    })


@app.route('/chat', methods=['POST'])
def chat():
    data = request.get_json() or {}
    user_message = data.get('message', '').strip()
    reset = data.get('reset', False)

    if reset:
        mood_agent.reset()
        response = mood_agent.chat()
    elif user_message:
        response = mood_agent.chat(user_message)
    else:
        response = mood_agent.chat()

    # If agent detected an emotion, drive the music recommendations
    if response.get('emotion_index') is not None:
        show_text[0] = response['emotion_index']

    return jsonify(response)


# Export for Vercel
# if __name__ == '__main__':
#     app.run(port=5001)
