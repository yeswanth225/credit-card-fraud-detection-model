/* ================================================================
   signal-analysis-viz.js — Transaction Signal Flow (Three.js)
   ================================================================
   Visualizes the actual analysis pipeline:
     Transaction Input → Feature Signal Extraction
     → Classical (XGBoost) / Quantum (VQC) Model Evaluation
     → Risk Decision Output

   Each node is a geometric primitive (no decorative spheres/glass).
   Edges animate data-flow with thin particles.
   Color = model pathway (steel = classical, amber = quantum, crimson = high-risk).
 */

export class SignalAnalysisViz {
  constructor(container) {
    this._c = container;
    this._renderer = null;
    this._scene = null;
    this._camera = null;
    this._raf = null;
    this._disposed = false;

    // Pipeline nodes: Input → Feature → Classical → Quantum → Decision
    this._nodes = [
      { name: 'Transaction',  x: -10, y: 4,  z: 0,  type: 'input',    color: 0xcf9f4b, mesh: null, labelMesh: null },
      { name: 'Features',     x: -5,  y: 1,  z: 0,  type: 'feature',  color: 0x4a9ed4, mesh: null, labelMesh: null },
      { name: 'Classical',    x: 0,   y: 4,  z: 0,  type: 'model',    color: 0x8b5cf6, mesh: null, labelMesh: null },
      { name: 'Quantum',      x: 0,   y: -2, z: 0,  type: 'quantum',  color: 0xe8b456, mesh: null, labelMesh: null },
      { name: 'Decision',     x: 10,  y: 1,  z: 0,  type: 'decision', color: 0xd15c5c, mesh: null, labelMesh: null },
    ];

    this._edges = []; // { from, to, score, particles }

    this._init();
  }

  _init() {
    if (!window.THREE) {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
      s.onload = () => this._setup();
      document.head.appendChild(s);
    } else { this._setup(); }
  }

  _setup() {
    const W = this._c.clientWidth || 640;
    const H = this._c.clientHeight || 320;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    this._renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this._renderer.setSize(W, H);
    this._renderer.setPixelRatio(dpr);
    this._renderer.setClearColor(0x0c1016, 0);
    this._c.appendChild(this._renderer.domElement);

    this._scene = new THREE.Scene();

    this._camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 100);
    this._camera.position.set(0, 3, 22);

    // Lights — restrained, directional only
    const amb = new THREE.AmbientLight(0x111827, 0.6);
    this._scene.add(amb);
    const dir = new THREE.DirectionalLight(0xcf9f4b, 1.0);
    dir.position.set(5, 10, 5);
    this._scene.add(dir);

    // Nodes
    for (const n of this._nodes) {
      this._buildNode(n);
    }

    // Edges with particle flow
    this._buildEdges();

    // Subtle grid floor for context (very low opacity, no decorative texture)
    const grid = new THREE.GridHelper(28, 28, 0x202a3a, 0x151c2a);
    grid.position.y = -6;
    this._scene.add(grid);

    window.addEventListener('resize', () => this.resize());
    this._loop();
  }

  _buildNode(n) {
    // Geometric primitive: cube for input/feature/decision, octahedron for models
    // NO decorative spheres, NO glass, NO glassmorphism
    const geo = n.type === 'model' || n.type === 'quantum'
      ? new THREE.OctahedronGeometry(1.2, 0)
      : new THREE.BoxGeometry(1.6, 1.0, 1.0);
    const mat = new THREE.MeshPhongMaterial({
      color: n.color,
      emissive: n.color,
      emissiveIntensity: 0.15,
      shininess: 30,
      transparent: true,
      opacity: 0.85,
    });
    n.mesh = new THREE.Mesh(geo, mat);
    n.mesh.position.set(n.x, n.y, n.z);
    this._scene.add(n.mesh);

    // Small label plane (no decorative badges)
    const labelGeo = new THREE.PlaneGeometry(2.4, 0.6);
    const labelMat = new THREE.MeshBasicMaterial({
      color: 0x111827,
      transparent: true,
      opacity: 0.82,
    });
    n.labelMesh = new THREE.Mesh(labelGeo, labelMat);
    n.labelMesh.position.set(n.x, n.y - 1.5, n.z);
    this._scene.add(n.labelMesh);
  }

  _buildEdges() {
    // Pipeline: Input → Feature → Classical/Quantum → Decision
    // For simplicity, draw linear connections with thin particle streams
    const pairs = [
      { from: this._nodes[0], to: this._nodes[1], score: 0.5 },
      { from: this._nodes[1], to: this._nodes[2], score: 0.7 },
      { from: this._nodes[1], to: this._nodes[3], score: 0.4 },
      { from: this._nodes[2], to: this._nodes[4], score: 0.8 },
      { from: this._nodes[3], to: this._nodes[4], score: 0.6 },
    ];

    for (const p of pairs) {
      const starts = new THREE.Vector3(p.from.x, p.from.y, p.from.z);
      const ends = new THREE.Vector3(p.to.x, p.to.y, p.to.z);
      const len = starts.distanceTo(ends);
      const dir = new THREE.Vector3().subVectors(ends, starts).normalize();

      // Thin line
      const geo = new THREE.BufferGeometry().setFromPoints([starts, ends]);
      const col = p.score >= 0.75 ? 0xcf9f4b : p.score >= 0.55 ? 0x4a9ed4 : 0x8b5cf6;
      const mat = new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: 0.22 });
      const line = new THREE.Line(geo, mat);
      this._scene.add(line);

      // Particle strip — sparse dots, not decorative streams
      const count = Math.min(Math.round(len * 4), 30);
      const pts = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        pts[i*3] = starts.x; pts[i*3+1] = starts.y; pts[i*3+2] = starts.z;
      }
      const pGeo = new THREE.BufferGeometry();
      pGeo.setAttribute('position', new THREE.BufferAttribute(pts, 3));
      const pMat = new THREE.PointsMaterial({ color: col, size: 0.12, transparent: true, opacity: 0.7 });
      const ptsMesh = new THREE.Points(pGeo, pMat);
      this._scene.add(ptsMesh);

      this._edges.push({
        from: p.from, to: p.to,
        line, ptsMesh, count,
        speed: 0.5 + p.score * 0.5,
        offset: Math.random() * 10,
        color: col,
      });
    }
  }

  resize() {
    if (!this._renderer) return;
    const W = this._c.clientWidth || 640;
    const H = this._c.clientHeight || 320;
    this._renderer.setSize(W, H);
    if (this._camera) { this._camera.aspect = W / H; this._camera.updateProjectionMatrix(); }
  }

  dispose() {
    this._disposed = true;
    if (this._raf) cancelAnimationFrame(this._raf);
    window.removeEventListener('resize', this.resize);
    if (this._renderer) { this._c.removeChild(this._renderer.domElement); this._renderer.dispose(); }
  }

  setData(score, model, level) {
    // Update node colors based on result
    const dec = this._nodes.find(n => n.type === 'decision');
    if (dec && dec.mesh) {
      const color = level === 'high' ? 0xd15c5c : level === 'medium' ? 0xcf9f4b : 0x4ade80;
      dec.mesh.material.color.setHex(color);
      dec.mesh.material.emissive.setHex(color);
    }
    // Highlight active model path
    const m = model === 'quantum' ? this._nodes.find(n => n.type === 'quantum') : this._nodes.find(n => n.type === 'model');
    if (m && m.mesh) {
      m.mesh.scale.set(1.15, 1.15, 1.15);
      setTimeout(() => m.mesh.scale.set(1, 1, 1), 1200);
    }
  }

  _loop() {
    if (this._disposed) return;
    this._raf = requestAnimationFrame(() => this._loop());
    const t = performance.now() * 0.001;

    // Rotate nodes slowly (state-change motion, not decorative)
    for (const n of this._nodes) {
      if (n.mesh) n.mesh.rotation.y = Math.sin(t * 0.3 + n.x) * 0.08;
    }

    // Animate particles along edges
    for (const e of this._edges) {
      const pos = e.ptsMesh.geometry.attributes.position.array;
      for (let i = 0; i < e.count; i++) {
        const progress = ((t * e.speed + e.offset + i / e.count) % 1);
        const from = new THREE.Vector3(e.from.x, e.from.y, e.from.z);
        const to = new THREE.Vector3(e.to.x, e.to.y, e.to.z);
        pos[i*3]     = THREE.MathUtils.lerp(from.x, to.x, progress);
        pos[i*3+1]   = THREE.MathUtils.lerp(from.y, to.y, progress) + Math.sin(t * 2 + i) * 0.08;
        pos[i*3+2]   = THREE.MathUtils.lerp(from.z, to.z, progress);
      }
      e.ptsMesh.geometry.attributes.position.needsUpdate = true;
    }

    // Very slow orbit
    if (this._camera) {
      const angle = t * 0.08;
      this._camera.position.x = Math.sin(angle) * 28;
      this._camera.position.z = Math.cos(angle) * 28;
      this._camera.lookAt(0, 0, 0);
    }

    if (this._renderer && this._scene && this._camera) {
      this._renderer.render(this._scene, this._camera);
    }
  }
}
