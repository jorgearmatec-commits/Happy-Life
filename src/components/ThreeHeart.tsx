import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface ThreeHeartProps {
  size?: number;
  className?: string;
  onHeartClick?: () => void;
}

export const ThreeHeart: React.FC<ThreeHeartProps> = ({
  size = 56,
  className = '',
  onHeartClick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Scene
    const scene = new THREE.Scene();

    // Camera
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, 4.5);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(size, size);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    container.appendChild(renderer.domElement);

    // Create 3D Heart Geometry using ExtrudeGeometry on Heart Shape
    const heartShape = new THREE.Shape();
    const x = 0, y = -0.4;
    heartShape.moveTo(x + 0.25, y + 0.25);
    heartShape.bezierCurveTo(x + 0.25, y + 0.25, x + 0.2, y, x, y);
    heartShape.bezierCurveTo(x - 0.3, y, x - 0.3, y + 0.35, x - 0.3, y + 0.35);
    heartShape.bezierCurveTo(x - 0.3, y + 0.55, x - 0.1, y + 0.77, x + 0.25, y + 0.95);
    heartShape.bezierCurveTo(x + 0.6, y + 0.77, x + 0.8, y + 0.55, x + 0.8, y + 0.35);
    heartShape.bezierCurveTo(x + 0.8, y + 0.35, x + 0.8, y, x + 0.5, y);
    heartShape.bezierCurveTo(x + 0.35, y, x + 0.25, y + 0.25, x + 0.25, y + 0.25);

    const extrudeSettings = {
      depth: 0.3,
      bevelEnabled: true,
      bevelSegments: 8,
      steps: 2,
      bevelSize: 0.12,
      bevelThickness: 0.14,
    };

    const geometry = new THREE.ExtrudeGeometry(heartShape, extrudeSettings);
    geometry.center();
    // Rotate so pointed tip is downwards
    geometry.rotateZ(Math.PI);

    // Shiny metallic red material with specular highlights
    const material = new THREE.MeshPhysicalMaterial({
      color: 0xef233c,
      emissive: 0x590d22,
      emissiveIntensity: 0.35,
      roughness: 0.12,
      metalness: 0.45,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      reflectivity: 0.9,
    });

    const heartMesh = new THREE.Mesh(geometry, material);
    heartMesh.scale.set(1.4, 1.4, 1.4);
    scene.add(heartMesh);

    // Cupid arrow passing through
    const arrowGroup = new THREE.Group();
    // Arrow shaft
    const shaftGeo = new THREE.CylinderGeometry(0.035, 0.035, 3.2, 16);
    const shaftMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      metalness: 0.8,
      roughness: 0.2,
    });
    const shaft = new THREE.Mesh(shaftGeo, shaftMat);
    shaft.rotation.z = Math.PI / 4;
    shaft.position.set(0.1, 0.05, 0.1);
    arrowGroup.add(shaft);

    // Arrow tip
    const tipGeo = new THREE.ConeGeometry(0.12, 0.35, 16);
    const tipMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      metalness: 0.9,
      roughness: 0.1,
    });
    const tip = new THREE.Mesh(tipGeo, tipMat);
    tip.position.set(1.2, 1.15, 0.1);
    tip.rotation.z = -Math.PI / 4;
    arrowGroup.add(tip);

    scene.add(arrowGroup);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0xff6b8b, 3, 10);
    pointLight1.position.set(2, 3, 3);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x38bdf8, 2, 10);
    pointLight2.position.set(-2, -2, 2);
    scene.add(pointLight2);

    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Diastolic / Systolic double heartbeat pulse: beat-beat ... pause
      const cycle = (elapsedTime * 1.8) % (2 * Math.PI);
      let pulse = Math.sin(cycle * 2);
      if (pulse < 0) pulse = 0;
      const beatScale = 1.35 + Math.pow(pulse, 3) * 0.18;

      heartMesh.scale.set(beatScale, beatScale, beatScale);

      // Subtle tilt wobble
      heartMesh.rotation.y = Math.sin(elapsedTime * 1.2) * 0.25;
      heartMesh.rotation.x = Math.cos(elapsedTime * 1.5) * 0.12;

      arrowGroup.rotation.y = Math.sin(elapsedTime * 1.2) * 0.25;
      arrowGroup.rotation.x = Math.cos(elapsedTime * 1.5) * 0.12;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      shaftGeo.dispose();
      shaftMat.dispose();
      tipGeo.dispose();
      tipMat.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [size]);

  return (
    <div
      ref={containerRef}
      onClick={onHeartClick}
      className={`inline-flex items-center justify-center cursor-pointer select-none filter drop-shadow-[0_8px_16px_rgba(225,29,72,0.45)] hover:scale-105 active:scale-95 transition-transform ${className}`}
      style={{ width: size, height: size }}
      title="Cupido Happy Life Duo - Nuestro Amor"
    />
  );
};
