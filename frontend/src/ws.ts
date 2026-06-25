export class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private onTranscript: (text: string) => void;
  private onMarvisText: (text: string) => void;
  private onMarvisDone?: (fullText?: string) => void;
  private onMarvisStatus?: (status: string) => void;

  constructor(
    url: string, 
    onTranscript: (text: string) => void,
    onMarvisText: (text: string) => void,
    onMarvisDone?: (fullText?: string) => void,
    onMarvisStatus?: (status: string) => void
  ) {
    this.url = url;
    this.onTranscript = onTranscript;
    this.onMarvisText = onMarvisText;
    this.onMarvisDone = onMarvisDone;
    this.onMarvisStatus = onMarvisStatus;
  }

  connect() {
    this.ws = new WebSocket(this.url);
    
    this.ws.onopen = () => {
      console.log('Connected to MARVIS server');
    };
    
    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'transcript') {
          this.onTranscript(data.content);
        } else if (data.type === 'status') {
          if (this.onMarvisStatus) this.onMarvisStatus(data.content);
        } else if (data.type === 'text') {
          this.onMarvisText(data.content);
        } else if (data.type === 'done') {
          console.log("Marvis finished generating.");
          if (this.onMarvisDone) {
              this.onMarvisDone(data.full_text);
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
