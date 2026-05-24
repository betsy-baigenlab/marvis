export class VoiceRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private onAudioAvailable: (base64: string) => void;
  public analyser: AnalyserNode | null = null;

  constructor(onAudioAvailable: (base64: string) => void) {
    this.onAudioAvailable = onAudioAvailable;
  }

  async init() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Setup audio context for visualizer
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(this.stream);
      this.analyser = audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      source.connect(this.analyser);
      
      this.mediaRecorder = new MediaRecorder(this.stream);
      
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };
      
      this.mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        this.audioChunks = [];
        
        // Convert Blob to Base64
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64data = reader.result as string;
          // Extract just the base64 part, removing data:audio/webm;base64,
          const base64String = base64data.split(',')[1];
          this.onAudioAvailable(base64String);
        };
      };
      
      return true;
    } catch (e) {
      console.error('Microphone access denied', e);
      return false;
    }
  }

  start() {
    if (this.mediaRecorder && this.mediaRecorder.state === 'inactive') {
      this.audioChunks = [];
      this.mediaRecorder.start();
    }
  }

  stop() {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.stop();
    }
  }
}
