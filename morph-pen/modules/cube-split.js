import * as THREE from "/morph-pen/vendor/three/build/three.webgpu.js";
import { smoothstep } from "./scene-core.js";

const SPLIT_GRID_SIZE = 6;
const SPLIT_CUBE_COUNT = SPLIT_GRID_SIZE ** 3;
const FINAL_CUBE_RADIUS = 1.64 * 0.9;
const SPLIT_CUBE_SIZE = (FINAL_CUBE_RADIUS * 2) / SPLIT_GRID_SIZE;
const SPLIT_ROTATION_SCALE = 0.32;

function seededRandom(seed) {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

function createSplitCubeTargets() {
  const half = (SPLIT_GRID_SIZE - 1) * 0.5;
  const targets = [];

  for (let z = 0; z < SPLIT_GRID_SIZE; z += 1) {
    for (let y = 0; y < SPLIT_GRID_SIZE; y += 1) {
      for (let x = 0; x < SPLIT_GRID_SIZE; x += 1) {
        const index = targets.length;
        const start = new THREE.Vector3(
          (x - half) * SPLIT_CUBE_SIZE,
          (y - half) * SPLIT_CUBE_SIZE,
          (z - half) * SPLIT_CUBE_SIZE,
        );
        const direction = start.clone().normalize();
        if (direction.lengthSq() < 0.001) {
          direction.set(
            seededRandom(index + 1) - 0.5,
            seededRandom(index + 2) - 0.5,
            seededRandom(index + 3) - 0.5,
          ).normalize();
        }

        const randomOffset = new THREE.Vector3(
          seededRandom(index + 11) - 0.5,
          seededRandom(index + 23) - 0.5,
          seededRandom(index + 37) - 0.5,
        ).multiplyScalar(2.5);
        const distance = 3.8 + seededRandom(index + 51) * 3.6;
        const end = start.clone().add(direction.multiplyScalar(distance)).add(randomOffset);
        const rotation = new THREE.Euler(
          (seededRandom(index + 71) - 0.5) * Math.PI * 2.6,
          (seededRandom(index + 89) - 0.5) * Math.PI * 2.6,
          (seededRandom(index + 103) - 0.5) * Math.PI * 2.6,
        );

        targets.push({ start, end, rotation });
      }
    }
  }

  return targets;
}

function createSplitMesh({ geometry, material, renderOrder }) {
  const splitMaterial = material.clone();
  splitMaterial.transparent = true;
  splitMaterial.opacity = 0;
  splitMaterial.depthWrite = false;

  const mesh = new THREE.InstancedMesh(geometry, splitMaterial, SPLIT_CUBE_COUNT);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.visible = false;
  mesh.renderOrder = renderOrder;

  return {
    mesh,
    material: splitMaterial,
  };
}

export function createCubeSplit({ world, glassMaterial }) {
  const geometry = new THREE.BoxGeometry(SPLIT_CUBE_SIZE, SPLIT_CUBE_SIZE, SPLIT_CUBE_SIZE);

  const shellSplit = createSplitMesh({ geometry, material: glassMaterial, renderOrder: 5 });
  shellSplit.material.opacity = 0;
  world.add(shellSplit.mesh);

  const targets = createSplitCubeTargets();
  const dummy = new THREE.Object3D();

  function update(splitProgress) {
    const isVisible = splitProgress > 0.001;
    shellSplit.mesh.visible = isVisible;
    shellSplit.material.opacity = isVisible ? 0.92 : 0;

    if (!isVisible) {
      return splitProgress;
    }

    for (let index = 0; index < targets.length; index += 1) {
      const target = targets[index];
      const stagger = seededRandom(index + 137) * 0.08;
      const localProgress = smoothstep(0, 1, Math.max(0, (splitProgress - stagger) / 0.96));
      dummy.position.lerpVectors(target.start, target.end, localProgress);
      dummy.rotation.set(
        target.rotation.x * localProgress * SPLIT_ROTATION_SCALE,
        target.rotation.y * localProgress * SPLIT_ROTATION_SCALE,
        target.rotation.z * localProgress * SPLIT_ROTATION_SCALE,
      );
      dummy.scale.setScalar(THREE.MathUtils.lerp(1, 0.72, localProgress));
      dummy.updateMatrix();
      shellSplit.mesh.setMatrixAt(index, dummy.matrix);
    }

    shellSplit.mesh.instanceMatrix.needsUpdate = true;
    return splitProgress;
  }

  update(0);

  return {
    shellMesh: shellSplit.mesh,
    shellMaterial: shellSplit.material,
    geometry,
    update,
    dispose() {
      world.remove(shellSplit.mesh);
      geometry.dispose();
      shellSplit.material.dispose();
    },
  };
}
