/**
 * three-network.js — 3D Transaction Flow Visualization
 * ======================================================
 * Renders a live WebGL scene of the transaction network using Three.js.
 * Nodes = merchant / issuer / acquirer / gateway anchors.
 * Edges = transaction paths with flowing particles.
 * Camera auto-orbits; mouse drag overrides for inspection.
 *
 * Usage:
 *   import { TransactionNetwork } from './three-network.js';
 *   const viz = new TransactionNetwork(containerElement);
 *   viz.setTransactions(txList);   // Array of scored transaction objects
 *   viz.resize();                  // Call on window resize
 *   viz.dispose();                 // Call on screen exit to release GPU
 */

export class TransactionNetwork {
  /**
   * @param {HTMLElement} container  — DOM element that will hold the <canvas>
   */
  constructor(container) {
    this._container = container;
    this._renderer  = null;
    this._scene      = null;
    this._camera    = null;
    this._rafId      = null;
    this._txList     = [];
    this._nodes      = [];   // { mesh, label, type, txCount }
    this._edges      = [];   // { line, particleSystem, from, to }
    this._mouseDown  = false;
    this._lastMouse  = { x: 0, y: 0 };
    this._orbitAngle = { theta: 0.4, phi: 0.3 };
    this._orbitRadius = 22;
    this._autoRotate = true;
    this._disposed   = false;

    this._init();
  }

  /* ================================================================
     Scene Setup
  ================================================================ */
  _init() {
    // Lazy-load Three.js from CDN the first time a TransactionNetwork is created
    if (!window._threeLoaded) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
      script.onload = () => { window._threeLoaded = true; this._setupScene(); };
      document.head.appendChild(script);
    } else {
      this._setupScene();
    }
  }

  _setupScene() {
    const { clientWidth: W, clientHeight: H } = this._container;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    // Renderer
    this._renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this._renderer.setSize(W, H);
    this._renderer.setPixelRatio(dpr);
    this._renderer.setClearColor(0x000000, 0);
    this._container.appendChild(this._renderer.domElement);

    // Scene
    this._scene = new THREE.Scene();

    // Camera
    this._camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 500);
    this._camera.position.set(0, 8, 22);
    this._camera.lookAt(0, 0, 0);

    // Lights
    const ambient = new THREE.AmbientLight(0x111827, 0.9);
    this._scene.add(ambient);
    const key = new THREE.PointLight(0xcf9f4b, 1.2, 60);
    key.position.set(8, 14, 10);
    this._scene.add(key);
    const fill = new THREE.PointLight(0x3b6ea8, 0.6, 50);
    fill.position.set(-10, 6, -8);
    this._scene.add(fill);

    // Subtle star field (depth backdrop)
    this._addStarField();

    // Events
    this._container.addEventListener('mousedown',  this._onMouseDown.bind(this));
    this._container.addEventListener('mousemove',  this._onMouseMove.bind(this));
    this._container.addEventListener('mouseup',    this._onMouseUp.bind(this));
    this._container.addEventListener('touchstart', this._onTouchStart.bind(this), { passive: true });
    this._container.addEventListener('touchmove',  this._onTouchMove.bind(this),  { passive: true });
    this._container.addEventListener('touchend',   this._onTouchEnd.bind(this));
    window.addEventListener('resize', this.resize.bind(this));

    // Loop
    this._loop();
  }

  /* ================================================================
     Public API
  ================================================================ */
  setTransactions(txList) {
    this._txList = txList || [];
    if (this._scene) this._rebuild();
  }

  resize() {
    if (!this._renderer || !this._camera) return;
    const { clientWidth: W, clientHeight: H } = this._container;
    this._renderer.setSize(W, H);
    this._camera.aspect = W / H;
    this._camera.updateProjectionMatrix();
  }

  dispose() {
    this._disposed = true;
    if (this._rafId) cancelAnimationFrame(this._rafId);
    window.removeEventListener('resize', this.resize.bind(this));
    this._container.removeEventListener('mousedown',  this._onMouseDown.bind(this));
    this._container.removeEventListener('mousemove',  this._onMouseMove.bind(this));
    this._container.removeEventListener('mouseup',    this._onMouseUp.bind(this));
    this._container.removeEventListener('touchstart', this._onTouchStart.bind(this));
    this._container.removeEventListener('touchmove',  this._onTouchMove.bind(this));
    this._container.removeEventListener('touchend',   this._onTouchEnd.bind(this));
    if (this._renderer) {
      this._container.removeChild(this._renderer.domElement);
      this._renderer.dispose();
    }
  }

  /* ================================================================
     Network Construction
  ================================================================ */
  _rebuild() {
    // Clear old objects
    for (const n of this._nodes) {
      this._scene.remove(n.mesh);
      if (n.ring) this._scene.remove(n.ring);
    }
    for (const e of this._edges) {
      this._scene.remove(e.line);
      if (e.particleMesh) this._scene.remove(e.particleMesh);
    }
    this._nodes = [];
    this._edges = [];

    if (this._txList.length === 0) {
      this._addPlaceholder();
      return;
    }

    // Derive anchors from transactions
    const anchors = this._deriveAnchors();
    const positions = this._computePositions(anchors);

    // Draw edges first (behind nodes)
    for (const tx of this._txList.slice(0, 60)) {
      const from = this._anchorKey(tx.from_anchor || 'card_issuer');
      const to   = this._anchorKey(tx.to_anchor   || tx.merchant || 'merchant_unknown');
      const fromPos = positions[from];
      const toPos   = positions[to];
      if (!fromPos || !toPos) continue;
      const score = (tx.classical?.score ?? tx.quantum?.score ?? 0);
      this._addEdge(fromPos, toPos, score, tx);
    }

    // Draw nodes on top
    for (const [key, anchor] of Object.entries(anchors)) {
      const pos = positions[key];
      if (!pos) continue;
      this._addNode(pos, anchor.type, anchor.label, anchor.txCount);
    }
  }

  _deriveAnchors() {
    const anchors = {};
    const addAnchor = (key, type, label) => {
      if (!anchors[key]) anchors[key] = { type, label, txCount: 0 };
    };
    addAnchor('card_issuer',     'bank',    'Card Issuer');
    addAnchor('acquirer',         'acquirer','Acquirer Network');
    addAnchor('payment_gateway',  'gateway', 'Payment Gateway');
    addAnchor('merchant_unknown', 'merchant','Merchant');
    addAnchor('clearing_house',   'clearing','Clearing House');

    for (const tx of this._txList.slice(0, 60)) {
      const merchant = (tx.merchant || 'merchant_unknown').toLowerCase().replace(/\s+/g, '_').slice(0, 24);
      addAnchor(merchant, 'merchant', tx.merchant || 'Merchant');
      anchors[merchant].txCount++;
    }

    // Top 4 merchants by frequency
    const sorted = Object.entries(anchors)
      .filter(([, a]) => a.type === 'merchant')
      .sort((a, b) => b[1].txCount - a[1].txCount)
      .slice(0, 4)
      .map(([k]) => k);

    // Keep only top merchants + fixed anchors
    const toKeep = new Set(['card_issuer', 'acquirer', 'payment_gateway', 'clearing_house', ...sorted]);
    for (const k of Object.keys(anchors)) {
      if (!toKeep.has(k)) delete anchors[k];
    }

    return anchors;
  }

  _anchorKey(str) {
    return (str || 'unknown').toLowerCase().replace(/\s+/g, '_').slice(0, 24);
  }

  _computePositions(anchors) {
    const positions = {};
    const keys = Object.keys(anchors);
    const N = keys.length;

    // Fibonacci sphere-like 2D spread in a circle
    keys.forEach((key, i) => {
      const angle = (i / N) * Math.PI * 2 - Math.PI / 2;
      const r = 9;
      positions[key] = new THREE.Vector3(
        Math.cos(angle) * r,
        (Math.random() - 0.5) * 3,
        Math.sin(angle) * r,
      );
    });

    return positions;
  }

  /* ================================================================
     Node Rendering
  ================================================================ */
  _addNode(pos, type, label, txCount) {
    const colorMap = {
      bank:     0xcf9f4b,
      acquirer: 0x4a9ed4,
      gateway:  0x8b5cf6,
      clearing: 0x6b7280,
      merchant: 0x4ade80,
    };
    const color = colorMap[type] || 0xcf9f4b;
    const size  = type === 'bank' ? 0.9 : type === 'gateway' ? 0.75 : 0.55;

    // Core sphere
    const geo  = new THREE.SphereGeometry(size, 20, 20);
    const mat  = new THREE.MeshPhongMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.25,
      shininess: 90,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    mesh.userData = { label, type, txCount };
    this._scene.add(mesh);
    this._nodes.push(mesh);

    // Pulse ring (animated in loop)
    const ringGeo = new THREE.RingGeometry(size + 0.15, size + 0.22, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.copy(pos);
    ring.lookAt(new THREE.Vector3(0, 1, 0));
    this._scene.add(ring);
    this._nodes.push(ring); // stored alongside for loop access
    // Store reference
    mesh.userData.ring = ring;
  }

  /* ================================================================
     Edge + Particle Rendering
  ================================================================ */
  _addEdge(from, to, score, tx) {
    // Thin edge line
    const mid = new THREE.Vector3().addVectors(from, to).multiplyScalar(0.5);
    const length = from.distanceTo(to);
    const dir = new THREE.Vector3().subVectors(to, from).normalize();

    const geo = new THREE.BufferGeometry().setFromPoints([from, to]);
    const col = score >= 0.7 ? 0xd15c5c : score >= 0.4 ? 0xcf9f4b : 0x4ade80;
    const mat = new THREE.LineBasicMaterial({
      color: col,
      transparent: true,
      opacity: 0.18 + score * 0.22,
    });
    const line = new THREE.Line(geo, mat);
    this._scene.add(line);

    // Particle trail along edge
    const particleCount = Math.min(Math.round(length * 6), 80);
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3]     = from.x;
      positions[i * 3 + 1] = from.y;
      positions[i * 3 + 2] = from.z;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const pMat = new THREE.PointsMaterial({
      color: col,
      size: 0.14,
      transparent: true,
      opacity: 0.7 + score * 0.2,
      sizeAttenuation: true,
    });
    const particleMesh = new THREE.Points(pGeo, pMat);
    this._scene.add(particleMesh);

    this._edges.push({
      line,
      particleMesh,
      from,
      to,
      score,
      particleCount,
      particlePhase: Math.random() * Math.PI * 2,
      particleSpeed: 0.4 + score * 0.6,
    });
  }

  /* ================================================================
     Placeholder State
  ================================================================ */
  _addPlaceholder() {
    // Show a gentle rotating ring of dots
    const geo = new THREE.TorusGeometry(6, 0.08, 8, 80);
    const mat = new THREE.MeshBasicMaterial({ color: 0x202a3a, transparent: true, opacity: 0.8 });
    const ring = new THREE.Mesh(geo, mat);
    ring.rotation.x = Math.PI / 3;
    this._scene.add(ring);
    this._nodes.push(ring); // trick: store as node so loop rotates it

    // Central label dot
    const dotGeo = new THREE.SphereGeometry(0.4, 16, 16);
    const dotMat = new THREE.MeshPhongMaterial({ color: 0xcf9f4b, emissive: 0xcf9f4b, emissiveIntensity: 0.3 });
    const dot = new THREE.Mesh(dotGeo, dotMat);
    dot.userData.isPlaceholder = true;
    this._scene.add(dot);
    this._nodes.push(dot);
  }

  /* ================================================================
     Star Field
  ================================================================ */
  _addStarField() {
    const count = 600;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.acos(2 * Math.random() - 1);
      const r     = 80 + Math.random() * 60;
      positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({ color: 0x3b4252, size: 0.25, transparent: true, opacity: 0.6 });
    const stars = new THREE.Points(geo, mat);
    this._scene.add(stars);
  }

  /* ================================================================
     Render Loop
  ================================================================ */
  _loop() {
    if (this._disposed) return;
    this._rafId = requestAnimationFrame(() => this._loop());
    const t = performance.now() * 0.001;

    // Auto-orbit
    if (this._autoRotate) {
      this._orbitAngle.theta += 0.004;
    }
    const r = this._orbitRadius;
    this._camera.position.set(
      Math.cos(this._orbitAngle.theta) * Math.sin(this._orbitAngle.phi) * r,
      Math.cos(this._orbitAngle.phi) * r,
      Math.sin(this._orbitAngle.theta) * Math.sin(this._orbitAngle.phi) * r,
    );
    this._camera.lookAt(0, 0, 0);

    // Animate rings (pulse scale)
    for (const mesh of this._nodes) {
      if (!mesh.userData) continue;
      if (mesh.userData.ring) {
        const s = 1 + Math.sin(t * 2) * 0.08;
        mesh.userData.ring.scale.set(s, s, s);
        mesh.userData.ring.material.opacity = 0.2 + Math.sin(t * 2) * 0.15;
      }
      if (mesh.userData.isPlaceholder) {
        mesh.position.y = Math.sin(t * 0.8) * 0.4;
      }
    }

    // Animate particles along edges
    for (const edge of this._edges) {
      const pos = edge.particleMesh.geometry.attributes.position.array;
      for (let i = 0; i < edge.particleCount; i++) {
        const frac = ((i / edge.particleCount) + t * edge.particleSpeed * 0.25 + edge.particlePhase) % 1;
        pos[i * 3]     = THREE.MathUtils.lerp(edge.from.x, edge.to.x, frac);
        pos[i * 3 + 1] = THREE.MathUtils.lerp(edge.from.y, edge.to.y, frac) + Math.sin(t * 3 + i) * 0.06;
        pos[i * 3 + 2] = THREE.MathUtils.lerp(edge.from.z, edge.to.z, frac);
      }
      edge.particleMesh.geometry.attributes.position.needsUpdate = true;
    }

    this._renderer.render(this._scene, this._camera);
  }

  /* ================================================================
     Mouse / Touch Interaction
  ================================================================ */
  _onMouseDown(e) {
    this._mouseDown = true;
    this._lastMouse = { x: e.clientX, y: e.clientY };
    this._autoRotate = false;
  }

  _onMouseMove(e) {
    if (!this._mouseDown) return;
    const dx = e.clientX - this._lastMouse.x;
    const dy = e.clientY - this._lastMouse.y;
    this._orbitAngle.theta -= dx * 0.008;
    this._orbitAngle.phi    = Math.max(0.15, Math.min(1.4, this._orbitAngle.phi + dy * 0.006));
    this._lastMouse = { x: e.clientX, y: e.clientY };
  }

  _onMouseUp() {
    this._mouseDown = false;
    setTimeout(() => { this._autoRotate = true; }, 4000);
  }

  _onTouchStart(e) {
    if (e.touches.length === 1) {
      this._mouseDown = true;
      this._lastMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      this._autoRotate = false;
    }
  }

  _onTouchMove(e) {
    if (!this._mouseDown || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - this._lastMouse.x;
    const dy = e.touches[0].clientY - this._lastMouse.y;
    this._orbitAngle.theta -= dx * 0.01;
    this._orbitAngle.phi    = Math.max(0.15, Math.min(1.4, this._orbitAngle.phi + dy * 0.008));
    this._lastMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }

  _onTouchEnd() {
    this._mouseDown = false;
    setTimeout(() => { this._autoRotate = true; }, 4000);
  }
}
