import * as THREE from "/morph-pen/vendor/three/build/three.module.js";
import { HDRLoader } from "/morph-pen/vendor/three/examples/jsm/loaders/HDRLoader.js";
import {
  attachSceneEventBindings,
  createResizeController,
} from "./modules/scene-interactions.js";
import { createMusicReactiveInput } from "./modules/music-reactive-input.js";
import { getMusicReactiveDeformState } from "./modules/music-reactive-mapping.js";

const SCENE_CONFIG = {
  sceneScale: 1.02,
  blobSpread: 0.85,
  wobbleAmount: 0.36,
  wobbleSpeed: 0.93,
  rotationSpeed: 0.59,
  baseTiltX: 0.18,
  pointerInfluence: 0.42,
  exposure: 0.8,
};

const HDR_ENVIRONMENT_URL = "/morph-pen/studio_kontrast_fresh_03_1k.hdr";

function isIosBrowser() {
  return (
    /iPad|iPhone|iPod/.test(window.navigator.userAgent) ||
    (window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1)
  );
}

function createFallbackQualityProfile({ isMobile, supportsWebGL2 }) {
  const useSafeMaterials = isMobile || !supportsWebGL2;

  return {
    antialias: false,
    innerSegments: useSafeMaterials ? 32 : 52,
    pixelRatioCap: isMobile ? 1.62 : 1.8,
    shellNormalInterval: useSafeMaterials ? 6 : 2,
    shellSegments: useSafeMaterials ? 42 : 52,
    useSafeMaterials,
  };
}

function smoothstep(edge0, edge1, x) {
  const t = THREE.MathUtils.clamp((x - edge0) / (edge1 - edge0 || 1), 0, 1);
  return t * t * (3 - 2 * t);
}

function trigNoise(x, y, z, time) {
  return (
    Math.sin(x * 2.2 + time * 0.7) * 0.45 +
    Math.sin(y * 2.8 - time * 0.54) * 0.35 +
    Math.sin(z * 3.1 + time * 0.42) * 0.2
  );
}

function createFallbackEnvironmentMap(renderer) {
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

  try {
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envMap = pmrem.fromEquirectangular(envTexture).texture;
    envTexture.dispose();
    pmrem.dispose();
    return envMap;
  } catch (error) {
    console.warn("WebGL fallback environment generation failed.", error);
    envTexture.dispose();
    return null;
  }
}

function createHdrEnvironmentController({ renderer, scene, generatedEnvironment }) {
  let activeEnvironment = generatedEnvironment;
  let disposed = false;
  let loadTimer = 0;
  scene.environment = generatedEnvironment ?? null;

  const load = () => {
    if (!generatedEnvironment) {
      return Promise.resolve(false);
    }

    return new Promise((resolve) => {
      const startLoad = () => {
        if (disposed) {
          resolve(false);
          return;
        }

        const loader = new HDRLoader();
        loader.load(
          HDR_ENVIRONMENT_URL,
          (texture) => {
            if (disposed) {
              texture.dispose?.();
              resolve(false);
              return;
            }

            try {
              texture.mapping = THREE.EquirectangularReflectionMapping;
              const pmrem = new THREE.PMREMGenerator(renderer);
              const envMap = pmrem.fromEquirectangular(texture).texture;
              pmrem.dispose();
              texture.dispose?.();

              if (activeEnvironment && activeEnvironment !== generatedEnvironment) {
                activeEnvironment.dispose?.();
              }

              activeEnvironment = envMap;
              scene.environment = envMap;
              resolve(true);
            } catch (error) {
              console.warn("WebGL fallback HDR environment failed.", error);
              texture.dispose?.();
              scene.environment = generatedEnvironment;
              resolve(false);
            }
          },
          undefined,
          () => {
            scene.environment = generatedEnvironment;
            resolve(false);
          },
        );
      };

      loadTimer = window.setTimeout(startLoad, isIosBrowser() ? 1200 : 120);
    });
  };

  const dispose = () => {
    disposed = true;
    window.clearTimeout(loadTimer);
    if (activeEnvironment && activeEnvironment !== generatedEnvironment) {
      activeEnvironment.dispose?.();
    }
    generatedEnvironment?.dispose?.();
  };

  return { dispose, load };
}

function getCubePoint(dx, dy, dz, radius) {
  const maxAxis = Math.max(Math.abs(dx), Math.abs(dy), Math.abs(dz), 0.0001);
  const scale = radius / maxAxis;
  return { x: dx * scale, y: dy * scale, z: dz * scale };
}

function createBlobGeometryState(blobBaseGeometry) {
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

  return { vertexCount, baseDirections };
}

function createBlobAnchorDefinitions() {
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

function createBlobDeformer({
  vertexCount,
  baseDirections,
  anchorDefinitions,
  pointer,
  getDeformFrameCount,
}) {
  return function deformBlob(geometry, time, options = {}) {
    const positions = geometry.attributes.position.array;
    const baseRadius = options.baseRadius ?? 1.52;
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
    const coatScale = options.coatScale ?? 0;
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
          organicMix *
          lobeRoundness;
        lobeX += anchor.dir.x * pull;
        lobeY += anchor.dir.y * pull;
        lobeZ += anchor.dir.z * pull;
      }

      const noise = trigNoise(dx, dy, dz, reactiveTime * SCENE_CONFIG.wobbleSpeed);
      const ripple =
        Math.sin((dx + dy) * 8.5 + reactiveTime * SCENE_CONFIG.wobbleSpeed * 1.35 + reactiveRippleShift) * 0.08 +
        Math.sin((dy - dz) * 10.2 - reactiveTime * SCENE_CONFIG.wobbleSpeed * 1.1 - reactiveRippleShift * 0.7) * 0.05;
      const surface =
        (noise * 0.22 + ripple) *
        (SCENE_CONFIG.wobbleAmount + reactiveSurfaceBoost) *
        bumpScale *
        organicMix *
        surfaceRoundness;
      const pointerFalloff = Math.max(0, 1 - Math.hypot(dx - pointerX * 0.28, dy - pointerY * 0.28));
      const pointerPush =
        pointerFalloff *
        (SCENE_CONFIG.wobbleAmount + reactivePointerBoost) *
        0.34 *
        organicMix;

      px += lobeX + dx * (surface + pointerPush + coatScale);
      py += lobeY + dy * (surface + pointerPush + coatScale);
      pz += lobeZ + dz * (surface + pointerPush + coatScale);

      if (cubeMix > 0) {
        const cubeRadius = baseRadius * THREE.MathUtils.lerp(1.0, 0.9, morphProgress);
        const cubePoint = getCubePoint(dx, dy, dz, cubeRadius);
        const faceTighten = THREE.MathUtils.lerp(0.98, 1.0, cubeMix);
        px = THREE.MathUtils.lerp(px, cubePoint.x * faceTighten, cubeMix);
        py = THREE.MathUtils.lerp(py, cubePoint.y * faceTighten, cubeMix);
        pz = THREE.MathUtils.lerp(pz, cubePoint.z * faceTighten, cubeMix);
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
    if (options.forceNormals || normalInterval <= 1 || getDeformFrameCount() % normalInterval === 0) {
      geometry.computeVertexNormals();
    }
  };
}

function getMorphRenderState(scrollProgress) {
  const morphProgress = smoothstep(0.04, 0.5, scrollProgress);
  return {
    morphProgress,
    sharedBlobBumpScale: THREE.MathUtils.lerp(1.28, 0.08, morphProgress),
    forceAllNormals: morphProgress > 0.94,
  };
}

function applySceneTransforms({
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

function createFallbackScrollState() {
  let heroCanvasTrack = null;
  let pauseWrapper = null;
  let cachedScrollProgress = 0;
  let cachedShouldPause = false;

  const updateSceneScrollProgress = () => {
    heroCanvasTrack ??= document.querySelector(".hero-canvas-track");
    if (!heroCanvasTrack) return 0;
    const rect = heroCanvasTrack.getBoundingClientRect();
    const total = Math.max(heroCanvasTrack.offsetHeight - window.innerHeight, 1);
    cachedScrollProgress = THREE.MathUtils.clamp(-rect.top / total, 0, 1);
    return cachedScrollProgress;
  };

  const updatePauseState = () => {
    pauseWrapper ??= document.querySelector(".page-entry-content-inner");
    const pauseWrapperEntered = pauseWrapper
      ? pauseWrapper.getBoundingClientRect().top <= window.innerHeight * 0.32
      : false;
    cachedShouldPause = cachedScrollProgress >= 0.985 && pauseWrapperEntered;
    return cachedShouldPause;
  };

  const refresh = () => {
    updateSceneScrollProgress();
    updatePauseState();
  };

  return {
    getSceneScrollProgress: () => cachedScrollProgress,
    refresh,
    shouldPause: () => cachedShouldPause,
  };
}

function createFallbackRenderLoop({ onFrame, onShouldPause, onScrollStateChange }) {
  let frameId = 0;
  let isRunning = false;
  let disposed = false;
  const clock = new THREE.Clock();

  const stop = () => {
    if (!isRunning) return;
    isRunning = false;
    window.cancelAnimationFrame(frameId);
    frameId = 0;
    clock.stop();
  };

  const animate = () => {
    if (disposed || !isRunning) return;
    if (onShouldPause()) {
      onFrame(0);
      stop();
      return;
    }

    onFrame(Math.min(clock.getDelta(), 0.05));
    frameId = window.requestAnimationFrame(animate);
  };

  const start = () => {
    if (isRunning || onShouldPause()) return;
    isRunning = true;
    clock.start();
    clock.getDelta();
    frameId = window.requestAnimationFrame(animate);
  };

  const handleScroll = () => {
    onScrollStateChange?.();
    if (onShouldPause()) {
      onFrame(0);
      stop();
      return;
    }

    start();
  };

  const handleVisibilityChange = () => {
    if (document.visibilityState === "hidden") {
      stop();
      return;
    }

    handleScroll();
  };

  return {
    dispose() {
      disposed = true;
      stop();
    },
    handleScroll,
    handleVisibilityChange,
    start,
    stop,
  };
}

function createFallbackPointerInput({ canvas }) {
  const pointer = new THREE.Vector2(0, 0);
  const pointerTarget = new THREE.Vector2(0, 0);
  const dragRotation = new THREE.Vector2(0, 0);
  const dragRotationTarget = new THREE.Vector2(0, 0);
  let canvasLeft = 0;
  let canvasTop = 0;
  let canvasWidth = 1;
  let canvasHeight = 1;
  let isDragging = false;
  let activePointerId = null;
  let lastPointerClientX = 0;
  let lastPointerClientY = 0;

  const updateBounds = () => {
    const rect = canvas.getBoundingClientRect();
    canvasLeft = rect.left;
    canvasTop = rect.top;
    canvasWidth = Math.max(rect.width, 1);
    canvasHeight = Math.max(rect.height, 1);
  };

  const updatePointerTargetFromEvent = (event) => {
    const x = canvasWidth > 0 ? (event.clientX - canvasLeft) / canvasWidth : 0.5;
    const y = canvasHeight > 0 ? (event.clientY - canvasTop) / canvasHeight : 0.5;
    pointerTarget.x = x * 2 - 1;
    pointerTarget.y = -(y * 2 - 1);
  };

  const onPointerDown = (event) => {
    activePointerId = event.pointerId;
    isDragging = true;
    lastPointerClientX = event.clientX;
    lastPointerClientY = event.clientY;
    canvas.classList.add("is-dragging");
    canvas.setPointerCapture?.(event.pointerId);
    updatePointerTargetFromEvent(event);
  };

  const onPointerMove = (event) => {
    updatePointerTargetFromEvent(event);
    if (!isDragging || event.pointerId !== activePointerId) return;
    const dx = event.clientX - lastPointerClientX;
    const dy = event.clientY - lastPointerClientY;
    dragRotationTarget.x += (dx / Math.max(canvasWidth, 1)) * Math.PI * 1.2;
    dragRotationTarget.y += (dy / Math.max(canvasHeight, 1)) * Math.PI * 1.2;
    dragRotationTarget.y = THREE.MathUtils.clamp(dragRotationTarget.y, -0.9, 0.9);
    lastPointerClientX = event.clientX;
    lastPointerClientY = event.clientY;
  };

  const endDrag = (event) => {
    if (event && activePointerId !== null && event.pointerId !== activePointerId) return;
    isDragging = false;
    activePointerId = null;
    canvas.classList.remove("is-dragging");
  };

  return {
    dragRotation,
    dragRotationTarget,
    endDrag,
    onPointerDown,
    onPointerMove,
    pointer,
    pointerTarget,
    resetPointer() {
      pointerTarget.set(0, 0);
    },
    updateBounds,
  };
}

export async function initWebGLFallbackScene({ mount, canvas, status }) {
  let disposed = false;
  const statusController = {
    hide() {
      status.hidden = true;
      status.textContent = "";
    },
  };
  const isMobileFallback = isIosBrowser();

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: false,
    alpha: true,
    powerPreference: isMobileFallback ? "high-performance" : "default",
  });
  const qualityProfile = createFallbackQualityProfile({
    isMobile: isMobileFallback,
    supportsWebGL2: renderer.capabilities.isWebGL2,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, qualityProfile.pixelRatioCap));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = SCENE_CONFIG.exposure;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.background = null;
  const generatedEnvironment = createFallbackEnvironmentMap(renderer);
  const environmentController = createHdrEnvironmentController({
    renderer,
    scene,
    generatedEnvironment,
  });
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 80);
  camera.position.set(0, 0.18, 11.5);

  const autoRotateGroup = new THREE.Group();
  const dragGroup = new THREE.Group();
  const world = new THREE.Group();
  dragGroup.add(world);
  autoRotateGroup.add(dragGroup);
  scene.add(autoRotateGroup);

  scene.add(new THREE.AmbientLight(0xffffff, 0.35));
  const keyLight = new THREE.DirectionalLight(0xffffff, 2.1);
  keyLight.position.set(-4, 3, 6);
  scene.add(keyLight);
  const fillLight = new THREE.DirectionalLight(0xf92d04, 5.4);
  fillLight.position.set(4, -2, 4);
  scene.add(fillLight);
  const rimLight = new THREE.DirectionalLight(0xffffff, 1.55);
  rimLight.position.set(0, 1, -6);
  scene.add(rimLight);

  const backdrop = new THREE.Mesh(
    new THREE.PlaneGeometry(28, 18),
    new THREE.MeshBasicMaterial({
      color: new THREE.Color("#dbdbda"),
      depthWrite: false,
      toneMapped: false,
    }),
  );
  backdrop.position.set(0, 0.35, -8.5);
  scene.add(backdrop);

  const useSafeMobileMaterials = qualityProfile.useSafeMaterials;
  const blobBaseGeometry = new THREE.BoxGeometry(
    2.9,
    2.9,
    2.9,
    qualityProfile.shellSegments,
    qualityProfile.shellSegments,
    qualityProfile.shellSegments,
  );
  const innerBaseGeometry = new THREE.BoxGeometry(
    2.9,
    2.9,
    2.9,
    qualityProfile.innerSegments,
    qualityProfile.innerSegments,
    qualityProfile.innerSegments,
  );
  const blobGeometry = blobBaseGeometry.clone();
  const innerGeometry = innerBaseGeometry.clone();
  const coatGeometry = blobBaseGeometry.clone();

  const glassMaterial = useSafeMobileMaterials
    ? new THREE.MeshStandardMaterial({
        color: new THREE.Color("#ffffff"),
        roughness: 0.07,
        metalness: 0,
        transparent: true,
        opacity: 0.42,
        side: THREE.FrontSide,
        depthWrite: false,
      })
    : new THREE.MeshPhysicalMaterial({
        color: new THREE.Color("#ffffff"),
        roughness: 0.12,
        metalness: 0,
        transmission: 0.86,
        thickness: 0.72,
        ior: 1.008,
        reflectivity: 1,
        attenuationColor: new THREE.Color("#ffffff"),
        attenuationDistance: 48,
        clearcoat: 1,
        clearcoatRoughness: 0,
        specularIntensity: 1,
        specularColor: new THREE.Color("#ffffff"),
        transparent: true,
        opacity: 0.92,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
  glassMaterial.envMapIntensity = 1.35;

  const innerMaterial = useSafeMobileMaterials
    ? new THREE.MeshStandardMaterial({
        color: new THREE.Color("#f92d04"),
        roughness: 0.18,
        metalness: 0,
        emissive: new THREE.Color("#f92d04"),
        emissiveIntensity: 1.04,
      })
    : new THREE.MeshPhysicalMaterial({
        color: new THREE.Color("#f92d04"),
        roughness: 0.14,
        metalness: 0,
        transmission: 0,
        thickness: 0,
        ior: 1,
        reflectivity: 0.2,
        attenuationColor: new THREE.Color("#f92d04"),
        attenuationDistance: 0.1,
        clearcoat: 0.06,
        emissive: new THREE.Color("#f92d04"),
        emissiveIntensity: 1.08,
      });
  innerMaterial.envMapIntensity = 0.72;

  const coatMaterial = useSafeMobileMaterials
    ? new THREE.MeshStandardMaterial({
        color: new THREE.Color("#ffffff"),
        roughness: 0.02,
        metalness: 0,
        transparent: true,
        opacity: 0.08,
        depthWrite: false,
        side: THREE.FrontSide,
      })
    : new THREE.MeshPhysicalMaterial({
        color: new THREE.Color("#ffffff"),
        roughness: 0,
        metalness: 0,
        transmission: 1,
        thickness: 0.01,
        ior: 1.001,
        reflectivity: 1,
        clearcoat: 0,
        clearcoatRoughness: 0,
        transparent: true,
        opacity: 0.12,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
  coatMaterial.envMapIntensity = useSafeMobileMaterials ? 2.35 : 1.8;

  const shellMesh = new THREE.Mesh(blobGeometry, glassMaterial);
  const innerMesh = new THREE.Mesh(innerGeometry, innerMaterial);
  const coatMesh = new THREE.Mesh(useSafeMobileMaterials ? blobGeometry : coatGeometry, coatMaterial);
  shellMesh.renderOrder = 2;
  innerMesh.renderOrder = 1;
  coatMesh.renderOrder = 3;
  coatMesh.scale.setScalar(useSafeMobileMaterials ? 1.006 : 1);
  world.add(shellMesh, innerMesh, coatMesh);

  const scrollPauseState = createFallbackScrollState();
  const musicReactiveInput = createMusicReactiveInput();
  const pointerInput = createFallbackPointerInput({ canvas });
  const shellGeometryState = createBlobGeometryState(blobBaseGeometry);
  const innerGeometryState = createBlobGeometryState(innerBaseGeometry);
  const anchorDefinitions = createBlobAnchorDefinitions();
  const deformBlob = createBlobDeformer({
    ...shellGeometryState,
    anchorDefinitions,
    pointer: pointerInput.pointer,
    getDeformFrameCount: () => deformFrameCount,
  });
  const deformInnerBlob = createBlobDeformer({
    ...innerGeometryState,
    anchorDefinitions,
    pointer: pointerInput.pointer,
    getDeformFrameCount: () => deformFrameCount,
  });

  let deformFrameCount = 0;
  let responsiveSceneScale = 1;
  let autoRotationY = 0;
  let innerCoreScale = 1;
  let easedMusicImpact = 0;
  let easedMusicLimbImpact = 0;
  const baseRotation = {
    x: SCENE_CONFIG.baseTiltX,
    y: 0,
    z: 0,
  };

  const { onResize } = createResizeController({
    mount,
    camera,
    renderer,
    pointerInput,
    scrollPauseState,
    onScaleChange: (scale) => {
      responsiveSceneScale = scale;
    },
  });

  const clock = new THREE.Clock();
  const renderFrame = () => {
    deformFrameCount += 1;
    const dt = Math.min(clock.getDelta(), 0.05);
    const elapsed = clock.elapsedTime;
    const scrollProgress = scrollPauseState.getSceneScrollProgress();
    const { morphProgress, sharedBlobBumpScale, forceAllNormals } =
      getMorphRenderState(scrollProgress);
    const musicReactiveState = musicReactiveInput.getState();
    const musicReactive = getMusicReactiveDeformState({
      elapsed,
      musicReactiveState,
    });

    easedMusicImpact = THREE.MathUtils.lerp(
      easedMusicImpact,
      musicReactive.impact,
      1 - Math.pow(1 - (musicReactive.impact > easedMusicImpact ? 0.3 : 0.075), dt * 60),
    );
    const limbImpact = musicReactive.limbImpact ?? musicReactive.impact;
    easedMusicLimbImpact = THREE.MathUtils.lerp(
      easedMusicLimbImpact,
      limbImpact,
      1 - Math.pow(1 - (limbImpact > easedMusicLimbImpact ? 0.2 : 0.035), dt * 60),
    );

    const playingInnerCoreScale = musicReactiveState.isPlaying || musicReactiveState.isActive
      ? THREE.MathUtils.lerp(0.72, 0.54, easedMusicImpact)
      : 1;
    innerCoreScale = THREE.MathUtils.lerp(innerCoreScale, playingInnerCoreScale, 1 - Math.pow(0.0025, dt));
    const coreSurfaceReaction = musicReactiveState.isPlaying || musicReactiveState.isActive
      ? THREE.MathUtils.lerp(0.08, 0.7, easedMusicImpact)
      : 1;
    const coreLobeReaction = musicReactiveState.isPlaying || musicReactiveState.isActive
      ? THREE.MathUtils.lerp(0.08, 0.95, easedMusicLimbImpact)
      : 1;

    deformBlob(blobGeometry, elapsed, {
      baseRadius: 1.64,
      bumpScale: sharedBlobBumpScale * 0.72,
      blobSpreadMultiplier: THREE.MathUtils.lerp(1, musicReactive.blobSpreadMultiplier, 0.24),
      morphProgress,
      reactiveSurfaceBoost: musicReactive.surfaceBoost * 0.18,
      reactivePointerBoost: musicReactive.pointerBoost * 0.12,
      reactiveFlowPhase: musicReactive.flowPhase * 0.35,
      reactiveFlowSpeed: THREE.MathUtils.lerp(1, musicReactive.flowSpeed, 0.35),
      reactiveRippleShift: musicReactive.rippleShift * 0.26,
      reactiveCenterRoundness: 0.62,
      forceNormals: !useSafeMobileMaterials && forceAllNormals,
      normalInterval: qualityProfile.shellNormalInterval,
    });
    deformInnerBlob(innerGeometry, elapsed, {
      baseRadius: 1.64 * 0.6 * innerCoreScale,
      bumpScale: sharedBlobBumpScale * coreSurfaceReaction,
      blobSpreadMultiplier: musicReactive.blobSpreadMultiplier,
      lobeStrengthMultiplier: coreLobeReaction,
      morphProgress,
      reactiveSurfaceBoost: musicReactive.surfaceBoost * coreSurfaceReaction,
      reactivePointerBoost: musicReactive.pointerBoost * 0.62,
      reactiveFlowPhase: musicReactive.flowPhase * 0.92,
      reactiveFlowSpeed: musicReactive.flowSpeed,
      reactiveRippleShift: musicReactive.rippleShift * 0.72,
      reactiveCenterRoundness: 0,
      sphericalDirectionBlend: musicReactiveState.isPlaying || musicReactiveState.isActive ? 0.68 : 0,
      maxRadius: 1.58,
      forceNormals: !useSafeMobileMaterials && forceAllNormals,
      normalInterval: qualityProfile.shellNormalInterval,
    });
    if (!useSafeMobileMaterials && coatMesh.visible) {
      deformBlob(coatGeometry, elapsed, {
        baseRadius: 1.648,
        coatScale: 0.008,
        bumpScale: THREE.MathUtils.lerp(0.22, 0.04, morphProgress),
        blobSpreadMultiplier: musicReactive.blobSpreadMultiplier,
        morphProgress,
        reactiveSurfaceBoost: musicReactive.surfaceBoost * 0.28,
        reactivePointerBoost: musicReactive.pointerBoost * 0.22,
        reactiveFlowPhase: musicReactive.flowPhase * 0.7,
        reactiveFlowSpeed: musicReactive.flowSpeed,
        reactiveRippleShift: musicReactive.rippleShift * 0.72,
        reactiveCenterRoundness: musicReactive.centerRoundness * 0.82,
        forceNormals: forceAllNormals,
        normalInterval: 3,
      });
    }

    autoRotationY = applySceneTransforms({
      dt,
      scrollProgress,
      morphProgress,
      responsiveSceneScale,
      autoRotateGroup,
      dragGroup,
      world,
      camera,
      baseRotation,
      pointer: pointerInput.pointer,
      dragRotation: pointerInput.dragRotation,
      autoRotationY,
    });

    renderer.render(scene, camera);
  };

  const renderLoop = createFallbackRenderLoop({
    onFrame: renderFrame,
    onShouldPause: () => disposed || document.visibilityState === "hidden" || scrollPauseState.shouldPause(),
    onScrollStateChange: () => scrollPauseState.refresh(),
  });
  const detachSceneEventBindings = attachSceneEventBindings({
    canvas,
    pointerInput,
    renderLoop,
    onResize,
  });

  onResize();
  scrollPauseState.refresh();
  const environmentLoadPromise = environmentController.load();
  renderFrame();
  if (isMobileFallback) {
    await environmentLoadPromise;
  }
  renderLoop.start();
  statusController.hide();

  return () => {
    disposed = true;
    renderLoop.dispose();
    detachSceneEventBindings();
    musicReactiveInput.dispose();
    blobBaseGeometry.dispose();
    innerBaseGeometry.dispose();
    blobGeometry.dispose();
    innerGeometry.dispose();
    coatGeometry.dispose();
    glassMaterial.dispose();
    innerMaterial.dispose();
    coatMaterial.dispose();
    backdrop.geometry.dispose();
    backdrop.material.dispose();
    environmentController.dispose();
    renderer.dispose();
  };
}
