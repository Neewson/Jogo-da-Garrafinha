import React, { useEffect, useRef, useState } from "react";
import { BottleID, BottleConfig, PhysicsSettings, GameStats, PlatformConfig } from "../types";
import { BOTTLE_PRESETS, SCENERY_PRESETS } from "../constants";
import { 
  playBounceSound, 
  playFailSound, 
  playGlassShatterSound, 
  playLandSuccessSound, 
  playThrowSound 
} from "../utils/audio";

interface GameCanvasProps {
  currentBottleId: BottleID;
  customBottleConfig: BottleConfig;
  physicsSettings: PhysicsSettings;
  currentSceneryId: string;
  stats: GameStats;
  onUpdateStats: (newStats: Partial<GameStats>) => void;
  onUnlockAchievement: (id: string) => void;
  selectedSpinSetting: number;
  setSelectedSpinSetting: (val: number) => void;
  manualForceMult: number;
  setManualForceMult: (val: number) => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
  angle?: number;
  angularV?: number;
  shape?: "circle" | "square" | "shard";
}

export default function GameCanvas({
  currentBottleId,
  customBottleConfig,
  physicsSettings,
  currentSceneryId,
  stats,
  onUpdateStats,
  onUnlockAchievement,
  selectedSpinSetting,
  setSelectedSpinSetting,
  manualForceMult,
  setManualForceMult,
}: GameCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Get current active preset objects
  const bottleConfig = customBottleConfig;
  const scenery = SCENERY_PRESETS.find(s => s.id === currentSceneryId) || SCENERY_PRESETS[0];

  // Game state
  const [gameStateLabel, setGameStateLabel] = useState<string>("Deslize para cima para lançar!");
  const [gameStateColor, setGameStateColor] = useState<string>("text-slate-400");
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 800, height: 500 });
  const [isCurrentlyDragging, setIsCurrentlyDragging] = useState<boolean>(false);

  // Physics simulation references (so they don't trigger constant React re-renders)
  const bottleRef = useRef({
    x: 400,
    y: 400,
    vx: 0,
    vy: 0,
    theta: 0, // rotation in radians
    omega: 0, // angular velocity (rad/s)
    isDragging: false,
    hasBeenThrown: false,
    shattered: false,
    restTimer: 0, // time spent at very low speed
    lastSoundTime: 0,
    maxHeight: 0,
    spinsCounted: 0,
    accumulatedRotation: 0, // tracking if flip was done
    prevTheta: 0,
  });

  const pointerRef = useRef({
    isDown: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    history: [] as { x: number; y: number; t: number }[],
  });

  const particlesRef = useRef<Particle[]>([]);

  // Spawn confetti particles on successful land
  const spawnCelebration = (x: number, y: number) => {
    const colors = ["#f59e0b", "#10b981", "#3b82f6", "#ec4899", "#8b5cf6", "#14b8a6"];
    for (let i = 0; i < 60; i++) {
      particlesRef.current.push({
        x: x + (Math.random() * 40 - 20),
        y: y + (Math.random() * 25 - 20),
        vx: (Math.random() - 0.5) * 400,
        vy: -Math.random() * 500 - 150,
        size: Math.random() * 6 + 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1.0,
        decay: Math.random() * 0.015 + 0.01,
        angle: Math.random() * Math.PI,
        angularV: (Math.random() - 0.5) * 8,
        shape: "square",
      });
    }
  };

  // Spawn smoke ring when throwing
  const spawnSmokeTrail = (x: number, y: number) => {
    for (let i = 0; i < 5; i++) {
      particlesRef.current.push({
        x: x + (Math.random() * 10 - 5),
        y: y + (Math.random() * 10 - 5),
        vx: (Math.random() - 0.5) * 30,
        vy: (Math.random() - 0.5) * 30,
        size: Math.random() * 12 + 8,
        color: "rgba(226, 232, 240, 0.45)",
        alpha: 0.6,
        decay: 0.03,
        shape: "circle",
      });
    }
  };

  // Spawn liquid splash dynamic droplets on bounce
  const spawnSplash = (x: number, y: number, color: string, count = 8) => {
    for (let i = 0; i < count; i++) {
      particlesRef.current.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 200,
        vy: -Math.random() * 150 - 50,
        size: Math.random() * 3 + 3,
        color,
        alpha: 0.8,
        decay: 0.04,
        shape: "circle",
      });
    }
  };

  // Spawn glass shards on shatter fail
  const spawnGlassShatter = (x: number, y: number) => {
    for (let i = 0; i < 35; i++) {
      particlesRef.current.push({
        x: x + (Math.random() * 30 - 15),
        y: y + (Math.random() * 60 - 30),
        vx: (Math.random() - 0.5) * 500,
        vy: -Math.random() * 400 - 100,
        size: Math.random() * 5 + 4,
        color: "rgba(209, 213, 219, 0.75)",
        alpha: 0.9,
        decay: 0.02,
        angle: Math.random() * Math.PI,
        angularV: (Math.random() - 0.5) * 15,
        shape: "shard",
      });
    }
  };

  // Reset bottle to default position
  const resetBottlePosition = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const groundY = canvas.height - 40;
    const body = bottleRef.current;

    body.x = 200 + Math.random() * 50; // Place on the left
    body.y = groundY - bottleConfig.height / 2;
    body.vx = 0;
    body.vy = 0;
    body.theta = 0;
    body.omega = 0;
    body.isDragging = false;
    setIsCurrentlyDragging(false);
    body.hasBeenThrown = false;
    body.shattered = false;
    body.restTimer = 0;
    body.maxHeight = 0;
    body.spinsCounted = 0;
    body.accumulatedRotation = 0;
    body.prevTheta = 0;

    setGameStateLabel("Pronto para lançar! Arraste e jogue!");
    setGameStateColor("text-slate-400");
  };

  // Auto-resize canvas
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      setCanvasDimensions({ width: w, height: h });
      
      // Relocate bottle if it spawns or resets during resize
      const body = bottleRef.current;
      if (!body.hasBeenThrown || body.y > h) {
        body.x = w * 0.25;
        body.y = h - 40 - bottleConfig.height / 2;
        body.vx = 0;
        body.vy = 0;
        body.theta = 0;
        body.omega = 0;
      }
    };

    const observer = new ResizeObserver(() => handleResize());
    observer.observe(container);
    handleResize();

    return () => observer.disconnect();
  }, [currentBottleId, customBottleConfig]);

  // Initial and subsequent position updates on bottle change
  useEffect(() => {
    resetBottlePosition();
  }, [currentBottleId, currentSceneryId, customBottleConfig]);

  // Handle pointer interactions (mouse / touch)
  const getPointerPos = (e: React.MouseEvent | React.TouchEvent | TouchEvent | MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ("touches" in e) {
      if (e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else if (e.changedTouches.length > 0) {
        clientX = e.changedTouches[0].clientX;
        clientY = e.changedTouches[0].clientY;
      }
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const handlePointerDown = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const body = bottleRef.current;
    
    // Auto-spawn if currently shattered
    if (body.shattered) {
      resetBottlePosition();
      return;
    }

    const pos = getPointerPos(e);
    const groundY = canvasDimensions.height - 40;

    // We allow grabbing from literally ANY point on the screen (the bottle snaps to the finger/mouse)
    body.isDragging = true;
    setIsCurrentlyDragging(true);
    body.x = pos.x;
    body.y = Math.min(pos.y, groundY - bottleConfig.height / 2);
    body.vx = 0;
    body.vy = 0;
    body.omega = 0;
    body.hasBeenThrown = false;
    body.prevTheta = body.theta;
    body.accumulatedRotation = 0;
    body.spinsCounted = 0;

    const pointer = pointerRef.current;
    pointer.isDown = true;
    pointer.startX = pos.x;
    pointer.startY = pos.y;
    pointer.currentX = pos.x;
    pointer.currentY = pos.y;
    pointer.history = [{ x: pos.x, y: pos.y, t: performance.now() }];

    setGameStateLabel("Segurando! Arraste e solte com velocidade para lançar! 🎯");
    setGameStateColor("text-indigo-400");
  };

  const handlePointerMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const body = bottleRef.current;
    if (!body.isDragging) return;
    e.preventDefault();

    const pos = getPointerPos(e);
    const pointer = pointerRef.current;

    pointer.currentX = pos.x;
    pointer.currentY = pos.y;
    pointer.history.push({ x: pos.x, y: pos.y, t: performance.now() });

    // Limit history length to hold enough recent frames for precise speed calculation
    if (pointer.history.length > 8) {
      pointer.history.shift();
    }

    const groundY = canvasDimensions.height - 40;

    // Move bottle to match current position (keep it above the ground line)
    body.x = pos.x;
    body.y = Math.min(pos.y, groundY - bottleConfig.height / 2);

    // Dynamic visual tilt proportional to horizontal velocity to make dragging feel alive
    const dx = pos.x - pointer.history[0].x;
    body.theta = dx * 0.005;

    // Spark dynamic trail particles
    if (Math.random() < 0.35) {
      spawnSmokeTrail(body.x, body.y + bottleConfig.height / 2);
    }
  };

  const handlePointerUpOrLeave = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement> | TouchEvent | MouseEvent) => {
    const body = bottleRef.current;
    if (!body.isDragging) return;

    body.isDragging = false;
    setIsCurrentlyDragging(false);
    const pointer = pointerRef.current;
    pointer.isDown = false;

    // Calculate throw velocity from the last pointer movement history elements
    if (pointer.history.length >= 2) {
      const first = pointer.history[0];
      const last = pointer.history[pointer.history.length - 1];
      const dt = (last.t - first.t) / 1000; // in seconds

      if (dt > 0.005) {
        // High-precision launch velocity calculus
        let calcVx = (last.x - first.x) / dt;
        let calcVy = (last.y - first.y) / dt;

        // Apply visual launch multipliers & manual power bar level 
        calcVx *= 0.85 * physicsSettings.launchMultiplier * manualForceMult;
        calcVy *= 1.25 * physicsSettings.launchMultiplier * manualForceMult;

        // Boundaries caps to guarantee stability
        body.vx = Math.min(2000, Math.max(-2000, calcVx));
        body.vy = Math.min(200, Math.max(-2600, calcVy));

        // Generate Torque (spin): 
        // 1. Natural swing spin calculated from horizontal and vertical swipe speed vectors
        const strokeX = last.x - first.x;
        const strokeY = last.y - first.y;
        
        // Calculate the absolute magnitude of the gesture's torque
        const baseGestureSpin = (Math.abs(strokeX) * 0.015 + Math.abs(strokeY) * 0.008) * physicsSettings.torqueFactor;
        
        // Combine with the magnitude of the selectedSpinSetting helper
        let finalSpinAbs = baseGestureSpin;
        if (Math.abs(selectedSpinSetting) > 0.1) {
          finalSpinAbs = (Math.abs(selectedSpinSetting) * 0.7) + (baseGestureSpin * 0.5);
        } else {
          finalSpinAbs = baseGestureSpin * 0.5;
        }

        // Apply strict user requirements:
        // - Drag/tilt to the right (strokeX > 0) -> Anti-Clockwise (< 0)
        // - Drag/tilt to the left (strokeX <= 0) -> Clockwise (> 0)
        let finalSpin = strokeX > 0 ? -finalSpinAbs : finalSpinAbs;

        body.omega = Math.min(22, Math.max(-22, finalSpin));
        body.hasBeenThrown = true;
        body.restTimer = 0;
        body.maxHeight = body.y;

        playThrowSound(Math.sqrt(calcVx * calcVx + calcVy * calcVy));
        setGameStateLabel(`Arremessado com Força: ${(manualForceMult * 100).toFixed(0)}%! 🌀`);
        setGameStateColor("text-sky-400 font-bold");

        // Stat updates
        onUpdateStats({
          totalThrows: stats.totalThrows + 1,
          currentStreak: 0, 
        });
      } else {
        resetBottlePosition();
      }
    } else {
      resetBottlePosition();
    }
  };

  // Bind global pointers to avoid sticking when dragging off-canvas
  useEffect(() => {
    const handleGlobalUp = (e: MouseEvent | TouchEvent) => {
      if (bottleRef.current.isDragging) {
        handlePointerUpOrLeave(e);
      }
    };

    window.addEventListener("mouseup", handleGlobalUp);
    window.addEventListener("touchend", handleGlobalUp);

    return () => {
      window.removeEventListener("mouseup", handleGlobalUp);
      window.removeEventListener("touchend", handleGlobalUp);
    };
  }, [physicsSettings, currentBottleId, stats, customBottleConfig]);

  // Main Canvas Physics & Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animFrameId: number;
    let lastTime = performance.now();

    const loop = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.03); // Cap dt to preserve framerate physics from exploding
      lastTime = time;

      // CLEAR CANVAS WITH BG GRADIENT
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      const gradEnds = scenery.backgroundColor.match(/#[a-fA-F0-9]{3,8}/g);
      if (gradEnds && gradEnds.length >= 2) {
        bgGrad.addColorStop(0, gradEnds[0]);
        bgGrad.addColorStop(1, gradEnds[1]);
      } else {
        bgGrad.addColorStop(0, "#eceef2");
        bgGrad.addColorStop(1, "#f3f4f6");
      }
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // DRAW FLOATING SCENE DECORATIONS (Floating light bubbles or stars)
      if (currentSceneryId === "futuristic") {
        ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
        for (let i = 0; i < 15; i++) {
          const starX = (Math.sin(time * 0.0005 + i * 200) * 0.5 + 0.5) * canvas.width;
          const starY = (Math.cos(time * 0.0008 + i * 50) * 0.5 + 0.5) * (canvas.height - 80);
          ctx.beginPath();
          ctx.arc(starX, starY, (i % 3) + 1, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (currentSceneryId === "backyard") {
        // Sun glow
        ctx.fillStyle = "rgba(251, 191, 36, 0.08)";
        ctx.beginPath();
        ctx.arc(canvas.width - 150, 100, 180, 0, Math.PI * 2);
        ctx.fill();
      }

      const groundY = canvas.height - 40;
      const body = bottleRef.current;

      // PHYSICS UPDATE
      if (!body.isDragging && !body.shattered) {
        // Apply Gravity
        body.vy += physicsSettings.gravity * dt;

        // Apply drag (damping)
        const currentDrag = physicsSettings.drag;
        body.vx *= (1 - currentDrag * dt);
        body.vy *= (1 - currentDrag * 0.3 * dt); // less drag vertical
        body.omega *= (1 - physicsSettings.angularDrag * dt);

        // Update positions
        body.x += body.vx * dt;
        body.y += body.vy * dt;
        body.theta += body.omega * dt;

        // Track highest points
        if (body.hasBeenThrown && body.vy < 0) {
          const altitude = groundY - body.y;
          if (altitude > body.maxHeight) {
            body.maxHeight = altitude;
          }
        }

        // Count spins (flips)
        const rawRotChange = body.theta - body.prevTheta;
        body.accumulatedRotation += rawRotChange;
        body.prevTheta = body.theta;

        const flips = Math.floor(Math.abs(body.accumulatedRotation) / (Math.PI * 2));
        if (flips > body.spinsCounted) {
          body.spinsCounted = flips;
        }

        // --- RIGID BODY VERTEX COLLISION SOLVER ---
        // Calculate corner vertices of the bottle relative to center of mass
        const w = bottleConfig.width;
        const h = bottleConfig.height;

        // Low center of mass shift to simulate liquid weight pooling at base
        // Shift is a fraction of the bottle length
        const comYShift = h * (0.5 - bottleConfig.liquidRatio * 0.65);

        // Standard offsets of 4 corners relative to Center of Mass
        const rxTopLeft = -w/2;
        const ryTopLeft = -h/2 - comYShift;

        const rxTopRight = w/2;
        const ryTopRight = -h/2 - comYShift;

        const rxBotRight = w/2;
        const ryBotRight = h/2 - comYShift;

        const rxBotLeft = -w/2;
        const ryBotLeft = h/2 - comYShift;

        const cornersRelative = [
          { rx: rxTopLeft, ry: ryTopLeft, name: "top-left" },
          { rx: rxTopRight, ry: ryTopRight, name: "top-right" },
          { rx: rxBotRight, ry: ryBotRight, name: "bottom-right" },
          { rx: rxBotLeft, ry: ryBotLeft, name: "bottom-left" },
        ];

        // Resolve walls boundaries (left, right limits)
        if (body.x < w) {
          body.x = w;
          body.vx = Math.abs(body.vx) * 0.4;
        } else if (body.x > canvas.width - w) {
          body.x = canvas.width - w;
          body.vx = -Math.abs(body.vx) * 0.4;
        }

        const bouncinessCoef = bottleConfig.bounciness * physicsSettings.restitution;
        const frictionCoef = bottleConfig.friction;
        const momentOfInertia = bottleConfig.mass * (w*w + h*h) / 12;

        let hasHitSurface = false;
        let maxImpactVel = 0;

        // Test vertices collision against (1) Ground Floor, (2) Active platforms
        cornersRelative.forEach((corner) => {
          // World coordinate of corner node
          const cos = Math.cos(body.theta);
          const sin = Math.sin(body.theta);
          const wx = body.x + corner.rx * cos - corner.ry * sin;
          const wy = body.y + corner.rx * sin + corner.ry * cos;

          // Resolve Ground Floors
          if (wy >= groundY) {
            const penetration = wy - groundY;

            // Compute local velocity at collision node coords
            // In 2D: V_node = V_cm + omega x r_node
            // V_node_x = vx - omega * ry
            // V_node_y = vy + omega * rx
            const nodeOffsetRx = wx - body.x;
            const nodeOffsetRy = wy - body.y;
            const vcx = body.vx - body.omega * nodeOffsetRy;
            const vcy = body.vy + body.omega * nodeOffsetRx;

            if (vcy > 0) { // Moving down into the floor
              hasHitSurface = true;
              if (vcy > maxImpactVel) maxImpactVel = vcy;

              // Rigid impact impulse along Normal vertical (0, -1)
              // J_normal = -(1+e) * vcy / (1/M + rx^2/I)
              const normalImpulse = -(1 + bouncinessCoef) * vcy / (1 / bottleConfig.mass + (nodeOffsetRx * nodeOffsetRx) / momentOfInertia);
              
              // Apply vertical linear velocity push
              body.vy += normalImpulse / bottleConfig.mass;
              // Apply angular velocity torque shift
              body.omega += nodeOffsetRx * normalImpulse / momentOfInertia;

              // Apply Friction horizontally
              const frictionvcx = body.vx - body.omega * nodeOffsetRy;
              const frictionImpulse = -frictionvcx * frictionCoef / (1 / bottleConfig.mass + (nodeOffsetRy * nodeOffsetRy) / momentOfInertia);
              
              // Limit friction peak to Coulomb slip model (|F_fric| <= u * |F_norm|)
              const maxFrictionCap = Math.abs(normalImpulse) * frictionCoef;
              const appliedFricImpVal = Math.max(-maxFrictionCap, Math.min(maxFrictionCap, frictionImpulse));

              body.vx += appliedFricImpVal / bottleConfig.mass;
              body.omega += -nodeOffsetRy * appliedFricImpVal / momentOfInertia;

              // Positional translation adjustment to prevent visual clip/floor sink
              body.y -= penetration * 0.95;

              // Particle bounce liquid splash
              if (Math.abs(vcy) > 120) {
                spawnSplash(wx, groundY, bottleConfig.liquidColor, Math.floor(Math.abs(vcy) / 80));
              }
            }
          }

          // Resolve Platforms
          scenery.platforms.forEach((platform) => {
            if (
              wx >= platform.x &&
              wx <= platform.x + platform.width &&
              wy >= platform.y &&
              wy <= platform.y + platform.height
            ) {
              const penetration = wy - platform.y;
              
              // Only trigger collision if falling downwards into platform top
              if (penetration < 28) {
                const nodeOffsetRx = wx - body.x;
                const nodeOffsetRy = wy - body.y;
                const vcx = body.vx - body.omega * nodeOffsetRy;
                const vcy = body.vy + body.omega * nodeOffsetRx;

                if (vcy > 0) { // heading downwards
                  hasHitSurface = true;
                  if (vcy > maxImpactVel) maxImpactVel = vcy;

                  const normalImpulse = -(1 + bouncinessCoef) * vcy / (1 / bottleConfig.mass + (nodeOffsetRx * nodeOffsetRx) / momentOfInertia);
                  
                  body.vy += normalImpulse / bottleConfig.mass;
                  body.omega += nodeOffsetRx * normalImpulse / momentOfInertia;

                  const frictionvcx = body.vx - body.omega * nodeOffsetRy;
                  const frictionImpulse = -frictionvcx * frictionCoef / (1 / bottleConfig.mass + (nodeOffsetRy * nodeOffsetRy) / momentOfInertia);
                  
                  const maxFrictionCap = Math.abs(normalImpulse) * frictionCoef;
                  const appliedFricImpVal = Math.max(-maxFrictionCap, Math.min(maxFrictionCap, frictionImpulse));

                  body.vx += appliedFricImpVal / bottleConfig.mass;
                  body.omega += -nodeOffsetRy * appliedFricImpVal / momentOfInertia;

                  // Adjust depth
                  body.y -= penetration * 0.95;

                  if (Math.abs(vcy) > 120) {
                    spawnSplash(wx, platform.y, bottleConfig.liquidColor, Math.floor(Math.abs(vcy) / 80));
                  }
                }
              }
            }
          });
        });

        // Trigger landing sound effects
        if (hasHitSurface && time - body.lastSoundTime > 90 && maxImpactVel > 40) {
          body.lastSoundTime = time;

          // Glass bottle shatter checker
          if (bottleConfig.id === BottleID.GLASS_BOTTLE && maxImpactVel > 780) {
            body.shattered = true;
            playGlassShatterSound();
            spawnGlassShatter(body.x, body.y);
            setGameStateLabel("💥 ESTILHAÇOU! Vidro quebrou com o impacto pesado!");
            setGameStateColor("text-rose-500");
          } else {
            let materialType: "water" | "metal" | "wood" | "glass" | "plastic" = "water";
            if (bottleConfig.id === BottleID.GLASS_BOTTLE) materialType = "glass";
            else if (bottleConfig.id === BottleID.THERMOS) materialType = "metal";
            else if (bottleConfig.id === BottleID.JUICE_CARTON) materialType = "wood";
            else if (bottleConfig.id === BottleID.SODA_CAN) materialType = "plastic";

            playBounceSound(maxImpactVel / 1500, materialType);
          }
        }

        // STANDING AND VELOCITY DAMPING TO CHECK SETTLED LANDING upright
        const speedSq = body.vx * body.vx + body.vy * body.vy;
        const isQuiet = speedSq < 35 && Math.abs(body.omega) < 0.28;

        if (body.hasBeenThrown && isQuiet) {
          body.restTimer += dt;
          
          if (body.restTimer > 0.45) { // settle at rest
            // Check upright posture orientation with high-precision absolute deviance from 0
            // Regardless of how many full rotations (positive or negative) the bottle completed.
            const normalizedAngle = Math.abs(Math.atan2(Math.sin(body.theta), Math.cos(body.theta)));
            
            // Standing threshold: tolerates small angles tailored to each Bottle's stabilityBonus
            const standingLimit = 0.08 + bottleConfig.stabilityBonus;

            // Shortest distance to upside down (Math.PI radians) derived cleanly from normalizedAngle
            const distToPi = Math.PI - normalizedAngle;
            const capLimit = 0.09 + bottleConfig.stabilityBonus;
            const isCapLanding = distToPi < capLimit;

            if (normalizedAngle < standingLimit) {
              // --- UP-PRESTIGE SUCCESS LAND LANDING! ---
              body.hasBeenThrown = false;
              body.restTimer = 0;
              body.theta = 0; // align straight upright nicely
              body.omega = 0;
              body.vx = 0;
              body.vy = 0;

              // Confetti pops!
              spawnCelebration(body.x, body.y - h / 3);
              playLandSuccessSound();

              const currentPointsMultiplier = Math.round(bottleConfig.difficultyMultiplier * 10) / 10;
              setGameStateLabel(`🍀 LANDED! Sensacional flip em pé! (+${currentPointsMultiplier}x)`);
              setGameStateColor("text-emerald-400 font-extrabold scale-110");

              // Increment counters
              const updatedStreak = stats.currentStreak + 1;
              const updatedBest = Math.max(stats.highestStreak, updatedStreak);
              const unlockedList = [...stats.unlockedBottles];
              if (!unlockedList.includes(currentBottleId)) {
                unlockedList.push(currentBottleId);
              }

              onUpdateStats({
                successfulFlips: stats.successfulFlips + 1,
                currentStreak: updatedStreak,
                highestStreak: updatedBest,
                maxHeightReached: Math.max(stats.maxHeightReached, body.maxHeight),
                maxSpinsInOneThrow: Math.max(stats.maxSpinsInOneThrow, body.spinsCounted),
                unlockedBottles: unlockedList,
              });

              // Check Achievements:
              onUnlockAchievement("first_flip");
              if (updatedStreak >= 3) onUnlockAchievement("streak_3");
              if (updatedStreak >= 5) onUnlockAchievement("streak_5");
              if (unlockedList.length >= 4) onUnlockAchievement("all_bottles");
              if (body.maxHeight > 500) onUnlockAchievement("sky_high");
              if (body.spinsCounted >= 2) onUnlockAchievement("spin_master");

            } else if (isCapLanding) {
              // --- LENDÁRIO CAP SUCCESS LANDING! ---
              body.hasBeenThrown = false;
              body.restTimer = 0;
              body.theta = Math.PI; // snap straight upside down nicely!
              body.omega = 0;
              body.vx = 0;
              body.vy = 0;

              // Multiple Confetti explosions!
              spawnCelebration(body.x, body.y - h / 3);
              setTimeout(() => spawnCelebration(body.x - 25, body.y - h / 2), 150);
              setTimeout(() => spawnCelebration(body.x + 25, body.y - h / 2), 300);
              playLandSuccessSound();

              const currentPointsMultiplier = Math.round(bottleConfig.difficultyMultiplier * 10) / 10;
              setGameStateLabel(`👑 LENDÁRIO! Incrível pouso em pé na TAMPA! (+${(currentPointsMultiplier * 2.5).toFixed(1)}x)`);
              setGameStateColor("text-yellow-400 font-black scale-125 animate-pulse");

              // Increment counters
              const updatedStreak = stats.currentStreak + 1;
              const updatedBest = Math.max(stats.highestStreak, updatedStreak);
              const unlockedList = [...stats.unlockedBottles];
              if (!unlockedList.includes(currentBottleId)) {
                unlockedList.push(currentBottleId);
              }

              onUpdateStats({
                successfulFlips: stats.successfulFlips + 1,
                currentStreak: updatedStreak,
                highestStreak: updatedBest,
                maxHeightReached: Math.max(stats.maxHeightReached, body.maxHeight),
                maxSpinsInOneThrow: Math.max(stats.maxSpinsInOneThrow, body.spinsCounted),
                unlockedBottles: unlockedList,
              });

              // Check Achievements:
              onUnlockAchievement("first_flip");
              onUnlockAchievement("legendary_cap_landing");
              if (updatedStreak >= 3) onUnlockAchievement("streak_3");
              if (updatedStreak >= 5) onUnlockAchievement("streak_5");
              if (unlockedList.length >= 4) onUnlockAchievement("all_bottles");
              if (body.maxHeight > 500) onUnlockAchievement("sky_high");
              if (body.spinsCounted >= 2) onUnlockAchievement("spin_master");

            } else {
              // --- FAIL LANDING ---
              body.hasBeenThrown = false;
              body.restTimer = 0;
              playFailSound();

              setGameStateLabel("Caiu deitado! Tente denovo com carinho ☝");
              setGameStateColor("text-rose-400");

              onUpdateStats({
                currentStreak: 0, // Reset win streak
              });
            }
          }
        }
      }

      // --- PLATFORM DRAW RENDER ---
      scenery.platforms.forEach((platform) => {
        // Draw platform shelf with 3D shadow face
        ctx.fillStyle = "rgba(15, 23, 42, 0.25)";
        ctx.fillRect(platform.x + 4, platform.y + platform.height, platform.width, 10); // shadow

        ctx.fillStyle = platform.color;
        // Rounded table/shelf outline
        ctx.beginPath();
        ctx.roundRect(platform.x, platform.y, platform.width, platform.height, 4);
        ctx.fill();

        // Highline top trim
        ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
        ctx.fillRect(platform.x, platform.y, platform.width, 3);

        ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
        ctx.fillRect(platform.x, platform.y + platform.height - 3, platform.width, 3);

        // Platform text details
        ctx.fillStyle = "rgba(100, 116, 139, 0.85)";
        ctx.font = "bold 9px monospace";
        ctx.textAlign = "center";
        ctx.fillText(platform.name.toUpperCase(), platform.x + platform.width / 2, platform.y - 6);
      });

      // --- FLOOR BOTTOM DRAW ---
      ctx.fillStyle = scenery.floorColor;
      ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY);

      // Floor shine top line
      ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
      ctx.fillRect(0, groundY, canvas.width, 4);

      // --- BOTTLE RENDER DRAW ---
      if (!body.shattered) {
        ctx.save();
        ctx.translate(body.x, body.y);
        ctx.rotate(body.theta);

        const w = bottleConfig.width;
        const h = bottleConfig.height;

        // Shift rendering relative to coordinate center-of-mass pivot
        const comYShift = h * (0.5 - bottleConfig.liquidRatio * 0.65);
        const topY = -h/2 - comYShift;
        const botY = h/2 - comYShift;
        const bodyHeight = h * 0.82;
        const neckHeight = h * 0.18;

        // 1. Draw glowing background shadow if landing close or spinning
        if (body.hasBeenThrown) {
          ctx.shadowBlur = Math.min(25, Math.abs(body.omega) * 2);
          ctx.shadowColor = bottleConfig.color;
        }

        // 2. Draw Translucent main bottle plastic/glass glass body base
        ctx.fillStyle = bottleConfig.color;
        ctx.beginPath();
        // Rounded body base
        ctx.roundRect(-w / 2, botY - bodyHeight, w, bodyHeight, [2, 2, 8, 8]);
        ctx.fill();

        // 3. Draw Water Liquid Volume (Shifting/sloshing dynamically based on swipe and turn!)
        if (bottleConfig.liquidRatio > 0.0) {
          ctx.save();
          // Clip path to inside the bottle body only
          ctx.beginPath();
          ctx.roundRect(-w / 2, botY - bodyHeight, w, bodyHeight, [2, 2, 8, 8]);
          ctx.clip();

          // Calculate liquid water level and sloshing angle
          // Dynamic liquid surface angle is determined by current body rotation and angular velocity
          const targetVolHeight = bodyHeight * bottleConfig.liquidRatio;
          const dynamicSloshAngle = Math.min(0.4, Math.max(-0.4, -body.omega * 0.05));

          ctx.translate(0, botY - targetVolHeight / 2);
          ctx.rotate(dynamicSloshAngle);

          ctx.fillStyle = bottleConfig.liquidColor;
          ctx.beginPath();
          // Liquid rectangle
          ctx.fillRect(-w, -targetVolHeight / 2, w * 3, targetVolHeight * 1.5 + 10);
          
          // Draw wave slosh crest
          ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
          ctx.fillRect(-w, -targetVolHeight / 2 - 4, w * 3, 5);
          ctx.restore();
        }

        // 4. Draw slender bottle thin neck
        ctx.fillStyle = bottleConfig.color;
        ctx.beginPath();
        // Neck tapering
        ctx.moveTo(-w / 4, topY + neckHeight);
        ctx.lineTo(-w / 5, topY);
        ctx.lineTo(w / 5, topY);
        ctx.lineTo(w / 4, topY + neckHeight);
        ctx.closePath();
        ctx.fill();

        // 5. Draw bottle colored sealing cap
        ctx.fillStyle = bottleConfig.capColor;
        ctx.beginPath();
        ctx.roundRect(-w / 4.8, topY - 7, w / 2.4, 8, 2);
        ctx.fill();

        // 6. Draw realistic plastic sheen/highlights
        ctx.fillStyle = "rgba(255, 255, 255, 0.16)";
        ctx.fillRect(-w / 2.5, botY - bodyHeight + 10, w / 5, bodyHeight - 20);

        ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
        ctx.fillRect(-w / 4, topY + 4, w / 15, neckHeight - 6);

        // 7. Render dynamic spin arrows if in midair
        if (body.hasBeenThrown && Math.abs(body.omega) > 3) {
          ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(0, 0, Math.max(w, h / 2.5), 0, Math.PI * 0.6);
          ctx.stroke();
        }

        ctx.restore();
      }

      // --- DYNAMIC PARTICLES DRAW & UPDATE ---
      const activeParticles: Particle[] = [];
      particlesRef.current.forEach((p) => {
        // Update velocity
        p.vy += 200 * dt; // gravity deceleration for debris
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        
        // Update spin
        if (p.angle !== undefined && p.angularV !== undefined) {
          p.angle += p.angularV * dt;
        }

        p.alpha -= p.decay;

        if (p.alpha > 0) {
          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = p.color;

          if (p.shape === "square") {
            ctx.translate(p.x, p.y);
            if (p.angle !== undefined) ctx.rotate(p.angle);
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
          } else if (p.shape === "shard") {
            ctx.translate(p.x, p.y);
            if (p.angle !== undefined) ctx.rotate(p.angle);
            // Triangular pointy shard
            ctx.beginPath();
            ctx.moveTo(0, -p.size);
            ctx.lineTo(p.size, p.size);
            ctx.lineTo(-p.size, p.size);
            ctx.closePath();
            ctx.fill();
          } else { // Circle
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
          }

          ctx.restore();
          activeParticles.push(p);
        }
      });
      particlesRef.current = activeParticles;

      // Draw game title or telemetry guidelines inside the canvas corners with a humble design
      ctx.fillStyle = "rgba(100, 116, 139, 0.4)";
      ctx.font = "11px Courier, monospace";
      ctx.textAlign = "left";
      ctx.fillText("AMPLO MONITOR DE FÍSICA E ESPAÇO", 20, 30);

      // Active combos indicator floating
      if (stats.currentStreak > 0) {
        ctx.fillStyle = "rgba(245, 158, 11, 0.9)";
        ctx.font = "bold 13px sans-serif";
        ctx.textAlign = "right";
        ctx.fillText(`COMBO: x${stats.currentStreak} 🔥`, canvas.width - 20, 30);
      }

      animFrameId = requestAnimationFrame(loop);
    };

    animFrameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animFrameId);
    };
  }, [physicsSettings, currentBottleId, currentSceneryId, stats, selectedSpinSetting, manualForceMult, customBottleConfig]);

  return (
    <div className="flex flex-col h-full bg-slate-950 relative rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-800" id="game-canvas-wrapper">
      
      {/* Top Telemetry Header Area - Highly Responsive spacing */}
      <div className="bg-slate-900 border-b border-slate-800 px-3 py-2 sm:px-6 sm:py-3.5 flex justify-between items-center z-10 gap-2">
        <div className="hidden sm:flex items-center space-x-2.5">
          <div className="w-3.5 h-3.5 rounded-full bg-indigo-500 animate-pulse" />
          <span className="text-xs font-bold tracking-wider text-slate-300 font-mono">SIMULADOR COMPORTAMENTAL</span>
        </div>
        
        {/* State label - Small and readable on mobile */}
        <span className={`text-[10px] sm:text-xs font-bold font-sans transition-all duration-300 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-slate-950 border border-slate-800/80 truncate ${gameStateColor} max-w-[190px] sm:max-w-none`} id="simulation-status-label">
          {gameStateLabel}
        </span>

        {/* Quick Reset Button if shatters or gets stuck */}
        <button
          onClick={resetBottlePosition}
          className="text-[10px] sm:text-xs bg-slate-950 border border-indigo-500/20 text-indigo-400 hover:text-indigo-300 hover:bg-slate-900 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl cursor-pointer font-bold transition-all shrink-0"
          id="btn-re-spwan-bottle"
        >
          {bottleRef.current.shattered ? "Limpar Vidro 🔧" : "Nova Garrafa ⚡"}
        </button>
      </div>

      {/* Actual Responsive Canvas Anchor */}
      <div className="flex-1 w-full bg-slate-950 relative min-h-0" ref={containerRef}>
        <canvas
          ref={canvasRef}
          width={canvasDimensions.width}
          height={canvasDimensions.height}
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUpOrLeave}
          onTouchStart={handlePointerDown}
          onTouchMove={handlePointerMove}
          onTouchEnd={handlePointerUpOrLeave}
          onWheel={(e) => {
            // Adjust spin speed live on mouse scroll wheel while dragging!
            if (bottleRef.current.isDragging) {
              const next = selectedSpinSetting + (e.deltaY > 0 ? -0.5 : 0.5);
              setSelectedSpinSetting(Math.min(15, Math.max(-15, next)));
            }
          }}
          className={`${isCurrentlyDragging ? 'cursor-grabbing' : 'cursor-grab'} block select-none touch-none w-full h-full`}
        />

        {/* Swipe Guidelines Overlay layer if first flip has never happened */}
        {stats.successfulFlips === 0 && !pointerRef.current.isDown && (
          <div className="absolute inset-x-0 bottom-10 flex flex-col items-center justify-center pointer-events-none select-none text-slate-100 opacity-60 animate-bounce">
            <span className="text-[11px] sm:text-sm font-semibold tracking-wide bg-slate-900/90 border border-indigo-500/30 px-3 py-1.5 rounded-full shadow-lg text-center mx-4">
              👆 Clique e arremesse arrastando com velocidade!
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
