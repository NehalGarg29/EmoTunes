class MoodAgent:

    EMOTION_KEYWORDS = {
        'happy': ['happy', 'great', 'amazing', 'wonderful', 'joy', 'excited', 'fantastic',
                  'good', 'love', 'thrilled', 'cheerful', 'delighted', 'awesome', 'brilliant',
                  'elated', 'content', 'pleased', 'glad', 'ecstatic', 'positive', 'laughing',
                  'fun', 'energetic', 'blessed', 'pumped', 'stoked'],
        'sad': ['sad', 'down', 'depressed', 'awful', 'terrible', 'miserable', 'upset',
                'hurt', 'lonely', 'blue', 'unhappy', 'gloomy', 'heartbroken', 'devastated',
                'cry', 'crying', 'tears', 'grief', 'miss', 'alone', 'hopeless', 'empty', 'lost',
                'broken', 'low'],
        'angry': ['angry', 'mad', 'furious', 'annoyed', 'frustrated', 'irritated', 'pissed',
                  'rage', 'hatred', 'hate', 'infuriated', 'outraged', 'resentful', 'bitter',
                  'fed up', 'done', 'tired of', 'boiling', 'fuming'],
        'fearful': ['scared', 'afraid', 'anxious', 'nervous', 'worried', 'fear', 'terrified',
                    'panic', 'panicking', 'stress', 'stressed', 'uneasy', 'tense', 'dread',
                    'overwhelmed', 'uncertain', 'confused', 'paranoid'],
        'surprised': ['surprised', 'shocked', 'amazed', 'wow', 'unexpected', 'unbelievable',
                      'astonished', 'stunned', 'speechless', 'incredible', 'unreal', 'crazy', 'omg'],
        'disgusted': ['disgusted', 'gross', 'eww', 'horrible', 'nasty', 'revolting',
                      'sick', 'repulsed', 'disgusting', 'yuck'],
        'neutral': ['ok', 'fine', 'alright', 'okay', 'normal', 'meh', 'whatever',
                    'average', 'usual', 'not bad', 'so so', 'standard', 'chill', 'just existing']
    }

    EMOTION_TO_INDEX = {
        'angry': 0, 'disgusted': 1, 'fearful': 2, 'happy': 3,
        'neutral': 4, 'sad': 5, 'surprised': 6
    }

    QUESTIONS = [
        "Hey! 👋 I'm your EmoTunes AI. How are you feeling right now?",
        "Tell me more — what's been on your mind today?",
        "Got it... would you say your mood is more upbeat, mellow, or something else entirely?",
    ]

    CONCLUSIONS = {
        'happy':     "🌟 Love that energy! Cueing up some feel-good bangers to keep you riding high!",
        'sad':       "💙 I hear you. I've found tracks that feel exactly like what you're going through.",
        'angry':     "🔥 Channel that energy! Pulling up the most intense tracks for you.",
        'fearful':   "🌙 It's okay. Let the music wrap around you — I've got something calming.",
        'surprised': "⚡ Life keeps us on our toes! Here are some electrifying tracks to match.",
        'disgusted': "🎵 Let me completely flip the vibe with some feel-good music!",
        'neutral':   "😌 Smooth vibes incoming — perfect soundtrack for just... existing.",
    }

    def __init__(self):
        self.reset()

    def reset(self):
        self.turn = 0
        self.state = 'greeting'
        self.detected_emotion = None
        self.history = []

    def _detect(self, text):
        text_lower = text.lower()
        scores = {e: sum(1 for kw in kws if kw in text_lower)
                  for e, kws in self.EMOTION_KEYWORDS.items()}
        best = max(scores, key=scores.get)
        return best if scores[best] > 0 else None

    def chat(self, user_message=None):
        """Process a message and return a response dict."""

        # Initial greeting
        if self.state == 'greeting':
            self.state = 'listening'
            msg = self.QUESTIONS[0]
            self.history.append({'role': 'agent', 'text': msg})
            return {'message': msg, 'emotion': None, 'type': 'question', 'done': False}

        if not user_message:
            return {'message': self.QUESTIONS[0], 'emotion': None, 'type': 'question', 'done': False}

        self.history.append({'role': 'user', 'text': user_message})
        emotion = self._detect(user_message)

        if emotion:
            self.detected_emotion = emotion
            self.state = 'done'
            msg = self.CONCLUSIONS[emotion]
            self.history.append({'role': 'agent', 'text': msg})
            return {
                'message': msg,
                'emotion': emotion,
                'emotion_index': self.EMOTION_TO_INDEX[emotion],
                'type': 'conclusion',
                'done': True
            }

        # Follow-up question
        self.turn += 1
        if self.turn < len(self.QUESTIONS):
            msg = self.QUESTIONS[self.turn]
            self.history.append({'role': 'agent', 'text': msg})
            return {'message': msg, 'emotion': None, 'type': 'question', 'done': False}

        # Fallback to neutral
        self.detected_emotion = 'neutral'
        self.state = 'done'
        msg = "No worries! I'll pick some great tracks for you anyway 😊"
        self.history.append({'role': 'agent', 'text': msg})
        return {
            'message': msg,
            'emotion': 'neutral',
            'emotion_index': self.EMOTION_TO_INDEX['neutral'],
            'type': 'conclusion',
            'done': True
        }
