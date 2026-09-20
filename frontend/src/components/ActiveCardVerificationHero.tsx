import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ShieldCheck } from 'lucide-react';

interface ActiveCardVerificationHeroProps {
  reducedMotion?: boolean;
  containerElementId?: string;
  className?: string;
}

const LINE_1 = 'Verifying in real time';
const LINE_2 = 'Risk checked. Evidence weighed. Decision made.';

/**
 * 3D Animated Centerpiece Visual for FraudShield Dashboard.
 * Stylized 3D credit card floating gently with real-time verification scan line,
 * pulsing EMV chip, periodic checkmark micro-moments, and corroboration particles.
 * Extended with:
 * 1. Soft-lag spring cursor-follow translation and rotation across the intro section.
 * 2. Populated card texture: FraudShield wordmark, masked PAN (•••• •••• •••• 4821), and neutral network mark.
 * 3. Typewriter text reveal animating downward from top of card zone with blinking cursor.
 */
export const ActiveCardVerificationHero: React.FC<ActiveCardVerificationHeroProps> = ({
  reducedMotion: propReducedMotion,
  containerElementId,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isVerifiedBeat, setIsVerifiedBeat] = useState(false);

  // Typewriter text states
  const [displayedLine1, setDisplayedLine1] = useState('');
  const [displayedLine2, setDisplayedLine2] = useState('');
  const [activeTypingLine, setActiveTypingLine] = useState<1 | 2 | null>(1);

  // 1. Typewriter Animation Effect
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const prefersReducedMotion = propReducedMotion ?? mediaQuery.matches;

    if (prefersReducedMotion) {
      setDisplayedLine1(LINE_1);
      setDisplayedLine2(LINE_2);
      setActiveTypingLine(null);
      return;
    }

    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    // Type Line 1
    let charIdx1 = 0;
    const typeLine1 = () => {
      if (!isMounted) return;
      if (charIdx1 <= LINE_1.length) {
        setDisplayedLine1(LINE_1.slice(0, charIdx1));
        charIdx1++;
        timeoutId = setTimeout(typeLine1, 38);
      } else {
        // Line 1 finished. Pause briefly, then switch cursor to Line 2
        timeoutId = setTimeout(() => {
          if (!isMounted) return;
          setActiveTypingLine(2);
          typeLine2();
        }, 280);
      }
    };

    // Type Line 2
    let charIdx2 = 0;
    const typeLine2 = () => {
      if (!isMounted) return;
      if (charIdx2 <= LINE_2.length) {
        setDisplayedLine2(LINE_2.slice(0, charIdx2));
        charIdx2++;
        timeoutId = setTimeout(typeLine2, 34);
      } else {
        // Line 2 finished. Keep cursor for 2 blinks, then remove
        timeoutId = setTimeout(() => {
          if (!isMounted) return;
          setActiveTypingLine(null);
        }, 650);
      }
    };

    // Begin typing after a tiny delay so DOM is settled
    timeoutId = setTimeout(typeLine1, 120);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [propReducedMotion]);

  // 2. Three.js Scene with Cursor Follow & Card Face Texture
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const prefersReducedMotion = propReducedMotion ?? mediaQuery.matches;

    let isDestroyed = false;
    let animationFrameId: number;
    let renderer: THREE.WebGLRenderer | null = null;
    let scene: THREE.Scene | null = null;
    let camera: THREE.PerspectiveCamera | null = null;

    const disposables: { dispose: () => void }[] = [];

    // Lazy load Three.js scene so dashboard initial render is instantaneous
    const timer = setTimeout(() => {
      if (isDestroyed || !containerRef.current || !canvasRef.current) return;

      const container = containerRef.current;
      const canvas = canvasRef.current;
      const width = container.clientWidth || 340;
      const height = 210;

      // 1. Scene & Camera
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 100);
      camera.position.set(0, 0, 5.2);

      // 2. WebGL Renderer with transparent background matching page
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.1;

      // 3. Lighting (Strictly neutral + indigo accent)
      const ambientLight = new THREE.AmbientLight(0x4338ca, 0.7);
      scene.add(ambientLight);

      const mainLight = new THREE.DirectionalLight(0xffffff, 1.45);
      mainLight.position.set(2.5, 4, 3.5);
      scene.add(mainLight);

      const fillLight = new THREE.DirectionalLight(0x1e1b4b, 0.85);
      fillLight.position.set(-3, -2, 2);
      scene.add(fillLight);

      const rimLight = new THREE.DirectionalLight(0x6366f1, 2.4);
      rimLight.position.set(-3.5, 3, -2.5);
      scene.add(rimLight);

      // 4. Create Card Group (floats and tilts as a single unit)
      const cardGroup = new THREE.Group();
      scene.add(cardGroup);

      // 5. Card Body Geometry: Standard credit card proportions with rounded corners (12-16px aesthetic)
      const cardWidth = 3.2;
      const cardHeight = 2.02;
      const cornerRadius = 0.16;

      const shape = new THREE.Shape();
      const x = -cardWidth / 2;
      const y = -cardHeight / 2;
      shape.moveTo(x + cornerRadius, y);
      shape.lineTo(x + cardWidth - cornerRadius, y);
      shape.quadraticCurveTo(x + cardWidth, y, x + cardWidth, y + cornerRadius);
      shape.lineTo(x + cardWidth, y + cardHeight - cornerRadius);
      shape.quadraticCurveTo(x + cardWidth, y + cardHeight, x + cardWidth - cornerRadius, y + cardHeight);
      shape.lineTo(x + cornerRadius, y + cardHeight);
      shape.quadraticCurveTo(x, y + cardHeight, x, y + cardHeight - cornerRadius);
      shape.lineTo(x, y + cornerRadius);
      shape.quadraticCurveTo(x, y, x + cornerRadius, y);

      const extrudeSettings: THREE.ExtrudeGeometryOptions = {
        depth: 0.05,
        bevelEnabled: true,
        bevelSegments: 3,
        steps: 1,
        bevelSize: 0.02,
        bevelThickness: 0.015,
      };

      const cardGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      cardGeo.center();
      disposables.push(cardGeo);

      // 6. POPULATED CARD TEXTURE — High-Res Canvas Texture for Card Face
      const faceCanvas = document.createElement('canvas');
      faceCanvas.width = 1024;
      faceCanvas.height = 646;
      const fCtx = faceCanvas.getContext('2d');
      if (fCtx) {
        // Base dark obsidian gradient (#16161D -> #0D0D11)
        const bgGrad = fCtx.createLinearGradient(0, 0, 1024, 646);
        bgGrad.addColorStop(0, '#16161D');
        bgGrad.addColorStop(0.5, '#121217');
        bgGrad.addColorStop(1, '#0D0D11');
        fCtx.fillStyle = bgGrad;
        fCtx.fillRect(0, 0, 1024, 646);

        // Brushed-metal diagonal micro-texture
        fCtx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
        fCtx.lineWidth = 1;
        for (let i = -646; i < 1024; i += 8) {
          fCtx.beginPath();
          fCtx.moveTo(i, 0);
          fCtx.lineTo(i + 646, 646);
          fCtx.stroke();
        }

        // Perimeter Bezel Line
        fCtx.strokeStyle = 'rgba(99, 102, 241, 0.22)';
        fCtx.lineWidth = 2.5;
        fCtx.strokeRect(24, 24, 1024 - 48, 646 - 48);

        // [A] FraudShield Wordmark/Logo in Top-Left (Subtle etched light-gray/white at low opacity)
        fCtx.fillStyle = 'rgba(240, 240, 255, 0.45)';
        fCtx.font = '600 28px "Poppins", "Plus Jakarta Sans", sans-serif';
        fCtx.fillText('FraudShield', 64, 86);

        // Subtle etched micro-descriptor
        fCtx.fillStyle = 'rgba(165, 180, 252, 0.35)';
        fCtx.font = '500 13px monospace';
        fCtx.fillText('AUTONOMOUS VERIFICATION', 64, 114);

        // [B] Contactless Wave Glyphs (Upper right)
        fCtx.strokeStyle = 'rgba(129, 140, 248, 0.35)';
        fCtx.lineWidth = 3.5;
        fCtx.beginPath();
        fCtx.arc(920, 80, 24, -Math.PI * 0.7, -Math.PI * 0.3);
        fCtx.stroke();
        fCtx.beginPath();
        fCtx.arc(920, 80, 38, -Math.PI * 0.7, -Math.PI * 0.3);
        fCtx.stroke();
        fCtx.beginPath();
        fCtx.arc(920, 80, 52, -Math.PI * 0.7, -Math.PI * 0.3);
        fCtx.stroke();

        // [C] Masked Card Number Placeholder in Lower-Left Area
        // Styled like a real card: "•••• •••• •••• 4821" in monospace/Inter font, light gray
        fCtx.fillStyle = 'rgba(230, 230, 245, 0.72)';
        fCtx.font = '600 28px monospace';
        fCtx.letterSpacing = '5px';
        fCtx.fillText('••••  ••••  ••••  4821', 64, 445);

        // Cardholder verification label below PAN
        fCtx.fillStyle = 'rgba(164, 164, 185, 0.5)';
        fCtx.font = '14px monospace';
        fCtx.letterSpacing = '2px';
        fCtx.fillText('CREDENTIAL TARGET: 4821-CORROBORATED', 64, 525);

        // [D] Neutral Card Network Mark in Bottom-Right Corner (Generic overlapping rings/waves, not Visa/MC)
        // Ring 1 (Indigo tone)
        fCtx.strokeStyle = 'rgba(165, 180, 252, 0.55)';
        fCtx.fillStyle = 'rgba(99, 102, 241, 0.22)';
        fCtx.lineWidth = 3;
        fCtx.beginPath();
        fCtx.arc(875, 510, 30, 0, Math.PI * 2);
        fCtx.fill();
        fCtx.stroke();

        // Ring 2 (Complementary translucent ring overlapping)
        fCtx.strokeStyle = 'rgba(199, 210, 254, 0.5)';
        fCtx.fillStyle = 'rgba(129, 140, 248, 0.18)';
        fCtx.beginPath();
        fCtx.arc(915, 510, 30, 0, Math.PI * 2);
        fCtx.fill();
        fCtx.stroke();

        // Wave accent line inside mark
        fCtx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
        fCtx.lineWidth = 2;
        fCtx.beginPath();
        fCtx.moveTo(860, 510);
        fCtx.lineTo(930, 510);
        fCtx.stroke();
      }

      const faceTexture = new THREE.CanvasTexture(faceCanvas);
      faceTexture.generateMipmaps = true;
      disposables.push(faceTexture);

      const cardMat = new THREE.MeshStandardMaterial({
        color: 0x181822,
        map: faceTexture,
        roughness: 0.36,
        metalness: 0.64,
      });
      disposables.push(cardMat);

      const cardMesh = new THREE.Mesh(cardGeo, cardMat);
      cardGroup.add(cardMesh);

      // 7. EMV Chip: Rectangular element positioned above masked number with pulsing indigo glow
      const chipWidth = 0.54;
      const chipHeight = 0.42;
      const chipRadius = 0.04;

      const chipShape = new THREE.Shape();
      const chX = -chipWidth / 2;
      const chY = -chipHeight / 2;
      chipShape.moveTo(chX + chipRadius, chY);
      chipShape.lineTo(chX + chipWidth - chipRadius, chY);
      chipShape.quadraticCurveTo(chX + chipWidth, chY, chX + chipWidth, chY + chipRadius);
      chipShape.lineTo(chX + chipWidth, chY + chipHeight - chipRadius);
      chipShape.quadraticCurveTo(chX + chipWidth, chY + chipHeight, chX + chipWidth - chipRadius, chY + chipHeight);
      chipShape.lineTo(chX + chipRadius, chY + chipHeight);
      chipShape.quadraticCurveTo(chX, chY + chipHeight, chX, chY + chipHeight - chipRadius);
      chipShape.lineTo(chX, chY + chipRadius);
      chipShape.quadraticCurveTo(chX, chY, chX + chipRadius, chY);

      const chipGeo = new THREE.ExtrudeGeometry(chipShape, {
        depth: 0.02,
        bevelEnabled: true,
        bevelSegments: 2,
        steps: 1,
        bevelSize: 0.01,
        bevelThickness: 0.01,
      });
      chipGeo.center();
      disposables.push(chipGeo);

      // Chip contact texture
      const chipCanvas = document.createElement('canvas');
      chipCanvas.width = 256;
      chipCanvas.height = 200;
      const cCtx = chipCanvas.getContext('2d');
      if (cCtx) {
        cCtx.fillStyle = '#22222E';
        cCtx.fillRect(0, 0, 256, 200);

        cCtx.strokeStyle = 'rgba(165, 180, 252, 0.4)';
        cCtx.lineWidth = 3;
        cCtx.strokeRect(8, 8, 240, 184);

        cCtx.beginPath();
        cCtx.moveTo(85, 8);
        cCtx.lineTo(85, 192);
        cCtx.moveTo(170, 8);
        cCtx.lineTo(170, 192);
        cCtx.moveTo(8, 100);
        cCtx.lineTo(248, 100);
        cCtx.stroke();

        cCtx.fillStyle = 'rgba(99, 102, 241, 0.25)';
        cCtx.fillRect(86, 60, 84, 80);
      }
      const chipTexture = new THREE.CanvasTexture(chipCanvas);
      disposables.push(chipTexture);

      const chipMat = new THREE.MeshStandardMaterial({
        color: 0x2A2A3A,
        map: chipTexture,
        roughness: 0.25,
        metalness: 0.85,
        emissive: new THREE.Color(0x6366f1),
        emissiveIntensity: 0.5,
      });
      disposables.push(chipMat);

      const chipMesh = new THREE.Mesh(chipGeo, chipMat);
      chipMesh.position.set(-0.85, 0.12, 0.042);
      cardGroup.add(chipMesh);

      // 8. Scanning Line: Horizontal laser beam sweeping top-to-bottom
      const scanBeamGeo = new THREE.PlaneGeometry(3.3, 0.28);
      disposables.push(scanBeamGeo);

      const beamCanvas = document.createElement('canvas');
      beamCanvas.width = 16;
      beamCanvas.height = 256;
      const bCtx = beamCanvas.getContext('2d');
      if (bCtx) {
        const bGrad = bCtx.createLinearGradient(0, 0, 0, 256);
        bGrad.addColorStop(0, 'rgba(99, 102, 241, 0)');
        bGrad.addColorStop(0.35, 'rgba(99, 102, 241, 0.2)');
        bGrad.addColorStop(0.48, 'rgba(99, 102, 241, 0.7)');
        bGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.98)');
        bGrad.addColorStop(0.52, 'rgba(99, 102, 241, 0.7)');
        bGrad.addColorStop(0.65, 'rgba(99, 102, 241, 0.2)');
        bGrad.addColorStop(1, 'rgba(99, 102, 241, 0)');
        bCtx.fillStyle = bGrad;
        bCtx.fillRect(0, 0, 16, 256);
      }
      const beamTexture = new THREE.CanvasTexture(beamCanvas);
      disposables.push(beamTexture);

      const scanBeamMat = new THREE.MeshBasicMaterial({
        map: beamTexture,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        opacity: 0.85,
      });
      disposables.push(scanBeamMat);

      const scanBeamMesh = new THREE.Mesh(scanBeamGeo, scanBeamMat);
      scanBeamMesh.position.set(0, 0.95, 0.052);
      cardGroup.add(scanBeamMesh);

      const scanLight = new THREE.PointLight(0x6366f1, 1.2, 2.5);
      scanLight.position.set(0, 0.95, 0.15);
      cardGroup.add(scanLight);

      // 9. Verification Checkmark Micro-Moment
      const checkCanvas = document.createElement('canvas');
      checkCanvas.width = 128;
      checkCanvas.height = 128;
      const ckCtx = checkCanvas.getContext('2d');
      if (ckCtx) {
        const radGrad = ckCtx.createRadialGradient(64, 64, 10, 64, 64, 60);
        radGrad.addColorStop(0, 'rgba(99, 102, 241, 0.9)');
        radGrad.addColorStop(0.5, 'rgba(99, 102, 241, 0.4)');
        radGrad.addColorStop(1, 'rgba(99, 102, 241, 0)');
        ckCtx.fillStyle = radGrad;
        ckCtx.fillRect(0, 0, 128, 128);

        ckCtx.strokeStyle = '#818CF8';
        ckCtx.lineWidth = 4;
        ckCtx.beginPath();
        ckCtx.arc(64, 64, 38, 0, Math.PI * 2);
        ckCtx.stroke();

        ckCtx.strokeStyle = '#FFFFFF';
        ckCtx.lineWidth = 6;
        ckCtx.lineCap = 'round';
        ckCtx.lineJoin = 'round';
        ckCtx.beginPath();
        ckCtx.moveTo(46, 64);
        ckCtx.lineTo(58, 76);
        ckCtx.lineTo(82, 50);
        ckCtx.stroke();
      }
      const checkTexture = new THREE.CanvasTexture(checkCanvas);
      disposables.push(checkTexture);

      const checkSpriteMat = new THREE.SpriteMaterial({
        map: checkTexture,
        transparent: true,
        blending: THREE.AdditiveBlending,
        opacity: 0,
        depthWrite: false,
      });
      disposables.push(checkSpriteMat);

      const checkSprite = new THREE.Sprite(checkSpriteMat);
      checkSprite.position.set(-0.85, 0.12, 0.08);
      checkSprite.scale.set(0.65, 0.65, 1);
      cardGroup.add(checkSprite);

      // 10. Corroboration Signal Particles
      const particleCount = 65;
      const particleGeo = new THREE.BufferGeometry();
      const posArray = new Float32Array(particleCount * 3);

      for (let i = 0; i < particleCount; i++) {
        posArray[i * 3 + 0] = (Math.random() - 0.5) * 5.4;
        posArray[i * 3 + 1] = (Math.random() - 0.5) * 3.6;
        posArray[i * 3 + 2] = -0.25 - Math.random() * 1.2;
      }
      particleGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
      disposables.push(particleGeo);

      const pCanvas = document.createElement('canvas');
      pCanvas.width = 64;
      pCanvas.height = 64;
      const pCtx = pCanvas.getContext('2d');
      if (pCtx) {
        const pGrad = pCtx.createRadialGradient(32, 32, 2, 32, 32, 30);
        pGrad.addColorStop(0, 'rgba(165, 180, 252, 0.95)');
        pGrad.addColorStop(0.3, 'rgba(99, 102, 241, 0.5)');
        pGrad.addColorStop(1, 'rgba(99, 102, 241, 0)');
        pCtx.fillStyle = pGrad;
        pCtx.fillRect(0, 0, 64, 64);
      }
      const particleTexture = new THREE.CanvasTexture(pCanvas);
      disposables.push(particleTexture);

      const particleMat = new THREE.PointsMaterial({
        map: particleTexture,
        color: 0x6366f1,
        size: 0.09,
        transparent: true,
        opacity: 0.35,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      disposables.push(particleMat);

      const particlePoints = new THREE.Points(particleGeo, particleMat);
      scene.add(particlePoints);

      // Base card orientation
      const baseRotY = -0.16;
      const baseRotX = 0.12;
      const baseRotZ = 0.02;
      cardGroup.rotation.set(baseRotX, baseRotY, baseRotZ);

      // CURSOR-FOLLOW PHYSICS: Soft-lag spring tracking across the intro section
      let mouseX = 0;
      let mouseY = 0;
      let isHovering = false;

      // Position physics variables
      let currentFollowX = 0;
      let currentFollowY = 0;
      let followVelX = 0;
      let followVelY = 0;

      // Rotation physics variables
      let currentRotX = baseRotX;
      let currentRotY = baseRotY;
      let currentRotZ = baseRotZ;
      let rotVelX = 0;
      let rotVelY = 0;
      let rotVelZ = 0;

      // Determine hover tracking boundary element (intro section or hero container)
      const trackingTarget =
        (containerElementId ? document.getElementById(containerElementId) : null) || container;

      const handleMouseMove = (e: MouseEvent) => {
        const rect = trackingTarget.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
          const ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
          mouseX = Math.max(-1, Math.min(1, nx));
          mouseY = Math.max(-1, Math.min(1, ny));
          isHovering = true;
        }
      };

      const handleMouseLeave = () => {
        isHovering = false;
        mouseX = 0;
        mouseY = 0;
      };

      trackingTarget.addEventListener('mousemove', handleMouseMove);
      trackingTarget.addEventListener('mouseleave', handleMouseLeave);

      // Page Visibility handling
      let isTabActive = !document.hidden;
      const handleVisibilityChange = () => {
        isTabActive = !document.hidden;
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);

      // Resize observer
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const w = entry.contentRect.width;
          const h = 210;
          if (w > 0 && h > 0 && renderer && camera) {
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
          }
        }
      });
      resizeObserver.observe(container);

      // Animation variables
      const scanCycleDuration = 3200;
      let checkmarkAnimStartTime = -1;

      setIsReady(true);

      // Render Loop
      const render = (time: number) => {
        if (isDestroyed) return;

        if (isTabActive && renderer && scene && camera) {
          if (!prefersReducedMotion) {
            const sec = time * 0.001;

            // 1. CURSOR-FOLLOW TRANSLATION (Bounded to subtle drift: ~30px range)
            const targetPosX = isHovering ? mouseX * 0.38 : 0;
            const targetPosY = isHovering ? mouseY * 0.26 : 0;

            const springK = 0.048;
            const damping = 0.82;

            const forceX = (targetPosX - currentFollowX) * springK;
            const forceY = (targetPosY - currentFollowY) * springK;
            followVelX = (followVelX + forceX) * damping;
            followVelY = (followVelY + forceY) * damping;
            currentFollowX += followVelX;
            currentFollowY += followVelY;

            // 2. CURSOR-FOLLOW ROTATION (Leans toward cursor with soft damping)
            const targetRotX = isHovering ? baseRotX - mouseY * 0.2 : baseRotX;
            const targetRotY = isHovering ? baseRotY + mouseX * 0.26 : baseRotY;
            const targetRotZ = isHovering ? baseRotZ - mouseX * 0.04 : baseRotZ;

            const rotSpringK = 0.055;
            const rotDamping = 0.82;

            const rfX = (targetRotX - currentRotX) * rotSpringK;
            const rfY = (targetRotY - currentRotY) * rotSpringK;
            const rfZ = (targetRotZ - currentRotZ) * rotSpringK;
            rotVelX = (rotVelX + rfX) * rotDamping;
            rotVelY = (rotVelY + rfY) * rotDamping;
            rotVelZ = (rotVelZ + rfZ) * rotDamping;
            currentRotX += rotVelX;
            currentRotY += rotVelY;
            currentRotZ += rotVelZ;

            // 3. Superimposed Ambient Float (bob and yaw oscillation)
            const ambientBob = Math.sin(sec * 1.4) * 0.055;
            const ambientYaw = Math.sin(sec * 0.8) * 0.04;

            cardGroup.position.x = currentFollowX;
            cardGroup.position.y = currentFollowY + ambientBob;

            cardGroup.rotation.x = currentRotX;
            cardGroup.rotation.y = currentRotY + ambientYaw;
            cardGroup.rotation.z = currentRotZ;

            // 4. EMV Chip Slow Pulsing Glow
            const chipPulse = 0.45 + (Math.sin(sec * 2.2) * 0.5 + 0.5) * 0.55;
            chipMat.emissiveIntensity = chipPulse;

            // 5. Scanning Line Sweep (top to bottom)
            const cycleProgress = (time % scanCycleDuration) / scanCycleDuration;
            const topY = 1.05;
            const bottomY = -1.05;
            const currentScanY = topY - cycleProgress * (topY - bottomY);
            scanBeamMesh.position.y = currentScanY;
            scanLight.position.y = currentScanY;

            let scanAlpha = 0.9;
            if (cycleProgress < 0.08) {
              scanAlpha = cycleProgress / 0.08;
            } else if (cycleProgress > 0.88) {
              scanAlpha = (1 - cycleProgress) / 0.12;
            }
            scanBeamMat.opacity = Math.max(0, scanAlpha * 0.85);

            // 6. Verification Checkmark Micro-Moment
            if (cycleProgress >= 0.94 && checkmarkAnimStartTime === -1) {
              checkmarkAnimStartTime = time;
              setIsVerifiedBeat(true);
            }

            if (checkmarkAnimStartTime > 0) {
              const checkElapsed = time - checkmarkAnimStartTime;
              const checkDuration = 750;
              const checkProgress = checkElapsed / checkDuration;

              if (checkProgress >= 1) {
                checkmarkAnimStartTime = -1;
                checkSpriteMat.opacity = 0;
                setIsVerifiedBeat(false);
              } else {
                const scale = 0.65 + Math.sin(checkProgress * Math.PI) * 0.2;
                checkSprite.scale.set(scale, scale, 1);

                const alpha = Math.sin(checkProgress * Math.PI) * 0.95;
                checkSpriteMat.opacity = alpha;

                chipMat.emissiveIntensity = chipPulse + alpha * 1.0;
              }
            }

            // 7. Particle field subtle wave drift
            const positions = particleGeo.attributes.position.array as Float32Array;
            for (let i = 0; i < particleCount; i++) {
              positions[i * 3 + 1] += Math.sin(sec * 0.6 + i) * 0.0006;
            }
            particleGeo.attributes.position.needsUpdate = true;
          } else {
            // Reduced motion: static resting card, no follow or bob
            cardGroup.position.set(0, 0, 0);
            cardGroup.rotation.set(baseRotX, baseRotY, baseRotZ);
            chipMat.emissiveIntensity = 0.5;
            scanBeamMat.opacity = 0;
            checkSpriteMat.opacity = 0;
          }

          renderer.render(scene, camera);
        }

        animationFrameId = requestAnimationFrame(render);
      };

      animationFrameId = requestAnimationFrame(render);

      // Cleanup
      return () => {
        isDestroyed = true;
        cancelAnimationFrame(animationFrameId);
        clearTimeout(timer);
        trackingTarget.removeEventListener('mousemove', handleMouseMove);
        trackingTarget.removeEventListener('mouseleave', handleMouseLeave);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        resizeObserver.disconnect();

        for (const item of disposables) {
          try {
            item.dispose();
          } catch {
            // safe dispose
          }
        }
        if (renderer) {
          renderer.dispose();
          renderer.forceContextLoss();
        }
      };
    }, 40);

    return () => {
      isDestroyed = true;
      clearTimeout(timer);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [propReducedMotion, containerElementId]);

  return (
    <div
      ref={containerRef}
      className={`relative flex flex-col items-center select-none ${className}`}
      style={{
        width: '100%',
        maxWidth: '380px',
      }}
      aria-label="3D Stylized Credit Card with Real-Time Verification Telemetry"
    >
      {/* 3. TYPEWRITER TEXT ANIMATION (Top of card zone, animating downward) */}
      <div className="w-full px-2 mb-1 min-h-[46px] flex flex-col justify-center">
        {/* Line 1: types out first near top */}
        <div className="flex items-center text-xs font-mono font-medium text-[#818CF8] tracking-wide">
          <span>{displayedLine1}</span>
          {activeTypingLine === 1 && (
            <span className="inline-block w-[1.5px] h-[13px] bg-[#818CF8] ml-1 animate-pulse" />
          )}
        </div>

        {/* Line 2: types out just below once Line 1 completes */}
        <div className="flex items-center text-xs sm:text-[13px] font-sans text-[#D4D4E6]/85 font-normal leading-snug mt-0.5">
          <span>{displayedLine2}</span>
          {activeTypingLine === 2 && (
            <span className="inline-block w-[1.5px] h-[14px] bg-[#818CF8] ml-1 animate-pulse" />
          )}
        </div>
      </div>

      {/* 3D Canvas Container */}
      <div className="relative w-full h-[210px] flex items-center justify-center">
        {/* Three.js Canvas (Transparent, seamlessly floating) */}
        <canvas
          ref={canvasRef}
          className={`w-full h-full block transition-opacity duration-700 pointer-events-auto cursor-grab active:cursor-grabbing ${
            isReady ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Static Fallback / Skeleton Silhouette until Three.js scene initializes */}
        {!isReady && (
          <div
            aria-hidden="true"
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <div className="w-[260px] h-[155px] rounded-xl bg-[#14141A] border border-[#262638] p-4 shadow-xl flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="w-16 h-3 rounded bg-[#232332]" />
                <div className="w-6 h-6 rounded-full border border-[#6366F1]/30 bg-[#6366F1]/10" />
              </div>
              <div className="w-8 h-6 rounded bg-[#6366F1]/25 border border-[#6366F1]/40" />
              <div className="w-32 h-2.5 rounded bg-[#232332]" />
            </div>
          </div>
        )}
      </div>

      {/* Subtle Micro-Telemetry Status Pill */}
      <div className="mt-1 flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#101015]/80 backdrop-blur-md border border-[#22222E] text-[11px] font-mono text-[#A5B4FC] shadow-sm pointer-events-none transition-colors">
        <span className="relative flex h-2 w-2">
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-[#6366F1] opacity-75 ${
              isVerifiedBeat ? 'scale-150 duration-300' : ''
            }`}
          />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#6366F1]" />
        </span>
        <span className="text-[#C5C5D8] font-medium">Real-Time Verification</span>
        <span className="text-[#64647A]">•</span>
        <span className="flex items-center gap-1 text-[#818CF8]">
          <ShieldCheck className="w-3 h-3 text-[#818CF8]" />
          <span>Active</span>
        </span>
      </div>
    </div>
  );
};
