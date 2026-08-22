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

        targets.push({ start, end, rotation, gridX: x, gridY: y, gridZ: z });
      }
    }
  }

  return targets;
}

function createSplitMesh({ geometry, material, renderOrder, targets }) {
  const splitMaterial = material.clone();
  splitMaterial.transparent = true;
  splitMaterial.opacity = 0;
  splitMaterial.depthWrite = false;

  const meshes = [];
  const baseUv = geometry.attributes.uv.array.slice();
  for (let index = 0; index < SPLIT_CUBE_COUNT; index += 1) {
    const fragmentGeometry = geometry.clone();
    const target = targets[index];
    const uv = fragmentGeometry.attributes.uv.array;
    for (let uvIndex = 0; uvIndex < uv.length; uvIndex += 2) {
      uv[uvIndex] = (target.gridX + baseUv[uvIndex]) / SPLIT_GRID_SIZE;
      uv[uvIndex + 1] = (target.gridY + baseUv[uvIndex + 1]) / SPLIT_GRID_SIZE;
    }
    fragmentGeometry.attributes.uv.needsUpdate = true;
    const mesh = new THREE.Mesh(fragmentGeometry, splitMaterial);
    mesh.visible = false;
    mesh.renderOrder = renderOrder;
    meshes.push(mesh);
  }

  return {
    meshes,
    material: splitMaterial,
  };
}

export function createCubeSplit({ world, glassMaterial }) {
  const geometry = new THREE.BoxGeometry(SPLIT_CUBE_SIZE, SPLIT_CUBE_SIZE, SPLIT_CUBE_SIZE);

  const targets = createSplitCubeTargets();
  const shellSplit = createSplitMesh({
    geometry,
    material: glassMaterial,
    renderOrder: 5,
    targets,
  });
  shellSplit.material.opacity = 0;
  world.add(...shellSplit.meshes);
  const dummy = new THREE.Object3D();

  function update(splitProgress) {
    const isVisible = splitProgress > 0.001;
    shellSplit.meshes.forEach((mesh) => {
      mesh.visible = isVisible;
    });
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
      shellSplit.meshes[index].position.copy(dummy.position);
      shellSplit.meshes[index].rotation.copy(dummy.rotation);
      shellSplit.meshes[index].scale.copy(dummy.scale);
    }

    return splitProgress;
  }

  update(0);

  return {
    shellMesh: shellSplit.meshes,
    shellMaterial: shellSplit.material,
    geometry,
    update,
    dispose() {
      shellSplit.meshes.forEach((mesh) => {
        world.remove(mesh);
        mesh.geometry.dispose();
      });
      geometry.dispose();
      shellSplit.material.dispose();
    },
  };
}
