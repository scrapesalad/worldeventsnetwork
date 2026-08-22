import * as THREE from "/morph-pen/vendor/three/build/three.webgpu.js";

export const ENVIRONMENT_URLS = {
  "studio-hdr": new URL("../studio_kontrast_fresh_03_1k.hdr", import.meta.url).href,
};

export const SCENE_CONFIG = {
  sceneScale: 1.02,
  blobSpread: 0.85,
  wobbleAmount: 0.36,
  wobbleSpeed: 0.93,
  rotationSpeed: 0.59,
  baseTiltX: 0.18,
  pointerInfluence: 0.42,
  exposure: 0.8,
  ambientIntensity: 0.03,
  keyIntensity: 2.1,
  fillIntensity: 8.9,
  rimIntensity: 1.55,
  floorIntensity: 0.08,
  transmission: 1,
  thickness: 5.8,
  ior: 1.08,
  roughness: 0.6,
  clearcoat: 1,
  reflectivity: 1,
  attenuationDistance: 1.9,
  envBlur: 0,
};

export function smoothstep(edge0, edge1, x) {
  const t = THREE.MathUtils.clamp((x - edge0) / (edge1 - edge0 || 1), 0, 1);
  return t * t * (3 - 2 * t);
}

export function getCubePoint(dx, dy, dz, radius) {
  const maxAxis = Math.max(Math.abs(dx), Math.abs(dy), Math.abs(dz), 0.0001);
  const scale = radius / maxAxis;
  return { x: dx * scale, y: dy * scale, z: dz * scale };
}

export function trigNoise(x, y, z, time) {
  return (
    Math.sin(x * 2.2 + time * 0.7) * 0.45 +
    Math.sin(y * 2.8 - time * 0.54) * 0.35 +
    Math.sin(z * 3.1 + time * 0.42) * 0.2
  );
}

export function createEnvironmentMap(renderer) {
  const envCanvas = document.createElement("canvas");
  envCanvas.width = 1024;
  envCanvas.height = 512;
  const ctx = envCanvas.getContext("2d");

  const gradient = ctx.createLinearGradient(0, 0, envCanvas.width, envCanvas.height);
  gradient.addColorStop(0, "#f6f1e8");
  gradient.addColorStop(0.24, "#ffffff");
  gradient.addColorStop(0.52, "#f92d04");
  gradient.addColorStop(0.76, "#f6f1e8");
  gradient.addColorStop(1, "#050505");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, envCanvas.width, envCanvas.height);

  ctx.globalCompositeOperation = "screen";

  const glowA = ctx.createRadialGradient(220, 180, 10, 220, 180, 210);
  glowA.addColorStop(0, "rgba(255, 255, 255, 0.92)");
  glowA.addColorStop(0.35, "rgba(255, 255, 255, 0.22)");
  glowA.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = glowA;
  ctx.fillRect(0, 0, envCanvas.width, envCanvas.height);

  const glowB = ctx.createRadialGradient(760, 180, 10, 760, 180, 240);
  glowB.addColorStop(0, "rgba(249, 45, 4, 0.92)");
  glowB.addColorStop(0.28, "rgba(249, 45, 4, 0.24)");
  glowB.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = glowB;
  ctx.fillRect(0, 0, envCanvas.width, envCanvas.height);

  const glowC = ctx.createRadialGradient(512, 300, 10, 512, 300, 260);
  glowC.addColorStop(0, "rgba(5, 5, 5, 0.22)");
  glowC.addColorStop(0.3, "rgba(249, 45, 4, 0.12)");
  glowC.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = glowC;
  ctx.fillRect(0, 0, envCanvas.width, envCanvas.height);

  const envTexture = new THREE.CanvasTexture(envCanvas);
  envTexture.mapping = THREE.EquirectangularReflectionMapping;
  envTexture.colorSpace = THREE.SRGBColorSpace;

  const pmrem = new THREE.PMREMGenerator(renderer);
  const envMap = pmrem.fromEquirectangular(envTexture).texture;
  envTexture.dispose();
  pmrem.dispose();
  return envMap;
}
