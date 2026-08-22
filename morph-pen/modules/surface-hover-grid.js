import * as THREE from "/morph-pen/vendor/three/build/three.webgpu.js";

const GRID_COLOR = "#dbdbda";
const LABEL_COLOR = "#ffffff";
const GRID_OPACITY = 0.28;
const LABEL_OPACITY = 0.92;
const LABEL_COUNT = 4;
const FINAL_CUBE_RADIUS = 1.64 * 0.9;
const SPLIT_GRID_SIZE = 6;
const NET_CELL_SIZE = (FINAL_CUBE_RADIUS * 2) / SPLIT_GRID_SIZE;
const EDGE_SUBDIVISIONS = 9;
const CURSOR_REVEAL_RADIUS = NET_CELL_SIZE * 1.55;
const PULSE_DURATION_MS = 2800;
const PULSE_INTERVAL_MS = 2200;
const PULSE_MAX_RADIUS = FINAL_CUBE_RADIUS * 2.75;
const PULSE_RING_WIDTH = NET_CELL_SIZE * 0.92;
const MAX_LINE_SEGMENTS = 3600;
const SURFACE_LINE_OFFSET = 0.016;
const SURFACE_LABEL_OFFSET = 0.035;
const LABEL_WIDTH = 0.52;
const LABEL_HEIGHT = 0.2;
const LABEL_SPREAD_X = 1.18;
const LABEL_SPREAD_Y = 0.84;
const LABEL_POSITION_EASE = 0.58;
const VALUE_EASE = 0.11;
const FADE_EASE = 0.12;
const LABEL_FADE_OUT_EASE = 0.28;
const FADE_VISIBLE_THRESHOLD = 0.01;
const LABEL_SCROLL_HIDE_PROGRESS = 0.006;

function supportsHoverGrid() {
  return window.matchMedia?.("(hover: hover) and (pointer: fine)")?.matches ?? false;
}

function easeInOutSine(value) {
  return -(Math.cos(Math.PI * value) - 1) / 2;
}

function easeOutCubic(value) {
  return 1 - Math.pow(1 - value, 3);
}

function createLineGeometry() {
  const positions = new Float32Array(MAX_LINE_SEGMENTS * 2 * 3);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setDrawRange(0, 0);
  return geometry;
}

function createBaseDirections(geometry) {
  const position = geometry.attributes.position;
  const directions = [];
  const vector = new THREE.Vector3();

  for (let index = 0; index < position.count; index += 1) {
    vector.fromBufferAttribute(position, index).normalize();
    directions.push(vector.clone());
  }

  return directions;
}

function createLabelTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 192;
  canvas.height = 72;
  const context = canvas.getContext("2d");
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  return { canvas, context, texture };
}

function paintLabel(label, value) {
  const { canvas, context, texture } = label;
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = LABEL_COLOR;
  context.font = "400 1.3rem 'OONeureal-SemiMono', 'neueral', monospace";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(value, canvas.width * 0.5, canvas.height * 0.52);
  texture.needsUpdate = true;
}

function getFacePoint({ axis, sign, uAxis, vAxis, u, v }) {
  const point = [0, 0, 0];
  point[axis] = sign * FINAL_CUBE_RADIUS;
  point[uAxis] = u;
  point[vAxis] = v;
  return new THREE.Vector3(point[0], point[1], point[2]);
}

function findNearestDirectionIndex(target, baseDirections) {
  const direction = target.clone().normalize();
  let bestIndex = 0;
  let bestDot = -Infinity;

  for (let index = 0; index < baseDirections.length; index += 1) {
    const dot = direction.dot(baseDirections[index]);
    if (dot > bestDot) {
      bestDot = dot;
      bestIndex = index;
    }
  }

  return bestIndex;
}

function createSurfaceGridCells(geometry) {
  const baseDirections = createBaseDirections(geometry);
  const cellCoordinates = Array.from(
    { length: SPLIT_GRID_SIZE + 1 },
    (_, index) => -FINAL_CUBE_RADIUS + index * NET_CELL_SIZE,
  );
  const faces = [
    { axis: 0, sign: 1, uAxis: 1, vAxis: 2 },
    { axis: 0, sign: -1, uAxis: 1, vAxis: 2 },
    { axis: 1, sign: 1, uAxis: 0, vAxis: 2 },
    { axis: 1, sign: -1, uAxis: 0, vAxis: 2 },
    { axis: 2, sign: 1, uAxis: 0, vAxis: 1 },
    { axis: 2, sign: -1, uAxis: 0, vAxis: 1 },
  ];
  const nearestCache = new Map();

  const nearestForPoint = (point) => {
    const key = `${point.x.toFixed(4)}:${point.y.toFixed(4)}:${point.z.toFixed(4)}`;
    if (!nearestCache.has(key)) {
      nearestCache.set(key, findNearestDirectionIndex(point, baseDirections));
    }
    return nearestCache.get(key);
  };

  const buildEdge = (face, from, to, segments) => {
    for (let step = 0; step < EDGE_SUBDIVISIONS; step += 1) {
      const startT = step / EDGE_SUBDIVISIONS;
      const endT = (step + 1) / EDGE_SUBDIVISIONS;
      const start = getFacePoint({
        ...face,
        u: THREE.MathUtils.lerp(from.u, to.u, startT),
        v: THREE.MathUtils.lerp(from.v, to.v, startT),
      });
      const end = getFacePoint({
        ...face,
        u: THREE.MathUtils.lerp(from.u, to.u, endT),
        v: THREE.MathUtils.lerp(from.v, to.v, endT),
      });
      segments.push([nearestForPoint(start), nearestForPoint(end)]);
    }
  };

  return faces.flatMap((face) => {
    const cells = [];

    for (let y = 0; y < SPLIT_GRID_SIZE; y += 1) {
      for (let x = 0; x < SPLIT_GRID_SIZE; x += 1) {
        const left = cellCoordinates[x];
        const right = cellCoordinates[x + 1];
        const bottom = cellCoordinates[y];
        const top = cellCoordinates[y + 1];
        const center = getFacePoint({
          ...face,
          u: (left + right) * 0.5,
          v: (bottom + top) * 0.5,
        });
        const segments = [];

        buildEdge(face, { u: left, v: bottom }, { u: right, v: bottom }, segments);
        buildEdge(face, { u: right, v: bottom }, { u: right, v: top }, segments);
        buildEdge(face, { u: right, v: top }, { u: left, v: top }, segments);
        buildEdge(face, { u: left, v: top }, { u: left, v: bottom }, segments);

        cells.push({
          centerIndex: nearestForPoint(center),
          segments,
        });
      }
    }

    return cells;
  });
}

export function createSurfaceHoverGrid({ scene, camera, pointerInput, shellMesh }) {
  if (!supportsHoverGrid()) {
    return { dispose() {}, update() {} };
  }

  const raycaster = new THREE.Raycaster();
  const surfaceCells = createSurfaceGridCells(shellMesh.geometry);
  const lineGeometry = createLineGeometry();
  const linePositions = lineGeometry.attributes.position.array;
  const lineMaterial = new THREE.LineBasicMaterial({
    color: new THREE.Color(GRID_COLOR),
    transparent: true,
    opacity: GRID_OPACITY,
    depthTest: true,
    depthWrite: false,
  });
  const lineMesh = new THREE.LineSegments(lineGeometry, lineMaterial);
  const labels = Array.from({ length: LABEL_COUNT }, () => {
    const label = createLabelTexture();
    const material = new THREE.MeshBasicMaterial({
      map: label.texture,
      color: new THREE.Color(LABEL_COLOR),
      transparent: true,
      opacity: LABEL_OPACITY,
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(LABEL_WIDTH, LABEL_HEIGHT), material);
    mesh.visible = false;
    mesh.renderOrder = 21;
    scene.add(mesh);
    return { ...label, material, mesh };
  });
  const positionAttribute = shellMesh.geometry.attributes.position;
  const localHit = new THREE.Vector3();
  const localA = new THREE.Vector3();
  const localB = new THREE.Vector3();
  const localCenter = new THREE.Vector3();
  const labelWorld = new THREE.Vector3();
  const labelCameraRight = new THREE.Vector3();
  const labelCameraUp = new THREE.Vector3();
  const labelWorldNormal = new THREE.Vector3();
  const labelTargetWorld = new THREE.Vector3();
  const labelAnchorWorld = new THREE.Vector3();
  const normalMatrix = new THREE.Matrix3();
  let lastPulseAt = -Infinity;
  let lastValueFrame = -999;
  let pulseOrigin = new THREE.Vector3();
  let visualOpacity = 0;
  let labelVisualOpacity = 0;
  let targetVisualOpacity = 0;
  let targetLabelVisualOpacity = 0;
  let hasLabelAnchor = false;
  const displayedValues = {
    morph: 0,
    push: 0,
    limb: 0,
    wave: 0,
  };

  lineMesh.visible = false;
  lineMesh.renderOrder = 20;
  shellMesh.add(lineMesh);

  const writePoint = (target, vertexIndex, offsetIndex) => {
    target.fromBufferAttribute(positionAttribute, vertexIndex);
    target.addScaledVector(target.clone().normalize(), SURFACE_LINE_OFFSET);
    linePositions[offsetIndex] = target.x;
    linePositions[offsetIndex + 1] = target.y;
    linePositions[offsetIndex + 2] = target.z;
  };

  const appendSegment = (fromIndex, toIndex, lineCount) => {
    if (lineCount >= MAX_LINE_SEGMENTS) {
      return lineCount;
    }

    const offset = lineCount * 6;
    writePoint(localA, fromIndex, offset);
    writePoint(localB, toIndex, offset + 3);
    return lineCount + 1;
  };

  const shouldRevealCell = ({ cell, now }) => {
    localCenter.fromBufferAttribute(positionAttribute, cell.centerIndex);
    const cursorDistance = localCenter.distanceTo(localHit);

    if (cursorDistance <= CURSOR_REVEAL_RADIUS) {
      return true;
    }

    const pulseAge = now - lastPulseAt;
    if (pulseAge < 0 || pulseAge > PULSE_DURATION_MS) {
      return false;
    }

    const pulseProgress = pulseAge / PULSE_DURATION_MS;
    const pulseRadius = THREE.MathUtils.lerp(
      CURSOR_REVEAL_RADIUS,
      PULSE_MAX_RADIUS,
      easeInOutSine(easeOutCubic(pulseProgress)),
    );
    const pulseDistance = localCenter.distanceTo(pulseOrigin);
    const ringFalloff = PULSE_RING_WIDTH * THREE.MathUtils.lerp(1.15, 1.85, pulseProgress);
    return Math.abs(pulseDistance - pulseRadius) <= ringFalloff;
  };

  const rebuildSurfaceLines = ({ hit, now }) => {
    const seenSegments = new Set();
    let lineCount = 0;

    localHit.copy(hit.point);
    shellMesh.worldToLocal(localHit);

    if (now - lastPulseAt > PULSE_INTERVAL_MS) {
      lastPulseAt = now;
      pulseOrigin.copy(localHit);
    }

    for (const cell of surfaceCells) {
      if (!shouldRevealCell({ cell, now })) {
        continue;
      }

      for (const [fromIndex, toIndex] of cell.segments) {
        const key =
          fromIndex < toIndex
            ? `${fromIndex}-${toIndex}`
            : `${toIndex}-${fromIndex}`;

        if (seenSegments.has(key)) {
          continue;
        }

        seenSegments.add(key);
        lineCount = appendSegment(fromIndex, toIndex, lineCount);
        if (lineCount >= MAX_LINE_SEGMENTS) break;
      }

      if (lineCount >= MAX_LINE_SEGMENTS) break;
    }

    lineGeometry.setDrawRange(0, lineCount * 2);
    lineGeometry.attributes.position.needsUpdate = true;
    lineMesh.visible = lineCount > 0 || visualOpacity > FADE_VISIBLE_THRESHOLD;
  };

  const updateValues = ({ morphProgress, musicReactiveState, musicReactive, frame }) => {
    const active = musicReactiveState.isPlaying || musicReactiveState.isActive;

    if (frame - lastValueFrame < (active ? 2 : 6)) {
      return;
    }

    lastValueFrame = frame;
    const idleSurface = THREE.MathUtils.clamp(
      localHit.length() / (FINAL_CUBE_RADIUS * 1.18),
      0,
      1,
    );
    const idleFace = THREE.MathUtils.clamp(
      (Math.abs(localHit.x) + Math.abs(localHit.y) + Math.abs(localHit.z)) /
        (FINAL_CUBE_RADIUS * 2.05),
      0,
      1,
    );
    const idleScan = THREE.MathUtils.clamp(
      morphProgress * 0.76 + ((Math.sin(frame * 0.045) + 1) * 0.12),
      0,
      1,
    );
    const surfaceMorph = THREE.MathUtils.clamp(
      idleScan * 0.46 + idleSurface * 0.34 + idleFace * 0.2,
      0,
      1,
    );
    const targetMorph = Math.max(morphProgress, surfaceMorph * (1 - morphProgress * 0.65));
    const targetWave = active
      ? (musicReactive?.impact ?? 0) * 0.62 +
        (musicReactive?.limbImpact ?? 0) * 0.34 +
        ((Math.sin(frame * 0.21) + 1) * 0.02)
      : idleScan;
    const targets = {
      morph: targetMorph,
      push: active ? (musicReactive?.impact ?? 0) : idleSurface,
      limb: active ? (musicReactive?.limbImpact ?? 0) : idleFace,
      wave: Math.min(targetWave, 1),
    };

    Object.keys(displayedValues).forEach((key) => {
      displayedValues[key] = THREE.MathUtils.lerp(
        displayedValues[key],
        targets[key],
        VALUE_EASE,
      );
    });

    const values = [
      `MORPH ${displayedValues.morph.toFixed(2)}`,
      `PUSH ${displayedValues.push.toFixed(2)}`,
      `LIMB ${displayedValues.limb.toFixed(2)}`,
      active ? `WAVE ${displayedValues.wave.toFixed(2)}` : `AUD ${displayedValues.wave.toFixed(2)}`,
    ];

    labels.forEach((label, index) => {
      paintLabel(label, values[index]);
    });
  };

  const fadeVisuals = () => {
    visualOpacity += (targetVisualOpacity - visualOpacity) * FADE_EASE;
    labelVisualOpacity +=
      (targetLabelVisualOpacity - labelVisualOpacity) *
      (targetLabelVisualOpacity === 0 ? LABEL_FADE_OUT_EASE : FADE_EASE);

    if (
      visualOpacity < FADE_VISIBLE_THRESHOLD &&
      labelVisualOpacity < FADE_VISIBLE_THRESHOLD &&
      targetVisualOpacity === 0 &&
      targetLabelVisualOpacity === 0
    ) {
      visualOpacity = 0;
      labelVisualOpacity = 0;
      hasLabelAnchor = false;
      lineMesh.visible = false;
      labels.forEach(({ mesh }) => {
        mesh.visible = false;
      });
    }

    lineMaterial.opacity = GRID_OPACITY * visualOpacity;
    labels.forEach(({ material }) => {
      material.opacity = LABEL_OPACITY * labelVisualOpacity;
    });
  };

  const updateLabels = (hit) => {
    normalMatrix.getNormalMatrix(shellMesh.matrixWorld);
    labelWorldNormal.copy(hit.face.normal).applyMatrix3(normalMatrix).normalize();
    labelCameraRight.setFromMatrixColumn(camera.matrixWorld, 0).normalize();
    labelCameraUp.setFromMatrixColumn(camera.matrixWorld, 1).normalize();
    labelTargetWorld.copy(hit.point).addScaledVector(labelWorldNormal, SURFACE_LABEL_OFFSET);

    if (!hasLabelAnchor) {
      labelAnchorWorld.copy(labelTargetWorld);
      hasLabelAnchor = true;
    } else {
      labelAnchorWorld.lerp(labelTargetWorld, LABEL_POSITION_EASE);
    }

    labels.forEach(({ mesh }, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      labelWorld
        .copy(labelAnchorWorld)
        .addScaledVector(labelCameraRight, (-0.5 + col) * LABEL_SPREAD_X * NET_CELL_SIZE)
        .addScaledVector(labelCameraUp, (0.5 - row) * LABEL_SPREAD_Y * NET_CELL_SIZE);
      mesh.position.copy(labelWorld);
      mesh.quaternion.copy(camera.quaternion);
      mesh.visible = labelVisualOpacity > FADE_VISIBLE_THRESHOLD;
    });
  };

  const update = ({ scrollProgress = 0, morphProgress, musicReactiveState, musicReactive, frame }) => {
    if (scrollProgress > LABEL_SCROLL_HIDE_PROGRESS || !pointerInput.isPointerInside()) {
      targetVisualOpacity = 0;
      targetLabelVisualOpacity = 0;
      fadeVisuals();
      return;
    }

    const now = performance.now();
    scene.updateMatrixWorld(true);
    raycaster.setFromCamera(pointerInput.pointer, camera);
    const [hit] = raycaster.intersectObject(shellMesh, false);

    if (!hit?.face) {
      targetVisualOpacity = 0;
      targetLabelVisualOpacity = 0;
      fadeVisuals();
      return;
    }

    targetVisualOpacity = 1;
    targetLabelVisualOpacity = scrollProgress > LABEL_SCROLL_HIDE_PROGRESS ? 0 : 1;
    lineMesh.visible = true;
    labels.forEach(({ mesh }) => {
      mesh.visible = true;
    });
    rebuildSurfaceLines({ hit, now });
    updateValues({ morphProgress, musicReactiveState, musicReactive, frame });
    updateLabels(hit);
    fadeVisuals();
  };

  const dispose = () => {
    shellMesh.remove(lineMesh);
    lineGeometry.dispose();
    lineMaterial.dispose();
    labels.forEach(({ mesh, material, texture }) => {
      scene.remove(mesh);
      mesh.geometry.dispose();
      material.dispose();
      texture.dispose();
    });
  };

  return { dispose, update };
}
