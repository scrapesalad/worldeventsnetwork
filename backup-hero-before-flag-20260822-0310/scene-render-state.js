import * as THREE from "/morph-pen/vendor/three/build/three.webgpu.js";
import { SCENE_CONFIG, smoothstep } from "./scene-core.js";

const MORPH_START_PROGRESS = 0.04;
const MORPH_END_PROGRESS = 0.5;
const SPLIT_START_PROGRESS = 0.5;
const SPLIT_END_PROGRESS = 0.96;

export function getMorphRenderState(scrollProgress) {
  const morphProgress = smoothstep(MORPH_START_PROGRESS, MORPH_END_PROGRESS, scrollProgress);
  const splitProgress = smoothstep(SPLIT_START_PROGRESS, SPLIT_END_PROGRESS, scrollProgress);

  return {
    morphProgress,
    splitProgress,
    scrollScale: THREE.MathUtils.lerp(1, 0.5, morphProgress),
    sharedBlobBumpScale: THREE.MathUtils.lerp(1.28, 0.08, morphProgress),
    forceAllNormals: morphProgress > 0.94,
  };
}

export function applySceneTransforms({
  dt,
  scrollProgress,
  morphProgress,
  responsiveSceneScale,
  autoRotateGroup,
  dragGroup,
  world,
  camera,
  baseRotation,
  pointer,
  dragRotation,
  autoRotationY,
}) {
  const nextAutoRotationY = autoRotationY + dt * SCENE_CONFIG.rotationSpeed;
  autoRotateGroup.rotation.y = nextAutoRotationY;
  dragGroup.rotation.y = THREE.MathUtils.lerp(dragGroup.rotation.y, dragRotation.x, 0.18);
  dragGroup.rotation.x = THREE.MathUtils.lerp(dragGroup.rotation.x, dragRotation.y, 0.18);
  world.rotation.y = THREE.MathUtils.lerp(
    world.rotation.y,
    baseRotation.y + pointer.x * 0.1 * (1 - morphProgress * 0.6),
    0.05,
  );
  world.rotation.x = THREE.MathUtils.lerp(
    world.rotation.x,
    baseRotation.x + pointer.y * 0.18 * (1 - morphProgress * 0.35),
    0.08,
  );
  world.rotation.z = THREE.MathUtils.lerp(
    world.rotation.z,
    baseRotation.z - pointer.x * 0.12 * (1 - morphProgress * 0.35),
    0.06,
  );
  world.scale.setScalar(
    SCENE_CONFIG.sceneScale * responsiveSceneScale * THREE.MathUtils.lerp(1, 0.5, morphProgress),
  );

  camera.position.z = THREE.MathUtils.lerp(11.5, 7.4, Math.pow(scrollProgress, 1.35));
  camera.position.y = THREE.MathUtils.lerp(0.18, -0.12, scrollProgress);
  camera.lookAt(0, 0, 0);

  return nextAutoRotationY;
}
