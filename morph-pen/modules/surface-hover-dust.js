import * as THREE from "/morph-pen/vendor/three/build/three.webgpu.js";

const DUST_COLOR = "#ffffff";
const DUST_OPACITY = 0.28;
const DUST_SECONDARY_OPACITY = 0.16;
const DUST_TEXTURE_SIZE = 256;
const DUST_NOISE_FRAMES = 6;
const DUST_NOISE_SPEED = 12;
const MASK_TEXTURE_SIZE = 96;
const MASK_UPDATE_INTERVAL_MS = 24;
const HOVER_RADIUS = 0.54;
const REVEAL_EASE_IN = 0.1;
const REVEAL_EASE_OUT = 0.2;
const CENTER_EASE = 0.14;
const SCROLL_HIDE_PROGRESS = 0.006;

function supportsHoverDust() {
  return window.matchMedia?.("(hover: hover) and (pointer: fine)")?.matches ?? false;
}

function hash(x, y, seed) {
  const n = Math.sin(x * 12.9898 + y * 78.233 + seed * 37.719) * 43758.5453123;
  return n - Math.floor(n);
}

function smoothNoise(x, y, seed = 0) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const a = hash(ix, iy, seed);
  const b = hash(ix + 1, iy, seed);
  const c = hash(ix, iy + 1, seed);
  const d = hash(ix + 1, iy + 1, seed);
  return (a * (1 - ux) + b * ux) * (1 - uy) + (c * (1 - ux) + d * ux) * uy;
}

function fbm(x, y, seed = 0) {
  let value = 0;
  let amp = 0.5;
  let freq = 1;

  for (let i = 0; i < 2; i += 1) {
    value += smoothNoise(x * freq, y * freq, seed + i * 7.13) * amp;
    freq *= 1.82;
    amp *= 0.5;
  }

  return value;
}

function dfbm(x, y, time, warp) {
  const pulseA = Math.sin(time * 1.45);
  const pulseB = Math.cos(time * 1.12);
  const pulseC = Math.sin(time * 0.86 + 1.7);
  const pulseD = Math.cos(time * 1.72 + 0.4);
  const qx = fbm(x + pulseA * 0.34 + pulseD * 0.12, y + pulseB * 0.28, 0);
  const qy = fbm(x + 5.2 + pulseC * 0.3, y + 1.3 - pulseA * 0.26 + pulseD * 0.1, 9);
  const rx = fbm(x + warp * qx + 1.7 + pulseB * 0.5, y + warp * qy + 9.2 + pulseC * 0.44, 18);
  const ry = fbm(x + warp * qx + 8.3 - pulseC * 0.44, y + warp * qy + 2.8 + pulseA * 0.5, 27);
  const base = fbm(x + warp * rx + pulseA * 0.42, y + warp * ry + pulseB * 0.42, 36);
  const boil = fbm(x * 1.42 + pulseC * 0.38, y * 1.42 + pulseD * 0.34, 72);
  return THREE.MathUtils.clamp(base * 0.72 + boil * 0.28, 0, 1);
}

function createTexture({ width, height, nearest = false }) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = nearest ? THREE.NearestFilter : THREE.LinearFilter;
  texture.minFilter = nearest ? THREE.NearestFilter : THREE.LinearFilter;
  texture.generateMipmaps = false;

  return { canvas, context, texture };
}

function createWobbleField(width, height) {
  const wobbleField = new Float32Array(width * height);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = y * width + x;
      wobbleField[index] = fbm((x / width) * 8, (y / height) * 8, 101) - 0.5;
    }
  }

  return wobbleField;
}

function createDustFrames({ context, width, height, seed, coarseThreshold, pinThreshold, fleckThreshold }) {
  return Array.from({ length: DUST_NOISE_FRAMES }, (_, frame) => {
    const image = context.createImageData(width, height);
    const { data } = image;
    const frameSeed = seed + frame * 141.7;

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const i = (y * width + x) * 4;
        const grain = hash(x, y, frameSeed);
        const pin = hash(x * 3.7 + 13, y * 3.7 - 6, frameSeed + 32);
        const fleck = hash(x * 0.63 - 9, y * 0.63 + 21, frameSeed + 69);
        const alpha =
          grain > coarseThreshold
            ? 0.58
            : pin > pinThreshold
              ? 0.95
              : fleck > fleckThreshold
                ? 0.42
                : 0;

        data[i] = 255;
        data[i + 1] = 255;
        data[i + 2] = 255;
        data[i + 3] = alpha * 255;
      }
    }

    return image;
  });
}

function drawDustFrame({ context, texture, frames, frameIndex }) {
  context.putImageData(frames[frameIndex % frames.length], 0, 0);
  texture.needsUpdate = true;
}

export function createSurfaceHoverDust({ camera, pointerInput, shellMesh }) {
  if (!supportsHoverDust()) {
    return { dispose() {}, update() {} };
  }

  const raycaster = new THREE.Raycaster();
  const mask = createTexture({
    width: MASK_TEXTURE_SIZE,
    height: MASK_TEXTURE_SIZE,
  });
  const dustA = createTexture({
    width: DUST_TEXTURE_SIZE,
    height: DUST_TEXTURE_SIZE,
    nearest: true,
  });
  const dustB = createTexture({
    width: DUST_TEXTURE_SIZE,
    height: DUST_TEXTURE_SIZE,
    nearest: true,
  });
  const maskImage = mask.context.createImageData(mask.canvas.width, mask.canvas.height);
  const wobbleField = createWobbleField(mask.canvas.width, mask.canvas.height);
  const hover = {
    radius: 0,
    targetRadius: 0,
    center: new THREE.Vector2(0.5, 0.5),
    targetCenter: new THREE.Vector2(0.5, 0.5),
  };
  const parent = shellMesh.parent;
  let lastMaskUpdate = -Infinity;
  let lastDustUpdate = -Infinity;
  let dustFrameIndex = 0;

  const dustFramesA = createDustFrames({
    context: dustA.context,
    width: dustA.canvas.width,
    height: dustA.canvas.height,
    seed: 12,
    coarseThreshold: 0.7,
    pinThreshold: 0.82,
    fleckThreshold: 0.9,
  });
  const dustFramesB = createDustFrames({
    context: dustB.context,
    width: dustB.canvas.width,
    height: dustB.canvas.height,
    seed: 112,
    coarseThreshold: 0.78,
    pinThreshold: 0.86,
    fleckThreshold: 0.92,
  });
  drawDustFrame({
    context: dustA.context,
    texture: dustA.texture,
    frames: dustFramesA,
    frameIndex: 0,
  });
  drawDustFrame({
    context: dustB.context,
    texture: dustB.texture,
    frames: dustFramesB,
    frameIndex: 0,
  });
  dustA.texture.repeat.set(1.9, 1.9);
  dustB.texture.repeat.set(2.35, 2.35);

  const materialA = new THREE.MeshBasicMaterial({
    map: dustA.texture,
    alphaMap: mask.texture,
    color: new THREE.Color(DUST_COLOR),
    transparent: true,
    opacity: DUST_OPACITY,
    depthWrite: false,
    depthTest: false,
    toneMapped: false,
    side: THREE.FrontSide,
  });
  const materialB = new THREE.MeshBasicMaterial({
    map: dustB.texture,
    alphaMap: mask.texture,
    color: new THREE.Color(DUST_COLOR),
    transparent: true,
    opacity: DUST_SECONDARY_OPACITY,
    depthWrite: false,
    depthTest: false,
    toneMapped: false,
    side: THREE.FrontSide,
  });
  const dustMeshA = new THREE.Mesh(shellMesh.geometry, materialA);
  const dustMeshB = new THREE.Mesh(shellMesh.geometry, materialB);

  dustMeshA.scale.setScalar(1);
  dustMeshB.scale.setScalar(1.006);
  dustMeshA.renderOrder = 8;
  dustMeshB.renderOrder = 9;
  dustMeshA.visible = false;
  dustMeshB.visible = false;
  parent.add(dustMeshA, dustMeshB);

  const drawMask = (time) => {
    const { width, height } = mask.canvas;
    const { data } = maskImage;
    const scale = 1.82 / Math.max(0.2, 3.2 * 0.24);
    const warp = 1.68 + 0.11 * 1.6;

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const i = (y * width + x) * 4;
        const fieldIndex = y * width + x;
        const uvx = (x / width) * scale;
        const uvy = (y / height) * scale;
        const camo = dfbm(uvx, uvy, time, warp);
        const pulseA = Math.sin(time * 1.18);
        const pulseB = Math.cos(time * 0.93);
        const pulseC = Math.sin(time * 1.47 + 1.2);
        const veining = fbm(uvx * 0.66 + 2 + pulseA * 0.22, uvy * 0.66 - 3 + pulseB * 0.2, 48);
        const cleanBreak = fbm(uvx * 0.98 + pulseB * 0.2, uvy * 0.98 - pulseC * 0.18, 65);
        const band = camo * 0.72 + veining * 0.28;
        const roundedMask = THREE.MathUtils.smoothstep(band, 0.24, 0.5);
        const breakupCut = THREE.MathUtils.smoothstep(cleanBreak, 0.16, 0.32);
        const edge = THREE.MathUtils.smoothstep(roundedMask * breakupCut, 0.22, 0.34);
        const px = x / width;
        const py = y / height;
        const wobble = wobbleField[fieldIndex];
        const distance = Math.hypot(px - hover.center.x, py - hover.center.y) + wobble * 0.045 * hover.radius;
        const reveal = 1 - THREE.MathUtils.smoothstep(distance, hover.radius * 0.78, hover.radius);
        const alpha = Math.pow(edge, 0.9) * Math.max(0, reveal);

        data[i] = alpha * 255;
        data[i + 1] = alpha * 255;
        data[i + 2] = alpha * 255;
        data[i + 3] = 255;
      }
    }

    mask.context.putImageData(maskImage, 0, 0);
    mask.texture.needsUpdate = true;
  };

  const updateHoverTarget = () => {
    raycaster.setFromCamera(pointerInput.pointer, camera);
    const [hit] = raycaster.intersectObject(shellMesh, false);

    if (!hit?.uv) {
      hover.targetRadius = 0;
      return false;
    }

    hover.targetCenter.set(hit.uv.x, 1 - hit.uv.y);
    hover.targetRadius = HOVER_RADIUS;
    return true;
  };

  const update = ({ scrollProgress = 0, elapsed = 0 }) => {
    const disabled = scrollProgress > SCROLL_HIDE_PROGRESS || !pointerInput.isPointerInside();
    let hasHit = false;

    if (disabled) {
      hover.targetRadius = 0;
    } else {
      hasHit = updateHoverTarget();

      if (hasHit && hover.radius <= 0.001) {
        hover.center.copy(hover.targetCenter);
      }
    }

    hover.radius +=
      (hover.targetRadius - hover.radius) *
      (hover.targetRadius <= 0.001 ? REVEAL_EASE_OUT : REVEAL_EASE_IN);
    hover.center.lerp(hover.targetCenter, CENTER_EASE);

    const visible = hover.radius > 0.004;
    dustMeshA.visible = visible;
    dustMeshB.visible = visible;

    if (!visible) {
      return;
    }

    const now = performance.now();
    if (now - lastMaskUpdate > MASK_UPDATE_INTERVAL_MS) {
      lastMaskUpdate = now;
      drawMask(elapsed * 1.7);
    }

    if (now - lastDustUpdate > 1000 / DUST_NOISE_SPEED) {
      lastDustUpdate = now;
      dustFrameIndex += 1;
      drawDustFrame({
        context: dustA.context,
        texture: dustA.texture,
        frames: dustFramesA,
        frameIndex: dustFrameIndex,
      });
      drawDustFrame({
        context: dustB.context,
        texture: dustB.texture,
        frames: dustFramesB,
        frameIndex: dustFrameIndex + 2,
      });
    }
  };

  const dispose = () => {
    parent.remove(dustMeshA, dustMeshB);
    materialA.dispose();
    materialB.dispose();
    mask.texture.dispose();
    dustA.texture.dispose();
    dustB.texture.dispose();
  };

  return { dispose, update };
}
