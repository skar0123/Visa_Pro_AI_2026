"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function Background3D() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    // ── Wireframe globe ──────────────────────────────────────────────────────
    const globeGeo = new THREE.IcosahedronGeometry(2, 3);
    const globeMat = new THREE.MeshBasicMaterial({
      color: 0x0066ff,
      wireframe: true,
      transparent: true,
      opacity: 0.055,
    });
    const globe = new THREE.Mesh(globeGeo, globeMat);
    globe.position.set(1.5, 0, 0);
    scene.add(globe);

    // ── Inner glow sphere ────────────────────────────────────────────────────
    const innerGeo = new THREE.SphereGeometry(1.6, 16, 16);
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0x001a4d,
      transparent: true,
      opacity: 0.12,
    });
    const innerSphere = new THREE.Mesh(innerGeo, innerMat);
    innerSphere.position.set(1.5, 0, 0);
    scene.add(innerSphere);

    // ── Floating particles ───────────────────────────────────────────────────
    const count = 180;
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 12;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 8;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 6;
      sizes[i] = Math.random() * 0.8 + 0.2;
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

    const particleMat = new THREE.PointsMaterial({
      color: 0x00d4ff,
      size: 0.025,
      transparent: true,
      opacity: 0.35,
      sizeAttenuation: true,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // ── Small accent nodes ───────────────────────────────────────────────────
    const nodeMat = new THREE.MeshBasicMaterial({ color: 0x00d4ff, transparent: true, opacity: 0.6 });
    const nodePositions = [
      [-3, 1.5, -1], [3, -1, -0.5], [-2, -2, 0.5], [4, 2, -1.5], [-4, 0, 1],
    ];
    nodePositions.forEach(([x, y, z]) => {
      const geo = new THREE.SphereGeometry(0.04, 8, 8);
      const node = new THREE.Mesh(geo, nodeMat);
      node.position.set(x, y, z);
      scene.add(node);
    });

    // ── Animation ─────────────────────────────────────────────────────────
    let animId: number;
    let time = 0;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      time += 0.004;

      globe.rotation.y  = time * 0.18;
      globe.rotation.x  = time * 0.06;
      globe.position.y  = Math.sin(time * 0.4) * 0.12;

      innerSphere.rotation.y = time * 0.1;
      innerSphere.position.y = globe.position.y;

      particles.rotation.y = -time * 0.04;
      particles.rotation.x =  time * 0.015;

      renderer.render(scene, camera);
    };
    animate();

    // ── Resize ───────────────────────────────────────────────────────────────
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", onResize);

    // ── Cleanup ──────────────────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      globeGeo.dispose();
      globeMat.dispose();
      innerGeo.dispose();
      innerMat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  );
}
