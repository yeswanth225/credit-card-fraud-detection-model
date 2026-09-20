import React, { useEffect, useRef, useState } from 'react';

interface Node3D {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  baseRadius: number;
}

interface ProjectedNode {
  screenX: number;
  screenY: number;
  scale: number;
  alpha: number;
  radius: number;
}

interface Edge {
  source: number;
  target: number;
  distance: number;
}

interface Pulse {
  sourceIndex: number;
  targetIndex: number;
  startTime: number;
  duration: number; // in ms
}

interface NetworkMeshBackgroundProps {
  reducedMotion?: boolean;
  className?: string;
}

/**
 * Ambient 3D network mesh background with sparse nodes and occasional traveling light pulses.
 * Designed to feel like real-time transactions propagating across a verification network.
 */
export const NetworkMeshBackground: React.FC<NetworkMeshBackgroundProps> = ({
  reducedMotion: propReducedMotion,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Detect prefers-reduced-motion if not explicitly passed as prop
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const prefersReducedMotion = propReducedMotion ?? mediaQuery.matches;

    // Lazy initialization after login form mounts and becomes interactive
    let animationFrameId: number;
    let isDestroyed = false;

    const initTimer = setTimeout(() => {
      if (isDestroyed) return;
      setIsReady(true);

      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d', { alpha: true });
      if (!ctx) return;

      let width = (canvas.width = window.innerWidth);
      let height = (canvas.height = window.innerHeight);

      // Handle retina displays cleanly, capped at DPR 2 for optimal battery/GPU
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const resizeCanvas = () => {
        if (!canvas) return;
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      };
      resizeCanvas();

      // Viewport-based sparse node count (40 to 65 nodes)
      const targetNodeCount = Math.min(65, Math.max(42, Math.floor((width * height) / 28000)));

      // Initialize 3D nodes scattered in depth
      const nodes: Node3D[] = [];
      const depthRange = 320;

      for (let i = 0; i < targetNodeCount; i++) {
        // Slow subtle drift speeds (barely perceptible)
        const speed = prefersReducedMotion ? 0 : 0.08 + Math.random() * 0.12;
        const angle = Math.random() * Math.PI * 2;
        const zAngle = (Math.random() - 0.5) * Math.PI;

        nodes.push({
          x: (Math.random() - 0.5) * (width * 1.05),
          y: (Math.random() - 0.5) * (height * 1.05),
          z: (Math.random() - 0.5) * depthRange,
          vx: Math.cos(angle) * Math.cos(zAngle) * speed,
          vy: Math.sin(angle) * Math.cos(zAngle) * speed,
          vz: Math.sin(zAngle) * speed * 0.5,
          baseRadius: 1.6 + Math.random() * 0.8,
        });
      }

      // Camera projection parameters
      const focalLength = 580;
      const maxEdgeDistance = Math.min(185, Math.max(130, Math.sqrt(width * height) * 0.15));

      // Light pulse state
      let activePulse: Pulse | null = null;
      let nextPulseScheduledTime = performance.now() + 1500; // First pulse after ~1.5s

      // Track tab visibility to pause loop and save 100% CPU when hidden
      let isTabActive = !document.hidden;
      const handleVisibilityChange = () => {
        isTabActive = !document.hidden;
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);

      // Render loop
      let lastTimestamp = performance.now();

      const render = (now: number) => {
        if (isDestroyed) return;

        // Skip render if tab is in background
        if (!isTabActive) {
          lastTimestamp = now;
          animationFrameId = requestAnimationFrame(render);
          return;
        }

        const delta = Math.min((now - lastTimestamp) / 1000, 0.1); // clamp delta
        lastTimestamp = now;

        ctx.clearRect(0, 0, width, height);

        const halfW = width / 2;
        const halfH = height / 2;

        // 1. Update node positions (if not reduced motion)
        if (!prefersReducedMotion) {
          const boundX = halfW * 1.1;
          const boundY = halfH * 1.1;
          const boundZ = depthRange / 2;

          for (let i = 0; i < nodes.length; i++) {
            const n = nodes[i];
            n.x += n.vx;
            n.y += n.vy;
            n.z += n.vz;

            // Soft bounce off boundaries
            if (n.x < -boundX) {
              n.x = -boundX;
              n.vx *= -1;
            } else if (n.x > boundX) {
              n.x = boundX;
              n.vx *= -1;
            }

            if (n.y < -boundY) {
              n.y = -boundY;
              n.vy *= -1;
            } else if (n.y > boundY) {
              n.y = boundY;
              n.vy *= -1;
            }

            if (n.z < -boundZ) {
              n.z = -boundZ;
              n.vz *= -1;
            } else if (n.z > boundZ) {
              n.z = boundZ;
              n.vz *= -1;
            }
          }
        }

        // 2. Project nodes to 2D screen coordinates
        const projected: ProjectedNode[] = new Array(nodes.length);
        for (let i = 0; i < nodes.length; i++) {
          const n = nodes[i];
          const scale = focalLength / (focalLength + n.z);
          const screenX = halfW + n.x * scale;
          const screenY = halfH + n.y * scale;

          // Depth-based opacity: nodes closer to viewer have slightly higher alpha (0.16 - 0.22)
          const depthNorm = (n.z + depthRange / 2) / depthRange; // 0 (near) to 1 (far)
          const alpha = 0.14 + (1 - depthNorm) * 0.08;
          const radius = n.baseRadius * scale;

          projected[i] = {
            screenX,
            screenY,
            scale,
            alpha,
            radius,
          };
        }

        // 3. Build proximity connections (organic mesh, max 3 closest neighbors per node)
        const edges: Edge[] = [];
        const neighborMap: Map<number, Set<number>> = new Map();

        for (let i = 0; i < nodes.length; i++) {
          const p1 = projected[i];
          const candidates: { target: number; dist: number }[] = [];

          for (let j = i + 1; j < nodes.length; j++) {
            const p2 = projected[j];
            const dx = p1.screenX - p2.screenX;
            const dy = p1.screenY - p2.screenY;
            const dist = Math.hypot(dx, dy);

            if (dist < maxEdgeDistance) {
              candidates.push({ target: j, dist });
            }
          }

          // Sort by distance to keep only the closest links (sparse & uncluttered)
          candidates.sort((a, b) => a.dist - b.dist);
          const linksToKeep = candidates.slice(0, 3);

          for (const link of linksToKeep) {
            edges.push({
              source: i,
              target: link.target,
              distance: link.dist,
            });
            if (!neighborMap.has(i)) neighborMap.set(i, new Set());
            neighborMap.get(i)!.add(link.target);
          }
        }

        // 4. Draw connection lines (low opacity muted indigo: ~8-10%)
        ctx.lineWidth = 0.8;
        for (let e = 0; e < edges.length; e++) {
          const edge = edges[e];
          const p1 = projected[edge.source];
          const p2 = projected[edge.target];

          // Fade lines based on distance and average depth
          const distFactor = 1 - edge.distance / maxEdgeDistance;
          const edgeAlpha = Math.max(0.02, distFactor * 0.09);

          ctx.strokeStyle = `rgba(99, 102, 241, ${edgeAlpha})`;
          ctx.beginPath();
          ctx.moveTo(p1.screenX, p1.screenY);
          ctx.lineTo(p2.screenX, p2.screenY);
          ctx.stroke();
        }

        // 5. Draw nodes (muted indigo, small radius, ~15-20% opacity)
        for (let i = 0; i < projected.length; i++) {
          const p = projected[i];
          ctx.fillStyle = `rgba(99, 102, 241, ${p.alpha})`;
          ctx.beginPath();
          ctx.arc(p.screenX, p.screenY, Math.max(1, p.radius), 0, Math.PI * 2);
          ctx.fill();
        }

        // 6. Traveling light pulse (simulating a verification signal along one line)
        if (!prefersReducedMotion && edges.length > 0) {
          // Check if we should launch a new pulse
          if (!activePulse && now >= nextPulseScheduledTime) {
            const randomEdge = edges[Math.floor(Math.random() * edges.length)];
            activePulse = {
              sourceIndex: randomEdge.source,
              targetIndex: randomEdge.target,
              startTime: now,
              duration: 1600 + Math.random() * 400, // 1.6 to 2.0 seconds
            };
          }

          if (activePulse) {
            const elapsed = now - activePulse.startTime;
            const progress = elapsed / activePulse.duration;

            if (progress >= 1) {
              // Pulse finished; schedule next pulse in 2.0 to 4.0 seconds
              activePulse = null;
              nextPulseScheduledTime = now + 2000 + Math.random() * 2000;
            } else {
              const p1 = projected[activePulse.sourceIndex];
              const p2 = projected[activePulse.targetIndex];

              if (p1 && p2) {
                // Linear position along connection line
                const pulseX = p1.screenX + (p2.screenX - p1.screenX) * progress;
                const pulseY = p1.screenY + (p2.screenY - p1.screenY) * progress;

                // Smooth bell curve envelope for alpha: fades in at start, fades out at destination
                const envelope = Math.sin(progress * Math.PI);
                const pulseAlpha = envelope * 0.85;

                // Draw subtle trailing trace along the active line
                const trailProgress = Math.max(0, progress - 0.15);
                const trailX = p1.screenX + (p2.screenX - p1.screenX) * trailProgress;
                const trailY = p1.screenY + (p2.screenY - p1.screenY) * trailProgress;

                ctx.strokeStyle = `rgba(165, 180, 252, ${envelope * 0.25})`;
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                ctx.moveTo(trailX, trailY);
                ctx.lineTo(pulseX, pulseY);
                ctx.stroke();

                // Outer soft indigo glow
                const glowGrad = ctx.createRadialGradient(
                  pulseX,
                  pulseY,
                  0,
                  pulseX,
                  pulseY,
                  8
                );
                glowGrad.addColorStop(0, `rgba(165, 180, 252, ${pulseAlpha * 0.6})`);
                glowGrad.addColorStop(0.4, `rgba(99, 102, 241, ${pulseAlpha * 0.3})`);
                glowGrad.addColorStop(1, 'rgba(99, 102, 241, 0)');

                ctx.fillStyle = glowGrad;
                ctx.beginPath();
                ctx.arc(pulseX, pulseY, 8, 0, Math.PI * 2);
                ctx.fill();

                // Inner bright signal core (white-indigo)
                ctx.fillStyle = `rgba(255, 255, 255, ${pulseAlpha * 0.95})`;
                ctx.beginPath();
                ctx.arc(pulseX, pulseY, 1.8, 0, Math.PI * 2);
                ctx.fill();
              }
            }
          }
        }

        // If reduced motion, we only need to render once
        if (!prefersReducedMotion) {
          animationFrameId = requestAnimationFrame(render);
        }
      };

      // Start render loop
      animationFrameId = requestAnimationFrame(render);

      // Handle window resize with debouncing
      let resizeTimer: number;
      const onResize = () => {
        clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(() => {
          resizeCanvas();
          if (prefersReducedMotion) {
            render(performance.now());
          }
        }, 150);
      };
      window.addEventListener('resize', onResize);

      // Cleanup
      return () => {
        isDestroyed = true;
        cancelAnimationFrame(animationFrameId);
        window.removeEventListener('resize', onResize);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        clearTimeout(resizeTimer);
      };
    }, 60); // 60ms deferral allows DOM & login form to mount cleanly first

    return () => {
      isDestroyed = true;
      clearTimeout(initTimer);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [propReducedMotion]);

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 pointer-events-none select-none overflow-hidden bg-[#0A0A0B] ${className}`}
      style={{ zIndex: 0 }}
    >
      <canvas
        ref={canvasRef}
        className={`w-full h-full block transition-opacity duration-700 ${
          isReady ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
};
