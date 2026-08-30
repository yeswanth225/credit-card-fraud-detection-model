/**
 * auth-network.js — Subtle 3D Financial Network Particle Background for cred ai Authentication
 * Renders connected nodes and floating data streams communicating bank-grade transaction intelligence.
 */

import * as THREE from 'three';

export class AuthNetworkVisualizer {
  constructor(container) {
    this.container = container;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.animationFrameId = null;
    this.isDisposed = false;
    this.points = null;
    this.lines = null;

    this.init();
  }

  init() {
    if (!this.container) return;

    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, width / height, 1, 1000);
    this.camera.position.z = 180;

    try {
      this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.container.innerHTML = '';
      this.container.appendChild(this.renderer.domElement);
    } catch (e) {
      return;
    }

    const particleCount = 75;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = [];

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 280;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 180;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 120;

      velocities.push({
        x: (Math.random() - 0.5) * 0.15,
        y: (Math.random() - 0.5) * 0.15,
        z: (Math.random() - 0.5) * 0.1,
      });
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.velocities = velocities;

    const pMaterial = new THREE.PointsMaterial({
      color: 0x818cf8,
      size: 3.5,
      transparent: true,
      opacity: 0.65,
    });

    this.points = new THREE.Points(geometry, pMaterial);
    this.scene.add(this.points);

    // Dynamic interconnecting lines
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x4f46e5,
      transparent: true,
      opacity: 0.18,
    });
    this.lineGeometry = new THREE.BufferGeometry();
    this.lines = new THREE.LineSegments(this.lineGeometry, lineMaterial);
    this.scene.add(this.lines);

    this.boundResize = this.onResize.bind(this);
    window.addEventListener('resize', this.boundResize);

    this.animate = this.animate.bind(this);
    this.animate();
  }

  animate() {
    if (this.isDisposed) return;
    this.animationFrameId = requestAnimationFrame(this.animate);

    const positions = this.points.geometry.attributes.position.array;
    const count = positions.length / 3;

    for (let i = 0; i < count; i++) {
      positions[i * 3] += this.velocities[i].x;
      positions[i * 3 + 1] += this.velocities[i].y;
      positions[i * 3 + 2] += this.velocities[i].z;

      if (positions[i * 3] < -140 || positions[i * 3] > 140) this.velocities[i].x *= -1;
      if (positions[i * 3 + 1] < -90 || positions[i * 3 + 1] > 90) this.velocities[i].y *= -1;
      if (positions[i * 3 + 2] < -60 || positions[i * 3 + 2] > 60) this.velocities[i].z *= -1;
    }
    this.points.geometry.attributes.position.needsUpdate = true;

    // Connect nearby particles with lines
    const linePositions = [];
    const maxDist = 55;

    for (let i = 0; i < count; i++) {
      for (let j = i + 1; j < count; j++) {
        const dx = positions[i * 3] - positions[j * 3];
        const dy = positions[i * 3 + 1] - positions[j * 3 + 1];
        const dz = positions[i * 3 + 2] - positions[j * 3 + 2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (dist < maxDist) {
          linePositions.push(
            positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2],
            positions[j * 3], positions[j * 3 + 1], positions[j * 3 + 2]
          );
        }
      }
    }

    this.lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));

    // Slow rotation
    this.scene.rotation.y += 0.0008;
    this.scene.rotation.x += 0.0004;

    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  onResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  dispose() {
    this.isDisposed = true;
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    window.removeEventListener('resize', this.boundResize);

    if (this.renderer && this.renderer.domElement) {
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
