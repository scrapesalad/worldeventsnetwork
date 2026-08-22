import * as THREE from "/morph-pen/vendor/three/build/three.webgpu.js";
import {
  SCENE_CONFIG,
  getCubePoint,
  smoothstep,
  trigNoise,
} from "./scene-core.js";

export function createBlobDeformer({
  vertexCount,
  baseDirections,
  anchorDefinitions,
  pointer,
  getDeformFrameCount,
}) {
  return function deformBlob(geometry, time, options = {}) {
    const positions = geometry.attributes.position.array;
    const innerScale = options.innerScale ?? 1;
    const drift = options.drift ?? 0;
    const coatScale = options.coatScale ?? 0;
    const baseRadius = (options.baseRadius ?? 1.52) * innerScale;
    const bumpScale = options.bumpScale ?? 1;
    const morphProgress = options.morphProgress ?? 0;
    const blobSpreadMultiplier = options.blobSpreadMultiplier ?? 1;
    const reactiveSurfaceBoost = options.reactiveSurfaceBoost ?? 0;
    const reactivePointerBoost = options.reactivePointerBoost ?? 0;
    const reactiveFlowPhase = options.reactiveFlowPhase ?? 0;
    const reactiveFlowSpeed = options.reactiveFlowSpeed ?? 1;
    const reactiveRippleShift = options.reactiveRippleShift ?? 0;
    const reactiveCenterRoundness = options.reactiveCenterRoundness ?? 0;
    const lobeStrengthMultiplier = options.lobeStrengthMultiplier ?? 1;
    const lobePulseAmount = options.lobePulseAmount ?? 0.28;
    const sphericalDirectionBlend = options.sphericalDirectionBlend ?? 0;
    const maxRadius = options.maxRadius ?? 0;
    const flagWaveAmount = options.flagWaveAmount ?? 0;
    const organicMix = 1 - smoothstep(0.55, 0.98, morphProgress);
    const cubeMix = smoothstep(0.68, 0.995, morphProgress);
    const lobeRoundness = 1 - reactiveCenterRoundness * organicMix;
    const surfaceRoundness = 1 - reactiveCenterRoundness * 0.58 * organicMix;
    const pointerX = pointer.x * SCENE_CONFIG.pointerInfluence;
    const pointerY = pointer.y * SCENE_CONFIG.pointerInfluence;
    const reactiveTime = time * reactiveFlowSpeed + reactiveFlowPhase;

    for (let i = 0; i < vertexCount; i += 1) {
      const ix = i * 3;
      const dx = baseDirections[ix];
      const dy = baseDirections[ix + 1];
      const dz = baseDirections[ix + 2];

      let px = dx * baseRadius;
      let py = dy * baseRadius;
      let pz = dz * baseRadius;
      let lobeX = 0;
      let lobeY = 0;
      let lobeZ = 0;

      for (const anchor of anchorDefinitions) {
        const dot = Math.max(0, dx * anchor.dir.x + dy * anchor.dir.y + dz * anchor.dir.z);
        const influence = Math.pow(dot, anchor.tightness);
        const pulse =
          0.72 +
          lobePulseAmount *
            Math.sin(
              reactiveTime * SCENE_CONFIG.wobbleSpeed * anchor.speed +
                anchor.phase +
                reactiveRippleShift * 0.6,
            );
        const pull =
          influence *
          anchor.pull *
          SCENE_CONFIG.blobSpread *
          blobSpreadMultiplier *
          lobeStrengthMultiplier *
          pulse *
          innerScale *
          organicMix *
          lobeRoundness;
        lobeX += anchor.dir.x * pull;
        lobeY += anchor.dir.y * pull;
        lobeZ += anchor.dir.z * pull;
      }

      const noise = trigNoise(dx, dy, dz, reactiveTime * SCENE_CONFIG.wobbleSpeed + drift);
      const ripple =
        Math.sin(
          (dx + dy) * 8.5 +
            reactiveTime * SCENE_CONFIG.wobbleSpeed * 1.35 +
            drift +
            reactiveRippleShift,
        ) *
          0.08 +
        Math.sin(
          (dy - dz) * 10.2 -
            reactiveTime * SCENE_CONFIG.wobbleSpeed * 1.1 -
            reactiveRippleShift * 0.7,
        ) *
          0.05;
      const surface =
        (noise * 0.22 + ripple) *
        (SCENE_CONFIG.wobbleAmount + reactiveSurfaceBoost) *
        bumpScale *
        innerScale *
        organicMix *
        surfaceRoundness;
      const pointerFalloff = Math.max(
        0,
        1 - Math.hypot(dx - pointerX * 0.28, dy - pointerY * 0.28),
      );
      const pointerPush =
        pointerFalloff *
        (SCENE_CONFIG.wobbleAmount + reactivePointerBoost) *
        0.34 *
        organicMix;

      px += lobeX + dx * (surface + pointerPush + coatScale);
      py += lobeY + dy * (surface + pointerPush + coatScale);
      pz += lobeZ + dz * (surface + pointerPush + coatScale);

      // Turn the pre-explosion form into a thin rectangular cloth, then hand off to the cube.
      const flagShapeMix = 1 - smoothstep(0.04, 0.88, morphProgress);
      const flagX = dx * baseRadius * 1.78;
      const flagY = dy * baseRadius * 1.02;
      const flagZ = dz * baseRadius * 0.08;
      px = THREE.MathUtils.lerp(px, flagX, flagShapeMix);
      py = THREE.MathUtils.lerp(py, flagY, flagShapeMix);
      pz = THREE.MathUtils.lerp(pz, flagZ, flagShapeMix);

      if (cubeMix > 0) {
        const cubeRadius = baseRadius * THREE.MathUtils.lerp(1.0, 0.9, morphProgress);
        const cubePoint = getCubePoint(dx, dy, dz, cubeRadius);
        const faceTighten = THREE.MathUtils.lerp(0.98, 1.0, cubeMix);
        px = THREE.MathUtils.lerp(px, cubePoint.x * faceTighten, cubeMix);
        py = THREE.MathUtils.lerp(py, cubePoint.y * faceTighten, cubeMix);
        pz = THREE.MathUtils.lerp(pz, cubePoint.z * faceTighten, cubeMix);
      }

      if (morphProgress > 0.985) {
        const hardCube = getCubePoint(dx, dy, dz, baseRadius * 0.9);
        px = hardCube.x;
        py = hardCube.y;
        pz = hardCube.z;
      }

      if (flagWaveAmount > 0 && morphProgress < 0.985) {
        const wave = Math.sin(
          dx * 4.8 + dy * 2.1 + reactiveTime * 1.7,
        ) * flagWaveAmount;
        pz += wave * (0.72 + Math.abs(dx) * 0.18);
        py += Math.cos(dx * 3.4 + reactiveTime * 1.25) * flagWaveAmount * 0.18;
      }

      if (sphericalDirectionBlend > 0) {
        const radius = Math.hypot(px, py, pz);
        const sphereBlend = sphericalDirectionBlend * organicMix;
        px = THREE.MathUtils.lerp(px, dx * radius, sphereBlend);
        py = THREE.MathUtils.lerp(py, dy * radius, sphereBlend);
        pz = THREE.MathUtils.lerp(pz, dz * radius, sphereBlend);
      }

      if (maxRadius > 0) {
        const radius = Math.hypot(px, py, pz);
        if (radius > maxRadius) {
          const radiusScale = maxRadius / radius;
          px *= radiusScale;
          py *= radiusScale;
          pz *= radiusScale;
        }
      }

      positions[ix] = px;
      positions[ix + 1] = py;
      positions[ix + 2] = pz;
    }

    geometry.attributes.position.needsUpdate = true;

    const normalInterval = options.normalInterval ?? 1;
    const forceNormals = options.forceNormals ?? false;
    if (
      forceNormals ||
      normalInterval <= 1 ||
      getDeformFrameCount() % normalInterval === 0
    ) {
      geometry.computeVertexNormals();
    }
  };
}
