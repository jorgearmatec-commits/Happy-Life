import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface ThreeDice3DProps {
  isRolling: boolean;
  resultNumber: number | null;
  onRollComplete?: (num: number) => void;
  width?: number;
  height?: number;
}

export const ThreeDice3D: React.FC<ThreeDice3DProps> = ({
  isRolling,
  resultNumber,
  onRollComplete,
  width = 280,
  height = 240,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const isRollingRef = useRef(isRolling);
  const resultNumberRef = useRef(resultNumber);
  const rollStartTimeRef = useRef<number | null>(null);
  const diceGroupRef = useRef<THREE.Group | null>(null);
  const shadowMeshRef = useRef<THREE.Mesh | null>(null);
  const shadowMatRef = useRef<THREE.MeshBasicMaterial | null>(null);
  const targetRotationRef = useRef<{ x: number; y: number; z: number }>({ x: 0, y: 0, z: 0 });
  const baseRotationsRef = useRef<{ x: number; y: number; z: number }>({ x: 0, y: 0, z: 0 });
  const [secondsLeft, setSecondsLeft] = useState<number>(10);
  const [progressPercent, setProgressPercent] = useState<number>(0);

  isRollingRef.current = isRolling;
  resultNumberRef.current = resultNumber;

  // Face rotations to point each number towards camera (+Z)
  const getTargetRotationForFace = (num: number) => {
    switch (num) {
      case 1: // Face +Z
        return { x: 0, y: 0, z: 0 };
      case 6: // Face -Z
        return { x: 0, y: Math.PI, z: 0 };
      case 2: // Face +Y
        return { x: Math.PI / 2, y: 0, z: 0 };
      case 5: // Face -Y
        return { x: -Math.PI / 2, y: 0, z: 0 };
      case 3: // Face +X
        return { x: 0, y: -Math.PI / 2, z: 0 };
      case 4: // Face -X
        return { x: 0, y: Math.PI / 2, z: 0 };
      default:
        return { x: 0, y: 0, z: 0 };
    }
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // SCENE
    const scene = new THREE.Scene();

    // CAMERA
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 1.2, 4.6);
    camera.lookAt(0, 0.4, 0);

    // RENDERER
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);

    // LIGHTS
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.3);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfff7ed, 2.4);
    dirLight.position.set(4, 8, 5);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0xdbeafe, 1.0);
    fillLight.position.set(-4, -2, -3);
    scene.add(fillLight);

    const topRimLight = new THREE.PointLight(0xfef08a, 1.2, 10);
    topRimLight.position.set(0, 4, 2);
    scene.add(topRimLight);

    // DICE GROUP
    const diceGroup = new THREE.Group();
    diceGroupRef.current = diceGroup;
    diceGroup.position.set(0, 0.3, 0);
    scene.add(diceGroup);

    // DICE BODY (White MeshPhysicalMaterial with bevels, roughness 0.2, clearcoat 1)
    const diceSize = 1.35;
    const half = diceSize / 2;

    // Rounded Box shape with beveled edges using Extrude or Box with rounded segments
    const diceGeometry = new THREE.BoxGeometry(diceSize, diceSize, diceSize, 8, 8, 8);

    // Round the vertices slightly for smooth beveled physical edges
    const posAttribute = diceGeometry.attributes.position;
    const v = new THREE.Vector3();
    const bevelRadius = 0.14;
    const maxExtent = half - bevelRadius;

    for (let i = 0; i < posAttribute.count; i++) {
      v.fromBufferAttribute(posAttribute, i);
      const clampedX = Math.max(-maxExtent, Math.min(maxExtent, v.x));
      const clampedY = Math.max(-maxExtent, Math.min(maxExtent, v.y));
      const clampedZ = Math.max(-maxExtent, Math.min(maxExtent, v.z));
      const offset = new THREE.Vector3().subVectors(v, new THREE.Vector3(clampedX, clampedY, clampedZ));
      if (offset.length() > 0) {
        offset.normalize().multiplyScalar(bevelRadius);
        v.set(clampedX + offset.x, clampedY + offset.y, clampedZ + offset.z);
        posAttribute.setXYZ(i, v.x, v.y, v.z);
      }
    }
    diceGeometry.computeVertexNormals();

    const diceMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.2,
      metalness: 0.04,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      reflectivity: 0.85,
    });

    const diceMesh = new THREE.Mesh(diceGeometry, diceMaterial);
    diceMesh.castShadow = true;
    diceMesh.receiveShadow = true;
    diceGroup.add(diceMesh);

    // PIPS (Black 3D spherical pips, Face 1 has signature red pip)
    const pipRadius = 0.088;
    const pipGeo = new THREE.SphereGeometry(pipRadius, 16, 16);
    const blackPipMat = new THREE.MeshStandardMaterial({
      color: 0x111827,
      roughness: 0.35,
      metalness: 0.1,
    });
    const redPipMat = new THREE.MeshStandardMaterial({
      color: 0xdc2626,
      roughness: 0.3,
      metalness: 0.1,
    });

    const d = 0.32; // Offset for pips grid
    const zOffset = half + 0.005;

    const createPip = (x: number, y: number, z: number, isRed = false) => {
      const pip = new THREE.Mesh(pipGeo, isRed ? redPipMat : blackPipMat);
      pip.position.set(x, y, z);
      pip.scale.set(1, 1, 0.45); // slightly indented
      return pip;
    };

    // FACE 1 (+Z): 1 Red Center Pip
    const pip1 = createPip(0, 0, zOffset, true);
    diceGroup.add(pip1);

    // FACE 6 (-Z): 6 Black Pips
    [-d, d].forEach((x) => {
      [-d, 0, d].forEach((y) => {
        const pip = createPip(x, y, -zOffset);
        diceGroup.add(pip);
      });
    });

    // FACE 2 (+Y): 2 Pips diagonal
    const p2_1 = createPip(-d, zOffset, -d);
    p2_1.rotation.x = Math.PI / 2;
    const p2_2 = createPip(d, zOffset, d);
    p2_2.rotation.x = Math.PI / 2;
    diceGroup.add(p2_1, p2_2);

    // FACE 5 (-Y): 5 Pips
    [
      [-d, -d],
      [d, -d],
      [0, 0],
      [-d, d],
      [d, d],
    ].forEach(([x, z]) => {
      const pip = createPip(x, -zOffset, z);
      pip.rotation.x = Math.PI / 2;
      diceGroup.add(pip);
    });

    // FACE 3 (+X): 3 Pips diagonal
    [
      [zOffset, -d, -d],
      [zOffset, 0, 0],
      [zOffset, d, d],
    ].forEach(([x, y, z]) => {
      const pip = createPip(x, y, z);
      pip.rotation.y = Math.PI / 2;
      diceGroup.add(pip);
    });

    // FACE 4 (-X): 4 Pips corners
    [
      [-zOffset, -d, -d],
      [-zOffset, d, -d],
      [-zOffset, -d, d],
      [-zOffset, d, d],
    ].forEach(([x, y, z]) => {
      const pip = createPip(x, y, z);
      pip.rotation.y = Math.PI / 2;
      diceGroup.add(pip);
    });

    // CONTACT SHADOW (Realistic soft circular shadow on floor)
    const shadowGeo = new THREE.PlaneGeometry(2.4, 2.4);
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 128;
    shadowCanvas.height = 128;
    const ctx = shadowCanvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(64, 64, 10, 64, 64, 60);
      grad.addColorStop(0, 'rgba(0, 0, 0, 0.65)');
      grad.addColorStop(0.4, 'rgba(0, 0, 0, 0.35)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 128, 128);
    }
    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      opacity: 0.75,
      depthWrite: false,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.set(0, -0.62, 0);
    scene.add(shadowMesh);
    shadowMeshRef.current = shadowMesh;
    shadowMatRef.current = shadowMat;

    // ANIMATION LOOP
    let animationId: number;
    let hasCompletedRoll = false;

    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const animate = (currentTime: number) => {
      animationId = requestAnimationFrame(animate);

      if (isRollingRef.current) {
        if (!rollStartTimeRef.current) {
          rollStartTimeRef.current = currentTime;
          hasCompletedRoll = false;
          // Set extra full rotations to land smoothly
          const target = getTargetRotationForFace(resultNumberRef.current || 1);
          targetRotationRef.current = {
            x: target.x + Math.PI * 6,
            y: target.y + Math.PI * 8,
            z: target.z + Math.PI * 4,
          };
          baseRotationsRef.current = {
            x: diceGroup.rotation.x,
            y: diceGroup.rotation.y,
            z: diceGroup.rotation.z,
          };
        }

        const elapsedSecs = (currentTime - rollStartTimeRef.current) / 1000;
        const totalDuration = 10.0; // Exactamente 10 segundos obligatorios
        const progress = Math.min(elapsedSecs / totalDuration, 1);
        const rem = Math.max(0, Math.ceil(totalDuration - elapsedSecs));

        setSecondsLeft(rem);
        setProgressPercent(Math.round(progress * 100));

        if (elapsedSecs < 5.0) {
          // FASE 1 (0 a 5s): Giro rápido caótico en X/Y/Z en el aire (y=2.5)
          const spinSpeed = 12.0;
          diceGroup.rotation.x += 0.28 * spinSpeed * 0.06;
          diceGroup.rotation.y += 0.35 * spinSpeed * 0.06;
          diceGroup.rotation.z += 0.22 * spinSpeed * 0.06;

          // Flotando alto en expectación
          diceGroup.position.y = 2.4 + Math.sin(elapsedSecs * 6) * 0.15;

          // Sombra más grande y tenue
          if (shadowMeshRef.current && shadowMatRef.current) {
            shadowMeshRef.current.scale.set(1.5, 1.5, 1.5);
            shadowMatRef.current.opacity = 0.25;
          }
        } else if (elapsedSecs < totalDuration) {
          // FASE 2 (5 a 10s): Descenso lento easeOutCubic de y=2.5 a y=0.3 con desaceleración y rebote final
          const phaseProgress = (elapsedSecs - 5.0) / 5.0; // 0 a 1
          const ease = easeOutCubic(phaseProgress);

          // Interpolación suave hacia rotación final
          const startX = baseRotationsRef.current.x + Math.PI * 12;
          const startY = baseRotationsRef.current.y + Math.PI * 16;
          const startZ = baseRotationsRef.current.z + Math.PI * 8;
          const target = getTargetRotationForFace(resultNumberRef.current || 1);

          diceGroup.rotation.x = THREE.MathUtils.lerp(startX, target.x, ease);
          diceGroup.rotation.y = THREE.MathUtils.lerp(startY, target.y, ease);
          diceGroup.rotation.z = THREE.MathUtils.lerp(startZ, target.z, ease);

          // Descenso de y=2.4 a y=0.3
          let currentY = THREE.MathUtils.lerp(2.4, 0.3, ease);

          // Rebote suave al final (últimos 0.8s)
          if (phaseProgress > 0.85) {
            const bouncePhase = (phaseProgress - 0.85) / 0.15;
            currentY += Math.sin(bouncePhase * Math.PI) * 0.22 * (1 - bouncePhase);
          }

          diceGroup.position.y = currentY;

          // Sombra se hace más densa y enfocada
          if (shadowMeshRef.current && shadowMatRef.current) {
            const s = THREE.MathUtils.lerp(1.5, 1.0, ease);
            shadowMeshRef.current.scale.set(s, s, s);
            shadowMatRef.current.opacity = THREE.MathUtils.lerp(0.25, 0.75, ease);
          }
        } else {
          // FINALIZACIÓN EXACTA AL SEGUNDO 10
          const target = getTargetRotationForFace(resultNumberRef.current || 1);
          diceGroup.rotation.set(target.x, target.y, target.z);
          diceGroup.position.y = 0.3;

          if (shadowMeshRef.current && shadowMatRef.current) {
            shadowMeshRef.current.scale.set(1.0, 1.0, 1.0);
            shadowMatRef.current.opacity = 0.75;
          }

          if (!hasCompletedRoll) {
            hasCompletedRoll = true;
            rollStartTimeRef.current = null;
            if (onRollComplete && resultNumberRef.current) {
              onRollComplete(resultNumberRef.current);
            }
          }
        }
      } else {
        // En reposo: suave vaivén para lucir el material 3D
        rollStartTimeRef.current = null;
        if (resultNumberRef.current) {
          const target = getTargetRotationForFace(resultNumberRef.current);
          diceGroup.rotation.set(target.x, target.y, target.z);
        } else {
          diceGroup.rotation.y += 0.008;
          diceGroup.rotation.x = Math.sin(currentTime * 0.001) * 0.12 + 0.2;
        }
        diceGroup.position.y = 0.3 + Math.sin(currentTime * 0.002) * 0.05;
      }

      renderer.render(scene, camera);
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationId);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      diceGeometry.dispose();
      diceMaterial.dispose();
      pipGeo.dispose();
      blackPipMat.dispose();
      redPipMat.dispose();
      shadowGeo.dispose();
      shadowMat.dispose();
      shadowTex.dispose();
    };
  }, [width, height]);

  return (
    <div className="flex flex-col items-center justify-center select-none">
      <div
        ref={mountRef}
        className="w-[280px] h-[240px] flex items-center justify-center pointer-events-none drop-shadow-[0_20px_35px_rgba(0,0,0,0.6)]"
      />

      {/* BARRA DE EXPECTACIÓN Y CUENTA REGRESIVA DE 10 SEGUNDOS */}
      {isRolling && (
        <div className="w-full max-w-xs space-y-1.5 mt-1 px-4">
          <div className="flex items-center justify-between text-xs font-black text-amber-300">
            <span className="flex items-center gap-1.5 animate-pulse">
              <span>🎲</span>
              <span>Generando expectación...</span>
            </span>
            <span className="font-mono text-sm bg-amber-500/20 px-2 py-0.5 rounded-lg border border-amber-400/40">
              {secondsLeft}s
            </span>
          </div>

          {/* Barra de progreso fluida 0-100% */}
          <div className="w-full h-2 rounded-full bg-black/60 border border-amber-400/30 overflow-hidden p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 transition-all duration-100 shadow-[0_0_12px_rgba(245,158,11,0.7)]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
