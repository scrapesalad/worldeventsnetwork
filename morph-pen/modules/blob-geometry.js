import * as THREE from "/morph-pen/vendor/three/build/three.webgpu.js";

export function createBlobGeometryState(blobBaseGeometry) {
  const vertexCount = blobBaseGeometry.attributes.position.count;
  const basePositions = blobBaseGeometry.attributes.position.array.slice();
  const baseDirections = new Float32Array(vertexCount * 3);

  for (let i = 0; i < vertexCount; i += 1) {
    const ix = i * 3;
    const x = basePositions[ix];
    const y = basePositions[ix + 1];
    const z = basePositions[ix + 2];
    const len = Math.hypot(x, y, z) || 1;
    baseDirections[ix] = x / len;
    baseDirections[ix + 1] = y / len;
    baseDirections[ix + 2] = z / len;
  }

  return {
    vertexCount,
    basePositions,
    baseDirections,
  };
}

export function createBlobAnchorDefinitions() {
  return [
    { dir: new THREE.Vector3(1.15, 0.52, 0.08).normalize(), pull: 1.35, tightness: 6.6, speed: 1.1, phase: 0 },
    { dir: new THREE.Vector3(-1.0, 0.96, 0.34).normalize(), pull: 1.05, tightness: 7.4, speed: 1.32, phase: 0.8 },
    { dir: new THREE.Vector3(0.98, -0.95, 0.86).normalize(), pull: 0.98, tightness: 6.9, speed: 1.24, phase: 1.4 },
    { dir: new THREE.Vector3(-1.2, -0.62, -0.22).normalize(), pull: 1.18, tightness: 7.6, speed: 1.08, phase: 2.1 },
    { dir: new THREE.Vector3(0.18, 1.42, -0.76).normalize(), pull: 0.82, tightness: 8.4, speed: 1.46, phase: 2.8 },
    { dir: new THREE.Vector3(-0.08, -1.36, -0.84).normalize(), pull: 0.9, tightness: 8.0, speed: 1.18, phase: 3.2 },
    { dir: new THREE.Vector3(1.02, 0.02, -1.18).normalize(), pull: 0.74, tightness: 8.8, speed: 1.58, phase: 3.8 },
    { dir: new THREE.Vector3(-0.92, 0.24, 1.1).normalize(), pull: 0.7, tightness: 9.2, speed: 1.66, phase: 4.2 },
  ];
}
