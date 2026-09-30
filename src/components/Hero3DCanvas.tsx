"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Sparkles, Pause, Play } from "lucide-react";

/**
 * BALANCED OPTIMIZATION — full-fidelity WebGL hero, zero animation cuts:
 * - FULL original design: antialiasing ON, DPR up to 2, all 150 gold-dust
 *   particles, full 60fps loop, cursor parallax on every device.
 * - Gold rim-lighting, barbell monolith, wireframe cage, orbital ring,
 *   rotation speeds — exactly as originally designed.
 * - Balanced-only wins (invisible to the viewer): init deferred until after
 *   first paint, GPU resources disposed on unmount, render loop skips frames
 *   only while the hero is off-screen or the tab is hidden.
 */
export default function Hero3DCanvas() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [paused, setPaused] = useState(false);
  const [webglFailed, setWebglFailed] = useState(false);
  const pausedRef = useRef(false);
  const inViewRef = useRef(true);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let disposed = false;
    let cleanupScene: (() => void) | null = null;

    const initScene = (): (() => void) => {
      let animationFrameId = 0;
      let renderer: THREE.WebGLRenderer | null = null;
      const disposables: Array<{ dispose: () => void }> = [];

      try {
        const width = container.clientWidth || window.innerWidth;
        const height = container.clientHeight || 700;

        const scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0x0a0a0a, 0.065);

        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
        camera.position.set(0, 0.2, 7.2);

        // FULL fidelity on every device — antialiasing + high-performance.
        renderer = new THREE.WebGLRenderer({
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        container.innerHTML = "";
        container.appendChild(renderer.domElement);

        // Lights — Elite Private Club + Soft Gold Rim Lighting
        const ambientLight = new THREE.AmbientLight(0x222222, 1.6);
        scene.add(ambientLight);

        const goldRimLight1 = new THREE.PointLight(0xd4af37, 12, 22);
        goldRimLight1.position.set(4.2, 2.8, 3.5);
        scene.add(goldRimLight1);

        const goldRimLight2 = new THREE.PointLight(0xe8c766, 9, 20);
        goldRimLight2.position.set(-4.0, -2.5, 2.0);
        scene.add(goldRimLight2);

        const topSteelLight = new THREE.DirectionalLight(0xfff6dd, 1.1);
        topSteelLight.position.set(0, 6, 4);
        scene.add(topSteelLight);

        // Main 3D Group: Sculpted Heavy Iron Barbell / Monolith Core
        const heroGroup = new THREE.Group();
        heroGroup.position.set(width > 1024 ? 1.8 : 0, 0, 0);
        scene.add(heroGroup);

        const darkIronMaterial = new THREE.MeshStandardMaterial({
          color: 0x1a1814,
          metalness: 0.9,
          roughness: 0.28,
          emissive: 0x2a1f05,
          emissiveIntensity: 0.3,
        });
        const goldGlowMaterial = new THREE.MeshStandardMaterial({
          color: 0xd4af37,
          metalness: 0.75,
          roughness: 0.25,
          emissive: 0xe8c766,
          emissiveIntensity: 0.55,
        });
        const wireframeMaterial = new THREE.MeshBasicMaterial({
          color: 0xd4af37,
          wireframe: true,
          transparent: true,
          opacity: 0.16,
        });
        disposables.push(
          darkIronMaterial,
          goldGlowMaterial,
          wireframeMaterial
        );

        const shaftGeo = new THREE.CylinderGeometry(0.14, 0.14, 3.8, 24);
        disposables.push(shaftGeo);
        const shaftMesh = new THREE.Mesh(shaftGeo, darkIronMaterial);
        shaftMesh.rotation.z = Math.PI / 4;
        heroGroup.add(shaftMesh);

        const plateRadii = [1.15, 0.95, 0.72];
        const plateOffsets = [1.15, 1.38, 1.56];
        const rimTilt = Math.PI / 4;

        plateRadii.forEach((radius, idx) => {
          const plateGeo = new THREE.CylinderGeometry(radius, radius, 0.18, 32);
          const rimGeo = new THREE.TorusGeometry(radius, 0.03, 12, 48);
          disposables.push(plateGeo, rimGeo);

          const distR = plateOffsets[idx];
          const rightPlate = new THREE.Mesh(plateGeo, darkIronMaterial);
          rightPlate.position.set(distR * 0.707, distR * 0.707, 0);
          rightPlate.rotation.z = Math.PI / 4;
          heroGroup.add(rightPlate);

          const rightRim = new THREE.Mesh(rimGeo, goldGlowMaterial);
          rightRim.position.copy(rightPlate.position);
          rightRim.rotation.y = Math.PI / 2;
          rightRim.rotation.x = rimTilt;
          heroGroup.add(rightRim);

          const leftPlate = new THREE.Mesh(plateGeo, darkIronMaterial);
          leftPlate.position.set(-distR * 0.707, -distR * 0.707, 0);
          leftPlate.rotation.z = Math.PI / 4;
          heroGroup.add(leftPlate);

          const leftRim = new THREE.Mesh(rimGeo, goldGlowMaterial);
          leftRim.position.copy(leftPlate.position);
          leftRim.rotation.y = Math.PI / 2;
          leftRim.rotation.x = rimTilt;
          heroGroup.add(leftRim);
        });

        const cageGeo = new THREE.IcosahedronGeometry(2.35, 1);
        disposables.push(cageGeo);
        const cageMesh = new THREE.Mesh(cageGeo, wireframeMaterial);
        heroGroup.add(cageMesh);

        const orbitGeo = new THREE.TorusGeometry(2.75, 0.018, 16, 100);
        disposables.push(orbitGeo);
        const orbitMesh = new THREE.Mesh(orbitGeo, goldGlowMaterial);
        orbitMesh.rotation.x = Math.PI / 2.6;
        orbitMesh.rotation.y = 0.4;
        heroGroup.add(orbitMesh);

        // FULL golden dust system — all 150 particles on every device.
        const particleCount = 150;
        const positions = new Float32Array(particleCount * 3);
        const speeds = new Float32Array(particleCount);
        for (let i = 0; i < particleCount; i++) {
          positions[i * 3] = (Math.random() - 0.5) * 16;
          positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
          positions[i * 3 + 2] = (Math.random() - 0.5) * 8 - 1;
          speeds[i] = 0.004 + Math.random() * 0.01;
        }
        const particleGeo = new THREE.BufferGeometry();
        particleGeo.setAttribute(
          "position",
          new THREE.BufferAttribute(positions, 3)
        );
        disposables.push(particleGeo);
        const particleMat = new THREE.PointsMaterial({
          color: 0xe8c766,
          size: 0.05,
          transparent: true,
          opacity: 0.5,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });
        disposables.push(particleMat);
        const goldDustParticles = new THREE.Points(particleGeo, particleMat);
        scene.add(goldDustParticles);

        // FULL cursor parallax on every device.
        let targetX = 0;
        let targetY = 0;
        const handleMouseMove = (e: MouseEvent) => {
          targetX = (e.clientX / window.innerWidth - 0.5) * 0.65;
          targetY = (e.clientY / window.innerHeight - 0.5) * 0.45;
        };
        window.addEventListener("mousemove", handleMouseMove);

        const handleResize = () => {
          if (!renderer) return;
          const w = container.clientWidth || window.innerWidth;
          const h = container.clientHeight || 700;
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
          heroGroup.position.x = w > 1024 ? 1.8 : 0;
        };
        window.addEventListener("resize", handleResize);

        // Invisible efficiency only: skip GPU work while off-screen.
        // Visible animation is NEVER throttled, reduced, or flattened.
        const observer = new IntersectionObserver(
          (entries) => {
            inViewRef.current = entries[0]?.isIntersecting ?? true;
          },
          { threshold: 0.02 }
        );
        observer.observe(container);

        // FULL 60fps animation loop — original movie-trailer pacing, intact.
        const animate = () => {
          animationFrameId = requestAnimationFrame(animate);
          if (
            pausedRef.current ||
            !renderer ||
            !inViewRef.current ||
            document.hidden
          ) {
            return;
          }

          heroGroup.rotation.y += 0.0032;
          heroGroup.rotation.x += 0.0012;
          cageMesh.rotation.y -= 0.0018;
          orbitMesh.rotation.z += 0.004;

          camera.position.x += (targetX - camera.position.x) * 0.04;
          camera.position.y += (-targetY + 0.2 - camera.position.y) * 0.04;

          const posAttr = particleGeo.getAttribute(
            "position"
          ) as THREE.BufferAttribute;
          for (let i = 0; i < particleCount; i++) {
            let y = posAttr.getY(i);
            y += speeds[i];
            if (y > 5) y = -5;
            posAttr.setY(i, y);
          }
          posAttr.needsUpdate = true;

          renderer.render(scene, camera);
        };

        animationFrameId = requestAnimationFrame(animate);

        return () => {
          cancelAnimationFrame(animationFrameId);
          observer.disconnect();
          window.removeEventListener("mousemove", handleMouseMove);
          window.removeEventListener("resize", handleResize);
          disposables.forEach((d) => d.dispose());
          renderer?.dispose();
        };
      } catch {
        // WebGL unavailable (headless / blocked) → CSS fallback below.
        setWebglFailed(true);
        return () => {};
      }
    };

    // Defer heavy WebGL init until AFTER first paint (balanced: no visual cut).
    const w = window as unknown as {
      requestIdleCallback?: (
        cb: () => void,
        opts?: { timeout: number }
      ) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    if (typeof w.requestIdleCallback === "function") {
      const id = w.requestIdleCallback(
        () => {
          if (!disposed) cleanupScene = initScene();
        },
        { timeout: 2500 }
      );
      return () => {
        disposed = true;
        w.cancelIdleCallback?.(id);
        cleanupScene?.();
      };
    }
    const timer = setTimeout(() => {
      if (!disposed) cleanupScene = initScene();
    }, 350);
    return () => {
      disposed = true;
      clearTimeout(timer);
      cleanupScene?.();
    };
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
      {webglFailed ? (
        /* Fallback only when WebGL itself is unavailable — never a replacement. */
        <div className="w-full h-full relative" aria-hidden="true">
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_50%_40%_at_65%_40%,rgba(212,175,55,0.22),transparent_70%)]" />
          <div className="absolute right-[12%] top-[22%] w-56 h-56 rounded-full border border-[#D4AF37]/30 blur-[1px]" />
          <div className="absolute right-[16%] top-[30%] w-36 h-36 rounded-full border border-[#D4AF37]/40" />
          <div className="absolute right-[20%] top-[38%] w-16 h-16 rounded-full bg-[#D4AF37]/25 blur-xl" />
        </div>
      ) : (
        <div ref={mountRef} className="w-full h-full opacity-90" />
      )}

      {/* Accessible 3D Motion Control Pill */}
      {!webglFailed && (
        <div className="pointer-events-auto absolute bottom-6 right-6 z-30 hidden sm:flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPaused(!paused)}
            className="px-3 py-1.5 rounded-sm bg-[#121212]/90 backdrop-blur-md border border-[#2A2A2A] hover:border-[#D4AF37] text-[10px] font-mono-tech uppercase tracking-widest text-[#B3B3B3] hover:text-white flex items-center gap-1.5 transition-colors"
          >
            <Sparkles className="w-3 h-3 text-[#D4AF37]" />
            <span>THREE.JS WEBGL CORE</span>
            {paused ? (
              <Play className="w-3 h-3 text-emerald-400" />
            ) : (
              <Pause className="w-3 h-3 text-[#D4AF37]" />
            )}
          </button>
        </div>
      )}
    </div>
  );
}
