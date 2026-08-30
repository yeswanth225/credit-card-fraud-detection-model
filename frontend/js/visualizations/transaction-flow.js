/**
 * transaction-flow.js — High-Performance 3D/WebGL Financial Transaction Flow Visualizer for cred ai
 * Uses Three.js to render a multi-tier financial network topology:
 * [Cardholder / Account] -> [Payment Instrument] -> [Merchant / MCC] -> [Geo / Routing] -> [Fraud Engine (Classical + Quantum)] -> [Risk Decision]
 * Features moving transaction packets, risk-based visual intensity (Normal = green/cyan, High Risk = crimson pulse),
 * interactive hover/selection, and automatic fallback.
 */

import * as THREE from 'three';

export class TransactionFlowVisualizer {
  /**
   * @param {HTMLElement} container - Target container element
   * @param {Object} options - Configuration options
   */
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      height: options.height || 260,
      interactive: options.interactive !== false,
      autoRotate: options.autoRotate || false,
      theme: options.theme || (document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'),
      onSelect: options.onSelect || null,
      transactions: options.transactions || [],
      ...options,
    };

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.animationFrameId = null;
    this.isDisposed = false;
    this.nodes = [];
    this.connections = [];
    this.particles = [];
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2(-999, -999);
    this.hoveredNode = null;

    this.init();
  }

  init() {
    if (!this.container) return;

    const width = this.container.clientWidth || 600;
    const height = this.options.height;

    // Scene
    this.scene = new THREE.Scene();

    // Camera
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    this.camera.position.set(0, 15, 42);
    this.camera.lookAt(0, 0, 0);

    // Renderer
    try {
      this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.renderer.setClearColor(0x000000, 0);
      this.container.innerHTML = '';
      this.container.appendChild(this.renderer.domElement);
    } catch (err) {
      console.warn('[cred ai] WebGL initialization failed, rendering fallback', err);
      this.renderFallback();
      return;
    }

    // Build Financial Mesh Topology
    this.buildNetwork();

    // Spawn animated transaction packets
    this.spawnPackets();

    // Event listeners
    this.boundResize = this.onResize.bind(this);
    this.boundMouseMove = this.onMouseMove.bind(this);
    this.boundClick = this.onClick.bind(this);

    window.addEventListener('resize', this.boundResize);
    if (this.options.interactive) {
      this.renderer.domElement.addEventListener('mousemove', this.boundMouseMove);
      this.renderer.domElement.addEventListener('click', this.boundClick);
    }

    // Start animation loop
    this.animate = this.animate.bind(this);
    this.clock = new THREE.Clock();
    this.animate();
  }

  buildNetwork() {
    // 5-Stage Network Nodes Topology
    const stageDefs = [
      { id: 'source', label: 'Origin Account', x: -22, y: 0, z: -3, color: 0x38bdf8, icon: 'user' },
      { id: 'instrument', label: 'Card / UPI Token', x: -11, y: 3, z: 2, color: 0x818cf8, icon: 'creditCard' },
      { id: 'merchant', label: 'Merchant Gateway', x: 0, y: -2, z: -2, color: 0xa78bfa, icon: 'grid' },
      { id: 'geo', label: 'Geo Routing', x: 10, y: 4, z: 1, color: 0x38bdf8, icon: 'shield' },
      { id: 'engine', label: 'cred ai Engine', x: 20, y: 0, z: -2, color: 0x10b981, icon: 'zap' },
    ];

    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    const nodeMatNormal = new THREE.MeshBasicMaterial({ color: isDark ? 0x94a3b8 : 0x334155 });
    const nodeMatHighlight = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });

    stageDefs.forEach(def => {
      // Core sphere
      const geo = new THREE.SphereGeometry(1.2, 24, 24);
      const mat = new THREE.MeshBasicMaterial({ color: def.color });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(def.x, def.y, def.z);
      mesh.userData = def;

      // Subtle Outer Halo Ring
      const ringGeo = new THREE.RingGeometry(1.6, 1.85, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: def.color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.35,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.position.set(def.x, def.y, def.z);
      ringMesh.rotation.x = Math.PI / 2;

      this.scene.add(mesh);
      this.scene.add(ringMesh);

      this.nodes.push({ mesh, ring: ringMesh, def });
    });

    // Spline curve connections between nodes
    for (let i = 0; i < stageDefs.length - 1; i++) {
      const p1 = new THREE.Vector3(stageDefs[i].x, stageDefs[i].y, stageDefs[i].z);
      const p2 = new THREE.Vector3(stageDefs[i + 1].x, stageDefs[i + 1].y, stageDefs[i + 1].z);
      const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
      mid.y += (i % 2 === 0 ? 2.5 : -2.0);

      const curve = new THREE.QuadraticBezierCurve3(p1, mid, p2);
      const points = curve.getPoints(40);
      const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
      const lineMat = new THREE.LineBasicMaterial({
        color: isDark ? 0x334155 : 0xcbd5e1,
        transparent: true,
        opacity: 0.55,
      });
      const line = new THREE.Line(lineGeo, lineMat);
      this.scene.add(line);
      this.connections.push({ curve, line });
    }
  }

  spawnPackets() {
    // Generate animated pulse packets moving along the pipeline
    const txCount = 14;
    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';

    for (let i = 0; i < txCount; i++) {
      const isHighRisk = i % 4 === 0;
      const isMedium = i % 5 === 0;
      const color = isHighRisk ? 0xef4444 : isMedium ? 0xf59e0b : 0x10b981;
      const size = isHighRisk ? 0.65 : 0.45;

      const pGeo = new THREE.SphereGeometry(size, 16, 16);
      const pMat = new THREE.MeshBasicMaterial({ color });
      const pMesh = new THREE.Mesh(pGeo, pMat);

      const connIdx = i % this.connections.length;
      const progress = (i / txCount) + Math.random() * 0.1;
      const speed = 0.18 + (Math.random() * 0.15);

      this.scene.add(pMesh);
      this.particles.push({
        mesh: pMesh,
        connIdx,
        progress: progress % 1.0,
        speed,
        isHighRisk,
      });
    }
  }

  animate() {
    if (this.isDisposed) return;
    this.animationFrameId = requestAnimationFrame(this.animate);

    const delta = this.clock.getDelta();
    const time = this.clock.getElapsedTime();

    // Pulse node halo rings
    this.nodes.forEach((n, idx) => {
      if (n.ring) {
        const scale = 1.0 + Math.sin(time * 2.5 + idx) * 0.12;
        n.ring.scale.set(scale, scale, scale);
      }
    });

    // Move transaction packets along spline curves
    this.particles.forEach(p => {
      p.progress += delta * p.speed;
      if (p.progress >= 1.0) {
        p.progress = 0;
        p.connIdx = (p.connIdx + 1) % this.connections.length;
      }
      const curve = this.connections[p.connIdx].curve;
      const point = curve.getPoint(p.progress);
      p.mesh.position.copy(point);

      // Subtle scale pulse for high-risk packets
      if (p.isHighRisk) {
        const pScale = 1.0 + Math.sin(time * 8.0) * 0.25;
        p.mesh.scale.set(pScale, pScale, pScale);
      }
    });

    // Gentle camera sway
    this.camera.position.x = Math.sin(time * 0.2) * 2.5;
    this.camera.position.y = 15 + Math.cos(time * 0.2) * 1.0;
    this.camera.lookAt(0, 0, 0);

    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  onResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth;
    const height = this.options.height;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  onMouseMove(e) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const meshes = this.nodes.map(n => n.mesh);
    const intersects = this.raycaster.intersectObjects(meshes);

    if (intersects.length > 0) {
      this.renderer.domElement.style.cursor = 'pointer';
      const hitNode = intersects[0].object;
      this.hoveredNode = hitNode.userData;
    } else {
      this.renderer.domElement.style.cursor = 'default';
      this.hoveredNode = null;
    }
  }

  onClick() {
    if (this.hoveredNode && this.options.onSelect) {
      this.options.onSelect(this.hoveredNode);
    }
  }

  renderFallback() {
    if (!this.container) return;
    this.container.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-around;padding:24px;background:var(--c-surface);border-radius:var(--r-lg);height:${this.options.height}px;">
        <div style="text-align:center"><div class="badge badge-neutral" style="margin-bottom:6px">Account</div><div style="font-size:12px;font-weight:600">Cardholder</div></div>
        <div style="color:var(--c-text-3)">→</div>
        <div style="text-align:center"><div class="badge badge-neutral" style="margin-bottom:6px">Instrument</div><div style="font-size:12px;font-weight:600">Visa / RuPay</div></div>
        <div style="color:var(--c-text-3)">→</div>
        <div style="text-align:center"><div class="badge badge-quantum" style="margin-bottom:6px">cred ai</div><div style="font-size:12px;font-weight:600">Triage Engine</div></div>
        <div style="color:var(--c-text-3)">→</div>
        <div style="text-align:center"><div class="badge badge-low" style="margin-bottom:6px">Verdict</div><div style="font-size:12px;font-weight:600">Decision Ready</div></div>
      </div>`;
  }

  dispose() {
    this.isDisposed = true;
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    window.removeEventListener('resize', this.boundResize);

    if (this.renderer && this.renderer.domElement) {
      this.renderer.domElement.removeEventListener('mousemove', this.boundMouseMove);
      this.renderer.domElement.removeEventListener('click', this.boundClick);
      this.renderer.dispose();
      if (this.renderer.domElement.parentElement) {
        this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
      }
    }
    this.scene = null;
    this.camera = null;
    this.renderer = null;
  }
}
