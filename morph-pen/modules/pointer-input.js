import * as THREE from "/morph-pen/vendor/three/build/three.webgpu.js";

export function createPointerInput({ canvas }) {
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
  let pointerInside = false;

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
    pointerInside = x >= 0 && x <= 1 && y >= 0 && y <= 1;
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
    const width = Math.max(canvasWidth, 1);
    const height = Math.max(canvasHeight, 1);
    dragRotationTarget.x += (dx / width) * Math.PI * 1.2;
    dragRotationTarget.y += (dy / height) * Math.PI * 1.2;
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

  const resetPointer = () => {
    pointerInside = false;
    pointerTarget.set(0, 0);
  };

  return {
    dragRotation,
    dragRotationTarget,
    endDrag,
    onPointerDown,
    onPointerMove,
    pointer,
    pointerTarget,
    resetPointer,
    isPointerInside() {
      return pointerInside;
    },
    updateBounds,
  };
}
