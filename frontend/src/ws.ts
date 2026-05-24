export class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private onTranscript: (text: string) => void;
  private onJarvisText: (text: string) => void;
  private onJarvisDone?: (fullText?: string) => void;
  private onJarvisStatus?: (status: string) => void;

  constructor(
    url: string, 
    onTranscript: (text: string) => void,
    onJarvisText: (text: string) => void,
    onJarvisDone?: (fullText?: string) => void,
    onJarvisStatus?: (status: string) => void
  ) {
    this.url = url;
    this.onTranscript = onTranscript;
    this.onJarvisText = onJarvisText;
    this.onJarvisDone = onJarvisDone;
    this.onJarvisStatus = onJarvisStatus;
  }

  connect() {
    this.ws = new WebSocket(this.url);
    
    this.ws.onopen = () => {
      console.log('Connected to JARVIS server');
    };
    
    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'transcript') {
          this.onTranscript(data.content);
        } else if (data.type === 'status') {
          if (this.onJarvisStatus) this.onJarvisStatus(data.content);
        } else if (data.type === 'text') {
          this.onJarvisText(data.content);
        } else if (data.type === 'done') {
          console.log("Jarvis finished generating.");
          if (this.onJarvisDone) {
              this.onJarvisDone(data.full_text);
          }
        }
      } catch (e) {
        console.error('Failed to parse WebSocket message', e);
      }
    };
    
    this.ws.onclose = () => {
      console.log('Disconnected. Reconnecting in 3s...');
      setTimeout(() => this.connect(), 3000);
    };
  }

  sendAudio(base64Data: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'audio', data: base64Data }));
    }
  }

  sendText(text: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'text', content: text }));
    }
  }
}
