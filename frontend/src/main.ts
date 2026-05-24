import { OrbVisualizer } from './orb';
import { VoiceRecorder } from './voice';
import { WebSocketClient } from './ws';

document.addEventListener('DOMContentLoaded', async () => {
  const canvasContainer = document.getElementById('canvas-container');
  const chatContainer = document.getElementById('chat-container');
  const micBtn = document.getElementById('mic-btn');
  const textInput = document.getElementById('text-input') as HTMLInputElement;
  const sendBtn = document.getElementById('send-btn');
  
  if (!canvasContainer || !chatContainer || !micBtn || !textInput || !sendBtn) return;
  
  // Initialize Visualizer
  const orb = new OrbVisualizer(canvasContainer);
  
  let currentJarvisBubble: HTMLElement | null = null;
  let currentStatusBubble: HTMLElement | null = null;

  const appendMessage = (text: string, type: 'user' | 'jarvis' | 'status') => {
    if (type === 'status' && currentStatusBubble) {
      currentStatusBubble.textContent = text;
      return currentStatusBubble;
    }
    if (type !== 'status' && currentStatusBubble) {
      currentStatusBubble.remove();
      currentStatusBubble = null;
    }
    
    const div = document.createElement('div');
    div.className = `message ${type}`;
    div.textContent = text;
    chatContainer.appendChild(div);
    chatContainer.scrollTop = chatContainer.scrollHeight;
    
    if (type === 'status') currentStatusBubble = div;
    return div;
  };
  
  // Initialize WebSocket
  const wsUrl = `ws://${window.location.hostname}:8000/ws`;
  const ws = new WebSocketClient(wsUrl, 
    (transcript) => {
      appendMessage(transcript, 'user');
      currentJarvisBubble = null;
    },
    (text) => {
      // Append text from Jarvis as it streams
      if (!currentJarvisBubble) {
        window.speechSynthesis.cancel(); // Stop any previous speech
        currentJarvisBubble = appendMessage('', 'jarvis');
      }
      currentJarvisBubble.textContent += text;
      chatContainer.scrollTop = chatContainer.scrollHeight;
    },
    (fullText) => {
      if (fullText) {
        const utterance = new SpeechSynthesisUtterance(fullText);
        
        // Try to find a British voice
        const voices = window.speechSynthesis.getVoices();
        const britishVoice = voices.find(v => v.lang === 'en-GB' || v.name.includes('British'));
        if (britishVoice) utterance.voice = britishVoice;
        
        utterance.rate = 1.0;
        window.speechSynthesis.speak(utterance);
      }
      currentJarvisBubble = null;
    },
    (status) => {
      appendMessage(status, 'status');
    }
  );
  ws.connect();
  
  // Initialize Voice Recorder
  const voice = new VoiceRecorder((base64Audio) => {
    ws.sendAudio(base64Audio);
  });
  
  let isRecording = false;
  
  micBtn.addEventListener('click', async () => {
    if (!voice.analyser) {
      const initialized = await voice.init();
      if (initialized && voice.analyser) {
        orb.setAnalyser(voice.analyser);
      } else {
        alert('Could not access microphone');
        return;
      }
    }
    
    if (!isRecording) {
      voice.start();
      isRecording = true;
      micBtn.textContent = 'Stop Listening';
      micBtn.classList.add('recording');
      appendMessage('Listening...', 'status');
    } else {
      voice.stop();
      isRecording = false;
      micBtn.textContent = '🎤 Listen';
      micBtn.classList.remove('recording');
      appendMessage('Processing...', 'status');
    }
  });

  const handleSend = () => {
    const text = textInput.value.trim();
    if (text) {
      ws.sendText(text);
      appendMessage(text, 'user');
      currentJarvisBubble = null;
      textInput.value = '';
    }
  };

  sendBtn.addEventListener('click', handleSend);
  textInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSend();
  });
});
