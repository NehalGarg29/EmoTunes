/* ── EmoTunes App JS ───────────────────────────────────── */

const EMOTIONS = {
  0: { name: 'Angry',     emoji: '😠', color: '#ef4444' },
  1: { name: 'Disgusted', emoji: '🤢', color: '#10b981' },
  2: { name: 'Fearful',   emoji: '😨', color: '#8b5cf6' },
  3: { name: 'Happy',     emoji: '😄', color: '#f59e0b' },
  4: { name: 'Neutral',   emoji: '😐', color: '#6b7280' },
  5: { name: 'Sad',       emoji: '😢', color: '#3b82f6' },
  6: { name: 'Surprised', emoji: '😮', color: '#ec4899' },
};

const AVATAR_GRADIENTS = [
  ['#8b5cf6','#6d28d9'], ['#06b6d4','#0284c7'], ['#ec4899','#be185d'],
  ['#f59e0b','#d97706'], ['#10b981','#059669'], ['#ef4444','#dc2626'],
  ['#8b5cf6','#06b6d4'], ['#ec4899','#8b5cf6'],
];

let currentEmotionIndex = 4; // Neutral
let emotionHistory = [];
let songPollInterval = null;
let predictionInterval = null;
let chatDone = false;
let stream = null;

/* ── Utility ───────────────────────────────────────────── */
function now() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function hex2rgba(hex, alpha) {
  const r = parseInt(hex.slice(1,3), 16);
  const g = parseInt(hex.slice(3,5), 16);
  const b = parseInt(hex.slice(5,7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/* ── Emotion UI ────────────────────────────────────────── */
function applyEmotion(index, source) {
  const e = EMOTIONS[index];
  if (!e) return;

  currentEmotionIndex = index;

  // Header pill
  document.getElementById('header-emoji').textContent = e.emoji;
  document.getElementById('header-emotion-text').textContent = e.name;
  const pill = document.getElementById('emotion-pill');
  pill.style.borderColor = hex2rgba(e.color, 0.5);
  pill.style.boxShadow  = `0 0 12px ${hex2rgba(e.color, 0.25)}`;
  pill.classList.add('updating');
  setTimeout(() => pill.classList.remove('updating'), 600);

  // Main panel
  const emojiEl = document.getElementById('main-emotion-emoji');
  emojiEl.textContent = e.emoji;
  emojiEl.classList.remove('pop');
  void emojiEl.offsetWidth; // reflow
  emojiEl.classList.add('pop');

  document.getElementById('main-emotion-name').textContent = e.name;
  document.getElementById('main-emotion-name').style.color = e.color;
  document.getElementById('emotion-source').textContent = source || 'Camera AI';
  document.getElementById('emotion-color-strip').style.background = e.color;

  const display = document.getElementById('emotion-display');
  display.style.borderColor = hex2rgba(e.color, 0.35);

  // Playlist label
  const pill2 = document.getElementById('playlist-emotion-pill');
  pill2.textContent = `${e.emoji} ${e.name}`;
  pill2.style.background = hex2rgba(e.color, 0.15);
  pill2.style.borderColor = hex2rgba(e.color, 0.4);
  pill2.style.color = e.color;

  // History
  emotionHistory.push(index);
  if (emotionHistory.length > 12) emotionHistory.shift();
  renderHistory();
}

function renderHistory() {
  const container = document.getElementById('history-dots');
  container.innerHTML = emotionHistory.map(idx => {
    const e = EMOTIONS[idx];
    return `<div class="h-dot" style="background:${e.color}" title="${e.name} ${e.emoji}"></div>`;
  }).join('');
}

/* ── Song Cards ────────────────────────────────────────── */
function renderSongs(songs) {
  const container = document.getElementById('songs-container');
  if (!songs || !songs.length) {
    container.innerHTML = '<div class="empty-state"><p>No songs found</p></div>';
    return;
  }

  document.getElementById('track-count').textContent = `${songs.length} tracks`;

  container.innerHTML = songs.map((song, i) => {
    const [c1, c2] = AVATAR_GRADIENTS[i % AVATAR_GRADIENTS.length];
    const initial = (song.Artist || '?')[0].toUpperCase();
    const q = encodeURIComponent(`${song.Name || ''} ${song.Artist || ''}`);
    const spotifyUrl = `https://open.spotify.com/search/${q}`;
    return `
      <div class="song-card" style="transition-delay:${i*40}ms">
        <span class="song-num">${String(i+1).padStart(2,'0')}</span>
        <div class="song-avatar" style="background:linear-gradient(135deg,${c1},${c2})">${initial}</div>
        <div class="song-info">
          <div class="song-name">${song.Name || 'Unknown'}</div>
          <div class="song-meta">${song.Artist || '—'} · ${song.Album || '—'}</div>
        </div>
        <a href="${spotifyUrl}" target="_blank" rel="noopener" class="play-btn" title="Open in Spotify">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
          </svg>
        </a>
      </div>`;
  }).join('');

  // Stagger animate in
  requestAnimationFrame(() => {
    container.querySelectorAll('.song-card').forEach(c => c.classList.add('visible'));
  });
}

/* ── Chat ──────────────────────────────────────────────── */
function addMessage(role, text, type) {
  const box = document.getElementById('chat-messages');
  const div = document.createElement('div');
  div.className = `msg-bubble ${role}`;
  const cls = type === 'conclusion' ? 'bubble-inner conclusion' : 'bubble-inner';
  div.innerHTML = `
    <div class="${cls}">${text}</div>
    <div class="msg-time">${now()}</div>`;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

function showTyping() {
  const box = document.getElementById('chat-messages');
  const el = document.createElement('div');
  el.className = 'msg-bubble agent'; el.id = 'typing-indicator';
  el.innerHTML = `<div class="bubble-inner typing-indicator">
    <div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>
  </div>`;
  box.appendChild(el); box.scrollTop = box.scrollHeight;
}
function hideTyping() {
  const el = document.getElementById('typing-indicator');
  if (el) el.remove();
}

async function sendToAgent(message, isReset) {
  const sendBtn = document.getElementById('chat-send');
  sendBtn.disabled = true;
  showTyping();

  try {
    const body = isReset ? { reset: true } : { message };
    const res = await fetch('/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    hideTyping();
    addMessage('agent', data.message, data.type);

    if (data.emotion_index !== undefined && data.emotion_index !== null) {
      applyEmotion(data.emotion_index, 'AI Agent');
      // Show emotion banner
      const box = document.getElementById('chat-messages');
      const e = EMOTIONS[data.emotion_index];
      const banner = document.createElement('div');
      banner.className = 'emotion-banner';
      banner.innerHTML = `<span>${e.emoji}</span><span>Music tuned to <strong>${e.name}</strong> via AI</span>`;
      box.appendChild(banner); box.scrollTop = box.scrollHeight;
      chatDone = true;
    }
  } catch(err) {
    hideTyping();
    addMessage('agent', '⚠️ Connection error. Please try again.', 'error');
  }

  sendBtn.disabled = false;
}

function handleSend() {
  const input = document.getElementById('chat-input');
  const msg = input.value.trim();
  if (!msg) return;
  input.value = '';
  addMessage('user', msg, 'user');
  sendToAgent(msg, false);
}

function sendQuickReply(text) {
  const input = document.getElementById('chat-input');
  input.value = text;
  handleSend();
}

/* ── Client Side Camera ────────────────────────────────── */
async function startClientCamera() {
  const video = document.getElementById('webcam-video');
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
    video.srcObject = stream;
  } catch (err) {
    console.error("Camera access denied or not available:", err);
    document.getElementById('emotion-source').textContent = "Camera Unavailable";
  }
}

async function captureAndPredict() {
  if (chatDone || !stream) return;

  const video = document.getElementById('webcam-video');
  const canvas = document.getElementById('frame-canvas');
  const context = canvas.getContext('2d');

  canvas.width = video.videoWidth || 640;
  canvas.height = video.videoHeight || 480;
  
  if (canvas.width === 0 || canvas.height === 0) return;

  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  const imageData = canvas.toDataURL('image/jpeg', 0.6);

  try {
    const res = await fetch('/api/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: imageData })
    });
    const data = await res.json();
    if (data.index !== undefined && data.index !== currentEmotionIndex) {
      applyEmotion(data.index, 'Browser AI');
    }
  } catch (e) {
    console.error("Prediction error:", e);
  }
}

/* ── Polling ───────────────────────────────────────────── */
function startPolling() {
  // Songs — every 2s
  songPollInterval = setInterval(async () => {
    try {
      const res = await fetch('/t');
      const data = await res.json();
      renderSongs(data);
    } catch(e) {}
  }, 2000);

  // Prediction — every 3s to save on Vercel function calls
  predictionInterval = setInterval(captureAndPredict, 3000);
}

/* ── Init ──────────────────────────────────────────────── */
async function init() {
  // Start the browser camera
  await startClientCamera();

  // Kick off greeting
  await sendToAgent(null, true);

  // Load initial songs
  try {
    const res = await fetch('/t');
    renderSongs(await res.json());
  } catch(e) {}

  startPolling();

  // Enter key sends
  document.getElementById('chat-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') handleSend();
  });

  document.getElementById('chat-send').addEventListener('click', handleSend);

  // Reset chat button
  document.getElementById('reset-chat-btn').addEventListener('click', async () => {
    document.getElementById('chat-messages').innerHTML = '';
    chatDone = false;
    await sendToAgent(null, true);
  });
}

document.addEventListener('DOMContentLoaded', init);
