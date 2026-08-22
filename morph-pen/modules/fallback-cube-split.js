import * as THREE from "/morph-pen/vendor/three/build/three.module.js";

const GRID = 6;
const COUNT = GRID ** 3;
const SIZE = (1.64 * 0.9 * 2) / GRID;

function random(seed) {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

function smoothstep(value) {
  const t = Math.max(0, Math.min(1, value));
  return t * t * (3 - 2 * t);
}

export function createFallbackCubeSplit({ world, material }) {
  const geometry = new THREE.BoxGeometry(SIZE, SIZE, SIZE);
  const splitMaterial = material.clone();
  splitMaterial.transparent = true;
  splitMaterial.depthWrite = false;
  splitMaterial.opacity = 0;
  const meshes = [];
  const half = (GRID - 1) * 0.5;
  const targets = [];

  for (let z = 0; z < GRID; z += 1) {
    for (let y = 0; y < GRID; y += 1) {
      for (let x = 0; x < GRID; x += 1) {
        const index = targets.length;
        const start = new THREE.Vector3((x - half) * SIZE, (y - half) * SIZE, (z - half) * SIZE);
        const direction = start.clone().normalize();
        if (direction.lengthSq() < 0.001) {
          direction.set(random(index + 1) - 0.5, random(index + 2) - 0.5, random(index + 3) - 0.5).normalize();
        }
        const end = start.clone().add(direction.multiplyScalar(3.8 + random(index + 51) * 3.6));
        end.add(new THREE.Vector3(random(index + 11) - 0.5, random(index + 23) - 0.5, random(index + 37) - 0.5).multiplyScalar(2.5));
        const mesh = new THREE.Mesh(geometry, splitMaterial);
        mesh.visible = false;
        mesh.renderOrder = 5;
        world.add(mesh);
        meshes.push(mesh);
        targets.push({ start, end, rotation: new THREE.Euler((random(index + 71) - 0.5) * 8, (random(index + 89) - 0.5) * 8, (random(index + 103) - 0.5) * 8) });
      }
    }
  }

  function update(progress) {
    const active = progress > 0.001;
    splitMaterial.opacity = active ? 0.92 : 0;
    meshes.forEach((mesh, index) => {
      const target = targets[index];
      const local = smoothstep((progress - random(index + 137) * 0.08) / 0.96);
      mesh.visible = active;
      mesh.position.lerpVectors(target.start, target.end, local);
      mesh.rotation.set(target.rotation.x * local * 0.32, target.rotation.y * local * 0.32, target.rotation.z * local * 0.32);
      mesh.scale.setScalar(1 - local * 0.28);
    });
  }

  update(0);
  return {
    update,
    dispose() {
      meshes.forEach((mesh) => world.remove(mesh));
      geometry.dispose();
      splitMaterial.dispose();
    },
  };
}
