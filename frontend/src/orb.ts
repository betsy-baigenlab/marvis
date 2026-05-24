import * as THREE from 'three';

export class OrbVisualizer {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private particles: THREE.Points;
  private geometry: THREE.BufferGeometry;
  private analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array | null = null;

  constructor(container: HTMLElement) {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(this.renderer.domElement);

    // Create particle orb
    const particleCount = 2000;
    this.geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    
    const color = new THREE.Color();
    for (let i = 0; i < particleCount; i++) {
      // Sphere distribution
      const r = 5 + Math.random() * 2;
      const theta = 2 * Math.PI * Math.random();
      const phi = Math.acos(2 * Math.random() - 1);
      
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);
      
      positions[i*3] = x;
      positions[i*3+1] = y;
      positions[i*3+2] = z;
      
      // Blueish color
      color.setHSL(0.6 + Math.random() * 0.1, 1.0, 0.5 + Math.random() * 0.2);
      colors[i*3] = color.r;
      colors[i*3+1] = color.g;
      colors[i*3+2] = color.b;
    }
    
    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const material = new THREE.PointsMaterial({
      size: 0.1,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0.8
    });
    
    this.particles = new THREE.Points(this.geometry, material);
    this.scene.add(this.particles);
    
    this.camera.position.z = 15;

    window.addEventListener('resize', this.onWindowResize.bind(this));
    
    this.animate();
  }

  setAnalyser(analyser: AnalyserNode) {
    this.analyser = analyser;
    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
  }

  private onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  private animate() {
    requestAnimationFrame(this.animate.bind(this));
    
    this.particles.rotation.y += 0.002;
    this.particles.rotation.x += 0.001;
    
    if (this.analyser && this.dataArray) {
      this.analyser.getByteFrequencyData(this.dataArray as any);
      let sum = 0;
      for (let i = 0; i < this.dataArray.length; i++) {
        sum += this.dataArray[i];
      }
      const average = sum / this.dataArray.length;
      
      // Scale based on audio amplitude
      const scale = 1 + (average / 128) * 0.5;
      this.particles.scale.set(scale, scale, scale);
      
      // Modulate colors slightly
      const material = this.particles.material as THREE.PointsMaterial;
      material.opacity = 0.5 + (average / 256);
    }
    
    this.renderer.render(this.scene, this.camera);
  }
}
