import * as THREE from "/morph-pen/vendor/three/build/three.webgpu.js";
import { RectAreaLightTexturesLib } from "/morph-pen/vendor/three/examples/jsm/lights/RectAreaLightTexturesLib.js";
import { SCENE_CONFIG } from "./scene-core.js";

export function initializeRectAreaLightTextures() {
  const rectAreaLTC = RectAreaLightTexturesLib.init();
  if (THREE.RectAreaLightNode?.setLTC) {
    THREE.RectAreaLightNode.setLTC(rectAreaLTC);
  }
}

function configureRenderer(renderer, pixelRatioCap) {
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, pixelRatioCap));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = SCENE_CONFIG.exposure;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
}

export async function createRenderer({ canvas, onRecoveryAttempt }) {
  const profiles = [
    {
      antialias: true,
      powerPreference: "high-performance",
      pixelRatioCap: 1.25,
    },
    {
      antialias: false,
      powerPreference: "default",
      pixelRatioCap: 1,
      isRecovery: true,
    },
  ];

  let lastError;

  for (const profile of profiles) {
    const renderer = new THREE.WebGPURenderer({
      canvas,
      antialias: profile.antialias,
      alpha: true,
      powerPreference: profile.powerPreference,
    });

    configureRenderer(renderer, profile.pixelRatioCap);

    try {
      await renderer.init();
      return renderer;
    } catch (error) {
      lastError = error;
      renderer.dispose();

      if (profile.isRecovery) {
        break;
      }

      onRecoveryAttempt?.();
      await new Promise((resolve) => window.setTimeout(resolve, 120));
    }
  }

  throw lastError ?? new Error("WebGPU renderer failed to initialize.");
}

export function createSceneGraph() {
  const scene = new THREE.Scene();
  scene.background = null;

  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 80);
  camera.position.set(0, 0.18, 11.5);

  const autoRotateGroup = new THREE.Group();
  const dragGroup = new THREE.Group();
  const world = new THREE.Group();
  dragGroup.add(world);
  autoRotateGroup.add(dragGroup);
  scene.add(autoRotateGroup);

  return {
    scene,
    camera,
    autoRotateGroup,
    dragGroup,
    world,
  };
}

export function createSceneLighting({ scene }) {
  const ambient = new THREE.AmbientLight(0xffffff, SCENE_CONFIG.ambientIntensity);
  scene.add(ambient);

  const keyLight = new THREE.RectAreaLight(0xffffff, SCENE_CONFIG.keyIntensity, 7.5, 12.5);
  keyLight.position.set(-5.6, 2.8, 6.2);
  keyLight.lookAt(0, 0.4, 0);
  scene.add(keyLight);

  const fillLight = new THREE.RectAreaLight(0xf92d04, SCENE_CONFIG.fillIntensity, 5.4, 10.8);
  fillLight.position.set(5.3, -1.6, 4.8);
  fillLight.lookAt(0, -0.2, 0);
  scene.add(fillLight);

  const rimLight = new THREE.RectAreaLight(0xf92d04, SCENE_CONFIG.rimIntensity, 11.2, 3.8);
  rimLight.position.set(0.1, 0.4, -7.2);
  rimLight.lookAt(0, 0.2, 0);
  scene.add(rimLight);

  const floorLight = new THREE.PointLight(0xffffff, SCENE_CONFIG.floorIntensity, 24, 2);
  floorLight.position.set(0, -4.8, 1.8);
  scene.add(floorLight);

  return {
    ambient,
    keyLight,
    fillLight,
    rimLight,
    floorLight,
  };
}

export function createSceneSurfaces({ scene }) {
  const backdrop = new THREE.Mesh(
    new THREE.PlaneGeometry(28, 18),
    new THREE.MeshBasicMaterial({
      color: new THREE.Color("#ffffff"),
      depthWrite: false,
      toneMapped: false,
    }),
  );
  backdrop.position.set(0, 0.35, -8.5);
  scene.add(backdrop);

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(14, 96),
    new THREE.MeshBasicMaterial({
      color: new THREE.Color("#ffffff"),
      transparent: true,
      opacity: 0.001,
      toneMapped: false,
    }),
  );
  floor.rotation.x = -Math.PI * 0.5;
  floor.position.y = -5.6;
  scene.add(floor);

  return {
    backdrop,
    floor,
  };
}

function createCoreSurfaceTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 3072;
  canvas.height = 2048;
  const context = canvas.getContext("2d");
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.anisotropy = 8;

  context.fillStyle = "#f92d04";
  context.fillRect(0, 0, canvas.width, canvas.height);

  const cellWidth = canvas.width / 3;
  const cellHeight = canvas.height / 2;
  const markCellX = 0;
  const markCellY = cellHeight;

  context.fillStyle = "#dbdbda";
  context.font = "500 50px 'OONeureal-SemiMono', 'neueral', monospace";
  context.textAlign = "right";
  context.textBaseline = "bottom";
  context.fillText("V 1.1", markCellX + cellWidth - 72, markCellY + cellHeight - 72);
  texture.needsUpdate = true;

  return texture;
}

function applyCoreFaceAtlasUvs(geometry) {
  const position = geometry.attributes.position;
  const sourceUv = geometry.attributes.uv;
  const uv = new Float32Array(position.count * 2);
  const faceCells = [
    { axis: 0, sign: 1, cell: 0 },
    { axis: 0, sign: -1, cell: 1 },
    { axis: 1, sign: 1, cell: 2 },
    { axis: 1, sign: -1, cell: 3 },
    { axis: 2, sign: 1, cell: 4 },
    { axis: 2, sign: -1, cell: 5 },
  ];

  for (let index = 0; index < position.count; index += 1) {
    const x = position.getX(index);
    const y = position.getY(index);
    const z = position.getZ(index);
    const absX = Math.abs(x);
    const absY = Math.abs(y);
    const absZ = Math.abs(z);
    const axis = absX >= absY && absX >= absZ ? 0 : absY >= absX && absY >= absZ ? 1 : 2;
    const sign = (axis === 0 ? x : axis === 1 ? y : z) >= 0 ? 1 : -1;
    const face = faceCells.find((item) => item.axis === axis && item.sign === sign) ?? faceCells[0];
    const col = face.cell % 3;
    const row = Math.floor(face.cell / 3);
    const u = sourceUv?.getX(index) ?? 0.5;
    const v = sourceUv?.getY(index) ?? 0.5;

    uv[index * 2] = (col + THREE.MathUtils.clamp(u, 0.002, 0.998)) / 3;
    uv[index * 2 + 1] = (row + THREE.MathUtils.clamp(v, 0.002, 0.998)) / 2;
  }

  geometry.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
}

export function createBlobMeshes({ world }) {
  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color("#ffffff"),
    roughness: Math.min(SCENE_CONFIG.roughness * 0.18 + SCENE_CONFIG.envBlur * 0.08, 1),
    metalness: 0,
    transmission: SCENE_CONFIG.transmission,
    thickness: Math.max(SCENE_CONFIG.thickness * 0.12, 0.25),
    ior: 1.0 + (SCENE_CONFIG.ior - 1.0) * 0.08,
    reflectivity: SCENE_CONFIG.reflectivity,
    attenuationColor: new THREE.Color("#ffffff"),
    attenuationDistance: Math.max(SCENE_CONFIG.attenuationDistance * 20, 40),
    clearcoat: SCENE_CONFIG.clearcoat,
    clearcoatRoughness: SCENE_CONFIG.envBlur * 0.04,
    specularIntensity: 1,
    specularColor: new THREE.Color("#ffffff"),
    transparent: true,
    opacity: 1,
  });

  const coreSurfaceTexture = createCoreSurfaceTexture();
  const innerMaterial = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color("#f92d04"),
    map: null,
    roughness: 0.12 + SCENE_CONFIG.envBlur * 0.05,
    metalness: 0,
    transmission: 0,
    thickness: 0,
    ior: 1,
    reflectivity: 0.18,
    attenuationColor: new THREE.Color("#f92d04"),
    attenuationDistance: 0.1,
    clearcoat: 0.04,
    emissive: new THREE.Color("#f92d04"),
    emissiveIntensity: 1.08,
  });

  const coatMaterial = new THREE.MeshPhysicalMaterial({
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
    opacity: 0,
    depthWrite: false,
  });

  const blobBaseGeometry = new THREE.BoxGeometry(2.9, 2.9, 2.9, 72, 72, 72);
  const blobGeometry = blobBaseGeometry.clone();
  const innerGeometry = blobBaseGeometry.clone();
  const coatGeometry = blobBaseGeometry.clone();
  applyCoreFaceAtlasUvs(innerGeometry);

  const shellMesh = new THREE.Mesh(blobGeometry, glassMaterial);
  const innerMesh = new THREE.Mesh(innerGeometry, innerMaterial);
  const coatMesh = new THREE.Mesh(coatGeometry, coatMaterial);
  innerMesh.renderOrder = 1;
  shellMesh.renderOrder = 2;
  coatMesh.renderOrder = 3;

  world.add(shellMesh);
  world.add(innerMesh);
  world.add(coatMesh);

  return {
    blobBaseGeometry,
    blobGeometry,
    innerGeometry,
    coatGeometry,
    glassMaterial,
    innerMaterial,
    coreSurfaceTexture,
    coatMaterial,
    coreSurfaceTexture,
    shellMesh,
    innerMesh,
    coatMesh,
  };
}
